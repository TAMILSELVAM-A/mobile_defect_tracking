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
    OutlinedInput,
    TextField,
    Typography,
    useMediaQuery
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import {
    LockOutlined as LockOutlinedIcon,
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon,
    BugReport as BugReportIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const bgImage = "https://img.freepik.com/free-photo/3d-view-map_23-2150472847.jpg?t=st=1743665973~exp=1743669573~hmac=0f990831ce32e17a278db8d19c6318bc9d307d89e43f520caed1221683f404eb&w=1380"

// Custom theme with brand colors
const theme = createTheme({
    palette: {
        primary: {
            main: '#1976d2', // Blue for tech feel
            dark: '#115293',
        },
        secondary: {
            main: '#ff3d00', // Orange for alerts/defects
            dark: '#dd2c00',
        },
        background: {
            default: '#f5f5f5',
        },
    },
    typography: {
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        h4: {
            fontWeight: 600,
        },
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 30,
                    textTransform: 'none',
                    fontWeight: 600,
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 16,
                    boxShadow: '0 8px 40px rgba(0, 0, 0, 0.12)',
                },
            },
        },
    },
});

const LoginPage = ({ onLogin }) => {
    const [showPassword, setShowPassword] = useState(false);
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
