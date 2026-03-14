"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc, setDoc, getDoc, query, where } from "firebase/firestore";
import Navbar from "@/components/Navbar";
import PaymentTicket from "@/components/PaymentTicket";
import toast from "react-hot-toast";

interface Member {
  uid: string;
  name: string;
  email: string;
  phone: string;
  role: string;
}

interface Payment {
  id: string;
  memberId: string;
  memberName: string;
  amount: number;
  month: string;
  method: string;
  status: string;
  screenshotUrl?: string;
  paidAt: string;
  validatedAt?: string;
  transactionRef?: string;
}

interface TontineSettings {
  monthlyAmount: number;
  adminPhone: string;
  adminWaveNumber: string;
  adminOmNumber: string;
  groupName: string;
}

export default function AdminPage() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [settings, setSettings] = useState<TontineSettings>({ monthlyAmount: 10000, adminPhone: "", adminWaveNumber: "", adminOmNumber: "", groupName: "Tontine Familiale" });
  const [activeTab, setActiveTab] = useState<"overview" | "members" | "settings">("overview");
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedTicket, setSelectedTicket] = useState<Payment | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
    if (!loading && userData?.role !== "admin") router.push("/dashboard");
  }, [user, userData, loading, router]);

  useEffect(() => {
    if (user && userData?.role === "admin") loadAll();
  }, [user, userData]);

  const loadAll = async () => {
    const [mSnap, pSnap, sSnap] = await Promise.all([
      getDocs(query(collection(db, "users"), where("role", "==", "member"))),
      getDocs(collection(db, "payments")),
      getDoc(doc(db, "settings", "tontine")),
    ]);
    setMembers(mSnap.docs.map(d => d.data() as Member));
    setPayments(pSnap.docs.map(d => ({ id: d.id, ...d.data() }) as Payment));
    if (sSnap.exists()) setSettings(sSnap.data() as TontineSettings);
  };

  const validatePayment = async (paymentId: string) => {
    await updateDoc(doc(db, "payments", paymentId), { status: "validated", validatedAt: new Date().toISOString() });
    toast.success("Paiement validé !");
    await loadAll();
  };

  const rejectPayment = async (paymentId: string) => {
    await updateDoc(doc(db, "payments", paymentId), { status: "rejected" });
    toast("Paiement rejeté", { icon: "❌" });
    await loadAll();
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, "settings", "tontine"), settings);
      toast.success("Paramètres sauvegardés !");
    } catch {
      toast.error("Erreur de sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  // Stats
  const monthPayments = payments.filter(p => p.month === selectedMonth);
  const paidMembers = monthPayments.filter(p => p.status === "validated");
  const pendingPayments = payments.filter(p => p.status === "pending");
  const totalCollected = paidMembers.reduce((s, p) => s + p.amount, 0);
  const unpaidCount = members.length - paidMembers.length;

  const getMemberPayment = (uid: string) => monthPayments.find(p => p.memberId === uid);

  if (loading) return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ color: "var(--gold)" }}>Chargement...</span></div>;

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)" }}>
      <Navbar />

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "2rem 1rem" }}>

        {/* Header */}
        <div style={{ marginBottom: "1.5rem" }}>
          <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "1.8rem", fontWeight: 700, color: "var(--forest)" }}>
            Tableau de bord Admin
          </h1>
          <p style={{ color: "var(--text-muted)", marginTop: "0.25rem" }}>{settings.groupName}</p>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.75rem", borderBottom: "2px solid rgba(201,168,76,0.2)", paddingBottom: "0" }}>
          {(["overview", "members", "settings"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: "0.6rem 1.25rem", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: "0.9rem", color: activeTab === tab ? "var(--forest)" : "var(--text-muted)", borderBottom: `3px solid ${activeTab === tab ? "var(--gold)" : "transparent"}`, marginBottom: "-2px", transition: "all 0.15s" }}>
              {tab === "overview" ? "Vue d'ensemble" : tab === "members" ? "Membres" : "Paramètres"}
            </button>
          ))}
        </div>

        {/* ---- OVERVIEW TAB ---- */}
        {activeTab === "overview" && (
          <>
            {/* Stats cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "1.75rem" }}>
              {[
                { label: "Total encaissé", value: totalCollected.toLocaleString("fr-FR") + " F", color: "var(--forest)" },
                { label: "Membres ayant payé", value: `${paidMembers.length} / ${members.length}`, color: "#1A6B35" },
                { label: "Non payés", value: unpaidCount.toString(), color: "#B04A10" },
                { label: "En attente validation", value: pendingPayments.length.toString(), color: "#8B6914" },
              ].map(stat => (
                <div key={stat.label} style={{ background: "white", borderRadius: "14px", border: "1px solid rgba(201,168,76,0.2)", padding: "1.25rem" }}>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.78rem", marginBottom: "0.4rem" }}>{stat.label}</p>
                  <p style={{ fontFamily: "var(--font-heading)", fontSize: "1.5rem", fontWeight: 700, color: stat.color }}>{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Pending validations */}
            {pendingPayments.length > 0 && (
              <div className="card" style={{ marginBottom: "1.75rem", overflow: "hidden" }}>
                <div style={{ padding: "1.1rem 1.5rem", borderBottom: "1px solid rgba(201,168,76,0.15)", background: "#FFF8E6" }}>
                  <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1rem", fontWeight: 600, color: "#8B6914" }}>
                    ⏳ Paiements à valider ({pendingPayments.length})
                  </h3>
                </div>
                {pendingPayments.map(p => (
                  <div key={p.id} style={{ padding: "1rem 1.5rem", borderBottom: "1px solid rgba(0,0,0,0.04)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: "0.95rem" }}>{p.memberName}</p>
                      <p style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                        {new Date(p.month + "-01").toLocaleDateString("fr-FR", { month: "long", year: "numeric" })} · {p.method === "wave" ? "Wave 🌊" : "Orange Money 🟠"} · {p.amount.toLocaleString("fr-FR")} F
                      </p>
                      {p.screenshotUrl && (
                        <a href={p.screenshotUrl} target="_blank" rel="noreferrer" style={{ color: "var(--gold-dark)", fontSize: "0.8rem", fontWeight: 600 }}>
                          📷 Voir la capture d'écran
                        </a>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button onClick={() => rejectPayment(p.id)} style={{ background: "#FEECEC", color: "#A32D2D", border: "1px solid #F7C1C1", borderRadius: "8px", padding: "0.45rem 0.9rem", cursor: "pointer", fontWeight: 600, fontSize: "0.82rem" }}>
                        Rejeter
                      </button>
                      <button onClick={() => validatePayment(p.id)} style={{ background: "#E6F4EC", color: "#1A6B35", border: "1px solid #A8D5B5", borderRadius: "8px", padding: "0.45rem 0.9rem", cursor: "pointer", fontWeight: 600, fontSize: "0.82rem" }}>
                        ✅ Valider
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Month selector + member status */}
            <div className="card" style={{ overflow: "hidden" }}>
              <div style={{ padding: "1.1rem 1.5rem", borderBottom: "1px solid rgba(201,168,76,0.15)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
                <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1rem", fontWeight: 600, color: "var(--forest)" }}>
                  Statut des membres
                </h3>
                <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} style={{ width: "auto", padding: "0.4rem 0.75rem", fontSize: "0.85rem" }} />
              </div>

              {members.map(m => {
                const mp = getMemberPayment(m.uid);
                return (
                  <div key={m.uid} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 1.5rem", borderBottom: "1px solid rgba(0,0,0,0.04)", flexWrap: "wrap", gap: "0.5rem" }}>
                    <div>
                      <p style={{ fontWeight: 500, fontSize: "0.95rem" }}>{m.name}</p>
                      <p style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>{m.phone} · {m.email}</p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      {!mp && <span className="badge-unpaid">Non payé</span>}
                      {mp?.status === "pending" && <span className="badge-pending">En attente</span>}
                      {mp?.status === "validated" && <span className="badge-paid">✅ Payé</span>}
                      {mp && <button onClick={() => setSelectedTicket(mp)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--gold-dark)", fontSize: "0.82rem", fontWeight: 600, fontFamily: "var(--font-heading)" }}>Reçu →</button>}
                    </div>
                  </div>
                );
              })}

              {members.length === 0 && (
                <div style={{ padding: "2.5rem", textAlign: "center", color: "var(--text-muted)" }}>
                  <div style={{ fontSize: "1.8rem", marginBottom: "0.4rem" }}>👥</div>
                  <p>Aucun membre inscrit pour l'instant</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* ---- MEMBERS TAB ---- */}
        {activeTab === "members" && (
          <div className="card" style={{ overflow: "hidden" }}>
            <div style={{ padding: "1.1rem 1.5rem", borderBottom: "1px solid rgba(201,168,76,0.15)" }}>
              <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1rem", fontWeight: 600 }}>{members.length} membres</h3>
            </div>
            {members.map(m => {
              const paid = payments.filter(p => p.memberId === m.uid && p.status === "validated").length;
              return (
                <div key={m.uid} style={{ padding: "1rem 1.5rem", borderBottom: "1px solid rgba(0,0,0,0.04)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.9rem" }}>
                    <div style={{ width: 42, height: 42, borderRadius: "50%", background: "var(--forest)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "0.95rem" }}>
                      {m.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </div>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: "0.95rem" }}>{m.name}</p>
                      <p style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>{m.phone} · {m.email}</p>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontFamily: "var(--font-heading)", fontWeight: 700, color: "var(--forest)" }}>{paid} mois payés</p>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>{(paid * settings.monthlyAmount).toLocaleString("fr-FR")} F total</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ---- SETTINGS TAB ---- */}
        {activeTab === "settings" && (
          <div className="card" style={{ padding: "2rem", maxWidth: 520 }}>
            <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.1rem", fontWeight: 700, color: "var(--forest)", marginBottom: "1.5rem" }}>
              Paramètres de la tontine
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
              <div>
                <label>Nom du groupe</label>
                <input value={settings.groupName} onChange={e => setSettings({ ...settings, groupName: e.target.value })} />
              </div>
              <div>
                <label>Cotisation mensuelle (FCFA)</label>
                <input type="number" value={settings.monthlyAmount} onChange={e => setSettings({ ...settings, monthlyAmount: +e.target.value })} />
              </div>
              <div>
                <label>Numéro Wave de l'admin</label>
                <input placeholder="+221 77 000 00 00" value={settings.adminWaveNumber} onChange={e => setSettings({ ...settings, adminWaveNumber: e.target.value })} />
              </div>
              <div>
                <label>Numéro Orange Money de l'admin</label>
                <input placeholder="+221 77 000 00 00" value={settings.adminOmNumber} onChange={e => setSettings({ ...settings, adminOmNumber: e.target.value })} />
              </div>
              <button className="btn-gold" onClick={saveSettings} disabled={saving} style={{ marginTop: "0.5rem" }}>
                {saving ? "Sauvegarde..." : "Enregistrer les paramètres"}
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedTicket && <PaymentTicket payment={selectedTicket} onClose={() => setSelectedTicket(null)} />}
    </div>
  );
}
