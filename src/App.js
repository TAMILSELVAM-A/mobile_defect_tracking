import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./components/LoginPage";
import Inspection from "./pages/Inspection";
import InspectionReport from "./pages/InspectionReport";
import Home from "./pages/Home";
import Navbar from "./components/Navbar";

const App = () => {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route
          path="/login"
          element={
            <LoginPage />
          }
        />
        <Route
          path="/start_inspection"
          element={
            <Inspection />
          }
        />
        <Route
          path="/InspectionReport"
          element={
            <InspectionReport />
          }
        />
        <Route
          path="/QIT-Dashboard"
          element={
            <Home />
          }
        />
        <Route
          path="*"
          element={<LoginPage />}
        />
      </Routes>
    </Router>
  );
};

export default App;
