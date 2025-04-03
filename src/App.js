import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./components/LoginPage"; // Fixed semicolon typo
import DefectTrackingTable from "./components/DefectTable";

const App = () => {
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