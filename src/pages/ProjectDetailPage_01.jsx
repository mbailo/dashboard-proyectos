import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import { Settings, Trash } from "lucide-react";

async function getMiPerfil() {
  const { data, error } = await supabase.rpc("mi_perfil");
  if (error) throw error;
  return data?.[0] || null;
}

// ===== FUNCIONES DE FECHA (idénticas al original _00) ===== //

function formatDate(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatCurrency(value) {
  if (value == null || value === "") return "-";
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);
}

function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function diffDays(start, end) {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((startOfDay(end) - startOfDay(start)) / msPerDay);
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

// ===== FUNCIONES DE NORMALIZACIÓN Y COLOR (idénticas al original _00) ===== //

function normalizeSituation(situacion) {
  const value = (situacion || "").trim();
  if (value === "En tiempo" || value === "En plazo") return "En tiempo";
  if (value === "Riesgo de retraso" || value === "En riesgo") return "Riesgo de retraso";
  if (value === "Retrasado") return "Retrasado";
  return value || "Sin informar";
}

function getSituationColor(situacion) {
  const normalized = normalizeSituation(situacion);
  if (normalized === "En tiempo") return "#16a34a";
  if (normalized === "Riesgo de retraso") return "#f59e0b";
  if (normalized === "Retrasado") return "#dc2626";
  return "#94a3b8";
}

function getSituationBg(situacion) {
  const normalized = normalizeSituation(situacion);
  if (normalized === "En tiempo") return "#dcfce7";
  if (normalized === "Riesgo de retraso") return "#fef3c7";
  if (normalized === "Retrasado") return "#fee2e2";
  return "#e2e8f0";
}

function getSituationBadgeStyle(situacion) {
  return {
    background: getSituationBg(situacion),
    color: getSituationColor(situacion),
    border: `1px solid ${getSituationBg(situacion) === "#e2e8f0" ? "#cbd5e1" : getSituationBg(situacion)}`,
  };
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
    case "En Definición":    return { background: "#f1f5f9", color: "#334155", border: "1px solid #cbd5e1" };
    case "En Planificación": return { background: "#ede9fe", color: "#6d28d9", border: "1px solid #ddd6fe" };
    case "En Curso":         return { background: "#dbeafe", color: "#1d4ed8", border: "1px solid #bfdbfe" };
    case "Finalizado":       return { background: "#dcfce7", color: "#166534", border: "1px solid #bbf7d0" };
    default:                 return { background: "#f8fafc", color: "#334155", border: "1px solid #e2e8f0" };
  }
}

// ===== LÓGICA DEL CRONOGRAMA (idéntica al original _00) ===== //

function buildTaskTimeline(tasks, project) {
  const today = new Date();
  const currentYear = today.getFullYear();
  const fixedStart = new Date(currentYear, 0, 1);
  const fixedEnd   = new Date(currentYear, 11, 31);

  const taskStarts = tasks
    .flatMap((t) => [parseDate(t.fecha_inicio), parseDate(t.fecha_inicio_real)])
    .filter(Boolean);

  const taskEnds = tasks
    .flatMap((t) => {
      const realStart = parseDate(t.fecha_inicio_real);
      const realEnd   = parseDate(t.fecha_fin_real);
      const actualVisibleEnd = realEnd || (realStart ? today : null);
      return [parseDate(t.fecha_fin), actualVisibleEnd];
    })
    .filter(Boolean);

  const projectStart = parseDate(project?.fecha_inicio);
  const projectEnd   = parseDate(project?.fecha_fin);

  const allStarts = [...taskStarts, ...(projectStart ? [projectStart] : [])];
  const allEnds   = [...taskEnds,   ...(projectEnd   ? [projectEnd]   : [])];

  const minStart = allStarts.length ? new Date(Math.min(...allStarts.map((d) => d.getTime()))) : fixedStart;
  const maxEnd   = allEnds.length   ? new Date(Math.max(...allEnds.map((d) => d.getTime())))   : fixedEnd;

  const rawStart = minStart < fixedStart ? minStart : fixedStart;
  const rawEnd   = maxEnd   > fixedEnd   ? maxEnd   : fixedEnd;

  const start     = startOfMonth(rawStart);
  const end       = endOfMonth(rawEnd);
  const totalDays = Math.max(1, diffDays(start, end) + 1);

  const months = [];
  let cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  while (cursor <= end) {
    const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const monthEnd   = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
    months.push({
      key:      `${cursor.getFullYear()}-${cursor.getMonth()}`,
      label:    cursor.toLocaleDateString("es-ES", { month: "short" }).replace(".", "") + "'" + String(cursor.getFullYear()).slice(-2),
      leftPct:  (diffDays(start, monthStart) / totalDays) * 100,
      widthPct: ((diffDays(monthStart, monthEnd) + 1) / totalDays) * 100,
    });
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  }

  const weekStart      = addDays(today, -((today.getDay() + 6) % 7));
  const currentLinePct = today < start ? 0 : today > end ? 100 : (diffDays(start, today) / totalDays) * 100;

  return { start, end, totalDays, months, currentLinePct };
}

// ===== COMPONENTE GANTT (idéntico al original _00) ===== //

