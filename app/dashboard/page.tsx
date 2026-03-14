"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, addDoc, doc, getDoc } from "firebase/firestore";
import Navbar from "@/components/Navbar";
import PaymentTicket from "@/components/PaymentTicket";
import toast from "react-hot-toast";

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

export default function Dashboard() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [settings, setSettings] = useState<TontineSettings | null>(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Payment | null>(null);
  const [payMethod, setPayMethod] = useState<"wave" | "orange">("wave");
  const [screenshotPreview, setScreenshotPreview] = useState<string>("");
  const [transactionRef, setTransactionRef] = useState("");
  const [paying, setPaying] = useState(false);

  const currentMonth = new Date().toISOString().slice(0, 7);
  const thisMonthPayment = payments.find(p => p.month === currentMonth);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
    if (!loading && userData?.role === "admin") router.push("/admin");
  }, [user, userData, loading, router]);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    const q = query(collection(db, "payments"), where("memberId", "==", user.uid));
    const snap = await getDocs(q);
    setPayments(snap.docs.map(d => ({ id: d.id, ...d.data() }) as Payment));
    const settingsDoc = await getDoc(doc(db, "settings", "tontine"));
    if (settingsDoc.exists()) setSettings(settingsDoc.data() as TontineSettings);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX = 800;
        let w = img.width, h = img.height;
        if (w > MAX) { h = h * MAX / w; w = MAX; }
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d")?.drawImage(img, 0, 0, w, h);
        const base64 = canvas.toDataURL("image/jpeg", 0.7);
        setScreenshotPreview(base64);
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const openPaymentLink = (method: "wave" | "orange") => {
    if (!settings) return;
    const amount = settings.monthlyAmount;
    const number = method === "wave" ? settings.adminWaveNumber : settings.adminOmNumber;
    navigator.clipboard.writeText(number.replace(/\s/g, ""));
    toast.success(
      `Numéro copié ! Ouvrez ${method === "wave" ? "Wave 🌊" : "Orange Money 🟠"} et envoyez ${amount.toLocaleString("fr-FR")} FCFA au ${number}`,
      { duration: 8000 }
    );
  };

  const handleSubmitPayment = async () => {
    if (!user || !userData || !settings) return;
    if (!screenshotPreview) { toast.error("Veuillez joindre une capture d'écran"); return; }
    setPaying(true);
    try {
      await addDoc(collection(db, "payments"), {
        memberId: user.uid,
        memberName: userData.name,
        memberPhone: userData.phone,
        amount: settings.monthlyAmount,
        month: currentMonth,
        method: payMethod,
        status: "pending",
        screenshotBase64: screenshotPreview,
        transactionRef,
        paidAt: new Date().toISOString(),
      });
      toast.success("Paiement soumis ! L'admin va valider votre transaction.");
      setShowPayModal(false);
      setScreenshotPreview("");
      setTransactionRef("");
      await loadData();
    } catch {
      toast.error("Erreur lors de la soumission");
    } finally {
      setPaying(false);
    }
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span style={{ color: "var(--gold)" }}>Chargement...</span>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)" }}>
      <Navbar />

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "1.25rem 1rem" }}>

        {/* Welcome */}
        <div style={{ marginBottom: "1.25rem" }}>
          <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(1.3rem, 5vw, 1.8rem)", fontWeight: 700, color: "var(--forest)" }}>
            Bonjour, {userData?.name?.split(" ")[0]} 👋
          </h1>
          <p style={{ color: "var(--text-muted)", marginTop: "0.25rem", fontSize: "0.9rem" }}>
            {settings?.groupName || "Tontine Familiale"}
          </p>
        </div>

        {/* Current month card */}
        <div className="card" style={{
          padding: "1.25rem",
          marginBottom: "1.25rem",
          borderLeft: `4px solid ${thisMonthPayment?.status === "validated" ? "#1A6B35" : thisMonthPayment?.status === "pending" ? "#8B6914" : "#B04A10"}`
        }}>
          <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginBottom: "0.25rem" }}>
            {new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
          </p>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(1.2rem, 5vw, 1.4rem)", fontWeight: 700, color: "var(--forest)", marginBottom: "0.25rem" }}>
            {settings?.monthlyAmount?.toLocaleString("fr-FR") || "—"} FCFA
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginBottom: "1rem" }}>Cotisation mensuelle</p>

          {/* Status + actions stacked on mobile */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div>
              {!thisMonthPayment && <span className="badge-unpaid">Non payé</span>}
              {thisMonthPayment?.status === "pending" && <span className="badge-pending">En attente de validation</span>}
              {thisMonthPayment?.status === "validated" && <span className="badge-paid">✅ Payé et validé</span>}
            </div>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              {!thisMonthPayment && (
                <button className="btn-gold" onClick={() => setShowPayModal(true)} style={{ fontSize: "0.9rem", flex: 1, minWidth: 140 }}>
                  Payer maintenant
                </button>
              )}
              {thisMonthPayment && (
                <button className="btn-outline" onClick={() => setSelectedTicket(thisMonthPayment)} style={{ fontSize: "0.85rem", flex: 1, minWidth: 140 }}>
                  Voir le reçu
                </button>
              )}
            </div>
          </div>
        </div>

        {/* History */}
        <div className="card" style={{ overflow: "hidden" }}>
          <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid rgba(201,168,76,0.15)" }}>
            <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1rem", fontWeight: 600, color: "var(--forest)" }}>
              Historique des paiements
            </h3>
          </div>
          {payments.length === 0 ? (
            <div style={{ padding: "2.5rem 1rem", textAlign: "center", color: "var(--text-muted)" }}>
              <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📂</div>
              <p style={{ fontSize: "0.9rem" }}>Aucun paiement enregistré</p>
            </div>
          ) : (
            payments.sort((a, b) => b.month.localeCompare(a.month)).map(p => (
              <div key={p.id} style={{ padding: "0.9rem 1.25rem", borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 500, fontSize: "0.9rem", marginBottom: "0.15rem" }}>
                      {new Date(p.month + "-01").toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
                    </p>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>
                      {p.method === "wave" ? "🌊 Wave" : "🟠 Orange Money"} · {p.amount.toLocaleString("fr-FR")} FCFA
                    </p>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.4rem", flexShrink: 0 }}>
                    {p.status === "validated" && <span className="badge-paid">Validé</span>}
                    {p.status === "pending" && <span className="badge-pending">En attente</span>}
                    <button onClick={() => setSelectedTicket(p)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--gold-dark)", fontSize: "0.82rem", fontWeight: 600, fontFamily: "var(--font-heading)", padding: 0 }}>
                      Reçu →
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Pay Modal — full screen on mobile */}
      {showPayModal && settings && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(26,58,42,0.75)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 100 }}>
          <div className="card" style={{
            width: "100%",
            maxWidth: 520,
            padding: "1.5rem",
            maxHeight: "92vh",
            overflowY: "auto",
            borderRadius: "20px 20px 0 0",
            borderBottom: "none"
          }}>
            {/* Handle */}
            <div style={{ width: 40, height: 4, background: "#e0d8c0", borderRadius: 4, margin: "0 auto 1.25rem" }} />

            <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.2rem", fontWeight: 700, color: "var(--forest)", marginBottom: "1.25rem" }}>
              Payer ma cotisation
            </h2>

            {/* Amount */}
            <div style={{ background: "var(--cream)", borderRadius: "12px", padding: "0.9rem 1rem", marginBottom: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <p style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>Montant</p>
              <p style={{ fontFamily: "var(--font-heading)", fontSize: "1.4rem", fontWeight: 700, color: "var(--forest)" }}>
                {settings.monthlyAmount.toLocaleString("fr-FR")} FCFA
              </p>
            </div>

            {/* Method */}
            <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginBottom: "0.6rem" }}>Méthode de paiement</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem", marginBottom: "1.25rem" }}>
              {(["wave", "orange"] as const).map(m => (
                <button key={m} onClick={() => setPayMethod(m)} style={{
                  padding: "0.8rem 0.5rem",
                  border: `2px solid ${payMethod === m ? (m === "wave" ? "#2196F3" : "#FF6600") : "#e0d8c0"}`,
                  borderRadius: "12px",
                  background: payMethod === m ? (m === "wave" ? "#E3F2FD" : "#FFF3E0") : "white",
                  cursor: "pointer",
                  fontFamily: "var(--font-heading)",
                  fontWeight: 600,
                  fontSize: "0.88rem",
                  color: m === "wave" ? "#1565C0" : "#E65100",
                  transition: "all 0.2s"
                }}>
                  {m === "wave" ? "🌊 Wave" : "🟠 Orange Money"}
                </button>
              ))}
            </div>

            {/* Step 1 */}
            <div style={{ background: "var(--cream)", borderRadius: "12px", padding: "1rem", marginBottom: "1rem" }}>
              <p style={{ fontWeight: 600, fontSize: "0.88rem", color: "var(--forest)", marginBottom: "0.4rem" }}>
                Étape 1 — Effectuer le transfert
              </p>
              <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginBottom: "0.9rem" }}>
                Le numéro sera copié. Ouvrez {payMethod === "wave" ? "Wave" : "Orange Money"} et envoyez {settings.monthlyAmount.toLocaleString("fr-FR")} FCFA.
              </p>
              <button className="btn-gold" onClick={() => openPaymentLink(payMethod)} style={{ width: "100%", fontSize: "0.88rem" }}>
                {payMethod === "wave" ? "🌊 Copier le numéro Wave" : "🟠 Copier le numéro Orange Money"}
              </button>
            </div>

            {/* Step 2 */}
            <div style={{ marginBottom: "1rem" }}>
              <p style={{ fontWeight: 600, fontSize: "0.88rem", color: "var(--forest)", marginBottom: "0.4rem" }}>
                Étape 2 — Joindre la capture d'écran
              </p>
              <label style={{
                display: "block",
                border: `2px dashed ${screenshotPreview ? "#A8D5B5" : "#e0d8c0"}`,
                borderRadius: "12px",
                padding: "1rem",
                textAlign: "center",
                cursor: "pointer",
                background: screenshotPreview ? "#E6F4EC" : "white"
              }}>
                <input type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={handleFileChange} />
                {screenshotPreview ? (
                  <div>
                    <img src={screenshotPreview} alt="preview" style={{ maxHeight: 100, borderRadius: 8, marginBottom: 6 }} />
                    <p style={{ color: "#1A6B35", fontWeight: 600, fontSize: "0.82rem" }}>✅ Image ajoutée</p>
                  </div>
                ) : (
                  <p style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>📷 Appuyez pour joindre une capture</p>
                )}
              </label>
            </div>

            {/* Ref */}
            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ fontSize: "0.82rem" }}>Référence de transaction (optionnel)</label>
              <input placeholder="Ex: TXN123456" value={transactionRef} onChange={e => setTransactionRef(e.target.value)} style={{ fontSize: "0.9rem" }} />
            </div>

            {/* Actions */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "0.6rem" }}>
              <button className="btn-outline" onClick={() => setShowPayModal(false)} style={{ fontSize: "0.88rem" }}>Annuler</button>
              <button className="btn-gold" onClick={handleSubmitPayment} disabled={paying} style={{ fontSize: "0.88rem", opacity: paying ? 0.7 : 1 }}>
                {paying ? "Envoi..." : "Confirmer le paiement"}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedTicket && <PaymentTicket payment={selectedTicket} onClose={() => setSelectedTicket(null)} />}
    </div>
  );
}