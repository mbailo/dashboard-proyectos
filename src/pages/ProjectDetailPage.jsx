import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../supabase";

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

const thStyle = {
  textAlign: "left",
  padding: "12px",
  borderBottom: "1px solid #e5e7eb",
  fontSize: "13px",
  color: "#374151",
};

const tdStyle = {
  padding: "12px",
  borderBottom: "1px solid #e5e7eb",
  fontSize: "14px",
  color: "#111827",
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

export default function ProjectDetailPage() {
  const { id } = useParams();

  const [proyecto, setProyecto] = useState(null);
  const [tareas, setTareas] = useState([]);
  const [costes, setCostes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const [showTaskForm, setShowTaskForm] = useState(false);
  const [savingTask, setSavingTask] = useState(false);
  const [taskErrorMsg, setTaskErrorMsg] = useState("");
  const [taskForm, setTaskForm] = useState({
    titulo: "",
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
        owner,
        estado_tarea,
        situacion,
        fecha_inicio,
        fecha_fin
      `)
      .eq("id_proyecto", projectId)
      .order("id_tarea", { ascending: true });

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
      
        <section
        style={{
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "16px",
          padding: "24px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
            marginBottom: "16px",
          }}
        >
          <h3 style={{ margin: 0 }}>Tareas del proyecto</h3>

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
                  required
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
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                marginTop: "12px",
              }}
            >
              <thead>
                <tr style={{ background: "#f9fafb" }}>
                  <th style={thStyle}>Id Tarea</th>
                  <th style={thStyle}>Descripción</th>
                  <th style={thStyle}>Owner</th>
                  <th style={thStyle}>Estado</th>
                  <th style={thStyle}>Situación</th>
                  <th style={thStyle}>Inicio</th>
                  <th style={thStyle}>Fin</th>
                </tr>
              </thead>
              <tbody>
                {tareas.map((tarea) => (
                  <tr key={tarea.id_tarea}>
                    <td style={tdStyle}>{tarea.id_tarea}</td>
                    <td style={tdStyle}>{tarea.titulo || "-"}</td>
                    <td style={tdStyle}>{tarea.owner || "-"}</td>
                    <td style={tdStyle}>{tarea.estado_tarea || "-"}</td>
                    <td style={tdStyle}>{tarea.situacion || "-"}</td>
                    <td style={tdStyle}>{formatDate(tarea.fecha_inicio)}</td>
                    <td style={tdStyle}>{formatDate(tarea.fecha_fin)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section
        style={{
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "16px",
          padding: "24px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
            marginBottom: "16px",
          }}
        >
          <h3 style={{ margin: 0 }}>Costes del proyecto</h3>

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
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                marginTop: "12px",
              }}
            >
              <thead>
                <tr style={{ background: "#f9fafb" }}>
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
                    <td style={tdStyle}>{coste.titulo || "-"}</td>
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
    </div>
  );
}
