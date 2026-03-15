import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { supabase } from "./supabase";

function App() {
  const [universos, setUniversos] = useState([]);
  const [mensaje, setMensaje] = useState("Cargando...");

  useEffect(() => {
    async function cargarUniversos() {
      const { data, error } = await supabase
        .from("universos_negocio")
        .select("*")
        .order("nombre");

      if (error) {
        console.error(error);
        setMensaje(`Error: ${error.message}`);
      } else {
        setUniversos(data || []);
        setMensaje(`Filas recibidas: ${(data || []).length}`);
      }
    }

    cargarUniversos();
  }, []);

  return (
    <div style={{ fontFamily: "Arial", padding: "40px" }}>
      <h1>Dashboard de Proyectos</h1>
      <h2>Universos</h2>
      <p>{mensaje}</p>

      <ul>
        {universos.map((u) => (
          <li key={u.id_universo}>{u.nombre_universo}</li>
        ))}
      </ul>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
