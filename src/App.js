import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./components/LoginPage";
// import DefectTrackingTable from "./components/Table";
import DefectTrackingTable from "./components/Table_final";

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
