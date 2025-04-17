import React, { useState } from "react";
import {
    AppBar,
    Toolbar,
    Box,
    Typography,
    IconButton,
    Menu,
    MenuItem,
    useMediaQuery,
    useTheme
} from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
import HomeIcon from "@mui/icons-material/Home";
import DescriptionIcon from "@mui/icons-material/Description";
import AssignmentIcon from "@mui/icons-material/Assignment";

const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));
    const [anchorEl, setAnchorEl] = useState(null);

    const handleLogout = () => {
        navigate("/");
    };

    const handleMenuClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleNavigation = (path) => {
        navigate(path);
        handleMenuClose();
    };

    const isLoggedIn = location.pathname !== "/" && location.pathname !== "/login";

    if (!isLoggedIn) return null;

    const menuItems = [
        { label: "Inspection Report", path: "/InspectionReport", icon: <DescriptionIcon sx={{ fontSize: 18, mr: 1 }} /> },
        { label: "Start Inspection", path: "/start_inspection", icon: <AssignmentIcon sx={{ fontSize: 18, mr: 1 }} /> },
        { label: "QIT - Dashboard", icon: <HomeIcon sx={{ fontSize: 18, mr: 1 }} /> },
    ];

    return (
        <AppBar position="static" sx={{ backgroundColor: "white", padding: 1 }}>
            <Toolbar sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                {/* Logo */}
                <Box sx={{ display: "flex", alignItems: "center" }}>
                    <img
                        src="https://alexahire.in/wp-content/uploads/2024/09/Tata-Electronics-Walk-In-Interview.webp"
                        alt="Company Logo"
                        style={{ height: "60px", marginRight: "10px" }}
                    />
                </Box>

                {/* Menu Items */}
                {isMobile ? (
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                        <IconButton edge="start" color="primary" onClick={handleMenuClick}>
                            <MenuIcon />
                        </IconButton>
                        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                            {menuItems.map((item) => (
                                <MenuItem
                                    key={item.path}
                                    onClick={() => handleNavigation(item.path)}
                                    sx={{
                                        backgroundColor: location.pathname === item.path ? "#f0f0f0" : "transparent",
                                        display: "flex",
                                        alignItems: "center"
                                    }}
                                >
                                    {item.icon}
                                    {item.label}
                                </MenuItem>
                            ))}
                            <MenuItem onClick={handleLogout} sx={{ color: "error.main" }}>
                                <LogoutIcon fontSize="small" sx={{ mr: 1 }} />
                                Logout
                            </MenuItem>
                        </Menu>
                    </Box>
                ) : (
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flex: 1
                        }}
                    >
                        {menuItems.map((item) => {
                            const isActive = location.pathname === item.path;
                            return (
                                <Box
                                    key={item.path}
                                    onClick={() => handleNavigation(item.path)}
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        mx: 2,
                                        cursor: "pointer",
                                        color: isActive ? "primary.main" : "text.primary",
                                        fontWeight: isActive ? "bold" : "normal",
                                        "&:hover": {
                                            color: "primary.main"
                                        }
                                    }}
                                >
                                    {React.cloneElement(item.icon, {
                                        color: isActive ? "primary" : "inherit"
                                    })}
                                    <Typography
                                        variant="body1"
                                        sx={{
                                            ml: 0.5,
                                            fontWeight: isActive ? "bold" : "normal"
                                        }}
                                    >
                                        {item.label}
                                    </Typography>
                                </Box>
                            );
                        })}
                    </Box>
                )}

                {/* Logout */}
                {!isMobile && (
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
                )}
            </Toolbar>
        </AppBar>
    );
};

export default Navbar;
