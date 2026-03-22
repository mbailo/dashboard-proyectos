import { Link, Outlet, useLocation } from "react-router-dom";

export default function MainLayout({ perfil }) {
  const location = useLocation();

  const linkStyle = (path) => ({
    padding: "10px 14px",
    borderRadius: "8px",
    textDecoration: "none",
    color: location.pathname === path ? "#ffffff" : "#1f2937",
    backgroundColor: location.pathname === path ? "#2563eb" : "transparent",
    fontWeight: location.pathname === path ? "600" : "500",
  });

  return (
    <div style={{ minHeight: "100vh", background: "#f5f7fb" }}>
      <header
        style={{
          background: "#ffffff",
          borderBottom: "1px solid #e5e7eb",
          padding: "16px 24px",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div
          style={{
            maxWidth: "1500px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: "20px", color: "#111827" }}>
              Dashboard de Proyectos
            </h1>
          </div>

          <nav style={{ display: "flex", gap: "10px" }}>
            {perfil?.tipo_acceso === "global" && (
              <Link to="/" style={linkStyle("/")}>
                Dashboard
              </Link>
            )}

            {perfil?.tipo_acceso === "universo" && perfil?.id_universo && (
              <Link
                to={`/universes/${perfil.id_universo}`}
                style={linkStyle(`/universes/${perfil.id_universo}`)}
              >
                Mi universo
              </Link>
            )}

            <Link to="/proyectos/nuevo" style={linkStyle("/proyectos/nuevo")}>
              Nuevo Proyecto
            </Link>
          </nav>
          
        </div>
      </header>

      <main style={{ maxWidth: "1500px", margin: "0 auto", padding: "24px 18px" }}>
        <Outlet />
      </main>
    </div>
  );
}
