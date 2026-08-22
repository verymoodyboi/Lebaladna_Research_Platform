// NOTE: OpenAI's strict:true json_schema mode requires EVERY property to be
// listed in "required" — optional fields are expressed as nullable types
// (["string","null"]) instead of being omitted. A field the model couldn't
// find in the transcript comes back as null, not missing.
const nullable = (type: string) => ({ type: [type, "null"] });

// Must exactly match the size labels used by TRAINING_SUITE_SIZES in
// surveys.util.ts on the frontend — if that list differs from this one
// (different sizes, casing, or separator), update this array to match.
const TRAINING_SUITE_SIZES = [
  "8M", "10M", "12M", "14M", "16M",
  "8F", "10F", "12F", "14F", "16F",
] as const;

const SURVEY_SCHEMA = {
  type: "object",
  properties: {
    subject_name: { type: "string" },
    subject_national_id: nullable("string"),
    area: nullable("string"), // free-text area name as mentioned in interview
    subject_family_members_number: nullable("integer"),
    subject_mobile_number: nullable("string"),
    food_packs_number: nullable("integer"),
    blankets_number: nullable("integer"),
    // Structured instead of free text: one entry per distinct size
    // mentioned, with its total count. Empty array if none mentioned.
    // This replaces the old `nullable("string")` free-text field.
    training_suites: {
      type: "array",
      description:
        "Every training suite size and quantity mentioned in the transcript. " +
        "One entry per distinct size — if a size is mentioned more than once, " +
        "sum the quantities into a single entry rather than duplicating it.",
      items: {
        type: "object",
        properties: {
          size: { type: "string", enum: TRAINING_SUITE_SIZES },
          count: { type: "integer" },
        },
        required: ["size", "count"],
        additionalProperties: false,
      },
    },
    bride: nullable("boolean"),
    health: nullable("boolean"),
    health_notes: nullable("string"),
    microfinance: nullable("boolean"),
    microfinance_notes: nullable("string"),
    additional_notes: nullable("string"),
  },
  required: [
    "subject_name",
    "subject_national_id",
    "area",
    "subject_family_members_number",
    "subject_mobile_number",
    "food_packs_number",
    "blankets_number",
    "training_suites",
    "bride",
    "health",
    "health_notes",
    "microfinance",
    "microfinance_notes",
    "additional_notes",
  ],
  additionalProperties: false,
};

const SYSTEM_PROMPT = `
Extract beneficiary survey data from the interview transcript. Only use
information explicitly stated. The transcript may mix Arabic and English,
digits and spoken-word numbers, in any order.

Before producing the final answer, individually check the transcript against
EVERY field below — do not decide a batch of fields are "unclear" and default
them all to null together. Each field's value (including null) must reflect
a specific check against the transcript's actual content for that field.

Boolean fields (bride, health, microfinance) — these are the fields most
likely to be under-filled, so apply this rule strictly:
- health must be true whenever health_notes will be non-null (any health
  issue, condition, request, or need is mentioned) — never output
  health_notes with content while health is null or false.
- microfinance must be true whenever microfinance_notes will be non-null,
  by the same rule.
- bride must be true if the transcript indicates marriage-related support is
  needed (e.g. an upcoming wedding, bridal needs), false if marriage support
  is explicitly discussed and not needed, and null only if marriage is never
  brought up anywhere in the transcript at all.
- Never leave a boolean null purely out of caution if the transcript contains
  any relevant statement — a mention, a request, or a need described in
  plain language (not just an explicit yes/no) is sufficient evidence.

Training suites (training_suites field):
- Valid sizes are exactly: ${TRAINING_SUITE_SIZES.join(", ")}. A size is a
  number (8, 10, 12, 14, or 16) followed by M (male) or F (female), with no
  space — e.g. "16M", "14F". Never output a size outside this list, and never
  invent a size that wasn't clearly one of these (if the transcript mentions
  an ambiguous or out-of-range size, ignore that mention rather than
  guessing the nearest valid one).
- Quantities may appear as digits ("3", "٣") or spoken words in either
  language ("three", "ثلاثة"), and may appear before or after the size
  ("three 14F", "14F three", "12M و ثلاثة 14F").
- A size mentioned with no explicit quantity means a count of 1 for that
  size (e.g. "and a 16M" → {"size":"16M","count":1}).
- If the same size is mentioned more than once anywhere in the transcript,
  sum every mention into a single entry for that size — never output the
  same size twice.
- If no training suites are mentioned at all, return an empty array, not null.

For every other field: leave it null only after specifically checking the
transcript for that field's topic and finding no mention. Do not guess or
invent values that aren't explicitly stated — but do not default to null
without having actually checked, either.
`.trim();

export async function extractSurveyData(env: Env, transcript: string) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: transcript },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "survey_extraction",
          schema: SURVEY_SCHEMA,
          strict: true,
        },
      },
    }),
  });

  if (!res.ok) {
    throw new Error(
      `GPT extraction failed (${res.status}): ${await res.text()}`,
    );
  }
  const data = await res.json<{
    choices: { message: { content: string } }[];
  }>();
  return JSON.parse(data.choices[0].message.content) as {
    training_suites: { size: string; count: number }[];
    [key: string]: unknown;
  };
}