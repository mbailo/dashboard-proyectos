import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../supabase";

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("es-ES").format(date);
}

function formatCurrency(value) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
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

function getHorizonBadgeStyle(horizonte) {
  if (horizonte === "Quick-Win") {
    return {
      background: "#dcfce7",
      color: "#166534",
      border: "1px solid #bbf7d0",
    };
  }

  return {
    background: "#e0e7ff",
    color: "#3730a3",
    border: "1px solid #c7d2fe",
  };
}

function getPhaseBadgeStyle(fase) {
  switch (fase) {
    case "Identificación":
      return {
        background: "#f1f5f9",
        color: "#334155",
        border: "1px solid #cbd5e1",
      };
    case "Análisis":
      return {
        background: "#ede9fe",
        color: "#6d28d9",
        border: "1px solid #ddd6fe",
      };
    case "Implementación":
      return {
        background: "#dbeafe",
        color: "#1d4ed8",
        border: "1px solid #bfdbfe",
      };
    case "Cerrado":
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

function getTrafficLight(project) {
  const normalized = normalizeSituation(project?.situacion);
  return {
    color: getSituationColor(normalized),
    label: normalized,
  };
}

function buildTimeline(projects) {
  const fixedStart = new Date(2026, 0, 1);
  const fixedEnd = new Date(2026, 11, 31);

  const validStarts = projects.map((p) => parseDate(p.fecha_inicio)).filter(Boolean);
  const validEnds = projects.map((p) => parseDate(p.fecha_fin)).filter(Boolean);

  const minProjectStart = validStarts.length
    ? new Date(Math.min(...validStarts.map((d) => d.getTime())))
    : fixedStart;

  const maxProjectEnd = validEnds.length
    ? new Date(Math.max(...validEnds.map((d) => d.getTime())))
    : fixedEnd;

  const rawStart = minProjectStart < fixedStart ? minProjectStart : fixedStart;
  const rawEnd = maxProjectEnd > fixedEnd ? maxProjectEnd : fixedEnd;

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
      label: cursor.toLocaleDateString("es-ES", {
        month: "short",
      }).replace('.', '') + "'" + String(cursor.getFullYear()).slice(-2),
      leftPct: (diffDays(start, monthStart) / totalDays) * 100,
      widthPct: ((diffDays(monthStart, monthEnd) + 1) / totalDays) * 100,
    });

    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  }

  const today = new Date();
  const weekStart = addDays(today, -((today.getDay() + 6) % 7));
  const currentLinePct =
    today < start ? 0 : today > end ? 100 : (diffDays(start, weekStart) / totalDays) * 100;

  return { start, end, totalDays, months, currentLinePct, today };
}

