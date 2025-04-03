import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import LoginPage from "./components/LoginPage"; // Fixed semicolon typo
import DefectTrackingTable from "./components/DefectTable";
import { Login } from "@mui/icons-material";

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);


  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={
            <LoginPage />
          }
        />
        <Route
          path="/defects"
          element={
            <DefectTrackingTable />
          }
        />
        <Route
          path="*"
          element={<LoginPage/>}
        />
      </Routes>
    </Router>
  );
};

export default App;