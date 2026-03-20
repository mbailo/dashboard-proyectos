import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../supabase";

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
    return <div>Cargando detalle del universo...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!kpis) {
    return <div>No se ha encontrado el universo.</div>;
  }

  return (
    <div style={{ padding: "24px" }}>
      <h1>{kpis.nombre_universo}</h1>
      <p>{kpis.descripcion_universo}</p>

      <h2>KPIs</h2>
      <div>
        <p>Nº proyectos: {kpis.num_proyectos}</p>
        <p>Total tareas: {kpis.total_tareas}</p>
        <p>Tareas finalizadas: {kpis.tareas_finalizadas}</p>
        <p>Avance (%): {kpis.avance_pct}</p>
        <p>Estimación impacto total: {kpis.impacto_total_estimado}</p>
        <p>Estimación coste/inversión total: {kpis.inversion_total_estimada}</p>
        <p>Estimación impacto proyectos QW: {kpis.impacto_qw_estimado}</p>
        <p>Estimación coste/inversión proyectos QW: {kpis.inversion_qw_estimada}</p>
      </div>

      <h2>Proyectos</h2>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>Título</th>
            <th>Owner</th>
            <th>Horizonte</th>
            <th>Fecha inicio</th>
            <th>Fecha fin</th>
            <th>Fase</th>
            <th>Situación</th>
            <th>Impacto estimado</th>
            <th>Inversión estimada</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          {projects.map((project) => (
            <tr key={project.id_proyecto}>
              <td>{project.titulo}</td>
              <td>{project.owner}</td>
              <td>{project.horizonte}</td>
              <td>{project.fecha_inicio}</td>
              <td>{project.fecha_fin}</td>
              <td>{project.fase}</td>
              <td>{project.situacion}</td>
              <td>{project.impacto_estimado}</td>
              <td>{project.inversion_estimada}</td>
              <td>
                <button onClick={() => navigate(`/projects/${project.id_proyecto}`)}>
                  Ver detalle
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
