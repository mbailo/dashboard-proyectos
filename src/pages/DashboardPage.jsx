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
        borderRadius: 16,
        padding: "12px 14px",
        boxShadow: "0 8px 24px rgba(15,23,42,0.06)",
        minHeight: 82,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: "#64748b",
          marginBottom: 6,
          lineHeight: 1.2,
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: "clamp(18px, 2vw, 24px)",
          fontWeight: 700,
          color: "#0f172a",
          lineHeight: 1.1,
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
        padding: 10,
        cursor: "pointer",
        boxShadow: "0 4px 14px rgba(15,23,42,0.04)",
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 8,
          marginBottom: 6,
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "#0f172a",
            lineHeight: 1.25,
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
          marginBottom: 6,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 16, color: "#0f172a" }}>
            {getHarveyBall(project.avance_pct)}
          </span>
          <span style={{ fontSize: 11, color: "#64748b" }}>
            {project.avance_pct}%
          </span>
        </div>

        <div
          title={project.situacion}
          style={{
            width: 11,
            height: 11,
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
          lineHeight: 1.2,
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
        background: "rgba(255,255,255,0.78)",
        border: "1px solid #dbe4ee",
        borderRadius: 18,
        padding: 12,
        boxShadow: "0 12px 30px rgba(15,23,42,0.06)",
        backdropFilter: "blur(8px)",
        minWidth: 0,
      }}
    >
      <div
        style={{
          marginBottom: 10,
          paddingBottom: 8,
          borderBottom: "1px solid #e2e8f0",
        }}
      >
        <h3
          style={{
            margin: 0,
            color: "#0f172a",
            fontSize: 18,
            lineHeight: 1.2,
          }}
        >
          {universe.universo}
        </h3>
      </div>

      <div style={{ display: "grid", gap: 8, marginBottom: 10 }}>
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
          padding: 10,
        }}
      >
        <div
          style={{
            fontSize: 10,
            color: "#64748b",
            marginBottom: 8,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          KPIs del universo
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 12,
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
              fontSize: 12,
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
              fontSize: 12,
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

  useEffect(() => {
    async function loadData() {
      setLoading(true);

      const [
        { data: kpisData, error: kpisError },
        { data: universeData, error: universeError },
        { data: projectsData, error: projectsError },
      ] = await Promise.all([
        supabase.from("v_dashboard_kpis_globales").select("*").single(),
        supabase.from("v_dashboard_universos_kpi").select("*").order("universo"),
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

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          padding: 24,
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
        padding: "18px 20px",
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
          maxWidth: 1600,
          margin: "0 auto",
        }}
      >
        <div style={{ marginBottom: 18 }}>
          <h1
            style={{
              margin: 0,
              fontSize: "clamp(28px, 3vw, 34px)",
              color: "#0f172a",
              lineHeight: 1.1,
            }}
          >
            Dashboard de Proyectos O2
          </h1>
          <p
            style={{
              marginTop: 6,
              marginBottom: 0,
              color: "#5b6b7f",
              fontSize: 14,
            }}
          >
            Visión consolidada del portfolio por universo, avance, riesgo e
            impacto económico.
          </p>
        </div>

        {kpis && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
              gap: 12,
              marginBottom: 18,
            }}
          >
            <KpiCard title="Total Proyectos" value={kpis.total_proyectos} />
            <KpiCard title="Total Tareas" value={kpis.total_tareas} />
            <KpiCard
              title="Tareas Finalizadas"
              value={kpis.tareas_finalizadas}
            />
            <KpiCard title="Avance (%)" value={`${kpis.avance_pct}%`} />
            <KpiCard
              title="E. Impacto Total"
              value={formatCurrency(kpis.impacto_total)}
            />
            <KpiCard
              title="E. Inversión / Gasto Total"
              value={formatCurrency(kpis.inversion_total)}
            />
            <KpiCard
              title="E. Impacto QW"
              value={formatCurrency(kpis.impacto_qw)}
            />
            <KpiCard
              title="E. Inversión / Gasto QW"
              value={formatCurrency(kpis.inversion_qw)}
            />
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 12,
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
    </div>
  );
}
