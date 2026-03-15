"use client";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
    <nav style={{
      background: "var(--forest)",
      borderBottom: "1px solid rgba(201,168,76,0.2)",
      padding: "0 1rem",
      minHeight: "60px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "0.5rem",
      position: "sticky",
      top: 0,
      zIndex: 50
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
        <span style={{ fontSize: "1.3rem" }}>🤝</span>
        <span style={{ fontFamily: "var(--font-heading)", color: "white", fontWeight: 700, fontSize: "clamp(0.85rem, 3vw, 1rem)" }}>
          Tontine
        </span>
        {userData?.role === "admin" && (
          <span style={{ background: "var(--gold)", color: "#1A1A14", fontSize: "0.65rem", fontWeight: 700, padding: "2px 6px", borderRadius: "20px", fontFamily: "var(--font-heading)" }}>
            ADMIN
          </span>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        {/* Avatar lien vers profil */}
        <Link href="/profile" style={{ textDecoration: "none" }}>
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--gold)", display: "flex", alignItems: "center", justifyContent: "center", color: "#1A1A14", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "0.8rem", cursor: "pointer", flexShrink: 0 }}>
            {userData?.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
          </div>
        </Link>
        <button
          onClick={handleLogout}
          style={{
            background: "rgba(255,255,255,0.1)",
            color: "white",
            border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: "8px",
            padding: "0.4rem 0.75rem",
            cursor: "pointer",
            fontSize: "0.78rem",
            fontFamily: "var(--font-heading)",
            fontWeight: 500,
            whiteSpace: "nowrap",
            flexShrink: 0
          }}
        >
          Déconnexion
        </button>
      </div>
    </nav>
  );
}
