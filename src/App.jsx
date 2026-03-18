import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "./supabase";

import MainLayout from "./components/MainLayout";
import DashboardPage from "./pages/DashboardPage";
import NewProjectPage from "./pages/NewProjectPage";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import LoginPage from "./pages/LoginPage";

function AppRoutes() {
  const location = useLocation();
  const [session, setSession] = useState(undefined);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (mounted) {
        setSession(data.session);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (mounted) {
        setSession(newSession);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Loading inicial
  if (session === undefined) {
    return <div style={{ padding: "24px" }}>Cargando...</div>;
  }

  const isLoginPage = location.pathname === "/login";

  // No autenticado → login
  if (!session && !isLoginPage) {
    return <Navigate to="/login" replace />;
  }

  // Autenticado → no puede ver login
  if (session && isLoginPage) {
    return <Navigate to="/" replace />;
  }

  return (
    <Routes>
      {/* Login fuera del layout */}
      <Route path="/login" element={<LoginPage />} />

      {/* Todo lo demás dentro del layout */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/proyectos/nuevo" element={<NewProjectPage />} />
        <Route path="/proyectos/:id" element={<ProjectDetailPage />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
