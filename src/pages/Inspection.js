import React, { useState } from "react";
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
    CircularProgress,
    IconButton
} from "@mui/material";
import Webcam from "react-webcam";
import SensorOccupiedIcon from '@mui/icons-material/SensorOccupied';
import DeleteIcon from '@mui/icons-material/DeleteOutlineOutlined';
import FlipCameraAndroidIcon from '@mui/icons-material/FlipCameraAndroid';
import Scanner from '@mui/icons-material/DocumentScanner';
import PlusIcon from '@mui/icons-material/Add';
import axios from "axios";
import { Home } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import LimitSampleImage from "../assets/Dimple .jpg";

const StyledTableCell = styled(TableCell)(({ theme }) => ({
    backgroundColor: '#64b5f6',
    color: 'white',
    fontWeight: 'bold',
    padding: '8px 16px',
    borderRight: '1px solid white',
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

const CategoryWiseDefects = {
    CG: {
        locations: ["D5","Other"],
        symptoms: ["Bump", "Scratch","Other"]
    },
    HSG: {
        locations: ["CL6","Other"],
        symptoms: ["Dent","Other"]
    },
    BG: {
        locations: ["H6", "RCam","Other"],
        symptoms: ["Dent", "Barrel Scratch","Other"]
    },
    LidBox: {
        locations: ["Logo","Other"],
        symptoms: ["Dimple","Other"]
    }
};

const ErrorCodeRules = {
    "CG": {
        "D5": {
            "Scratch": { errCode: "D5SC", spec: "≤10mm x5, no crossing" },
            "Bump": { errCode: "D5BU", spec: "< 0.01mm² x5, distance ≥ 5mm" }
        }
    },
    "HSG": {
        "CL6": {
            "Dent": { errCode: "CL6DE", spec: "≤0.02mm² x2 per side, distance ≥ 10mm or >0.02mm² ~ 0.10mm² x1 per side No metal exposed allowed" }
        }
    },
    "BG": {
        "H6": {
            "Dent": { errCode: "H6DE", spec: "≤0.02mm² x3 or ≤0.08mm² x2, distance ≥ 5mm" }
        },
        "RCam": {
            "Barrel Scratch": { errCode: "RCBSC", spec: "Limit sample x1" }
        }
    },
    "LidBox": {
        "Logo": {
            "Dimple": { errCode: "LSCR01", spec: "1, No worse than limit sample. 2, W⩽0.25mm.3, Cum Length⩽5mm." }
        }
    }
};


const Categories = ["CG", "HSG", "BG", "LidBox"];
// const DefectSymptoms = ["Dent", "Camera", "Scratches", "Crack", "Dimple", "RCam", "N/A", "Other"];
// const DefectLocation = ["DL1", "DL2", "DL3", "DL4", "N/A", "Logo", "Barrel Scratch", "Other"];

// const DefectCombinations = {};

// DefectSymptoms.forEach((symptom, sIndex) => {
//     DefectLocation.forEach((location, lIndex) => {
//         const key = `${symptom}-${location}`;
//         let errCode, spec, actual;

//         if (symptom === "N/A" && location === "N/A") {
//             errCode = "-";
//             spec = "-";
//             actual = "-";
//         } else {
//             errCode = `${symptom.slice(0, 2).toUpperCase()}${(lIndex + 1).toString().padStart(2, '0')}`;
//             switch (symptom) {
//                 case "Dent":
//                     spec = "0 mm depth";
//                     actual = "0.5 mm depth";
//                     break;
//                 case "Camera":
//                     spec = "0 dead pixels";
//                     actual = "2 dead pixels";
//                     break;
//                 case "Scratches":
//                     spec = "0 scratches";
//                     actual = "3 scratches";
//                     break;
//                 case "Crack":
//                     spec = "0 mm length";
//                     actual = "5.2 mm length";
//                     break;
//                 case "Dimple":
//                     spec = "0.25 mm length";
//                     actual = "<5 mm length";
//                     break;
//                 default:
//                     spec = "";
//                     actual = "";
//             }
//         }

//         DefectCombinations[key] = {
//             errCode,
//             spec,
//             actual
//         };
//     });
// });

// function getDefectInfo(symptom, location) {
//     const key = `${symptom}-${location}`;

//     if (DefectCombinations[key]) {
//         return DefectCombinations[key];
//     }

//     return {
//         errCode: "DFXX",
//         spec: "Unknown defect",
//         actual: "Undefined combination"
//     };
// }

const Inspection = () => {
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
    const [LimitSampleImagePreview, setLimitSampleImagePreview] = useState(null);
    const [scanDialogOpen, setScanDialogOpen] = useState(false);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [snackbarSeverity, setSnackbarSeverity] = useState("info");
    const [isFrontCamera, setIsFrontCamera] = useState(true);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [scannerOpen, setscannerOpen] = useState(false);
    const [LimitSampleOpen, setLimitSampleOpen] = useState(false);
    const [currentUsnKey, setCurrentUsnKey] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    // const fileInputRefs = useRef({});

    // const handleLimitSampleIconClick = (usnKey) => {
    //     const inputRef = fileInputRefs.current[usnKey];
    //     if (inputRef) {
    //         inputRef.click();
    //     }
    // };

    const getColor = (value) => {
        if (value === "Pass") return "green";
        if (value === "Fail") return "red";
        if (value === "Observation") return "black";
        return "#000";
    };

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
                    pass_fail: 'Pass',
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

            if (field === "pass_fail") {
                if (value === "Fail" || value === "Observation") {
                    updatedDetails[usnKey][field] = value;
                }
                else if (value === "Pass") {
                    updatedDetails[usnKey] = {
                        ...updatedDetails[usnKey],
                        defectLocation: "",
                        defectSymptoms: "",
                        category: "",
                        errCode: "",
                        spec: "",
                        actual: "",
                        image: null,
                        result: "",
                        containtment: "",
                        root_cause: "",
                        corect_to_cause: "",
                        four_m: "",
                        ETC: "",
                        result_final: "",
                        limit_sample_image: null,
                        pass_fail: "Pass",
                    };
                }
            }

            if (field === "defectLocation" || field === "defectSymptoms") {
                const { defectLocation, defectSymptoms, category } = updatedDetails[usnKey];
                // if (defectLocation !== "Other" && defectSymptoms !== "Other" && defectLocation && defectSymptoms) {
                //     const defectInfo = ErrorCodeRules?.[category]?.[defectLocation]?.[defectSymptoms] || "";
                //     updatedDetails[usnKey] = {
                //         ...updatedDetails[usnKey],
                //         errCode: defectInfo.errCode,
                //         spec: defectInfo.spec
                //     };
                // }
                if (defectLocation && defectSymptoms) {
                    const match = ErrorCodeRules?.[category]?.[defectLocation]?.[defectSymptoms];
                    if (match) {
                        setAvailableAutoUSNs((prevDetails) => {
                            const updatedDetails = { ...prevDetails };
                            if (!updatedDetails[usnKey]) {
                                updatedDetails[usnKey] = {};
                            }
                            updatedDetails[usnKey] = {
                                ...updatedDetails[usnKey],
                                errCode: match.errCode,
                                spec: match.spec,
                            };
                            return updatedDetails;
                        });
                    }
                    if(defectLocation === "" || defectSymptoms === "") {
                        updatedDetails[usnKey].result = "NG";
                        setAvailableAutoUSNs((prevDetails) => {
                            const updatedDetails = { ...prevDetails };
                            if (!updatedDetails[usnKey]) {
                                updatedDetails[usnKey] = {};
                            }
                            updatedDetails[usnKey].spec = "";
                            updatedDetails[usnKey].errCode = "";
                            return updatedDetails;
                        });
                    }
                    // if (defectLocation === "N/A" && defectSymptoms === "N/A") {
                    //     updatedDetails[usnKey].result = "OK";
                    //     setAvailableAutoUSNs((prevDetails) => {
                    //         const updatedDetails = { ...prevDetails };
                    //         if (!updatedDetails[usnKey]) {
                    //             updatedDetails[usnKey] = {};
                    //         }
                    //         updatedDetails[usnKey].limit_sample_image = null;
                    //         return updatedDetails;
                    //     });
                    // }
                    if ((defectLocation === "Logo" && defectSymptoms === "Dimple") ||
                        (defectLocation === "RCam" && defectSymptoms === "Barrel Scratch")) {
                        const uploadedImageSrc = LimitSampleImage;
                        setAvailableAutoUSNs((prevDetails) => {
                            const updatedDetails = { ...prevDetails };
                            if (!updatedDetails[usnKey]) {
                                updatedDetails[usnKey] = {};
                            }
                            updatedDetails[usnKey].limit_sample_image = uploadedImageSrc;
                            return updatedDetails;
                        });
                    }
                    else {
                        updatedDetails[usnKey].result = "NG";
                        setAvailableAutoUSNs((prevDetails) => {
                            const updatedDetails = { ...prevDetails };
                            if (!updatedDetails[usnKey]) {
                                updatedDetails[usnKey] = {};
                            }
                            updatedDetails[usnKey].limit_sample_image = null;
                            return updatedDetails;
                        });
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

    const handleOpenScanner = (usnKey, image) => {
        setscannerOpen(true);
        setCurrentUsnKey(usnKey);
        setUploadedImage(image)
    };

    const handleLimitSmapleImage = (usnKey, image) => {
        setCurrentUsnKey(usnKey);
        setLimitSampleOpen(true);
        setLimitSampleImagePreview(image);
        // const file = event.target.files[0];
        // if (file) {
        //     const reader = new FileReader();
        //     reader.onload = (event) => {
        //         const uploadedImageSrc = event.target.result;
        //         setAvailableAutoUSNs((prevDetails) => {
        //             const updatedDetails = { ...prevDetails };
        //             if (!updatedDetails[usnKey]) {
        //                 updatedDetails[usnKey] = {};
        //             }
        //             updatedDetails[usnKey].limit_sample_image = uploadedImageSrc;
        //             return updatedDetails;
        //         });
        //     };
        //     reader.readAsDataURL(file);
        // }
    }


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
                    pass_fail: ""
                };
            }
            return updatedDetails;
        });
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

    const handleDeleteLimitSampleImage = (usnKey) => {
        setAvailableAutoUSNs((prevDetails) => {
            const updatedDetails = { ...prevDetails };
            if (usnKey) {
                updatedDetails[usnKey].limit_sample_image = null;
            }
            return updatedDetails;
        });
    }

    const getTodayDate = () => {
        const today = new Date();

        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const year = today.getFullYear();

        // let hours = today.getHours();
        // const minutes = String(today.getMinutes()).padStart(2, '0');
        // const ampm = hours >= 12 ? 'PM' : 'AM';

        // hours = hours % 12;
        // hours = hours ? hours : 12;
        // const formattedHours = String(hours).padStart(2, '0');

        const date = `${year}-${month}-${day}`;
        // const time = `${formattedHours}:${minutes} ${ampm}`;

        return `${date}`;
    };

    const handleScanDialogOpen = () => {
        setScanDialogOpen(true);
    };

    const handleScanDialogClose = () => {
        setScanDialogOpen(false);
    };

    const handleAddRecord = async () => {
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
            "Limit Sample Images": usnData.limit_sample_image,
            "Manual USN Scan": usnData.manualUsn || "",
            "Category": usnData.category || "",
            "Defect Location": usnData.defectLocation || "",
            "Defect Symptoms": usnData.defectSymptoms || "",
            "ERR Code ": usnData.errCode || "",
            Spec: usnData.spec || "",
            "Defect Image": usnData.image || null,
            Actual: usnData.actual || "",
            Result: usnData.result || "",
            "Containment Action ": usnData.containtment || "",
            "Root cause": usnData.root_cause || "",
            "Correct to action": usnData.corect_to_cause || "",
            "4M": usnData.four_m || "",
            ETC: usnData.ETC || "",
            "Pass/Fail": usnData.pass_fail || "",
            "Result Final": usnData.result_final || "",
        }));

        try {
            setLoading(true);
            for (const record of newRecords) {
                await axios.post("https://api.sheetbest.com/sheets/7b92eee8-164d-4bcf-9306-8375407ff476", record);
            }
            showSnackbar("Records added successfully!", "success");
            setAvailableAutoUSNs({});
            setFormData({
                project: "",
                stage: "",
                line: "",
                shift: "",
                cartonId: "",
            });
            setManualUsn("");
        } catch (error) {
            console.error("Error:", error);
            showSnackbar("Failed to add some or all records.", "error");
            setLoading(false)
        }
        finally {
            setLoading(false)
        }
    };


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
                limit_sample_image: null,
                result: "",
                autousn,
                manualUsn: manualusn,
                containtment: "",
                root_cause: "",
                corect_to_cause: "",
                four_m: "",
                ETC: "",
                result_final: "",
                pass_fail: "Pass",
                additionalDefectRow: true,
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

    const handleDeleteAdditionalRow = (usnkey) => {
        setAvailableAutoUSNs((prevDetails) => {
            const updatedDetails = { ...prevDetails };
            if (usnkey && updatedDetails[usnkey]) {
                delete updatedDetails[usnkey]
            }
            return updatedDetails;
        })
    }

    return (
        <Container maxWidth={"false"}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Typography variant="h4" gutterBottom sx={{ mt: 2 }}>
                    Inspection
                </Typography>
                <Button startIcon={<Home />} variant="contained" onClick={() => { navigate("/home") }}>
                    Home
                </Button>
            </Box>
            <Box sx={{ padding: 2, border: "1px solid #ccc", borderRadius: "8px", backgroundColor: "#f9f9f9" }}>
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
                    <Grid item size={{ xs: 6, md: 5 }}>
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
                    <Grid item size={{ xs: 6, md: 1 }} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <Button
                            variant="contained"
                            color="primary"
                            // size="large"
                            onClick={handleScanDialogOpen}
                            startIcon={<Scanner sx={{ textAlign: "center" }} />}
                            disabled={!formData.cartonId}
                            sx={{
                                textAlign: 'center',
                            }}
                            fullWidth
                        >
                            Scan USN
                        </Button>
                    </Grid>
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
                                            {/* <StyledTableCell>Result</StyledTableCell> */}
                                            <StyledTableCell>Pass/Fail</StyledTableCell>
                                            <StyledTableCell>Category</StyledTableCell>
                                            <StyledTableCell>Defect Location</StyledTableCell>
                                            <StyledTableCell>Defect Symptoms</StyledTableCell>
                                            <StyledTableCell>ERR Code</StyledTableCell>
                                            <StyledTableCell>Limit Sample Image</StyledTableCell>
                                            <StyledTableCell>Spec</StyledTableCell>
                                            <StyledTableCell>Actual</StyledTableCell>
                                            <StyledTableCell>Defect Image</StyledTableCell>
                                            <StyledTableCell>Containment Action</StyledTableCell>
                                            <StyledTableCell>Root Cause</StyledTableCell>
                                            <StyledTableCell>Correct to action</StyledTableCell>
                                            <StyledTableCell>4M</StyledTableCell>
                                            <StyledTableCell>ETC</StyledTableCell>
                                            <StyledTableCell>Status</StyledTableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {Object.entries(availableAutoUSNs).map(([usnKey, usnValue]) => (
                                            <StyledTableRow key={usnKey}>
                                                <TableCell sx={{ color: usnValue.matched ? "green" : usnValue?.additionalDefectRow ? "lightgreen" : "" }}>{usnValue.autousn}</TableCell>
                                                <TableCell sx={{ color: usnValue.matched ? "green" : usnValue.manualUsn === "Not Available" ? "red" : usnValue?.additionalDefectRow ? "lightgreen" : "" }}>
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
                                                {/* <TableCell align="center">
                                                    {usnValue?.result &&
                                                        <select
                                                            value={usnValue?.result || ""}
                                                            onChange={(e) => handleDefectChange(usnKey, "result", e.target.value)}
                                                            disabled={usnValue?.pass_fail === "Pass"}
                                                            style={{ width: '100%', border: "1px solid #64b5f6", padding: "2px", borderRadius: "4px", color: usnValue?.result === "OK" ? "green" : usnValue?.result === "NG" ? "red" : "" }}
                                                        >
                                                            <option value="-">Select Defect Result</option>
                                                            {["OK", "NG", "Observing"].map((symptom) => (
                                                                <option key={symptom} value={symptom}>{symptom}</option>
                                                            ))}
                                                        </select>
                                                    }
                                                </TableCell> */}
                                                <TableCell>
                                                    {usnValue.autousn === usnValue.manualUsn && (
                                                        <select
                                                            value={usnValue?.pass_fail || "Pass"}
                                                            onChange={(e) => handleDefectChange(usnKey, "pass_fail", e.target.value)}
                                                            style={{
                                                                width: '100%',
                                                                border: "1px solid #64b5f6",
                                                                padding: "2px",
                                                                borderRadius: "4px",
                                                                color: getColor(usnValue?.pass_fail || "Pass")
                                                            }}
                                                        >
                                                            <option value="">Select Pass/Fail</option>
                                                            {["Pass", "Fail", "Observation"].map((symptom) => {
                                                                let color = "";
                                                                if (symptom === "Pass") color = "green";
                                                                else if (symptom === "Fail") color = "red";
                                                                else color = "black";
                                                                return (
                                                                    <option key={symptom} value={symptom} style={{ color }}>
                                                                        {symptom}
                                                                    </option>
                                                                );
                                                            })}
                                                        </select>

                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {usnValue.autousn === usnValue.manualUsn && (
                                                        <select
                                                            value={usnValue?.category || ""}
                                                            disabled={usnValue?.pass_fail === "Pass"}
                                                            onChange={(e) => handleDefectChange(usnKey, "category", e.target.value)}
                                                            style={{ width: '100%', border: "1px solid #64b5f6", padding: "2px", borderRadius: "4px" }}
                                                        >
                                                            <option value="">Select Category</option>
                                                            {Categories.map((symptom) => (
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
                                                                disabled={usnValue?.pass_fail === "Pass"}
                                                                onChange={(e) => handleDefectChange(usnKey, "defectLocation", e.target.value)}
                                                                style={{ width: '100%', border: "1px solid #64b5f6", padding: "2px", borderRadius: "4px" }}
                                                            >
                                                                <option value="">Select Defect Location</option>
                                                                {(CategoryWiseDefects[usnValue.category]?.locations || []).map((location) => (
                                                                    <option key={location} value={location}>{location}</option>
                                                                ))}
                                                            </select>
                                                            {usnValue?.defectLocation === "Other" && (
                                                                <input
                                                                    type="text"
                                                                    disabled={usnValue?.pass_fail === "Pass"}
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
                                                                disabled={usnValue?.pass_fail === "Pass"}
                                                                onChange={(e) => handleDefectChange(usnKey, "defectSymptoms", e.target.value)}
                                                                style={{ width: '100%', border: "1px solid #64b5f6", padding: "2px", borderRadius: "4px" }}
                                                            >
                                                                <option value="">Select Defect Symptoms</option>
                                                                {(CategoryWiseDefects[usnValue.category]?.symptoms || []).map((symptom) => (
                                                                    <option key={symptom} value={symptom}>{symptom}</option>
                                                                ))}
                                                            </select>
                                                            {usnValue?.defectSymptoms === "Other" && (
                                                                <input
                                                                    type="text"
                                                                    disabled={usnValue?.pass_fail === "Pass"}
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
                                                            disabled={usnValue?.pass_fail === "Pass"}
                                                            placeholder="Enter ERR Code"
                                                            value={usnValue?.errCode || ""}
                                                            onChange={(e) => handleDefectChange(usnKey, "errCode", e.target.value)}
                                                            style={{ width: '100%', border: "1px solid #64b5f6", padding: "2px", borderRadius: "4px" }}
                                                        />
                                                    ) : (
                                                        usnValue?.errCode || ""
                                                    )}
                                                </TableCell>
                                                <TableCell align="center" style={{ position: "relative" }}>
                                                    {/* <input
                                                        type="file"
                                                        disabled={usnValue?.pass_fail === "Pass"}
                                                        accept="image/*"
                                                        ref={(el) => {
                                                            if (el) fileInputRefs.current[usnKey] = el;
                                                        }}
                                                        style={{ display: "none" }}
                                                        // onClick={(event) => handleLimitSmapleImage(event, usnKey)}
                                                    /> */}

                                                    {usnValue.autousn === usnValue.manualUsn ? (
                                                        usnValue?.limit_sample_image ? (
                                                            <div style={{ position: "relative", display: "inline-block" }}>
                                                                <img
                                                                    src={usnValue?.limit_sample_image || ""}
                                                                    alt="Defect"
                                                                    style={{ maxHeight: "60px", display: "block" }}
                                                                />
                                                                <SensorOccupiedIcon
                                                                    disabled={usnValue?.pass_fail === "Pass"}
                                                                    sx={{
                                                                        position: "absolute",
                                                                        top: 0,
                                                                        right: 0,
                                                                        fontSize: "1rem",
                                                                        color: "purple",
                                                                        cursor: "pointer",
                                                                    }}
                                                                    onClick={() => handleLimitSmapleImage(usnKey, usnValue?.limit_sample_image)}
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
                                                                    onClick={() => handleDeleteLimitSampleImage(usnKey)}
                                                                    disabled={!usnValue?.limit_sample_image}
                                                                />
                                                            </div>
                                                        ) : (
                                                            <IconButton
                                                                color="secondary"
                                                                onClick={
                                                                    usnValue?.result === "OK"
                                                                        ? undefined
                                                                        : () => handleLimitSmapleImage(usnKey, usnValue?.limit_sample_image)
                                                                }
                                                                sx={{
                                                                    cursor: usnValue?.result === "OK" ? "not-allowed" : "pointer",
                                                                    opacity: usnValue?.result === "OK" ? 0.5 : 1,
                                                                }}
                                                                disabled={usnValue?.result === "OK" || usnValue?.pass_fail === "Pass"}
                                                            >
                                                                <SensorOccupiedIcon />
                                                            </IconButton>
                                                        )
                                                    ) : null}
                                                </TableCell>
                                                <TableCell>
                                                    {usnValue?.defectLocation === "Other" || usnValue?.defectSymptoms === "Other" ? (
                                                        <input
                                                            type="text"
                                                            disabled={usnValue?.pass_fail === "Pass"}
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
                                                            disabled={usnValue?.pass_fail === "Pass"}
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
                                                                    disabled={usnValue?.pass_fail === "Pass"}
                                                                    sx={{
                                                                        position: "absolute",
                                                                        top: 0,
                                                                        right: 0,
                                                                        fontSize: "1rem",
                                                                        color: "purple",
                                                                        cursor: "pointer",
                                                                    }}
                                                                    onClick={() => handleOpenScanner(usnKey, usnValue.image)}
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
                                                            <IconButton
                                                                color="secondary"
                                                                onClick={usnValue?.result === "OK" || usnValue?.pass_fail === "Pass" ? undefined : () => handleOpenScanner(usnKey)}
                                                                disabled={usnValue?.result === "OK" || usnValue?.pass_fail === "Pass"}
                                                                sx={{
                                                                    cursor: usnValue?.result === "OK" || usnValue?.pass_fail === "Pass" ? "not-allowed" : "pointer",
                                                                    opacity: usnValue?.result === "OK" || usnValue?.pass_fail === "Pass" ? 0.5 : 1
                                                                }}
                                                            >
                                                                <SensorOccupiedIcon />
                                                            </IconButton>

                                                        )
                                                    ) : null}
                                                </TableCell>
                                                <TableCell>
                                                    {usnValue.autousn === usnValue.manualUsn &&
                                                        <input
                                                            type="text"
                                                            disabled={usnValue?.pass_fail === "Pass"}
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
                                                            disabled={usnValue?.pass_fail === "Pass"}
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
                                                            disabled={usnValue?.pass_fail === "Pass"}
                                                            placeholder="Correct to action"
                                                            value={usnValue?.corect_to_cause || ""}
                                                            onChange={(e) => handleDefectChange(usnKey, "corect_to_cause", e.target.value)}
                                                            style={{ width: '100%', border: "1px solid #64b5f6", padding: "2px", borderRadius: "4px" }}
                                                        />
                                                    }
                                                </TableCell>
                                                <TableCell sx={{ minWidth: "120px" }}>
                                                    {usnValue.autousn === usnValue.manualUsn && (
                                                        <select
                                                            value={usnValue?.four_m || ""}
                                                            disabled={usnValue?.pass_fail === "Pass"}
                                                            onChange={(e) => handleDefectChange(usnKey, "four_m", e.target.value)}
                                                            style={{ width: '100%', border: "1px solid #64b5f6", padding: "2px", borderRadius: "4px" }}
                                                        >
                                                            <option value="">Select 4M</option>
                                                            {["Man", "Material", "Method", "Machine"].map((symptom) => (
                                                                <option key={symptom} value={symptom}>{symptom}</option>
                                                            ))}
                                                        </select>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {usnValue.autousn === usnValue.manualUsn &&
                                                        <input
                                                            type="date"
                                                            disabled={usnValue?.pass_fail === "Pass"}
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
                                                                disabled={usnValue?.pass_fail === "Pass"}
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
                                                        <IconButton
                                                            color="primary"
                                                            disabled={usnValue?.pass_fail === "Pass"}
                                                            sx={{ cursor: usnValue?.pass_fail === "Pass" ? "not-allowed" : "pointer" }}
                                                            onClick={() =>
                                                                handleAddRowBelow(usnKey, usnValue.autousn, usnValue.manualUsn)
                                                            }
                                                        >
                                                            <PlusIcon />
                                                        </IconButton>

                                                        {usnValue.additionalDefectRow && (
                                                            <IconButton
                                                                color="error"
                                                                disabled={usnValue?.pass_fail === "Pass"}
                                                                sx={{ cursor: usnValue?.pass_fail === "Pass" ? "not-allowed" : "pointer" }}
                                                                onClick={() => handleDeleteAdditionalRow(usnKey)}
                                                            >
                                                                <DeleteIcon />
                                                            </IconButton>
                                                        )}
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
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: "center", mt: 2, mb: 3 }}>
                {loading ? (
                    <CircularProgress size={24} color="primary" />
                ) :
                    <Button color="primary" variant="contained"
                        onClick={handleAddRecord}
                        disabled={
                            Object.keys(availableAutoUSNs).length === 0 ||
                            Object.values(availableAutoUSNs).some((usn) => !usn.manualUsn)
                        }>
                        Save Record
                    </Button>
                }
            </Box>

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
                    <Button onClick={handleAnalyze} color="primary" variant="contained">Scan</Button>
                </DialogActions>
            </Dialog>

            {/* SCANNER DIALOG */}
            <Dialog open={scannerOpen} onClose={() => { setscannerOpen(false); setUploadedImage(null) }} maxWidth="xs" fullWidth>
                <DialogTitle>Scanner</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 2 }}>
                        <Grid item size={{ xs: 12, md: 12 }} sx={{ position: 'relative' }}>
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
                                {isCameraActive && (
                                    <FlipCameraAndroidIcon
                                        onClick={() => {
                                            setIsFrontCamera((prev) => !prev);
                                            // setUploadedImage(null);
                                        }}
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
                                            setAvailableAutoUSNs((prevDetails) => {
                                                const updatedDetails = { ...prevDetails };
                                                if (!updatedDetails[currentUsnKey]) {
                                                    updatedDetails[currentUsnKey] = {};
                                                }
                                                updatedDetails[currentUsnKey].image = imageSrc;
                                                return updatedDetails;
                                            });
                                            setIsCameraActive(false);
                                            setCurrentUsnKey(null)
                                            setscannerOpen(false);
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
                                                    const uploadedImageSrc = event.target.result;
                                                    setUploadedImage(uploadedImageSrc);
                                                    setAvailableAutoUSNs((prevDetails) => {
                                                        const updatedDetails = { ...prevDetails };
                                                        if (!updatedDetails[currentUsnKey]) {
                                                            updatedDetails[currentUsnKey] = {};
                                                        }
                                                        updatedDetails[currentUsnKey].image = uploadedImageSrc;
                                                        return updatedDetails;
                                                    });
                                                    setscannerOpen(false);
                                                    setCurrentUsnKey(null)
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
                                    style={{ maxHeight: '200px', marginTop: '10px', width: '100%', border: "1px solid black" }}
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
                            // setUploadedImage(null);
                        }}
                        color="error"
                        variant="contained"
                    >
                        Cancel
                    </Button>
                    {/* <Button
                                        onClick={() => {
                                            setUploadedImage(null);
                                            setIsCameraActive(true); // Reactivate the camera for capturing again
                                        }}
                                        color="primary"
                                        variant="contained"
                                    >
                                        Capture Again
                                    </Button> */}
                </DialogActions>
            </Dialog>

            {/* LIMIT SAMPLE DIALOG */}
            <Dialog open={LimitSampleOpen} onClose={() => { setLimitSampleOpen(false); setLimitSampleImagePreview(null) }} maxWidth="xs" fullWidth>
                <DialogTitle>Limit Sample Image</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 2 }}>
                        <Grid item size={{ xs: 12, md: 12 }} sx={{ position: 'relative' }}>
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
                                                    const uploadedImageSrc = event.target.result;
                                                    setLimitSampleImagePreview(uploadedImageSrc);
                                                    setAvailableAutoUSNs((prevDetails) => {
                                                        const updatedDetails = { ...prevDetails };
                                                        if (!updatedDetails[currentUsnKey]) {
                                                            updatedDetails[currentUsnKey] = {};
                                                        }
                                                        updatedDetails[currentUsnKey].limit_sample_image = uploadedImageSrc;
                                                        return updatedDetails;
                                                    });
                                                    setLimitSampleOpen(false);
                                                    setCurrentUsnKey(null);
                                                };
                                                reader.readAsDataURL(file);
                                            }
                                        }}
                                    />
                                </Button>
                            </Box>
                        </Grid>
                        <Grid item size={{ xs: 12, md: 12 }}>
                            {LimitSampleImagePreview && (
                                <img
                                    src={LimitSampleImagePreview}
                                    alt="Uploaded"
                                    style={{ maxHeight: '200px', marginTop: '10px', width: '100%', border: "1px solid black" }}
                                />
                            )}
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => {
                            setLimitSampleOpen(false)
                            setLimitSampleOpen(null);
                        }}
                        color="error"
                        variant="contained"
                    >
                        Cancel
                    </Button>
                    {/* <Button
                                        onClick={() => {
                                            setUploadedImage(null);
                                            setIsCameraActive(true); // Reactivate the camera for capturing again
                                        }}
                                        color="primary"
                                        variant="contained"
                                    >
                                        Capture Again
                                    </Button> */}
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

export default Inspection;