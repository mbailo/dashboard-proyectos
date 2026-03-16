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

export default function ProjectDetailPage() {
  const { id } = useParams();
  const [proyecto, setProyecto] = useState(null);
  const [tareas, setTareas] = useState([]);
  const [costes, setCostes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function loadProject() {
      setLoading(true);
      setErrorMsg("");

      const { data: proyectoData, error: proyectoError } = await supabase
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
        .eq("id_proyecto", id)
        .single();

      if (proyectoError) {
        setErrorMsg(proyectoError.message || "No se pudo cargar el proyecto");
        setProyecto(null);
        setTareas([]);
        setCostes([]);
        setLoading(false);
        return;
      }

      const { data: tareasData, error: tareasError } = await supabase
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
        .eq("id_proyecto", id)
        .order("id_tarea", { ascending: true });

      if (tareasError) {
        setErrorMsg(tareasError.message || "No se pudieron cargar las tareas");
        setProyecto(proyectoData);
        setTareas([]);
        setCostes([]);
        setLoading(false);
        return;
      }

      const { data: costesData, error: costesError } = await supabase
        .from("costes_proyecto")
        .select(`
          id_coste,
          id_proyecto,
          titulo_coste,
          descripcion,
          tipo_coste,
          importe
        `)
        .eq("id_proyecto", id)
        .order("id_coste", { ascending: true });

      if (costesError) {
        setErrorMsg(costesError.message || "No se pudieron cargar los costes");
        setProyecto(proyectoData);
        setTareas(tareasData || []);
        setCostes([]);
        setLoading(false);
        return;
      }

      setProyecto(proyectoData);
      setTareas(tareasData || []);
      setCostes(costesData || []);
      setLoading(false);
    }

    loadProject();
  }, [id]);

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
          padding: "24px",
        }}
      >
        <div style={{ marginBottom: "20px" }}>
          <div
            style={{
              fontSize: "13px",
              color: "#6b7280",
              marginBottom: "8px",
            }}
          >
            {proyecto.id_proyecto}
          </div>

          <h2
            style={{
              margin: "0 0 12px 0",
              fontSize: "28px",
              color: "#111827",
            }}
          >
            {proyecto.titulo}
          </h2>

          <p
            style={{
              margin: "0 0 12px 0",
              color: "#374151",
              lineHeight: 1.5,
            }}
          >
            {proyecto.descripcion || "Sin descripción"}
          </p>

          <p style={{ margin: 0, color: "#4b5563", lineHeight: 1.5 }}>
            <strong>Beneficios:</strong> {proyecto.beneficios || "No informados"}
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "16px",
          }}
        >
          <InfoCard label="Universo" value={nombreUniverso} />
          <InfoCard label="Owner" value={proyecto.owner} />
          <InfoCard label="Fase" value={proyecto.fase} />
          <InfoCard label="Situación" value={proyecto.situacion} />
          <InfoCard
            label="Inversión estimada"
            value={formatCurrency(proyecto.inversion_estimada)}
          />
          <InfoCard
            label="Impacto estimado"
            value={formatCurrency(proyecto.impacto_estimado)}
          />
          <InfoCard
            label="Fecha de inicio"
            value={formatDate(proyecto.fecha_inicio)}
          />
          <InfoCard
            label="Fecha fin"
            value={formatDate(proyecto.fecha_fin)}
          />
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
        <h3 style={{ marginTop: 0 }}>Tareas del proyecto</h3>

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
        <h3 style={{ marginTop: 0 }}>Costes del proyecto</h3>

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
                    <td style={tdStyle}>{coste.titulo_coste || "-"}</td>
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
