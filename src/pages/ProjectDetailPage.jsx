import { useParams } from "react-router-dom";

export default function ProjectDetailPage() {
  const { id } = useParams();

  return (
    <div style={{ padding: "24px" }}>
      <h1>Detalle del Proyecto</h1>
      <p>Proyecto: {id}</p>
      <p>Ficha de proyecto en construcción.</p>
    </div>
  );
}
