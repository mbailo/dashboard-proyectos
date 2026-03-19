import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";

function formatCurrency(value) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function getHarveyBall(avance) {
  const pct = Number(avance || 0);
  if (pct <= 0) return "○";
  if (pct < 25) return "◔";
  if (pct < 50) return "◑";
  if (pct < 75) return "◕";
  return "●";
}

function getStatusColor(situacion) {
  if (situacion === "En tiempo") return "#16a34a";
  if (situacion === "Riesgo de retraso") return "#f59e0b";
  if (situacion === "Retrasado") return "#dc2626";
  return "#94a3b8";
}

function getStatusBg(situacion) {
  if (situacion === "En tiempo") return "#dcfce7";
  if (situacion === "Riesgo de retraso") return "#fef3c7";
  if (situacion === "Retrasado") return "#fee2e2";
  return "#e2e8f0";
}

function sortProjects(projects) {
  const priority = {
    Retrasado: 1,
    "Riesgo de retraso": 2,
    "En tiempo": 3,
  };

  return [...projects].sort((a, b) => {
    const pa = priority[a.situacion] || 99;
    const pb = priority[b.situacion] || 99;

    if (pa !== pb) return pa - pb;

    const impactA = Number(a.impacto_estimado || 0);
    const impactB = Number(b.impacto_estimado || 0);
    if (impactA !== impactB) return impactB - impactA;

    return (a.titulo || "").localeCompare(b.titulo || "");
  });
}

function KpiCard({ title, value }) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #dbe4ee",
        borderRadius: 14,
        padding: "8px 12px",
        boxShadow: "0 6px 18px rgba(15,23,42,0.05)",
        minHeight: 62,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          fontSize: 10,
          color: "#64748b",
          marginBottom: 4,
          lineHeight: 1.15,
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: "clamp(16px, 1.5vw, 20px)",
          fontWeight: 700,
          color: "#0f172a",
          lineHeight: 1.05,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function ProjectMiniCard({ project, onOpenProject }) {
  const isQuickWin = project.horizonte === "Quick-Win";

  return (
    <div
      onClick={() => onOpenProject?.(project)}
      style={{
        background: "#ffffff",
        border: "1px solid #dbe4ee",
        borderRadius: 12,
        padding: 9,
        cursor: "pointer",
        boxShadow: "0 4px 12px rgba(15,23,42,0.04)",
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 8,
          marginBottom: 5,
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "#0f172a",
            lineHeight: 1.2,
            flex: 1,
          }}
        >
          {project.titulo}
        </div>

        {isQuickWin ? (
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              background: "#d1fae5",
              color: "#065f46",
              padding: "2px 6px",
              borderRadius: 999,
              whiteSpace: "nowrap",
              border: "1px solid #a7f3d0",
            }}
          >
            QW
          </span>
        ) : null}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          marginBottom: 5,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 15, color: "#0f172a" }}>
            {getHarveyBall(project.avance_pct)}
          </span>
          <span style={{ fontSize: 11, color: "#64748b" }}>
            {project.avance_pct}%
          </span>
        </div>

        <div
          title={project.situacion}
          style={{
            width: 10,
            height: 10,
            borderRadius: "999px",
            background: getStatusColor(project.situacion),
            boxShadow: `0 0 0 3px ${getStatusBg(project.situacion)}`,
            flexShrink: 0,
          }}
        />
      </div>

      <div
        style={{
          fontSize: 10,
          color: "#64748b",
          display: "flex",
          justifyContent: "space-between",
          gap: 8,
          lineHeight: 1.15,
        }}
      >
        <span>{project.horizonte || "-"}</span>
        <span>
          {project.tareas_finalizadas}/{project.total_tareas} tareas
        </span>
      </div>
    </div>
  );
}

