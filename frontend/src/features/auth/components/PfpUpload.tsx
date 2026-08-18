import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Avatar, Box, Button, Stack, Typography } from "@mui/material";

interface PfpUploadProps {
  initialUrl?: string | null;
  onFileSelected: (file: File | null) => void;
  disabled?: boolean;
}

const MAX_FILE_SIZE_MB = 5;
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];

const PfpUpload = ({
  initialUrl = null,
  onFileSelected,
  disabled,
}: PfpUploadProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialUrl);
  const [error, setError] = useState("");

  // Revoke object URLs we created so we don't leak memory.
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setError("");

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Please choose a PNG, JPG, or WEBP image.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setError(`Image must be smaller than ${MAX_FILE_SIZE_MB}MB.`);
      event.target.value = "";
      return;
    }

    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl(URL.createObjectURL(file));
    onFileSelected(file);
  };

  const handleRemove = () => {
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl(null);
    onFileSelected(null);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <Stack spacing={1.5}>
      <Avatar
        src={previewUrl ?? undefined}
        sx={{ width: 96, height: 96, fontSize: 32 }}
      />

      <Stack direction="row" spacing={1.5}>
        <Button
          variant="outlined"
          size="small"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          sx={{ textTransform: "none" }}
        >
          {previewUrl ? "Change photo" : "Upload photo"}
        </Button>

        {previewUrl && (
          <Button
            variant="text"
            size="small"
            color="error"
            disabled={disabled}
            onClick={handleRemove}
            sx={{ textTransform: "none" }}
          >
            Remove
          </Button>
        )}
      </Stack>

      <Box
        component="input"
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        onChange={handleChange}
        sx={{ display: "none" }}
      />

      {error && (
        <Typography variant="caption" color="error">
          {error}
        </Typography>
      )}
    </Stack>
  );
};

export default PfpUpload;
