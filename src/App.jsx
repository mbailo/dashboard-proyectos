import { BrowserRouter, Routes, Route } from "react-router-dom";
import DashboardPage from "./pages/DashboardPage";
import NewProjectPage from "./pages/NewProjectPage";
import ProjectDetailPage from "./pages/ProjectDetailPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/proyectos/nuevo" element={<NewProjectPage />} />
        <Route path="/proyectos/:id" element={<ProjectDetailPage />} />
      </Routes>
    </BrowserRouter>
  );
}
