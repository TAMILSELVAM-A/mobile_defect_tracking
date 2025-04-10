import React, { useEffect, useState, useCallback } from "react";
import * as XLSX from "xlsx";
import {
    Snackbar,
    Alert,
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
    Button,
    Dialog,
    DialogTitle,
    DialogActions,
    DialogContent,
    TextField,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from "@mui/material";
import Webcam from "react-webcam";
import SensorOccupiedIcon from '@mui/icons-material/SensorOccupied';
import DeleteIcon from '@mui/icons-material/DeleteOutlineOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
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
    '&:nth-of-type(odd)': {
        backgroundColor: '#f5f5f5',
    },
    '&:hover': {
        backgroundColor: '#eeeeee',
    },
}));

const cartonToAutoUSNMap = {
    '8884620325076240': ["SLGF2WV5RT3", 'SFRWWL9X3T5', 'SFCWCX2XJMF', 'SFRWWL9XVV5', 'SGYL4KG6MTX'],
    '8884620325076241': ["AS-G998U-L7MN54", 'AS-G998U-P9K7J2', 'AS-G998U-TW23K9']
};

const DefectSymptoms = ["Dent", "Camera", "Scratches", "Crack", "N/A", "Other"];
const DefectLocation = ["DL1", "DL2", "DL3", "DL4", "N/A", "Other"];

const DefectCombinations = {};

DefectSymptoms.forEach((symptom, sIndex) => {
    DefectLocation.forEach((location, lIndex) => {
        const key = `${symptom}-${location}`;
        let errCode, spec, actual;

        if (symptom === "N/A" && location === "N/A") {
            errCode = "-";
            spec = "-";
            actual = "-";
        } else {
            errCode = `${symptom.slice(0, 2).toUpperCase()}${(lIndex + 1).toString().padStart(2, '0')}`;
            switch (symptom) {
                case "Dent":
                    spec = "0 mm depth";
                    actual = "0.5 mm depth";
                    break;
                case "Camera":
                    spec = "0 dead pixels";
                    actual = "2 dead pixels";
                    break;
                case "Scratches":
                    spec = "0 scratches";
                    actual = "3 scratches";
                    break;
                case "Crack":
                    spec = "0 mm length";
                    actual = "5.2 mm length";
                    break;
                default:
                    spec = "";
                    actual = "";
            }
        }

        DefectCombinations[key] = {
            errCode,
            spec,
            actual
        };
    });
});

function getDefectInfo(symptom, location) {
    const key = `${symptom}-${location}`;

    if (DefectCombinations[key]) {
        return DefectCombinations[key];
    }

    return {
        errCode: "DFXX",
        spec: "Unknown defect",
        actual: "Undefined combination"
    };
}

