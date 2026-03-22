import React, { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { useNavigate } from "react-router-dom";

async function getMiPerfil() {
  const { data, error } = await supabase.rpc("mi_perfil");

  if (error) {
    throw error;
  }

  return data?.[0] || null;
}

export default function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let mounted = true;

    async function checkExistingSession() {
      const { data } = await supabase.auth.getSession();

      if (!mounted) return;

      if (!data.session) {
        setCheckingSession(false);
        return;
      }

      try {
        const perfil = await getMiPerfil();

        if (!mounted) return;

        if (perfil?.tipo_acceso === "global") {
          navigate("/", { replace: true });
          return;
        }

        if (perfil?.tipo_acceso === "universo" && perfil?.id_universo) {
          navigate(`/universes/${perfil.id_universo}`, { replace: true });
          return;
        }

        setErrorMsg("Tu usuario no tiene un perfil válido.");
        setCheckingSession(false);
      } catch (error) {
        setErrorMsg("No se ha podido cargar el perfil del usuario.");
        setCheckingSession(false);
      }
    }

    checkExistingSession();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setLoading(false);
      setErrorMsg("Email o contraseña incorrectos.");
      return;
    }

    try {
      const perfil = await getMiPerfil();

      setLoading(false);

      if (perfil?.tipo_acceso === "global") {
        navigate("/", { replace: true });
        return;
      }

      if (perfil?.tipo_acceso === "universo" && perfil?.id_universo) {
        navigate(`/universes/${perfil.id_universo}`, { replace: true });
        return;
      }

      setErrorMsg("Tu usuario no tiene un perfil válido.");
    } catch (err) {
      setLoading(false);
      setErrorMsg("No se ha podido cargar el perfil del usuario.");
    }
  };

  if (checkingSession) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>Cargando...</div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>Dashboard de Proyectos O2</h1>
          <p style={styles.subtitle}>Acceso privado</p>
        </div>

        <form onSubmit={handleLogin} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Contraseña</label>
            <input
              type="password"
              placeholder="Introduce tu contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              required
            />
          </div>

          {errorMsg ? <div style={styles.error}>{errorMsg}</div> : null}

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? "Entrando..." : "Iniciar sesión"}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    margin: 0,
    padding: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #0b132b 0%, #1c2541 38%, #0f766e 100%)",
    fontFamily:
      "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    boxSizing: "border-box",
  },
  card: {
    width: "100%",
    maxWidth: "420px",
    background: "rgba(255, 255, 255, 0.96)",
    border: "1px solid rgba(255, 255, 255, 0.35)",
    borderRadius: "20px",
    padding: "32px",
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.20)",
    boxSizing: "border-box",
  },
  header: {
    marginBottom: "24px",
    textAlign: "center",
  },
  title: {
    margin: "0 0 8px 0",
    fontSize: "28px",
    color: "#0f172a",
  },
  subtitle: {
    margin: 0,
    color: "#475569",
    fontSize: "14px",
  },
  form: {
    display: "grid",
    gap: "16px",
  },
  field: {
    display: "grid",
    gap: "8px",
  },
  label: {
    fontSize: "14px",
    fontWeight: 600,
    color: "#0f172a",
  },
  input: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1px solid #cbd5e1",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
    background: "#ffffff",
  },
  button: {
    marginTop: "8px",
    padding: "12px 16px",
    border: "none",
    borderRadius: "12px",
    background: "#0f766e",
    color: "#ffffff",
    fontWeight: 700,
    fontSize: "14px",
    cursor: "pointer",
  },
  error: {
    background: "#fee2e2",
    color: "#991b1b",
    border: "1px solid #fecaca",
    padding: "12px",
    borderRadius: "12px",
    fontSize: "14px",
  },
};