function UniverseColumn({ universe, projects, onOpenProject }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.8)",
        border: "1px solid #dbe4ee",
        borderRadius: 16,
        padding: 10,
        boxShadow: "0 10px 24px rgba(15,23,42,0.05)",
        backdropFilter: "blur(8px)",
        minWidth: 0,
      }}
    >
      <div
        style={{
          marginBottom: 8,
          paddingBottom: 6,
          borderBottom: "1px solid #e2e8f0",
        }}
      >
        <h3
          style={{
            margin: 0,
            color: "#0f172a",
            fontSize: 16,
            lineHeight: 1.15,
          }}
        >
          {universe.universo}
        </h3>
      </div>

      <div style={{ display: "grid", gap: 7, marginBottom: 8 }}>
        {projects.length === 0 ? (
          <div
            style={{
              background: "#f8fafc",
              border: "1px dashed #cbd5e1",
              borderRadius: 12,
              padding: 10,
              fontSize: 12,
              color: "#64748b",
              textAlign: "center",
            }}
          >
            Sin proyectos
          </div>
        ) : (
          projects.map((project) => (
            <ProjectMiniCard
              key={project.id_proyecto}
              project={project}
              onOpenProject={onOpenProject}
            />
          ))
        )}
      </div>

      <div
        style={{
          background: "#f8fbff",
          border: "1px solid #dbe4ee",
          borderRadius: 12,
          padding: 9,
        }}
      >
        <div
          style={{
            fontSize: 9,
            color: "#64748b",
            marginBottom: 6,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          KPIs del universo
        </div>

        <div style={{ display: "grid", gap: 5 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 11,
              color: "#334155",
            }}
          >
            <span>Avance</span>
            <strong>{universe.avance_pct}%</strong>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 11,
              color: "#334155",
              gap: 8,
            }}
          >
            <span>E. Impacto</span>
            <strong style={{ textAlign: "right" }}>
              {formatCurrency(universe.impacto_total)}
            </strong>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 11,
              color: "#334155",
              gap: 8,
            }}
          >
            <span>E. Inversión</span>
            <strong style={{ textAlign: "right" }}>
              {formatCurrency(universe.inversion_total)}
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [kpis, setKpis] = useState(null);
  const [universes, setUniverses] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showUniverseModal, setShowUniverseModal] = useState(false);
  const [savingUniverse, setSavingUniverse] = useState(false);
  const [universeError, setUniverseError] = useState("");
  const [newUniverse, setNewUniverse] = useState({
    nombre: "",
    codigo_universo: "",
    descripcion: "",
  });
  
  async function loadData() {
    setLoading(true);
  
    const [
      { data: kpisData, error: kpisError },
      { data: universeData, error: universeError },
      { data: projectsData, error: projectsError },
    ] = await Promise.all([
      supabase.from("v_dashboard_kpis_globales").select("*").single(),
      supabase.from("v_dashboard_universos_kpi").select("*").order("id_universo", { ascending: true }),
      supabase
        .from("v_dashboard_proyectos")
        .select("*")
        .order("universo")
        .order("titulo"),
    ]);
  
    if (kpisError) console.error(kpisError);
    if (universeError) console.error(universeError);
    if (projectsError) console.error(projectsError);
  
    setKpis(kpisData || null);
    setUniverses(universeData || []);
    setProjects(projectsData || []);
    setLoading(false);
  }
  
  useEffect(() => {
    loadData();
  }, []);  
  
  const projectsByUniverse = useMemo(() => {
    const map = {};
    for (const project of projects) {
      if (!map[project.id_universo]) map[project.id_universo] = [];
      map[project.id_universo].push(project);
    }

    Object.keys(map).forEach((key) => {
      map[key] = sortProjects(map[key]);
    });

    return map;
  }, [projects]);

  function handleOpenProject(project) {
    navigate(`/proyectos/${project.id_proyecto}`);
  }

