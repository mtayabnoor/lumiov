/**
 * Pod Diagnosis Dialog
 *
 * Displays AI-powered structured diagnosis for unhealthy pods.
 * Shows root cause, confidence score, severity, timeline, fixes, and raw data.
 */

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  Chip,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Alert,
  Paper,
  Divider,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import BiotechIcon from "@mui/icons-material/Biotech";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import BuildIcon from "@mui/icons-material/Build";
import ShieldIcon from "@mui/icons-material/Shield";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import type { DiagnosisResult, Fix } from "../../../interfaces/diagnosis";

// ─── Severity / Priority Colors ────────────────────────────────

const SEVERITY_COLORS: Record<
  string,
  "error" | "warning" | "info" | "success"
> = {
  critical: "error",
  high: "error",
  medium: "warning",
  low: "info",
};

const PRIORITY_COLORS: Record<string, string> = {
  immediate: "#f44336",
  "short-term": "#ff9800",
  "long-term": "#4caf50",
};

const RISK_COLORS: Record<string, string> = {
  high: "#f44336",
  medium: "#ff9800",
  low: "#4caf50",
};

// ─── Sub-Components ────────────────────────────────────────────

function ConfidenceGauge({ value }: { value: number }) {
  const color = value >= 80 ? "#4caf50" : value >= 50 ? "#ff9800" : "#f44336";
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 2, my: 1 }}>
      <Box sx={{ flexGrow: 1 }}>
        <LinearProgress
          variant="determinate"
          value={value}
          sx={{
            height: 10,
            borderRadius: 5,
            backgroundColor: "rgba(255,255,255,0.08)",
            "& .MuiLinearProgress-bar": {
              borderRadius: 5,
              backgroundColor: color,
            },
          }}
        />
      </Box>
      <Typography
        variant="h6"
        sx={{ fontWeight: 700, color, minWidth: 50, textAlign: "right" }}
      >
        {value}%
      </Typography>
    </Box>
  );
}

function FixCard({ fix, index }: { fix: Fix; index: number }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        mb: 1.5,
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        "&:hover": { borderColor: "primary.main", bgcolor: "action.hover" },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 1,
        }}
      >
        <Box sx={{ flexGrow: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 700,
                color: "text.primary",
                fontSize: "0.85rem",
              }}
            >
              {index + 1}. {fix.title}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 0.5, mb: 1 }}>
            <Chip
              label={fix.priority}
              size="small"
              sx={{
                fontSize: "0.65rem",
                height: 20,
                bgcolor: PRIORITY_COLORS[fix.priority] + "22",
                color: PRIORITY_COLORS[fix.priority],
                fontWeight: 600,
              }}
            />
            <Chip
              label={`Risk: ${fix.risk}`}
              size="small"
              sx={{
                fontSize: "0.65rem",
                height: 20,
                bgcolor: RISK_COLORS[fix.risk] + "22",
                color: RISK_COLORS[fix.risk],
                fontWeight: 600,
              }}
            />
          </Box>
          <Typography
            variant="body2"
            sx={{ color: "text.secondary", fontSize: "0.8rem" }}
          >
            {fix.description}
          </Typography>
        </Box>
      </Box>

      {fix.command && (
        <Box
          sx={{
            mt: 1.5,
            p: 1.5,
            bgcolor: "rgba(0,0,0,0.3)",
            borderRadius: 1,
            fontFamily: "monospace",
            fontSize: "0.75rem",
            position: "relative",
            overflowX: "auto",
          }}
        >
          <IconButton
            size="small"
            onClick={() => handleCopy(fix.command!)}
            sx={{ position: "absolute", top: 2, right: 2, opacity: 0.7 }}
          >
            <ContentCopyIcon sx={{ fontSize: 14 }} />
          </IconButton>
          <code>{fix.command}</code>
          {copied && (
            <Typography
              variant="caption"
              sx={{
                position: "absolute",
                top: 6,
                right: 32,
                color: "#4caf50",
              }}
            >
              Copied!
            </Typography>
          )}
        </Box>
      )}
    </Paper>
  );
}

// ─── Main Dialog ───────────────────────────────────────────────

interface PodDiagnosisDialogProps {
  open: boolean;
  onClose: () => void;
  namespace: string;
  podName: string;
}