function GanttChart({ projects }) {
  const timeline = useMemo(() => buildTimeline(projects), [projects]);

  return (
    <section style={styles.ganttCard}>
      <div style={styles.ganttHeader}>
        <div>
          <h2 style={styles.tableTitle}>Cronograma global del universo</h2>
          <p style={styles.tableSubtitle}>
            Vista sencilla de proyectos. El cronograma cubre como mínimo todo 2026 y marca la semana actual.
          </p>
        </div>

        <div style={styles.ganttLegend}>
          <div style={styles.legendItem}>
            <span style={{ ...styles.legendSwatch, background: "#dbeafe", border: "1px solid #93c5fd" }} />
            <span>Barra proyecto</span>
          </div>
          <div style={styles.legendItem}>
            <span style={{ ...styles.legendLine, background: "#0f172a" }} />
            <span>Semana actual</span>
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

      {projects.length === 0 ? (
        <div style={styles.emptyGantt}>No hay proyectos para mostrar en el cronograma.</div>
      ) : (
        <div style={styles.ganttScroll}>
          <div style={styles.ganttBoard}>
            <div style={styles.ganttTopRow}>
              <div style={styles.ganttProjectHeader}>Proyecto</div>
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
                    left: `min(${Math.max(timeline.currentLinePct, 1)}%, calc(100% - 84px))`,
                  }}
                >
                  Semana actual
                </div>
              </div>
              <div style={styles.ganttStatusHeader}>Estado</div>
            </div>

            {projects.map((project) => {
              const start = parseDate(project.fecha_inicio);
              const end = parseDate(project.fecha_fin);
              const traffic = getTrafficLight(project);

              let leftPct = 0;
              let widthPct = 0;

              if (start && end) {
                const boundedStart = start < timeline.start ? timeline.start : start;
                const boundedEnd = end > timeline.end ? timeline.end : end;
                leftPct = (diffDays(timeline.start, boundedStart) / timeline.totalDays) * 100;
                widthPct = ((diffDays(boundedStart, boundedEnd) + 1) / timeline.totalDays) * 100;
              }

              return (
                <div key={project.id_proyecto} style={styles.ganttRow}>
                  <div style={styles.ganttProjectCell}>
                    <div style={styles.ganttProjectTitle}>{project.titulo || "—"}</div>
                    <div style={styles.ganttProjectMeta}>
                      {project.horizonte || "—"} · {formatDate(project.fecha_inicio)} — {formatDate(project.fecha_fin)}
                    </div>
                  </div>

                  <div style={styles.ganttTimelineCell}>
                    {timeline.months.map((month) => (
                      <div
                        key={`${project.id_proyecto}-${month.key}`}
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
                      <div
                        style={{
                          ...styles.ganttBar,
                          left: `${Math.max(0, leftPct)}%`,
                          width: `${Math.max(widthPct, 1.4)}%`,
                        }}
                        title={`${project.titulo} · ${formatDate(project.fecha_inicio)} → ${formatDate(project.fecha_fin)}`}
                      >
                        <span style={styles.ganttBarLabel}>{project.horizonte === "Quick-Win" ? "QW" : "MT"}</span>
                      </div>
                    ) : (
                      <div style={styles.ganttNoDates}>Sin fechas</div>
                    )}
                  </div>

                  <div style={styles.ganttStatusCell} title={traffic.label}>
                    <span style={{ ...styles.trafficDotLarge, background: traffic.color }} />
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

function KpiCard({ label, value, accent }) {
  return (
    <div
      style={{
        ...styles.kpiCard,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.75), 0 6px 16px ${accent}`,
      }}
    >
      <div style={styles.kpiLabel}>{label}</div>
      <div style={styles.kpiValue}>{value}</div>
    </div>
  );
}

function ProgressCell({ avance }) {
  const pct = Number(avance || 0);
  return <span style={styles.progressText}>{pct}%</span>;
}

export default function UniverseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [kpis, setKpis] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadUniverseDetail() {
      setLoading(true);
      setError("");

      const universeId = Number(id);

      const [
        { data: kpiData, error: kpiError },
        { data: projectData, error: projectError },
      ] = await Promise.all([
        supabase
          .from("v_kpis_universo")
          .select("*")
          .eq("id_universo", universeId)
          .single(),

        supabase
          .from("v_proyectos_universo_detalle")
          .select(`
            id_proyecto,
            id_universo,
            titulo,
            owner,
            horizonte,
            fecha_inicio,
            fecha_fin,
            fase,
            situacion,
            avance_pct,
            impacto_estimado,
            inversion_estimada
          `)
          .eq("id_universo", universeId)
          .order("orden_horizonte", { ascending: true })
          .order("fecha_inicio", { ascending: true })
          .order("fecha_fin", { ascending: true }),
      ]);

      if (kpiError) {
        setError(kpiError.message);
        setLoading(false);
        return;
      }

      if (projectError) {
        setError(projectError.message);
        setLoading(false);
        return;
      }

      setKpis(kpiData);
      setProjects(projectData || []);
      setLoading(false);
    }

    loadUniverseDetail();
  }, [id]);

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.infoCard}>Cargando detalle del universo...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.infoCard}>
            <h2 style={styles.infoTitle}>Error al cargar el universo</h2>
            <p style={styles.infoText}>{error}</p>
            <button style={styles.secondaryButton} onClick={() => navigate(-1)}>
              Volver
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!kpis) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.infoCard}>
            <h2 style={styles.infoTitle}>Universo no encontrado</h2>
            <p style={styles.infoText}>No se ha encontrado información para este universo.</p>
            <button style={styles.secondaryButton} onClick={() => navigate(-1)}>
              Volver
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <section style={styles.summaryCard}>
          <div style={styles.summaryHeader}>
            <button style={styles.backButton} onClick={() => navigate(-1)}>
              ← Volver
            </button>

            <div style={styles.titleBlock}>
              <h1 style={styles.title}>{kpis.nombre_universo}</h1>
              <p style={styles.description}>
                {kpis.descripcion_universo || "Sin descripción informada."}
              </p>
            </div>
          </div>

          <div style={styles.kpiGrid}>
            <KpiCard
              label="Nº de proyectos"
              value={kpis.num_proyectos ?? 0}
              accent="rgba(59, 130, 246, 0.08)"
            />
            <KpiCard
              label="Total de tareas"
              value={kpis.total_tareas ?? 0}
              accent="rgba(14, 165, 233, 0.08)"
            />
            <KpiCard
              label="Tareas finalizadas"
              value={kpis.tareas_finalizadas ?? 0}
              accent="rgba(34, 197, 94, 0.08)"
            />
            <KpiCard
              label="Avance (%)"
              value={`${kpis.avance_pct ?? 0}%`}
              accent="rgba(16, 185, 129, 0.08)"
            />
            <KpiCard
              label="Estimación impacto total"
              value={formatCurrency(kpis.impacto_total_estimado)}
              accent="rgba(99, 102, 241, 0.08)"
            />
            <KpiCard
              label="Estimación coste / inversión total"
              value={formatCurrency(kpis.inversion_total_estimada)}
              accent="rgba(244, 114, 182, 0.08)"
            />
            <KpiCard
              label="Estimación impacto proyectos QW"
              value={formatCurrency(kpis.impacto_qw_estimado)}
              accent="rgba(250, 204, 21, 0.10)"
            />
            <KpiCard
              label="Estimación coste / inversión proyectos QW"
              value={formatCurrency(kpis.inversion_qw_estimada)}
              accent="rgba(249, 115, 22, 0.08)"
            />
          </div>
        </section>

        <GanttChart projects={projects} />

        <section style={styles.tableCard}>
          <div style={styles.tableHeader}>
            <div>
              <h2 style={styles.tableTitle}>Proyectos del universo</h2>
              <p style={styles.tableSubtitle}>
                Ordenados por horizonte, fecha de inicio y fecha de fin.
              </p>
            </div>
          </div>

          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Título</th>
                  <th style={styles.th}>Owner</th>
                  <th style={styles.th}>Horizonte</th>
                  <th style={styles.th}>Fecha inicio</th>
                  <th style={styles.th}>Fecha fin</th>
                  <th style={styles.th}>Fase</th>
                  <th style={styles.th}>Estado</th>
                  <th style={styles.th}>Avance</th>
                  <th style={{ ...styles.th, textAlign: "right" }}>Impacto estimado</th>
                  <th style={{ ...styles.th, textAlign: "right" }}>Inversión estimada</th>
                  <th style={{ ...styles.th, textAlign: "center" }}>Detalle</th>
                </tr>
              </thead>

              <tbody>
                {projects.length === 0 ? (
                  <tr>
                    <td colSpan={11} style={styles.emptyCell}>
                      No hay proyectos informados para este universo.
                    </td>
                  </tr>
                ) : (
                  projects.map((project) => (
                    <tr
                      key={project.id_proyecto}
                      style={styles.row}
                      onClick={() => navigate(`/proyectos/${project.id_proyecto}`)}
                    >
                      <td style={styles.tdStrong}>{project.titulo || "—"}</td>
                      <td style={styles.td}>{project.owner || "—"}</td>
                      <td style={styles.td}>
                        <span
                          style={{
                            ...styles.badge,
                            ...getHorizonBadgeStyle(project.horizonte),
                          }}
                        >
                          {project.horizonte || "—"}
                        </span>
                      </td>
                      <td style={styles.td}>{formatDate(project.fecha_inicio)}</td>
                      <td style={styles.td}>{formatDate(project.fecha_fin)}</td>
                      <td style={styles.td}>
                        <span
                          style={{
                            ...styles.badge,
                            ...getPhaseBadgeStyle(project.fase),
                          }}
                        >
                          {project.fase || "—"}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <span
                          style={{
                            ...styles.badge,
                            ...getSituationBadgeStyle(project.situacion),
                          }}
                        >
                          {normalizeSituation(project.situacion)}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <ProgressCell avance={project.avance_pct} />
                      </td>
                      <td style={styles.tdNumber}>
                        {formatCurrency(project.impacto_estimado)}
                      </td>
                      <td style={styles.tdNumber}>
                        {formatCurrency(project.inversion_estimada)}
                      </td>
                      <td style={styles.tdCenter}>
                        <button
                          style={styles.primaryButton}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/proyectos/${project.id_proyecto}`);
                          }}
                        >
                          Ver detalle
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    padding: "18px 24px 24px",
    background: "linear-gradient(180deg, #f8fbff 0%, #f4f7fb 38%, #eef4f8 100%)",
    boxSizing: "border-box",
  },
  container: {
    maxWidth: 1440,
    margin: "0 auto",
    display: "grid",
    gap: 14,
  },
  summaryCard: {
    width: "100%",
    margin: "0 auto",
    background: "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(246,250,255,0.98) 100%)",
    border: "1px solid #dbe4ee",
    borderRadius: 20,
    padding: 12,
    boxShadow: "0 10px 22px rgba(15, 23, 42, 0.06)",
  },
  summaryHeader: {
    display: "grid",
    gridTemplateColumns: "auto 1fr",
    alignItems: "start",
    gap: 10,
    marginBottom: 10,
  },
  titleBlock: {
    minWidth: 0,
  },
  title: {
    margin: "0 0 4px 0",
    fontSize: 24,
    lineHeight: 1.05,
    color: "#0f172a",
  },
  description: {
    margin: 0,
    maxWidth: 980,
    fontSize: 13,
    lineHeight: 1.35,
    color: "#475569",
  },
  kpiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 8,
  },
  kpiCard: {
    minHeight: 68,
    borderRadius: 16,
    border: "1px solid #dbe4ee",
    background: "rgba(255,255,255,0.88)",
    padding: "10px 12px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    backdropFilter: "blur(8px)",
  },
  kpiLabel: {
    fontSize: 11,
    color: "#64748b",
    lineHeight: 1.25,
  },
  kpiValue: {
    fontSize: 19,
    lineHeight: 1.05,
    fontWeight: 700,
    color: "#0f172a",
  },
  ganttCard: {
    width: "100%",
    margin: "0 auto",
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
  tableCard: {
    width: "100%",
    margin: "0 auto",
    background: "rgba(255,255,255,0.92)",
    border: "1px solid #dbe4ee",
    borderRadius: 20,
    padding: 18,
    boxShadow: "0 14px 36px rgba(15, 23, 42, 0.08)",
    backdropFilter: "blur(8px)",
  },
  tableHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
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
  tableWrapper: {
    width: "100%",
    overflowX: "auto",
  },
  table: {
    width: "100%",
    minWidth: 1300,
    margin: "0 auto",
    borderCollapse: "separate",
    borderSpacing: 0,
  },
  th: {
    position: "sticky",
    top: 0,
    background: "#f8fafc",
    color: "#475569",
    fontSize: 12,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    padding: "14px 14px",
    textAlign: "left",
    borderBottom: "1px solid #dbe4ee",
    whiteSpace: "nowrap",
  },
  row: {
    cursor: "pointer",
  },
  td: {
    padding: "14px 14px",
    borderBottom: "1px solid #edf2f7",
    color: "#334155",
    fontSize: 14,
    whiteSpace: "nowrap",
    background: "rgba(255,255,255,0.78)",
  },
  tdStrong: {
    padding: "14px 14px",
    borderBottom: "1px solid #edf2f7",
    color: "#0f172a",
    fontSize: 14,
    fontWeight: 700,
    whiteSpace: "nowrap",
    background: "rgba(255,255,255,0.78)",
  },
  tdNumber: {
    padding: "14px 14px",
    borderBottom: "1px solid #edf2f7",
    color: "#0f172a",
    fontSize: 14,
    textAlign: "right",
    whiteSpace: "nowrap",
    fontVariantNumeric: "tabular-nums",
    background: "rgba(255,255,255,0.78)",
  },
  tdCenter: {
    padding: "14px 14px",
    borderBottom: "1px solid #edf2f7",
    textAlign: "center",
    whiteSpace: "nowrap",
    background: "rgba(255,255,255,0.78)",
  },
  emptyCell: {
    padding: 24,
    textAlign: "center",
    color: "#64748b",
    borderBottom: "1px solid #edf2f7",
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    padding: "6px 10px",
    fontSize: 12,
    fontWeight: 700,
    whiteSpace: "nowrap",
  },
  progressText: {
    fontSize: 12,
    color: "#334155",
    fontWeight: 700,
  },
  primaryButton: {
    border: "none",
    borderRadius: 10,
    padding: "8px 12px",
    background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
    color: "#ffffff",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
    boxShadow: "0 8px 18px rgba(37, 99, 235, 0.22)",
  },
  secondaryButton: {
    border: "1px solid #cbd5e1",
    borderRadius: 10,
    padding: "10px 14px",
    background: "#ffffff",
    color: "#0f172a",
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
  },
  backButton: {
    border: "none",
    background: "transparent",
    color: "#2563eb",
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
    padding: "2px 0 0 0",
    whiteSpace: "nowrap",
  },
  infoCard: {
    background: "rgba(255,255,255,0.94)",
    border: "1px solid #dbe4ee",
    borderRadius: 20,
    padding: 24,
    boxShadow: "0 14px 36px rgba(15, 23, 42, 0.08)",
  },
  infoTitle: {
    margin: "0 0 8px 0",
    fontSize: 22,
    color: "#0f172a",
  },
  infoText: {
    margin: "0 0 16px 0",
    color: "#475569",
  },
};
