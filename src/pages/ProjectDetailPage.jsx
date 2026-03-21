import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Settings, Trash } from "lucide-react";
import { supabase } from "../supabase";

/* FUNCIONES AUXILIARES */

function formatCurrency(value) {
  if (value === null || value === undefined) return "-";
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

function formatDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("es-ES").format(new Date(value));
}

function formatTaskDelay(fechaFin, situacion) {
  if (!fechaFin || situacion !== "Retrasado") return "-";

  const today = new Date();
  const end = new Date(fechaFin);

  today.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  const diffMs = today - end;

  if (diffMs <= 0) return "-";

  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffWeeks = Math.ceil(diffDays / 7);

  return `-${diffWeeks} wks`;
}

function InfoCard({ label, value }) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: "12px",
        padding: "16px",
      }}
    >
      <div
        style={{
          fontSize: "12px",
          color: "#6b7280",
          marginBottom: "6px",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: "16px", fontWeight: 600, color: "#111827" }}>
        {value || "-"}
      </div>
    </div>
  );
}

function getTaskPhaseBadgeStyle(fase) {
  switch (fase) {
    case "No Iniciada":
      return {
        background: "#f3f4f6",
        color: "#4b5563",
        border: "1px solid #e5e7eb",
      };
    case "Planificada":
      return {
        background: "#eff6ff",
        color: "#1d4ed8",
        border: "1px solid #bfdbfe",
      };
    case "En curso":
      return {
        background: "#ecfeff",
        color: "#0f766e",
        border: "1px solid #a5f3fc",
      };
    case "Finalizada":
      return {
        background: "#ecfdf5",
        color: "#047857",
        border: "1px solid #a7f3d0",
      };
    default:
      return {
        background: "#f9fafb",
        color: "#374151",
        border: "1px solid #e5e7eb",
      };
  }
}

function getTaskStatusBadgeStyle(estado) {
  switch (estado) {
    case "En tiempo":
      return {
        background: "#ecfdf5",
        color: "#047857",
        border: "1px solid #a7f3d0",
      };
    case "Riesgo de retraso":
      return {
        background: "#fffbeb",
        color: "#b45309",
        border: "1px solid #fde68a",
      };
    case "Retrasado":
      return {
        background: "#fef2f2",
        color: "#b91c1c",
        border: "1px solid #fecaca",
      };
    default:
      return {
        background: "#f9fafb",
        color: "#374151",
        border: "1px solid #e5e7eb",
      };
  }
}

/* ESTILOS BASE thStyle, Badges, etc. */

const thStyle = {
  position: "sticky",
  top: 0,
  background: "#f8fafc",
  textAlign: "left",
  padding: "14px 14px",
  fontSize: "12px",
  fontWeight: 700,
  color: "#475569",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  borderBottom: "1px solid #dbe4ee",
  whiteSpace: "nowrap",
};

const tdStyle = {
  padding: "14px 14px",
  borderBottom: "1px solid #edf2f7",
  fontSize: "14px",
  color: "#334155",
  whiteSpace: "nowrap",
  background: "rgba(255,255,255,0.78)",
  verticalAlign: "top",
};

const tdTitleStyle = {
  ...tdStyle,
  width: "180px",
  maxWidth: "180px",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  fontWeight: 700,
  color: "#0f172a",
};

const tdDescriptionStyle = {
  ...tdStyle,
  width: "320px",
  minWidth: "320px",
  maxWidth: "320px",
  whiteSpace: "normal",
  wordBreak: "break-word",
  overflowWrap: "anywhere",
  lineHeight: 1.4,
};

const tdOwnerStyle = {
  ...tdStyle,
  width: "140px",
  maxWidth: "140px",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  fontWeight: 700,
  color: "#0f172a",
};

const tdDateStyle = {
  ...tdStyle,
  width: "110px",
  whiteSpace: "nowrap",
};

const tdBadgeStyle = {
  ...tdStyle,
  width: "140px",
  whiteSpace: "nowrap",
};

const tdDelayStyle = {
  ...tdStyle,
  width: "90px",
  whiteSpace: "nowrap",
};

