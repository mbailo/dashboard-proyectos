import React, { useEffect, useState } from "react";
import { supabase } from "../supabase"; // cambia a ../supabase si el archivo está en /src
import { useNavigate } from "react-router-dom";

async function getMiPerfil() {
  const { data, error } = await supabase.rpc("mi_perfil");

  if (error) {
    throw error;
  }

  return data?.[0] || null;
}

export default function NewProjectPage() {
  const navigate = useNavigate();
  const [universos, setUniversos] = useState([]);
  const [perfil, setPerfil] = useState(null);
  const [universoBloqueado, setUniversoBloqueado] = useState(null);
  const [cargandoAcceso, setCargandoAcceso] = useState(true);
  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState("");

  const [form, setForm] = useState({
    id_universo: "",
    titulo: "",
    descripcion: "",
    beneficios: "",
    impacto_estimado: "",
    owner: "",
    horizonte: ""
//    fecha_inicio: "",
//    fecha_fin: ""
  });

  useEffect(() => {
    let mounted = true;

    async function cargarDatosAcceso() {
      try {
        setCargandoAcceso(true);
        setMensaje("");
        setTipoMensaje("");

        const perfilData = await getMiPerfil();

        if (!mounted) return;

        if (!perfilData || !perfilData.activo) {
          navigate("/login", { replace: true });
          return;
        }

        setPerfil(perfilData);

        if (perfilData.tipo_acceso === "global") {
          const { data, error } = await supabase
            .from("universos_negocio")
            .select("id_universo, nombre")
            .order("nombre");

          if (!mounted) return;

          if (error) {
            setMensaje(`Error cargando universos: ${error.message}`);
            setTipoMensaje("error");
          } else {
            setUniversos(data || []);
          }

          setCargandoAcceso(false);
          return;
        }

        if (
          perfilData.tipo_acceso === "universo" &&
          perfilData.id_universo
        ) {
          const { data, error } = await supabase
            .from("universos_negocio")
            .select("id_universo, nombre")
            .eq("id_universo", perfilData.id_universo)
            .single();

          if (!mounted) return;

          if (error) {
            setMensaje(`Error cargando el universo asignado: ${error.message}`);
            setTipoMensaje("error");
            setCargandoAcceso(false);
            return;
          }

          setUniversoBloqueado(data);
          setForm((prev) => ({
            ...prev,
            id_universo: String(data.id_universo)
          }));
          setCargandoAcceso(false);
          return;
        }

        setMensaje("Tu usuario no tiene un perfil válido.");
        setTipoMensaje("error");
        setCargandoAcceso(false);
      } catch (error) {
        if (!mounted) return;
        setMensaje(`Error validando acceso: ${error.message}`);
        setTipoMensaje("error");
        setCargandoAcceso(false);
      }
    }

    cargarDatosAcceso();

    return () => {
      mounted = false;
    };
  }, [navigate]);

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

    if (!form.id_universo) {
      setMensaje("Debes informar un universo válido.");
      setTipoMensaje("error");
      return;
    }

    if (
      perfil?.tipo_acceso === "universo" &&
      Number(form.id_universo) !== perfil.id_universo
    ) {
      setMensaje("No tienes permiso para crear proyectos en otro universo.");
      setTipoMensaje("error");
      return;
    }
    
    const { data, error } = await supabase.rpc("crear_proyecto", {
      p_id_universo: Number(form.id_universo),
      p_titulo: form.titulo,
      p_descripcion: form.descripcion || null,
      p_beneficios: form.beneficios || null,
      p_impacto_estimado:
        form.impacto_estimado === "" ? 0 : Number(form.impacto_estimado),
      p_owner: form.owner,
      p_horizonte: form.horizonte,
      p_fase: "En Definición",
      p_situacion: "En tiempo"
//      p_fecha_inicio: form.fecha_inicio || null,
//      p_fecha_fin: form.fecha_fin || null
    });

    if (error) {
      setMensaje(`Error guardando proyecto: ${error.message}`);
      setTipoMensaje("error");
      return;
    }

    setMensaje("Proyecto creado correctamente");
    setTipoMensaje("success");

    const nuevoId =
      typeof data === "string"
        ? data
        : Array.isArray(data)
        ? data[0]?.id_proyecto || data[0]?.id
        : data?.id_proyecto || data?.id;

    if (!nuevoId) {
      setMensaje(
        "Proyecto creado, pero no se pudo obtener el identificador para redirigir."
      );
      setTipoMensaje("warning");
      return;
    }

    navigate(`/proyectos/${nuevoId}`);

//    setForm({
//      id_universo: "",
//      titulo: "",
//      descripcion: "",
//      beneficios: "",
//      impacto_estimado: "",
//      owner: "",
//      horizonte: "",
//      fecha_inicio: "",
//      fecha_fin: ""
//    });
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
      background: "#ffffff",
      borderRadius: "8px",
      border: "1px solid #e2e8f0"
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
      padding: "12px 20px 16px 20px"
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

  if (cargandoAcceso) {
    return <div style={{ padding: "24px" }}>Cargando...</div>;
  }
  
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

                  {perfil?.tipo_acceso === "global" ? (
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
                  ) : (
                    <>
                      <input
                        type="text"
                        value={universoBloqueado?.nombre || ""}
                        readOnly
                        style={{
                          ...styles.input,
                          background: "#f8fafc",
                          color: "#475569",
                          cursor: "not-allowed"
                        }}
                      />
                      <input
                        type="hidden"
                        name="id_universo"
                        value={form.id_universo}
                      />
                    </>
                  )}
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

              <div style={styles.grid2}>
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

                <div style={styles.field}>
                  <label style={styles.label}>Horizonte</label>
                  <select
                    name="horizonte"
                    value={form.horizonte}
                    onChange={handleChange}
                    required
                    style={styles.input}
                  >
                    <option value="">Selecciona un horizonte</option>
                    <option value="Quick-Win">Quick-Win</option>
                    <option value="Mid-term">Mid-term</option>
                  </select>
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
              
{/*   // Eliminamos el bloque dónde pedimos fecha inicio y fecha fin
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
*/}

              <div style={styles.grid2}>
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
