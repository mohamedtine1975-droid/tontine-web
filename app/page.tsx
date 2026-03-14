"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) router.push("/login");
    else if (userData?.role === "admin") router.push("/admin");
    else router.push("/dashboard");
  }, [user, userData, loading, router]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontFamily: "var(--font-heading)", color: "var(--gold)", fontSize: "1.2rem" }}>Chargement...</div>
    </div>
  );
}
