import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import { Settings, Trash } from "lucide-react";

// ===== FUNCIÓN PARA OBTENER EL PERFIL DEL USUARIO ACTUAL ===== //

async function getMiPerfil() {
  const { data, error } = await supabase.rpc("mi_perfil");
  if (error) throw error;
  return data?.[0] || null;
}

// ===== FUNCIONES DE FORMATO ===== //

function formatDate(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatCurrency(value) {
  if (value == null || value === "") return "-";
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);
}

function normalizeSituation(s) {
  if (!s) return "";
  if (s === "Riesgo de retraso" || s === "riesgo") return "Riesgo de retraso";
  if (s === "Retrasado" || s === "retrasado") return "Retrasado";
  return "En tiempo";
}

function getSituationColor(situacion) {
  const s = normalizeSituation(situacion);
  if (s === "Retrasado") return "#ef4444";
  if (s === "Riesgo de retraso") return "#f59e0b";
  return "#22c55e";
}

function getSituationBg(situacion) {
  const s = normalizeSituation(situacion);
  if (s === "Retrasado") return "#fef2f2";
  if (s === "Riesgo de retraso") return "#fffbeb";
  return "#f0fdf4";
}

function getSituationBadgeStyle(situacion) {
  const s = normalizeSituation(situacion);
  if (s === "Retrasado") return { background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca" };
  if (s === "Riesgo de retraso") return { background: "#fffbeb", color: "#92400e", border: "1px solid #fde68a" };
  return { background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0" };
}

function formatTaskDelay(fechaFin, situacion) {
  if (!fechaFin) return "-";
  const s = normalizeSituation(situacion);
  if (s === "En tiempo") return "-";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const fin = new Date(fechaFin + "T00:00:00");
  const diff = Math.round((today - fin) / (1000 * 60 * 60 * 24));
  if (diff <= 0) return "-";
  return `+${diff}d`;
}

function getTaskPhaseBadgeStyle(fase) {
  switch (fase) {
    case "No Iniciada": return { background: "#f3f4f6", color: "#4b5563", border: "1px solid #e5e7eb" };
    case "Planificada": return { background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" };
    case "En curso":    return { background: "#ecfeff", color: "#0f766e", border: "1px solid #a5f3fc" };
    case "Finalizada":  return { background: "#ecfdf5", color: "#047857", border: "1px solid #a7f3d0" };
    default:            return { background: "#f9fafb", color: "#374151", border: "1px solid #e5e7eb" };
  }
}

function getProjectPhaseBadgeStyle(fase) {
  switch (fase) {
    case "En Definición":   return { background: "#f1f5f9", color: "#334155", border: "1px solid #cbd5e1" };
    case "En Planificación":return { background: "#ede9fe", color: "#6d28d9", border: "1px solid #ddd6fe" };
    case "En Curso":        return { background: "#dbeafe", color: "#1d4ed8", border: "1px solid #bfdbfe" };
    case "Finalizado":      return { background: "#dcfce7", color: "#166534", border: "1px solid #bbf7d0" };
    default:                return { background: "#f8fafc", color: "#334155", border: "1px solid #e2e8f0" };
  }
}

// ===== COMPONENTE GANTT DE TAREAS ===== //

function TaskGanttChart({ tasks, project }) {
  const validTasks = (tasks || []).filter((t) => t.fecha_inicio && t.fecha_fin);
  if (!project?.fecha_inicio || !project?.fecha_fin || validTasks.length === 0) return null;

  const projectStart = new Date(project.fecha_inicio + "T00:00:00");
  const projectEnd   = new Date(project.fecha_fin   + "T00:00:00");
  const totalDays    = Math.max((projectEnd - projectStart) / (1000 * 60 * 60 * 24), 1);

  const months = [];
  const cursor = new Date(projectStart);
  cursor.setDate(1);
  while (cursor <= projectEnd) {
    months.push(new Date(cursor));
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return (
    <section style={tableCardStyle}>
      <div style={tableHeaderStyle}>
        <div>
          <h3 style={tableTitleStyle}>Cronograma de tareas</h3>
          <p style={tableSubtitleStyle}>Vista Gantt basada en fechas planificadas del proyecto.</p>
        </div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <div style={{ minWidth: 700 }}>
          {/* Cabecera de meses */}
          <div style={{ display: "flex", marginLeft: 200, borderBottom: "1px solid #e2e8f0", marginBottom: 4 }}>
            {months.map((m, i) => {
              const label = m.toLocaleDateString("es-ES", { month: "short", year: "2-digit" });
              const start = new Date(Math.max(m, projectStart));
              const end   = new Date(Math.min(new Date(m.getFullYear(), m.getMonth() + 1, 0), projectEnd));
              const widthPct = ((end - start) / (1000 * 60 * 60 * 24) + 1) / totalDays * 100;
              return (
                <div key={i} style={{ width: `${widthPct}%`, fontSize: 11, color: "#64748b", padding: "2px 4px", borderLeft: "1px solid #e2e8f0" }}>
                  {label}
                </div>
              );
            })}
          </div>

          {validTasks.map((task) => {
            const taskStart = new Date(task.fecha_inicio + "T00:00:00");
            const taskEnd   = new Date(task.fecha_fin   + "T00:00:00");
            const leftPct   = ((taskStart - projectStart) / (1000 * 60 * 60 * 24)) / totalDays * 100;
            const widthPct  = Math.max(((taskEnd - taskStart) / (1000 * 60 * 60 * 24) + 1) / totalDays * 100, 1);
            const trafficLabel = normalizeSituation(task.situacion);

            let realBar = null;
            if (task.fecha_inicio_real) {
              const realStart = new Date(task.fecha_inicio_real + "T00:00:00");
              const realEnd   = task.fecha_fin_real ? new Date(task.fecha_fin_real + "T00:00:00") : new Date();
              const realLeftPct  = Math.max(((realStart - projectStart) / (1000 * 60 * 60 * 24)) / totalDays * 100, 0);
              const realWidthPct = Math.max(((realEnd - realStart) / (1000 * 60 * 60 * 24) + 1) / totalDays * 100, 1);
              realBar = { left: realLeftPct, width: realWidthPct, color: task.fecha_fin_real ? "#10b981" : "#f59e0b" };
            }

            return (
              <div key={task.id_tarea} style={{ display: "flex", alignItems: "center", marginBottom: 6 }}>
                <div style={{ width: 200, minWidth: 200, fontSize: 12, color: "#374151", paddingRight: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={task.titulo}>
                  {task.titulo}
                </div>
                <div style={{ flex: 1, position: "relative", height: 28, background: "#f1f5f9", borderRadius: 6 }}>
                  <div style={{ position: "absolute", left: `${Math.max(0, leftPct)}%`, width: `${Math.max(widthPct, 1.4)}%`, top: "50%", transform: "translateY(-50%)", height: 16, borderRadius: 999, background: "linear-gradient(135deg, #93c5fd 0%, #3b82f6 100%)", boxShadow: "0 5px 12px rgba(59,130,246,0.24)", display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 6, zIndex: 3 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#ffffff", letterSpacing: "0.02em" }}></span>
                  </div>
                  {realBar && (
                    <div style={{ position: "absolute", left: `${realBar.left}%`, width: `${realBar.width}%`, top: "calc(50% + 10px)", height: 4, borderRadius: 999, background: realBar.color, boxShadow: "0 1px 4px rgba(15,23,42,0.18)", zIndex: 2 }} />
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginLeft: 8 }}>
                  <span style={{ width: 14, height: 14, borderRadius: "50%", display: "inline-block", background: getSituationColor(task.situacion), boxShadow: "0 0 0 4px rgba(15,23,42,0.05)" }} title={trafficLabel} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ===== ESTILOS COMUNES ===== //

const tableCardStyle = {
  width: "100%",
  margin: "0 auto 24px auto",
  boxSizing: "border-box",
  background: "rgba(255,255,255,0.92)",
  border: "1px solid #dbe4ee",
  borderRadius: 20,
  padding: 18,
  boxShadow: "0 14px 36px rgba(15, 23, 42, 0.08)",
  backdropFilter: "blur(8px)",
};

const tableHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  marginBottom: 14,
};

const tableTitleStyle   = { margin: 0, fontSize: 22, color: "#0f172a" };
const tableSubtitleStyle = { margin: "4px 0 0 0", fontSize: 13, color: "#64748b" };

const primaryButtonStyle = {
  background: "#2563eb",
  color: "#ffffff",
  border: "none",
  borderRadius: "10px",
  padding: "10px 16px",
  fontSize: "14px",
  fontWeight: 600,
  cursor: "pointer",
};

const secondaryButtonStyle = {
  background: "#f3f4f6",
  color: "#111827",
  border: "1px solid #d1d5db",
  borderRadius: "10px",
  padding: "10px 16px",
  fontSize: "14px",
  fontWeight: 600,
  cursor: "pointer",
};

const labelStyle = {
  display: "block",
  fontSize: "13px",
  fontWeight: 600,
  color: "#374151",
  marginBottom: "6px",
};

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: "10px",
  border: "1px solid #d1d5db",
  fontSize: "14px",
  boxSizing: "border-box",
  background: "#ffffff",
};

const badgeStyle = {
  display: "inline-block",
  padding: "3px 10px",
  borderRadius: "999px",
  fontSize: "12px",
  fontWeight: 600,
  whiteSpace: "nowrap",
};

const tableWrapperStyle = { width: "100%", overflowX: "auto" };
const tableStyle = { width: "100%", minWidth: 1000, borderCollapse: "separate", borderSpacing: 0 };

const thStyle = {
  position: "sticky", top: 0, background: "#f8fafc", textAlign: "left",
  padding: "14px 14px", fontSize: "12px", fontWeight: 700, color: "#475569",
  textTransform: "uppercase", letterSpacing: "0.04em", borderBottom: "1px solid #dbe4ee", whiteSpace: "nowrap",
};

const tdStyle = {
  padding: "14px 14px", borderBottom: "1px solid #edf2f7", fontSize: "14px",
  color: "#334155", whiteSpace: "nowrap", background: "rgba(255,255,255,0.78)", verticalAlign: "top",
};

const tdTitleStyle       = { ...tdStyle, width: "150px", maxWidth: "150px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontWeight: 700, color: "#0f172a" };
const tdDescriptionStyle = { ...tdStyle, width: "250px", minWidth: "200px", maxWidth: "250px", whiteSpace: "normal", wordBreak: "break-word", overflowWrap: "anywhere", lineHeight: 1.4 };
const tdOwnerStyle       = { ...tdStyle, width: "160px", maxWidth: "180px", whiteSpace: "normal", wordBreak: "break-word", fontWeight: 600, color: "#0f172a" };
const tdDateStyle        = { ...tdStyle, width: "85px", whiteSpace: "nowrap" };
const tdBadgeStyle       = { ...tdStyle, width: "110px", whiteSpace: "nowrap" };
const tdDelayStyle       = { ...tdStyle, width: "70px", whiteSpace: "nowrap" };
const tdActionsStyle     = { ...tdStyle, width: "90px", whiteSpace: "nowrap" };

// ===== COMPONENTE PRINCIPAL: FICHA DE PROYECTO ===== //

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  // --- Estados: datos principales --- //
  const [proyecto,  setProyecto]  = useState(null);
  const [tareas,    setTareas]    = useState([]);
  const [costes,    setCostes]    = useState([]);
  const [impactos,  setImpactos]  = useState([]);
  const [riesgos,   setRiesgos]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [errorMsg,  setErrorMsg]  = useState("");

  // ===== [NUEVO Paso 4] Lista de usuarios activos para desplegables de owners ===== //
  const [usuariosActivos, setUsuariosActivos] = useState([]);

  // --- Estados: modal edición tarea --- //
  const [editingTask,    setEditingTask]    = useState(null);
  const [showEditModal,  setShowEditModal]  = useState(false);

  // --- Estados: modal edición proyecto --- //
  const [showProjectEditModal, setShowProjectEditModal] = useState(false);
  const [savingProject,        setSavingProject]        = useState(false);
  const [projectEditError,     setProjectEditError]     = useState("");
  const [projectEditForm,      setProjectEditForm]      = useState({
    titulo: "", owner: "", horizonte: "", descripcion: "", beneficios: "",
  });

  // --- Estados: formulario nueva tarea --- //
  const [showTaskForm,  setShowTaskForm]  = useState(false);
  const [savingTask,    setSavingTask]    = useState(false);
  const [taskErrorMsg,  setTaskErrorMsg]  = useState("");
  const [taskForm,      setTaskForm]      = useState({
    titulo: "",
    descripcion: "",
    // ===== [NUEVO Paso 4] owners_ids sustituye al campo libre "owner" ===== //
    owners_ids: [],
    estado_tarea: "No Iniciada",
    situacion: "En tiempo",
    fecha_inicio: "",
    fecha_fin: "",
  });

  // --- Estados: formulario costes --- //
  const [showCostForm,  setShowCostForm]  = useState(false);
  const [savingCost,    setSavingCost]    = useState(false);
  const [costErrorMsg,  setCostErrorMsg]  = useState("");
  const [costForm,      setCostForm]      = useState({ titulo: "", descripcion: "", tipo_coste: "OpEx", importe: "" });

  // --- Estados: formulario impactos --- //
  const [showImpactForm, setShowImpactForm] = useState(false);
  const [savingImpact,   setSavingImpact]   = useState(false);
  const [impactErrorMsg, setImpactErrorMsg] = useState("");
  const [impactForm,     setImpactForm]     = useState({ titulo: "", descripcion: "", tipo_impacto: "OpEx", importe: "" });

  // --- Estados: formulario riesgos --- //
  const [showRiskForm, setShowRiskForm] = useState(false);
  const [savingRisk,   setSavingRisk]   = useState(false);
  const [riskErrorMsg, setRiskErrorMsg] = useState("");
  const [riskForm,     setRiskForm]     = useState({ descripcion: "", categoria: "Riesgo de retraso", plan_mitigacion: "" });

  // --- Estados: edición costes --- //
  const [showCostEditModal, setShowCostEditModal] = useState(false);
  const [editingCost,       setEditingCost]       = useState(null);
  const [savingCostEdit,    setSavingCostEdit]    = useState(false);
  const [costEditError,     setCostEditError]     = useState("");

  // --- Estados: edición impactos --- //
  const [showImpactEditModal, setShowImpactEditModal] = useState(false);
  const [editingImpact,       setEditingImpact]       = useState(null);
  const [savingImpactEdit,    setSavingImpactEdit]    = useState(false);
  const [impactEditError,     setImpactEditError]     = useState("");

  // --- Estados: edición riesgos --- //
  const [showRiskEditModal, setShowRiskEditModal] = useState(false);
  const [editingRisk,       setEditingRisk]       = useState(null);
  const [savingRiskEdit,    setSavingRiskEdit]    = useState(false);
  const [riskEditError,     setRiskEditError]     = useState("");

  // ===== FUNCIONES DE CARGA DE DATOS ===== //

  async function loadProject(projectId) {
    const { data, error } = await supabase
      .from("v_proyectos_universo_detalle")
      .select(`id_proyecto, id_universo, titulo, descripcion, beneficios,
               inversion_estimada, impacto_estimado, owner, fase, situacion,
               fecha_inicio, fecha_fin, avance_pct, nombre_universo`)
      .eq("id_proyecto", projectId)
      .single();
    if (error) throw new Error(error.message || "No se pudo cargar el proyecto");
    return data;
  }

  // ===== [MODIFICADO Paso 4] loadTasks ahora usa v_tareas_con_owners ===== //
  async function loadTasks(projectId) {
    const { data, error } = await supabase
      .from("v_tareas_con_owners")
      .select(`id_tarea, id_proyecto, titulo, descripcion, owner,
               estado_tarea, situacion, fecha_inicio, fecha_fin,
               fecha_inicio_real, fecha_fin_real,
               owners_ids, owners_nombres, owners_texto`)
      .eq("id_proyecto", projectId)
      .order("fecha_inicio", { ascending: true })
      .order("fecha_fin",    { ascending: true });
    if (error) throw new Error(error.message || "No se pudieron cargar las tareas");
    return data || [];
  }

  async function loadCostes(projectId) {
    const { data, error } = await supabase
      .from("costes_proyecto")
      .select(`id_coste, id_proyecto, titulo, descripcion, tipo_coste, importe`)
      .eq("id_proyecto", projectId)
      .order("id_coste", { ascending: true });
    if (error) throw new Error(error.message || "No se pudieron cargar los costes");
    return data || [];
  }

  async function loadImpactos(projectId) {
    const { data, error } = await supabase
      .from("impactos_proyecto")
      .select(`id_impacto, id_proyecto, titulo, descripcion, tipo_impacto, importe`)
      .eq("id_proyecto", projectId)
      .order("id_impacto", { ascending: true });
    if (error) throw new Error(error.message || "No se pudieron cargar los impactos");
    return data || [];
  }

  async function loadRiesgos(projectId) {
    const { data, error } = await supabase
      .from("riesgos_proyecto")
      .select(`id_riesgo, id_proyecto, descripcion, categoria, plan_mitigacion, created_at`)
      .eq("id_proyecto", projectId)
      .order("id_riesgo", { ascending: true });
    if (error) throw new Error(error.message || "No se pudieron cargar los riesgos");
    return data || [];
  }

  // ===== [NUEVO Paso 4] Carga la lista de usuarios activos para los desplegables ===== //
  async function loadUsuariosActivosFn() {
    const { data, error } = await supabase.rpc("get_usuarios_activos");
    if (error) throw new Error(error.message || "No se pudieron cargar los usuarios");
    return data || [];
  }

  async function loadAll() {
    try {
      setLoading(true);
      setErrorMsg("");
      const perfil = await getMiPerfil();
      if (!perfil || !perfil.activo) {
        navigate("/login", { replace: true });
        return;
      }

      const proyectoData = await loadProject(id);

      if (perfil.tipo_acceso === "universo" && proyectoData.id_universo !== perfil.id_universo) {
        navigate(`/universes/${perfil.id_universo}`, { replace: true });
        return;
      }

      // ===== [MODIFICADO Paso 4] Se añade loadUsuariosActivosFn al Promise.all ===== //
      const [tareasData, costesData, impactosData, riesgosData, usuariosData] = await Promise.all([
        loadTasks(id),
        loadCostes(id),
        loadImpactos(id),
        loadRiesgos(id),
        loadUsuariosActivosFn(),
      ]);

      setProyecto(proyectoData);
      setTareas(tareasData);
      setCostes(costesData);
      setImpactos(impactosData);
      setRiesgos(riesgosData);
      setUsuariosActivos(usuariosData); // [NUEVO Paso 4]

    } catch (err) {
      setErrorMsg(err.message || "Error cargando la ficha del proyecto");
      setProyecto(null);
      setTareas([]);
      setCostes([]);
      setImpactos([]);
      setRiesgos([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAll(); }, [id, navigate]);

  // ===== HANDLERS DE CAMBIO EN FORMULARIOS ===== //

  function handleTaskFormChange(e) {
    const { name, value } = e.target;
    setTaskForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleCostFormChange(e) {
    const { name, value } = e.target;
    setCostForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleImpactFormChange(e) {
    const { name, value } = e.target;
    setImpactForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleRiskFormChange(e) {
    const { name, value } = e.target;
    setRiskForm((prev) => ({ ...prev, [name]: value }));
  }

  // ===== [NUEVO Paso 4] Añadir / quitar owner en el formulario de nueva tarea ===== //
  function handleAddOwnerToForm(userId) {
    if (!userId || taskForm.owners_ids.includes(userId)) return;
    setTaskForm((prev) => ({ ...prev, owners_ids: [...prev.owners_ids, userId] }));
  }

  function handleRemoveOwnerFromForm(userId) {
    setTaskForm((prev) => ({ ...prev, owners_ids: prev.owners_ids.filter((id) => id !== userId) }));
  }

  // ===== HANDLERS: PROYECTO ===== //

  const handleUpdateProject = async () => {
    setSavingProject(true);
    setProjectEditError("");
    const { error } = await supabase.rpc("actualizar_proyecto", {
      p_id_proyecto: proyecto.id_proyecto,
      p_titulo:      projectEditForm.titulo,
      p_owner:       projectEditForm.owner,
      p_horizonte:   projectEditForm.horizonte,
      p_descripcion: projectEditForm.descripcion || null,
      p_beneficios:  projectEditForm.beneficios  || null,
    });
    if (error) { setProjectEditError(error.message || "No se pudo guardar el proyecto"); setSavingProject(false); return; }
    await loadAll();
    setShowProjectEditModal(false);
    setSavingProject(false);
  };

  // ===== HANDLERS: TAREAS ===== //

  // ===== [MODIFICADO Paso 4] handleCreateTask asigna owners tras crear la tarea ===== //
  async function handleCreateTask(e) {
    e.preventDefault();
    setSavingTask(true);
    setTaskErrorMsg("");

    // Paso 1: crear la tarea (sin owner libre — se pasa null)
    const { data: tareaCreada, error } = await supabase.rpc("crear_tarea", {
      p_id_proyecto: id,
      p_titulo:      taskForm.titulo,
      p_descripcion: taskForm.descripcion || null,
      p_owner:       null,
      p_estado_tarea: taskForm.estado_tarea,
      p_situacion:   taskForm.situacion,
      p_fecha_inicio: taskForm.fecha_inicio || null,
      p_fecha_fin:    taskForm.fecha_fin    || null,
    });

    if (error) {
      setTaskErrorMsg(error.message || "No se pudo crear la tarea");
      setSavingTask(false);
      return;
    }

    // Paso 2: asignar owners seleccionados si los hay
    // La RPC crear_tarea devuelve la fila creada con id_tarea
    const idTareaCreada = tareaCreada?.id_tarea ?? tareaCreada;
    if (idTareaCreada && taskForm.owners_ids.length > 0) {
      for (const userId of taskForm.owners_ids) {
        await supabase.rpc("asignar_owner_tarea", {
          p_id_tarea:   idTareaCreada,
          p_id_usuario: userId,
        });
      }
    }

    setTaskForm({ titulo: "", descripcion: "", owners_ids: [], estado_tarea: "No Iniciada", situacion: "En tiempo", fecha_inicio: "", fecha_fin: "" });
    setShowTaskForm(false);
    setSavingTask(false);

    try {
      const tareasActualizadas = await loadTasks(id);
      setTareas(tareasActualizadas);
    } catch (err) {
      setTaskErrorMsg(err.message || "La tarea se creó, pero no se pudo recargar la tabla");
    }
  }

  const handleUpdateTask = async () => {
    if (!editingTask) return;
    const { error } = await supabase
      .from("tareas")
      .update({
        titulo:           editingTask.titulo,
        descripcion:      editingTask.descripcion,
        estado_tarea:     editingTask.estado_tarea,
        situacion:        editingTask.situacion,
        fecha_inicio_real: editingTask.fecha_inicio_real || null,
        fecha_fin_real:    editingTask.fecha_fin_real    || null,
      })
      .eq("id_tarea", editingTask.id_tarea);

    if (error) { alert("Error al actualizar la tarea"); return; }
    await loadAll();
    setShowEditModal(false);
    setEditingTask(null);
  };

  // ===== [NUEVO Paso 4] Asignar owner desde el modal de edición (inmediato) ===== //
  async function handleAddOwnerToTask(userId) {
    if (!editingTask || !userId) return;
    if ((editingTask.owners_ids || []).includes(userId)) return;
    const { error } = await supabase.rpc("asignar_owner_tarea", {
      p_id_tarea:   editingTask.id_tarea,
      p_id_usuario: userId,
    });
    if (error) { alert(error.message || "No se pudo asignar el owner"); return; }
    // Actualizar el estado local del modal
    const usuario = usuariosActivos.find((u) => u.id === userId);
    setEditingTask((prev) => ({
      ...prev,
      owners_ids:     [...(prev.owners_ids || []), userId],
      owners_nombres: [...(prev.owners_nombres || []), usuario?.nombre || ""],
      owners_texto:   [...(prev.owners_nombres || []), usuario?.nombre || ""].join(", "),
    }));
    // Refrescar tareas en background
    loadTasks(id).then(setTareas);
  }

  // ===== [NUEVO Paso 4] Quitar owner desde el modal de edición (inmediato) ===== //
  async function handleRemoveOwnerFromTask(userId) {
    if (!editingTask || !userId) return;
    const { error } = await supabase.rpc("eliminar_owner_tarea", {
      p_id_tarea:   editingTask.id_tarea,
      p_id_usuario: userId,
    });
    if (error) { alert(error.message || "No se pudo quitar el owner"); return; }
    const nuevosIds     = (editingTask.owners_ids     || []).filter((i) => i !== userId);
    const nuevosNombres = (editingTask.owners_nombres || []).filter((_, idx) => (editingTask.owners_ids || [])[idx] !== userId);
    setEditingTask((prev) => ({
      ...prev,
      owners_ids:     nuevosIds,
      owners_nombres: nuevosNombres,
      owners_texto:   nuevosNombres.join(", "),
    }));
    loadTasks(id).then(setTareas);
  }

  async function handleDeleteTask(idTarea) {
    const confirmed = window.confirm("¿Seguro que quieres eliminar esta tarea?");
    if (!confirmed) return;
    try {
      const { error } = await supabase.from("tareas").delete().eq("id_tarea", idTarea);
      if (error) throw error;
      await loadAll();
    } catch (err) {
      alert(err.message || "Error al eliminar la tarea");
    }
  }

  // ===== HANDLERS: COSTES ===== //

  async function handleCreateCost(e) {
    e.preventDefault();
    setSavingCost(true);
    setCostErrorMsg("");
    const { error } = await supabase.rpc("crear_coste", {
      p_id_proyecto: id, p_titulo: costForm.titulo, p_descripcion: costForm.descripcion || null,
      p_tipo_coste: costForm.tipo_coste, p_importe: costForm.importe === "" ? 0 : Number(costForm.importe),
    });
    if (error) { setCostErrorMsg(error.message || "No se pudo crear el coste"); setSavingCost(false); return; }
    setCostForm({ titulo: "", descripcion: "", tipo_coste: "OpEx", importe: "" });
    setShowCostForm(false);
    setSavingCost(false);
    loadCostes(id).then(setCostes).catch(() => {});
  }

  const handleUpdateCost = async () => {
    if (!editingCost) return;
    setSavingCostEdit(true);
    setCostEditError("");
    const { error } = await supabase.rpc("actualizar_coste", {
      p_id_coste: editingCost.id_coste, p_titulo: editingCost.titulo,
      p_descripcion: editingCost.descripcion || null, p_tipo_coste: editingCost.tipo_coste,
      p_importe: editingCost.importe === "" ? 0 : Number(editingCost.importe),
    });
    if (error) { setCostEditError(error.message || "No se pudo guardar el coste"); setSavingCostEdit(false); return; }
    await loadAll();
    setShowCostEditModal(false);
    setEditingCost(null);
    setSavingCostEdit(false);
  };

  async function handleDeleteCost(idCoste) {
    if (!window.confirm("¿Seguro que quieres eliminar este coste?")) return;
    try {
      const { error } = await supabase.rpc("eliminar_coste", { p_id_coste: idCoste });
      if (error) throw error;
      await loadAll();
    } catch (err) { alert(err.message || "Error al eliminar el coste"); }
  }

  // ===== HANDLERS: IMPACTOS ===== //

  async function handleCreateImpact(e) {
    e.preventDefault();
    setSavingImpact(true);
    setImpactErrorMsg("");
    const { error } = await supabase.rpc("crear_impacto", {
      p_id_proyecto: id, p_titulo: impactForm.titulo, p_descripcion: impactForm.descripcion || null,
      p_tipo_impacto: impactForm.tipo_impacto, p_importe: impactForm.importe === "" ? 0 : Number(impactForm.importe),
    });
    if (error) { setImpactErrorMsg(error.message || "No se pudo crear el impacto"); setSavingImpact(false); return; }
    setImpactForm({ titulo: "", descripcion: "", tipo_impacto: "OpEx", importe: "" });
    setShowImpactForm(false);
    setSavingImpact(false);
    loadImpactos(id).then(setImpactos).catch(() => {});
  }

  const handleUpdateImpact = async () => {
    if (!editingImpact) return;
    setSavingImpactEdit(true);
    setImpactEditError("");
    const { error } = await supabase.rpc("actualizar_impacto", {
      p_id_impacto: editingImpact.id_impacto, p_titulo: editingImpact.titulo,
      p_descripcion: editingImpact.descripcion || null, p_tipo_impacto: editingImpact.tipo_impacto,
      p_importe: editingImpact.importe === "" ? 0 : Number(editingImpact.importe),
    });
    if (error) { setImpactEditError(error.message || "No se pudo guardar el impacto"); setSavingImpactEdit(false); return; }
    await loadAll();
    setShowImpactEditModal(false);
    setEditingImpact(null);
    setSavingImpactEdit(false);
  };

  async function handleDeleteImpact(idImpacto) {
    if (!window.confirm("¿Seguro que quieres eliminar este impacto?")) return;
    try {
      const { error } = await supabase.rpc("eliminar_impacto", { p_id_impacto: idImpacto });
      if (error) throw error;
      await loadAll();
    } catch (err) { alert(err.message || "Error al eliminar el impacto"); }
  }

  // ===== HANDLERS: RIESGOS ===== //

  async function handleCreateRisk(e) {
    e.preventDefault();
    setSavingRisk(true);
    setRiskErrorMsg("");
    const { error } = await supabase.rpc("crear_riesgo", {
      p_id_proyecto: id, p_descripcion: riskForm.descripcion,
      p_categoria: riskForm.categoria, p_plan_mitigacion: riskForm.plan_mitigacion || null,
    });
    if (error) { setRiskErrorMsg(error.message || "No se pudo crear el riesgo"); setSavingRisk(false); return; }
    setRiskForm({ descripcion: "", categoria: "Riesgo de retraso", plan_mitigacion: "" });
    setShowRiskForm(false);
    setSavingRisk(false);
    loadRiesgos(id).then(setRiesgos).catch(() => {});
  }

  const handleUpdateRisk = async () => {
    if (!editingRisk) return;
    setSavingRiskEdit(true);
    setRiskEditError("");
    const { error } = await supabase.rpc("actualizar_riesgo", {
      p_id_riesgo: editingRisk.id_riesgo, p_descripcion: editingRisk.descripcion,
      p_categoria: editingRisk.categoria, p_plan_mitigacion: editingRisk.plan_mitigacion || null,
    });
    if (error) { setRiskEditError(error.message || "No se pudo guardar el riesgo"); setSavingRiskEdit(false); return; }
    await loadAll();
    setShowRiskEditModal(false);
    setEditingRisk(null);
    setSavingRiskEdit(false);
  };

  async function handleDeleteRisk(idRiesgo) {
    if (!window.confirm("¿Seguro que quieres eliminar este riesgo?")) return;
    try {
      const { error } = await supabase.rpc("eliminar_riesgo", { p_id_riesgo: idRiesgo });
      if (error) throw error;
      await loadAll();
    } catch (err) { alert(err.message || "Error al eliminar el riesgo"); }
  }

  // ===== RENDER ===== //

  if (loading) return <div style={{ padding: "24px" }}>Cargando ficha del proyecto...</div>;
  if (errorMsg) return <div style={{ padding: "24px", color: "#dc2626" }}>{errorMsg}</div>;
  if (!proyecto) return <div style={{ padding: "24px" }}>Proyecto no encontrado.</div>;

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 0 40px 0" }}>

      {/* ===== CABECERA DEL PROYECTO ===== */}
      <section style={{ ...tableCardStyle, marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>{proyecto.nombre_universo} · {proyecto.id_proyecto}</div>
            <h2 style={{ margin: 0, fontSize: 26, color: "#0f172a" }}>{proyecto.titulo}</h2>
            <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ ...badgeStyle, ...getProjectPhaseBadgeStyle(proyecto.fase) }}>{proyecto.fase}</span>
              <span style={{ ...badgeStyle, background: getSituationBg(proyecto.situacion), color: getSituationColor(proyecto.situacion), border: `1px solid ${getSituationColor(proyecto.situacion)}33` }}>{normalizeSituation(proyecto.situacion)}</span>
              <span style={{ fontSize: 13, color: "#64748b" }}>Owner: <strong>{proyecto.owner || "-"}</strong></span>
              <span style={{ fontSize: 13, color: "#64748b" }}>Horizonte: <strong>{proyecto.horizonte || "-"}</strong></span>
              <span style={{ fontSize: 13, color: "#64748b" }}>Avance: <strong>{proyecto.avance_pct ?? 0}%</strong></span>
            </div>
          </div>
          <button
            style={secondaryButtonStyle}
            onClick={() => {
              setProjectEditForm({ titulo: proyecto.titulo, owner: proyecto.owner || "", horizonte: proyecto.horizonte || "Quick-Win", descripcion: proyecto.descripcion || "", beneficios: proyecto.beneficios || "" });
              setShowProjectEditModal(true);
            }}
          >
            Editar proyecto
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
          <div style={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 14 }}>
            <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.04em" }}>Descripción del proyecto</div>
            <p style={{ margin: 0, color: "#374151", lineHeight: 1.45, fontSize: 14 }}>{proyecto.descripcion || "Sin descripción"}</p>
          </div>
          <div style={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 14 }}>
            <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.04em" }}>Beneficios esperados</div>
            <p style={{ margin: 0, color: "#374151", lineHeight: 1.45, fontSize: 14 }}>{proyecto.beneficios || "No informados"}</p>
          </div>
        </div>
      </section>

      {/* ===== CRONOGRAMA GANTT ===== */}
      <TaskGanttChart tasks={tareas} project={proyecto} />

      {/* ===== SECCIÓN: TABLA DE TAREAS ===== */}
      <section style={tableCardStyle}>
        <div style={tableHeaderStyle}>
          <div>
            <h3 style={tableTitleStyle}>Tareas del proyecto</h3>
            <p style={tableSubtitleStyle}>Gestión de tareas con owners asignados.</p>
          </div>
          <button type="button" style={primaryButtonStyle} onClick={() => { setShowTaskForm((p) => !p); setTaskErrorMsg(""); }}>
            {showTaskForm ? "Cancelar" : "+ Nueva tarea"}
          </button>
        </div>

        {/* ===== FORMULARIO NUEVA TAREA ===== */}
        {showTaskForm && (
          <form onSubmit={handleCreateTask} style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, marginBottom: 20, background: "#f9fafb" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>

              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Título de la tarea</label>
                <input type="text" name="titulo" value={taskForm.titulo} onChange={handleTaskFormChange} style={inputStyle} maxLength={32} required />
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Descripción</label>
                <textarea name="descripcion" value={taskForm.descripcion} onChange={handleTaskFormChange} maxLength={512} style={{ ...inputStyle, minHeight: 90, resize: "vertical", fontFamily: "inherit" }} />
              </div>

              {/* ===== [NUEVO Paso 4] Selección de owners con tags ===== */}
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Owners de la tarea</label>
                <select
                  style={inputStyle}
                  value=""
                  onChange={(e) => handleAddOwnerToForm(e.target.value)}
                >
                  <option value="">— Añadir owner —</option>
                  {usuariosActivos
                    .filter((u) => !taskForm.owners_ids.includes(u.id))
                    .map((u) => (
                      <option key={u.id} value={u.id}>{u.nombre} ({u.email})</option>
                    ))}
                </select>
                {taskForm.owners_ids.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                    {taskForm.owners_ids.map((uid) => {
                      const u = usuariosActivos.find((x) => x.id === uid);
                      return (
                        <span key={uid} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#dbeafe", color: "#1d4ed8", border: "1px solid #bfdbfe", borderRadius: 999, padding: "3px 10px", fontSize: 13, fontWeight: 600 }}>
                          {u?.nombre || uid}
                          <button type="button" onClick={() => handleRemoveOwnerFromForm(uid)} style={{ background: "none", border: "none", cursor: "pointer", color: "#1d4ed8", fontSize: 16, lineHeight: 1, padding: 0 }}>×</button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <label style={labelStyle}>Fase</label>
                <select name="estado_tarea" value={taskForm.estado_tarea} onChange={handleTaskFormChange} style={inputStyle}>
                  <option value="No Iniciada">No Iniciada</option>
                  <option value="Planificada">Planificada</option>
                  <option value="En curso">En curso</option>
                  <option value="Finalizada">Finalizada</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Estado</label>
                <select name="situacion" value={taskForm.situacion} onChange={handleTaskFormChange} style={inputStyle}>
                  <option value="En tiempo">En tiempo</option>
                  <option value="Riesgo de retraso">Riesgo de retraso</option>
                  <option value="Retrasado">Retrasado</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Fecha inicio</label>
                <input type="date" name="fecha_inicio" value={taskForm.fecha_inicio} onChange={handleTaskFormChange} style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>Fecha fin</label>
                <input type="date" name="fecha_fin" value={taskForm.fecha_fin} onChange={handleTaskFormChange} style={inputStyle} />
              </div>
            </div>

            {taskErrorMsg && (
              <div style={{ marginTop: 16, padding: 12, borderRadius: 8, background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", fontSize: 14 }}>{taskErrorMsg}</div>
            )}

            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 16 }}>
              <button type="button" style={secondaryButtonStyle} onClick={() => { setShowTaskForm(false); setTaskErrorMsg(""); }}>Cancelar</button>
              <button type="submit" style={primaryButtonStyle} disabled={savingTask}>{savingTask ? "Guardando..." : "Guardar tarea"}</button>
            </div>
          </form>
        )}

        {/* ===== TABLA DE TAREAS ===== */}
        {tareas.length === 0 ? (
          <p style={{ marginBottom: 0, color: "#6b7280" }}>Este proyecto todavía no tiene tareas.</p>
        ) : (
          <div style={tableWrapperStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={{ ...thStyle, width: 150 }}>Título</th>
                  <th style={{ ...thStyle, width: 250 }}>Descripción</th>
                  {/* ===== [MODIFICADO Paso 4] Columna "Owners" en lugar de "Owner" ===== */}
                  <th style={{ ...thStyle, width: 160 }}>Owners</th>
                  <th style={{ ...thStyle, width: 85 }}>Inicio</th>
                  <th style={{ ...thStyle, width: 85 }}>Fin</th>
                  <th style={{ ...thStyle, width: 85 }}>Fin real</th>
                  <th style={{ ...thStyle, width: 110 }}>Fase</th>
                  <th style={{ ...thStyle, width: 110 }}>Estado</th>
                  <th style={{ ...thStyle, width: 70 }}>Retraso</th>
                  <th style={{ ...thStyle, width: 90 }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {tareas.map((tarea) => (
                  <tr key={tarea.id_tarea}>
                    <td style={tdTitleStyle} title={tarea.titulo || ""}>{tarea.titulo || "-"}</td>
                    <td style={tdDescriptionStyle}>{tarea.descripcion || "-"}</td>
                    {/* ===== [MODIFICADO Paso 4] Muestra owners_texto en lugar de owner libre ===== */}
                    <td style={tdOwnerStyle} title={tarea.owners_texto || tarea.owner || ""}>
                      {tarea.owners_texto || <span style={{ color: "#9ca3af", fontStyle: "italic" }}>Sin asignar</span>}
                    </td>
                    <td style={tdDateStyle}>{formatDate(tarea.fecha_inicio)}</td>
                    <td style={tdDateStyle}>{formatDate(tarea.fecha_fin)}</td>
                    <td style={tdDateStyle}>{formatDate(tarea.fecha_fin_real)}</td>
                    <td style={tdBadgeStyle}>
                      <span style={{ ...badgeStyle, ...getTaskPhaseBadgeStyle(tarea.estado_tarea) }}>{tarea.estado_tarea || "-"}</span>
                    </td>
                    <td style={tdBadgeStyle}>
                      <span style={{ ...badgeStyle, ...getSituationBadgeStyle(tarea.situacion) }}>{normalizeSituation(tarea.situacion)}</span>
                    </td>
                    <td style={tdDelayStyle}>{formatTaskDelay(tarea.fecha_fin, tarea.situacion)}</td>
                    <td style={tdActionsStyle}>
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingTask({
                              ...tarea,
                              fecha_inicio_real: tarea.fecha_inicio_real || "",
                              fecha_fin_real:    tarea.fecha_fin_real    || "",
                              owners_ids:     tarea.owners_ids     || [],
                              owners_nombres: tarea.owners_nombres || [],
                            });
                            setShowEditModal(true);
                          }}
                          title="Editar tarea"
                          style={{ background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", borderRadius: 10, width: 36, height: 36, display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                        >
                          <Settings size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTask(tarea.id_tarea)}
                          title="Eliminar tarea"
                          style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 10, width: 36, height: 36, display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
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

      {/* ===== SECCIÓN: COSTES ===== */}
      <section style={tableCardStyle}>
        <div style={tableHeaderStyle}>
          <div>
            <h3 style={tableTitleStyle}>Costes del proyecto</h3>
            <p style={tableSubtitleStyle}>Detalle de costes asociados al proyecto.</p>
          </div>
          <button type="button" style={primaryButtonStyle} onClick={() => { setShowCostForm((p) => !p); setCostErrorMsg(""); }}>
            {showCostForm ? "Cancelar" : "+ Nuevo coste"}
          </button>
        </div>

        {showCostForm && (
          <form onSubmit={handleCreateCost} style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, marginBottom: 20, background: "#f9fafb" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
              <div><label style={labelStyle}>Título</label><input type="text" name="titulo" value={costForm.titulo} onChange={handleCostFormChange} style={inputStyle} required /></div>
              <div><label style={labelStyle}>Tipo</label>
                <select name="tipo_coste" value={costForm.tipo_coste} onChange={handleCostFormChange} style={inputStyle}>
                  <option value="OpEx">OpEx</option><option value="CapEx">CapEx</option>
                </select>
              </div>
              <div><label style={labelStyle}>Importe (€)</label><input type="number" name="importe" value={costForm.importe} onChange={handleCostFormChange} style={inputStyle} min="0" /></div>
              <div style={{ gridColumn: "1 / -1" }}><label style={labelStyle}>Descripción</label><textarea name="descripcion" value={costForm.descripcion} onChange={handleCostFormChange} style={{ ...inputStyle, minHeight: 70, resize: "vertical", fontFamily: "inherit" }} /></div>
            </div>
            {costErrorMsg && <div style={{ marginTop: 12, padding: 10, borderRadius: 8, background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", fontSize: 14 }}>{costErrorMsg}</div>}
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 16 }}>
              <button type="button" style={secondaryButtonStyle} onClick={() => setShowCostForm(false)}>Cancelar</button>
              <button type="submit" style={primaryButtonStyle} disabled={savingCost}>{savingCost ? "Guardando..." : "Guardar coste"}</button>
            </div>
          </form>
        )}

        {costes.length === 0 ? (
          <p style={{ marginBottom: 0, color: "#6b7280" }}>Este proyecto todavía no tiene costes.</p>
        ) : (
          <div style={tableWrapperStyle}>
            <table style={{ ...tableStyle, minWidth: 600 }}>
              <thead>
                <tr>
                  <th style={thStyle}>Título</th>
                  <th style={thStyle}>Descripción</th>
                  <th style={thStyle}>Tipo</th>
                  <th style={{ ...thStyle, textAlign: "right" }}>Importe</th>
                  <th style={thStyle}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {costes.map((coste) => (
                  <tr key={coste.id_coste}>
                    <td style={tdTitleStyle}>{coste.titulo}</td>
                    <td style={tdDescriptionStyle}>{coste.descripcion || "-"}</td>
                    <td style={tdBadgeStyle}><span style={{ ...badgeStyle, background: "#f1f5f9", color: "#334155", border: "1px solid #cbd5e1" }}>{coste.tipo_coste}</span></td>
                    <td style={{ ...tdStyle, textAlign: "right", fontWeight: 700 }}>{formatCurrency(coste.importe)}</td>
                    <td style={tdActionsStyle}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button type="button" onClick={() => { setEditingCost({ ...coste }); setShowCostEditModal(true); }} style={{ background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", borderRadius: 10, width: 36, height: 36, display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Settings size={16} /></button>
                        <button type="button" onClick={() => handleDeleteCost(coste.id_coste)} style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 10, width: 36, height: 36, display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Trash size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ===== SECCIÓN: IMPACTOS ===== */}
      <section style={tableCardStyle}>
        <div style={tableHeaderStyle}>
          <div>
            <h3 style={tableTitleStyle}>Impactos del proyecto</h3>
            <p style={tableSubtitleStyle}>Detalle de impactos potenciales asociados al proyecto.</p>
          </div>
          <button type="button" style={primaryButtonStyle} onClick={() => { setShowImpactForm((p) => !p); setImpactErrorMsg(""); }}>
            {showImpactForm ? "Cancelar" : "+ Nuevo impacto"}
          </button>
        </div>

        {showImpactForm && (
          <form onSubmit={handleCreateImpact} style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, marginBottom: 20, background: "#f9fafb" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
              <div><label style={labelStyle}>Título</label><input type="text" name="titulo" value={impactForm.titulo} onChange={handleImpactFormChange} style={inputStyle} required /></div>
              <div><label style={labelStyle}>Tipo</label>
                <select name="tipo_impacto" value={impactForm.tipo_impacto} onChange={handleImpactFormChange} style={inputStyle}>
                  <option value="OpEx">OpEx</option><option value="Alquiler">Alquiler</option>
                  <option value="Personal">Personal</option><option value="Ingr./Margen">Ingr./Margen</option>
                </select>
              </div>
              <div><label style={labelStyle}>Importe (€)</label><input type="number" name="importe" value={impactForm.importe} onChange={handleImpactFormChange} style={inputStyle} min="0" /></div>
              <div style={{ gridColumn: "1 / -1" }}><label style={labelStyle}>Descripción</label><textarea name="descripcion" value={impactForm.descripcion} onChange={handleImpactFormChange} style={{ ...inputStyle, minHeight: 70, resize: "vertical", fontFamily: "inherit" }} /></div>
            </div>
            {impactErrorMsg && <div style={{ marginTop: 12, padding: 10, borderRadius: 8, background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", fontSize: 14 }}>{impactErrorMsg}</div>}
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 16 }}>
              <button type="button" style={secondaryButtonStyle} onClick={() => setShowImpactForm(false)}>Cancelar</button>
              <button type="submit" style={primaryButtonStyle} disabled={savingImpact}>{savingImpact ? "Guardando..." : "Guardar impacto"}</button>
            </div>
          </form>
        )}

        {impactos.length === 0 ? (
          <p style={{ marginBottom: 0, color: "#6b7280" }}>Este proyecto todavía no tiene impactos.</p>
        ) : (
          <div style={tableWrapperStyle}>
            <table style={{ ...tableStyle, minWidth: 600 }}>
              <thead>
                <tr>
                  <th style={thStyle}>Título</th>
                  <th style={thStyle}>Descripción</th>
                  <th style={thStyle}>Tipo</th>
                  <th style={{ ...thStyle, textAlign: "right" }}>Importe</th>
                  <th style={thStyle}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {impactos.map((impacto) => (
                  <tr key={impacto.id_impacto}>
                    <td style={tdTitleStyle}>{impacto.titulo}</td>
                    <td style={tdDescriptionStyle}>{impacto.descripcion || "-"}</td>
                    <td style={tdBadgeStyle}><span style={{ ...badgeStyle, background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0" }}>{impacto.tipo_impacto}</span></td>
                    <td style={{ ...tdStyle, textAlign: "right", fontWeight: 700 }}>{formatCurrency(impacto.importe)}</td>
                    <td style={tdActionsStyle}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button type="button" onClick={() => { setEditingImpact({ ...impacto }); setShowImpactEditModal(true); }} style={{ background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", borderRadius: 10, width: 36, height: 36, display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Settings size={16} /></button>
                        <button type="button" onClick={() => handleDeleteImpact(impacto.id_impacto)} style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 10, width: 36, height: 36, display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Trash size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ===== SECCIÓN: RIESGOS ===== */}
      <section style={tableCardStyle}>
        <div style={tableHeaderStyle}>
          <div>
            <h3 style={tableTitleStyle}>Riesgos del proyecto</h3>
            <p style={tableSubtitleStyle}>Registro de riesgos y planes de mitigación.</p>
          </div>
          <button type="button" style={primaryButtonStyle} onClick={() => { setShowRiskForm((p) => !p); setRiskErrorMsg(""); }}>
            {showRiskForm ? "Cancelar" : "+ Nuevo riesgo"}
          </button>
        </div>

        {showRiskForm && (
          <form onSubmit={handleCreateRisk} style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, marginBottom: 20, background: "#f9fafb" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
              <div><label style={labelStyle}>Categoría</label>
                <select name="categoria" value={riskForm.categoria} onChange={handleRiskFormChange} style={inputStyle}>
                  <option value="Riesgo de retraso">Riesgo de retraso</option>
                  <option value="Desvío de coste">Desvío de coste</option>
                  <option value="Desvío de impacto">Desvío de impacto</option>
                  <option value="Dependencia externa">Dependencia externa</option>
                  <option value="Otros">Otros</option>
                </select>
              </div>
              <div style={{ gridColumn: "1 / -1" }}><label style={labelStyle}>Descripción</label><textarea name="descripcion" value={riskForm.descripcion} onChange={handleRiskFormChange} maxLength={512} required style={{ ...inputStyle, minHeight: 70, resize: "vertical", fontFamily: "inherit" }} /></div>
              <div style={{ gridColumn: "1 / -1" }}><label style={labelStyle}>Plan de mitigación</label><textarea name="plan_mitigacion" value={riskForm.plan_mitigacion} onChange={handleRiskFormChange} maxLength={512} style={{ ...inputStyle, minHeight: 70, resize: "vertical", fontFamily: "inherit" }} /></div>
            </div>
            {riskErrorMsg && <div style={{ marginTop: 12, padding: 10, borderRadius: 8, background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", fontSize: 14 }}>{riskErrorMsg}</div>}
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 16 }}>
              <button type="button" style={secondaryButtonStyle} onClick={() => setShowRiskForm(false)}>Cancelar</button>
              <button type="submit" style={primaryButtonStyle} disabled={savingRisk}>{savingRisk ? "Guardando..." : "Guardar riesgo"}</button>
            </div>
          </form>
        )}

        {riesgos.length === 0 ? (
          <p style={{ marginBottom: 0, color: "#6b7280" }}>Este proyecto todavía no tiene riesgos registrados.</p>
        ) : (
          <div style={tableWrapperStyle}>
            <table style={{ ...tableStyle, minWidth: 600 }}>
              <thead>
                <tr>
                  <th style={thStyle}>Categoría</th>
                  <th style={{ ...thStyle, width: 300 }}>Descripción</th>
                  <th style={{ ...thStyle, width: 300 }}>Plan de mitigación</th>
                  <th style={thStyle}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {riesgos.map((riesgo) => (
                  <tr key={riesgo.id_riesgo}>
                    <td style={tdBadgeStyle}><span style={{ ...badgeStyle, background: "#fff7ed", color: "#9a3412", border: "1px solid #fed7aa" }}>{riesgo.categoria}</span></td>
                    <td style={tdDescriptionStyle}>{riesgo.descripcion || "-"}</td>
                    <td style={tdDescriptionStyle}>{riesgo.plan_mitigacion || "-"}</td>
                    <td style={tdActionsStyle}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button type="button" onClick={() => { setEditingRisk({ ...riesgo }); setShowRiskEditModal(true); }} style={{ background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", borderRadius: 10, width: 36, height: 36, display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Settings size={16} /></button>
                        <button type="button" onClick={() => handleDeleteRisk(riesgo.id_riesgo)} style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 10, width: 36, height: 36, display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Trash size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ===== MODALES ===== */}

      {/* Modal edición proyecto */}
      {showProjectEditModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, zIndex: 1000 }}>
          <div style={{ width: "100%", maxWidth: 620, background: "#ffffff", borderRadius: 16, border: "1px solid #e5e7eb", boxShadow: "0 20px 60px rgba(0,0,0,0.18)", padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ margin: 0, color: "#111827" }}>Editar proyecto</h3>
              <button onClick={() => setShowProjectEditModal(false)} style={{ background: "transparent", border: "none", fontSize: 24, cursor: "pointer", color: "#6b7280" }}>×</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={{ gridColumn: "1 / -1" }}><label style={labelStyle}>Título</label><input type="text" value={projectEditForm.titulo} onChange={(e) => setProjectEditForm({ ...projectEditForm, titulo: e.target.value })} style={inputStyle} /></div>
              <div><label style={labelStyle}>Owner</label><input type="text" value={projectEditForm.owner} onChange={(e) => setProjectEditForm({ ...projectEditForm, owner: e.target.value })} style={inputStyle} /></div>
              <div><label style={labelStyle}>Horizonte</label>
                <select value={projectEditForm.horizonte} onChange={(e) => setProjectEditForm({ ...projectEditForm, horizonte: e.target.value })} style={inputStyle}>
                  <option value="Quick-Win">Quick-Win</option><option value="Mid-term">Mid-term</option>
                </select>
              </div>
              <div style={{ gridColumn: "1 / -1" }}><label style={labelStyle}>Descripción</label><textarea value={projectEditForm.descripcion} onChange={(e) => setProjectEditForm({ ...projectEditForm, descripcion: e.target.value })} style={{ ...inputStyle, minHeight: 80, resize: "vertical", fontFamily: "inherit" }} /></div>
              <div style={{ gridColumn: "1 / -1" }}><label style={labelStyle}>Beneficios</label><textarea value={projectEditForm.beneficios} onChange={(e) => setProjectEditForm({ ...projectEditForm, beneficios: e.target.value })} style={{ ...inputStyle, minHeight: 80, resize: "vertical", fontFamily: "inherit" }} /></div>
            </div>
            {projectEditError && <div style={{ marginTop: 12, padding: 10, borderRadius: 8, background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", fontSize: 14 }}>{projectEditError}</div>}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24 }}>
              <button onClick={() => setShowProjectEditModal(false)} style={secondaryButtonStyle}>Cancelar</button>
              <button onClick={handleUpdateProject} disabled={savingProject} style={{ ...primaryButtonStyle, cursor: savingProject ? "default" : "pointer" }}>{savingProject ? "Guardando..." : "Guardar cambios"}</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL EDICIÓN TAREA ===== */}
      {showEditModal && editingTask && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, zIndex: 1000 }}>
          <div style={{ width: "100%", maxWidth: 720, background: "#ffffff", borderRadius: 16, border: "1px solid #e5e7eb", boxShadow: "0 20px 60px rgba(0,0,0,0.18)", padding: 24, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>{editingTask.id_tarea}</div>
                <h3 style={{ margin: 0, color: "#111827" }}>Editar tarea</h3>
              </div>
              <button onClick={() => setShowEditModal(false)} style={{ background: "transparent", border: "none", fontSize: 24, cursor: "pointer", color: "#6b7280" }}>×</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Título</label>
                <input type="text" value={editingTask.titulo || ""} onChange={(e) => setEditingTask({ ...editingTask, titulo: e.target.value })} style={inputStyle} />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Descripción</label>
                <textarea value={editingTask.descripcion || ""} onChange={(e) => setEditingTask({ ...editingTask, descripcion: e.target.value })} style={{ ...inputStyle, minHeight: 80, resize: "vertical", fontFamily: "inherit" }} />
              </div>

              {/* ===== [NUEVO Paso 4] Gestión de owners en modal de edición ===== */}
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Owners de la tarea</label>
                {/* Owners actuales como tags con botón eliminar */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8, minHeight: 32 }}>
                  {(editingTask.owners_ids || []).length === 0 ? (
                    <span style={{ fontSize: 13, color: "#9ca3af", fontStyle: "italic" }}>Sin owners asignados</span>
                  ) : (
                    (editingTask.owners_ids || []).map((uid, idx) => {
                      const nombre = (editingTask.owners_nombres || [])[idx] || uid;
                      return (
                        <span key={uid} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#dbeafe", color: "#1d4ed8", border: "1px solid #bfdbfe", borderRadius: 999, padding: "3px 10px", fontSize: 13, fontWeight: 600 }}>
                          {nombre}
                          <button type="button" onClick={() => handleRemoveOwnerFromTask(uid)} style={{ background: "none", border: "none", cursor: "pointer", color: "#1d4ed8", fontSize: 16, lineHeight: 1, padding: 0 }}>×</button>
                        </span>
                      );
                    })
                  )}
                </div>
                {/* Desplegable para añadir nuevo owner */}
                <select
                  style={inputStyle}
                  value=""
                  onChange={(e) => handleAddOwnerToTask(e.target.value)}
                >
                  <option value="">— Añadir owner —</option>
                  {usuariosActivos
                    .filter((u) => !(editingTask.owners_ids || []).includes(u.id))
                    .map((u) => (
                      <option key={u.id} value={u.id}>{u.nombre} ({u.email})</option>
                    ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Fase</label>
                <select value={editingTask.estado_tarea || "No Iniciada"} onChange={(e) => setEditingTask({ ...editingTask, estado_tarea: e.target.value })} style={inputStyle}>
                  <option value="No Iniciada">No Iniciada</option>
                  <option value="Planificada">Planificada</option>
                  <option value="En curso">En curso</option>
                  <option value="Finalizada">Finalizada</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Estado</label>
                <select value={editingTask.situacion || "En tiempo"} onChange={(e) => setEditingTask({ ...editingTask, situacion: e.target.value })} style={inputStyle}>
                  <option value="En tiempo">En tiempo</option>
                  <option value="Riesgo de retraso">Riesgo de retraso</option>
                  <option value="Retrasado">Retrasado</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Fecha inicio real</label>
                <input type="date" value={editingTask.fecha_inicio_real || ""} onChange={(e) => setEditingTask({ ...editingTask, fecha_inicio_real: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Fecha fin real</label>
                <input type="date" value={editingTask.fecha_fin_real || ""} onChange={(e) => setEditingTask({ ...editingTask, fecha_fin_real: e.target.value })} style={inputStyle} />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24 }}>
              <button onClick={() => { setShowEditModal(false); setEditingTask(null); }} style={secondaryButtonStyle}>Cancelar</button>
              <button onClick={handleUpdateTask} style={primaryButtonStyle}>Guardar cambios</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal edición coste */}
      {showCostEditModal && editingCost && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, zIndex: 1000 }}>
          <div style={{ width: "100%", maxWidth: 620, background: "#ffffff", borderRadius: 16, border: "1px solid #e5e7eb", boxShadow: "0 20px 60px rgba(0,0,0,0.18)", padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div><div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>{editingCost.id_coste}</div><h3 style={{ margin: 0, color: "#111827" }}>Editar coste</h3></div>
              <button onClick={() => setShowCostEditModal(false)} style={{ background: "transparent", border: "none", fontSize: 24, cursor: "pointer", color: "#6b7280" }}>×</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={{ gridColumn: "1 / -1" }}><label style={labelStyle}>Título</label><input type="text" value={editingCost.titulo || ""} onChange={(e) => setEditingCost({ ...editingCost, titulo: e.target.value })} style={inputStyle} /></div>
              <div><label style={labelStyle}>Tipo</label>
                <select value={editingCost.tipo_coste || "OpEx"} onChange={(e) => setEditingCost({ ...editingCost, tipo_coste: e.target.value })} style={inputStyle}>
                  <option value="OpEx">OpEx</option><option value="CapEx">CapEx</option>
                </select>
              </div>
              <div><label style={labelStyle}>Importe (€)</label><input type="number" value={editingCost.importe ?? ""} onChange={(e) => setEditingCost({ ...editingCost, importe: e.target.value })} style={inputStyle} min="0" /></div>
              <div style={{ gridColumn: "1 / -1" }}><label style={labelStyle}>Descripción</label><textarea value={editingCost.descripcion || ""} onChange={(e) => setEditingCost({ ...editingCost, descripcion: e.target.value })} style={{ ...inputStyle, minHeight: 70, resize: "vertical", fontFamily: "inherit" }} /></div>
            </div>
            {costEditError && <div style={{ marginTop: 12, padding: 10, borderRadius: 8, background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", fontSize: 14 }}>{costEditError}</div>}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24 }}>
              <button onClick={() => setShowCostEditModal(false)} style={secondaryButtonStyle}>Cancelar</button>
              <button onClick={handleUpdateCost} disabled={savingCostEdit} style={{ ...primaryButtonStyle, cursor: savingCostEdit ? "default" : "pointer" }}>{savingCostEdit ? "Guardando..." : "Guardar cambios"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal edición impacto */}
      {showImpactEditModal && editingImpact && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, zIndex: 1000 }}>
          <div style={{ width: "100%", maxWidth: 620, background: "#ffffff", borderRadius: 16, border: "1px solid #e5e7eb", boxShadow: "0 20px 60px rgba(0,0,0,0.18)", padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div><div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>{editingImpact.id_impacto}</div><h3 style={{ margin: 0, color: "#111827" }}>Editar impacto</h3></div>
              <button onClick={() => setShowImpactEditModal(false)} style={{ background: "transparent", border: "none", fontSize: 24, cursor: "pointer", color: "#6b7280" }}>×</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={{ gridColumn: "1 / -1" }}><label style={labelStyle}>Título</label><input type="text" value={editingImpact.titulo || ""} onChange={(e) => setEditingImpact({ ...editingImpact, titulo: e.target.value })} style={inputStyle} /></div>
              <div><label style={labelStyle}>Tipo</label>
                <select value={editingImpact.tipo_impacto || "OpEx"} onChange={(e) => setEditingImpact({ ...editingImpact, tipo_impacto: e.target.value })} style={inputStyle}>
                  <option value="OpEx">OpEx</option><option value="Alquiler">Alquiler</option>
                  <option value="Personal">Personal</option><option value="Ingr./Margen">Ingr./Margen</option>
                </select>
              </div>
              <div><label style={labelStyle}>Importe (€)</label><input type="number" value={editingImpact.importe ?? ""} onChange={(e) => setEditingImpact({ ...editingImpact, importe: e.target.value })} style={inputStyle} min="0" /></div>
              <div style={{ gridColumn: "1 / -1" }}><label style={labelStyle}>Descripción</label><textarea value={editingImpact.descripcion || ""} onChange={(e) => setEditingImpact({ ...editingImpact, descripcion: e.target.value })} style={{ ...inputStyle, minHeight: 70, resize: "vertical", fontFamily: "inherit" }} /></div>
            </div>
            {impactEditError && <div style={{ marginTop: 12, padding: 10, borderRadius: 8, background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", fontSize: 14 }}>{impactEditError}</div>}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24 }}>
              <button onClick={() => setShowImpactEditModal(false)} style={secondaryButtonStyle}>Cancelar</button>
              <button onClick={handleUpdateImpact} disabled={savingImpactEdit} style={{ ...primaryButtonStyle, cursor: savingImpactEdit ? "default" : "pointer" }}>{savingImpactEdit ? "Guardando..." : "Guardar cambios"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal edición riesgo */}
      {showRiskEditModal && editingRisk && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, zIndex: 1000 }}>
          <div style={{ width: "100%", maxWidth: 620, background: "#ffffff", borderRadius: 16, border: "1px solid #e5e7eb", boxShadow: "0 20px 60px rgba(0,0,0,0.18)", padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div><div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>{editingRisk.id_riesgo}</div><h3 style={{ margin: 0, color: "#111827" }}>Editar riesgo</h3></div>
              <button onClick={() => setShowRiskEditModal(false)} style={{ background: "transparent", border: "none", fontSize: 24, cursor: "pointer", color: "#6b7280" }}>×</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div><label style={labelStyle}>Categoría</label>
                <select value={editingRisk.categoria || "Riesgo de retraso"} onChange={(e) => setEditingRisk({ ...editingRisk, categoria: e.target.value })} style={inputStyle}>
                  <option value="Riesgo de retraso">Riesgo de retraso</option>
                  <option value="Desvío de coste">Desvío de coste</option>
                  <option value="Desvío de impacto">Desvío de impacto</option>
                  <option value="Dependencia externa">Dependencia externa</option>
                  <option value="Otros">Otros</option>
                </select>
              </div>
              <div style={{ gridColumn: "1 / -1" }}><label style={labelStyle}>Descripción</label><textarea value={editingRisk.descripcion || ""} onChange={(e) => setEditingRisk({ ...editingRisk, descripcion: e.target.value })} maxLength={512} style={{ ...inputStyle, minHeight: 80, resize: "vertical", fontFamily: "inherit" }} /></div>
              <div style={{ gridColumn: "1 / -1" }}><label style={labelStyle}>Plan de mitigación</label><textarea value={editingRisk.plan_mitigacion || ""} onChange={(e) => setEditingRisk({ ...editingRisk, plan_mitigacion: e.target.value })} maxLength={512} style={{ ...inputStyle, minHeight: 80, resize: "vertical", fontFamily: "inherit" }} /></div>
            </div>
            {riskEditError && <div style={{ marginTop: 12, padding: 10, borderRadius: 8, background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", fontSize: 14 }}>{riskEditError}</div>}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24 }}>
              <button onClick={() => setShowRiskEditModal(false)} style={secondaryButtonStyle}>Cancelar</button>
              <button onClick={handleUpdateRisk} disabled={savingRiskEdit} style={{ ...primaryButtonStyle, cursor: savingRiskEdit ? "default" : "pointer" }}>{savingRiskEdit ? "Guardando..." : "Guardar cambios"}</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
