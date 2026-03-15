"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc, setDoc, getDoc, query, where } from "firebase/firestore";
import Navbar from "@/components/Navbar";
import PaymentTicket from "@/components/PaymentTicket";
import Link from "next/link";
import toast from "react-hot-toast";

interface Member {
  uid: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
}

interface Payment {
  id: string;
  memberId: string;
  memberName: string;
  amount: number;
  month: string;
  method: string;
  status: string;
  screenshotBase64?: string;
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
  const [pendingMembers, setPendingMembers] = useState<Member[]>([]);
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
    const [mSnap, pSnap, pmSnap, sSnap] = await Promise.all([
      getDocs(query(collection(db, "users"), where("role", "==", "member"), where("status", "==", "approved"))),
      getDocs(collection(db, "payments")),
      getDocs(query(collection(db, "users"), where("role", "==", "member"), where("status", "==", "pending"))),
      getDoc(doc(db, "settings", "tontine")),
    ]);
    setMembers(mSnap.docs.map(d => d.data() as Member));
    setPayments(pSnap.docs.map(d => ({ id: d.id, ...d.data() }) as Payment));
    setPendingMembers(pmSnap.docs.map(d => d.data() as Member));
    if (sSnap.exists()) setSettings(sSnap.data() as TontineSettings);
  };

  const approveMember = async (uid: string) => {
    await updateDoc(doc(db, "users", uid), { status: "approved" });
    toast.success("Membre approuvé !");
    await loadAll();
  };

  const rejectMember = async (uid: string) => {
    await updateDoc(doc(db, "users", uid), { status: "rejected" });
    toast("Membre rejeté", { icon: "❌" });
    await loadAll();
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

  const monthPayments = payments.filter(p => p.month === selectedMonth);
  const paidMembers = monthPayments.filter(p => p.status === "validated");
  const pendingPayments = payments.filter(p => p.status === "pending");
  const totalCollected = paidMembers.reduce((s, p) => s + p.amount, 0);
  const unpaidCount = members.length - paidMembers.length;
  const getMemberPayment = (uid: string) => monthPayments.find(p => p.memberId === uid);

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span style={{ color: "var(--gold)" }}>Chargement...</span>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)" }}>
      <Navbar />

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "1.25rem 1rem" }}>

        <div style={{ marginBottom: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
          <div>
            <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(1.3rem, 5vw, 1.8rem)", fontWeight: 700, color: "var(--forest)" }}>
              Dashboard Admin
            </h1>
            <p style={{ color: "var(--text-muted)", marginTop: "0.25rem", fontSize: "0.88rem" }}>{settings.groupName}</p>
          </div>
          <Link href="/stats" style={{ background: "var(--forest)", color: "var(--gold)", textDecoration: "none", fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: "0.85rem", padding: "0.5rem 1rem", borderRadius: "10px", border: "1px solid rgba(201,168,76,0.3)", whiteSpace: "nowrap" }}>
            📊 Statistiques
          </Link>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", marginBottom: "1.5rem", borderBottom: "2px solid rgba(201,168,76,0.2)", overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          {(["overview", "members", "settings"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: "0.6rem 1rem",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: "var(--font-heading)",
              fontWeight: 600,
              fontSize: "0.88rem",
              color: activeTab === tab ? "var(--forest)" : "var(--text-muted)",
              borderBottom: `3px solid ${activeTab === tab ? "var(--gold)" : "transparent"}`,
              marginBottom: "-2px",
              whiteSpace: "nowrap",
              transition: "all 0.15s"
            }}>
              {tab === "overview" ? "Vue d'ensemble" : tab === "members" ? `Membres` : "Paramètres"}
            </button>
          ))}
        </div>

        {/* ---- OVERVIEW ---- */}
        {activeTab === "overview" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.75rem", marginBottom: "1.5rem" }}>
              {[
                { label: "Total encaissé", value: totalCollected.toLocaleString("fr-FR") + " F", color: "var(--forest)" },
                { label: "Ont payé", value: `${paidMembers.length}/${members.length}`, color: "#1A6B35" },
                { label: "Non payés", value: unpaidCount.toString(), color: "#B04A10" },
                { label: "En attente", value: pendingPayments.length.toString(), color: "#8B6914" },
              ].map(stat => (
                <div key={stat.label} style={{ background: "white", borderRadius: "14px", border: "1px solid rgba(201,168,76,0.2)", padding: "1rem" }}>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginBottom: "0.3rem" }}>{stat.label}</p>
                  <p style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(1.1rem, 4vw, 1.4rem)", fontWeight: 700, color: stat.color }}>{stat.value}</p>
                </div>
              ))}
            </div>

            {pendingMembers.length > 0 && (
              <div className="card" style={{ marginBottom: "1.5rem", overflow: "hidden" }}>
                <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid rgba(201,168,76,0.15)", background: "#F0F7FF" }}>
                  <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "0.95rem", fontWeight: 600, color: "#185FA5" }}>
                    👤 Nouveaux membres à approuver ({pendingMembers.length})
                  </h3>
                </div>
                {pendingMembers.map(m => (
                  <div key={m.uid} style={{ padding: "1rem 1.25rem", borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
                    <div style={{ marginBottom: "0.75rem" }}>
                      <p style={{ fontWeight: 600, fontSize: "0.92rem" }}>{m.name}</p>
                      <p style={{ color: "var(--text-muted)", fontSize: "0.78rem", marginTop: "0.15rem" }}>
                        {m.phone} · {m.email}
                      </p>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                      <button onClick={() => rejectMember(m.uid)} style={{ background: "#FEECEC", color: "#A32D2D", border: "1px solid #F7C1C1", borderRadius: "8px", padding: "0.5rem", cursor: "pointer", fontWeight: 600, fontSize: "0.82rem" }}>
                        ✕ Rejeter
                      </button>
                      <button onClick={() => approveMember(m.uid)} style={{ background: "#E6F4EC", color: "#1A6B35", border: "1px solid #A8D5B5", borderRadius: "8px", padding: "0.5rem", cursor: "pointer", fontWeight: 600, fontSize: "0.82rem" }}>
                        ✓ Approuver
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {pendingPayments.length > 0 && (
              <div className="card" style={{ marginBottom: "1.5rem", overflow: "hidden" }}>
                <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid rgba(201,168,76,0.15)", background: "#FFF8E6" }}>
                  <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "0.95rem", fontWeight: 600, color: "#8B6914" }}>
                    ⏳ Paiements à valider ({pendingPayments.length})
                  </h3>
                </div>
                {pendingPayments.map(p => (
                  <div key={p.id} style={{ padding: "1rem 1.25rem", borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
                    <div style={{ marginBottom: "0.75rem" }}>
                      <p style={{ fontWeight: 600, fontSize: "0.92rem" }}>{p.memberName}</p>
                      <p style={{ color: "var(--text-muted)", fontSize: "0.78rem", marginTop: "0.15rem" }}>
                        {new Date(p.month + "-01").toLocaleDateString("fr-FR", { month: "long", year: "numeric" })} · {p.method === "wave" ? "Wave 🌊" : "OM 🟠"} · {p.amount.toLocaleString("fr-FR")} F
                      </p>
                      {p.screenshotBase64 && (
                        <img src={p.screenshotBase64} alt="preuve" style={{ maxHeight: 80, borderRadius: 6, marginTop: 6 }} />
                      )}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                      <button onClick={() => rejectPayment(p.id)} style={{ background: "#FEECEC", color: "#A32D2D", border: "1px solid #F7C1C1", borderRadius: "8px", padding: "0.5rem", cursor: "pointer", fontWeight: 600, fontSize: "0.82rem" }}>
                        ✕ Rejeter
                      </button>
                      <button onClick={() => validatePayment(p.id)} style={{ background: "#E6F4EC", color: "#1A6B35", border: "1px solid #A8D5B5", borderRadius: "8px", padding: "0.5rem", cursor: "pointer", fontWeight: 600, fontSize: "0.82rem" }}>
                        ✓ Valider
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="card" style={{ overflow: "hidden" }}>
              <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid rgba(201,168,76,0.15)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
                  <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "0.95rem", fontWeight: 600, color: "var(--forest)" }}>
                    Statut des membres
                  </h3>
                  <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} style={{ width: "auto", padding: "0.35rem 0.6rem", fontSize: "0.82rem" }} />
                </div>
              </div>
              {members.length === 0 ? (
                <div style={{ padding: "2.5rem 1rem", textAlign: "center", color: "var(--text-muted)" }}>
                  <div style={{ fontSize: "1.8rem", marginBottom: "0.4rem" }}>👥</div>
                  <p style={{ fontSize: "0.88rem" }}>Aucun membre approuvé</p>
                </div>
              ) : members.map(m => {
                const mp = getMemberPayment(m.uid);
                return (
                  <div key={m.uid} style={{ padding: "0.9rem 1.25rem", borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 500, fontSize: "0.9rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</p>
                        <p style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginTop: "0.1rem" }}>{m.phone}</p>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
                        {!mp && <span className="badge-unpaid">Non payé</span>}
                        {mp?.status === "pending" && <span className="badge-pending">En attente</span>}
                        {mp?.status === "validated" && <span className="badge-paid">✅ Payé</span>}
                        {mp && (
                          <button onClick={() => setSelectedTicket(mp)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--gold-dark)", fontSize: "0.8rem", fontWeight: 600, fontFamily: "var(--font-heading)", padding: 0 }}>
                            Reçu →
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ---- MEMBERS ---- */}
        {activeTab === "members" && (
          <div className="card" style={{ overflow: "hidden" }}>
            <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid rgba(201,168,76,0.15)" }}>
              <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "0.95rem", fontWeight: 600 }}>{members.length} membres approuvés</h3>
            </div>
            {members.length === 0 ? (
              <div style={{ padding: "2.5rem 1rem", textAlign: "center", color: "var(--text-muted)" }}>
                <div style={{ fontSize: "1.8rem", marginBottom: "0.4rem" }}>👥</div>
                <p style={{ fontSize: "0.88rem" }}>Aucun membre approuvé</p>
              </div>
            ) : members.map(m => {
              const paid = payments.filter(p => p.memberId === m.uid && p.status === "validated").length;
              return (
                <div key={m.uid} style={{ padding: "1rem 1.25rem", borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: 1, minWidth: 0 }}>
                      <div style={{ width: 38, height: 38, borderRadius: "50%", background: "var(--forest)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "0.85rem", flexShrink: 0 }}>
                        {m.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontWeight: 600, fontSize: "0.88rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</p>
                        <p style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>{m.phone}</p>
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <p style={{ fontFamily: "var(--font-heading)", fontWeight: 700, color: "var(--forest)", fontSize: "0.9rem" }}>{paid} mois</p>
                      <p style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>{(paid * settings.monthlyAmount).toLocaleString("fr-FR")} F</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ---- SETTINGS ---- */}
        {activeTab === "settings" && (
          <div className="card" style={{ padding: "1.5rem" }}>
            <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1rem", fontWeight: 700, color: "var(--forest)", marginBottom: "1.25rem" }}>
              Paramètres de la tontine
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label>Nom du groupe</label>
                <input value={settings.groupName} onChange={e => setSettings({ ...settings, groupName: e.target.value })} />
              </div>
              <div>
                <label>Cotisation mensuelle (FCFA)</label>
                <input type="number" value={settings.monthlyAmount} onChange={e => setSettings({ ...settings, monthlyAmount: +e.target.value })} />
              </div>
              <div>
                <label>Numéro Wave</label>
                <input placeholder="+221760219352" value={settings.adminWaveNumber} onChange={e => setSettings({ ...settings, adminWaveNumber: e.target.value })} />
              </div>
              <div>
                <label>Numéro Orange Money</label>
                <input placeholder="+221770000000" value={settings.adminOmNumber} onChange={e => setSettings({ ...settings, adminOmNumber: e.target.value })} />
              </div>
              <button className="btn-gold" onClick={saveSettings} disabled={saving} style={{ marginTop: "0.25rem" }}>
                {saving ? "Sauvegarde..." : "Enregistrer"}
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedTicket && <PaymentTicket payment={selectedTicket} onClose={() => setSelectedTicket(null)} />}
    </div>
  );
}