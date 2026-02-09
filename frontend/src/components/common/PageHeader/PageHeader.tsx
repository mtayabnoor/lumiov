import { Box, Typography } from "@mui/material";

function PageHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Box>
      <Typography
        variant="h3"
        sx={{ fontWeight: 700, color: "text.primary", mb: 1 }}
      >
        {title}
      </Typography>
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        {description}
      </Typography>
    </Box>
  );
}

export default PageHeader;
