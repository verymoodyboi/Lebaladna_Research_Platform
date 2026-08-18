import React, { useEffect, useRef, useState, type FormEvent } from "react";
import { Camera, X } from "lucide-react";

import { useAuth } from "../../../contexts/AuthContext";
import supabase from "../../../lib/supabaseClient";
import {
  checkUsernameAvailable,
  updateProfile,
  uploadPfp,
} from "../../auth/services/auth.services";
import type { HeaderUserInfo } from "../../../layouts/Layout";

const USERNAME_REGEX = /^[a-zA-Z][a-zA-Z0-9_]{2,19}$/;
const USERNAME_CHECK_DEBOUNCE_MS = 450;

type UsernameStatus = "idle" | "checking" | "available" | "taken" | "error";

interface FieldErrors {
  firstName?: string;
  lastName?: string;
  username?: string;
}

function validateUsernameFormat(value: string): string | undefined {
  const trimmed = value.trim();

  if (!trimmed) {
    return "Username is required.";
  }
  if (!USERNAME_REGEX.test(trimmed)) {
    return "3-20 characters, starting with a letter (letters, numbers, underscores only).";
  }
  return undefined;
}

interface EditProfileModalProps {
  open: boolean;
  onClose: () => void;
  userInfo?: HeaderUserInfo;
}

