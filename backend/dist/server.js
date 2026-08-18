"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const port = parseInt(process.env.PORT || "3001", 10);
app_1.app.listen(port, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${port}`);
});
