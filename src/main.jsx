import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { supabase } from "./supabase";

function App() {
  const [universos, setUniversos] = useState([]);
  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState("");

  const [form, setForm] = useState({
    id_universo: "",
    titulo: "",
    descripcion: "",
    beneficios: "",
    inversion_estimada: "",
    impacto_estimado: "",
    owner: "",
    fase: "En Definición",
    situacion: "En tiempo",
    fecha_inicio: "",
    fecha_fin: ""
  });

  useEffect(() => {
    async function cargarUniversos() {
      const { data, error } = await supabase
        .from("universos_negocio")
        .select("id_universo, nombre")
        .order("nombre");

      if (error) {
        setMensaje(`Error cargando universos: ${error.message}`);
        setTipoMensaje("error");
      } else {
        setUniversos(data || []);
      }
    }

    cargarUniversos();
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMensaje("Guardando proyecto...");
    setTipoMensaje("info");

    const { data, error } = await supabase.rpc("crear_proyecto", {
      p_id_universo: Number(form.id_universo),
      p_titulo: form.titulo,
      p_descripcion: form.descripcion || null,
      p_beneficios: form.beneficios || null,
      p_inversion_estimada:
        form.inversion_estimada === "" ? 0 : Number(form.inversion_estimada),
      p_impacto_estimado:
        form.impacto_estimado === "" ? 0 : Number(form.impacto_estimado),
      p_owner: form.owner,
      p_fase: form.fase,
      p_situacion: form.situacion,
      p_fecha_inicio: form.fecha_inicio || null,
      p_fecha_fin: form.fecha_fin || null
    });

    if (error) {
      setMensaje(`Error guardando proyecto: ${error.message}`);
      setTipoMensaje("error");
      return;
    }

    setMensaje(`Proyecto creado correctamente: ${data.id_proyecto}`);
    setTipoMensaje("success");

    setForm({
      id_universo: "",
      titulo: "",
      descripcion: "",
      beneficios: "",
      inversion_estimada: "",
      impacto_estimado: "",
      owner: "",
      fase: "En Definición",
      situacion: "En tiempo",
      fecha_inicio: "",
      fecha_fin: ""
    });
  }

  const styles = {
    page: {
      minHeight: "100vh",
      margin: 0,
      padding: "24px",
      fontFamily:
        "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      background:
        "linear-gradient(135deg, #0f172a 0%, #1e293b 35%, #0f766e 100%)",
      color: "#0f172a",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    },
    shell: {
      width: "100%",
      maxWidth: "1180px"
    },
    card: {
      background: "rgba(255,255,255,0.96)",
      borderRadius: "24px",
      boxShadow: "0 25px 70px rgba(15, 23, 42, 0.30)",
      overflow: "hidden",
      backdropFilter: "blur(10px)"
    },
    header: {
      padding: "28px 32px 18px 32px",
      background: "linear-gradient(135deg, #ffffff 0%, #ecfeff 100%)",
      borderBottom: "1px solid #e2e8f0"
    },
    eyebrow: {
      fontSize: "11px",
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: "0.12em",
      color: "#0f766e",
      marginBottom: "8px"
    },
    title: {
      margin: 0,
      fontSize: "28px",
      lineHeight: 1.1,
      fontWeight: 800,
      color: "#0f172a"
    },
    subtitle: {
      margin: "8px 0 0 0",
      fontSize: "13px",
      lineHeight: 1.5,
      color: "#475569",
      maxWidth: "760px"
    },
    content: {
      padding: "24px 32px 32px 32px"
    },
    form: {
      display: "grid",
      gap: "18px"
    },
    grid2: {
      display: "grid",
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
      gap: "16px"
    },
    grid1: {
      display: "grid",
      gridTemplateColumns: "1fr",
      gap: "16px"
    },
    sectionTitle: {
      margin: "8px 0 0 0",
      fontSize: "13px",
      fontWeight: 800,
      color: "#0f172a"
    },
    field: {
      display: "flex",
      flexDirection: "column",
      gap: "6px"
    },
    label: {
      fontSize: "12px",
      fontWeight: 700,
      color: "#334155"
    },
    input: {
      width: "100%",
      padding: "11px 12px",
      borderRadius: "12px",
      border: "1px solid #cbd5e1",
      fontSize: "13px",
      outline: "none",
      boxSizing: "border-box",
      background: "#ffffff",
      color: "#0f172a"
    },
    textarea: {
      width: "100%",
      padding: "11px 12px",
      borderRadius: "12px",
      border: "1px solid #cbd5e1",
      fontSize: "13px",
      outline: "none",
      boxSizing: "border-box",
      resize: "vertical",
      background: "#ffffff",
      color: "#0f172a",
      minHeight: "110px"
    },
    banner: {
      borderRadius: "14px",
      padding: "12px 14px",
      fontSize: "13px",
      fontWeight: 600
    },
    actions: {
      display: "flex",
      justifyContent: "flex-end",
      marginTop: "6px"
    },
    button: {
      border: "none",
      borderRadius: "14px",
      padding: "13px 18px",
      fontSize: "13px",
      fontWeight: 800,
      cursor: "pointer",
      color: "#ffffff",
      background: "linear-gradient(135deg, #0f766e 0%, #0891b2 100%)",
      boxShadow: "0 10px 24px rgba(8, 145, 178, 0.28)"
    }
  };

  const bannerStyle =
    tipoMensaje === "error"
      ? { background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca" }
      : tipoMensaje === "success"
      ? { background: "#ecfdf5", color: "#047857", border: "1px solid #a7f3d0" }
      : { background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" };

  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <div style={styles.card}>
          <div style={styles.header}>
            <div style={styles.eyebrow}>Dashboard de proyectos</div>
            <h1 style={styles.title}>Alta de Proyecto</h1>
            <p style={styles.subtitle}>
              Registra un nuevo proyecto en una única pantalla. El identificador
              se generará automáticamente con el formato del universo seleccionado.
            </p>
          </div>

          <div style={styles.content}>
            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.grid2}>
                <div style={styles.field}>
                  <label style={styles.label}>Universo</label>
                  <select
                    name="id_universo"
                    value={form.id_universo}
                    onChange={handleChange}
                    required
                    style={styles.input}
                  >
                    <option value="">Selecciona un universo</option>
                    {universos.map((u) => (
                      <option key={u.id_universo} value={u.id_universo}>
                        {u.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>Owner</label>
                  <input
                    type="text"
                    name="owner"
                    value={form.owner}
                    onChange={handleChange}
                    required
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.grid1}>
                <div style={styles.field}>
                  <label style={styles.label}>Título del proyecto</label>
                  <input
                    type="text"
                    name="titulo"
                    value={form.titulo}
                    onChange={handleChange}
                    required
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.grid2}>
                <div style={styles.field}>
                  <label style={styles.label}>Fase</label>
                  <select
                    name="fase"
                    value={form.fase}
                    onChange={handleChange}
                    required
                    style={styles.input}
                  >
                    <option value="En Definición">En Definición</option>
                    <option value="En Planificación">En Planificación</option>
                    <option value="En Curso">En Curso</option>
                    <option value="Finalizado">Finalizado</option>
                  </select>
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>Situación</label>
                  <select
                    name="situacion"
                    value={form.situacion}
                    onChange={handleChange}
                    required
                    style={styles.input}
                  >
                    <option value="En tiempo">En tiempo</option>
                    <option value="Riesgo de retraso">Riesgo de retraso</option>
                    <option value="Retrasado">Retrasado</option>
                  </select>
                </div>
              </div>

              <div style={styles.grid2}>
                <div style={styles.field}>
                  <label style={styles.label}>Fecha inicio</label>
                  <input
                    type="date"
                    name="fecha_inicio"
                    value={form.fecha_inicio}
                    onChange={handleChange}
                    style={styles.input}
                  />
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>Fecha fin</label>
                  <input
                    type="date"
                    name="fecha_fin"
                    value={form.fecha_fin}
                    onChange={handleChange}
                    style={styles.input}
                  />
                </div>
              </div>

              <h2 style={styles.sectionTitle}>Valor del proyecto</h2>

              <div style={styles.grid2}>
                <div style={styles.field}>
                  <label style={styles.label}>Inversión estimada (€)</label>
                  <input
                    type="number"
                    name="inversion_estimada"
                    value={form.inversion_estimada}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    style={styles.input}
                  />
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>Impacto estimado (€)</label>
                  <input
                    type="number"
                    name="impacto_estimado"
                    value={form.impacto_estimado}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.grid2}>
                <div style={styles.field}>
                  <label style={styles.label}>Descripción</label>
                  <textarea
                    name="descripcion"
                    value={form.descripcion}
                    onChange={handleChange}
                    style={styles.textarea}
                  />
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>Beneficios</label>
                  <textarea
                    name="beneficios"
                    value={form.beneficios}
                    onChange={handleChange}
                    style={styles.textarea}
                  />
                </div>
              </div>

              {mensaje && <div style={{ ...styles.banner, ...bannerStyle }}>{mensaje}</div>}

              <div style={styles.actions}>
                <button type="submit" style={styles.button}>
                  Guardar proyecto
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
