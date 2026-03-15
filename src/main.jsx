import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { supabase } from "./supabase";

function App() {
  const [universos, setUniversos] = useState([]);
  const [mensaje, setMensaje] = useState("");

  const [form, setForm] = useState({
    id_universo: "",
    titulo: "",
    descripcion: "",
    beneficios: "",
    inversion_estimada: "",
    impacto_estimado: "",
    owner: "",
    fase: "En Definición",
    situacion: "En tiempo",
    fecha_inicio: "",
    fecha_fin: ""
  });

  useEffect(() => {
    async function cargarUniversos() {
      const { data, error } = await supabase
        .from("universos_negocio")
        .select("id_universo, nombre")
        .order("nombre");

      if (error) {
        setMensaje(`Error cargando universos: ${error.message}`);
      } else {
        setUniversos(data || []);
      }
    }

    cargarUniversos();
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMensaje("Guardando proyecto...");

    const { data, error } = await supabase.rpc("crear_proyecto", {
      p_id_universo: Number(form.id_universo),
      p_titulo: form.titulo,
      p_descripcion: form.descripcion || null,
      p_beneficios: form.beneficios || null,
      p_inversion_estimada: form.inversion_estimada === "" ? 0 : Number(form.inversion_estimada),
      p_impacto_estimado: form.impacto_estimado === "" ? 0 : Number(form.impacto_estimado),
      p_owner: form.owner,
      p_fase: form.fase,
      p_situacion: form.situacion,
      p_fecha_inicio: form.fecha_inicio || null,
      p_fecha_fin: form.fecha_fin || null
    });

    if (error) {
      setMensaje(`Error guardando proyecto: ${error.message}`);
      return;
    }

    setMensaje(`Proyecto creado correctamente: ${data.id_proyecto}`);

    setForm({
      id_universo: "",
      titulo: "",
      descripcion: "",
      beneficios: "",
      inversion_estimada: "",
      impacto_estimado: "",
      owner: "",
      fase: "En Definición",
      situacion: "En tiempo",
      fecha_inicio: "",
      fecha_fin: ""
    });
  }

  return (
    <div style={{ fontFamily: "Arial", padding: "40px", maxWidth: "900px", margin: "0 auto" }}>
      <h1>Alta de Proyecto</h1>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "16px" }}>
        <div>
          <label>Universo</label>
          <br />
          <select
            name="id_universo"
            value={form.id_universo}
            onChange={handleChange}
            required
            style={{ width: "100%", padding: "10px" }}
          >
            <option value="">Selecciona un universo</option>
            {universos.map((u) => (
              <option key={u.id_universo} value={u.id_universo}>
                {u.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Título</label>
          <br />
          <input
            type="text"
            name="titulo"
            value={form.titulo}
            onChange={handleChange}
            required
            style={{ width: "100%", padding: "10px" }}
          />
        </div>

        <div>
          <label>Owner</label>
          <br />
          <input
            type="text"
            name="owner"
            value={form.owner}
            onChange={handleChange}
            required
            style={{ width: "100%", padding: "10px" }}
          />
        </div>

        <div>
          <label>Fase</label>
          <br />
          <select
            name="fase"
            value={form.fase}
            onChange={handleChange}
            required
            style={{ width: "100%", padding: "10px" }}
          >
            <option value="En Definición">En Definición</option>
            <option value="En Planificación">En Planificación</option>
            <option value="En Curso">En Curso</option>
            <option value="Finalizado">Finalizado</option>
          </select>
        </div>

        <div>
          <label>Situación</label>
          <br />
          <select
            name="situacion"
            value={form.situacion}
            onChange={handleChange}
            required
            style={{ width: "100%", padding: "10px" }}
          >
            <option value="En tiempo">En tiempo</option>
            <option value="Riesgo de retraso">Riesgo de retraso</option>
            <option value="Retrasado">Retrasado</option>
          </select>
        </div>

        <div>
          <label>Fecha inicio</label>
          <br />
          <input
            type="date"
            name="fecha_inicio"
            value={form.fecha_inicio}
            onChange={handleChange}
            style={{ width: "100%", padding: "10px" }}
          />
        </div>

        <div>
          <label>Fecha fin</label>
          <br />
          <input
            type="date"
            name="fecha_fin"
            value={form.fecha_fin}
            onChange={handleChange}
            style={{ width: "100%", padding: "10px" }}
          />
        </div>

        <div>
          <label>Descripción</label>
          <br />
          <textarea
            name="descripcion"
            value={form.descripcion}
            onChange={handleChange}
            rows="4"
            style={{ width: "100%", padding: "10px" }}
          />
        </div>

        <div>
          <label>Beneficios</label>
          <br />
          <textarea
            name="beneficios"
            value={form.beneficios}
            onChange={handleChange}
            rows="4"
            style={{ width: "100%", padding: "10px" }}
          />
        </div>

        <div>
          <label>Inversión estimada (€)</label>
          <br />
          <input
            type="number"
            name="inversion_estimada"
            value={form.inversion_estimada}
            onChange={handleChange}
            min="0"
            step="0.01"
            style={{ width: "100%", padding: "10px" }}
          />
        </div>

        <div>
          <label>Impacto estimado (€)</label>
          <br />
          <input
            type="number"
            name="impacto_estimado"
            value={form.impacto_estimado}
            onChange={handleChange}
            min="0"
            step="0.01"
            style={{ width: "100%", padding: "10px" }}
          />
        </div>

        <button type="submit" style={{ padding: "12px 16px" }}>
          Guardar proyecto
        </button>
      </form>

      {mensaje && <p style={{ marginTop: "20px" }}>{mensaje}</p>}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
