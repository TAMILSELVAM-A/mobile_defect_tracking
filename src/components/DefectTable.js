import React, { useState, useRef } from 'react';
import _ from 'lodash';
import Picture1 from "../assets/Picture1.jpg";

const {
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Box,
    Typography,
    styled,
    Container,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid,
    Snackbar,
    Alert,
    CircularProgress
} = require('@mui/material');

// Styled components
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
// Define mapping for carton IDs to auto-generated USNs
const cartonToAutoUSNMap = {
    'MOB-88846203250762-47': [
        'SM-G998U-RT3K6L9',
        'SM-G998U-XJ9P43',
        'SM-G998U-L7MN54',
        'SM-G998U-P9K7J2',
        'SM-G998U-TW23K9'
    ],
    'MOB-65437812903458-21': [
        'A2894-7HJK98',
        'A2894-L8HD42',
        'A2894-9KFD23',
        'A2894-5TYU89'
    ],
    'MOB-92315687423910-36': [
        'GP9X-QW34ER',
        'GP9X-AS56DF',
        'GP9X-ZX89CV',
        'GP9X-BG67HJ'
    ],
    'MOB-10293847561234-42': [
        'SM-G998U-1QAZ2W',
        'SM-G998U-3EDC4R',
        'SM-G998U-5TGB6Y',
        'SM-G998U-7UJM8I'
    ]
};

// Sample data for mobile device defects
const generateMobileDefectData = () => {
    // Generate a few different dates
    const dates = ['3/21/2025', '3/22/2025', '3/23/2025'];

    const mobileDefectData = [];

    // First date with multiple units including one defect (as shown in image)
    const firstCartonId = 'MOB-88846203250762-47';
    const firstAutoUSNs = cartonToAutoUSNMap[firstCartonId];

    mobileDefectData.push(
        {
            date: '04/03/2025',
            line: 'L1',
            shift: 'A Shift',
            project: 'Galaxy S25',
            cartonId: firstCartonId,
            autoUSN: firstAutoUSNs[0],
            manualUSN: firstAutoUSNs[0], // Matching for first record
            symptoms: 'Display Dead Pixel',
            errCode: 'DP001',
            spec: '0 pixels',
            defectPic: Picture1,
            actual: '3 pixels',
            status: 'NG',
            usnMatch: true // USNs match
        }
    );

    // Add more records for the first carton
    for (let i = 1; i < firstAutoUSNs.length; i++) {
        const autoUSN = firstAutoUSNs[i];
        // For demo, let's make some manual USNs not match
        const manualUSN = i === 2 ? 'SM-G998U-MISTYPED' : autoUSN;

        mobileDefectData.push({
            date: '04/03/2025',
            line: 'L1',
            shift: 'A Shift',
            project: 'Galaxy S25',
            cartonId: firstCartonId,
            autoUSN: autoUSN,
            manualUSN: manualUSN,
            symptoms: '-',
            errCode: '-',
            spec: '-',
            defectPic: '',
            actual: '-',
            status: 'OK',
            usnMatch: autoUSN === manualUSN
        });
    }

    // Mobile device project names
    const mobileProjects = ['Galaxy S25', 'iPhone 16', 'Pixel 9'];

    // Mobile device specific defect symptoms, error codes, and specifications
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

    // Add data for other dates and cartons
    for (let i = 1; i < dates.length; i++) {
        // Each date has 5-7 records
        const cartonKeys = Object.keys(cartonToAutoUSNMap);
        const selectedCartonId = cartonKeys[Math.floor(Math.random() * cartonKeys.length)];
        const autoUSNs = cartonToAutoUSNMap[selectedCartonId];

        // Generate model prefix based on project
        const getModelPrefix = (project) => {
            if (project === 'Galaxy S25') return 'SM-G998U';
            if (project === 'iPhone 16') return 'A2894';
            return 'GP9X';  // Pixel 9
        };

        const project = mobileProjects[Math.floor(Math.random() * mobileProjects.length)];
        const recordCount = Math.min(autoUSNs.length, Math.floor(Math.random() * 3) + 3);

        for (let j = 0; j < recordCount; j++) {
            const hasDefect = Math.random() < 0.2; // 20% chance of having a defect
            const defect = mobileDefects[Math.floor(Math.random() * mobileDefects.length)];
            const autoUSN = autoUSNs[j];
            const manualUSN = Math.random() < 0.8 ? autoUSN : `${getModelPrefix(project)}-TYPO${Math.floor(Math.random() * 1000)}`;

            mobileDefectData.push({
                date: dates[i],
                line: `L${Math.floor(Math.random() * 3) + 1}`,
                shift: ['A Shift', 'B Shift', 'C Shift'][Math.floor(Math.random() * 3)],
                project: project,
                cartonId: selectedCartonId,
                autoUSN: autoUSN,
                manualUSN: manualUSN,
                symptoms: hasDefect ? defect.symptom : '-',
                errCode: hasDefect ? defect.errCode : '-',
                spec: hasDefect ? defect.spec : '-',
                defectPic: hasDefect ? Picture1 : '',
                actual: hasDefect ? defect.actual() : '-',
                status: hasDefect ? 'NG' : 'OK',
                usnMatch: autoUSN === manualUSN
            });
        }
    }

    return mobileDefectData;
};