export default function PodDiagnosisDialog({
  open,
  onClose,
  namespace,
  podName,
}: PodDiagnosisDialogProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    // Reset state for new diagnosis
    setResult(null);
    setError(null);
    setLoading(true);

    const apiKey = localStorage.getItem("lumiov-agent-api-key") || "";

    if (!apiKey) {
      setError(
        "No OpenAI API key configured. Please set your API key in the Agent panel first.",
      );
      setLoading(false);
      return;
    }

    fetch("http://localhost:3030/api/diagnose", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ namespace, podName, apiKey }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Diagnosis request failed");
          if (data.rawData) setResult({ rawData: data.rawData });
        } else {
          setResult(data);
        }
      })
      .catch((err) => {
        setError(err.message || "Network error");
      })
      .finally(() => setLoading(false));
  }, [open, namespace, podName]);

  const report = result?.report;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: "85vh",
        },
      }}
    >
      {/* ── Header ── */}
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          pb: 1,
        }}
      >
        <BiotechIcon sx={{ color: "primary.main" }} />
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: "1rem" }}>
            Pod Diagnosis
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {namespace}/{podName}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ p: 2.5 }}>
        {/* ── Loading ── */}
        {loading && (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              py: 8,
              gap: 2,
            }}
          >
            <CircularProgress size={48} />
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Collecting pod data and running AI analysis...
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: "text.disabled",
                maxWidth: 400,
                textAlign: "center",
              }}
            >
              Fetching events, container logs, and pod status. This may take
              10-20 seconds.
            </Typography>
          </Box>
        )}

        {/* ── Error ── */}
        {error && !loading && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* ── Report ── */}
        {report && !loading && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {/* Summary + Severity */}
            <Box>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  mb: 1,
                }}
              >
                <WarningAmberIcon
                  sx={{
                    color:
                      report.severity === "critical" ||
                      report.severity === "high"
                        ? "error.main"
                        : "warning.main",
                    fontSize: 20,
                  }}
                />
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 700, flexGrow: 1 }}
                >
                  Summary
                </Typography>
                <Chip
                  label={report.severity.toUpperCase()}
                  size="small"
                  color={SEVERITY_COLORS[report.severity]}
                  sx={{ fontWeight: 700, fontSize: "0.7rem" }}
                />
                <Chip
                  label={report.category}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: "0.7rem" }}
                />
              </Box>
              <Typography
                variant="body2"
                sx={{ color: "text.secondary", lineHeight: 1.6 }}
              >
                {report.summary}
              </Typography>
            </Box>

            <Divider />

            {/* Root Cause + Confidence */}
            <Box>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}
              >
                <CheckCircleOutlineIcon
                  sx={{ fontSize: 20, color: "primary.main" }}
                />
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Root Cause
                </Typography>
              </Box>
              <Typography
                variant="body2"
                sx={{
                  color: "text.primary",
                  fontWeight: 500,
                  mb: 1,
                  pl: 3.5,
                }}
              >
                {report.rootCause}
              </Typography>
              <Box sx={{ pl: 3.5 }}>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  Confidence Score
                </Typography>
                <ConfidenceGauge value={report.confidence} />
              </Box>
              {report.affectedContainers.length > 0 && (
                <Box
                  sx={{ pl: 3.5, display: "flex", gap: 0.5, flexWrap: "wrap" }}
                >
                  <Typography
                    variant="caption"
                    sx={{ color: "text.secondary", mr: 0.5 }}
                  >
                    Affected:
                  </Typography>
                  {report.affectedContainers.map((c) => (
                    <Chip
                      key={c}
                      label={c}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: "0.65rem", height: 20 }}
                    />
                  ))}
                </Box>
              )}
            </Box>

            <Divider />

            {/* Timeline */}
            {report.timeline.length > 0 && (
              <Box>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    mb: 1,
                  }}
                >
                  <AccessTimeIcon sx={{ fontSize: 20, color: "info.main" }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    Event Timeline
                  </Typography>
                </Box>
                <Box sx={{ pl: 3.5 }}>
                  {report.timeline.map((t, i) => (
                    <Box
                      key={i}
                      sx={{
                        display: "flex",
                        gap: 1.5,
                        mb: 0.75,
                        alignItems: "flex-start",
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          color: "text.disabled",
                          fontFamily: "monospace",
                          fontSize: "0.7rem",
                          minWidth: 80,
                          flexShrink: 0,
                        }}
                      >
                        {t.timestamp}
                      </Typography>
                      <Box
                        sx={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          bgcolor: "primary.main",
                          mt: 0.6,
                          flexShrink: 0,
                        }}
                      />
                      <Typography variant="body2" sx={{ fontSize: "0.8rem" }}>
                        {t.event}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}

            <Divider />

            {/* Fixes */}
            <Box>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}
              >
                <BuildIcon sx={{ fontSize: 20, color: "warning.main" }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Recommended Fixes
                </Typography>
                <Chip
                  label={`${report.fixes.length} fixes`}
                  size="small"
                  sx={{ fontSize: "0.65rem", height: 20 }}
                />
              </Box>
              {report.fixes.map((fix, i) => (
                <FixCard key={i} fix={fix} index={i} />
              ))}
            </Box>

            {/* Preventive Measures */}
            {report.preventiveMeasures.length > 0 && (
              <>
                <Divider />
                <Box>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 1,
                    }}
                  >
                    <ShieldIcon sx={{ fontSize: 20, color: "success.main" }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      Preventive Measures
                    </Typography>
                  </Box>
                  <Box sx={{ pl: 3.5 }}>
                    {report.preventiveMeasures.map((m, i) => (
                      <Typography
                        key={i}
                        variant="body2"
                        sx={{
                          fontSize: "0.8rem",
                          color: "text.secondary",
                          mb: 0.5,
                          "&::before": { content: '"• "' },
                        }}
                      >
                        {m}
                      </Typography>
                    ))}
                  </Box>
                </Box>
              </>
            )}

            {/* Raw Data (collapsible) */}
            {result?.rawData && (
              <>
                <Divider />
                <Accordion
                  disableGutters
                  sx={{
                    bgcolor: "transparent",
                    boxShadow: "none",
                    "&::before": { display: "none" },
                  }}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography
                      variant="caption"
                      sx={{ color: "text.disabled" }}
                    >
                      Raw Diagnostic Data
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box
                      component="pre"
                      sx={{
                        fontSize: "0.7rem",
                        bgcolor: "rgba(0,0,0,0.3)",
                        p: 2,
                        borderRadius: 1,
                        overflow: "auto",
                        maxHeight: 400,
                        fontFamily: "monospace",
                      }}
                    >
                      {JSON.stringify(result.rawData, null, 2)}
                    </Box>
                  </AccordionDetails>
                </Accordion>
              </>
            )}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}
