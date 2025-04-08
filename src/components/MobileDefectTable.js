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

// const usnToMap = {
//     'SLGF-WV5RT-M2310': ["SLGF2WV5RT3", 'SFRWWL9X3T5', 'SFCWCX2XJMF', 'SFRWWL9XVV5', 'SGYL4KG6MTX'],
//     'ASP-N899I-JH12P': ["AS-G998U-L7MN54", 'AS-G998U-P9K7J2', 'AS-G998U-TW23K9'],
// }

const cartonToAutoUSNMap = {
    '8884620325076240': ["SLGF2WV5RT3", 'SFRWWL9X3T5', 'SFCWCX2XJMF', 'SFRWWL9XVV5', 'SGYL4KG6MTX'],
    '8884620325076241': ["AS-G998U-L7MN54", 'AS-G998U-P9K7J2', 'AS-G998U-TW23K9']
};

const MobileDefectTable = () => {
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


    const handleScanDialogOpen = () => {
        setScanDialogOpen(true);
    };

    const handleScanDialogClose = () => {
        setScanDialogOpen(false);
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
                symptoms: row["Symptoms "],
                errCode: row["ERR Code "],
                spec: row["Spec"],
                defectPic: row["Defect Pic"],
                actual: row["Actual"],
                status: row["Result"]
            });
        });
        const groupedArray = Object.values(groupedByKeys).sort((a, b) => {
            return new Date(b.date) - new Date(a.date);
        });

        setGroupedData(groupedArray);
    }, []); // Add any dependencies here if needed

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

    const mobileDefects = [
        {
            symptom: 'Display Dead Pixel',
            errCode: 'DP001',
            spec: '0 pixels',
            actual: () => `${Math.floor(Math.random() * 5) + 1} pixels`
        },
        {
            symptom: 'Touch Screen Sensitivity',
            errCode: 'TS002',
            spec: '≤ 0.05 sec response',
            actual: () => `${(Math.random() * 0.15 + 0.1).toFixed(2)} sec`
        },
        {
            symptom: 'Battery Connector Loose',
            errCode: 'BC003',
            spec: '2.5 N·m torque',
            actual: () => `${(Math.random() * 1 + 0.8).toFixed(1)} N·m`
        },
        {
            symptom: 'Camera Module Misalignment',
            errCode: 'CM004',
            spec: '+0.1 mm',
            actual: () => `${(Math.random() * 0.4 + 0.2).toFixed(2)} mm`
        },
        {
            symptom: 'Speaker Distortion',
            errCode: 'SD005',
            spec: '< 1% THD',
            actual: () => `${(Math.random() * 3 + 1.5).toFixed(1)}% THD`
        }
    ];

    const AnalyzeDefect = (manualUsn, image) => {
        const hasDefect = Math.random() < 0.2;
        const defect = hasDefect ? mobileDefects[Math.floor(Math.random() * mobileDefects.length)] : null;
        const result = hasDefect ? "NG" : "OK";
        return { manualUsn, image, defect, result };
    };


    const handleAnalyze = () => {
        if (!manualUsn || !uploadedImage) {
            showSnackbar("Please enter a Manual USN and upload an image.", "warning");
            return;
        }

        const analysis = AnalyzeDefect(manualUsn, uploadedImage);

        setAvailableAutoUSNs((prevUSNs) => {
            const updatedUSNs = { ...prevUSNs };

            if (updatedUSNs[manualUsn]) {
                updatedUSNs[manualUsn] = {
                    ...updatedUSNs[manualUsn],
                    manualUsn: manualUsn,
                    image: analysis.result === "NG" ? analysis.image : null,
                    symptoms: analysis.defect && analysis.defect.symptom ? analysis.defect.symptom : "-",
                    errCode: analysis.defect && analysis.defect.errCode ? analysis.defect.errCode : "-",
                    spec: analysis.defect && analysis.defect.spec ? analysis.defect.spec : "-",
                    actual: analysis.defect ? analysis.defect.actual() : "-",
                    result: analysis.result,
                };
            } else {
                const keys = Object.keys(updatedUSNs);
                const availableKeys = keys.filter((key) => {
                    const row = updatedUSNs[key];
                    return row.result !== "Mismatch";
                });

                if (availableKeys.length > 0) {
                    const randomKey = availableKeys[Math.floor(Math.random() * availableKeys.length)];
                    updatedUSNs[randomKey] = {
                        ...updatedUSNs[randomKey],
                        manualUsn: manualUsn,
                        image: analysis.result === "NG" ? analysis.image : null,
                        symptoms: analysis.defect && analysis.defect.symptom ? analysis.defect.symptom : "-",
                        errCode: analysis.defect && analysis.defect.errCode ? analysis.defect.errCode : "-",
                        spec: analysis.defect && analysis.defect.spec ? analysis.defect.spec : "-",
                        actual: analysis.defect ? analysis.defect.actual() : "-",
                        result: analysis.result,
                    };
                } else {
                    showSnackbar("No available rows to assign the mismatched USN.", "error");
                }
            }

            return updatedUSNs;
        });

        setManualUsn("");
        setUploadedImage(null);
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
            "Symptoms ": usnData.symptoms || "-",
            "ERR Code ": usnData.errCode || "-",
            Spec: usnData.spec || "-",
            "Defect Pic": usnData.image || null,
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

    console.log(Object.values(availableAutoUSNs).some((usn) => !usn.manualUsn), "Available Auto USNs:", availableAutoUSNs);

    return (
        <Container>
            <Box sx={{ width: '100%', position: 'relative', overflow: 'auto', mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'center' }}>
                    <Typography variant="h5" component="h2">
                        QIT - Digitalization 
                    </Typography>
                    <Button
                        variant="contained"
                        color="primary"
                        sx={{ marginLeft: 'auto' }}
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
                                <StyledTableCell>Symptoms</StyledTableCell>
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
                                        <TableCell>{item.symptoms}</TableCell>
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
            {/* Dialog */}
            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
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
                        {/* <Grid item size={{ xs: 12, md: 6 }}>
                            <FormControl fullWidth margin="dense">
                                <InputLabel>USN ID *</InputLabel>
                                <Select
                                    name="usnId"
                                    label="usn ID *"
                                    value={formData.usnId}
                                    onChange={handleInputChange}
                                    required
                                >
                                    {Object.keys(usnToMap).map((usnId) => (
                                        <MenuItem key={usnId} value={usnId}>{usnId}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid> */}
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
                        <Grid item size={{ xs: 12, md: 12 }}>
                            {Object.keys(availableAutoUSNs).length > 0 && (  // <- changed this
                                <TableContainer component={Paper} sx={{ mt: 2 }}>
                                    <Typography variant="h6" align="center" sx={{ mb: 2 }}>
                                        USN Table
                                    </Typography>
                                    <Table size="small" aria-label="auto usn table">
                                        <TableHead>
                                            <TableRow>
                                                <StyledTableCell>Auto USN</StyledTableCell>
                                                <StyledTableCell>Manual USN</StyledTableCell>
                                                <StyledTableCell>Image</StyledTableCell>
                                                <StyledTableCell>Symptoms</StyledTableCell>
                                                <StyledTableCell>ERR Code</StyledTableCell>
                                                <StyledTableCell>Spec</StyledTableCell>
                                                <StyledTableCell>Actual</StyledTableCell>
                                                <StyledTableCell>Result</StyledTableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {Object.entries(availableAutoUSNs).map(([usnKey, usnValue]) => (
                                                <StyledTableRow key={usnKey}>
                                                    <TableCell>{usnKey}</TableCell>
                                                    <TableCell sx={{ color: usnKey === usnValue.manualUsn ? "green" : "red" }}>
                                                        {usnValue.manualUsn || ""}
                                                    </TableCell>
                                                    <TableCell>
                                                        {usnValue.image && (
                                                            <img src={usnValue.image} alt="defect" style={{ maxHeight: '60px' }} />
                                                        )}
                                                    </TableCell>
                                                    <TableCell>{usnValue.symptoms || ""}</TableCell>
                                                    <TableCell>{usnValue.errCode || ""}</TableCell>
                                                    <TableCell>{usnValue.spec || ""}</TableCell>
                                                    <TableCell>{usnValue.actual || ""}</TableCell>
                                                    <TableCell sx={{ color: usnValue.result === "OK" ? "green" : "red" }}>
                                                        {usnValue.result || ""}
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
                    <Button onClick={handleAddRecord} color="primary" variant="contained" disabled={
                        Object.keys(availableAutoUSNs).length === 0 || // Disable if no rows exist
                        Object.values(availableAutoUSNs).some((usn) => !usn.manualUsn) // Disable if any row is missing a manualUsn
                    }>
                        Add Record
                    </Button>
                    <Button onClick={() => setDialogOpen(false)} color="primary">Close</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={scanDialogOpen} onClose={handleScanDialogClose} maxWidth="md" fullWidth>
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
                        <Grid item size={{ xs: 12, md: 6 }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                                <Webcam
                                    audio={false}
                                    height={200}
                                    screenshotFormat="image/jpeg"
                                    width="100%"
                                    videoConstraints={videoConstraints}
                                    ref={(webcam) => (window.webcam = webcam)}
                                />
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
                                        const imageSrc = window.webcam.getScreenshot();
                                        setUploadedImage(imageSrc);
                                    }}
                                    sx={{ flex: 1 }}
                                >
                                    Capture Image
                                </Button>
                                <Button
                                    variant="contained"
                                    color="secondary"
                                    onClick={() => setIsFrontCamera((prev) => !prev)} // Toggle between front and back cameras
                                    sx={{ flex: 1 }}
                                >
                                    Switch Camera
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
                                                };
                                                reader.readAsDataURL(file);
                                            }
                                        }}
                                    />
                                </Button>
                            </Box>
                        </Grid>
                        <Grid item size={{ xs: 12, md: 6 }}>
                            {uploadedImage && (
                                <img
                                    src={uploadedImage}
                                    alt="Uploaded"
                                    style={{ maxHeight: '200px', marginTop: '10px' }}
                                />
                            )}
                            {/* </Box> */}
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleAnalyze} color="primary" variant="contained">Analyze</Button>
                    <Button onClick={handleScanDialogClose} color="error" variant="contained">Close</Button>
                </DialogActions>
            </Dialog>
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
    );
};

export default MobileDefectTable;
