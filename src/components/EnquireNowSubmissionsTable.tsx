import { useState, useEffect, useMemo } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import type { Timestamp } from "firebase/firestore";
import { db } from "../firebase";
import { DataGrid } from "@mui/x-data-grid";
import type { GridColDef } from "@mui/x-data-grid";
import {
  Box,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
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
import type { Submission } from "../types";

type Row = Submission & { dateDisplay: string };

const VEHICLE_OPTIONS = [
  "All",
  "SWITCH - IeV3 - 1.25 Ton",
  "SWITCH - IeV4 - 1.75 Ton",
];

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
  { field: "phone", headerName: "Phone", width: 120 },
  { field: "email", headerName: "Email", width: 220 },
  { field: "state", headerName: "State", width: 150 },
  { field: "city", headerName: "City", width: 130 },
  { field: "vehicle", headerName: "Vehicle", width: 230 },
  {
    field: "origin",
    headerName: "Origin Page",
    flex: 1,
    minWidth: 200,
  },
];

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color?: "primary" | "secondary" | "text.primary";
}) {
  return (
    <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider" }}>
      <CardContent sx={{ py: 2, "&:last-child": { pb: 2 } }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {label}
        </Typography>
        <Typography variant="h3" fontWeight={700} color={color ?? "text.primary"}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default function EnquireNowSubmissionsTable() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [vehicleFilter, setVehicleFilter] = useState("All");
  const [stateFilter, setStateFilter] = useState("All");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const q = query(
        collection(db, "enquire_now_submissions"),
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
          state: d.state ?? "",
          city: d.city ?? "",
          vehicle: d.vehicle ?? "",
          mode: d.mode ?? "enquire",
          submittedAt: date,
          dateDisplay: date.toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
          source: d.source ?? "website",
          origin: d.origin ?? "",
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

  const stateOptions = useMemo(() => {
    const unique = Array.from(new Set(rows.map((r) => r.state).filter(Boolean))).sort();
    return ["All", ...unique];
  }, [rows]);

  const filteredRows = useMemo(() => {
    const q = search.toLowerCase();
    return rows.filter((row) => {
      if (
        q &&
        !row.name.toLowerCase().includes(q) &&
        !row.phone.includes(search) &&
        !row.email.toLowerCase().includes(q) &&
        !row.city.toLowerCase().includes(q)
      ) {
        return false;
      }
      if (vehicleFilter !== "All" && row.vehicle !== vehicleFilter) return false;
      if (stateFilter !== "All" && row.state !== stateFilter) return false;
      return true;
    });
  }, [rows, search, vehicleFilter, stateFilter]);

  const exportToExcel = () => {
    const exportData = filteredRows.map((row) => ({
      Date: row.dateDisplay,
      Name: row.name,
      Phone: row.phone,
      Email: row.email,
      State: row.state,
      City: row.city,
      Vehicle: row.vehicle,
      Source: row.source,
      "Origin Page": row.origin,
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
    XLSX.utils.book_append_sheet(workbook, worksheet, "Enquire Now");
    XLSX.writeFile(
      workbook,
      `enquire-now-submissions-${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  const resetFilters = () => {
    setSearch("");
    setVehicleFilter("All");
    setStateFilter("All");
  };

  const hasActiveFilters =
    search || vehicleFilter !== "All" || stateFilter !== "All";

  return (
    <Box>
      <Grid container spacing={2} mb={3}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <StatCard label="Total Shown" value={filteredRows.length} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <StatCard label="Enquiries" value={filteredRows.length} color="primary" />
        </Grid>
      </Grid>

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
            placeholder="Search name, phone, email, city…"
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

          <FormControl size="small" sx={{ minWidth: 210 }}>
            <InputLabel>Vehicle</InputLabel>
            <Select
              value={vehicleFilter}
              label="Vehicle"
              onChange={(e) => setVehicleFilter(e.target.value)}
            >
              {VEHICLE_OPTIONS.map((v) => (
                <MenuItem key={v} value={v}>
                  {v}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>State</InputLabel>
            <Select
              value={stateFilter}
              label="State"
              onChange={(e) => setStateFilter(e.target.value)}
            >
              {stateOptions.map((s) => (
                <MenuItem key={s} value={s}>
                  {s}
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
              ? "No submissions match the current filters."
              : "No enquire-now submissions found in the database."}
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
            getRowHeight={() => "auto"}
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
