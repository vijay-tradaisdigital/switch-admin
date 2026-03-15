import { useState, useEffect, useMemo } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import type { Timestamp } from "firebase/firestore";
import { db } from "../firebase";
import { DataGrid } from "@mui/x-data-grid";
import type { GridColDef } from "@mui/x-data-grid";
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Stack,
  Alert,
  Typography,
  Paper,
  Card,
  CardContent,
  Grid,
  InputAdornment,
  Tooltip,
  IconButton,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import * as XLSX from "xlsx";
import type { ModelSelectorSubmission } from "../types";

type Row = ModelSelectorSubmission & { dateDisplay: string };

// ─── Column definitions ───────────────────────────────────────────────────────
const columns: GridColDef<Row>[] = [
  {
    field: "submittedAt",
    headerName: "Date",
    width: 190,
    type: "dateTime",
    valueFormatter: (value: Date | null) => {
      if (!value) return "—";
      return value.toLocaleString("en-IN", {
        day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
      });
    },
  },
  { field: "recommendedModel", headerName: "Recommended",   width: 160 },
  { field: "appType",          headerName: "App Type",       width: 180, flex: 1 },
  { field: "deckLength",       headerName: "Deck (ft)",      width: 110 },
  { field: "payload",          headerName: "Payload (kg)",   width: 130 },
  { field: "range",            headerName: "Range (km/day)", width: 140 },
];

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider" }}>
      <CardContent sx={{ py: 2, "&:last-child": { pb: 2 } }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>{label}</Typography>
        <Typography variant="h3" fontWeight={700}>{value}</Typography>
      </CardContent>
    </Card>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ModelSelectorSubmissionsTable() {
  const [rows, setRows]       = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [search, setSearch]   = useState("");
  const [modelFilter, setModelFiler] = useState("All");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const q = query(collection(db, "model_selector_submissions"), orderBy("submittedAt", "desc"));
      const snapshot = await getDocs(q);
      const data: Row[] = snapshot.docs.map((doc) => {
        const d = doc.data();
        const ts = d.submittedAt as Timestamp | null;
        const date = ts ? ts.toDate() : new Date(0);
        return {
          id:               doc.id,
          appType:          d.appType          ?? "",
          deckLength:       d.deckLength       ?? "",
          payload:          d.payload          ?? "",
          range:            d.range            ?? "",
          recommendedModel: d.recommendedModel ?? "",
          submittedAt:      date,
          dateDisplay:      date.toLocaleString("en-IN", {
            day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
          }),
        };
      });
      setRows(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filteredRows = useMemo(() => {
    const q = search.toLowerCase();
    return rows.filter((row) => {
      if (q && !row.appType.toLowerCase().includes(q) && !row.recommendedModel.toLowerCase().includes(q)) return false;
      if (modelFilter !== "All" && row.recommendedModel !== modelFilter) return false;
      return true;
    });
  }, [rows, search, modelFilter]);

  const exportToExcel = () => {
    const exportData = filteredRows.map((row) => ({
      Date:            row.dateDisplay,
      "Recommended":   row.recommendedModel,
      "App Type":      row.appType,
      "Deck (ft)":     row.deckLength,
      "Payload (kg)":  row.payload,
      "Range (km/day)": row.range,
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Model Selector");
    XLSX.writeFile(wb, `model-selector-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const hasActiveFilters = search || modelFilter !== "All";

  return (
    <Box>
      <Grid container spacing={2} mb={3}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <StatCard label="Total Shown" value={filteredRows.length} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <StatCard label="Total in DB" value={rows.length} />
        </Grid>
      </Grid>

      <Paper elevation={0} sx={{ p: 2, mb: 2, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "center" }} flexWrap="wrap">
          <TextField
            placeholder="Search app type or model…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            sx={{ minWidth: 260 }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" color="action" /></InputAdornment>,
              endAdornment: search ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearch("")}><ClearIcon fontSize="small" /></IconButton>
                </InputAdornment>
              ) : null,
            }}
          />

          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Recommended</InputLabel>
            <Select value={modelFilter} label="Recommended" onChange={(e) => setModelFiler(e.target.value)}>
              {["All", "Switch IeV3", "Switch IeV4"].map((v) => <MenuItem key={v} value={v}>{v}</MenuItem>)}
            </Select>
          </FormControl>

          <Box flex={1} />

          {hasActiveFilters && (
            <Tooltip title="Clear all filters">
              <Button variant="text" size="small" onClick={() => { setSearch(""); setModelFiler("All"); }} sx={{ textTransform: "none" }}>
                Clear filters
              </Button>
            </Tooltip>
          )}

          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchData} size="small" disabled={loading} sx={{ textTransform: "none" }}>Refresh</Button>
          <Button variant="contained" startIcon={<DownloadIcon />} onClick={exportToExcel} size="small" disabled={filteredRows.length === 0} sx={{ textTransform: "none" }}>
            Export Excel ({filteredRows.length})
          </Button>
        </Stack>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {!loading && !error && filteredRows.length === 0 && (
        <Paper elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, py: 8, textAlign: "center" }}>
          <Typography color="text.secondary">
            {hasActiveFilters ? "No results match the current filters." : "No model selector submissions found in the database."}
          </Typography>
        </Paper>
      )}

      {(loading || filteredRows.length > 0) && (
        <Paper elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, overflow: "hidden" }}>
          <DataGrid
            rows={filteredRows}
            columns={columns}
            loading={loading}
            pageSizeOptions={[10, 25, 50, 100]}
            initialState={{
              pagination: { paginationModel: { pageSize: 25 } },
              sorting: { sortModel: [{ field: "submittedAt", sort: "desc" }] },
            }}
            disableRowSelectionOnClick
            autoHeight
            sx={{
              border: "none",
              "& .MuiDataGrid-columnHeaders": { bgcolor: "grey.50" },
              "& .MuiDataGrid-columnHeaderTitle": { fontWeight: 700, fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: 0.5, color: "text.secondary" },
              "& .MuiDataGrid-row:hover": { bgcolor: "action.hover" },
            }}
          />
        </Paper>
      )}
    </Box>
  );
}
