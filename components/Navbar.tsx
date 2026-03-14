"use client";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function Navbar() {
  const { userData, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    toast.success("Déconnecté");
    router.push("/login");
  };

  return (
    <nav style={{ background: "var(--forest)", borderBottom: "1px solid rgba(201,168,76,0.2)", padding: "0 1.5rem", height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <span style={{ fontSize: "1.4rem" }}>🤝</span>
        <span style={{ fontFamily: "var(--font-heading)", color: "white", fontWeight: 700, fontSize: "1.1rem" }}>
          Tontine Familiale
        </span>
        {userData?.role === "admin" && (
          <span style={{ background: "var(--gold)", color: "#1A1A14", fontSize: "0.7rem", fontWeight: 700, padding: "2px 8px", borderRadius: "20px", fontFamily: "var(--font-heading)" }}>
            ADMIN
          </span>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <div style={{ textAlign: "right" }}>
          <div style={{ color: "white", fontSize: "0.9rem", fontWeight: 500 }}>{userData?.name}</div>
          <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.75rem" }}>{userData?.phone}</div>
        </div>
        <button onClick={handleLogout} className="btn-outline" style={{ fontSize: "0.82rem", padding: "0.5rem 1rem", color: "rgba(255,255,255,0.7)", borderColor: "rgba(255,255,255,0.2)" }}>
          Déconnexion
        </button>
      </div>
    </nav>
  );
}
