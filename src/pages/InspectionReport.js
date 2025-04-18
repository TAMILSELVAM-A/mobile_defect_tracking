import React, { useEffect, useState, useCallback } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Typography,
    CircularProgress,
    Container,
    styled,
    Box,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Button,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from "@mui/material";
import axios from "axios";
import { Delete, Home, Edit, Save, Cancel } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

const StyledTableCell = styled(TableCell)(({ theme }) => ({
    backgroundColor: '#64b5f6',
    color: 'white',
    fontWeight: 'bold',
    padding: '8px 16px',
    borderRight: '1px solid white',
}));

const GroupCell = styled(TableCell)(({ theme }) => ({
    backgroundColor: '#e3f2fd',
    fontWeight: 'bold',
    padding: '8px 16px',
    borderBottom: '1px solid #bbdefb',
    borderRight: '1px solid #e0e0e0'
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
    '&:hover': {
        backgroundColor: '#eeeeee',
    },
}));

const InspectionReport = () => {
    const [data, setData] = useState([]);
    const [groupedData, setGroupedData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stageFilter, setStageFilter] = useState("All");
    const [deleteDialog, setdeleteDialog] = useState(false);
    const [deleteLoading, setdeleteLoading] = useState(false);
    const [deleteItemId, setdeleteItemId] = useState(null);
    const [isedit, setIsEdit] = useState(null);
    const [editedItem, setEditedItem] = useState({});

    console.log("editedItem", editedItem)
    const navigate = useNavigate();

    const handleDeleteDialogOpen = (id) => {
        setdeleteDialog(true);
        setdeleteItemId(Number(id));
    }

    const handledeleteDialogClose = () => {
        setdeleteDialog(false);
        setdeleteItemId(null);
    }


    const handledeleteItem = async () => {
        if (!deleteItemId) return;
        try {
            setdeleteLoading(true);
            const itemId = Number(deleteItemId) - 1;
            const response = await axios.delete(
                `https://api.sheetbest.com/sheets/d265c651-cbb6-4d17-a81b-b3a50d3537aa/${itemId}`,
            );
            if (response.data) {
                handledeleteDialogClose();
                fetchExcelFile();
            }
        } catch (error) {
            console.error("Error deleting item:", error);
        } finally {
            setdeleteLoading(false);
        }
    };

    const handleInputChange = (field, value) => {
        setEditedItem((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleSave = async () => {
        try {
            if (!editedItem) return;

            const item = {
                "Category": editedItem.category || "-",
                "Defect Location": editedItem.defectLocation || "-",
                "Defect Symptoms": editedItem.defectSymptoms || "-",
                "ERR Code ": editedItem.errCode || "-",
                Spec: editedItem.spec || "-",
                "Defect Image": editedItem.defectPic || null,
                Actual: editedItem.actual || "-",
                Result: editedItem.status || "-",
                "Containment Action ": editedItem.containtment || "-",
                "Root cause": editedItem.root_cause || "-",
                "Correct to action": editedItem.corect_to_cause || "-",
                "4M": editedItem.four_m || "-",
                ETC: editedItem.ETC || "-",
                "Result Final": editedItem.result_final || "-",
            };

            const itemId = Number(editedItem.id) - 1;

            setIsEdit(null);
            setEditedItem({});

            const response = await axios.patch(
                `https://api.sheetbest.com/sheets/d265c651-cbb6-4d17-a81b-b3a50d3537aa/${itemId}`,
                item
            );
            if (response.data) {
                fetchExcelFile();
            }
        } catch (error) {
            console.error("Error saving item:", error);
        }
    };

    const filteredData = stageFilter === "All"
        ? groupedData
        : groupedData.filter(group => group.stage === stageFilter);

    // const formatExcelDate = (excelDate) => {
    //     if (typeof excelDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(excelDate)) {
    //         return excelDate;
    //     }

    //     try {
    //         const jsDate = new Date((excelDate - 25569) * 86400 * 1000);
    //         if (isNaN(jsDate.getTime())) {
    //             throw new Error("Invalid date conversion");
    //         }
    //         return jsDate.toISOString().split('T')[0];
    //     } catch (error) {
    //         console.error("Error formatting Excel date:", error);
    //         return "Invalid Date";
    //     }
    // };


    const processDataForGrouping = useCallback((jsonData) => {
        const groupedByKeys = {};

        jsonData.forEach(row => {
            const date = row["Inspection Date"];
            const line = row["Line"];
            const stage = row["Stage"];
            const shift = row["Shift"];
            const project = row["Project"];
            const cartonId = row["Carton ID"];
            const autoUsn = row["Auto USN"];
            const manualUsn = row["Manual USN Scan"];

            const groupKey = `${date}-${line}-${stage}-${shift}-${project}-${cartonId}`;

            if (!groupedByKeys[groupKey]) {
                groupedByKeys[groupKey] = {
                    date,
                    line,
                    stage,
                    shift,
                    project,
                    cartonId,
                    autoUsnGroups: {}
                };
            }

            if (!groupedByKeys[groupKey].autoUsnGroups[autoUsn]) {
                groupedByKeys[groupKey].autoUsnGroups[autoUsn] = {};
            }

            if (!groupedByKeys[groupKey].autoUsnGroups[autoUsn][manualUsn]) {
                groupedByKeys[groupKey].autoUsnGroups[autoUsn][manualUsn] = [];
            }

            groupedByKeys[groupKey].autoUsnGroups[autoUsn][manualUsn].push({
                id: row["id"],
                category: row["Category"],
                defectSymptoms: row["Defect Symptoms"],
                defectLocation: row["Defect Location"],
                errCode: row["ERR Code "],
                spec: row["Spec"],
                defectPic: row["Defect Image"],
                actual: row["Actual"],
                status: row["Result"],
                containtment: row["Containment Action "],
                root_cause: row["Root cause"],
                corect_to_cause: row["Correct to action"],
                four_m: row["4M"],
                ETC: row["ETC"],
                result_final: row["Result Final"],
                limit_sample_image: row["Limit Sample Images"]
            });
        });

        const groupedArray = Object.values(groupedByKeys).map(group => ({
            ...group,
            autoUsnGroups: Object.entries(group.autoUsnGroups).map(([autoUsn, manualUsnGroups]) => ({
                autoUsn,
                manualUsnGroups: Object.entries(manualUsnGroups).map(([manualUsn, items]) => ({
                    manualUsn,
                    items
                }))
            }))
        })).sort((a, b) => new Date(b.date) - new Date(a.date));

        setGroupedData(groupedArray);
    }, []);

    const fetchExcelFile = useCallback(async () => {
        setLoading(true);
        try {
            const res = await axios.get("https://api.sheetbest.com/sheets/d265c651-cbb6-4d17-a81b-b3a50d3537aa");
            setData(res.data);
            processDataForGrouping(res.data);
        } catch (error) {
            console.error("Error fetching or parsing Excel file:", error);
        } finally {
            setLoading(false);
        }
    }, [processDataForGrouping]);

    useEffect(() => {
        fetchExcelFile();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    if (loading) {
        return (
            <div style={{ display: "flex", justifyContent: "center", marginTop: 50 }}>
                <CircularProgress />
            </div>
        );
    }

    if (data.length === 0) {
        return <Typography variant="h6" align="center" sx={{ mt: 4 }}>No data found.</Typography>;
    }

    return (
        <Container maxWidth={"false"}>
            <Box sx={{ width: '100%', position: 'relative', overflow: 'auto', mt: 2, mb: 3 }}>
                <Box
                    sx={{
                        mt: 1,
                        mb: 2,
                        display: "flex",
                        flexDirection: { xs: "column", sm: "row" },
                        alignItems: "center",
                        justifyContent: "space-between", // Ensures proper spacing between items
                        gap: 2,
                    }}
                >
                    {/* Filter Box */}
                    <Box
                        sx={{
                            display: "flex",
                            gap: 2,
                            width: { xs: "100%", sm: "auto" },
                            order: { xs: 1, sm: 1 }, // Ensure filter is first
                        }}
                    >
                        <FormControl
                            size="small"
                            sx={{ minWidth: 200, flexGrow: { xs: 1, sm: 0 } }}
                        >
                            <InputLabel>Filter by Station</InputLabel>
                            <Select
                                value={stageFilter}
                                onChange={(e) => setStageFilter(e.target.value)}
                                label="Filter by Station"
                            >
                                <MenuItem value="All">All</MenuItem>
                                <MenuItem value="CM QIT">CM QIT</MenuItem>
                                <MenuItem value="NOVA QIT">NOVA QIT</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>

                    {/* Title */}
                    <Typography
                        variant="h5"
                        component="h2"
                        sx={{
                            textAlign: "center",
                            flexGrow: 1,
                            order: { xs: 2, sm: 2 }, // Ensure title is centered
                            width: { xs: "100%", sm: "auto" }, // Full width on mobile
                        }}
                    >
                        QIT - Digitalization
                    </Typography>

                    {/* Home Button */}
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "flex-end",
                            order: { xs: 3, sm: 3 }, // Ensure button is last
                            width: { xs: "100%", sm: "auto" },
                        }}
                    >
                        <Button
                            startIcon={<Home />}
                            variant="contained"
                            onClick={() => {
                                navigate("/home");
                            }}
                        >
                            Home
                        </Button>
                    </Box>
                </Box>
                <TableContainer component={Paper}>
                    <Table size="small" aria-label="defect table">
                        <TableHead>
                            <TableRow>
                                <StyledTableCell>Date</StyledTableCell>
                                <StyledTableCell>Project</StyledTableCell>
                                <StyledTableCell>Station</StyledTableCell>
                                <StyledTableCell>Line</StyledTableCell>
                                <StyledTableCell>Shift</StyledTableCell>
                                <StyledTableCell>Carton ID</StyledTableCell>
                                <StyledTableCell>Auto USN</StyledTableCell>
                                <StyledTableCell>Manual USN</StyledTableCell>
                                <StyledTableCell>Category</StyledTableCell>
                                <StyledTableCell>Defect Location</StyledTableCell>
                                <StyledTableCell>Defect Symptoms</StyledTableCell>
                                <StyledTableCell>Limit Sample Images</StyledTableCell>
                                <StyledTableCell>ERR Code</StyledTableCell>
                                <StyledTableCell>Spec</StyledTableCell>
                                <StyledTableCell>Defect Pic</StyledTableCell>
                                <StyledTableCell>Actual</StyledTableCell>
                                <StyledTableCell>Result</StyledTableCell>
                                <StyledTableCell>Containment Action</StyledTableCell>
                                <StyledTableCell>Root Cause</StyledTableCell>
                                <StyledTableCell>Correct to action</StyledTableCell>
                                <StyledTableCell sx={{ width: 200 }}>4M</StyledTableCell>
                                <StyledTableCell>ETC</StyledTableCell>
                                <StyledTableCell>Status</StyledTableCell>
                                <StyledTableCell>Action</StyledTableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredData.map((group, groupIndex) => (
                                group.autoUsnGroups.map((autoUsnGroup, autoUsnIndex) => (
                                    autoUsnGroup.manualUsnGroups.map((manualUsnGroup, manualUsnIndex) => (
                                        manualUsnGroup.items.map((item, itemIndex) => (
                                            <StyledTableRow key={`${groupIndex}-${autoUsnIndex}-${manualUsnIndex}-${itemIndex}`}>
                                                {autoUsnIndex === 0 && manualUsnIndex === 0 && itemIndex === 0 && (
                                                    <>
                                                        <GroupCell rowSpan={group.autoUsnGroups.reduce((sum, g) => sum + g.manualUsnGroups.reduce((subSum, m) => subSum + m.items.length, 0), 0)}>
                                                            {group.date}
                                                        </GroupCell>
                                                        <GroupCell rowSpan={group.autoUsnGroups.reduce((sum, g) => sum + g.manualUsnGroups.reduce((subSum, m) => subSum + m.items.length, 0), 0)}>
                                                            {group.project}
                                                        </GroupCell>
                                                        <GroupCell rowSpan={group.autoUsnGroups.reduce((sum, g) => sum + g.manualUsnGroups.reduce((subSum, m) => subSum + m.items.length, 0), 0)}>
                                                            {group.stage}
                                                        </GroupCell>
                                                        <GroupCell rowSpan={group.autoUsnGroups.reduce((sum, g) => sum + g.manualUsnGroups.reduce((subSum, m) => subSum + m.items.length, 0), 0)}>
                                                            {group.line}
                                                        </GroupCell>
                                                        <GroupCell rowSpan={group.autoUsnGroups.reduce((sum, g) => sum + g.manualUsnGroups.reduce((subSum, m) => subSum + m.items.length, 0), 0)}>
                                                            {group.shift}
                                                        </GroupCell>
                                                        <GroupCell rowSpan={group.autoUsnGroups.reduce((sum, g) => sum + g.manualUsnGroups.reduce((subSum, m) => subSum + m.items.length, 0), 0)}>
                                                            {group.cartonId}
                                                        </GroupCell>
                                                    </>
                                                )}
                                                {manualUsnIndex === 0 && itemIndex === 0 && (
                                                    <TableCell
                                                        rowSpan={manualUsnGroup.items.length}
                                                        sx={{
                                                            color: autoUsnGroup.autoUsn === manualUsnGroup.manualUsn ? "green" : "red",
                                                            backgroundColor: autoUsnGroup.autoUsn === manualUsnGroup.manualUsn ? "#e3fdeb" : "#fde3e3"
                                                        }}>
                                                        {autoUsnGroup.autoUsn}
                                                    </TableCell>
                                                )}
                                                {itemIndex === 0 && (
                                                    <TableCell
                                                        rowSpan={manualUsnGroup.items.length}
                                                        sx={{
                                                            color: autoUsnGroup.autoUsn === manualUsnGroup.manualUsn ? "green" : "red",
                                                            backgroundColor: autoUsnGroup.autoUsn === manualUsnGroup.manualUsn ? "#e3fdeb" : "#fde3e3"
                                                        }}>
                                                        {manualUsnGroup.manualUsn}
                                                    </TableCell>
                                                )}
                                                <TableCell>
                                                    {isedit === item.id ?
                                                        <input
                                                            type="text"
                                                            placeholder="Enter Defect Location"
                                                            value={editedItem.category || ""}
                                                            onChange={(e) => handleInputChange("category", e.target.value)}
                                                            style={{ width: '100%', border: "1px solid #64b5f6", padding: "2px", borderRadius: "4px", marginTop: "4px" }}
                                                        /> : item.category
                                                    }
                                                </TableCell>
                                                <TableCell>
                                                    {isedit === item.id ?
                                                        <input
                                                            type="text"
                                                            placeholder="Enter Defect Location"
                                                            value={editedItem.defectLocation || ""}
                                                            onChange={(e) => handleInputChange("defectLocation", e.target.value)}
                                                            style={{ width: '100%', border: "1px solid #64b5f6", padding: "2px", borderRadius: "4px", marginTop: "4px" }}
                                                        /> :
                                                        item.defectLocation
                                                    }
                                                </TableCell>
                                                <TableCell>{isedit === item.id ?
                                                    <input
                                                        type="text"
                                                        placeholder="Enter Defect Location"
                                                        value={editedItem.defectSymptoms || ""}
                                                        onChange={(e) => handleInputChange("defectSymptoms", e.target.value)}
                                                        style={{ width: '100%', border: "1px solid #64b5f6", padding: "2px", borderRadius: "4px", marginTop: "4px" }}
                                                    /> : item.defectSymptoms}</TableCell>
                                                <TableCell>{item.limit_sample_image && (
                                                    <img
                                                        src={item.limit_sample_image}
                                                        alt="Defect"
                                                        style={{ maxHeight: '60px' }}
                                                    />
                                                )}</TableCell>
                                                <TableCell>{isedit === item.id ?
                                                    <input
                                                        type="text"
                                                        placeholder="Enter Defect Location"
                                                        value={editedItem.errCode || ""}
                                                        onChange={(e) => handleInputChange("errCode", e.target.value)}
                                                        style={{ width: '100%', border: "1px solid #64b5f6", padding: "2px", borderRadius: "4px", marginTop: "4px" }}
                                                    /> : item.errCode}</TableCell>
                                                <TableCell>{isedit === item.id ?
                                                    <input
                                                        type="text"
                                                        placeholder="Enter Defect Location"
                                                        value={editedItem.spec || ""}
                                                        onChange={(e) => handleInputChange("spec", e.target.value)}
                                                        style={{ width: '100%', border: "1px solid #64b5f6", padding: "2px", borderRadius: "4px", marginTop: "4px" }}
                                                    /> : item.spec}</TableCell>
                                                <TableCell>
                                                    {item.defectPic ? (
                                                        <img
                                                            src={item.defectPic}
                                                            alt="Defect"
                                                            style={{ maxHeight: '60px' }}
                                                        />
                                                    ) : ("-")}
                                                </TableCell>
                                                <TableCell>{isedit === item.id ?
                                                    <input
                                                        type="text"
                                                        placeholder="Enter Defect Location"
                                                        value={editedItem.actual || ""}
                                                        onChange={(e) => handleInputChange("actual", e.target.value)}
                                                        style={{ width: '100%', border: "1px solid #64b5f6", padding: "2px", borderRadius: "4px", marginTop: "4px" }}
                                                    /> : item.actual}</TableCell>
                                                <TableCell sx={{ color: item.status === "OK" ? "green" : "red" }}>{isedit === item.id ?
                                                    <input
                                                        type="text"
                                                        placeholder="Enter Defect Location"
                                                        value={editedItem.status || ""}
                                                        onChange={(e) => handleInputChange("status", e.target.value)}
                                                        style={{ width: '100%', border: "1px solid #64b5f6", padding: "2px", borderRadius: "4px", marginTop: "4px" }}
                                                    /> : item.status}</TableCell>
                                                <TableCell>{isedit === item.id ?
                                                    <input
                                                        type="text"
                                                        placeholder="Enter Defect Location"
                                                        value={editedItem.containtment || ""}
                                                        onChange={(e) => handleInputChange("containtment", e.target.value)}
                                                        style={{ width: '100%', border: "1px solid #64b5f6", padding: "2px", borderRadius: "4px", marginTop: "4px" }}
                                                    /> : item.containtment}</TableCell>
                                                <TableCell>{isedit === item.id ?
                                                    <input
                                                        type="text"
                                                        placeholder="Enter Defect Location"
                                                        value={editedItem.root_cause || ""}
                                                        onChange={(e) => handleInputChange("root_cause", e.target.value)}
                                                        style={{ width: '100%', border: "1px solid #64b5f6", padding: "2px", borderRadius: "4px", marginTop: "4px" }}
                                                    /> : item.root_cause}</TableCell>
                                                <TableCell>{isedit === item.id ?
                                                    <input
                                                        type="text"
                                                        placeholder="Enter Defect Location"
                                                        value={editedItem.corect_to_cause || ""}
                                                        onChange={(e) => handleInputChange("corect_to_cause", e.target.value)}
                                                        style={{ width: '100%', border: "1px solid #64b5f6", padding: "2px", borderRadius: "4px", marginTop: "4px" }}
                                                    /> : item.corect_to_cause}</TableCell>
                                                <TableCell>{isedit === item.id ?
                                                    <input
                                                        type="text"
                                                        placeholder="Enter Defect Location"
                                                        value={editedItem.four_m || ""}
                                                        onChange={(e) => handleInputChange("four_m", e.target.value)}
                                                        style={{ width: '100%', border: "1px solid #64b5f6", padding: "2px", borderRadius: "4px", marginTop: "4px" }}
                                                    /> : item.four_m}</TableCell>
                                                <TableCell>{isedit === item.id ?
                                                    <input
                                                        type="date"
                                                        placeholder="Enter Defect Location"
                                                        value={editedItem.ETC || ""}
                                                        onChange={(e) => handleInputChange("ETC", e.target.value)}
                                                        style={{ width: '100%', border: "1px solid #64b5f6", padding: "2px", borderRadius: "4px", marginTop: "4px" }}
                                                    /> : item.ETC}</TableCell>
                                                <TableCell>{isedit === item.id ?
                                                    <input
                                                        type="text"
                                                        placeholder="Enter Defect Location"
                                                        value={editedItem.result_final || ""}
                                                        onChange={(e) => handleInputChange("result_final", e.target.value)}
                                                        style={{ width: '100%', border: "1px solid #64b5f6", padding: "2px", borderRadius: "4px", marginTop: "4px" }}
                                                    /> : item.result_final}</TableCell>
                                                <TableCell>
                                                    <Box display="flex" justifyContent={"space-between"} alignItems="center">
                                                        {isedit === item.id ?
                                                            <>
                                                                <IconButton>
                                                                    <Save color="primary" sx={{ fontSize: 18 }} onClick={handleSave} />
                                                                </IconButton>
                                                                <IconButton>
                                                                    <Cancel color="error" sx={{ fontSize: 18 }} onClick={() => { setIsEdit(null); setEditedItem({}) }} />
                                                                </IconButton>
                                                            </> :
                                                            <>
                                                                <IconButton>
                                                                    <Edit sx={{ fontSize: 18 }} color="secondary" onClick={() => { setIsEdit(item.id); setEditedItem(item) }} />
                                                                </IconButton>
                                                                <IconButton>
                                                                    <Delete
                                                                        sx={{ fontSize: 18 }}
                                                                        color="error"
                                                                        onClick={() => { handleDeleteDialogOpen(item.id) }}
                                                                    />
                                                                </IconButton>
                                                            </>
                                                        }
                                                    </Box>
                                                </TableCell>
                                            </StyledTableRow>
                                        ))
                                    ))
                                ))
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>

            {/* DELETE DIALOG */}
            <Dialog open={deleteDialog} onClose={handledeleteDialogClose} fullWidth>
                <DialogTitle>Delete </DialogTitle>
                <DialogContent>
                    Are you sure you want to delete this item?
                </DialogContent>
                <DialogActions>
                    <Button onClick={handledeleteDialogClose} color="primary">
                        Cancel
                    </Button>
                    {deleteLoading ? (<CircularProgress />) : (
                        <Button onClick={handledeleteItem} color="error" variant="contained" disabled={!deleteItemId}>
                            Delete
                        </Button>)
                    }
                </DialogActions>
            </Dialog>
        </Container >
    )
}

export default InspectionReport;