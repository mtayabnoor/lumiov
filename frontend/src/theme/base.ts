// theme/base.ts
import type { ThemeOptions } from "@mui/material/styles";

export const baseTheme: ThemeOptions = {
  typography: {
    fontFamily: ['"Segoe WPC"', '"Segoe UI"', "sans-serif"].join(","),
    // VS Code default UI font size is 13px
    fontSize: 13,
    h1: { fontWeight: 600, fontSize: "2rem", lineHeight: 1.2 }, // Toned down weights
    h2: { fontWeight: 600, fontSize: "1.5rem", lineHeight: 1.2 },
    h3: { fontWeight: 600, fontSize: "1.25rem", lineHeight: 1.2 },
    h4: { fontWeight: 600, fontSize: "1rem", lineHeight: 1.4 },
    h5: { fontWeight: 600, fontSize: "0.9rem", lineHeight: 1.4 },
    h6: { fontWeight: 600, fontSize: "0.85rem", lineHeight: 1.4 },
    body1: { fontSize: "13px", lineHeight: 1.5 },
    body2: { fontSize: "12px", lineHeight: 1.5 },
    button: { textTransform: "none", fontWeight: 400, fontSize: "13px" }, // VS Code buttons are 13px, regular weight usually
  },
  shape: {
    borderRadius: 2, // VS Code is square-ish (approx 0px-4px depending on element). 2px is a safe "sharp" look.
  },
};
