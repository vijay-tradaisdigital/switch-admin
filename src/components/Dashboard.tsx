import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import SubmissionsTable from "./SubmissionsTable";

export default function Dashboard() {
  return (
    <Box minHeight="100vh" bgcolor="background.default">
      <AppBar position="static" elevation={0} sx={{ borderBottom: "1px solid rgba(255,255,255,0.12)" }}>
        <Toolbar>
          <Typography variant="h6" fontWeight={700} sx={{ flexGrow: 1, letterSpacing: 0.5 }}>
            Switch Mobility — Enquiry Submissions
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
      </AppBar>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <SubmissionsTable />
      </Container>
    </Box>
  );
}
