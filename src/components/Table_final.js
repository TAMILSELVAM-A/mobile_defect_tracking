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
import FlipCameraAndroidIcon from '@mui/icons-material/FlipCameraAndroid';
import Scanner from '@mui/icons-material/DocumentScanner';
import Navbar from "./Navbar";
import PlusIcon from '@mui/icons-material/Add';

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
    // '&:nth-of-type(odd)': {
    //     backgroundColor: '#f5f5f5',
    // },
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

const TableTracking2 = () => {
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
    const [scannerOpen, setscannerOpen] = useState(false);
    const [currentUsnKey, setCurrentUsnKey] = useState(null);
    const [stageFilter, setStageFilter] = useState("All");

    const filteredData = stageFilter === "All"
        ? groupedData
        : groupedData.filter(group => group.stage === stageFilter);

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

            const matchedKey = Object.entries(updatedUSNs).find(
                ([key, value]) => value.autousn.toLowerCase() === manualUsn.toLowerCase()
            )?.[0];
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
                category: row["Category"],
                defectSymptoms: row["Defect Symptoms"],
                defectLocation: row["Defect Location"],
                errCode: row["ERR Code "],
                spec: row["Spec"],
                defectPic: row["Defect Image"],
                actual: row["Actual"],
                status: row["Result"],
                containtment: row["Containment Action"],
                root_cause: row["Root Cause"],
                corect_to_cause: row["Correct to action"],
                four_m: row["4M"],
                ETC: row["ETC"],
                result_final: row["Result Final"],
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
            const formattedAutoUSNs = autoUSNs.reduce((acc, usn, index) => {
                acc[`scan${index + 1}`] = { autousn: usn };
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
            if (usnKey && updatedDetails[usnKey]) {
                updatedDetails[usnKey] = {
                    ...updatedDetails[usnKey],
                    defectLocation: "",
                    defectSymptoms: "",
                    category: "-",
                    errCode: "-",
                    spec: "-",
                    actual: "-",
                    image: null,
                    result: "",
                    notAvailable: true,
                    manualUsn: "Not Available",
                    containtment: "-",
                    root_cause: "-",
                    corect_to_cause: "-",
                    four_m: "-",
                    ETC: "-",
                    result_final: "-",
                };
            }
            return updatedDetails;
        });
    };

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
            "Auto USN": usnData.autousn,
            "Manual USN Scan": usnData.manualUsn || "-",
            "Category": usnData.category || "-",
            "Defect Location": usnData.defectLocation || "-",
            "Defect Symptoms": usnData.defectSymptoms || "-",
            "ERR Code ": usnData.errCode || "-",
            Spec: usnData.spec || "-",
            "Defect Image": usnData.image || null,
            Actual: usnData.actual || "-",
            Result: usnData.result || "-",
            "Containment Action": usnData.containtment || "-",
            "Root Cause": usnData.root_cause || "-",
            "Correct to action": usnData.corect_to_cause || "-",
            "4M": usnData.four_m || "-",
            ETC: usnData.ETC || "-",
            "Result Final": usnData.result_final || "-",
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

    const handleAddRowBelow = (usnKey, autousn, manualusn) => {
        setAvailableAutoUSNs((prevDetails) => {
            const updatedDetails = { ...prevDetails };

            const newRow = {
                defectLocation: "",
                defectSymptoms: "",
                errCode: "",
                spec: "",
                actual: "",
                image: null,
                result: "",
                autousn,
                manualUsn: manualusn,
                containtment: "",
                root_cause: "",
                corect_to_cause: "",
                four_m: "",
                ETC: "",
                result_final: "",
            };

            if (updatedDetails[usnKey]) {
                const currentRowIndex = Object.keys(updatedDetails).indexOf(usnKey);
                const updatedEntries = Object.entries(updatedDetails);
                updatedEntries.splice(currentRowIndex + 1, 0, [`${usnKey}-new`, newRow]);
                return Object.fromEntries(updatedEntries);
            }
            return updatedDetails;
        });
    };

    return (
        <>
            <Navbar />
            <Container maxWidth={"false"}>
                <Box sx={{ width: '100%', position: 'relative', overflow: 'auto', mt: 2, mb: 3 }}>
                    <Box sx={{
                        mb: 2,
                        display: "flex",
                        flexDirection: { xs: 'column', sm: 'row' },
                        alignItems: "center",
                        gap: 2 
                    }}>
                        <Typography
                            variant="h5"
                            component="h2"
                            sx={{
                                textAlign: "center",
                                flexGrow: 1,
                                order: { xs: 1, sm: 2 }, // Center on mobile, middle on desktop
                                width: { xs: '100%', sm: 'auto' } // Full width on mobile
                            }}
                        >
                            QIT - Digitalization
                        </Typography>

                        <Box sx={{
                            display: 'flex',
                            gap: 2,
                            width: { xs: '100%', sm: 'auto' },
                            order: { xs: 3, sm: 1 },
                            marginTop:2
                        }}>
                            <FormControl size="small" sx={{ minWidth: 200, flexGrow: { xs: 1, sm: 0 } }}>
                                <InputLabel>Filter by Stage</InputLabel>
                                <Select
                                    value={stageFilter}
                                    onChange={(e) => setStageFilter(e.target.value)}
                                    label="Filter by Stage"
                                >
                                    <MenuItem value="All">All</MenuItem>
                                    <MenuItem value="CM QIT">CM QIT</MenuItem>
                                    <MenuItem value="NOVA QIT">NOVA QIT</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>

                        <Box sx={{
                            order: { xs: 2, sm: 3 },
                            width: { xs: '100%', sm: 'auto' },
                            display: 'flex',
                            justifyContent: { xs: 'flex-end', sm: 'flex-start' }
                        }}>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleDialogOpen}
                                fullWidth={false}
                                sx={{
                                    whiteSpace: 'nowrap',
                                    width: { xs: '100%', sm: 'auto' } // Full width on mobile
                                }}
                            >
                                New Defect
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
                                    <StyledTableCell>ERR Code</StyledTableCell>
                                    <StyledTableCell>Spec</StyledTableCell>
                                    <StyledTableCell>Defect Pic</StyledTableCell>
                                    <StyledTableCell>Actual</StyledTableCell>
                                    <StyledTableCell>Status</StyledTableCell>
                                    <StyledTableCell>Containment Action</StyledTableCell>
                                    <StyledTableCell>Root Cause</StyledTableCell>
                                    <StyledTableCell>Correct to action</StyledTableCell>
                                    <StyledTableCell>4M</StyledTableCell>
                                    <StyledTableCell>ETC</StyledTableCell>
                                    <StyledTableCell>Result</StyledTableCell>
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
                                                    <TableCell>{item.category}</TableCell>
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
                                                        )}
                                                    </TableCell>
                                                    <TableCell>{item.actual}</TableCell>
                                                    <TableCell sx={{ color: item.status === "OK" ? "green" : "red" }}>{item.status}</TableCell>
                                                    <TableCell>{item.containtment}</TableCell>
                                                    <TableCell>{item.root_cause}</TableCell>
                                                    <TableCell>{item.corect_to_cause}</TableCell>
                                                    <TableCell>{item.four_m}</TableCell>
                                                    <TableCell>{item.ETC}</TableCell>
                                                    <TableCell>{item.result_final}</TableCell>
                                                </StyledTableRow>
                                            ))
                                        ))
                                    ))
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
                <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xl" fullWidth>
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
                                    <InputLabel>Station *</InputLabel>
                                    <Select
                                        name="stage"
                                        label="Station *"
                                        value={formData.stage}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        <MenuItem value="CM QIT"> CM QIT </MenuItem>
                                        <MenuItem value="NOVA QIT"> NOVA QIT</MenuItem>
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
                                        startIcon={<Scanner sx={{ textAlign: "center" }} />}
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
                                                    <StyledTableCell>Category</StyledTableCell>
                                                    <StyledTableCell>Defect Location</StyledTableCell>
                                                    <StyledTableCell>Defect Symptoms</StyledTableCell>
                                                    <StyledTableCell>ERR Code</StyledTableCell>
                                                    <StyledTableCell>Spec</StyledTableCell>
                                                    <StyledTableCell>Actual</StyledTableCell>
                                                    <StyledTableCell>Defect Image</StyledTableCell>
                                                    <StyledTableCell>Result</StyledTableCell>
                                                    <StyledTableCell>Containment Action</StyledTableCell>
                                                    <StyledTableCell>Root Cause</StyledTableCell>
                                                    <StyledTableCell>Correct to action</StyledTableCell>
                                                    <StyledTableCell>4M</StyledTableCell>
                                                    <StyledTableCell>ETC</StyledTableCell>
                                                    <StyledTableCell>Result</StyledTableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {Object.entries(availableAutoUSNs).map(([usnKey, usnValue]) => (
                                                    <StyledTableRow key={usnKey}>
                                                        <TableCell sx={{ color: usnValue.matched ? "green" : "" }}>{usnValue.autousn}</TableCell>
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
                                                            {usnValue.autousn === usnValue.manualUsn && (
                                                                <select
                                                                    value={usnValue?.category || ""}
                                                                    onChange={(e) => handleDefectChange(usnKey, "category", e.target.value)}
                                                                    style={{ width: '100%', border: "1px solid #64b5f6", padding: "2px", borderRadius: "4px" }}
                                                                >
                                                                    <option value="">Select Category</option>
                                                                    {["category 1", "category 2", "category 3"].map((symptom) => (
                                                                        <option key={symptom} value={symptom}>{symptom}</option>
                                                                    ))}
                                                                </select>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            {usnValue.autousn === usnValue.manualUsn &&
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
                                                            {usnValue.autousn === usnValue.manualUsn &&
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
                                                            {usnValue.autousn === usnValue.manualUsn &&
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
                                                            {usnValue.autousn === usnValue.manualUsn ? (
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
                                                        <TableCell align="center">
                                                            {usnValue?.result &&
                                                                <select
                                                                    value={usnValue?.result || ""}
                                                                    onChange={(e) => handleDefectChange(usnKey, "result", e.target.value)}
                                                                    style={{ width: '100%', border: "1px solid #64b5f6", padding: "2px", borderRadius: "4px", color: usnValue?.result === "OK" ? "green" : usnValue?.result === "NG" ? "red" : "" }}
                                                                >
                                                                    <option value="">Select Defect Result</option>
                                                                    {["OK", "NG", "Observing"].map((symptom) => (
                                                                        <option key={symptom} value={symptom}>{symptom}</option>
                                                                    ))}
                                                                </select>
                                                            }
                                                        </TableCell>
                                                        <TableCell>
                                                            {usnValue.autousn === usnValue.manualUsn &&
                                                                <input
                                                                    type="text"
                                                                    placeholder="Containment Action"
                                                                    value={usnValue?.containtment || ""}
                                                                    onChange={(e) => handleDefectChange(usnKey, "containtment", e.target.value)}
                                                                    style={{ width: '100%', border: "1px solid #64b5f6", padding: "2px", borderRadius: "4px" }}
                                                                />
                                                            }
                                                        </TableCell>
                                                        <TableCell>
                                                            {usnValue.autousn === usnValue.manualUsn &&
                                                                <input
                                                                    type="text"
                                                                    placeholder="Root Cause"
                                                                    value={usnValue?.root_cause || ""}
                                                                    onChange={(e) => handleDefectChange(usnKey, "root_cause", e.target.value)}
                                                                    style={{ width: '100%', border: "1px solid #64b5f6", padding: "2px", borderRadius: "4px" }}
                                                                />
                                                            }
                                                        </TableCell>
                                                        <TableCell>
                                                            {usnValue.autousn === usnValue.manualUsn &&
                                                                <input
                                                                    type="text"
                                                                    placeholder="Correct to action"
                                                                    value={usnValue?.corect_to_cause || ""}
                                                                    onChange={(e) => handleDefectChange(usnKey, "corect_to_cause", e.target.value)}
                                                                    style={{ width: '100%', border: "1px solid #64b5f6", padding: "2px", borderRadius: "4px" }}
                                                                />
                                                            }
                                                        </TableCell>
                                                        <TableCell>
                                                            {usnValue.autousn === usnValue.manualUsn &&
                                                                <input
                                                                    type="text"
                                                                    placeholder="4M"
                                                                    value={usnValue?.four_m || ""}
                                                                    onChange={(e) => handleDefectChange(usnKey, "four_m", e.target.value)}
                                                                    style={{ width: '100%', border: "1px solid #64b5f6", padding: "2px", borderRadius: "4px" }}
                                                                />
                                                            }
                                                        </TableCell>
                                                        <TableCell>
                                                            {usnValue.autousn === usnValue.manualUsn &&
                                                                <input
                                                                    type="text"
                                                                    placeholder="ETC"
                                                                    value={usnValue?.ETC || ""}
                                                                    onChange={(e) => handleDefectChange(usnKey, "ETC", e.target.value)}
                                                                    style={{ width: '100%', border: "1px solid #64b5f6", padding: "2px", borderRadius: "4px" }}
                                                                />
                                                            }
                                                        </TableCell>
                                                        <TableCell>
                                                            {usnValue.autousn === usnValue.manualUsn &&
                                                                <>
                                                                    <select
                                                                        value={usnValue?.result_final || ""}
                                                                        onChange={(e) => handleDefectChange(usnKey, "result_final", e.target.value)}
                                                                        style={{ width: '100%', border: "1px solid #64b5f6", padding: "2px", borderRadius: "4px" }}
                                                                    >
                                                                        <option value="">Select Defect Result</option>
                                                                        {["On going", "Monitoring", "Closed"].map((symptom) => (
                                                                            <option key={symptom} value={symptom}>{symptom}</option>
                                                                        ))}
                                                                    </select>
                                                                </>
                                                            }
                                                        </TableCell>
                                                        {usnValue.autousn === usnValue.manualUsn && (
                                                            <TableCell>
                                                                <PlusIcon
                                                                    color="primary"
                                                                    sx={{ cursor: "pointer" }}
                                                                    onClick={() => handleAddRowBelow(usnKey, usnValue.autousn, usnValue.manualUsn)}
                                                                />
                                                            </TableCell>
                                                        )
                                                        }
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
                            <Grid item size={{ xs: 12, md: 12 }} sx={{ position: 'relative' }}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                                    {/* Render Webcam only if isCameraActive is true */}
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
                                    {isCameraActive &&
                                        <FlipCameraAndroidIcon
                                            onClick={() => setIsFrontCamera((prev) => !prev)}
                                            sx={{
                                                position: 'absolute',
                                                top: 10,
                                                right: 10,
                                                fontSize: '2rem',
                                                color: 'white',
                                                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                                borderRadius: '50%',
                                                padding: '5px',
                                                cursor: 'pointer',
                                            }}
                                        />
                                    }
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
                                            setIsCameraActive(true); // Activate the camera
                                            const imageSrc = window.webcam?.getScreenshot();
                                            if (imageSrc) {
                                                setUploadedImage(imageSrc);
                                                setIsCameraActive(false); // Deactivate the camera after capturing
                                            }
                                        }}
                                        sx={{ flex: 1 }}
                                    >
                                        Capture Image
                                    </Button>
                                    <Button
                                        variant="contained"
                                        component="label"
                                        color="secondary"
                                        sx={{ flex: 1 }}
                                    >
                                        Upload Image
                                        <input
                                            type="file"
                                            accept="image/*"
                                            hidden
                                            onChange={(e) => {
                                                const file = e.target.files[0];
                                                if (file) {
                                                    const reader = new FileReader();
                                                    reader.onload = (event) => {
                                                        setUploadedImage(event.target.result);
                                                        setIsCameraActive(false); // Deactivate the camera after uploading
                                                    };
                                                    reader.readAsDataURL(file);
                                                }
                                            }}
                                        />
                                    </Button>
                                </Box>
                            </Grid>
                            <Grid item size={{ xs: 12, md: 12 }}>
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
            </Container >
        </>
    )

}


export default TableTracking2;