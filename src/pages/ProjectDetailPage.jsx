import { useParams } from "react-router-dom";

export default function ProjectDetailPage() {
  const { id } = useParams();

  return (
    <div>
      <h2>Detalle del Proyecto</h2>
      <p>Proyecto: {id}</p>
      <p>Ficha de proyecto en construcción.</p>
    </div>
  );
}
