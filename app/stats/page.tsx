"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import Navbar from "@/components/Navbar";
import Link from "next/link";

interface Payment {
  id: string;
  memberId: string;
  memberName: string;
  amount: number;
  month: string;
  status: string;
}

interface Member {
  uid: string;
  name: string;
}

export default function StatsPage() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [members, setMembers] = useState<Member[]>([]);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
    if (!loading && userData?.role !== "admin") router.push("/dashboard");
  }, [user, userData, loading, router]);

  useEffect(() => {
    if (user && userData?.role === "admin") loadData();
  }, [user, userData]);

  const loadData = async () => {
    const [pSnap, mSnap] = await Promise.all([
      getDocs(collection(db, "payments")),
      getDocs(query(collection(db, "users"), where("role", "==", "member"), where("status", "==", "approved"))),
    ]);
    setPayments(pSnap.docs.map(d => ({ id: d.id, ...d.data() }) as Payment));
    setMembers(mSnap.docs.map(d => d.data() as Member));
  };

  const getLast6Months = () => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      months.push(d.toISOString().slice(0, 7));
    }
    return months;
  };

  const months = getLast6Months();
  const validatedPayments = payments.filter(p => p.status === "validated");

  const monthStats = months.map(month => {
    const monthPaid = validatedPayments.filter(p => p.month === month);
    const total = monthPaid.reduce((s, p) => s + p.amount, 0);
    const count = monthPaid.length;
    const rate = members.length > 0 ? Math.round((count / members.length) * 100) : 0;
    return { month, total, count, rate };
  });

  const maxTotal = Math.max(...monthStats.map(m => m.total), 1);
  const totalAllTime = validatedPayments.reduce((s, p) => s + p.amount, 0);
  const totalMonths = months.filter(m => monthStats.find(s => s.month === m && s.count > 0)).length;

  const memberStats = members.map(m => {
    const paid = validatedPayments.filter(p => p.memberId === m.uid).length;
    const total = validatedPayments.filter(p => p.memberId === m.uid).reduce((s, p) => s + p.amount, 0);
    const rate = months.length > 0 ? Math.round((paid / months.length) * 100) : 0;
    return { ...m, paid, total, rate };
  }).sort((a, b) => b.paid - a.paid);

  const monthLabel = (m: string) => new Date(m + "-01").toLocaleDateString("fr-FR", { month: "short" });

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span style={{ color: "var(--gold)" }}>Chargement...</span>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)" }}>
      <Navbar />
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "1.5rem 1rem" }}>

        <Link href="/admin" style={{ color: "var(--text-muted)", fontSize: "0.88rem", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.4rem", marginBottom: "1.5rem" }}>
          ← Retour admin
        </Link>

        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(1.3rem, 5vw, 1.8rem)", fontWeight: 700, color: "var(--forest)", marginBottom: "1.5rem" }}>
          Statistiques
        </h1>

        {/* KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.75rem", marginBottom: "1.5rem" }}>
          {[
            { label: "Total encaissé", value: totalAllTime.toLocaleString("fr-FR") + " F", color: "var(--forest)" },
            { label: "Membres actifs", value: members.length.toString(), color: "#1A6B35" },
            { label: "Mois actifs", value: totalMonths.toString(), color: "#185FA5" },
            { label: "Taux moyen", value: Math.round(monthStats.reduce((s, m) => s + m.rate, 0) / Math.max(monthStats.length, 1)) + "%", color: "#8B6914" },
          ].map(k => (
            <div key={k.label} style={{ background: "white", borderRadius: "14px", border: "1px solid rgba(201,168,76,0.2)", padding: "1rem" }}>
              <p style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginBottom: "0.3rem" }}>{k.label}</p>
              <p style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(1.1rem, 4vw, 1.4rem)", fontWeight: 700, color: k.color }}>{k.value}</p>
            </div>
          ))}
        </div>

        {/* Bar chart */}
        <div className="card" style={{ padding: "1.5rem", marginBottom: "1.25rem" }}>
          <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1rem", fontWeight: 700, color: "var(--forest)", marginBottom: "1.5rem" }}>
            Cotisations collectées — 6 derniers mois
          </h3>
          <div style={{ display: "flex", alignItems: "flex-end", gap: "0.6rem", height: 160 }}>
            {monthStats.map(m => (
              <div key={m.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "0.4rem", height: "100%" }}>
                <div style={{ flex: 1, width: "100%", display: "flex", alignItems: "flex-end" }}>
                  <div style={{
                    width: "100%",
                    height: `${Math.max((m.total / maxTotal) * 100, m.total > 0 ? 6 : 0)}%`,
                    background: m.total > 0 ? "var(--forest)" : "#e0d8c0",
                    borderRadius: "6px 6px 0 0",
                    position: "relative",
                    minHeight: m.total > 0 ? 6 : 0
                  }}>
                    {m.total > 0 && (
                      <div style={{
                        position: "absolute", top: -20, left: "50%", transform: "translateX(-50%)",
                        fontSize: "0.62rem", fontWeight: 700, color: "var(--forest)", whiteSpace: "nowrap"
                      }}>
                        {m.total >= 1000 ? (m.total/1000).toFixed(0)+"k" : m.total}
                      </div>
                    )}
                  </div>
                </div>
                <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 500 }}>{monthLabel(m.month)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Participation rate */}
        <div className="card" style={{ padding: "1.5rem", marginBottom: "1.25rem" }}>
          <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1rem", fontWeight: 700, color: "var(--forest)", marginBottom: "1.25rem" }}>
            Taux de participation par mois
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {monthStats.map(m => (
              <div key={m.month}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
                  <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                    {new Date(m.month + "-01").toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
                  </span>
                  <span style={{ fontSize: "0.82rem", fontWeight: 600, color: m.rate >= 80 ? "#1A6B35" : m.rate >= 50 ? "#8B6914" : "#B04A10" }}>
                    {m.count}/{members.length} · {m.rate}%
                  </span>
                </div>
                <div style={{ height: 8, background: "#f0ead6", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{
                    height: "100%", width: `${m.rate}%`,
                    background: m.rate >= 80 ? "#1A6B35" : m.rate >= 50 ? "#C9A84C" : "#B04A10",
                    borderRadius: 4
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Member ranking */}
        <div className="card" style={{ overflow: "hidden" }}>
          <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid rgba(201,168,76,0.15)" }}>
            <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1rem", fontWeight: 700, color: "var(--forest)" }}>
              Classement des membres
            </h3>
          </div>
          {memberStats.map((m, i) => (
            <div key={m.uid} style={{ padding: "0.9rem 1.25rem", borderBottom: "1px solid rgba(0,0,0,0.04)", display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                background: i === 0 ? "#C9A84C" : i === 1 ? "#B0B0B0" : i === 2 ? "#CD7F32" : "#f0ead6",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "0.78rem",
                color: i < 3 ? "white" : "var(--text-muted)"
              }}>
                {i + 1}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 600, fontSize: "0.9rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</p>
                <p style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>{m.paid} mois · {m.total.toLocaleString("fr-FR")} F</p>
              </div>
              <span style={{
                background: m.rate >= 80 ? "#E6F4EC" : m.rate >= 50 ? "#FFF8E6" : "#FEF0E6",
                color: m.rate >= 80 ? "#1A6B35" : m.rate >= 50 ? "#8B6914" : "#B04A10",
                border: `1px solid ${m.rate >= 80 ? "#A8D5B5" : m.rate >= 50 ? "#E8D080" : "#F5C4A0"}`,
                padding: "0.2rem 0.6rem", borderRadius: "20px", fontSize: "0.75rem", fontWeight: 700, flexShrink: 0
              }}>
                {m.rate}%
              </span>
            </div>
          ))}
          {members.length === 0 && (
            <div style={{ padding: "2.5rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.88rem" }}>Aucun membre</div>
          )}
        </div>
      </div>
    </div>
  );
}
