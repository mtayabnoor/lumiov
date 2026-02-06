import { Box } from "@mui/material";
import { ReactNode } from "react";
import PageHeader from "../PageHeader/PageHeader";

interface PageLayoutProps {
  title: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
}

const PageLayout = ({
  title,
  description,
  children,
  actions,
}: PageLayoutProps) => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden", // 1. LOCK THE PARENT (Stop full page scroll)
        p: 0,
      }}
    >
      {/* FIXED HEADER */}
      <Box
        sx={{
          px: 3,
          pt: 3,
          pb: 2,
          flexShrink: 0,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <PageHeader title={title} description={description || ""} />
        {actions && <Box>{actions}</Box>}
      </Box>

      {/* CONTENT AREA */}
      <Box
        sx={{
          flexGrow: 1, // Take all remaining space
          display: "flex", // 3. Make this a flex container
          flexDirection: "column",
          overflowY: "auto",
          px: 3,
          pb: 3,
          minHeight: 0,
        }}
      >
        {/* This forces the child (your Table Wrapper) to fill the exact space */}
        {children}
      </Box>
    </Box>
  );
};

export default PageLayout;
