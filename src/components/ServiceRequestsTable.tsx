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
import type { ServiceRequest } from "../types";

type Row = ServiceRequest & { dateDisplay: string };

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
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    },
  },
  { field: "name", headerName: "Name", width: 160 },
  { field: "phone", headerName: "Phone", width: 130 },
  { field: "email", headerName: "Email", width: 240, flex: 1 },
  { field: "request_type", headerName: "Request Type", width: 150 },
  { field: "remarks", headerName: "Remarks", width: 280, flex: 1 },
  { field: "source", headerName: "Source", width: 140 },
];

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider" }}>
      <CardContent sx={{ py: 2, "&:last-child": { pb: 2 } }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {label}
        </Typography>
        <Typography variant="h3" fontWeight={700} color="text.primary">
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ServiceRequestsTable() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");

  // ── Fetch from Firestore ──────────────────────────────────────────────────
  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const q = query(
        collection(db, "service_requests"),
        orderBy("submittedAt", "desc")
      );
      const snapshot = await getDocs(q);

      const data: Row[] = snapshot.docs.map((doc) => {
        const d = doc.data();
        const ts = d.submittedAt as Timestamp | null;
        const date = ts ? ts.toDate() : new Date(0);
        return {
          id: doc.id,
          name: d.name ?? "",
          phone: d.phone ?? "",
          email: d.email ?? "",
          request_type: d.request_type ?? "",
          remarks: d.remarks ?? "",
          submittedAt: date,
          dateDisplay: date.toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
          source: d.source ?? "framer_webhook",
        };
      });

      setRows(data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to fetch data";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ── Dynamic request_type options from data ────────────────────────────────
  const typeOptions = useMemo(() => {
    const unique = Array.from(
      new Set(rows.map((r) => r.request_type).filter(Boolean))
    ).sort();
    return ["All", ...unique];
  }, [rows]);

  // ── Filtered rows ─────────────────────────────────────────────────────────
  const filteredRows = useMemo(() => {
    const q = search.toLowerCase();
    return rows.filter((row) => {
      if (
        q &&
        !row.name.toLowerCase().includes(q) &&
        !row.phone.includes(search) &&
        !row.email.toLowerCase().includes(q) &&
        !row.remarks.toLowerCase().includes(q)
      ) {
        return false;
      }
      if (typeFilter !== "All" && row.request_type !== typeFilter) return false;
      return true;
    });
  }, [rows, search, typeFilter]);

  // ── Excel export ──────────────────────────────────────────────────────────
  const exportToExcel = () => {
    const exportData = filteredRows.map((row) => ({
      Date: row.dateDisplay,
      Name: row.name,
      Phone: row.phone,
      Email: row.email,
      "Request Type": row.request_type,
      Remarks: row.remarks,
      Source: row.source,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const colWidths = Object.keys(exportData[0] ?? {}).map((key) => ({
      wch: Math.max(
        key.length,
        ...exportData.map((r) => String(r[key as keyof typeof r] ?? "").length)
      ),
    }));
    worksheet["!cols"] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "ServiceRequests");
    XLSX.writeFile(
      workbook,
      `service-requests-${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  const resetFilters = () => {
    setSearch("");
    setTypeFilter("All");
  };

  const hasActiveFilters = search || typeFilter !== "All";

  return (
    <Box>
      {/* ── Stats ── */}
      <Grid container spacing={2} mb={3}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <StatCard label="Total Shown" value={filteredRows.length} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <StatCard label="Total in DB" value={rows.length} />
        </Grid>
      </Grid>

      {/* ── Filter bar ── */}
      <Paper
        elevation={0}
        sx={{ p: 2, mb: 2, border: "1px solid", borderColor: "divider", borderRadius: 2 }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          alignItems={{ md: "center" }}
          flexWrap="wrap"
        >
          <TextField
            placeholder="Search name, phone, email, remarks…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            sx={{ minWidth: 280 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
              endAdornment: search ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearch("")}>
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
          />

          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Request Type</InputLabel>
            <Select
              value={typeFilter}
              label="Request Type"
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              {typeOptions.map((t) => (
                <MenuItem key={t} value={t}>
                  {t}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box flex={1} />

          {hasActiveFilters && (
            <Tooltip title="Clear all filters">
              <Button
                variant="text"
                size="small"
                onClick={resetFilters}
                sx={{ textTransform: "none" }}
              >
                Clear filters
              </Button>
            </Tooltip>
          )}

          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchData}
            size="small"
            disabled={loading}
            sx={{ textTransform: "none" }}
          >
            Refresh
          </Button>

          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={exportToExcel}
            size="small"
            disabled={filteredRows.length === 0}
            sx={{ textTransform: "none" }}
          >
            Export Excel ({filteredRows.length})
          </Button>
        </Stack>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!loading && !error && filteredRows.length === 0 && (
        <Paper
          elevation={0}
          sx={{
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
            py: 8,
            textAlign: "center",
          }}
        >
          <Typography color="text.secondary">
            {hasActiveFilters
              ? "No service requests match the current filters."
              : "No service requests found in the database."}
          </Typography>
        </Paper>
      )}

      {(loading || filteredRows.length > 0) && (
        <Paper
          elevation={0}
          sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, overflow: "hidden" }}
        >
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
              "& .MuiDataGrid-columnHeaders": {
                bgcolor: "grey.50",
              },
              "& .MuiDataGrid-columnHeaderTitle": {
                fontWeight: 700,
                fontSize: "0.8rem",
                textTransform: "uppercase",
                letterSpacing: 0.5,
                color: "text.secondary",
              },
              "& .MuiDataGrid-row:hover": {
                bgcolor: "action.hover",
              },
            }}
          />
        </Paper>
      )}
    </Box>
  );
}