// Defect analysis function - simulates the automated process
// This would normally be a backend call to analyze the image
const analyzeDefect = (imageFile, project, cartonId, manualUSN) => {
    return new Promise((resolve) => {
        // Simulate processing delay
        setTimeout(() => {
            // Get auto USN for the carton
            const autoUSNs = cartonToAutoUSNMap[cartonId] || [];
            // If the manual USN matches one of the auto USNs for this carton
            const autoUSN = autoUSNs.find(usn => usn === manualUSN) || (autoUSNs.length > 0 ? autoUSNs[0] : '');
            const usnMatch = autoUSN === manualUSN;

            // Random chance to detect defect (70% for demo purposes)
            const isDefect = Math.random() < 0.7;

            // Mobile device specific defect symptoms
            const mobileDefects = [
                {
                    symptom: 'Display Dead Pixel',
                    errCode: 'DP001',
                    spec: '0 pixels',
                    actual: `${Math.floor(Math.random() * 5) + 1} pixels`
                },
                {
                    symptom: 'Touch Screen Sensitivity',
                    errCode: 'TS002',
                    spec: '≤ 0.05 sec response',
                    actual: `${(Math.random() * 0.15 + 0.1).toFixed(2)} sec`
                },
                {
                    symptom: 'Battery Connector Loose',
                    errCode: 'BC003',
                    spec: '2.5 N·m torque',
                    actual: `${(Math.random() * 1 + 0.8).toFixed(1)} N·m`
                },
                {
                    symptom: 'Camera Module Misalignment',
                    errCode: 'CM004',
                    spec: '+0.1 mm',
                    actual: `${(Math.random() * 0.4 + 0.2).toFixed(2)} mm`
                },
                {
                    symptom: 'Speaker Distortion',
                    errCode: 'SD005',
                    spec: '< 1% THD',
                    actual: `${(Math.random() * 3 + 1.5).toFixed(1)}% THD`
                }
            ];

            if (isDefect) {
                // If defect, randomly select a defect type
                const defect = mobileDefects[Math.floor(Math.random() * mobileDefects.length)];

                // Create object URL for the uploaded image
                const defectImageUrl = URL.createObjectURL(imageFile);

                resolve({
                    autoUSN: autoUSN,
                    symptoms: defect.symptom,
                    errCode: defect.errCode,
                    spec: defect.spec,
                    actual: defect.actual,
                    defectPic: defectImageUrl,
                    status: 'NG',
                    usnMatch: usnMatch
                });
            } else {
                resolve({
                    autoUSN: autoUSN,
                    symptoms: '-',
                    errCode: '-',
                    spec: '-',
                    actual: '-',
                    defectPic: '',
                    status: 'OK',
                    usnMatch: usnMatch
                });
            }
        }, 1500); // Simulate 1.5s processing time
    });
};

// Helper function to get today's date in MM/DD/YYYY format
const getTodayDate = () => {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const year = today.getFullYear();
    return `${month}/${day}/${year}`;
};

