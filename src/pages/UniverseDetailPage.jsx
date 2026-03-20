import React, { useEffect, useState } from "react";
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

function getSituationBadgeStyle(situacion) {
  switch (situacion) {
    case "En plazo":
      return {
        background: "#dcfce7",
        color: "#166534",
        border: "1px solid #bbf7d0",
      };
    case "En riesgo":
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
        background: "#f8fafc",
        color: "#334155",
        border: "1px solid #e2e8f0",
      };
  }
}

function KpiCard({ label, value, accent }) {
  return (
    <div
      style={{
        ...styles.kpiCard,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.8), 0 8px 20px ${accent}`,
      }}
    >
      <div style={styles.kpiLabel}>{label}</div>
      <div style={styles.kpiValue}>{value}</div>
    </div>
  );
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
        <section style={styles.heroCard}>
          <div style={styles.heroTopRow}>
            <button style={styles.backButton} onClick={() => navigate(-1)}>
              ← Volver
            </button>
          </div>

          <div style={styles.heroContent}>
            <div>
              <p style={styles.eyebrow}>Detalle de universo</p>
              <h1 style={styles.title}>{kpis.nombre_universo}</h1>
              <p style={styles.description}>
                {kpis.descripcion_universo || "Sin descripción informada."}
              </p>
            </div>
          </div>
        </section>

        <section style={styles.kpiGrid}>
          <KpiCard
            label="Nº de proyectos"
            value={kpis.num_proyectos ?? 0}
            accent="rgba(59, 130, 246, 0.10)"
          />
          <KpiCard
            label="Total de tareas"
            value={kpis.total_tareas ?? 0}
            accent="rgba(14, 165, 233, 0.10)"
          />
          <KpiCard
            label="Tareas finalizadas"
            value={kpis.tareas_finalizadas ?? 0}
            accent="rgba(34, 197, 94, 0.10)"
          />
          <KpiCard
            label="Avance (%)"
            value={`${kpis.avance_pct ?? 0}%`}
            accent="rgba(16, 185, 129, 0.10)"
          />
          <KpiCard
            label="Estimación impacto total"
            value={formatCurrency(kpis.impacto_total_estimado)}
            accent="rgba(99, 102, 241, 0.10)"
          />
          <KpiCard
            label="Estimación coste / inversión total"
            value={formatCurrency(kpis.inversion_total_estimada)}
            accent="rgba(244, 114, 182, 0.10)"
          />
          <KpiCard
            label="Estimación impacto proyectos QW"
            value={formatCurrency(kpis.impacto_qw_estimado)}
            accent="rgba(250, 204, 21, 0.12)"
          />
          <KpiCard
            label="Estimación coste / inversión proyectos QW"
            value={formatCurrency(kpis.inversion_qw_estimada)}
            accent="rgba(249, 115, 22, 0.10)"
          />
        </section>

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
                  <th style={styles.th}>Situación</th>
                  <th style={{ ...styles.th, textAlign: "right" }}>Impacto estimado</th>
                  <th style={{ ...styles.th, textAlign: "right" }}>Inversión estimada</th>
                  <th style={{ ...styles.th, textAlign: "center" }}>Detalle</th>
                </tr>
              </thead>

              <tbody>
                {projects.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={styles.emptyCell}>
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
                          {project.situacion || "—"}
                        </span>
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
    padding: "24px",
    background:
      "linear-gradient(180deg, #f8fbff 0%, #f4f7fb 38%, #eef4f8 100%)",
    boxSizing: "border-box",
  },
  container: {
    maxWidth: 1440,
    margin: "0 auto",
    display: "grid",
    gap: 18,
  },
  heroCard: {
    background: "linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(246,250,255,0.98) 100%)",
    border: "1px solid #dbe4ee",
    borderRadius: 20,
    padding: 24,
    boxShadow: "0 14px 36px rgba(15, 23, 42, 0.08)",
  },
  heroTopRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  heroContent: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    flexWrap: "wrap",
  },
  eyebrow: {
    margin: 0,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#64748b",
  },
  title: {
    margin: "8px 0 8px 0",
    fontSize: 32,
    lineHeight: 1.05,
    color: "#0f172a",
  },
  description: {
    margin: 0,
    maxWidth: 900,
    fontSize: 15,
    lineHeight: 1.5,
    color: "#475569",
  },
  kpiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 14,
  },
  kpiCard: {
    minHeight: 104,
    borderRadius: 18,
    border: "1px solid #dbe4ee",
    background: "rgba(255,255,255,0.88)",
    padding: "16px 18px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    backdropFilter: "blur(8px)",
  },
  kpiLabel: {
    fontSize: 13,
    color: "#64748b",
    lineHeight: 1.35,
  },
  kpiValue: {
    fontSize: 28,
    lineHeight: 1.1,
    fontWeight: 700,
    color: "#0f172a",
  },
  tableCard: {
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
    overflowX: "auto",
  },
  table: {
    width: "100%",
    minWidth: 1180,
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
    padding: 0,
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