async function handleCreateUniverse(e) {
  e.preventDefault();
  setUniverseError("");
  setSavingUniverse(true);

  try {
    const payload = {
      nombre: newUniverse.nombre.trim(),
      codigo_universo: newUniverse.codigo_universo.trim().toUpperCase(),
      descripcion: newUniverse.descripcion.trim() || null,
    };

    const { error } = await supabase.from("universos_negocio").insert([payload]);

    if (error) throw error;

    setNewUniverse({
      nombre: "",
      codigo_universo: "",
      descripcion: "",
    });

    setShowUniverseModal(false);
    await loadData();
  } catch (err) {
    if (err?.message?.includes("duplicate key")) {
      setUniverseError("El código de universo ya existe.");
    } else {
      setUniverseError(err.message || "No se pudo crear el universo.");
    }
  } finally {
    setSavingUniverse(false);
  }
}

    if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          padding: 20,
          background:
            "linear-gradient(180deg, #f7fafc 0%, #eef6f5 48%, #edf7fb 100%)",
          fontFamily:
            "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          color: "#0f172a",
        }}
      >
        Cargando dashboard...
      </div>
    );
  }
  
  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "14px 18px",
        background:
          "radial-gradient(circle at top left, #f8fbff 0%, #f3f8f7 34%, #eef5fb 68%, #f8fbff 100%)",
        fontFamily:
          "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        color: "#0f172a",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          maxWidth: 1800,
          margin: "0 auto",
        }}
      >
      
        <div
          style={{
            marginBottom: 12,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: "clamp(26px, 2.2vw, 32px)",
                color: "#0f172a",
                lineHeight: 1.05,
              }}
            >
              Dashboard de Proyectos O2
            </h1>
            <p
              style={{
                marginTop: 4,
                marginBottom: 0,
                color: "#5b6b7f",
                fontSize: 13,
              }}
            >
              Visión consolidada del portfolio por universo, avance, riesgo e impacto económico.
            </p>
          </div>
        
          <button
            onClick={() => {
              setUniverseError("");
              setShowUniverseModal(true);
            }}
            style={{
              border: "1px solid #0f766e",
              background: "#0f766e",
              color: "#ffffff",
              borderRadius: 10,
              padding: "10px 14px",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 8px 18px rgba(15,118,110,0.18)",
            }}
          >
            + Nuevo universo
          </button>
        </div>
        
        {kpis && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
              gap: 10,
              marginBottom: 14,
            }}
          >
            <KpiCard title="Total Proyectos" value={kpis.total_proyectos} />
            <KpiCard title="Total Tareas" value={kpis.total_tareas} />
            <KpiCard title="Tareas Finalizadas" value={kpis.tareas_finalizadas} />
            <KpiCard title="Avance (%)" value={`${kpis.avance_pct}%`} />
            <KpiCard title="E. Impacto Total" value={formatCurrency(kpis.impacto_total)} />
            <KpiCard
              title="E. Inversión / Gasto Total"
              value={formatCurrency(kpis.inversion_total)}
            />
            <KpiCard title="E. Impacto QW" value={formatCurrency(kpis.impacto_qw)} />
            <KpiCard
              title="E. Inversión / Gasto QW"
              value={formatCurrency(kpis.inversion_qw)}
            />
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
            gap: 10,
            alignItems: "start",
          }}
        >
          {universes.map((universe) => (
            <UniverseColumn
              key={universe.id_universo}
              universe={universe}
              projects={projectsByUniverse[universe.id_universo] || []}
              onOpenProject={handleOpenProject}
            />
          ))}
        </div>
      </div>

    {showUniverseModal && (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(15, 23, 42, 0.35)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
      zIndex: 1000,
    }}
  >
    <div
      style={{
        width: "100%",
        maxWidth: 520,
        background: "#ffffff",
        borderRadius: 18,
        border: "1px solid #dbe4ee",
        boxShadow: "0 20px 50px rgba(15,23,42,0.18)",
        padding: 22,
      }}
    >
      <h3
        style={{
          marginTop: 0,
          marginBottom: 6,
          color: "#0f172a",
        }}
      >
        Nuevo universo
      </h3>

      <p
        style={{
          marginTop: 0,
          marginBottom: 18,
          fontSize: 13,
          color: "#64748b",
        }}
      >
        Crea un nuevo universo para que aparezca como una nueva columna en el dashboard.
      </p>

      <form onSubmit={handleCreateUniverse}>
        <div style={{ display: "grid", gap: 14 }}>
          <div>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 600,
                color: "#334155",
                marginBottom: 6,
              }}
            >
              Nombre
            </label>
            <input
              type="text"
              value={newUniverse.nombre}
              onChange={(e) =>
                setNewUniverse((prev) => ({ ...prev, nombre: e.target.value }))
              }
              required
              style={{
                width: "100%",
                boxSizing: "border-box",
                border: "1px solid #cbd5e1",
                borderRadius: 10,
                padding: "10px 12px",
                fontSize: 14,
                outline: "none",
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 600,
                color: "#334155",
                marginBottom: 6,
              }}
            >
              Código universo
            </label>
            <input
              type="text"
              maxLength={2}
              value={newUniverse.codigo_universo}
              onChange={(e) =>
                setNewUniverse((prev) => ({
                  ...prev,
                  codigo_universo: e.target.value.toUpperCase(),
                }))
              }
              required
              style={{
                width: "100%",
                boxSizing: "border-box",
                border: "1px solid #cbd5e1",
                borderRadius: 10,
                padding: "10px 12px",
                fontSize: 14,
                outline: "none",
                textTransform: "uppercase",
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 600,
                color: "#334155",
                marginBottom: 6,
              }}
            >
              Descripción
            </label>
            <textarea
              rows={3}
              value={newUniverse.descripcion}
              onChange={(e) =>
                setNewUniverse((prev) => ({
                  ...prev,
                  descripcion: e.target.value,
                }))
              }
              style={{
                width: "100%",
                boxSizing: "border-box",
                border: "1px solid #cbd5e1",
                borderRadius: 10,
                padding: "10px 12px",
                fontSize: 14,
                outline: "none",
                resize: "vertical",
              }}
            />
          </div>
        </div>

        {universeError ? (
          <div
            style={{
              marginTop: 14,
              padding: "10px 12px",
              borderRadius: 10,
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#b91c1c",
              fontSize: 13,
            }}
          >
            {universeError}
          </div>
        ) : null}

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            marginTop: 18,
          }}
        >
          <button
            type="button"
            onClick={() => {
              setShowUniverseModal(false);
              setUniverseError("");
            }}
            style={{
              border: "1px solid #cbd5e1",
              background: "#ffffff",
              color: "#334155",
              borderRadius: 10,
              padding: "10px 14px",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={savingUniverse}
            style={{
              border: "1px solid #0f766e",
              background: savingUniverse ? "#99f6e4" : "#0f766e",
              color: "#ffffff",
              borderRadius: 10,
              padding: "10px 14px",
              fontSize: 13,
              fontWeight: 600,
              cursor: savingUniverse ? "default" : "pointer",
            }}
          >
            {savingUniverse ? "Guardando..." : "Crear universo"}
          </button>
        </div>
      </form>
    </div>
  </div>
)}
    </div>
  );
}
