import React from "react";
import { AppBar, Toolbar, Box, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import LogoutIcon from "@mui/icons-material/Logout";

const Navbar = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        navigate("/");
    };

    return (
        <AppBar position="static" sx={{ backgroundColor: "white",padding:1}}>
            <Toolbar sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                    <img
                        src="https://alexahire.in/wp-content/uploads/2024/09/Tata-Electronics-Walk-In-Interview.webp"
                        alt="Company Logo"
                        style={{ height: "60px", marginRight: "10px" }}
                    />
                </Box>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                        <LogoutIcon onClick={handleLogout} sx={{cursor:"pointer",fontSize:20}} color="error"/>
                    <Typography
                        variant="body1"
                        color="error"
                        onClick={handleLogout}
                        sx={{
                            cursor: "pointer",
                            fontWeight: "bold",
                            marginLeft: "5px",
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