const tdActionsStyle = {
  ...tdStyle,
  width: "110px",
  whiteSpace: "nowrap",
};

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: "8px",
  border: "1px solid #d1d5db",
  fontSize: "14px",
  boxSizing: "border-box",
};

const labelStyle = {
  display: "block",
  fontSize: "13px",
  fontWeight: 600,
  color: "#374151",
  marginBottom: "6px",
};

const primaryButtonStyle = {
  background: "#2563eb",
  color: "#ffffff",
  border: "none",
  borderRadius: "8px",
  padding: "10px 14px",
  fontSize: "14px",
  fontWeight: 600,
  cursor: "pointer",
};

const secondaryButtonStyle = {
  background: "#ffffff",
  color: "#374151",
  border: "1px solid #d1d5db",
  borderRadius: "8px",
  padding: "10px 14px",
  fontSize: "14px",
  fontWeight: 600,
  cursor: "pointer",
};

const badgeStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "999px",
  padding: "6px 10px",
  fontSize: "12px",
  fontWeight: 700,
  whiteSpace: "nowrap",
};

const tableCardStyle = {
  width: "100%",
  margin: "0 auto",
  boxSizing: "border-box",
  background: "rgba(255,255,255,0.92)",
  border: "1px solid #dbe4ee",
  borderRadius: "20px",
  padding: "18px",
  boxShadow: "0 14px 36px rgba(15, 23, 42, 0.08)",
  backdropFilter: "blur(8px)",
};

const tableHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
  flexWrap: "wrap",
  marginBottom: "14px",
};

const tableTitleStyle = {
  margin: 0,
  fontSize: "22px",
  color: "#0f172a",
};

const tableSubtitleStyle = {
  margin: "4px 0 0 0",
  fontSize: "13px",
  color: "#64748b",
};

const tableWrapperStyle = {
  width: "100%",
  overflowX: "auto",
};

const tableStyle = {
  width: "100%",
  minWidth: "1100px",
  margin: "0 auto",
  borderCollapse: "separate",
  borderSpacing: 0,
  tableLayout: "fixed",
};

/* EMPIEZA useState() */