// Main component
const DefectTrackingTable = () => {
    const [data, setData] = useState(generateMobileDefectData());
    const [openDialog, setOpenDialog] = useState(false);
    const [formData, setFormData] = useState({
        line: '',
        shift: '',
        project: '',
        cartonId: '',
        manualUSN: '',
    });
    const [analysisResults, setAnalysisResults] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('success');
    const [availableAutoUSNs, setAvailableAutoUSNs] = useState([]);

    const fileInputRef = useRef(null);

    // Create a composite key for grouping based on multiple fields
    const groupedData = _.groupBy(data, item =>
        `${item.date}|${item.line}|${item.shift}|${item.project}|${item.cartonId}`
    );

    // Get the group keys and sort them by date primarily
    const groupKeys = Object.keys(groupedData).sort((a, b) => {
        const dateA = a.split('|')[0];
        const dateB = b.split('|')[0];
        return new Date(dateB) - new Date(dateA);
    });

    const handleOpenDialog = () => {
        setOpenDialog(true);
        setFormData({
            line: '',
            shift: '',
            project: '',
            cartonId: '',
            manualUSN: '',
        });
        setAnalysisResults(null);
        setSelectedFile(null);
        setIsProcessing(false);
        setAvailableAutoUSNs([]);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        if (name === 'cartonId') {
            // Update auto USNs when carton ID changes
            const autoUSNs = cartonToAutoUSNMap[value] || [];
            setAvailableAutoUSNs(autoUSNs);
        }

        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (file) {
            setSelectedFile(file);
        }
    };

    const handleAnalyzeImage = async () => {
        if (!selectedFile) {
            setSnackbarMessage('Please select an image to analyze');
            setSnackbarSeverity('error');
            setOpenSnackbar(true);
            return;
        }

        if (!formData.cartonId || !formData.manualUSN) {
            setSnackbarMessage('Please provide Carton ID and Manual USN');
            setSnackbarSeverity('error');
            setOpenSnackbar(true);
            return;
        }

        setIsProcessing(true);

        try {
            const results = await analyzeDefect(
                selectedFile,
                formData.project,
                formData.cartonId,
                formData.manualUSN
            );
            setAnalysisResults(results);
        } catch (error) {
            console.error('Error analyzing defect:', error);
            setSnackbarMessage('Error analyzing image');
            setSnackbarSeverity('error');
            setOpenSnackbar(true);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSubmit = () => {
        // Validate required fields
        if (!formData.line || !formData.shift || !formData.project ||
            !formData.cartonId || !formData.manualUSN) {
            setSnackbarMessage('Please fill in all required fields');
            setSnackbarSeverity('error');
            setOpenSnackbar(true);
            return;
        }

        if (!selectedFile) {
            setSnackbarMessage('Please upload an image for analysis');
            setSnackbarSeverity('error');
            setOpenSnackbar(true);
            return;
        }

        if (!analysisResults) {
            setSnackbarMessage('Please analyze the image first');
            setSnackbarSeverity('error');
            setOpenSnackbar(true);
            return;
        }

        // Create new defect record
        const newRecord = {
            date: getTodayDate(),
            ...formData,
            ...analysisResults
        };

        // Add the new record to the data
        setData([newRecord, ...data]);

        // Show success message
        setSnackbarMessage('Defect record added successfully');
        setSnackbarSeverity('success');
        setOpenSnackbar(true);

        // Close dialog
        handleCloseDialog();
    };

    const handleCloseSnackbar = () => {
        setOpenSnackbar(false);
    };

    return (
        <Container fixed={false}>
            <Box sx={{ width: '100%', position: 'relative', overflow: 'auto', mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'center' }}>
                    <Typography variant="h5" component="h2">
                        Mobile Device Defect Tracking
                    </Typography>
                    <Button
                        variant="contained"
                        color="primary"
                        sx={{ textTransform: 'none' }}
                        onClick={handleOpenDialog}
                    >
                        New Defect
                    </Button>
                </Box>

                <TableContainer component={Paper} sx={{ maxHeight: '80vh' }}>
                    <Table stickyHeader aria-label="defect tracking table">
                        <TableHead>
                            <TableRow sx={{ padding: 0 }}>
                                <StyledTableCell>Date</StyledTableCell>
                                <StyledTableCell>Line</StyledTableCell>
                                <StyledTableCell>Shift</StyledTableCell>
                                <StyledTableCell>Project</StyledTableCell>
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
                            {groupKeys.map(groupKey => {
                                const rows = groupedData[groupKey];
                                const [date, line, shift, project, cartonId] = groupKey.split('|');

                                return (
                                    <React.Fragment key={groupKey}>
                                        {rows.map((row, index) => (
                                            <StyledTableRow key={`${groupKey}-${row.autoUSN}-${index}`}>
                                                {index === 0 && <GroupCell rowSpan={rows.length}>{date}</GroupCell>}
                                                {index === 0 && <GroupCell rowSpan={rows.length}>{line}</GroupCell>}
                                                {index === 0 && <GroupCell rowSpan={rows.length}>{shift}</GroupCell>}
                                                {index === 0 && <GroupCell rowSpan={rows.length}>{project}</GroupCell>}
                                                {index === 0 && <GroupCell rowSpan={rows.length}>{cartonId}</GroupCell>}
                                                <TableCell sx={{
                                                    color: row.usnMatch ? 'green' : 'red',
                                                    fontWeight: 'bold',
                                                }}>{row.autoUSN}</TableCell>
                                                <TableCell sx={{
                                                    color: row.usnMatch ? 'green' : 'red',
                                                    fontWeight: 'bold'
                                                }}>
                                                    {row.manualUSN}
                                                </TableCell>
                                                <TableCell>{row.symptoms}</TableCell>
                                                <TableCell>{row.errCode}</TableCell>
                                                <TableCell>{row.spec}</TableCell>
                                                <TableCell>
                                                    {row.defectPic && (
                                                        <img
                                                            src={row.defectPic}
                                                            alt="Defect"
                                                            style={{ maxHeight: '60px' }}
                                                        />
                                                    )}
                                                </TableCell>
                                                <TableCell>{row.actual}</TableCell>
                                                <TableCell sx={{
                                                    fontWeight: 'bold',
                                                    color: row.status === 'NG' ? 'red' : 'green'
                                                }}>
                                                    {row.status}
                                                </TableCell>
                                            </StyledTableRow>
                                        ))}
                                    </React.Fragment>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>

            {/* New Defect Dialog */}
            <Dialog
                open={openDialog}
                onClose={handleCloseDialog}
                aria-labelledby="form-dialog-title"
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>Add New Defect</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        {/* Row 1: Date and Line */}
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
                                    value={formData.project}
                                    onChange={handleInputChange}
                                    label="Project *"
                                    required
                                >
                                    <MenuItem value="Galaxy S25">Galaxy S25</MenuItem>
                                    <MenuItem value="iPhone 16">iPhone 16</MenuItem>
                                    <MenuItem value="Pixel 9">Pixel 9</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item size={{ xs: 12, md: 6 }}>
                            <FormControl fullWidth margin="dense">
                                <InputLabel>Line *</InputLabel>
                                <Select
                                    name="line"
                                    value={formData.line}
                                    onChange={handleInputChange}
                                    label="Line *"
                                    required
                                >
                                    <MenuItem value="L1">L1</MenuItem>
                                    <MenuItem value="L2">L2</MenuItem>
                                    <MenuItem value="L3">L3</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* Row 2: Shift and Project */}
                        <Grid item size={{ xs: 12, md: 6 }}>
                            <FormControl fullWidth margin="dense">
                                <InputLabel>Shift *</InputLabel>
                                <Select
                                    name="shift"
                                    value={formData.shift}
                                    onChange={handleInputChange}
                                    label="Shift *"
                                    required
                                >
                                    <MenuItem value="A Shift">A Shift</MenuItem>
                                    <MenuItem value="B Shift">B Shift</MenuItem>
                                    <MenuItem value="C Shift">C Shift</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        {/* Row 3: Carton ID */}
                        <Grid item size={{ xs: 12, md: 6 }}>
                            <FormControl fullWidth margin="dense">
                                <InputLabel>Carton ID *</InputLabel>
                                <Select
                                    name="cartonId"
                                    value={formData.cartonId}
                                    onChange={handleInputChange}
                                    label="Carton ID *"
                                    required
                                >
                                    {Object.keys(cartonToAutoUSNMap).map((cartonId) => (
                                        <MenuItem key={cartonId} value={cartonId}>{cartonId}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* Row 4: Manual USN */}
                        <Grid item size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth
                                label="Manual USN *"
                                name="manualUSN"
                                value={formData.manualUSN}
                                onChange={handleInputChange}
                                variant="outlined"
                                margin="dense"
                                required
                                placeholder="e.g. SM-G998U-XXXXXX"
                                helperText={
                                    availableAutoUSNs.length > 0
                                        ? `Available Auto USNs for this carton: ${availableAutoUSNs.join(', ')}`
                                        : ''
                                }
                            />
                        </Grid>

                        {/* Row 5: Full-width Image Upload */}
                        <Grid item size={{ xs: 12 }}>
                            <Box sx={{ border: '1px dashed #ccc', p: 2, borderRadius: 1 }}>
                                <Typography variant="subtitle1" gutterBottom>
                                    Upload Unit Image for Analysis *
                                </Typography>
                                <input
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                    id="raised-button-file"
                                    type="file"
                                    onChange={handleFileSelect}
                                    ref={fileInputRef}
                                />
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <label htmlFor="raised-button-file">
                                        <Button
                                            variant="outlined"
                                            component="span"
                                        >
                                            Select Image
                                        </Button>
                                    </label>
                                    <Typography variant="body2">
                                        {selectedFile ? selectedFile.name : 'No file selected'}
                                    </Typography>
                                    <Button
                                        variant="contained"
                                        onClick={handleAnalyzeImage}
                                        disabled={!selectedFile || isProcessing || !formData.cartonId || !formData.manualUSN}
                                        sx={{ ml: 'auto' }}
                                    >
                                        {isProcessing ? <CircularProgress size={24} /> : 'Analyze'}
                                    </Button>
                                </Box>
                            </Box>
                        </Grid>

                        {/* Analysis Results (Only shown when available) */}
                        {analysisResults && (
                            <Grid item xs={12}>
                                <Box sx={{ border: '1px solid #e0e0e0', p: 2, borderRadius: 1, mt: 2, bgcolor: '#f9f9f9' }}>
                                    <Typography variant="h6" gutterBottom>
                                        Automated Analysis Results
                                    </Typography>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} md={6}>
                                            <Typography variant="subtitle2">Status:</Typography>
                                            <Typography
                                                variant="body1"
                                                sx={{
                                                    fontWeight: 'bold',
                                                    color: analysisResults.status === 'NG' ? 'red' : 'green'
                                                }}
                                            >
                                                {analysisResults.status}
                                            </Typography>
                                        </Grid>

                                        <Grid item xs={12} md={6}>
                                            <Typography variant="subtitle2">USN Match:</Typography>
                                            <Typography
                                                variant="body1"
                                                sx={{
                                                    fontWeight: 'bold',
                                                    color: analysisResults.usnMatch ? 'green' : 'red'
                                                }}
                                            >
                                                {analysisResults.usnMatch ? 'Yes' : 'No'}
                                            </Typography>
                                        </Grid>

                                        <Grid item xs={12} md={6}>
                                            <Typography variant="subtitle2">Auto USN:</Typography>
                                            <Typography variant="body1">{analysisResults.autoUSN}</Typography>
                                        </Grid>

                                        {analysisResults.status === 'NG' && (
                                            <>
                                                <Grid item xs={12} md={6}>
                                                    <Typography variant="subtitle2">Symptoms:</Typography>
                                                    <Typography variant="body1">{analysisResults.symptoms}</Typography>
                                                </Grid>

                                                <Grid item xs={12} md={6}>
                                                    <Typography variant="subtitle2">ERR Code:</Typography>
                                                    <Typography variant="body1">{analysisResults.errCode}</Typography>
                                                </Grid>

                                                <Grid item xs={12} md={6}>
                                                    <Typography variant="subtitle2">Spec:</Typography>
                                                    <Typography variant="body1">{analysisResults.spec}</Typography>
                                                </Grid>

                                                <Grid item xs={12} md={6}>
                                                    <Typography variant="subtitle2">Actual:</Typography>
                                                    <Typography variant="body1">{analysisResults.actual}</Typography>
                                                </Grid>

                                                <Grid item xs={12} md={6}>
                                                    <Typography variant="subtitle2">Defect Image:</Typography>
                                                    {analysisResults.defectPic && (
                                                        <img
                                                            src={analysisResults.defectPic}
                                                            alt="Defect"
                                                            style={{ maxHeight: '100px', maxWidth: '100%' }}
                                                        />
                                                    )}
                                                </Grid>
                                            </>
                                        )}
                                    </Grid>
                                </Box>
                            </Grid>
                        )}
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button
                        onClick={handleSubmit}
                        variant="contained"
                        color="primary"
                        disabled={!analysisResults}
                    >
                        Add Record
                    </Button>
                </DialogActions>
            </Dialog>
            {/* Snackbar for notifications */}
            <Snackbar
                open={openSnackbar}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert
                    onClose={handleCloseSnackbar}
                    severity={snackbarSeverity}
                    sx={{ width: '100%' }}
                >
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default DefectTrackingTable;
