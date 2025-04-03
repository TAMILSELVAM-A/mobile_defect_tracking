import React, { useCallback, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { GoogleGenerativeAI } from '@google/generative-ai';

import {
    UploadIcon,
    XIcon,
    ChevronDownIcon,
    ShareIcon,
    DownloadIcon,
    XCircleIcon,
} from '@heroicons/react/outline';
import { Camera, Image, Layers, MobileFriendly, Settings, Star, X, Home } from '@mui/icons-material';
import { Menu } from '@mui/material';
import { BiHelpCircle, BiUser } from 'react-icons/bi';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';

const gemini_api_key = process.env.REACT_APP_API_KEY;

const genAI = new GoogleGenerativeAI(gemini_api_key);

const prompt = `
You are an AI-powered image analysis tool specialized in detecting phone damages.
Your task:
- Identify visible issues such as scratches, dents, bulging, cracked screen, water damage, button damage, speaker damage, back cover damage, and burn marks.
- Provide only **one or two-word labels** for the detected damages. Example: "Cracked Screen", "Dent", "Scratch", "Water Damage".
- If no damage is visible, return "No Visible Defect".
`;

const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro", systemInstruction: prompt });

const phoneModels = ['iPhone 13', 'Samsung Galaxy S21', 'Google Pixel 6', 'OnePlus 9', 'Xiaomi Mi 11'];

const symptomKeywords = {
    "crack": "Cracked Screen",
    "dent": "Dent",
    "scratch": "Scratch",
    "water": "Water Damage",
    "button": "Button Damage",
    "speaker": "Speaker Damage",
    "back cover": "Back Cover Damage",
    "burn": "Burn Marks",
    "bulging": "Bulging"
};

export default function MobileDefect() {
    const [uploadedFile, setUploadedFile] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedModel, setSelectedModel] = useState(null);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [galleryItems, setGalleryItems] = useState([]);
    const [selectedImage, setSelectedImage] = useState(null);
    const [isModelOpen, setIsModelOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState(false);

    const getData = async () => {
        try {
            const response = await fetch("http://localhost:8000/get-results", {
                method: "GET",
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            setGalleryItems(data.data);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    useEffect(() => {
        getData();
    }, []);

    const onDrop = useCallback((acceptedFiles) => {
        const file = acceptedFiles[0];
        if (file) {
            setIsLoading(true);
            const reader = new FileReader();

            reader.onload = () => {
                setUploadedFile({ file, preview: reader.result });
                setIsLoading(false);
            };

            reader.readAsDataURL(file);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': ['.jpeg', '.jpg', '.png'] },
        maxSize: 5242880,
        multiple: false,
    });

    const handleAnalyze = async () => {
        if (!uploadedFile || !selectedModel) return;

        try {
            setLoading(true);
            const base64Image = uploadedFile.preview.split(",")[1];

            const response = await model.generateContent({
                contents: [{
                    role: "user",
                    parts: [{
                        inlineData: {
                            mimeType: uploadedFile.file.type,
                            data: base64Image
                        }
                    }]
                }]
            });

            const symptoms = response.response.text();

            const detectedSymptoms = Object.entries(symptomKeywords)
                .filter(([word]) => symptoms.toLowerCase().includes(word))
                .map(([, keyword]) => keyword);

            const symptomsFinal = detectedSymptoms.length > 0 ? detectedSymptoms.join(", ") : "No Visible Defect";
            const status = symptomsFinal !== "No Visible Defect" ? "Not Good" : "Okay";
            setAnalysisResult({ symptoms: symptomsFinal, status });
        } catch (error) {
            console.error("Error analyzing image:", error);
        }
        finally {
            setLoading(false)
        }
    };

    const handleSaveResult = async () => {
        if (!uploadedFile || !analysisResult || !selectedModel) {
            console.error("Missing required data to save.");
            return;
        }

        try {
            setLoading(true)
            const formData = new FormData();
            formData.append("image", uploadedFile.file);
            formData.append("status", analysisResult.status);
            formData.append("symptoms", analysisResult.symptoms);
            formData.append("model_name", selectedModel);

            const response = await fetch("http://localhost:8000/save-result", {
                method: "POST",
                body: formData,
            });

            if (response.ok) {
                console.log("Result saved successfully!");
                setAlert(true)
                getData();
            } else {
                console.error("Failed to save result:", response.statusText);
                alert("Failed to save result. Please try again.");
            }
        } catch (error) {
            console.error("Error saving result:", error);
            alert("An error occurred while saving.");
        }
        finally {
            setLoading(false);
        }
    };

    const NavbarMenuItems = () => {
        const menuItems = [
            { icon: <Home size={20} />, label: 'Dashboard', href: '#' },
            { icon: <Image size={20} />, label: 'Image Library', href: '#' },
            { icon: <Star size={20} />, label: 'Favorites', href: '#' },
        ];

        return (
            <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4">
                {menuItems.map((item, index) => (
                    <a
                        key={index}
                        href={item.href}
                        className="flex items-center px-3 py-2 hover:bg-purple-50 rounded-lg text-gray-700 hover:text-purple-600 transition duration-200"
                    >
                        {item.icon}
                        <span className="ml-2 md:block">{item.label}</span>
                    </a>
                ))}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navigation */}
            <nav className="bg-white shadow-md px-4 py-3 flex justify-between items-center">
                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                        <MobileFriendly className="text-purple-600" />
                        <h1 className="text-xl font-bold text-gray-800">Mobile Defect Detection</h1>
                    </div>
                </div>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center space-x-4">
                    <NavbarMenuItems />
                </div>

                {/* Mobile Menu Toggle */}
                <div className="md:hidden">
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="text-gray-600 hover:text-purple-600 transition duration-200"
                    >
                        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>

                <div className="hidden md:flex items-center space-x-4">
                    <button
                        className="text-gray-600 hover:text-purple-600 transition duration-200"
                        title="New Analysis"
                    >
                        <Camera size={20} />
                    </button>
                    <button
                        className="text-gray-600 hover:text-purple-600 transition duration-200"
                        title="Settings"
                    >
                        <Settings size={20} />
                    </button>
                    <button
                        className="text-gray-600 hover:text-purple-600 transition duration-200"
                        title="Help"
                    >
                        <BiHelpCircle size={20} />
                    </button>
                    <button
                        className="text-gray-600 hover:text-purple-600 transition duration-200"
                        title="Profile"
                    >
                        <BiUser size={20} />
                    </button>
                </div>
            </nav>
            {isMobileMenuOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden">
                    <div className="absolute top-0 left-0 w-64 h-full bg-white shadow-lg">
                        <div className="p-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white flex items-center justify-between">
                            <div className="flex items-center">
                                <MobileFriendly className="mr-2" />
                                <h2 className="text-xl font-bold">Mobile Defect Detection</h2>
                            </div>
                            <button
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="hover:bg-purple-700 p-2 rounded-full"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        <nav className="p-4">
                            <NavbarMenuItems />
                        </nav>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                {/* Upload & Analysis Section */}
                <div className="bg-white rounded-lg shadow-xl overflow-hidden">
                    <div className="p-6">
                        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                            <UploadIcon className="h-6 w-6 mr-2 text-indigo-600" />
                            Upload & Analyze
                        </h2>

                        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Left Column - Upload */}
                            <div className="space-y-6">
                                {/* Phone Model Selector */}
                                <div className="relative">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Phone Model</label>
                                    <div className="mt-1 relative">
                                        <button
                                            type="button"
                                            onClick={() => setIsModelOpen(!isModelOpen)}
                                            className="bg-white relative w-full border border-gray-300 rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        >
                                            <span className="block truncate">{selectedModel || "Select a model"}</span>
                                            <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                                                <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                                            </span>
                                        </button>

                                        {isModelOpen && (
                                            <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                                                {phoneModels.map((model, index) => (
                                                    <div
                                                        key={index}
                                                        onClick={() => {
                                                            setSelectedModel(model);
                                                            setIsModelOpen(false);
                                                        }}
                                                        className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-indigo-100"
                                                    >
                                                        {model}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Upload Area */}
                                <div
                                    {...getRootProps()}
                                    className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${isDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400'
                                        }`}
                                >
                                    <input {...getInputProps()} />

                                    {isLoading ? (
                                        <div className="flex items-center justify-center">
                                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-700"></div>
                                        </div>
                                    ) : uploadedFile ? (
                                        <div className="w-full flex flex-col items-center">
                                            <div className="relative w-full max-w-xs h-48 overflow-hidden rounded-lg">
                                                <img
                                                    src={uploadedFile.preview}
                                                    alt="Preview"
                                                    className="w-full h-full object-fill"
                                                />
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setUploadedFile(null);
                                                        setAnalysisResult(null);
                                                        setSelectedModel(null);
                                                    }}
                                                    className="absolute top-2 right-2 bg-red-500 rounded-full p-1 text-white hover:bg-red-600 focus:outline-none"
                                                >
                                                    <XCircleIcon className="h-5 w-5" />
                                                </button>
                                            </div>
                                            <p className="mt-2 text-sm text-gray-500">{uploadedFile.file.name}</p>
                                        </div>
                                    ) : (
                                        <>
                                            <UploadIcon className="h-12 w-12 text-indigo-500" />
                                            <p className="mt-2 text-lg font-medium text-gray-900">
                                                {isDragActive ? "Drop the image here" : "Drag & drop an image or click to select"}
                                            </p>
                                            <p className="mt-1 text-sm text-gray-500">
                                                Supports: JPG, JPEG, PNG (max 5MB)
                                            </p>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Right Column - Results */}
                            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 shadow-sm">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Result Section</h3>

                                {analysisResult ? (
                                    <div className="space-y-6 p-5 bg-white rounded-xl shadow-md">
                                        <div className="flex flex-wrap gap-2">
                                            {analysisResult.symptoms.split(", ").map((symptom, index) => (
                                                <span
                                                    key={index}
                                                    className={`inline-flex items-center px-4 py-2 rounded-sm text-sm font-semibold shadow-md transition-all 
                                                  ${symptom !== "No Visible Defect"
                                                            ? 'bg-gradient-to-r from-red-500 to-red-700 text-white shadow-lg'
                                                            : 'bg-gradient-to-r from-green-400 to-green-600 text-white shadow-lg'}`}
                                                >
                                                    {symptom}
                                                </span>
                                            ))}
                                        </div>
                                        <div className="flex items-center gap-2 text-lg font-medium text-gray-800">
                                            <span>Phone Status:</span>
                                            <span
                                                className={`px-3 py-1 rounded-sm text-white text-sm shadow-md 
                                              ${analysisResult.status === "Okay"
                                                        ? "bg-green-500"
                                                        : "bg-red-500"}`}
                                            >
                                                {analysisResult.status}
                                            </span>
                                        </div>
                                        <button
                                            onClick={handleSaveResult}
                                            className="mt-4 w-full flex justify-center items-center py-3 px-5 rounded-lg text-lg font-semibold text-white shadow-lg transition-all 
                                          bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 focus:ring-4 focus:ring-indigo-300"
                                        >
                                            Save Result
                                        </button>
                                    </div>

                                ) : (
                                    <div className="space-y-4">
                                        <div className="bg-white p-4 rounded border border-dashed border-gray-300 text-center">
                                            <p className="text-gray-500">Your processed result will appear here.</p>
                                        </div>
                                        {!loading ? (
                                            <button
                                                onClick={handleAnalyze}
                                                disabled={!uploadedFile || !selectedModel}
                                                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${!uploadedFile || !selectedModel
                                                    ? 'bg-gray-300 cursor-not-allowed'
                                                    : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                                                    }`}
                                            >
                                                Analyze
                                            </button>)
                                            :
                                            (
                                                <div className="flex items-center justify-center">
                                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-700"></div>
                                                </div>)
                                        }
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Gallery Section */}
                <div className="mt-8">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">Previous Analyses</h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {galleryItems?.map((item, index) => (
                            <div
                                key={item.record_id}
                                className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer"
                                onClick={() => setSelectedImage(item)}
                            >
                                <div className="relative h-48">
                                    <img
                                        src={`http://localhost:8000/saved_images/${item.image_path}`}
                                        alt={item.status}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                                        <p className="text-white font-medium">{item.status}</p>
                                        <p className="text-gray-300 text-sm">{item.date}</p>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <div className="flex justify-between items-center">
                                        <p className="font-medium text-gray-900">{item.mobile_model}</p>
                                        <span
                                            className={`px-2 py-1 rounded-full text-xs font-medium ${item.status === "Okay" ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                }`}
                                        >
                                            {item.status}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-sm text-gray-500">{item.issues || "No issues detected"}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            {/* Image Modal */}
            {selectedImage && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-75 flex items-center justify-center p-4">
                    <div className="relative max-w-4xl w-full">
                        <button
                            onClick={() => setSelectedImage(null)}
                            className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 rounded-full p-2 text-white hover:bg-opacity-70"
                        >
                            <XIcon className="h-6 w-6" />
                        </button>

                        <div className="bg-white rounded-lg overflow-hidden shadow-xl">
                            <div className="relative">
                                <img
                                    src={`http://localhost:8000/saved_images/${selectedImage.image_path}`}
                                    alt={selectedImage.status}
                                    className="w-full max-h-[70vh] object-contain"
                                />
                            </div>

                            <div className="p-4 border-t border-gray-200">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900">{selectedImage.status}</h3>
                                        <p className="text-sm text-gray-500">{selectedImage.date}</p>
                                        {selectedImage.issues && (
                                            <div className="mt-2">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                    {selectedImage.Issues}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex space-x-2">
                                        <button className="p-2 rounded-full bg-gray-100 hover:bg-gray-200">
                                            <ShareIcon className="h-5 w-5 text-gray-600" />
                                        </button>
                                        <button className="p-2 rounded-full bg-gray-100 hover:bg-gray-200">
                                            <DownloadIcon className="h-5 w-5 text-gray-600" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <Snackbar open={alert} autoHideDuration={6000} onClose={() => { setAlert(false) }} anchorOrigin={{ vertical: "top", horizontal: "right" }}>
                <Alert
                    onClose={() => { setAlert(false) }}
                    severity="success"
                    variant="filled"
                    sx={{ width: '100%' }}
                >
                    Data Saved Successfully
                </Alert>
            </Snackbar>
        </div>
    );
}