export default function ProjectDetailPage() {
  const { id } = useParams();

  const [proyecto, setProyecto] = useState(null);
  const [tareas, setTareas] = useState([]);
  const [costes, setCostes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [editingTask, setEditingTask] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const [showTaskForm, setShowTaskForm] = useState(false);
  const [savingTask, setSavingTask] = useState(false);
  const [taskErrorMsg, setTaskErrorMsg] = useState("");
  const [taskForm, setTaskForm] = useState({
    titulo: "",
    descripcion: "",
    owner: "",
    estado_tarea: "No Iniciada",
    situacion: "En tiempo",
    fecha_inicio: "",
    fecha_fin: "",
  });

  const [showCostForm, setShowCostForm] = useState(false);
  const [savingCost, setSavingCost] = useState(false);
  const [costErrorMsg, setCostErrorMsg] = useState("");
  const [costForm, setCostForm] = useState({
    titulo: "",
    descripcion: "",
    tipo_coste: "OpEx",
    importe: "",
  });

  async function loadProject(projectId) {
    const { data, error } = await supabase
      .from("proyectos")
      .select(`
        id_proyecto,
        id_universo,
        titulo,
        descripcion,
        beneficios,
        inversion_estimada,
        impacto_estimado,
        owner,
        fase,
        situacion,
        fecha_inicio,
        fecha_fin,
        universos_negocio (
          nombre
        )
      `)
      .eq("id_proyecto", projectId)
      .single();

    if (error) {
      throw new Error(error.message || "No se pudo cargar el proyecto");
    }

    return data;
  }

  async function loadTasks(projectId) {
    const { data, error } = await supabase
      .from("tareas")
      .select(`
        id_tarea,
        id_proyecto,
        titulo,
        descripcion,
        owner,
        estado_tarea,
        situacion,
        fecha_inicio,
        fecha_fin
      `)
      .eq("id_proyecto", projectId)
      .order("fecha_inicio", { ascending: true })
      .order("fecha_fin", { ascending: true });

    if (error) {
      throw new Error(error.message || "No se pudieron cargar las tareas");
    }

    return data || [];
  }

  async function loadCostes(projectId) {
    const { data, error } = await supabase
      .from("costes_proyecto")
      .select(`
        id_coste,
        id_proyecto,
        titulo,
        descripcion,
        tipo_coste,
        importe
      `)
      .eq("id_proyecto", projectId)
      .order("id_coste", { ascending: true });

    if (error) {
      throw new Error(error.message || "No se pudieron cargar los costes");
    }

    return data || [];
  }

  async function loadAll() {
    try {
      setLoading(true);
      setErrorMsg("");

      const [proyectoData, tareasData, costesData] = await Promise.all([
        loadProject(id),
        loadTasks(id),
        loadCostes(id),
      ]);

      setProyecto(proyectoData);
      setTareas(tareasData);
      setCostes(costesData);
    } catch (err) {
      setErrorMsg(err.message || "Error cargando la ficha del proyecto");
      setProyecto(null);
      setTareas([]);
      setCostes([]);
    } finally {
      setLoading(false);
    }
  }

  const handleUpdateTask = async () => {
  if (!editingTask) return;

  const { error } = await supabase
    .from("tareas")
    .update({
      titulo: editingTask.titulo,
      descripcion: editingTask.descripcion,
      owner: editingTask.owner,
      estado_tarea: editingTask.estado_tarea,
      situacion: editingTask.situacion,
      fecha_inicio: editingTask.fecha_inicio || null,
      fecha_fin: editingTask.fecha_fin || null,
    })
    .eq("id_tarea", editingTask.id_tarea);

  if (error) {
    console.error("Error al actualizar tarea:", error);
    alert("Error al actualizar la tarea");
    return;
  }

  await loadAll();
  setShowEditModal(false);
  setEditingTask(null);
};

async function handleDeleteTask(idTarea) {
  const confirmed = window.confirm("¿Seguro que quieres eliminar esta tarea?");
  if (!confirmed) return;

  try {
    const { error } = await supabase
      .from("tareas")
      .delete()
      .eq("id_tarea", idTarea);

    if (error) {
      throw error;
    }

    await loadAll();
  } catch (err) {
    console.error("Error al eliminar tarea:", err);
    alert(err.message || "Error al eliminar la tarea");
  }
}
  
/* EMPIEZA useEffect() */
  
  useEffect(() => {
    loadAll();
  }, [id]);

  function handleTaskFormChange(e) {
    const { name, value } = e.target;
    setTaskForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleCostFormChange(e) {
    const { name, value } = e.target;
    setCostForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleCreateTask(e) {
    e.preventDefault();
    setSavingTask(true);
    setTaskErrorMsg("");

    const { error } = await supabase.rpc("crear_tarea", {
      p_id_proyecto: id,
      p_titulo: taskForm.titulo,
      p_descripcion: taskForm.descripcion || null,
      p_owner: taskForm.owner || null,
      p_estado_tarea: taskForm.estado_tarea,
      p_situacion: taskForm.situacion,
      p_fecha_inicio: taskForm.fecha_inicio || null,
      p_fecha_fin: taskForm.fecha_fin || null,
    });

    if (error) {
      setTaskErrorMsg(error.message || "No se pudo crear la tarea");
      setSavingTask(false);
      return;
    }

    setTaskForm({
      titulo: "",
      descripcion: "",
      owner: "",
      estado_tarea: "No Iniciada",
      situacion: "En tiempo",
      fecha_inicio: "",
      fecha_fin: "",
    });

    setShowTaskForm(false);
    setSavingTask(false);

    try {
      const tareasActualizadas = await loadTasks(id);
      setTareas(tareasActualizadas);
    } catch (err) {
      setTaskErrorMsg(err.message || "La tarea se creó, pero no se pudo recargar la tabla");
    }
  }

  async function handleCreateCost(e) {
    e.preventDefault();
    setSavingCost(true);
    setCostErrorMsg("");

    const { error } = await supabase.rpc("crear_coste", {
      p_id_proyecto: id,
      p_titulo: costForm.titulo,
      p_descripcion: costForm.descripcion || null,
      p_tipo_coste: costForm.tipo_coste,
      p_importe: costForm.importe === "" ? 0 : Number(costForm.importe),
    });

    if (error) {
      setCostErrorMsg(error.message || "No se pudo crear el coste");
      setSavingCost(false);
      return;
    }

    setCostForm({
      titulo: "",
      descripcion: "",
      tipo_coste: "OpEx",
      importe: "",
    });

    setShowCostForm(false);
    setSavingCost(false);

    try {
      const costesActualizados = await loadCostes(id);
      setCostes(costesActualizados);
    } catch (err) {
      setCostErrorMsg(err.message || "El coste se creó, pero no se pudo recargar la tabla");
    }
  }

  if (loading) {
    return <p>Cargando proyecto...</p>;
  }

  if (errorMsg) {
    return (
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #fecaca",
          color: "#b91c1c",
          borderRadius: "12px",
          padding: "16px",
        }}
      >
        Error cargando el proyecto: {errorMsg}
      </div>
    );
  }

  if (!proyecto) {
    return <p>No se ha encontrado el proyecto.</p>;
  }

  const nombreUniverso = proyecto.universos_negocio?.nombre || "-";

  return (
    <div style={{ display: "grid", gap: "24px" }}>
        <section
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "16px",
            padding: "20px",
            display: "grid",
            gap: "16px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "16px",
              flexWrap: "wrap",
            }}
          >
            <div style={{ minWidth: "280px", flex: 1 }}>
              <div
                style={{
                  fontSize: "12px",
                  color: "#6b7280",
                  marginBottom: "6px",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                {proyecto.id_proyecto} · {nombreUniverso}
              </div>
        
              <h2
                style={{
                  margin: 0,
                  fontSize: "26px",
                  lineHeight: 1.15,
                  color: "#111827",
                }}
              >
                {proyecto.titulo}
              </h2>
            </div>
        
            <div
              style={{
                display: "flex",
                gap: "8px",
                flexWrap: "wrap",
                justifyContent: "flex-end",
              }}
            >
              <span
                style={{
                  padding: "6px 10px",
                  borderRadius: "999px",
                  background: "#eff6ff",
                  color: "#1d4ed8",
                  fontSize: "13px",
                  fontWeight: 600,
                }}
              >
                Owner: {proyecto.owner || "-"}
              </span>
        
              <span
                style={{
                  padding: "6px 10px",
                  borderRadius: "999px",
                  background: "#f3f4f6",
                  color: "#374151",
                  fontSize: "13px",
                  fontWeight: 600,
                }}
              >
                Fase: {proyecto.fase || "-"}
              </span>
        
              <span
                style={{
                  padding: "6px 10px",
                  borderRadius: "999px",
                  background: "#f9fafb",
                  color: "#374151",
                  border: "1px solid #e5e7eb",
                  fontSize: "13px",
                  fontWeight: 600,
                }}
              >
                Situación: {proyecto.situacion || "-"}
              </span>
            </div>
          </div>
        
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "12px",
            }}
          >
            <div
              style={{
                background: "#f9fafb",
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
                padding: "12px 14px",
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  color: "#6b7280",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  marginBottom: "4px",
                }}
              >
                Inversión estimada
              </div>
              <div style={{ fontSize: "18px", fontWeight: 700, color: "#111827" }}>
                {formatCurrency(proyecto.inversion_estimada)}
              </div>
            </div>
        
            <div
              style={{
                background: "#f9fafb",
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
                padding: "12px 14px",
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  color: "#6b7280",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  marginBottom: "4px",
                }}
              >
                Impacto estimado
              </div>
              <div style={{ fontSize: "18px", fontWeight: 700, color: "#111827" }}>
                {formatCurrency(proyecto.impacto_estimado)}
              </div>
            </div>
        
            <div
              style={{
                background: "#f9fafb",
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
                padding: "12px 14px",
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  color: "#6b7280",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  marginBottom: "4px",
                }}
              >
                Fecha de inicio
              </div>
              <div style={{ fontSize: "16px", fontWeight: 600, color: "#111827" }}>
                {formatDate(proyecto.fecha_inicio)}
              </div>
            </div>
        
            <div
              style={{
                background: "#f9fafb",
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
                padding: "12px 14px",
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  color: "#6b7280",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  marginBottom: "4px",
                }}
              >
                Fecha fin
              </div>
              <div style={{ fontSize: "16px", fontWeight: 600, color: "#111827" }}>
                {formatDate(proyecto.fecha_fin)}
              </div>
            </div>
          </div>
        
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
            }}
          >
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
                padding: "14px",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  color: "#6b7280",
                  marginBottom: "8px",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                Descripción del proyecto
              </div>
              <p
                style={{
                  margin: 0,
                  color: "#374151",
                  lineHeight: 1.45,
                  fontSize: "14px",
                }}
              >
                {proyecto.descripcion || "Sin descripción"}
              </p>
            </div>
        
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
                padding: "14px",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  color: "#6b7280",
                  marginBottom: "8px",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                Beneficios esperados
              </div>
              <p
                style={{
                  margin: 0,
                  color: "#374151",
                  lineHeight: 1.45,
                  fontSize: "14px",
                }}
              >
                {proyecto.beneficios || "No informados"}
              </p>
            </div>
          </div>
        </section>
      
        <section style={tableCardStyle}>
        <div style={tableHeaderStyle}>
          <div>
            <h3 style={tableTitleStyle}>Tareas del proyecto</h3>
            <p style={tableSubtitleStyle}>
              Mismo contenido y badges, con el formato visual alineado con la tabla de detalle del universo.
            </p>
          </div>

          <button
            type="button"
            style={primaryButtonStyle}
            onClick={() => {
              setShowTaskForm((prev) => !prev);
              setTaskErrorMsg("");
            }}
          >
            {showTaskForm ? "Cancelar" : "+ Nueva tarea"}
          </button>
        </div>

        {showTaskForm && (
          <form
            onSubmit={handleCreateTask}
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: "12px",
              padding: "16px",
              marginBottom: "20px",
              background: "#f9fafb",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "16px",
              }}
            >
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Título de la tarea</label>
                <input
                  type="text"
                  name="titulo"
                  value={taskForm.titulo}
                  onChange={handleTaskFormChange}
                  style={inputStyle}
                  maxLength={32}
                  required
                />
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Descripción</label>
                <textarea
                  name="descripcion"
                  value={taskForm.descripcion}
                  onChange={handleTaskFormChange}
                  maxLength={256}
                  style={{
                    ...inputStyle,
                    minHeight: "90px",
                    resize: "vertical",
                    fontFamily: "inherit",
                  }}
                />
              </div>

              <div>
                <label style={labelStyle}>Owner</label>
                <input
                  type="text"
                  name="owner"
                  value={taskForm.owner}
                  onChange={handleTaskFormChange}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Estado</label>
                <select
                  name="estado_tarea"
                  value={taskForm.estado_tarea}
                  onChange={handleTaskFormChange}
                  style={inputStyle}
                >
                  <option value="No Iniciada">No Iniciada</option>
                  <option value="Planificada">Planificada</option>
                  <option value="En curso">En curso</option>
                  <option value="Finalizada">Finalizada</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Situación</label>
                <select
                  name="situacion"
                  value={taskForm.situacion}
                  onChange={handleTaskFormChange}
                  style={inputStyle}
                >
                  <option value="En tiempo">En tiempo</option>
                  <option value="Riesgo de retraso">Riesgo de retraso</option>
                  <option value="Retrasado">Retrasado</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Fecha inicio</label>
                <input
                  type="date"
                  name="fecha_inicio"
                  value={taskForm.fecha_inicio}
                  onChange={handleTaskFormChange}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Fecha fin</label>
                <input
                  type="date"
                  name="fecha_fin"
                  value={taskForm.fecha_fin}
                  onChange={handleTaskFormChange}
                  style={inputStyle}
                />
              </div>
            </div>

            {taskErrorMsg && (
              <div
                style={{
                  marginTop: "16px",
                  padding: "12px",
                  borderRadius: "8px",
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  color: "#b91c1c",
                  fontSize: "14px",
                }}
              >
                {taskErrorMsg}
              </div>
            )}

            <div
              style={{
                display: "flex",
                gap: "12px",
                justifyContent: "flex-end",
                marginTop: "16px",
              }}
            >
              <button
                type="button"
                style={secondaryButtonStyle}
                onClick={() => {
                  setShowTaskForm(false);
                  setTaskErrorMsg("");
                }}
              >
                Cancelar
              </button>

              <button
                type="submit"
                style={primaryButtonStyle}
                disabled={savingTask}
              >
                {savingTask ? "Guardando..." : "Guardar tarea"}
              </button>
            </div>
          </form>
        )}

        {tareas.length === 0 ? (
          <p style={{ marginBottom: 0, color: "#6b7280" }}>
            Este proyecto todavía no tiene tareas.
          </p>
        ) : (
          <div style={tableWrapperStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={{ ...thStyle, width: "180px" }}>Título</th>
                  <th style={{ ...thStyle, width: "320px" }}>Descripción</th>
                  <th style={{ ...thStyle, width: "140px" }}>Owner</th>
                  <th style={{ ...thStyle, width: "110px" }}>Inicio</th>
                  <th style={{ ...thStyle, width: "110px" }}>Fin</th>
                  <th style={{ ...thStyle, width: "140px" }}>Fase</th>
                  <th style={{ ...thStyle, width: "140px" }}>Estado</th>
                  <th style={{ ...thStyle, width: "90px" }}>Retraso</th>
                  <th style={{ ...thStyle, width: "110px" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {tareas.map((tarea) => (
                  <tr key={tarea.id_tarea}>
                    <td style={tdTitleStyle} title={tarea.titulo || ""}>
                      {tarea.titulo || "-"}
                    </td>
                    <td style={tdDescriptionStyle}>{tarea.descripcion || "-"}</td>
                    <td style={tdOwnerStyle} title={tarea.owner || ""}>
                      {tarea.owner || "-"}
                    </td>
                    <td style={tdDateStyle}>{formatDate(tarea.fecha_inicio)}</td>
                    <td style={tdDateStyle}>{formatDate(tarea.fecha_fin)}</td>
                    <td style={tdBadgeStyle}>
                      <span
                        style={{
                          ...badgeStyle,
                          ...getTaskPhaseBadgeStyle(tarea.estado_tarea),
                        }}
                      >
                        {tarea.estado_tarea || "-"}
                      </span>
                    </td>
                    <td style={tdBadgeStyle}>
                      <span
                        style={{
                          ...badgeStyle,
                          ...getTaskStatusBadgeStyle(tarea.situacion),
                        }}
                      >
                        {tarea.situacion || "-"}
                      </span>
                    </td>
                    <td style={tdDelayStyle}>{formatTaskDelay(tarea.fecha_fin, tarea.situacion)}</td>
                    <td style={tdActionsStyle}>
                      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingTask(tarea);
                            setShowEditModal(true);
                          }}
                          title="Editar tarea"
                          aria-label="Editar tarea"
                          style={{
                            background: "#eff6ff",
                            color: "#2563eb",
                            border: "1px solid #bfdbfe",
                            borderRadius: "10px",
                            width: "36px",
                            height: "36px",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                          }}
                        >
                          <Settings size={16} />
                        </button>
                    
                        <button
                          type="button"
                          onClick={() => handleDeleteTask(tarea.id_tarea)}
                          title="Eliminar tarea"
                          aria-label="Eliminar tarea"
                          style={{
                            background: "#fef2f2",
                            color: "#dc2626",
                            border: "1px solid #fecaca",
                            borderRadius: "10px",
                            width: "36px",
                            height: "36px",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                          }}
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section style={tableCardStyle}>
        <div style={tableHeaderStyle}>
          <div>
            <h3 style={tableTitleStyle}>Costes del proyecto</h3>
            <p style={tableSubtitleStyle}>
              Tabla con el mismo lenguaje visual que en UniverseDetailPage.
            </p>
          </div>

          <button
            type="button"
            style={primaryButtonStyle}
            onClick={() => {
              setShowCostForm((prev) => !prev);
              setCostErrorMsg("");
            }}
          >
            {showCostForm ? "Cancelar" : "+ Nuevo coste"}
          </button>
        </div>

        {showCostForm && (
          <form
            onSubmit={handleCreateCost}
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: "12px",
              padding: "16px",
              marginBottom: "20px",
              background: "#f9fafb",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "16px",
              }}
            >
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Título</label>
                <input
                  type="text"
                  name="titulo"
                  value={costForm.titulo}
                  onChange={handleCostFormChange}
                  style={inputStyle}
                  required
                />
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Descripción</label>
                <textarea
                  name="descripcion"
                  value={costForm.descripcion}
                  onChange={handleCostFormChange}
                  style={{
                    ...inputStyle,
                    minHeight: "90px",
                    resize: "vertical",
                  }}
                />
              </div>

              <div>
                <label style={labelStyle}>Tipo de coste</label>
                <select
                  name="tipo_coste"
                  value={costForm.tipo_coste}
                  onChange={handleCostFormChange}
                  style={inputStyle}
                >
                  <option value="OpEx">OpEx</option>
                  <option value="CapEx">CapEx</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Importe (€)</label>
                <input
                  type="number"
                  name="importe"
                  value={costForm.importe}
                  onChange={handleCostFormChange}
                  style={inputStyle}
                  step="0.01"
                />
              </div>
            </div>

            {costErrorMsg && (
              <div
                style={{
                  marginTop: "16px",
                  padding: "12px",
                  borderRadius: "8px",
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  color: "#b91c1c",
                  fontSize: "14px",
                }}
              >
                {costErrorMsg}
              </div>
            )}

            <div
              style={{
                display: "flex",
                gap: "12px",
                justifyContent: "flex-end",
                marginTop: "16px",
              }}
            >
              <button
                type="button"
                style={secondaryButtonStyle}
                onClick={() => {
                  setShowCostForm(false);
                  setCostErrorMsg("");
                }}
              >
                Cancelar
              </button>

              <button
                type="submit"
                style={primaryButtonStyle}
                disabled={savingCost}
              >
                {savingCost ? "Guardando..." : "Guardar coste"}
              </button>
            </div>
          </form>
        )}

        {costes.length === 0 ? (
          <p style={{ marginBottom: 0, color: "#6b7280" }}>
            Este proyecto todavía no tiene costes.
          </p>
        ) : (
          <div style={tableWrapperStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Id Coste</th>
                  <th style={thStyle}>Título</th>
                  <th style={thStyle}>Descripción</th>
                  <th style={thStyle}>Tipo</th>
                  <th style={thStyle}>Importe</th>
                </tr>
              </thead>
              <tbody>
                {costes.map((coste) => (
                  <tr key={coste.id_coste}>
                    <td style={tdStyle}>{coste.id_coste}</td>
                    <td style={{ ...tdStyle, fontWeight: 700, color: "#0f172a" }}>{coste.titulo || "-"}</td>
                    <td style={tdStyle}>{coste.descripcion || "-"}</td>
                    <td style={tdStyle}>{coste.tipo_coste || "-"}</td>
                    <td style={tdStyle}>{formatCurrency(coste.importe)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
          {showEditModal && editingTask && (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15, 23, 42, 0.45)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          zIndex: 1000,
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "720px",
            background: "#ffffff",
            borderRadius: "16px",
            border: "1px solid #e5e7eb",
            boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
            padding: "24px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
            <div>
              <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}>
                {editingTask.id_tarea}
              </div>
              <h3 style={{ margin: 0, color: "#111827" }}>Editar tarea</h3>
            </div>
    
            <button
              onClick={() => setShowEditModal(false)}
              style={{
                background: "transparent",
                border: "none",
                fontSize: "24px",
                cursor: "pointer",
                color: "#6b7280",
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>
    
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
            }}
          >
            <div style={{ gridColumn: "1 / -1" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#374151",
                  marginBottom: "6px",
                }}
              >
                Título
              </label>
              <input
                type="text"
                value={editingTask.titulo || ""}
                onChange={(e) =>
                  setEditingTask({ ...editingTask, titulo: e.target.value })
                }
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  border: "1px solid #d1d5db",
                  fontSize: "14px",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#374151",
                  marginBottom: "6px",
                }}
              >
                Descripción
              </label>
              <textarea
                value={editingTask.descripcion || ""}
                onChange={(e) =>
                  setEditingTask({ ...editingTask, descripcion: e.target.value })
                }
                rows={4}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  border: "1px solid #d1d5db",
                  fontSize: "14px",
                  boxSizing: "border-box",
                  resize: "vertical",
                  fontFamily: "inherit",
                }}
              />
            </div>
            
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#374151",
                  marginBottom: "6px",
                }}
              >
                Owner
              </label>
              <input
                type="text"
                value={editingTask.owner || ""}
                onChange={(e) =>
                  setEditingTask({ ...editingTask, owner: e.target.value })
                }
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  border: "1px solid #d1d5db",
                  fontSize: "14px",
                  boxSizing: "border-box",
                }}
              />
            </div>
    
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#374151",
                  marginBottom: "6px",
                }}
              >
                Estado
              </label>
              <select
                value={editingTask.estado_tarea || "No Iniciada"}
                onChange={(e) =>
                  setEditingTask({ ...editingTask, estado_tarea: e.target.value })
                }
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  border: "1px solid #d1d5db",
                  fontSize: "14px",
                  boxSizing: "border-box",
                  background: "#ffffff",
                }}
              >
                <option value="No Iniciada">No Iniciada</option>
                <option value="Planificada">Planificada</option>
                <option value="En curso">En curso</option>
                <option value="Finalizada">Finalizada</option>
              </select>
            </div>
    
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#374151",
                  marginBottom: "6px",
                }}
              >
                Situación
              </label>
              <select
                value={editingTask.situacion || "En tiempo"}
                onChange={(e) =>
                  setEditingTask({ ...editingTask, situacion: e.target.value })
                }
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  border: "1px solid #d1d5db",
                  fontSize: "14px",
                  boxSizing: "border-box",
                  background: "#ffffff",
                }}
              >
                <option value="En tiempo">En tiempo</option>
                <option value="Riesgo de retraso">Riesgo de retraso</option>
                <option value="Retrasado">Retrasado</option>
              </select>
            </div>
    
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#374151",
                  marginBottom: "6px",
                }}
              >
                Fecha inicio
              </label>
              <input
                type="date"
                value={editingTask.fecha_inicio || ""}
                onChange={(e) =>
                  setEditingTask({ ...editingTask, fecha_inicio: e.target.value })
                }
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  border: "1px solid #d1d5db",
                  fontSize: "14px",
                  boxSizing: "border-box",
                }}
              />
            </div>
    
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#374151",
                  marginBottom: "6px",
                }}
              >
                Fecha fin
              </label>
              <input
                type="date"
                value={editingTask.fecha_fin || ""}
                onChange={(e) =>
                  setEditingTask({ ...editingTask, fecha_fin: e.target.value })
                }
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  border: "1px solid #d1d5db",
                  fontSize: "14px",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>
    
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "12px",
              marginTop: "24px",
            }}
          >
            <button
              onClick={() => setShowEditModal(false)}
              style={{
                background: "#f3f4f6",
                color: "#111827",
                border: "1px solid #d1d5db",
                borderRadius: "10px",
                padding: "10px 16px",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Cancelar
            </button>
    
            <button
              onClick={handleUpdateTask}
              style={{
                background: "#2563eb",
                color: "#ffffff",
                border: "none",
                borderRadius: "10px",
                padding: "10px 16px",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Guardar cambios
            </button>
          </div>
        </div>
      </div>
    )}
    </div>
  );
}