export default function EditProfileModal({
  open,
  onClose,
  userInfo,
}: EditProfileModalProps): React.ReactElement | null {
  // Assumes AuthContext exposes a refresh function to re-pull the
  // current user's row after a successful update. Adjust the name if
  // your context calls it something else.
  const { refreshUserInfo } = useAuth() as {
    refreshUserInfo?: () => Promise<void>;
  };

  const [firstName, setFirstName] = useState(userInfo?.first_name ?? "");
  const [lastName, setLastName] = useState(userInfo?.last_name ?? "");
  const [username, setUsername] = useState(userInfo?.username ?? "");
  const [pfpFile, setPfpFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    userInfo?.pfp_path ?? null,
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>("idle");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset the form whenever the modal is (re)opened with fresh userInfo.
  const [authId, setAuthId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    setFirstName(userInfo?.first_name ?? "");
    setLastName(userInfo?.last_name ?? "");
    setUsername(userInfo?.username ?? "");
    setPreviewUrl(
      userInfo?.pfp_path
        ? `https://lxxnumywddjyjnoqirxe.supabase.co/storage/v1/object/public/pfps/${userInfo.pfp_path}`
        : null,
    );
    setError("");
    setFieldErrors({});
    setUsernameStatus("idle");

    supabase.auth.getSession().then(({ data }) => {
      setAuthId(data.session?.user.id ?? null);
    });
  }, [open, userInfo]);

  // Live "is this username taken" check, debounced. Skipped entirely when
  // the username hasn't changed from the user's current one, since that's
  // trivially available to them.
  useEffect(() => {
    if (!open) return;

    const trimmed = username.trim();
    const original = (userInfo?.username ?? "").trim();

    if (trimmed.toLowerCase() === original.toLowerCase()) {
      setUsernameStatus("idle");
      return;
    }

    if (validateUsernameFormat(trimmed)) {
      setUsernameStatus("idle");
      return;
    }

    let cancelled = false;
    setUsernameStatus("checking");

    const timeoutId = window.setTimeout(async () => {
      try {
        const { available } = await checkUsernameAvailable(trimmed);

        if (cancelled) return;

        setUsernameStatus(available ? "available" : "taken");
      } catch (checkError) {
        if (!cancelled) {
          console.error("Username availability check failed:", checkError);
          setUsernameStatus("error");
        }
      }
    }, USERNAME_CHECK_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [username, userInfo?.username, open]);

  if (!open) return null;

  const clearFieldError = (field: keyof FieldErrors) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setPfpFile(file);
    setPreviewUrl(
      file ? URL.createObjectURL(file) : (userInfo?.pfp_path ?? null),
    );
  };

  const validate = (): FieldErrors => {
    const errors: FieldErrors = {};

    if (!firstName.trim()) {
      errors.firstName = "First name is required.";
    }
    if (!lastName.trim()) {
      errors.lastName = "Last name is required.";
    }

    const usernameFormatError = validateUsernameFormat(username);
    if (usernameFormatError) {
      errors.username = usernameFormatError;
    } else if (usernameStatus === "taken") {
      errors.username = "That username is already taken.";
    }

    return errors;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");

    const errors = validate();
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    if (usernameStatus === "checking") {
      setFieldErrors((prev) => ({
        ...prev,
        username:
          "Still checking username availability — try again in a moment.",
      }));
      return;
    }

    setLoading(true);

    try {
      let pfpPath: string | undefined;

      if (pfpFile && authId) {
        pfpPath = await uploadPfp(pfpFile, authId);
      }

      await updateProfile({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        username: username.trim(),
        pfp_path: pfpPath,
      });

      await refreshUserInfo?.();
      onClose();
    } catch (err) {
      console.error("Update profile error:", err);

      const message =
        err instanceof Error
          ? err.message
          : "Unable to update your profile. Please try again.";

      if (message.toLowerCase().includes("username is already taken")) {
        setFieldErrors((prev) => ({ ...prev, username: message }));
        setUsernameStatus("taken");
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const isSubmitDisabled = loading || usernameStatus === "checking";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        className="auth-card animate-riseIn relative w-full max-w-md rounded-3xl bg-white p-8 shadow-sm"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="focus-brand absolute right-5 top-5 rounded-full p-1 text-ink-soft transition-colors hover:bg-sage-50 hover:text-ink"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="font-display text-2xl font-semibold text-ink">
          Edit profile
        </h2>
        <p className="mt-1 text-sm text-ink-soft">Update your details below.</p>

        <div className="mt-6 flex flex-col gap-5">
          {error && (
            <div className="alert-error rounded-xl px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            noValidate
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="pfp-dropzone focus-brand flex h-20 w-20 items-center justify-center overflow-hidden rounded-full disabled:cursor-not-allowed disabled:opacity-60"
              >
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Profile preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Camera
                    className="h-6 w-6"
                    style={{ color: "var(--sage-700)" }}
                  />
                )}
              </button>
              <span className="text-xs text-ink-soft">Tap to change photo</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={loading}
                className="hidden"
              />
            </div>

            <div className="flex flex-col gap-4 sm:flex-row">
              <label
                className="flex w-full flex-col gap-1.5"
                htmlFor="edit-firstName"
              >
                <span className="text-sm font-medium text-ink">First name</span>
                <input
                  id="edit-firstName"
                  value={firstName}
                  onChange={(event) => {
                    setFirstName(event.target.value);
                    clearFieldError("firstName");
                  }}
                  aria-invalid={Boolean(fieldErrors.firstName)}
                  disabled={loading}
                  className={`input-brand focus-brand w-full rounded-xl px-3.5 py-2.5 text-sm text-ink disabled:cursor-not-allowed disabled:opacity-60 ${
                    fieldErrors.firstName ? "input-invalid" : ""
                  }`}
                />
                {fieldErrors.firstName && (
                  <span className="field-error">{fieldErrors.firstName}</span>
                )}
              </label>

              <label
                className="flex w-full flex-col gap-1.5"
                htmlFor="edit-lastName"
              >
                <span className="text-sm font-medium text-ink">Last name</span>
                <input
                  id="edit-lastName"
                  value={lastName}
                  onChange={(event) => {
                    setLastName(event.target.value);
                    clearFieldError("lastName");
                  }}
                  aria-invalid={Boolean(fieldErrors.lastName)}
                  disabled={loading}
                  className={`input-brand focus-brand w-full rounded-xl px-3.5 py-2.5 text-sm text-ink disabled:cursor-not-allowed disabled:opacity-60 ${
                    fieldErrors.lastName ? "input-invalid" : ""
                  }`}
                />
                {fieldErrors.lastName && (
                  <span className="field-error">{fieldErrors.lastName}</span>
                )}
              </label>
            </div>

            <label
              className="flex w-full flex-col gap-1.5"
              htmlFor="edit-username"
            >
              <span className="text-sm font-medium text-ink">Username</span>
              <input
                id="edit-username"
                value={username}
                onChange={(event) => {
                  setUsername(event.target.value);
                  clearFieldError("username");
                }}
                aria-invalid={Boolean(fieldErrors.username)}
                disabled={loading}
                className={`input-brand focus-brand w-full rounded-xl px-3.5 py-2.5 text-sm text-ink disabled:cursor-not-allowed disabled:opacity-60 ${
                  fieldErrors.username ? "input-invalid" : ""
                }`}
              />
              {fieldErrors.username ? (
                <span className="field-error">{fieldErrors.username}</span>
              ) : usernameStatus === "checking" ? (
                <span className="field-hint">Checking availability...</span>
              ) : usernameStatus === "available" ? (
                <span className="field-success">Username is available.</span>
              ) : usernameStatus === "taken" ? (
                <span className="field-error">
                  That username is already taken.
                </span>
              ) : null}
            </label>

            <div className="mt-1 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="btn-secondary focus-brand w-full rounded-xl py-3 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitDisabled}
                className="btn-primary focus-brand w-full rounded-xl py-3 text-sm font-semibold"
              >
                {loading ? "Saving..." : "Save changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
