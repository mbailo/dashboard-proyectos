import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { supabase } from "./supabase";

function App() {
  const [universos, setUniversos] = useState([]);

  useEffect(() => {
    async function cargarUniversos() {
      const { data, error } = await supabase
        .from("universos")
        .select("*")
        .order("nombre_universo");

      if (error) {
        console.error(error);
      } else {
        setUniversos(data);
      }
    }

    cargarUniversos();
  }, []);

  return (
    <div style={{ fontFamily: "Arial", padding: "40px" }}>
      <h1>Dashboard de Proyectos</h1>

      <h2>Universos</h2>

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
