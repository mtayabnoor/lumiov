import { Paper, Typography, CircularProgress } from "@mui/material";

interface SummaryCardProps {
  title: string;
  value: number | string;
  loading?: boolean;
  color?: string;
  subtitle?: string;
}

function SummaryCard({
  title,
  value,
  loading,
  color,
  subtitle,
}: SummaryCardProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 2,
        bgcolor: "background.paper",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        borderLeft: color ? `4px solid ${color}` : undefined,
      }}
    >
      <Typography
        variant="body2"
        sx={{ color: "text.secondary", mb: 0.5, fontWeight: 500 }}
      >
        {title}
      </Typography>
      {loading ? (
        <CircularProgress size={24} />
      ) : (
        <>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 700,
              color: color || "text.primary",
              lineHeight: 1.2,
            }}
          >
            {value}
          </Typography>
          {subtitle && (
            <Typography
              variant="caption"
              sx={{ color: "text.secondary", mt: 0.5 }}
            >
              {subtitle}
            </Typography>
          )}
        </>
      )}
    </Paper>
  );
}

export default SummaryCard;
