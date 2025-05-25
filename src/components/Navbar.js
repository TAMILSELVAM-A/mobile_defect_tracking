import React from "react";
import {
    AppBar,
    Toolbar,
    Box,
    Typography
} from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import LogoutIcon from "@mui/icons-material/Logout";
import LogoImage from "../assets/TESS.png";

const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        navigate("/");
    };



    const isLoggedIn = location.pathname !== "/" && location.pathname !== "/login";

    if (!isLoggedIn) return null;

    // const menuItems = [
    //     { label: "Inspection Report", path: "/InspectionReport", icon: <DescriptionIcon sx={{ fontSize: 18, mr: 1 }} /> },
    //     { label: "Start Inspection", path: "/start_inspection", icon: <AssignmentIcon sx={{ fontSize: 18, mr: 1 }} /> },
    //     { label: "QIT - Dashboard", icon: <HomeIcon sx={{ fontSize: 18, mr: 1 }} /> },
    // ];

    return (
        <AppBar position="static" sx={{ backgroundColor: "white", padding: 1 }}>
            <Toolbar sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                {/* Logo */}
                <Box sx={{ display: "flex", alignItems: "center" }}>
                    <img
                        src={LogoImage}
                        alt="Company Logo"
                        style={{ height: "60px", marginRight: "10px", cursor: "pointer" }}
                        onClick={() => { navigate('/home') }}
                    />
                </Box>

                <Box sx={{ display: "flex", alignItems: "center" }}>
                    <LogoutIcon
                        onClick={handleLogout}
                        sx={{ cursor: "pointer", fontSize: 20 }}
                        color="error"
                    />
                    <Typography
                        variant="body1"
                        color="error"
                        onClick={handleLogout}
                        sx={{
                            cursor: "pointer",
                            fontWeight: "bold",
                            marginLeft: "5px"
                        }}
                    >
                        Logout
                    </Typography>
                </Box>

            </Toolbar>
        </AppBar>
    );
};

export default Navbar;
