import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "./supabase";

import MainLayout from "./components/MainLayout";
import DashboardPage from "./pages/DashboardPage";
import NewProjectPage from "./pages/NewProjectPage";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import LoginPage from "./pages/LoginPage";
import UniverseDetailPage from "./pages/UniverseDetailPage";

async function getMiPerfil() {
  const { data, error } = await supabase.rpc("mi_perfil");

  if (error) {
    throw error;
  }

  return data?.[0] || null;
}

function AppRoutes() {
  const location = useLocation();
  const [session, setSession] = useState(undefined);
  const [perfil, setPerfil] = useState(undefined);
  const [loadingPerfil, setLoadingPerfil] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadAuthState(currentSession) {
      if (!mounted) return;

      setSession(currentSession);

      if (!currentSession) {
        setPerfil(null);
        setLoadingPerfil(false);
        return;
      }

      try {
        setLoadingPerfil(true);
        const perfilData = await getMiPerfil();

        if (!mounted) return;

        setPerfil(perfilData);
      } catch (error) {
        if (!mounted) return;
        setPerfil(null);
      } finally {
        if (mounted) {
          setLoadingPerfil(false);
        }
      }
    }

    supabase.auth.getSession().then(({ data }) => {
      loadAuthState(data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      loadAuthState(newSession);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);
  
  // Loading inicial
  if (session === undefined || loadingPerfil) {
    return <div style={{ padding: "24px" }}>Cargando...</div>;
  }

  const isLoginPage = location.pathname === "/login";

  if (!session && !isLoginPage) {
    return <Navigate to="/login" replace />;
  }

  if (!session && isLoginPage) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    );
  }

  if (session && !perfil) {
    return <div style={{ padding: "24px" }}>Cargando perfil...</div>;
  }

  if (session && isLoginPage) {
    if (perfil.tipo_acceso === "global") {
      return <Navigate to="/" replace />;
    }

    if (perfil.tipo_acceso === "universo" && perfil.id_universo) {
      return <Navigate to={`/universes/${perfil.id_universo}`} replace />;
    }
  }

  if (
    session &&
    perfil?.tipo_acceso === "universo" &&
    location.pathname === "/"
  ) {
    return <Navigate to={`/universes/${perfil.id_universo}`} replace />;
  }

  return (
    <Routes>
      {/* Login fuera del layout */}
      <Route path="/login" element={<LoginPage />} />

      {/* Todo lo demás dentro del layout */}
      <Route element={<MainLayout perfil={perfil} />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/proyectos/nuevo" element={<NewProjectPage />} />
        <Route path="/universes/:id" element={<UniverseDetailPage />} />
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