function TaskGanttChart({ tasks, project }) {
  const timeline = useMemo(() => buildTaskTimeline(tasks, project), [tasks, project]);

  const getBarLabel = (estado) => {
    if (estado === "No Iniciada") return "NI";
    if (estado === "Planificada") return "PL";
    if (estado === "En curso")    return "EC";
    if (estado === "Finalizada")  return "FI";
    return "TA";
  };

  return (
    <section style={styles.ganttCard}>
      <div style={styles.ganttHeader}>
        <div>
          <h2 style={styles.tableTitle}>Cronograma de tareas del proyecto</h2>
          <p style={styles.tableSubtitle}>
            Vista sencilla de las tareas del proyecto. El cronograma cubre como mínimo el año actual y marca la semana actual.
          </p>
        </div>
        <div style={styles.ganttLegend}>
          <div style={styles.legendItem}><span style={{ ...styles.legendSwatch, background: "#dbeafe", border: "1px solid #93c5fd" }} /><span>Barra tarea</span></div>
          <div style={styles.legendItem}><span style={{ ...styles.legendLine, background: "#0f172a" }} /><span>Hoy</span></div>
          <div style={styles.legendItem}><span style={{ ...styles.trafficDot, background: getSituationColor("En tiempo") }} /><span>En tiempo</span></div>
          <div style={styles.legendItem}><span style={{ ...styles.trafficDot, background: getSituationColor("Riesgo de retraso") }} /><span>Riesgo de retraso</span></div>
          <div style={styles.legendItem}><span style={{ ...styles.trafficDot, background: getSituationColor("Retrasado") }} /><span>Retrasado</span></div>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div style={styles.emptyGantt}>No hay tareas para mostrar en el cronograma.</div>
      ) : (
        <div style={styles.ganttScroll}>
          <div style={styles.ganttBoard}>
            <div style={styles.ganttTopRow}>
              <div style={styles.ganttProjectHeader}>Tarea</div>
              <div style={styles.ganttTimelineHeader}>
                {timeline.months.map((month) => (
                  <div key={month.key} style={{ ...styles.monthHeader, left: `${month.leftPct}%`, width: `${month.widthPct}%` }}>{month.label}</div>
                ))}
                <div style={{ ...styles.currentWeekLine, left: `${timeline.currentLinePct}%` }} />
                <div style={{ ...styles.currentWeekTag, left: `min(${Math.max(timeline.currentLinePct, 1)}%, calc(100% - 50px))` }}>Hoy</div>
              </div>
              <div style={styles.ganttStatusHeader}>Estado</div>
            </div>

            {tasks.map((task) => {
              const start = parseDate(task.fecha_inicio);
              const end   = parseDate(task.fecha_fin);
              const realStart      = parseDate(task.fecha_inicio_real);
              const realEnd        = parseDate(task.fecha_fin_real);
              const visibleRealEnd = realEnd || (realStart ? new Date() : null);
              const trafficLabel   = normalizeSituation(task.situacion);

              let leftPct = 0, widthPct = 0;
              if (start && end) {
                const boundedStart = start < timeline.start ? timeline.start : start;
                const boundedEnd   = end   > timeline.end   ? timeline.end   : end;
                leftPct  = (diffDays(timeline.start, boundedStart) / timeline.totalDays) * 100;
                widthPct = Math.max((diffDays(boundedStart, boundedEnd) + 1) / timeline.totalDays * 100, 1.4);
              }

              let realLeftPct = 0, realWidthPct = 0;
              if (realStart && visibleRealEnd) {
                const bRS = realStart      < timeline.start ? timeline.start : realStart;
                const bRE = visibleRealEnd > timeline.end   ? timeline.end   : visibleRealEnd;
                realLeftPct  = (diffDays(timeline.start, bRS) / timeline.totalDays) * 100;
                realWidthPct = Math.max((diffDays(bRS, bRE) + 1) / timeline.totalDays * 100, 1);
              }

              return (
                <div key={task.id_tarea} style={styles.ganttRow}>
                  <div style={styles.ganttProjectCell}>
                    <div style={styles.ganttProjectTitle} title={task.titulo}>{task.titulo}</div>
                    {/* [NUEVO Paso 4] owners_texto en el Gantt */}
                    {task.owners_texto && <div style={styles.ganttProjectMeta}>{task.owners_texto}</div>}
                  </div>
                  <div style={styles.ganttTimelineCell}>
                    {timeline.months.map((month) => (
                      <div key={`${task.id_tarea}-${month.key}`} style={{ ...styles.monthBand, left: `${month.leftPct}%`, width: `${month.widthPct}%` }} />
                    ))}
                    <div style={{ ...styles.currentWeekLine, left: `${timeline.currentLinePct}%` }} />
                    {start && end ? (
                      <>
                        <div
                          style={{ ...styles.ganttBar, left: `${Math.max(0, leftPct)}%`, width: `${Math.max(widthPct, 1.4)}%` }}
                          title={`${task.titulo} · ${formatDate(task.fecha_inicio)} → ${formatDate(task.fecha_fin)}`}
                        >
                          <span style={styles.ganttBarLabel}>{getBarLabel(task.estado_tarea)}</span>
                        </div>
                        {realStart && visibleRealEnd && (
                          <div
                            style={{ ...styles.ganttBarReal, left: `${Math.max(0, realLeftPct)}%`, width: `${Math.max(realWidthPct, 1)}%`, background: realEnd ? "#10b981" : "#f59e0b" }}
                            title={`Real: ${formatDate(task.fecha_inicio_real)} → ${realEnd ? formatDate(task.fecha_fin_real) : "Hoy"}`}
                          />
                        )}
                      </>
                    ) : (
                      <div style={styles.ganttNoDates}>Sin fechas</div>
                    )}
                  </div>
                  <div style={styles.ganttStatusCell} title={trafficLabel}>
                    <span style={{ ...styles.trafficDotLarge, background: getSituationColor(task.situacion) }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

// ===== ESTILOS (objeto styles idéntico al original _00) ===== //

const styles = {
  tableTitle:    { margin: 0, fontSize: 22, color: "#0f172a" },
  tableSubtitle: { margin: "4px 0 0 0", fontSize: 13, color: "#64748b" },
  ganttCard:     { width: "100%", margin: "0 auto", boxSizing: "border-box", background: "rgba(255,255,255,0.92)", border: "1px solid #dbe4ee", borderRadius: 20, padding: 18, boxShadow: "0 14px 36px rgba(15, 23, 42, 0.08)", backdropFilter: "blur(8px)" },
  ganttHeader:   { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 16, flexWrap: "wrap" },
  ganttLegend:   { display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", justifyContent: "flex-end" },
  legendItem:    { display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "#64748b", whiteSpace: "nowrap" },
  legendSwatch:  { width: 18, height: 10, borderRadius: 999, display: "inline-block" },
  legendLine:    { width: 18, height: 2,  borderRadius: 999, display: "inline-block" },
  ganttScroll:   { width: "100%", overflowX: "auto" },
  ganttBoard:    { minWidth: 1120, margin: "0 auto", border: "1px solid #e2e8f0", borderRadius: 16, overflow: "hidden", background: "#ffffff" },
  ganttTopRow:   { display: "grid", gridTemplateColumns: "240px 1fr 64px", borderBottom: "1px solid #e2e8f0", background: "#f8fafc" },
  ganttProjectHeader:  { padding: "10px 12px", fontSize: 12, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "#475569", borderRight: "1px solid #e2e8f0" },
  ganttTimelineHeader: { position: "relative", height: 54, borderRight: "1px solid #e2e8f0" },
  ganttStatusHeader:   { padding: "10px 12px", fontSize: 12, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "#475569", textAlign: "center" },
  monthHeader:         { position: "absolute", top: 0, bottom: 0, display: "flex", alignItems: "center", justifyContent: "center", borderRight: "1px solid #e2e8f0", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "capitalize", background: "rgba(248,250,252,0.65)" },
  currentWeekLine:     { position: "absolute", top: 0, bottom: 0, width: 2, marginLeft: -1, background: "#0f172a", opacity: 0.8, zIndex: 4 },
  currentWeekTag:      { position: "absolute", top: 6, transform: "translateX(-50%)", padding: "4px 8px", borderRadius: 999, background: "#0f172a", color: "#ffffff", fontSize: 10, fontWeight: 700, whiteSpace: "nowrap", zIndex: 5 },
  ganttRow:            { display: "grid", gridTemplateColumns: "240px 1fr 64px", minHeight: 52, borderBottom: "1px solid #edf2f7" },
  ganttProjectCell:    { padding: "10px 14px", borderRight: "1px solid #edf2f7", display: "flex", flexDirection: "column", justifyContent: "center", gap: 4 },
  ganttProjectTitle:   { fontSize: 13, fontWeight: 700, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  ganttProjectMeta:    { fontSize: 11, color: "#64748b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  ganttTimelineCell:   { position: "relative", minHeight: 52, borderRight: "1px solid #edf2f7", overflow: "hidden" },
  ganttBar:            { position: "absolute", top: "50%", transform: "translateY(-50%)", height: 16, borderRadius: 999, background: "linear-gradient(135deg, #93c5fd 0%, #3b82f6 100%)", boxShadow: "0 5px 12px rgba(59,130,246,0.24)", display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 6, zIndex: 3 },
  ganttBarReal:        { position: "absolute", top: "calc(50% + 10px)", height: 4, borderRadius: 999, boxShadow: "0 1px 4px rgba(15,23,42,0.18)", zIndex: 2 },
  ganttBarLabel:       { fontSize: 10, fontWeight: 700, color: "#ffffff", letterSpacing: "0.02em" },
  ganttNoDates:        { position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#94a3b8", zIndex: 2 },
  ganttStatusCell:     { display: "flex", alignItems: "center", justifyContent: "center" },
  trafficDot:          { width: 10, height: 10, borderRadius: "50%", display: "inline-block", boxShadow: "0 0 0 3px rgba(15,23,42,0.04)" },
  trafficDotLarge:     { width: 14, height: 14, borderRadius: "50%", display: "inline-block", boxShadow: "0 0 0 4px rgba(15,23,42,0.05)" },
  monthBand:           { position: "absolute", top: 0, bottom: 0, borderRight: "1px solid #f1f5f9", background: "linear-gradient(180deg, rgba(248,250,252,0.55) 0%, rgba(255,255,255,0.35) 100%)" },
  emptyGantt:          { padding: 24, textAlign: "center", color: "#64748b", border: "1px dashed #cbd5e1", borderRadius: 14, background: "#f8fafc" },
};

// ===== ESTILOS DE TABLA (idénticos al original _00) ===== //

const thStyle           = { position: "sticky", top: 0, background: "#f8fafc", textAlign: "left", padding: "14px 14px", fontSize: "12px", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.04em", borderBottom: "1px solid #dbe4ee", whiteSpace: "nowrap" };
const tdStyle           = { padding: "14px 14px", borderBottom: "1px solid #edf2f7", fontSize: "14px", color: "#334155", whiteSpace: "nowrap", background: "rgba(255,255,255,0.78)", verticalAlign: "top" };
const tdTitleStyle      = { ...tdStyle, width: "150px", maxWidth: "150px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontWeight: 700, color: "#0f172a" };
const tdDescriptionStyle= { ...tdStyle, width: "300px", minWidth: "300px", maxWidth: "300px", whiteSpace: "normal", wordBreak: "break-word", overflowWrap: "anywhere", lineHeight: 1.4 };
const tdOwnerStyle      = { ...tdStyle, width: "160px", maxWidth: "180px", whiteSpace: "normal", wordBreak: "break-word", fontWeight: 600, color: "#0f172a" };
const tdDateStyle       = { ...tdStyle, width: "85px", whiteSpace: "nowrap" };
const tdBadgeStyle      = { ...tdStyle, width: "110px", whiteSpace: "nowrap" };
const tdDelayStyle      = { ...tdStyle, width: "70px", whiteSpace: "nowrap" };
const tdActionsStyle    = { ...tdStyle, width: "90px", whiteSpace: "nowrap" };
const inputStyle        = { width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "14px", boxSizing: "border-box" };
const labelStyle        = { display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" };
const primaryButtonStyle   = { background: "#2563eb", color: "#ffffff", border: "none", borderRadius: "8px", padding: "10px 14px", fontSize: "14px", fontWeight: 600, cursor: "pointer" };
const secondaryButtonStyle = { background: "#ffffff", color: "#374151", border: "1px solid #d1d5db", borderRadius: "8px", padding: "10px 14px", fontSize: "14px", fontWeight: 600, cursor: "pointer" };
const badgeStyle        = { display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: "999px", padding: "6px 10px", fontSize: "12px", fontWeight: 700, whiteSpace: "nowrap" };
const tableCardStyle    = { width: "100%", margin: "0 auto", boxSizing: "border-box", background: "rgba(255,255,255,0.92)", border: "1px solid #dbe4ee", borderRadius: "20px", padding: "18px", boxShadow: "0 14px 36px rgba(15, 23, 42, 0.08)", backdropFilter: "blur(8px)" };
const tableHeaderStyle  = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "14px" };
const tableTitleStyle   = { margin: 0, fontSize: "22px", color: "#0f172a" };
const tableSubtitleStyle= { margin: "4px 0 0 0", fontSize: "13px", color: "#64748b" };
const tableWrapperStyle = { width: "100%", overflowX: "auto" };
const tableStyle        = { width: "100%", minWidth: "1000px", margin: "0 auto", borderCollapse: "separate", borderSpacing: 0, tableLayout: "fixed" };

// ===== COMPONENTE PRINCIPAL ===== //

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [proyecto,  setProyecto]  = useState(null);
  const [tareas,    setTareas]    = useState([]);
  const [costes,    setCostes]    = useState([]);
  const [impactos,  setImpactos]  = useState([]);
  const [riesgos,   setRiesgos]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [errorMsg,  setErrorMsg]  = useState("");

  // [NUEVO Paso 4]
  const [usuariosActivos, setUsuariosActivos] = useState([]);

  const [editingTask,   setEditingTask]   = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const [showProjectEditModal, setShowProjectEditModal] = useState(false);
  const [savingProject,        setSavingProject]        = useState(false);
  const [projectEditError,     setProjectEditError]     = useState("");
  const [projectEditForm,      setProjectEditForm]      = useState({ titulo: "", owner: "", horizonte: "", descripcion: "", beneficios: "" });

  const [showTaskForm, setShowTaskForm] = useState(false);
  const [savingTask,   setSavingTask]   = useState(false);
  const [taskErrorMsg, setTaskErrorMsg] = useState("");
  // [MODIFICADO Paso 4] owners_ids sustituye al campo libre "owner"
  const [taskForm, setTaskForm] = useState({ titulo: "", descripcion: "", owners_ids: [], estado_tarea: "No Iniciada", situacion: "En tiempo", fecha_inicio: "", fecha_fin: "" });

  const [showCostForm, setShowCostForm] = useState(false);
  const [savingCost,   setSavingCost]   = useState(false);
  const [costErrorMsg, setCostErrorMsg] = useState("");
  const [costForm,     setCostForm]     = useState({ titulo: "", descripcion: "", tipo_coste: "OpEx", importe: "" });

  const [showImpactForm, setShowImpactForm] = useState(false);
  const [savingImpact,   setSavingImpact]   = useState(false);
  const [impactErrorMsg, setImpactErrorMsg] = useState("");
  const [impactForm,     setImpactForm]     = useState({ titulo: "", descripcion: "", tipo_impacto: "OpEx", importe: "" });

  const [showRiskForm, setShowRiskForm] = useState(false);
  const [savingRisk,   setSavingRisk]   = useState(false);
  const [riskErrorMsg, setRiskErrorMsg] = useState("");
  const [riskForm,     setRiskForm]     = useState({ descripcion: "", categoria: "Riesgo de retraso", plan_mitigacion: "" });

  const [showCostEditModal, setShowCostEditModal] = useState(false);
  const [editingCost,       setEditingCost]       = useState(null);
  const [savingCostEdit,    setSavingCostEdit]    = useState(false);
  const [costEditError,     setCostEditError]     = useState("");

  const [showImpactEditModal, setShowImpactEditModal] = useState(false);
  const [editingImpact,       setEditingImpact]       = useState(null);
  const [savingImpactEdit,    setSavingImpactEdit]    = useState(false);
  const [impactEditError,     setImpactEditError]     = useState("");

  const [showRiskEditModal, setShowRiskEditModal] = useState(false);
  const [editingRisk,       setEditingRisk]       = useState(null);
  const [savingRiskEdit,    setSavingRiskEdit]    = useState(false);
  const [riskEditError,     setRiskEditError]     = useState("");

  // ===== CARGA DE DATOS ===== //

  async function loadProject(projectId) {
    const { data, error } = await supabase
      .from("v_proyectos_universo_detalle")
      .select(`id_proyecto, id_universo, titulo, descripcion, beneficios, inversion_estimada, impacto_estimado, owner, fase, situacion, fecha_inicio, fecha_fin, avance_pct, nombre_universo`)
      .eq("id_proyecto", projectId).single();
    if (error) throw new Error(error.message);
    return data;
  }

  // [MODIFICADO Paso 4] usa v_tareas_con_owners
  async function loadTasks(projectId) {
    const { data, error } = await supabase
      .from("v_tareas_con_owners")
      .select(`id_tarea, id_proyecto, titulo, descripcion, owner, estado_tarea, situacion, fecha_inicio, fecha_fin, fecha_inicio_real, fecha_fin_real, owners_ids, owners_nombres, owners_texto`)
      .eq("id_proyecto", projectId)
      .order("fecha_inicio", { ascending: true })
      .order("fecha_fin",    { ascending: true });
    if (error) throw new Error(error.message);
    return data || [];
  }

  async function loadCostes(projectId) {
    const { data, error } = await supabase.from("costes_proyecto").select(`id_coste, id_proyecto, titulo, descripcion, tipo_coste, importe`).eq("id_proyecto", projectId).order("id_coste", { ascending: true });
    if (error) throw new Error(error.message);
    return data || [];
  }

  async function loadImpactos(projectId) {
    const { data, error } = await supabase.from("impactos_proyecto").select(`id_impacto, id_proyecto, titulo, descripcion, tipo_impacto, importe`).eq("id_proyecto", projectId).order("id_impacto", { ascending: true });
    if (error) throw new Error(error.message);
    return data || [];
  }

  async function loadRiesgos(projectId) {
    const { data, error } = await supabase.from("riesgos_proyecto").select(`id_riesgo, id_proyecto, descripcion, categoria, plan_mitigacion, created_at`).eq("id_proyecto", projectId).order("id_riesgo", { ascending: true });
    if (error) throw new Error(error.message);
    return data || [];
  }

  // [NUEVO Paso 4]
  async function loadUsuariosActivosFn() {
    const { data, error } = await supabase.rpc("get_usuarios_activos");
    if (error) throw new Error(error.message);
    return data || [];
  }

  async function loadAll() {
    try {
      setLoading(true); setErrorMsg("");
      const perfil = await getMiPerfil();
      if (!perfil || !perfil.activo) { navigate("/login", { replace: true }); return; }
      const proyectoData = await loadProject(id);
      if (perfil.tipo_acceso === "universo" && proyectoData.id_universo !== perfil.id_universo) { navigate(`/universes/${perfil.id_universo}`, { replace: true }); return; }
      const [tareasData, costesData, impactosData, riesgosData, usuariosData] = await Promise.all([
        loadTasks(id), loadCostes(id), loadImpactos(id), loadRiesgos(id), loadUsuariosActivosFn(),
      ]);
      setProyecto(proyectoData); setTareas(tareasData); setCostes(costesData);
      setImpactos(impactosData); setRiesgos(riesgosData); setUsuariosActivos(usuariosData);
    } catch (err) {
      setErrorMsg(err.message || "Error cargando la ficha del proyecto");
      setProyecto(null); setTareas([]); setCostes([]); setImpactos([]); setRiesgos([]);
    } finally { setLoading(false); }
  }

  useEffect(() => { loadAll(); }, [id, navigate]);

  // ===== HANDLERS ===== //

  function handleTaskFormChange(e)   { const { name, value } = e.target; setTaskForm((p)   => ({ ...p, [name]: value })); }
  function handleCostFormChange(e)   { const { name, value } = e.target; setCostForm((p)   => ({ ...p, [name]: value })); }
  function handleImpactFormChange(e) { const { name, value } = e.target; setImpactForm((p) => ({ ...p, [name]: value })); }
  function handleRiskFormChange(e)   { const { name, value } = e.target; setRiskForm((p)   => ({ ...p, [name]: value })); }

  // [NUEVO Paso 4] owners en formulario nueva tarea
  function handleAddOwnerToForm(userId) {
    if (!userId || taskForm.owners_ids.includes(userId)) return;
    setTaskForm((p) => ({ ...p, owners_ids: [...p.owners_ids, userId] }));
  }
  function handleRemoveOwnerFromForm(userId) {
    setTaskForm((p) => ({ ...p, owners_ids: p.owners_ids.filter((i) => i !== userId) }));
  }

  const handleUpdateProject = async () => {
    setSavingProject(true); setProjectEditError("");
    const { error } = await supabase.rpc("actualizar_proyecto", {
      p_id_proyecto: proyecto.id_proyecto, p_titulo: projectEditForm.titulo,
      p_owner: projectEditForm.owner, p_horizonte: projectEditForm.horizonte,
      p_descripcion: projectEditForm.descripcion || null, p_beneficios: projectEditForm.beneficios || null,
    });
    if (error) { setProjectEditError(error.message); setSavingProject(false); return; }
    await loadAll(); setShowProjectEditModal(false); setSavingProject(false);
  };

  // [MODIFICADO Paso 4] crea tarea y asigna owners
  async function handleCreateTask(e) {
    e.preventDefault(); setSavingTask(true); setTaskErrorMsg("");
    const { data: tareaCreada, error } = await supabase.rpc("crear_tarea", {
      p_id_proyecto: id, p_titulo: taskForm.titulo, p_descripcion: taskForm.descripcion || null,
      p_owner: null, p_estado_tarea: taskForm.estado_tarea, p_situacion: taskForm.situacion,
      p_fecha_inicio: taskForm.fecha_inicio || null, p_fecha_fin: taskForm.fecha_fin || null,
    });
    if (error) { setTaskErrorMsg(error.message); setSavingTask(false); return; }
    const idTareaCreada = tareaCreada?.id_tarea ?? tareaCreada;
    if (idTareaCreada && taskForm.owners_ids.length > 0) {
      for (const userId of taskForm.owners_ids) {
        await supabase.rpc("asignar_owner_tarea", { p_id_tarea: idTareaCreada, p_id_usuario: userId });
      }
    }
    setTaskForm({ titulo: "", descripcion: "", owners_ids: [], estado_tarea: "No Iniciada", situacion: "En tiempo", fecha_inicio: "", fecha_fin: "" });
    setShowTaskForm(false); setSavingTask(false);
    try { setTareas(await loadTasks(id)); } catch (err) { setTaskErrorMsg(err.message); }
  }

  const handleUpdateTask = async () => {
    if (!editingTask) return;
    const { error } = await supabase.from("tareas").update({
      titulo: editingTask.titulo, descripcion: editingTask.descripcion,
      estado_tarea: editingTask.estado_tarea, situacion: editingTask.situacion,
      fecha_inicio_real: editingTask.fecha_inicio_real || null,
      fecha_fin_real:    editingTask.fecha_fin_real    || null,
    }).eq("id_tarea", editingTask.id_tarea);
    if (error) { alert("Error al actualizar la tarea"); return; }
    await loadAll(); setShowEditModal(false); setEditingTask(null);
  };

  // [NUEVO Paso 4] asignar/quitar owner desde modal edición
  async function handleAddOwnerToTask(userId) {
    if (!editingTask || !userId || (editingTask.owners_ids || []).includes(userId)) return;
    const { error } = await supabase.rpc("asignar_owner_tarea", { p_id_tarea: editingTask.id_tarea, p_id_usuario: userId });
    if (error) { alert(error.message); return; }
    const u = usuariosActivos.find((x) => x.id === userId);
    setEditingTask((p) => ({ ...p, owners_ids: [...(p.owners_ids || []), userId], owners_nombres: [...(p.owners_nombres || []), u?.nombre || ""], owners_texto: [...(p.owners_nombres || []), u?.nombre || ""].join(", ") }));
    loadTasks(id).then(setTareas);
  }

  async function handleRemoveOwnerFromTask(userId) {
    if (!editingTask || !userId) return;
    const { error } = await supabase.rpc("eliminar_owner_tarea", { p_id_tarea: editingTask.id_tarea, p_id_usuario: userId });
    if (error) { alert(error.message); return; }
    const nuevosIds     = (editingTask.owners_ids     || []).filter((i) => i !== userId);
    const nuevosNombres = (editingTask.owners_nombres || []).filter((_, idx) => (editingTask.owners_ids || [])[idx] !== userId);
    setEditingTask((p) => ({ ...p, owners_ids: nuevosIds, owners_nombres: nuevosNombres, owners_texto: nuevosNombres.join(", ") }));
    loadTasks(id).then(setTareas);
  }

  async function handleDeleteTask(idTarea) {
    if (!window.confirm("¿Seguro que quieres eliminar esta tarea?")) return;
    try { const { error } = await supabase.from("tareas").delete().eq("id_tarea", idTarea); if (error) throw error; await loadAll(); }
    catch (err) { alert(err.message); }
  }

  async function handleCreateCost(e) {
    e.preventDefault(); setSavingCost(true); setCostErrorMsg("");
    const { error } = await supabase.rpc("crear_coste", { p_id_proyecto: id, p_titulo: costForm.titulo, p_descripcion: costForm.descripcion || null, p_tipo_coste: costForm.tipo_coste, p_importe: costForm.importe === "" ? 0 : Number(costForm.importe) });
    if (error) { setCostErrorMsg(error.message); setSavingCost(false); return; }
    setCostForm({ titulo: "", descripcion: "", tipo_coste: "OpEx", importe: "" }); setShowCostForm(false); setSavingCost(false);
    loadCostes(id).then(setCostes).catch(() => {});
  }

  const handleUpdateCost = async () => {
    if (!editingCost) return; setSavingCostEdit(true); setCostEditError("");
    const { error } = await supabase.rpc("actualizar_coste", { p_id_coste: editingCost.id_coste, p_titulo: editingCost.titulo, p_descripcion: editingCost.descripcion || null, p_tipo_coste: editingCost.tipo_coste, p_importe: editingCost.importe === "" ? 0 : Number(editingCost.importe) });
    if (error) { setCostEditError(error.message); setSavingCostEdit(false); return; }
    await loadAll(); setShowCostEditModal(false); setEditingCost(null); setSavingCostEdit(false);
  };

  async function handleDeleteCost(idCoste) {
    if (!window.confirm("¿Seguro que quieres eliminar este coste?")) return;
    try { const { error } = await supabase.rpc("eliminar_coste", { p_id_coste: idCoste }); if (error) throw error; await loadAll(); } catch (err) { alert(err.message); }
  }

  async function handleCreateImpact(e) {
    e.preventDefault(); setSavingImpact(true); setImpactErrorMsg("");
    const { error } = await supabase.rpc("crear_impacto", { p_id_proyecto: id, p_titulo: impactForm.titulo, p_descripcion: impactForm.descripcion || null, p_tipo_impacto: impactForm.tipo_impacto, p_importe: impactForm.importe === "" ? 0 : Number(impactForm.importe) });
    if (error) { setImpactErrorMsg(error.message); setSavingImpact(false); return; }
    setImpactForm({ titulo: "", descripcion: "", tipo_impacto: "OpEx", importe: "" }); setShowImpactForm(false); setSavingImpact(false);
    loadImpactos(id).then(setImpactos).catch(() => {});
  }

  const handleUpdateImpact = async () => {
    if (!editingImpact) return; setSavingImpactEdit(true); setImpactEditError("");
    const { error } = await supabase.rpc("actualizar_impacto", { p_id_impacto: editingImpact.id_impacto, p_titulo: editingImpact.titulo, p_descripcion: editingImpact.descripcion || null, p_tipo_impacto: editingImpact.tipo_impacto, p_importe: editingImpact.importe === "" ? 0 : Number(editingImpact.importe) });
    if (error) { setImpactEditError(error.message); setSavingImpactEdit(false); return; }
    await loadAll(); setShowImpactEditModal(false); setEditingImpact(null); setSavingImpactEdit(false);
  };

  async function handleDeleteImpact(idImpacto) {
    if (!window.confirm("¿Seguro que quieres eliminar este impacto?")) return;
    try { const { error } = await supabase.rpc("eliminar_impacto", { p_id_impacto: idImpacto }); if (error) throw error; await loadAll(); } catch (err) { alert(err.message); }
  }

  async function handleCreateRisk(e) {
    e.preventDefault(); setSavingRisk(true); setRiskErrorMsg("");
    const { error } = await supabase.rpc("crear_riesgo", { p_id_proyecto: id, p_descripcion: riskForm.descripcion, p_categoria: riskForm.categoria, p_plan_mitigacion: riskForm.plan_mitigacion || null });
    if (error) { setRiskErrorMsg(error.message); setSavingRisk(false); return; }
    setRiskForm({ descripcion: "", categoria: "Riesgo de retraso", plan_mitigacion: "" }); setShowRiskForm(false); setSavingRisk(false);
    loadRiesgos(id).then(setRiesgos).catch(() => {});
  }

  const handleUpdateRisk = async () => {
    if (!editingRisk) return; setSavingRiskEdit(true); setRiskEditError("");
    const { error } = await supabase.rpc("actualizar_riesgo", { p_id_riesgo: editingRisk.id_riesgo, p_descripcion: editingRisk.descripcion, p_categoria: editingRisk.categoria, p_plan_mitigacion: editingRisk.plan_mitigacion || null });
    if (error) { setRiskEditError(error.message); setSavingRiskEdit(false); return; }
    await loadAll(); setShowRiskEditModal(false); setEditingRisk(null); setSavingRiskEdit(false);
  };

  async function handleDeleteRisk(idRiesgo) {
    if (!window.confirm("¿Seguro que quieres eliminar este riesgo?")) return;
    try { const { error } = await supabase.rpc("eliminar_riesgo", { p_id_riesgo: idRiesgo }); if (error) throw error; await loadAll(); } catch (err) { alert(err.message); }
  }

  // ===== RENDER ===== //

  if (loading) return <div style={{ padding: "24px" }}>Cargando ficha del proyecto...</div>;
  if (errorMsg) return <div style={{ padding: "24px", color: "#dc2626" }}>{errorMsg}</div>;
  if (!proyecto) return <div style={{ padding: "24px" }}>Proyecto no encontrado.</div>;

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 0 40px 0" }}>

      {/* CABECERA */}
      <section style={{ ...tableCardStyle, marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>{proyecto.nombre_universo} · {proyecto.id_proyecto}</div>
            <h2 style={{ margin: 0, fontSize: 26, color: "#0f172a" }}>{proyecto.titulo}</h2>
            <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ ...badgeStyle, ...getProjectPhaseBadgeStyle(proyecto.fase) }}>{proyecto.fase}</span>
              <span style={{ ...badgeStyle, ...getSituationBadgeStyle(proyecto.situacion) }}>{normalizeSituation(proyecto.situacion)}</span>
              <span style={{ fontSize: 13, color: "#64748b" }}>Owner: <strong>{proyecto.owner || "-"}</strong></span>
              <span style={{ fontSize: 13, color: "#64748b" }}>Horizonte: <strong>{proyecto.horizonte || "-"}</strong></span>
              <span style={{ fontSize: 13, color: "#64748b" }}>Avance: <strong>{proyecto.avance_pct ?? 0}%</strong></span>
            </div>
          </div>
          <button style={secondaryButtonStyle} onClick={() => { setProjectEditForm({ titulo: proyecto.titulo, owner: proyecto.owner || "", horizonte: proyecto.horizonte || "Quick-Win", descripcion: proyecto.descripcion || "", beneficios: proyecto.beneficios || "" }); setShowProjectEditModal(true); }}>Editar proyecto</button>
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

      {/* GANTT — componente original restaurado */}
      <TaskGanttChart tasks={tareas} project={proyecto} />

      {/* TAREAS */}
      <section style={tableCardStyle}>
        <div style={tableHeaderStyle}>
          <div><h3 style={tableTitleStyle}>Tareas del proyecto</h3><p style={tableSubtitleStyle}>Gestión de tareas con owners asignados.</p></div>
          <button type="button" style={primaryButtonStyle} onClick={() => { setShowTaskForm((p) => !p); setTaskErrorMsg(""); }}>{showTaskForm ? "Cancelar" : "+ Nueva tarea"}</button>
        </div>

        {showTaskForm && (
          <form onSubmit={handleCreateTask} style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, marginBottom: 20, background: "#f9fafb" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
              <div style={{ gridColumn: "1 / -1" }}><label style={labelStyle}>Título</label><input type="text" name="titulo" value={taskForm.titulo} onChange={handleTaskFormChange} style={inputStyle} maxLength={32} required /></div>
              <div style={{ gridColumn: "1 / -1" }}><label style={labelStyle}>Descripción</label><textarea name="descripcion" value={taskForm.descripcion} onChange={handleTaskFormChange} maxLength={512} style={{ ...inputStyle, minHeight: 90, resize: "vertical", fontFamily: "inherit" }} /></div>
              {/* [NUEVO Paso 4] Selección owners */}
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Owners de la tarea</label>
                <select style={inputStyle} value="" onChange={(e) => handleAddOwnerToForm(e.target.value)}>
                  <option value="">— Añadir owner —</option>
                  {usuariosActivos.filter((u) => !taskForm.owners_ids.includes(u.id)).map((u) => (<option key={u.id} value={u.id}>{u.nombre} ({u.email})</option>))}
                </select>
                {taskForm.owners_ids.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                    {taskForm.owners_ids.map((uid) => {
                      const u = usuariosActivos.find((x) => x.id === uid);
                      return (<span key={uid} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#dbeafe", color: "#1d4ed8", border: "1px solid #bfdbfe", borderRadius: 999, padding: "3px 10px", fontSize: 13, fontWeight: 600 }}>
                        {u?.nombre || uid}
                        <button type="button" onClick={() => handleRemoveOwnerFromForm(uid)} style={{ background: "none", border: "none", cursor: "pointer", color: "#1d4ed8", fontSize: 16, lineHeight: 1, padding: 0 }}>×</button>
                      </span>);
                    })}
                  </div>
                )}
              </div>
              <div><label style={labelStyle}>Fase</label><select name="estado_tarea" value={taskForm.estado_tarea} onChange={handleTaskFormChange} style={inputStyle}><option value="No Iniciada">No Iniciada</option><option value="Planificada">Planificada</option><option value="En curso">En curso</option><option value="Finalizada">Finalizada</option></select></div>
              <div><label style={labelStyle}>Estado</label><select name="situacion" value={taskForm.situacion} onChange={handleTaskFormChange} style={inputStyle}><option value="En tiempo">En tiempo</option><option value="Riesgo de retraso">Riesgo de retraso</option><option value="Retrasado">Retrasado</option></select></div>
              <div><label style={labelStyle}>Fecha inicio</label><input type="date" name="fecha_inicio" value={taskForm.fecha_inicio} onChange={handleTaskFormChange} style={inputStyle} /></div>
              <div><label style={labelStyle}>Fecha fin</label><input type="date" name="fecha_fin" value={taskForm.fecha_fin} onChange={handleTaskFormChange} style={inputStyle} /></div>
            </div>
            {taskErrorMsg && <div style={{ marginTop: 16, padding: 12, borderRadius: 8, background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", fontSize: 14 }}>{taskErrorMsg}</div>}
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 16 }}>
              <button type="button" style={secondaryButtonStyle} onClick={() => { setShowTaskForm(false); setTaskErrorMsg(""); }}>Cancelar</button>
              <button type="submit" style={primaryButtonStyle} disabled={savingTask}>{savingTask ? "Guardando..." : "Guardar tarea"}</button>
            </div>
          </form>
        )}

        {tareas.length === 0 ? <p style={{ marginBottom: 0, color: "#6b7280" }}>Este proyecto todavía no tiene tareas.</p> : (
          <div style={tableWrapperStyle}>
            <table style={tableStyle}>
              <thead><tr>
                <th style={{ ...thStyle, width: 150 }}>Título</th>
                <th style={{ ...thStyle, width: 300 }}>Descripción</th>
                <th style={{ ...thStyle, width: 160 }}>Owners</th>
                <th style={{ ...thStyle, width: 85 }}>Inicio</th>
                <th style={{ ...thStyle, width: 85 }}>Fin</th>
                <th style={{ ...thStyle, width: 85 }}>Fin real</th>
                <th style={{ ...thStyle, width: 110 }}>Fase</th>
                <th style={{ ...thStyle, width: 110 }}>Estado</th>
                <th style={{ ...thStyle, width: 70 }}>Retraso</th>
                <th style={{ ...thStyle, width: 90 }}>Acciones</th>
              </tr></thead>
              <tbody>
                {tareas.map((tarea) => (
                  <tr key={tarea.id_tarea}>
                    <td style={tdTitleStyle} title={tarea.titulo || ""}>{tarea.titulo || "-"}</td>
                    <td style={tdDescriptionStyle}>{tarea.descripcion || "-"}</td>
                    {/* [MODIFICADO Paso 4] owners_texto */}
                    <td style={tdOwnerStyle} title={tarea.owners_texto || tarea.owner || ""}>{tarea.owners_texto || <span style={{ color: "#9ca3af", fontStyle: "italic" }}>Sin asignar</span>}</td>
                    <td style={tdDateStyle}>{formatDate(tarea.fecha_inicio)}</td>
                    <td style={tdDateStyle}>{formatDate(tarea.fecha_fin)}</td>
                    <td style={tdDateStyle}>{formatDate(tarea.fecha_fin_real)}</td>
                    <td style={tdBadgeStyle}><span style={{ ...badgeStyle, ...getTaskPhaseBadgeStyle(tarea.estado_tarea) }}>{tarea.estado_tarea || "-"}</span></td>
                    <td style={tdBadgeStyle}><span style={{ ...badgeStyle, ...getSituationBadgeStyle(tarea.situacion) }}>{normalizeSituation(tarea.situacion)}</span></td>
                    <td style={tdDelayStyle}>{formatTaskDelay(tarea.fecha_fin, tarea.situacion)}</td>
                    <td style={tdActionsStyle}>
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <button type="button" onClick={() => { setEditingTask({ ...tarea, fecha_inicio_real: tarea.fecha_inicio_real || "", fecha_fin_real: tarea.fecha_fin_real || "", owners_ids: tarea.owners_ids || [], owners_nombres: tarea.owners_nombres || [] }); setShowEditModal(true); }} style={{ background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", borderRadius: 10, width: 36, height: 36, display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Settings size={16} /></button>
                        <button type="button" onClick={() => handleDeleteTask(tarea.id_tarea)} style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 10, width: 36, height: 36, display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Trash size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* COSTES */}
      <section style={tableCardStyle}>
        <div style={tableHeaderStyle}>
          <div><h3 style={tableTitleStyle}>Costes del proyecto</h3><p style={tableSubtitleStyle}>Detalle de costes asociados al proyecto.</p></div>
          <button type="button" style={primaryButtonStyle} onClick={() => { setShowCostForm((p) => !p); setCostErrorMsg(""); }}>{showCostForm ? "Cancelar" : "+ Nuevo coste"}</button>
        </div>
        {showCostForm && (
          <form onSubmit={handleCreateCost} style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, marginBottom: 20, background: "#f9fafb" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
              <div><label style={labelStyle}>Título</label><input type="text" name="titulo" value={costForm.titulo} onChange={handleCostFormChange} style={inputStyle} required /></div>
              <div><label style={labelStyle}>Tipo</label><select name="tipo_coste" value={costForm.tipo_coste} onChange={handleCostFormChange} style={inputStyle}><option value="OpEx">OpEx</option><option value="CapEx">CapEx</option></select></div>
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
        {costes.length === 0 ? <p style={{ marginBottom: 0, color: "#6b7280" }}>Este proyecto todavía no tiene costes.</p> : (
          <div style={tableWrapperStyle}><table style={{ ...tableStyle, minWidth: 600 }}>
            <thead><tr><th style={thStyle}>Título</th><th style={thStyle}>Descripción</th><th style={thStyle}>Tipo</th><th style={{ ...thStyle, textAlign: "right" }}>Importe</th><th style={thStyle}>Acciones</th></tr></thead>
            <tbody>{costes.map((c) => (<tr key={c.id_coste}>
              <td style={tdTitleStyle}>{c.titulo}</td><td style={tdDescriptionStyle}>{c.descripcion || "-"}</td>
              <td style={tdBadgeStyle}><span style={{ ...badgeStyle, background: "#f1f5f9", color: "#334155", border: "1px solid #cbd5e1" }}>{c.tipo_coste}</span></td>
              <td style={{ ...tdStyle, textAlign: "right", fontWeight: 700 }}>{formatCurrency(c.importe)}</td>
              <td style={tdActionsStyle}><div style={{ display: "flex", gap: 8 }}>
                <button type="button" onClick={() => { setEditingCost({ ...c }); setShowCostEditModal(true); }} style={{ background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", borderRadius: 10, width: 36, height: 36, display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Settings size={16} /></button>
                <button type="button" onClick={() => handleDeleteCost(c.id_coste)} style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 10, width: 36, height: 36, display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Trash size={16} /></button>
              </div></td>
            </tr>))}</tbody>
          </table></div>
        )}
      </section>

      {/* IMPACTOS */}
      <section style={tableCardStyle}>
        <div style={tableHeaderStyle}>
          <div><h3 style={tableTitleStyle}>Impactos del proyecto</h3><p style={tableSubtitleStyle}>Detalle de impactos potenciales asociados al proyecto.</p></div>
          <button type="button" style={primaryButtonStyle} onClick={() => { setShowImpactForm((p) => !p); setImpactErrorMsg(""); }}>{showImpactForm ? "Cancelar" : "+ Nuevo impacto"}</button>
        </div>
        {showImpactForm && (
          <form onSubmit={handleCreateImpact} style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, marginBottom: 20, background: "#f9fafb" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
              <div><label style={labelStyle}>Título</label><input type="text" name="titulo" value={impactForm.titulo} onChange={handleImpactFormChange} style={inputStyle} required /></div>
              <div><label style={labelStyle}>Tipo</label><select name="tipo_impacto" value={impactForm.tipo_impacto} onChange={handleImpactFormChange} style={inputStyle}><option value="OpEx">OpEx</option><option value="Alquiler">Alquiler</option><option value="Personal">Personal</option><option value="Ingr./Margen">Ingr./Margen</option></select></div>
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
        {impactos.length === 0 ? <p style={{ marginBottom: 0, color: "#6b7280" }}>Este proyecto todavía no tiene impactos.</p> : (
          <div style={tableWrapperStyle}><table style={{ ...tableStyle, minWidth: 600 }}>
            <thead><tr><th style={thStyle}>Título</th><th style={thStyle}>Descripción</th><th style={thStyle}>Tipo</th><th style={{ ...thStyle, textAlign: "right" }}>Importe</th><th style={thStyle}>Acciones</th></tr></thead>
            <tbody>{impactos.map((imp) => (<tr key={imp.id_impacto}>
              <td style={tdTitleStyle}>{imp.titulo}</td><td style={tdDescriptionStyle}>{imp.descripcion || "-"}</td>
              <td style={tdBadgeStyle}><span style={{ ...badgeStyle, background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0" }}>{imp.tipo_impacto}</span></td>
              <td style={{ ...tdStyle, textAlign: "right", fontWeight: 700 }}>{formatCurrency(imp.importe)}</td>
              <td style={tdActionsStyle}><div style={{ display: "flex", gap: 8 }}>
                <button type="button" onClick={() => { setEditingImpact({ ...imp }); setShowImpactEditModal(true); }} style={{ background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", borderRadius: 10, width: 36, height: 36, display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Settings size={16} /></button>
                <button type="button" onClick={() => handleDeleteImpact(imp.id_impacto)} style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 10, width: 36, height: 36, display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Trash size={16} /></button>
              </div></td>
            </tr>))}</tbody>
          </table></div>
        )}
      </section>

      {/* RIESGOS */}
      <section style={tableCardStyle}>
        <div style={tableHeaderStyle}>
          <div><h3 style={tableTitleStyle}>Riesgos del proyecto</h3><p style={tableSubtitleStyle}>Registro de riesgos y planes de mitigación.</p></div>
          <button type="button" style={primaryButtonStyle} onClick={() => { setShowRiskForm((p) => !p); setRiskErrorMsg(""); }}>{showRiskForm ? "Cancelar" : "+ Nuevo riesgo"}</button>
        </div>
        {showRiskForm && (
          <form onSubmit={handleCreateRisk} style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, marginBottom: 20, background: "#f9fafb" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
              <div><label style={labelStyle}>Categoría</label><select name="categoria" value={riskForm.categoria} onChange={handleRiskFormChange} style={inputStyle}><option value="Riesgo de retraso">Riesgo de retraso</option><option value="Desvío de coste">Desvío de coste</option><option value="Desvío de impacto">Desvío de impacto</option><option value="Dependencia externa">Dependencia externa</option><option value="Otros">Otros</option></select></div>
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
        {riesgos.length === 0 ? <p style={{ marginBottom: 0, color: "#6b7280" }}>Este proyecto todavía no tiene riesgos registrados.</p> : (
          <div style={tableWrapperStyle}><table style={{ ...tableStyle, minWidth: 600 }}>
            <thead><tr><th style={thStyle}>Categoría</th><th style={{ ...thStyle, width: 300 }}>Descripción</th><th style={{ ...thStyle, width: 300 }}>Plan de mitigación</th><th style={thStyle}>Acciones</th></tr></thead>
            <tbody>{riesgos.map((r) => (<tr key={r.id_riesgo}>
              <td style={tdBadgeStyle}><span style={{ ...badgeStyle, background: "#fff7ed", color: "#9a3412", border: "1px solid #fed7aa" }}>{r.categoria}</span></td>
              <td style={tdDescriptionStyle}>{r.descripcion || "-"}</td>
              <td style={tdDescriptionStyle}>{r.plan_mitigacion || "-"}</td>
              <td style={tdActionsStyle}><div style={{ display: "flex", gap: 8 }}>
                <button type="button" onClick={() => { setEditingRisk({ ...r }); setShowRiskEditModal(true); }} style={{ background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", borderRadius: 10, width: 36, height: 36, display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Settings size={16} /></button>
                <button type="button" onClick={() => handleDeleteRisk(r.id_riesgo)} style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 10, width: 36, height: 36, display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Trash size={16} /></button>
              </div></td>
            </tr>))}</tbody>
          </table></div>
        )}
      </section>

      {/* MODALES */}

      {/* Modal proyecto */}
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
              <div><label style={labelStyle}>Horizonte</label><select value={projectEditForm.horizonte} onChange={(e) => setProjectEditForm({ ...projectEditForm, horizonte: e.target.value })} style={inputStyle}><option value="Quick-Win">Quick-Win</option><option value="Mid-term">Mid-term</option></select></div>
              <div style={{ gridColumn: "1 / -1" }}><label style={labelStyle}>Descripción</label><textarea value={projectEditForm.descripcion} onChange={(e) => setProjectEditForm({ ...projectEditForm, descripcion: e.target.value })} style={{ ...inputStyle, minHeight: 80, resize: "vertical", fontFamily: "inherit" }} /></div>
              <div style={{ gridColumn: "1 / -1" }}><label style={labelStyle}>Beneficios</label><textarea value={projectEditForm.beneficios} onChange={(e) => setProjectEditForm({ ...projectEditForm, beneficios: e.target.value })} style={{ ...inputStyle, minHeight: 80, resize: "vertical", fontFamily: "inherit" }} /></div>
            </div>
            {projectEditError && <div style={{ marginTop: 12, padding: 10, borderRadius: 8, background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", fontSize: 14 }}>{projectEditError}</div>}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24 }}>
              <button onClick={() => setShowProjectEditModal(false)} style={secondaryButtonStyle}>Cancelar</button>
              <button onClick={handleUpdateProject} disabled={savingProject} style={primaryButtonStyle}>{savingProject ? "Guardando..." : "Guardar cambios"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal edición tarea */}
      {showEditModal && editingTask && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, zIndex: 1000 }}>
          <div style={{ width: "100%", maxWidth: 720, background: "#ffffff", borderRadius: 16, border: "1px solid #e5e7eb", boxShadow: "0 20px 60px rgba(0,0,0,0.18)", padding: 24, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div><div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>{editingTask.id_tarea}</div><h3 style={{ margin: 0, color: "#111827" }}>Editar tarea</h3></div>
              <button onClick={() => { setShowEditModal(false); setEditingTask(null); }} style={{ background: "transparent", border: "none", fontSize: 24, cursor: "pointer", color: "#6b7280" }}>×</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={{ gridColumn: "1 / -1" }}><label style={labelStyle}>Título</label><input type="text" value={editingTask.titulo || ""} onChange={(e) => setEditingTask({ ...editingTask, titulo: e.target.value })} style={inputStyle} /></div>
              <div style={{ gridColumn: "1 / -1" }}><label style={labelStyle}>Descripción</label><textarea value={editingTask.descripcion || ""} onChange={(e) => setEditingTask({ ...editingTask, descripcion: e.target.value })} style={{ ...inputStyle, minHeight: 80, resize: "vertical", fontFamily: "inherit" }} /></div>
              {/* [NUEVO Paso 4] Gestión owners en modal edición */}
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Owners de la tarea</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8, minHeight: 32 }}>
                  {(editingTask.owners_ids || []).length === 0
                    ? <span style={{ fontSize: 13, color: "#9ca3af", fontStyle: "italic" }}>Sin owners asignados</span>
                    : (editingTask.owners_ids || []).map((uid, idx) => {
                        const nombre = (editingTask.owners_nombres || [])[idx] || uid;
                        return (<span key={uid} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#dbeafe", color: "#1d4ed8", border: "1px solid #bfdbfe", borderRadius: 999, padding: "3px 10px", fontSize: 13, fontWeight: 600 }}>
                          {nombre}
                          <button type="button" onClick={() => handleRemoveOwnerFromTask(uid)} style={{ background: "none", border: "none", cursor: "pointer", color: "#1d4ed8", fontSize: 16, lineHeight: 1, padding: 0 }}>×</button>
                        </span>);
                      })}
                </div>
                <select style={inputStyle} value="" onChange={(e) => handleAddOwnerToTask(e.target.value)}>
                  <option value="">— Añadir owner —</option>
                  {usuariosActivos.filter((u) => !(editingTask.owners_ids || []).includes(u.id)).map((u) => (<option key={u.id} value={u.id}>{u.nombre} ({u.email})</option>))}
                </select>
              </div>
              <div><label style={labelStyle}>Fase</label><select value={editingTask.estado_tarea || "No Iniciada"} onChange={(e) => setEditingTask({ ...editingTask, estado_tarea: e.target.value })} style={inputStyle}><option value="No Iniciada">No Iniciada</option><option value="Planificada">Planificada</option><option value="En curso">En curso</option><option value="Finalizada">Finalizada</option></select></div>
              <div><label style={labelStyle}>Estado</label><select value={editingTask.situacion || "En tiempo"} onChange={(e) => setEditingTask({ ...editingTask, situacion: e.target.value })} style={inputStyle}><option value="En tiempo">En tiempo</option><option value="Riesgo de retraso">Riesgo de retraso</option><option value="Retrasado">Retrasado</option></select></div>
              <div><label style={labelStyle}>Fecha inicio real</label><input type="date" value={editingTask.fecha_inicio_real || ""} onChange={(e) => setEditingTask({ ...editingTask, fecha_inicio_real: e.target.value })} style={inputStyle} /></div>
              <div><label style={labelStyle}>Fecha fin real</label><input type="date" value={editingTask.fecha_fin_real || ""} onChange={(e) => setEditingTask({ ...editingTask, fecha_fin_real: e.target.value })} style={inputStyle} /></div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24 }}>
              <button onClick={() => { setShowEditModal(false); setEditingTask(null); }} style={secondaryButtonStyle}>Cancelar</button>
              <button onClick={handleUpdateTask} style={primaryButtonStyle}>Guardar cambios</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal coste */}
      {showCostEditModal && editingCost && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, zIndex: 1000 }}>
          <div style={{ width: "100%", maxWidth: 620, background: "#ffffff", borderRadius: 16, border: "1px solid #e5e7eb", boxShadow: "0 20px 60px rgba(0,0,0,0.18)", padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div><div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>{editingCost.id_coste}</div><h3 style={{ margin: 0 }}>Editar coste</h3></div>
              <button onClick={() => setShowCostEditModal(false)} style={{ background: "transparent", border: "none", fontSize: 24, cursor: "pointer", color: "#6b7280" }}>×</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={{ gridColumn: "1 / -1" }}><label style={labelStyle}>Título</label><input type="text" value={editingCost.titulo || ""} onChange={(e) => setEditingCost({ ...editingCost, titulo: e.target.value })} style={inputStyle} /></div>
              <div><label style={labelStyle}>Tipo</label><select value={editingCost.tipo_coste || "OpEx"} onChange={(e) => setEditingCost({ ...editingCost, tipo_coste: e.target.value })} style={inputStyle}><option value="OpEx">OpEx</option><option value="CapEx">CapEx</option></select></div>
              <div><label style={labelStyle}>Importe (€)</label><input type="number" value={editingCost.importe ?? ""} onChange={(e) => setEditingCost({ ...editingCost, importe: e.target.value })} style={inputStyle} min="0" /></div>
              <div style={{ gridColumn: "1 / -1" }}><label style={labelStyle}>Descripción</label><textarea value={editingCost.descripcion || ""} onChange={(e) => setEditingCost({ ...editingCost, descripcion: e.target.value })} style={{ ...inputStyle, minHeight: 70, resize: "vertical", fontFamily: "inherit" }} /></div>
            </div>
            {costEditError && <div style={{ marginTop: 12, padding: 10, borderRadius: 8, background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", fontSize: 14 }}>{costEditError}</div>}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24 }}>
              <button onClick={() => setShowCostEditModal(false)} style={secondaryButtonStyle}>Cancelar</button>
              <button onClick={handleUpdateCost} disabled={savingCostEdit} style={primaryButtonStyle}>{savingCostEdit ? "Guardando..." : "Guardar cambios"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal impacto */}
      {showImpactEditModal && editingImpact && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, zIndex: 1000 }}>
          <div style={{ width: "100%", maxWidth: 620, background: "#ffffff", borderRadius: 16, border: "1px solid #e5e7eb", boxShadow: "0 20px 60px rgba(0,0,0,0.18)", padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div><div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>{editingImpact.id_impacto}</div><h3 style={{ margin: 0 }}>Editar impacto</h3></div>
              <button onClick={() => setShowImpactEditModal(false)} style={{ background: "transparent", border: "none", fontSize: 24, cursor: "pointer", color: "#6b7280" }}>×</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={{ gridColumn: "1 / -1" }}><label style={labelStyle}>Título</label><input type="text" value={editingImpact.titulo || ""} onChange={(e) => setEditingImpact({ ...editingImpact, titulo: e.target.value })} style={inputStyle} /></div>
              <div><label style={labelStyle}>Tipo</label><select value={editingImpact.tipo_impacto || "OpEx"} onChange={(e) => setEditingImpact({ ...editingImpact, tipo_impacto: e.target.value })} style={inputStyle}><option value="OpEx">OpEx</option><option value="Alquiler">Alquiler</option><option value="Personal">Personal</option><option value="Ingr./Margen">Ingr./Margen</option></select></div>
              <div><label style={labelStyle}>Importe (€)</label><input type="number" value={editingImpact.importe ?? ""} onChange={(e) => setEditingImpact({ ...editingImpact, importe: e.target.value })} style={inputStyle} min="0" /></div>
              <div style={{ gridColumn: "1 / -1" }}><label style={labelStyle}>Descripción</label><textarea value={editingImpact.descripcion || ""} onChange={(e) => setEditingImpact({ ...editingImpact, descripcion: e.target.value })} style={{ ...inputStyle, minHeight: 70, resize: "vertical", fontFamily: "inherit" }} /></div>
            </div>
            {impactEditError && <div style={{ marginTop: 12, padding: 10, borderRadius: 8, background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", fontSize: 14 }}>{impactEditError}</div>}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24 }}>
              <button onClick={() => setShowImpactEditModal(false)} style={secondaryButtonStyle}>Cancelar</button>
              <button onClick={handleUpdateImpact} disabled={savingImpactEdit} style={primaryButtonStyle}>{savingImpactEdit ? "Guardando..." : "Guardar cambios"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal riesgo */}
      {showRiskEditModal && editingRisk && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, zIndex: 1000 }}>
          <div style={{ width: "100%", maxWidth: 620, background: "#ffffff", borderRadius: 16, border: "1px solid #e5e7eb", boxShadow: "0 20px 60px rgba(0,0,0,0.18)", padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div><div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>{editingRisk.id_riesgo}</div><h3 style={{ margin: 0 }}>Editar riesgo</h3></div>
              <button onClick={() => setShowRiskEditModal(false)} style={{ background: "transparent", border: "none", fontSize: 24, cursor: "pointer", color: "#6b7280" }}>×</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div><label style={labelStyle}>Categoría</label><select value={editingRisk.categoria || "Riesgo de retraso"} onChange={(e) => setEditingRisk({ ...editingRisk, categoria: e.target.value })} style={inputStyle}><option value="Riesgo de retraso">Riesgo de retraso</option><option value="Desvío de coste">Desvío de coste</option><option value="Desvío de impacto">Desvío de impacto</option><option value="Dependencia externa">Dependencia externa</option><option value="Otros">Otros</option></select></div>
              <div style={{ gridColumn: "1 / -1" }}><label style={labelStyle}>Descripción</label><textarea value={editingRisk.descripcion || ""} onChange={(e) => setEditingRisk({ ...editingRisk, descripcion: e.target.value })} maxLength={512} style={{ ...inputStyle, minHeight: 80, resize: "vertical", fontFamily: "inherit" }} /></div>
              <div style={{ gridColumn: "1 / -1" }}><label style={labelStyle}>Plan de mitigación</label><textarea value={editingRisk.plan_mitigacion || ""} onChange={(e) => setEditingRisk({ ...editingRisk, plan_mitigacion: e.target.value })} maxLength={512} style={{ ...inputStyle, minHeight: 80, resize: "vertical", fontFamily: "inherit" }} /></div>
            </div>
            {riskEditError && <div style={{ marginTop: 12, padding: 10, borderRadius: 8, background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", fontSize: 14 }}>{riskEditError}</div>}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24 }}>
              <button onClick={() => setShowRiskEditModal(false)} style={secondaryButtonStyle}>Cancelar</button>
              <button onClick={handleUpdateRisk} disabled={savingRiskEdit} style={primaryButtonStyle}>{savingRiskEdit ? "Guardando..." : "Guardar cambios"}</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
