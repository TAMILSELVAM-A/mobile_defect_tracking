import React, { useState } from 'react';
import {
    Box,
    Button,
    Card,
    CardContent,
    Container,
    CssBaseline,
    FormControl,
    FormHelperText,
    IconButton,
    InputAdornment,
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

const bgImage = "https://img.freepik.com/free-photo/3d-view-map_23-2150472847.jpg"

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

const LoginPage = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [errors, setErrors] = useState({
        email: '',
        password: '',
    });

    const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });

        // Clear error when typing
        if (errors[name]) {
            setErrors({
                ...errors,
                [name]: '',
            });
        }
    };

    const handleClickShowPassword = () => {
        setShowPassword(!showPassword);
    };

    const validateForm = () => {
        const newErrors = {};

        // Email validation
        if (!formData.email) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email is invalid';
        }

        // Password validation
        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (validateForm()) {
            // Here you would handle the login authentication
            console.log('Form submitted:', formData);
            // Add authentication logic here
        }
    };

    const handleLogin = () => {
        navigate("/defects")
    }

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Box
                sx={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    background: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.7)), url(${bgImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    py: 3,
                }}
            >
                <Container maxWidth="sm">
                    <Card
                        sx={{
                            backdropFilter: 'blur(10px)',
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            overflow: 'hidden',
                        }}
                    >
                        <Box
                            sx={{
                                backgroundColor: 'primary.main',
                                py: 2,
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                mb: 2,
                            }}
                        >
                            <BugReportIcon sx={{ color: 'white', fontSize: 32, mr: 1 }} />
                            <Typography variant="h5" component="h1" color="white" fontWeight="bold">
                                Mobile Defect Detection
                            </Typography>
                        </Box>

                        <CardContent sx={{ p: isSmallScreen ? 2 : 4 }}>
                            <Box
                                component="form"
                                onSubmit={handleSubmit}
                                sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 3,
                                }}
                            >
                                <Box sx={{ textAlign: 'center', mb: 2 }}>
                                    <Typography variant="h4" component="h2" color="primary" fontWeight="bold">
                                        Login
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                        Enter your credentials to access the defect detection system
                                    </Typography>
                                </Box>

                                <TextField
                                    label="Email Address"
                                    variant="outlined"
                                    fullWidth
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    error={Boolean(errors.email)}
                                    helperText={errors.email}
                                    InputProps={{
                                        sx: { borderRadius: 2 }
                                    }}
                                />

                                <FormControl variant="outlined" fullWidth error={Boolean(errors.password)}>
                                    <InputLabel htmlFor="password">Password</InputLabel>
                                    <OutlinedInput
                                        id="password"
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={formData.password}
                                        onChange={handleChange}
                                        sx={{ borderRadius: 2 }}
                                        endAdornment={
                                            <InputAdornment position="end">
                                                <IconButton
                                                    onClick={handleClickShowPassword}
                                                    edge="end"
                                                >
                                                    {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                                </IconButton>
                                            </InputAdornment>
                                        }
                                        label="Password"
                                    />
                                    {errors.password && <FormHelperText>{errors.password}</FormHelperText>}
                                </FormControl>

                                <Typography
                                    variant="body2"
                                    color="primary"
                                    sx={{
                                        alignSelf: 'flex-end',
                                        cursor: 'pointer',
                                        '&:hover': { textDecoration: 'underline' }
                                    }}
                                >
                                    Forgot password?
                                </Typography>

                                <Button
                                    type="submit"
                                    variant="contained"
                                    color="primary"
                                    size="large"
                                    fullWidth
                                    startIcon={<LockOutlinedIcon />}
                                    sx={{
                                        py: 1.5,
                                        mt: 2,
                                        fontWeight: 'bold'
                                    }}
                                    onClick={handleLogin}
                                >
                                    Log In
                                </Button>

                                <Box sx={{ textAlign: 'center', mt: 2 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Don't have an account?{' '}
                                        <Typography
                                            component="span"
                                            variant="body2"
                                            color="secondary"
                                            sx={{
                                                fontWeight: 'bold',
                                                cursor: 'pointer',
                                                '&:hover': { textDecoration: 'underline' }
                                            }}
                                        >
                                            Register here
                                        </Typography>
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Container>
            </Box>
        </ThemeProvider>
    );
};

export default LoginPage;