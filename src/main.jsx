import React from "react";
import ReactDOM from "react-dom/client";

function App() {
  return (
    <div style={{fontFamily:"Arial", padding:"40px"}}>
      <h1>Dashboard de Proyectos</h1>
      <p>Aplicación funcionando 🚀</p>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
