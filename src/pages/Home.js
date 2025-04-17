import React from "react";
import { useNavigate } from "react-router-dom";
import { Grid, Card, CardContent, Button, Typography, Box } from "@mui/material";

const HomePage = () => {
    const navigate = useNavigate();
    return (
        <Grid container spacing={2} sx={{ padding: 2, mt: 2 }} display="flex" alignItems="center" justifyContent="center">

            <Grid item size={{ xs: 12, sm: 6 }} display="flex" alignItems="center" justifyContent="center">
                <Card sx={{ width: "100%", padding: 3, borderRadius: 4, boxShadow: 4 }}>
                    <CardContent>
                        <Typography variant="h5" align="center" gutterBottom>
                            QIT - Digital Inspection
                        </Typography>

                        <Box
                            sx={{
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "center",
                                alignItems: "center",
                                gap: 3, // Space between buttons
                                mt: 7 // Adjust vertical spacing
                            }}
                        >
                            <Button
                                variant="contained"
                                sx={{ backgroundColor: "#1976D2", borderRadius: 3 }}
                                fullWidth
                                onClick={()=>{navigate("/start_inspection")}}
                                size="large"
                            >
                                Start Inspection
                            </Button>

                            <Button
                                variant="outlined"
                                sx={{ color: "#1976D2", borderColor: "#1976D2", borderRadius: 3 }}
                                fullWidth
                                size="large"
                                onClick={()=>{navigate("/inspection_report")}}
                            >
                                View Inspection
                            </Button>

                            <Button
                                variant="contained"
                                sx={{ backgroundColor: "#17CF97", "&:hover": { backgroundColor: "#14b686" }, borderRadius: 3 }}
                                fullWidth
                                size="large"
                            >
                                QIT - Dashboard
                            </Button>
                        </Box>
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    );
};

export default HomePage;