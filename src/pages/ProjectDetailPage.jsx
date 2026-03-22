import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Settings, Trash } from "lucide-react";
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

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("es-ES").format(date);
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

function getProjectPhaseBadgeStyle(fase) {
  switch (fase) {
    case "En Definición":
      return {
        background: "#f1f5f9",
        color: "#334155",
        border: "1px solid #cbd5e1",
      };
    case "En Planificación":
      return {
        background: "#ede9fe",
        color: "#6d28d9",
        border: "1px solid #ddd6fe",
      };
    case "En Curso":
      return {
        background: "#dbeafe",
        color: "#1d4ed8",
        border: "1px solid #bfdbfe",
      };
    case "Finalizado":
      return {
        background: "#dcfce7",
        color: "#166534",
        border: "1px solid #bbf7d0",
      };
    default:
      return {
        background: "#f8fafc",
        color: "#334155",
        border: "1px solid #e2e8f0",
      };
  }
}

function getTaskStatusBadgeStyle(estado) {
  switch (normalizeSituation(estado)) {
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

function getProjectStatusBadgeStyle(estado) {
  switch (normalizeSituation(estado)) {
    case "En tiempo":
      return {
        background: "#dcfce7",
        color: "#166534",
        border: "1px solid #bbf7d0",
      };
    case "Riesgo de retraso":
      return {
        background: "#fef3c7",
        color: "#92400e",
        border: "1px solid #fde68a",
      };
    case "Retrasado":
      return {
        background: "#fee2e2",
        color: "#991b1b",
        border: "1px solid #fecaca",
      };
    default:
      return {
        background: "#e5e7eb",
        color: "#374151",
        border: "1px solid #d1d5db",
      };
  }
}

function buildTaskTimeline(tasks, project) {
  const today = new Date();
  const currentYear = today.getFullYear();
  const fixedStart = new Date(currentYear, 0, 1);
  const fixedEnd = new Date(currentYear, 11, 31);

  const taskStarts = tasks
    .flatMap((t) => [parseDate(t.fecha_inicio), parseDate(t.fecha_inicio_real)])
    .filter(Boolean);

  const taskEnds = tasks
    .flatMap((t) => {
      const realStart = parseDate(t.fecha_inicio_real);
      const realEnd = parseDate(t.fecha_fin_real);
      const actualVisibleEnd = realEnd || (realStart ? today : null);

      return [parseDate(t.fecha_fin), actualVisibleEnd];
    })
    .filter(Boolean);

  const projectStart = parseDate(project?.fecha_inicio);
  const projectEnd = parseDate(project?.fecha_fin);

  const allStarts = [...taskStarts, ...(projectStart ? [projectStart] : [])];
  const allEnds = [...taskEnds, ...(projectEnd ? [projectEnd] : [])];

  const minStart = allStarts.length
    ? new Date(Math.min(...allStarts.map((d) => d.getTime())))
    : fixedStart;
  const maxEnd = allEnds.length
    ? new Date(Math.max(...allEnds.map((d) => d.getTime())))
    : fixedEnd;

  const rawStart = minStart < fixedStart ? minStart : fixedStart;
  const rawEnd = maxEnd > fixedEnd ? maxEnd : fixedEnd;

  const start = startOfMonth(rawStart);
  const end = endOfMonth(rawEnd);
  const totalDays = Math.max(1, diffDays(start, end) + 1);

  const months = [];
  let cursor = new Date(start.getFullYear(), start.getMonth(), 1);

  while (cursor <= end) {
    const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);

    months.push({
      key: `${cursor.getFullYear()}-${cursor.getMonth()}`,
      label:
        cursor
          .toLocaleDateString("es-ES", { month: "short" })
          .replace(".", "") +
        "'" +
        String(cursor.getFullYear()).slice(-2),
      leftPct: (diffDays(start, monthStart) / totalDays) * 100,
      widthPct: ((diffDays(monthStart, monthEnd) + 1) / totalDays) * 100,
    });

    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  }

  const weekStart = addDays(today, -((today.getDay() + 6) % 7));
  const currentLinePct =
    today < start ? 0 : today > end ? 100 : (diffDays(start, today) / totalDays) * 100;

  return { start, end, totalDays, months, currentLinePct };
}

function TaskGanttChart({ tasks, project }) {
  const timeline = useMemo(() => buildTaskTimeline(tasks, project), [tasks, project]);

  const getBarLabel = (estado) => {
    if (estado === "No Iniciada") return "NI";
    if (estado === "Planificada") return "PL";
    if (estado === "En curso") return "EC";
    if (estado === "Finalizada") return "FI";
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
          <div style={styles.legendItem}>
            <span style={{ ...styles.legendSwatch, background: "#dbeafe", border: "1px solid #93c5fd" }} />
            <span>Barra tarea</span>
          </div>
          <div style={styles.legendItem}>
            <span style={{ ...styles.legendLine, background: "#0f172a" }} />
            <span>Hoy</span>
          </div>
          <div style={styles.legendItem}>
            <span style={{ ...styles.trafficDot, background: getSituationColor("En tiempo") }} />
            <span>En tiempo</span>
          </div>
          <div style={styles.legendItem}>
            <span style={{ ...styles.trafficDot, background: getSituationColor("Riesgo de retraso") }} />
            <span>Riesgo de retraso</span>
          </div>
          <div style={styles.legendItem}>
            <span style={{ ...styles.trafficDot, background: getSituationColor("Retrasado") }} />
            <span>Retrasado</span>
          </div>
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
                  <div
                    key={month.key}
                    style={{
                      ...styles.monthHeader,
                      left: `${month.leftPct}%`,
                      width: `${month.widthPct}%`,
                    }}
                  >
                    {month.label}
                  </div>
                ))}
                <div
                  style={{
                    ...styles.currentWeekLine,
                    left: `${timeline.currentLinePct}%`,
                  }}
                />
                <div
                  style={{
                    ...styles.currentWeekTag,
                    left: `min(${Math.max(timeline.currentLinePct, 1)}%, calc(100% - 50px))`,
                  }}
                >
                  Hoy
                </div>
              </div>
              <div style={styles.ganttStatusHeader}>Estado</div>
            </div>

            {tasks.map((task) => {
              const start = parseDate(task.fecha_inicio);
              const end = parseDate(task.fecha_fin);

              const realStart = parseDate(task.fecha_inicio_real);
              const realEnd = parseDate(task.fecha_fin_real);
              const visibleRealEnd = realEnd || (realStart ? new Date() : null);

              const trafficLabel = normalizeSituation(task.situacion);

              let leftPct = 0;
              let widthPct = 0;

              let realLeftPct = 0;
              let realWidthPct = 0;

              if (start && end) {
                const boundedStart = start < timeline.start ? timeline.start : start;
                const boundedEnd = end > timeline.end ? timeline.end : end;
                leftPct = (diffDays(timeline.start, boundedStart) / timeline.totalDays) * 100;
                widthPct = ((diffDays(boundedStart, boundedEnd) + 1) / timeline.totalDays) * 100;
              }

              if (realStart && visibleRealEnd) {
                const boundedRealStart = realStart < timeline.start ? timeline.start : realStart;
                const boundedRealEnd = visibleRealEnd > timeline.end ? timeline.end : visibleRealEnd;
                realLeftPct = (diffDays(timeline.start, boundedRealStart) / timeline.totalDays) * 100;
                realWidthPct = ((diffDays(boundedRealStart, boundedRealEnd) + 1) / timeline.totalDays) * 100;
              }

              return (
                <div key={task.id_tarea} style={styles.ganttRow}>
                  <div style={styles.ganttProjectCell}>
                    <div style={styles.ganttProjectTitle}>{task.titulo || "-"}</div>
                    <div style={styles.ganttProjectMeta}>
                      {(task.owner || "Sin owner") + " · " + formatDate(task.fecha_inicio) + " — " + formatDate(task.fecha_fin)}
                    </div>
                  </div>

                  <div style={styles.ganttTimelineCell}>
                    {timeline.months.map((month) => (
                      <div
                        key={`${task.id_tarea}-${month.key}`}
                        style={{
                          ...styles.monthBand,
                          left: `${month.leftPct}%`,
                          width: `${month.widthPct}%`,
                        }}
                      />
                    ))}

                    <div
                      style={{
                        ...styles.currentWeekLine,
                        left: `${timeline.currentLinePct}%`,
                      }}
                    />

                    {start && end ? (
                      <>
                        <div
                          style={{
                            ...styles.ganttBar,
                            left: `${Math.max(0, leftPct)}%`,
                            width: `${Math.max(widthPct, 1.4)}%`,
                          }}
                          title={`${task.titulo} · Plan: ${formatDate(task.fecha_inicio)} → ${formatDate(task.fecha_fin)}`}
                        >
                          <span style={styles.ganttBarLabel}>{getBarLabel(task.estado_tarea)}</span>
                        </div>

                        {realStart && visibleRealEnd && (
                          <div
                            style={{
                              ...styles.ganttBarReal,
                              left: `${Math.max(0, realLeftPct)}%`,
                              width: `${Math.max(realWidthPct, 1.2)}%`,
                              background: getSituationColor(task.situacion),
                            }}
                            title={`${task.titulo} · Real: ${formatDate(task.fecha_inicio_real)} → ${task.fecha_fin_real ? formatDate(task.fecha_fin_real) : "Hoy"}`}
                          />
                        )}
                      </>
                    ) : (
                      <div style={styles.ganttNoDates}>Sin fechas</div>
                    )}
                  </div>

                  <div style={styles.ganttStatusCell} title={trafficLabel}>
                    <span
                      style={{
                        ...styles.trafficDotLarge,
                        background: getSituationColor(task.situacion),
                      }}
                    />
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
  width: "120px",
  maxWidth: "120px",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  fontWeight: 700,
  color: "#0f172a",
};

const tdDateStyle = {
  ...tdStyle,
  width: "95px",
  whiteSpace: "nowrap",
};

const tdBadgeStyle = {
  ...tdStyle,
  width: "125px",
  whiteSpace: "nowrap",
};

const tdDelayStyle = {
  ...tdStyle,
  width: "75px",
  whiteSpace: "nowrap",
};

const tdActionsStyle = {
  ...tdStyle,
  width: "100px",
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

const styles = {
  page: {
    minHeight: "100vh",
    padding: "14px 8px 24px",
    background: "linear-gradient(180deg, #f8fbff 0%, #f4f7fb 38%, #eef4f8 100%)",
    boxSizing: "border-box",
  },
  container: {
    maxWidth: 1800,
    width: "100%",
    margin: "0 auto",
    display: "grid",
    gap: 14,
  },
  summaryCard: {
    width: "100%",
    margin: "0 auto",
    boxSizing: "border-box",
    background: "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(246,250,255,0.98) 100%)",
    border: "1px solid #dbe4ee",
    borderRadius: 20,
    padding: 20,
    boxShadow: "0 10px 22px rgba(15, 23, 42, 0.06)",
  },
  tableTitle: {
    margin: 0,
    fontSize: 22,
    color: "#0f172a",
  },
  tableSubtitle: {
    margin: "4px 0 0 0",
    fontSize: 13,
    color: "#64748b",
  },
  ganttCard: {
    width: "100%",
    margin: "0 auto",
    boxSizing: "border-box",
    background: "rgba(255,255,255,0.92)",
    border: "1px solid #dbe4ee",
    borderRadius: 20,
    padding: 18,
    boxShadow: "0 14px 36px rgba(15, 23, 42, 0.08)",
    backdropFilter: "blur(8px)",
  },
  ganttHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    marginBottom: 16,
    flexWrap: "wrap",
  },
  ganttLegend: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  legendItem: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontSize: 12,
    color: "#64748b",
    whiteSpace: "nowrap",
  },
  legendSwatch: {
    width: 18,
    height: 10,
    borderRadius: 999,
    display: "inline-block",
  },
  legendLine: {
    width: 18,
    height: 2,
    borderRadius: 999,
    display: "inline-block",
  },
  ganttScroll: {
    width: "100%",
    overflowX: "auto",
  },
  ganttBoard: {
    minWidth: 1220,
    margin: "0 auto",
    border: "1px solid #e2e8f0",
    borderRadius: 16,
    overflow: "hidden",
    background: "#ffffff",
  },
  ganttTopRow: {
    display: "grid",
    gridTemplateColumns: "280px 1fr 72px",
    borderBottom: "1px solid #e2e8f0",
    background: "#f8fafc",
  },
  ganttProjectHeader: {
    padding: "10px 12px",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    color: "#475569",
    borderRight: "1px solid #e2e8f0",
  },
  ganttTimelineHeader: {
    position: "relative",
    height: 54,
    borderRight: "1px solid #e2e8f0",
  },
  ganttStatusHeader: {
    padding: "10px 12px",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    color: "#475569",
    textAlign: "center",
  },
  monthHeader: {
    position: "absolute",
    top: 0,
    bottom: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRight: "1px solid #e2e8f0",
    fontSize: 11,
    fontWeight: 700,
    color: "#64748b",
    textTransform: "capitalize",
    background: "rgba(248,250,252,0.65)",
  },
  monthBand: {
    position: "absolute",
    top: 0,
    bottom: 0,
    borderRight: "1px solid #f1f5f9",
    background: "linear-gradient(180deg, rgba(248,250,252,0.55) 0%, rgba(255,255,255,0.35) 100%)",
  },
  currentWeekLine: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 2,
    marginLeft: -1,
    background: "#0f172a",
    opacity: 0.8,
    zIndex: 4,
  },
  currentWeekTag: {
    position: "absolute",
    top: 6,
    transform: "translateX(-50%)",
    padding: "4px 8px",
    borderRadius: 999,
    background: "#0f172a",
    color: "#ffffff",
    fontSize: 10,
    fontWeight: 700,
    whiteSpace: "nowrap",
    zIndex: 5,
  },
  ganttRow: {
    display: "grid",
    gridTemplateColumns: "280px 1fr 72px",
    minHeight: 52,
    borderBottom: "1px solid #edf2f7",
  },
  ganttProjectCell: {
    padding: "10px 14px",
    borderRight: "1px solid #edf2f7",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    gap: 4,
  },
  ganttProjectTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: "#0f172a",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  ganttProjectMeta: {
    fontSize: 11,
    color: "#64748b",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  ganttTimelineCell: {
    position: "relative",
    minHeight: 52,
    borderRight: "1px solid #edf2f7",
    overflow: "hidden",
  },
  ganttBar: {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    height: 16,
    borderRadius: 999,
    background: "linear-gradient(135deg, #93c5fd 0%, #3b82f6 100%)",
    boxShadow: "0 5px 12px rgba(59,130,246,0.24)",
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingRight: 6,
    zIndex: 3,
  },
  ganttBarReal: {
    position: "absolute",
    top: "calc(50% + 10px)",
    height: 4,
    borderRadius: 999,
    boxShadow: "0 1px 4px rgba(15,23,42,0.18)",
    zIndex: 2,
  },
  ganttBarLabel: {
    fontSize: 10,
    fontWeight: 700,
    color: "#ffffff",
    letterSpacing: "0.02em",
  },
  ganttNoDates: {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    color: "#94a3b8",
    zIndex: 2,
  },
  ganttStatusCell: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  trafficDot: {
    width: 10,
    height: 10,
    borderRadius: "50%",
    display: "inline-block",
    boxShadow: "0 0 0 3px rgba(15,23,42,0.04)",
  },
  trafficDotLarge: {
    width: 14,
    height: 14,
    borderRadius: "50%",
    display: "inline-block",
    boxShadow: "0 0 0 4px rgba(15,23,42,0.05)",
  },
  emptyGantt: {
    padding: 24,
    textAlign: "center",
    color: "#64748b",
    border: "1px dashed #cbd5e1",
    borderRadius: 14,
    background: "#f8fafc",
  },
};

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
      .from("v_proyectos_universo_detalle")
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
        avance_pct,
        nombre_universo
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
        fecha_fin,
        fecha_inicio_real,
        fecha_fin_real
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
        fecha_inicio_real: editingTask.fecha_inicio_real || null,
        fecha_fin_real: editingTask.fecha_fin_real || null,
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
      const { error } = await supabase.from("tareas").delete().eq("id_tarea", idTarea);

      if (error) {
        throw error;
      }

      await loadAll();
    } catch (err) {
      console.error("Error al eliminar tarea:", err);
      alert(err.message || "Error al eliminar la tarea");
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

  const nombreUniverso = proyecto.nombre_universo || "-";

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <section style={styles.summaryCard}>
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

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <span style={{ ...badgeStyle, background: "#f8fafc", color: "#334155", border: "1px solid #e2e8f0" }}>
                Universo: {proyecto?.nombre_universo || "-"}
              </span>

              <span style={{ ...badgeStyle, background: "#f8fafc", color: "#334155", border: "1px solid #e2e8f0" }}>
                Owner: {proyecto?.owner || "-"}
              </span>

              <span
                style={{
                  ...badgeStyle,
                  ...getProjectPhaseBadgeStyle(proyecto?.fase),
                }}
              >
                Fase: {proyecto?.fase || "-"}
              </span>

              <span
                style={{
                  ...badgeStyle,
                  ...getProjectStatusBadgeStyle(proyecto?.situacion),
                }}
              >
                Estado: {normalizeSituation(proyecto?.situacion)}
              </span>

              <span style={{ ...badgeStyle, background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" }}>
                Avance: {proyecto.avance_pct ?? 0}%
              </span>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "12px",
              marginTop: 16,
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
              marginTop: 16,
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

        <TaskGanttChart tasks={tareas} project={proyecto} />

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
                    maxLength={512}
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
                  <label style={labelStyle}>Fase</label>
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
                  <label style={labelStyle}>Estado</label>
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

                <button type="submit" style={primaryButtonStyle} disabled={savingTask}>
                  {savingTask ? "Guardando..." : "Guardar tarea"}
                </button>
              </div>
            </form>
          )}

          {/*  ===== HEADER DE LA TABLA DE TAREAS ===== */}

          {tareas.length === 0 ? (
            <p style={{ marginBottom: 0, color: "#6b7280" }}>Este proyecto todavía no tiene tareas.</p>
          ) : (
            <div style={tableWrapperStyle}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={{ ...thStyle, width: "180px" }}>Título</th>
                    <th style={{ ...thStyle, width: "320px" }}>Descripción</th>
                    <th style={{ ...thStyle, width: "120px" }}>Owner</th>
                    <th style={{ ...thStyle, width: "95px" }}>Inicio</th>
                    <th style={{ ...thStyle, width: "95px" }}>Fin</th>
                    <th style={{ ...thStyle, width: "95px" }}>Fin real</th>
                    <th style={{ ...thStyle, width: "125px" }}>Fase</th>
                    <th style={{ ...thStyle, width: "125px" }}>Estado</th>
                    <th style={{ ...thStyle, width: "75px" }}>Retraso</th>
                    <th style={{ ...thStyle, width: "100px" }}>Acciones</th>
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
                      <td style={tdDateStyle}>{formatDate(tarea.fecha_fin_real)}</td>
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
                            ...getSituationBadgeStyle(tarea.situacion),
                          }}
                        >
                          {normalizeSituation(tarea.situacion)}
                        </span>
                      </td>
                      <td style={tdDelayStyle}>{formatTaskDelay(tarea.fecha_fin, tarea.situacion)}</td>
                      <td style={tdActionsStyle}>
                        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingTask({
                                ...tarea,
                                fecha_inicio_real: tarea.fecha_inicio_real || "",
                                fecha_fin_real: tarea.fecha_fin_real || "",
                              });
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
              <p style={tableSubtitleStyle}>Tabla con el mismo lenguaje visual que en UniverseDetailPage.</p>
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

                <button type="submit" style={primaryButtonStyle} disabled={savingCost}>
                  {savingCost ? "Guardando..." : "Guardar coste"}
                </button>
              </div>
            </form>
          )}

          {costes.length === 0 ? (
            <p style={{ marginBottom: 0, color: "#6b7280" }}>Este proyecto todavía no tiene costes.</p>
          ) : (
            <div style={tableWrapperStyle}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={{ ...thStyle, width: "100px" }}>Id Coste</th>
                    <th style={{ ...thStyle, width: "180px" }}>Título</th>
                    <th style={{ ...thStyle, width: "500px" }}>Descripción</th>
                    <th style={{ ...thStyle, width: "100px" }}>Tipo</th>
                    <th style={{ ...thStyle, width: "100px" }}>Importe</th>
                  </tr>
                </thead>
                <tbody>
                  {costes.map((coste) => (
                    <tr key={coste.id_coste}>
                      <td style={{ ...tdStyle, width: "100px", whiteSpace: "nowrap" }}>{coste.id_coste}</td>
                      <td
                        style={{
                          ...tdStyle,
                          width: "180px",
                          maxWidth: "180px",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          fontWeight: 700,
                          color: "#0f172a",
                        }}
                        title={coste.titulo || ""}
                      >
                        {coste.titulo || "-"}
                      </td>
                      <td
                        style={{
                          ...tdStyle,
                          width: "500px",
                          maxWidth: "500px",
                          whiteSpace: "normal",
                          wordBreak: "break-word",
                          overflowWrap: "anywhere",
                        }}
                      >
                        {coste.descripcion || "-"}
                      </td>
                      <td
                        style={{
                          ...tdStyle,
                          width: "100px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {coste.tipo_coste || "-"}
                      </td>
                      <td
                        style={{
                          ...tdStyle,
                          width: "100px",
                          whiteSpace: "nowrap",
                          textAlign: "right",
                          fontWeight: 600,
                        }}
                      >
                        {formatCurrency(coste.importe)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

{/* ===== MODAL EDICIÓN TAREA ===== */}

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
                    onChange={(e) => setEditingTask({ ...editingTask, titulo: e.target.value })}
                    maxLength={32}
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
                    onChange={(e) => setEditingTask({ ...editingTask, descripcion: e.target.value })}
                    maxLength={512}
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
                    onChange={(e) => setEditingTask({ ...editingTask, owner: e.target.value })}
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
                    Fase
                  </label>
                  <select
                    value={editingTask.estado_tarea || "No Iniciada"}
                    onChange={(e) => setEditingTask({ ...editingTask, estado_tarea: e.target.value })}
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
                    Estado
                  </label>
                  <select
                    value={editingTask.situacion || "En tiempo"}
                    onChange={(e) => setEditingTask({ ...editingTask, situacion: e.target.value })}
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
                    Fecha inicio real
                  </label>
                  <input
                    type="date"
                    value={editingTask.fecha_inicio_real || ""}
                    onChange={(e) => setEditingTask({ ...editingTask, fecha_inicio_real: e.target.value })}
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
                    Fecha fin real
                  </label>
                  <input
                    type="date"
                    value={editingTask.fecha_fin_real || ""}
                    onChange={(e) => setEditingTask({ ...editingTask, fecha_fin_real: e.target.value })}
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
    </div>
  );
}
