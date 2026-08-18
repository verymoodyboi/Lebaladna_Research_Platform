import { TextField } from "@mui/material";
import type { TextFieldProps } from "@mui/material";
const AuthField = (props: TextFieldProps) => {
  return <TextField fullWidth variant="outlined" size="medium" {...props} />;
};

export default AuthField;
