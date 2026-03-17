import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";

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

function KpiCard({ title, value }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.97)",
        border: "1px solid #e5e7eb",
        borderRadius: 16,
        padding: 16,
        boxShadow: "0 10px 24px rgba(15,23,42,0.08)",
      }}
    >
      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color: "#0f172a" }}>{value}</div>
    </div>
  );
}

function ProjectMiniCard({ project, onOpenProject }) {
  return (
    <div
      onClick={() => onOpenProject?.(project)}
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: 10,
        cursor: "pointer",
      }}
    >
      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: "#0f172a",
          marginBottom: 8,
          lineHeight: 1.3,
        }}
      >
        {project.titulo}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 18 }}>{getHarveyBall(project.avance_pct)}</span>
          <span style={{ fontSize: 12, color: "#64748b" }}>
            {project.avance_pct}%
          </span>
        </div>

        <div
          title={project.situacion}
          style={{
            width: 12,
            height: 12,
            borderRadius: "999px",
            background: getStatusColor(project.situacion),
            flexShrink: 0,
          }}
        />
      </div>

      <div
        style={{
          marginTop: 8,
          fontSize: 11,
          color: "#64748b",
          display: "flex",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <span>{project.horizonte || "-"}</span>
        <span>{project.tareas_finalizadas}/{project.total_tareas} tareas</span>
      </div>
    </div>
  );
}

function UniverseColumn({ universe, projects, onOpenProject }) {
  return (
    <div
      style={{
        minWidth: 290,
        background: "rgba(255,255,255,0.16)",
        border: "1px solid rgba(255,255,255,0.18)",
        borderRadius: 18,
        padding: 14,
        backdropFilter: "blur(6px)",
      }}
    >
      <div style={{ marginBottom: 14 }}>
        <h3 style={{ margin: 0, color: "#ffffff", fontSize: 20 }}>{universe.universo}</h3>
      </div>

      <div style={{ display: "grid", gap: 10, marginBottom: 14 }}>
        {projects.length === 0 ? (
          <div
            style={{
              background: "rgba(255,255,255,0.75)",
              borderRadius: 12,
              padding: 12,
              fontSize: 13,
              color: "#64748b",
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
          background: "rgba(255,255,255,0.94)",
          border: "1px solid #e5e7eb",
          borderRadius: 14,
          padding: 12,
        }}
      >
        <div style={{ fontSize: 11, color: "#64748b", marginBottom: 8 }}>
          KPIs del universo
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
            <span>Avance</span>
            <strong>{universe.avance_pct}%</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
            <span>E. Impacto</span>
            <strong>{formatCurrency(universe.impacto_total)}</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
            <span>E. Inversión</span>
            <strong>{formatCurrency(universe.inversion_total)}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
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
        supabase.from("v_dashboard_proyectos").select("*").order("universo").order("titulo"),
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
    return map;
  }, [projects]);

  function handleOpenProject(project) {
    console.log("Abrir proyecto:", project.id_proyecto);
    // luego:
    // navigate(`/proyecto/${project.id_proyecto}`);
  }

  if (loading) {
    return <div style={{ padding: 24 }}>Cargando dashboard...</div>;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: 24,
        background: "linear-gradient(135deg, #0b132b 0%, #1c2541 38%, #0f766e 100%)",
        fontFamily:
          "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <div style={{ maxWidth: 1600, margin: "0 auto" }}>
        <div style={{ marginBottom: 24, color: "#ffffff" }}>
          <h1 style={{ margin: 0, fontSize: 34 }}>Dashboard de Proyectos O2</h1>
          <p style={{ marginTop: 8, color: "rgba(255,255,255,0.85)" }}>
            Visión consolidada del portfolio por universo, avance, riesgo e impacto económico.
          </p>
        </div>

        {kpis && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 16,
              marginBottom: 24,
            }}
          >
            <KpiCard title="Total Proyectos" value={kpis.total_proyectos} />
            <KpiCard title="Total Tareas" value={kpis.total_tareas} />
            <KpiCard title="Tareas Finalizadas" value={kpis.tareas_finalizadas} />
            <KpiCard title="Avance (%)" value={`${kpis.avance_pct}%`} />
            <KpiCard title="E. Impacto Total" value={formatCurrency(kpis.impacto_total)} />
            <KpiCard title="E. Inversión / Gasto Total" value={formatCurrency(kpis.inversion_total)} />
            <KpiCard title="E. Impacto QW" value={formatCurrency(kpis.impacto_qw)} />
            <KpiCard title="E. Inversión / Gasto QW" value={formatCurrency(kpis.inversion_qw)} />
          </div>
        )}

        <div
          style={{
            display: "flex",
            gap: 16,
            overflowX: "auto",
            paddingBottom: 8,
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
