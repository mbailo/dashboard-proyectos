import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "./components/MainLayout";
import DashboardPage from "./pages/DashboardPage";
import NewProjectPage from "./pages/NewProjectPage";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import LoginPage from "./pages/LoginPage";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/nuevo-proyecto"
          element={
            <ProtectedRoute>
              <NewProjectPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/proyecto/:id"
          element={
            <ProtectedRoute>
              <ProjectDetailPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

