import { useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  Tabs,
  Tab,
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import SubmissionsTable from "./SubmissionsTable";
import ServiceRequestsTable from "./ServiceRequestsTable";
import TCOSubmissionsTable from "./TCOSubmissionsTable";
import ModelSelectorSubmissionsTable from "./ModelSelectorSubmissionsTable";
import EnquireNowSubmissionsTable from "./EnquireNowSubmissionsTable";

export default function Dashboard() {
  const [tab, setTab] = useState(0);

  return (
    <Box minHeight="100vh" bgcolor="background.default">
      <AppBar position="static" elevation={0} sx={{ borderBottom: "1px solid rgba(255,255,255,0.12)" }}>
        <Toolbar>
          <Typography variant="h6" fontWeight={700} sx={{ flexGrow: 1, letterSpacing: 0.5 }}>
            Switch Mobility — Admin
          </Typography>
          <Button
            color="inherit"
            startIcon={<LogoutIcon />}
            onClick={() => signOut(auth)}
            sx={{ textTransform: "none" }}
          >
            Sign Out
          </Button>
        </Toolbar>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          textColor="inherit"
          indicatorColor="secondary"
          sx={{ px: 2, "& .MuiTab-root": { textTransform: "none", fontWeight: 600 } }}
        >
          <Tab label="Enquiry Submissions" />
          <Tab label="Enquire Now Landing" />
          <Tab label="Service Requests" />
          <Tab label="TCO Calculator" />
          <Tab label="Model Selector" />
        </Tabs>
      </AppBar>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {tab === 0 && <SubmissionsTable />}
        {tab === 1 && <EnquireNowSubmissionsTable />}
        {tab === 2 && <ServiceRequestsTable />}
        {tab === 3 && <TCOSubmissionsTable />}
        {tab === 4 && <ModelSelectorSubmissionsTable />}
      </Container>
    </Box>
  );
}
