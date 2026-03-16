import React, { useEffect, useState } from "react";
import { supabase } from "../supabase"; // cambia a ../supabase si el archivo está en /src

export default function NewProjectPage() {
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
      p_fase: "En Definición",
      p_situacion: "En tiempo",
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
      fecha_inicio: "",
      fecha_fin: ""
    });
  }

  const styles = {
  page: {
    minHeight: "100vh",
    margin: 0,
    padding: "8px",
    fontFamily:
      "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    background: "#f1f5f9",
    color: "#0f172a",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    boxSizing: "border-box"
  },
    shell: {
      width: "100%",
      maxWidth: "1120px"
    },
    card: {
      background: "rgba(255,255,255,0.96)",
      borderRadius: "20px",
      boxShadow: "0 18px 45px rgba(15, 23, 42, 0.28)",
      overflow: "hidden",
      backdropFilter: "blur(10px)"
    },
    header: {
      padding: "18px 24px 12px 24px",
      background: "linear-gradient(135deg, #ffffff 0%, #ecfeff 100%)",
      borderBottom: "1px solid #e2e8f0"
    },
    eyebrow: {
      fontSize: "10px",
      fontWeight: 800,
      textTransform: "uppercase",
      letterSpacing: "0.12em",
      color: "#0f766e",
      marginBottom: "6px"
    },
    title: {
      margin: 0,
      fontSize: "24px",
      lineHeight: 1.05,
      fontWeight: 800,
      color: "#0f172a"
    },
    subtitle: {
      margin: "6px 0 0 0",
      fontSize: "12px",
      lineHeight: 1.35,
      color: "#475569",
      maxWidth: "760px"
    },
    content: {
      padding: "16px 24px 20px 24px"
    },
    form: {
      display: "grid",
      gap: "12px"
    },
    grid2: {
      display: "grid",
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
      gap: "12px"
    },
    field: {
      display: "flex",
      flexDirection: "column",
      gap: "4px"
    },
    label: {
      fontSize: "11px",
      fontWeight: 700,
      color: "#334155"
    },
    input: {
      width: "100%",
      padding: "9px 10px",
      borderRadius: "10px",
      border: "1px solid #cbd5e1",
      fontSize: "12px",
      outline: "none",
      boxSizing: "border-box",
      background: "#ffffff",
      color: "#0f172a",
      height: "36px"
    },
    textarea: {
      width: "100%",
      padding: "9px 10px",
      borderRadius: "10px",
      border: "1px solid #cbd5e1",
      fontSize: "12px",
      outline: "none",
      boxSizing: "border-box",
      resize: "none",
      background: "#ffffff",
      color: "#0f172a",
      minHeight: "74px"
    },
    banner: {
      borderRadius: "12px",
      padding: "9px 12px",
      fontSize: "12px",
      fontWeight: 600
    },
    actions: {
      display: "flex",
      justifyContent: "flex-end",
      marginTop: "2px"
    },
    button: {
      border: "none",
      borderRadius: "12px",
      padding: "11px 16px",
      fontSize: "12px",
      fontWeight: 800,
      cursor: "pointer",
      color: "#ffffff",
      background: "linear-gradient(135deg, #0f766e 0%, #0891b2 100%)",
      boxShadow: "0 10px 22px rgba(8, 145, 178, 0.22)"
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
              Completa la información inicial del proyecto. La fase y la situación
              se revisarán más adelante en la ficha de seguimiento.
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

              {mensaje && (
                <div style={{ ...styles.banner, ...bannerStyle }}>
                  {mensaje}
                </div>
              )}

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
