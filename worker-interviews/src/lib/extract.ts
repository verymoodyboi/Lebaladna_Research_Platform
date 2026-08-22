// NOTE: OpenAI's strict:true json_schema mode requires EVERY property to be
// listed in "required" — optional fields are expressed as nullable types
// (["string","null"]) instead of being omitted. A field the model couldn't
// find in the transcript comes back as null, not missing.
const nullable = (type: string) => ({ type: [type, "null"] });

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
    training_suites: nullable("string"), // free text, e.g. sizes/ages mentioned
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
        {
          role: "system",
          content:
            "Extract beneficiary survey data from the interview transcript. " +
            "Only use information explicitly stated. Leave fields out if unknown.",
        },
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
  return JSON.parse(data.choices[0].message.content);
}