const TrackingTable = () => {
    const navigate = useNavigate()
    const [data, setData] = useState([]);
    const [groupedData, setGroupedData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [availableAutoUSNs, setAvailableAutoUSNs] = useState([]);
    const [formData, setFormData] = useState({
        project: "",
        stage: "",
        line: "",
        shift: "",
        cartonId: "",
    });
    const [manualUsn, setManualUsn] = useState("");
    const [uploadedImage, setUploadedImage] = useState(null);
    const [scanDialogOpen, setScanDialogOpen] = useState(false);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [snackbarSeverity, setSnackbarSeverity] = useState("info");
    const [isFrontCamera, setIsFrontCamera] = useState(true);
    const [isCameraActive, setIsCameraActive] = useState(false);
    // const [defectDetails, setDefectDetails] = useState({});
    const [scannerOpen, setscannerOpen] = useState(false);
    const [currentUsnKey, setCurrentUsnKey] = useState(null);

    const videoConstraints = {
        width: 1280,
        height: 720,
        facingMode: isFrontCamera ? "user" : "environment",
    };

    const showSnackbar = (message, severity = "info") => {
        setSnackbarMessage(message);
        setSnackbarSeverity(severity);
        setSnackbarOpen(true);
    };

    const handleSnackbarClose = () => {
        setSnackbarOpen(false);
    };

    const handleAnalyze = () => {
        if (!manualUsn) {
            showSnackbar("Please enter a Manual USN ", "error");
            return;
        }
        setAvailableAutoUSNs((prevUSNs) => {
            const updatedUSNs = { ...prevUSNs };
            if (!updatedUSNs || Object.keys(updatedUSNs).length === 0) {
                showSnackbar("No available USNs to analyze.", "error");
                return prevUSNs;
            }

            const matchedKey = Object.keys(updatedUSNs).find(
                (key) => key.toLowerCase() === manualUsn.toLowerCase()
            );
            if (matchedKey) {
                updatedUSNs[matchedKey] = {
                    ...updatedUSNs[matchedKey],
                    manualUsn: manualUsn,
                    matched: true,
                };
                setManualUsn("");
                setScanDialogOpen(false);
                return updatedUSNs;
            } else {
                showSnackbar(`This ${manualUsn} does not belong to the selected carton_id`, "error");
                return prevUSNs;
            }
        });
    };

    const handleDefectChange = (usnKey, field, value) => {
        setAvailableAutoUSNs((prevDetails) => {
            const updatedDetails = { ...prevDetails };
            if (!updatedDetails[usnKey]) {
                updatedDetails[usnKey] = { defectLocation: "", defectSymptoms: "", errCode: "", spec: "", actual: "" };
            }
            updatedDetails[usnKey][field] = value;

            if (field === "defectLocation" || field === "defectSymptoms") {
                const { defectLocation, defectSymptoms } = updatedDetails[usnKey];
                if (defectLocation !== "Other" && defectSymptoms !== "Other" && defectLocation && defectSymptoms) {
                    const defectInfo = getDefectInfo(defectSymptoms, defectLocation);
                    updatedDetails[usnKey] = {
                        ...updatedDetails[usnKey],
                        errCode: defectInfo.errCode,
                        spec: defectInfo.spec
                    };
                }
                if (defectLocation && defectSymptoms) {
                    if (defectLocation === "N/A" && defectSymptoms === "N/A") {
                        updatedDetails[usnKey].result = "OK";
                    } else {
                        updatedDetails[usnKey].result = "NG";
                    }
                }
            }

            if (value === "Other") {
                updatedDetails[usnKey].errCode = "";
                updatedDetails[usnKey].spec = "";
            }
            return updatedDetails;
        });
    };

    const formatExcelDate = (excelDate) => {
        if (typeof excelDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(excelDate)) {
            return excelDate;
        }

        try {
            const jsDate = new Date((excelDate - 25569) * 86400 * 1000);
            if (isNaN(jsDate.getTime())) {
                throw new Error("Invalid date conversion");
            }
            return jsDate.toISOString().split('T')[0];
        } catch (error) {
            console.error("Error formatting Excel date:", error);
            return "Invalid Date";
        }
    };


    const processDataForGrouping = useCallback((jsonData) => {
        const groupedByKeys = {};

        jsonData.forEach(row => {
            const date = formatExcelDate(row["Inspection Date"]);
            const line = row["Line"];
            const stage = row["Stage"];
            const shift = row["Shift"];
            const project = row["Project"];
            const cartonId = row["Carton ID"];

            const groupKey = `${date}-${line}-${stage}-${shift}-${project}-${cartonId}`;

            if (!groupedByKeys[groupKey]) {
                groupedByKeys[groupKey] = {
                    date,
                    line,
                    stage,
                    shift,
                    project,
                    cartonId,
                    items: []
                };
            }
            groupedByKeys[groupKey].items.push({
                autoUsn: row["Auto USN"],
                manualUsn: row["Manual USN Scan"],
                defectSymptoms: row["Defect Symptoms"],
                defectLocation: row["Defect Location"],
                errCode: row["ERR Code "],
                spec: row["Spec"],
                defectPic: row["Defect Image"],
                actual: row["Actual"],
                status: row["Result"]
            });
        });
        const groupedArray = Object.values(groupedByKeys).sort((a, b) => {
            return new Date(b.date) - new Date(a.date);
        });

        setGroupedData(groupedArray);
    }, []);

    useEffect(() => {
        const fetchExcelFile = async () => {
            setLoading(true);
            try {
                const response = await fetch("Updated%20OQC%20QIT%20Automation.xlsx");
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const arrayBuffer = await response.arrayBuffer();
                const workbook = XLSX.read(arrayBuffer, { type: "array" });
                const worksheet = workbook.Sheets["Sheet2"];

                if (!worksheet) {
                    throw new Error("Sheet 'Sheet2' not found in workbook.");
                }

                const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
                setData(jsonData);
                console.log("Excel Data Loaded:", jsonData);

                processDataForGrouping(jsonData);
            } catch (error) {
                console.error("Error fetching or parsing Excel file:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchExcelFile();
    }, [processDataForGrouping]);


    const handleInputChange = (e) => {
        const { name, value } = e.target;

        if (name === 'cartonId') {
            const autoUSNs = cartonToAutoUSNMap[value] || [];
            const formattedAutoUSNs = autoUSNs.reduce((acc, usn) => {
                acc[usn] = { autousn: usn };
                return acc;
            }, {});
            setAvailableAutoUSNs(formattedAutoUSNs);
        }

        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleDialogOpen = () => {
        setDialogOpen(true);
    };

    const handleOpenScanner = (usnKey) => {
        setscannerOpen(true);
        setCurrentUsnKey(usnKey);
    };

    const handleNotAvailable = (usnKey) => {
        setAvailableAutoUSNs((prevDetails) => {
            const updatedDetails = { ...prevDetails };
            if (usnKey) {
                updatedDetails[usnKey] = { defectLocation: "", defectSymptoms: "", errCode: "-", spec: "-", actual: "-", image: null, result: "-" };
                updatedDetails[usnKey].notAvailable = true;
                updatedDetails[usnKey].manualUsn = "Not Available";
            }
            console.log("UpdatedDetails", updatedDetails)
            return updatedDetails;
        });
    }

    const handleSaveCapturedImage = () => {
        if (uploadedImage === null || currentUsnKey === null) {
            showSnackbar("Please capture an image", "error")
            return
        }
        if (uploadedImage && currentUsnKey) {
            setAvailableAutoUSNs((prevDetails) => {
                const updatedDetails = { ...prevDetails };
                if (!updatedDetails[currentUsnKey]) {
                    updatedDetails[currentUsnKey] = {};
                }
                updatedDetails[currentUsnKey].image = uploadedImage;
                console.log("UpdatedDetails", updatedDetails)
                return updatedDetails;
            });
            setscannerOpen(false);
            setUploadedImage(null);
            setCurrentUsnKey(null);
        }
    };

    const handleDeleteCapturedImage = (usnKey) => {
        setAvailableAutoUSNs((prevDetails) => {
            const updatedDetails = { ...prevDetails };
            if (usnKey) {
                updatedDetails[usnKey].image = null;
            }
            return updatedDetails;
        });
    }


    const getTodayDate = () => {
        const today = new Date();

        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const year = today.getFullYear();

        let hours = today.getHours();
        const minutes = String(today.getMinutes()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';

        hours = hours % 12;
        hours = hours ? hours : 12;
        const formattedHours = String(hours).padStart(2, '0');

        const date = `${year}-${month}-${day}`;
        const time = `${formattedHours}:${minutes} ${ampm}`;

        return `${date} ${time}`;
    };

    const handleScanDialogOpen = () => {
        setScanDialogOpen(true);
    };

    const handleScanDialogClose = () => {
        setScanDialogOpen(false);
    };


    const handleAddRecord = () => {
        const { project, stage, line, shift, cartonId } = formData;
        if (!project || !stage || !line || !shift || !cartonId) {
            showSnackbar("Please fill in all required fields.", "warning");
            return;
        }

        const todayDate = getTodayDate().split(' ')[0];
        const newRecords = Object.entries(availableAutoUSNs).map(([autoUsn, usnData]) => ({
            "Inspection Date": todayDate,
            Project: project,
            Stage: stage,
            Line: line,
            Shift: shift,
            "Carton ID": cartonId,
            "Auto USN": autoUsn,
            "Manual USN Scan": usnData.manualUsn || "-",
            "Defect Location ": usnData.defectSymptoms || "-",
            "Defect Symptoms": usnData.defectSymptoms || "-",
            "ERR Code ": usnData.errCode || "-",
            Spec: usnData.spec || "-",
            "Defect Image": usnData.image || null,
            Actual: usnData.actual || "-",
            Result: usnData.result || "-",
        }));

        const updatedData = [...data, ...newRecords];
        setData(updatedData);

        processDataForGrouping(updatedData);

        setFormData({
            project: "",
            stage: "",
            line: "",
            shift: "",
            cartonId: "",
        });
        setManualUsn("");
        setUploadedImage(null);
        setAvailableAutoUSNs({});

        showSnackbar("Records added successfully!", "success");
        setDialogOpen(false);
    };

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
            <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", mt: 1 }}>
                <Box sx={{ cursor: "pointer" }} onClick={() => navigate("/")}>
                    <LogoutIcon color="error" /> Logout
                </Box>
            </Box>
            <Box sx={{ width: '100%', position: 'relative', overflow: 'auto', mt: 2 }}>
                <Box sx={{ mb: 2, alignItems: 'center', display: "flex", justifyContent: "center" }}>
                    <Typography variant="h5" component="h2" sx={{ textAlign: "center", flex: 1 }}>
                        QIT - Digitalization
                    </Typography>
                    <Button
                        variant="contained"
                        color="primary"
                        sx={{ marginLeft: 'auto', display: "flex", justifyContent: "flex-end" }}
                        onClick={handleDialogOpen}
                    >
                        New Defect
                    </Button>
                </Box>
                <TableContainer component={Paper}>
                    <Table size="small" aria-label="defect table">
                        <TableHead>
                            <TableRow>
                                <StyledTableCell>Date</StyledTableCell>
                                <StyledTableCell>Project</StyledTableCell>
                                <StyledTableCell>Stage</StyledTableCell>
                                <StyledTableCell>Line</StyledTableCell>
                                <StyledTableCell>Shift</StyledTableCell>
                                <StyledTableCell>Carton ID</StyledTableCell>
                                <StyledTableCell>Auto USN</StyledTableCell>
                                <StyledTableCell>Manual USN</StyledTableCell>
                                <StyledTableCell>Defect Location</StyledTableCell>
                                <StyledTableCell>Defect Symptoms</StyledTableCell>
                                <StyledTableCell>ERR Code</StyledTableCell>
                                <StyledTableCell>Spec</StyledTableCell>
                                <StyledTableCell>Defect Pic</StyledTableCell>
                                <StyledTableCell>Actual</StyledTableCell>
                                <StyledTableCell>Status</StyledTableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {groupedData.map((group, groupIndex) => (
                                group.items.map((item, itemIndex) => (
                                    <StyledTableRow key={`${groupIndex}-${itemIndex}`}>
                                        {itemIndex === 0 ? (
                                            <>
                                                <GroupCell
                                                    rowSpan={group.items.length}
                                                    sx={{ backgroundColor: '#e3f2fd' }}
                                                >
                                                    {group.date}
                                                </GroupCell>
                                                <GroupCell
                                                    rowSpan={group.items.length}
                                                    sx={{ backgroundColor: '#e3f2fd' }}
                                                >
                                                    {group.project}
                                                </GroupCell>
                                                <GroupCell
                                                    rowSpan={group.items.length}
                                                    sx={{ backgroundColor: '#e3f2fd' }}
                                                >
                                                    {group.stage}
                                                </GroupCell>
                                                <GroupCell
                                                    rowSpan={group.items.length}
                                                    sx={{ backgroundColor: '#e3f2fd' }}
                                                >
                                                    {group.line}
                                                </GroupCell>
                                                <GroupCell
                                                    rowSpan={group.items.length}
                                                    sx={{ backgroundColor: '#e3f2fd' }}
                                                >
                                                    {group.shift}
                                                </GroupCell>
                                                <GroupCell
                                                    rowSpan={group.items.length}
                                                    sx={{ backgroundColor: '#e3f2fd' }}
                                                >
                                                    {group.cartonId}
                                                </GroupCell>
                                            </>
                                        ) : null}
                                        <TableCell sx={{ color: item.autoUsn === item.manualUsn ? "green" : "red" }}>{item.autoUsn}</TableCell>
                                        <TableCell sx={{ color: item.autoUsn === item.manualUsn ? "green" : "red" }}>{item.manualUsn}</TableCell>
                                        <TableCell>{item.defectLocation}</TableCell>
                                        <TableCell>{item.defectSymptoms}</TableCell>
                                        <TableCell>{item.errCode}</TableCell>
                                        <TableCell>{item.spec}</TableCell>
                                        <TableCell>
                                            {item.defectPic && (
                                                <img
                                                    src={item.defectPic}
                                                    alt="Defect"
                                                    style={{ maxHeight: '60px' }}
                                                />
                                            )}</TableCell>
                                        <TableCell>{item.actual}</TableCell>
                                        <TableCell sx={{ color: item.status === "OK" ? "green" : "red" }}>{item.status}</TableCell>
                                    </StyledTableRow>
                                ))
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>

            {/* MAIN DIALOG */}
            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="lg" fullWidth>
                <DialogTitle>Add New Defect</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth
                                label="Date"
                                value={getTodayDate()}
                                disabled
                                variant="outlined"
                                margin="dense"
                            />
                        </Grid>
                        <Grid item size={{ xs: 12, md: 6 }}>
                            <FormControl fullWidth margin="dense">
                                <InputLabel>Project *</InputLabel>
                                <Select
                                    name="project"
                                    label="Project *"
                                    value={formData.project}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <MenuItem value="D47">D47</MenuItem>
                                    <MenuItem value="D48">D48</MenuItem>
                                    <MenuItem value="D49">D49</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item size={{ xs: 12, md: 6 }}>
                            <FormControl fullWidth margin="dense">
                                <InputLabel>Stage *</InputLabel>
                                <Select
                                    name="stage"
                                    label="Stage *"
                                    value={formData.stage}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <MenuItem value="QIT">QIT</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item size={{ xs: 12, md: 6 }}>
                            <FormControl fullWidth margin="dense">
                                <InputLabel>Line *</InputLabel>
                                <Select
                                    name="line"
                                    label="Line *"
                                    value={formData.line}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <MenuItem value="L1">L1</MenuItem>
                                    <MenuItem value="L2">L2</MenuItem>
                                    <MenuItem value="L3">L3</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item size={{ xs: 12, md: 6 }}>
                            <FormControl fullWidth margin="dense">
                                <InputLabel>Shift *</InputLabel>
                                <Select
                                    name="shift"
                                    label="Shift *"
                                    value={formData.shift}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <MenuItem value="A Shift">A Shift</MenuItem>
                                    <MenuItem value="B Shift">B Shift</MenuItem>
                                    <MenuItem value="C Shift">C Shift</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item size={{ xs: 12, md: 6 }}>
                            <FormControl fullWidth margin="dense">
                                <InputLabel>Carton ID *</InputLabel>
                                <Select
                                    name="cartonId"
                                    label="Carton ID *"
                                    value={formData.cartonId}
                                    onChange={handleInputChange}
                                    required
                                >
                                    {Object.keys(cartonToAutoUSNMap).map((cartonId) => (
                                        <MenuItem key={cartonId} value={cartonId}>{cartonId}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        {formData.cartonId &&
                            <Grid item size={{ xs: 12, md: 12 }}>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    size="large"
                                    fullWidth
                                    sx={{ display: "flex", justifyContent: "center" }}
                                    onClick={handleScanDialogOpen}
                                >
                                    Scan USN
                                </Button>
                            </Grid>
                        }
                        <Grid item size={{ xs: 12, md: 12 }}>
                            {Object.keys(availableAutoUSNs).length > 0 && (
                                <TableContainer component={Paper} sx={{ mt: 2 }}>
                                    <Typography variant="h6" align="center" sx={{ mb: 2 }}>
                                        USN Table
                                    </Typography>
                                    <Table size="small" aria-label="auto usn table">
                                        <TableHead>
                                            <TableRow>
                                                <StyledTableCell>Auto USN</StyledTableCell>
                                                <StyledTableCell>Manual USN</StyledTableCell>
                                                <StyledTableCell>Defect Location</StyledTableCell>
                                                <StyledTableCell>Defect Symptoms</StyledTableCell>
                                                <StyledTableCell>ERR Code</StyledTableCell>
                                                <StyledTableCell>Spec</StyledTableCell>
                                                <StyledTableCell>Actual</StyledTableCell>
                                                <StyledTableCell>Defect Image</StyledTableCell>
                                                <StyledTableCell>Result</StyledTableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {Object.entries(availableAutoUSNs).map(([usnKey, usnValue]) => (
                                                <StyledTableRow key={usnKey}>
                                                    <TableCell sx={{ color: usnValue.matched ? "green" : "" }}>{usnKey}</TableCell>
                                                    <TableCell sx={{ color: usnValue.matched ? "green" : usnValue.manualUsn === "Not Available" ? "red" : "" }}>
                                                        {
                                                            usnValue?.manualUsn ? (
                                                                usnValue.manualUsn
                                                            ) : (
                                                                <Button variant="outlined" color="error" size="small" onClick={() => handleNotAvailable(usnKey)}>
                                                                    Not available
                                                                </Button>
                                                            )
                                                        }
                                                    </TableCell>
                                                    <TableCell>
                                                        {usnKey === usnValue.manualUsn &&
                                                            <>
                                                                <select
                                                                    value={usnValue?.defectLocation || ""}
                                                                    onChange={(e) => handleDefectChange(usnKey, "defectLocation", e.target.value)}
                                                                    style={{ width: '100%', border: "1px solid #64b5f6", padding: "2px", borderRadius: "4px" }}
                                                                >
                                                                    <option value="">Select Defect Location</option>
                                                                    {DefectLocation.map((location) => (
                                                                        <option key={location} value={location}>{location}</option>
                                                                    ))}
                                                                </select>
                                                                {usnValue?.defectLocation === "Other" && (
                                                                    <input
                                                                        type="text"
                                                                        placeholder="Enter Defect Location"
                                                                        value={usnValue?.customLocation || ""}
                                                                        onChange={(e) => handleDefectChange(usnKey, "customLocation", e.target.value)}
                                                                        style={{ width: '100%', border: "1px solid #64b5f6", padding: "2px", borderRadius: "4px", marginTop: "4px" }}
                                                                    />
                                                                )}
                                                            </>
                                                        }
                                                    </TableCell>
                                                    <TableCell>
                                                        {usnKey === usnValue.manualUsn &&
                                                            <>
                                                                <select
                                                                    value={usnValue?.defectSymptoms || ""}
                                                                    onChange={(e) => handleDefectChange(usnKey, "defectSymptoms", e.target.value)}
                                                                    style={{ width: '100%', border: "1px solid #64b5f6", padding: "2px", borderRadius: "4px" }}
                                                                >
                                                                    <option value="">Select Defect Symptoms</option>
                                                                    {DefectSymptoms.map((symptom) => (
                                                                        <option key={symptom} value={symptom}>{symptom}</option>
                                                                    ))}
                                                                </select>
                                                                {usnValue?.defectSymptoms === "Other" && (
                                                                    <input
                                                                        type="text"
                                                                        placeholder="Enter Defect Symptoms"
                                                                        value={usnValue?.customSymptoms || ""}
                                                                        onChange={(e) => handleDefectChange(usnKey, "customSymptoms", e.target.value)}
                                                                        style={{ width: '100%', border: "1px solid #64b5f6", padding: "2px", borderRadius: "4px", marginTop: "4px" }}
                                                                    />
                                                                )}
                                                            </>
                                                        }
                                                    </TableCell>
                                                    <TableCell>
                                                        {usnValue?.defectLocation === "Other" || usnValue?.defectSymptoms === "Other" ? (
                                                            <input
                                                                type="text"
                                                                placeholder="Enter ERR Code"
                                                                value={usnValue?.errCode || ""}
                                                                onChange={(e) => handleDefectChange(usnKey, "errCode", e.target.value)}
                                                                style={{ width: '100%', border: "1px solid #64b5f6", padding: "2px", borderRadius: "4px" }}
                                                            />
                                                        ) : (
                                                            usnValue?.errCode || ""
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {usnValue?.defectLocation === "Other" || usnValue?.defectSymptoms === "Other" ? (
                                                            <input
                                                                type="text"
                                                                placeholder="Enter Spec"
                                                                value={usnValue?.spec || ""}
                                                                onChange={(e) => handleDefectChange(usnKey, "spec", e.target.value)}
                                                                style={{ width: '100%', border: "1px solid #64b5f6", padding: "2px", borderRadius: "4px" }}
                                                            />
                                                        ) : (
                                                            usnValue?.spec || ""
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {usnKey === usnValue.manualUsn &&
                                                            <input
                                                                type="text"
                                                                placeholder="Enter Actual"
                                                                value={usnValue?.actual || ""}
                                                                onChange={(e) => handleDefectChange(usnKey, "actual", e.target.value)}
                                                                style={{ width: '100%', border: "1px solid #64b5f6", padding: "2px", borderRadius: "4px" }}
                                                            />
                                                        }
                                                    </TableCell>
                                                    <TableCell align="center" style={{ position: "relative" }}>
                                                        {usnKey === usnValue.manualUsn ? (
                                                            usnValue?.image ? (
                                                                <div style={{ position: "relative", display: "inline-block" }}>
                                                                    <img
                                                                        src={usnValue?.image || ""}
                                                                        alt="Defect"
                                                                        style={{ maxHeight: "60px", display: "block" }}
                                                                    />
                                                                    <SensorOccupiedIcon
                                                                        sx={{
                                                                            position: "absolute",
                                                                            top: 0,
                                                                            right: 0,
                                                                            fontSize: "1rem",
                                                                            color: "purple",
                                                                            cursor: "pointer",
                                                                        }}
                                                                        onClick={() => handleOpenScanner(usnKey)}
                                                                    />
                                                                    <DeleteIcon
                                                                        sx={{
                                                                            position: "absolute",
                                                                            top: 0,
                                                                            left: 0,
                                                                            fontSize: "1rem",
                                                                            color: "red",
                                                                            cursor: "pointer",
                                                                        }}
                                                                        onClick={() => handleDeleteCapturedImage(usnKey)}
                                                                        disabled={!usnValue?.image}
                                                                    />
                                                                </div>
                                                            ) : (
                                                                <SensorOccupiedIcon
                                                                    color="secondary"
                                                                    onClick={usnValue?.result === "OK" ? undefined : () => handleOpenScanner(usnKey)}
                                                                    sx={{
                                                                        cursor: usnValue?.result === "OK" ? "not-allowed" : "pointer",
                                                                        opacity: usnValue?.result === "OK" ? 0.5 : 1
                                                                    }}
                                                                    disabled={usnValue?.result === "OK"}
                                                                />
                                                            )
                                                        ) : null}
                                                    </TableCell>
                                                    <TableCell align="center" sx={{ color: usnValue?.result === "OK" ? "green" : "red" }}>
                                                        {usnValue?.result || ""}
                                                    </TableCell>
                                                </StyledTableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button color="primary" variant="contained"
                        onClick={handleAddRecord}
                        disabled={
                            Object.keys(availableAutoUSNs).length === 0 ||
                            Object.values(availableAutoUSNs).some((usn) => !usn.manualUsn)
                        }>
                        Add Record
                    </Button>
                    <Button onClick={() => setDialogOpen(false)} color="primary">Close</Button>
                </DialogActions>
            </Dialog>

            {/* ANALYZE DIALOG */}
            <Dialog open={scanDialogOpen} onClose={handleScanDialogClose} maxWidth="xs" fullWidth>
                <DialogTitle>Scan USN</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 2 }}>
                        <Grid item size={{ xs: 12 }}>
                            <TextField
                                label="Manual USN"
                                value={manualUsn}
                                onChange={(e) => setManualUsn(e.target.value)}
                                fullWidth
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleScanDialogClose} color="error" variant="contained">Close</Button>
                    <Button onClick={handleAnalyze} color="primary" variant="contained">Analyze</Button>
                </DialogActions>
            </Dialog>

            {/* SCANNER DIALOG */}
            <Dialog open={scannerOpen} onClose={() => setscannerOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Scanner</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 2 }}>
                        <Grid item size={{ xs: 12 }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                                {isCameraActive && (
                                    <Webcam
                                        audio={false}
                                        height={200}
                                        screenshotFormat="image/jpeg"
                                        width="100%"
                                        videoConstraints={videoConstraints}
                                        ref={(webcam) => (window.webcam = webcam)}
                                    />
                                )}
                            </Box>
                            <Box
                                sx={{
                                    display: 'flex',
                                    flexDirection: { xs: 'column', sm: 'row' },
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    gap: 2,
                                    mt: 2,
                                }}
                            >
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={() => {
                                        setIsCameraActive(true);
                                        const imageSrc = window.webcam?.getScreenshot();
                                        if (imageSrc) {
                                            setUploadedImage(imageSrc);
                                            setIsCameraActive(false);
                                        }
                                    }}
                                    sx={{ flex: 1 }}
                                >
                                    Capture Image
                                </Button>
                                <Button
                                    variant="contained"
                                    color="secondary"
                                    onClick={() => setIsFrontCamera((prev) => !prev)}
                                    sx={{ flex: 1 }}
                                    disabled={!isCameraActive}
                                >
                                    Switch Camera
                                </Button>
                            </Box>
                        </Grid>
                        <Grid item size={{ xs: 12 }}>
                            {uploadedImage && (
                                <img
                                    src={uploadedImage}
                                    alt="Uploaded"
                                    style={{ maxHeight: '200px', marginTop: '10px' }}
                                />
                            )}
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => {
                            setscannerOpen(false);
                            setIsCameraActive(false);
                            setUploadedImage(null);
                        }}
                        color="error"
                        variant="contained"
                    >
                        Close
                    </Button>
                    <Button onClick={handleSaveCapturedImage} color="primary" variant="contained">
                        Save
                    </Button>
                </DialogActions>
            </Dialog>

            {/* SNACKBAR */}
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={6000}
                onClose={handleSnackbarClose}
                anchorOrigin={{ vertical: "top", horizontal: "right" }}
            >
                <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: "100%" }}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </Container>
    )
}

export default TrackingTable;
