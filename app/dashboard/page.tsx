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
  const [screenshot, setScreenshot] = useState<File | null>(null);
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
        setScreenshot(file);
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const openPaymentLink = (method: "wave" | "orange") => {
    if (!settings) return;
    const amount = settings.monthlyAmount;
    if (method === "wave") {
      const waveNumber = settings.adminWaveNumber.replace(/\s/g, "");
      window.open(`https://www.wave.com/en/sn/send/?phone=${waveNumber}&amount=${amount}`, "_blank");
    } else {
      toast("Ouvrez Orange Money et envoyez " + amount.toLocaleString("fr-FR") + " FCFA au " + settings.adminOmNumber, { icon: "🟠", duration: 6000 });
    }
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
      setScreenshot(null);
      setScreenshotPreview("");
      setTransactionRef("");
      await loadData();
    } catch {
      toast.error("Erreur lors de la soumission");
    } finally {
      setPaying(false);
    }
  };

  if (loading) return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ color: "var(--gold)" }}>Chargement...</span></div>;

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)" }}>
      <Navbar />
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "2rem 1rem" }}>
        <div style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "1.8rem", fontWeight: 700, color: "var(--forest)" }}>
            Bonjour, {userData?.name?.split(" ")[0]} 👋
          </h1>
          <p style={{ color: "var(--text-muted)", marginTop: "0.25rem" }}>{settings?.groupName || "Tontine Familiale"}</p>
        </div>

        <div className="card" style={{ padding: "1.5rem", marginBottom: "1.5rem", borderLeft: `4px solid ${thisMonthPayment?.status === "validated" ? "#1A6B35" : thisMonthPayment?.status === "pending" ? "#8B6914" : "#B04A10"}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "0.3rem" }}>
                {new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
              </p>
              <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.4rem", fontWeight: 700, color: "var(--forest)" }}>
                {settings?.monthlyAmount?.toLocaleString("fr-FR") || "—"} FCFA
              </h2>
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "0.2rem" }}>Cotisation mensuelle</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.75rem" }}>
              {!thisMonthPayment && <span className="badge-unpaid">Non payé</span>}
              {thisMonthPayment?.status === "pending" && <span className="badge-pending">En attente de validation</span>}
              {thisMonthPayment?.status === "validated" && <span className="badge-paid">✅ Payé et validé</span>}
              {!thisMonthPayment && (
                <button className="btn-gold" onClick={() => setShowPayModal(true)} style={{ fontSize: "0.9rem" }}>
                  Payer maintenant
                </button>
              )}
              {thisMonthPayment && (
                <button className="btn-outline" onClick={() => setSelectedTicket(thisMonthPayment)} style={{ fontSize: "0.85rem" }}>
                  Voir le reçu
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="card" style={{ overflow: "hidden" }}>
          <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid rgba(201,168,76,0.15)" }}>
            <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.05rem", fontWeight: 600, color: "var(--forest)" }}>
              Historique des paiements
            </h3>
          </div>
          {payments.length === 0 ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
              <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📂</div>
              <p>Aucun paiement enregistré</p>
            </div>
          ) : (
            payments.sort((a, b) => b.month.localeCompare(a.month)).map(p => (
              <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 1.5rem", borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
                <div>
                  <p style={{ fontWeight: 500, fontSize: "0.95rem" }}>
                    {new Date(p.month + "-01").toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
                  </p>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "0.15rem" }}>
                    {p.method === "wave" ? "🌊 Wave" : "🟠 Orange Money"} · {p.amount.toLocaleString("fr-FR")} FCFA
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  {p.status === "validated" && <span className="badge-paid">Validé</span>}
                  {p.status === "pending" && <span className="badge-pending">En attente</span>}
                  <button onClick={() => setSelectedTicket(p)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--gold-dark)", fontSize: "0.82rem", fontWeight: 600, fontFamily: "var(--font-heading)" }}>
                    Reçu →
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showPayModal && settings && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(26,58,42,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "1rem" }}>
          <div className="card" style={{ maxWidth: 460, width: "100%", padding: "2rem", maxHeight: "90vh", overflowY: "auto" }}>
            <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.3rem", fontWeight: 700, color: "var(--forest)", marginBottom: "1.5rem" }}>
              Payer ma cotisation
            </h2>
            <div style={{ background: "var(--cream)", borderRadius: "12px", padding: "1rem", marginBottom: "1.5rem" }}>
              <p style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>Montant à payer</p>
              <p style={{ fontFamily: "var(--font-heading)", fontSize: "1.6rem", fontWeight: 700, color: "var(--forest)" }}>
                {settings.monthlyAmount.toLocaleString("fr-FR")} FCFA
              </p>
            </div>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "0.75rem" }}>Choisissez votre méthode</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1.5rem" }}>
              {(["wave", "orange"] as const).map(m => (
                <button key={m} onClick={() => setPayMethod(m)} style={{ padding: "0.9rem", border: `2px solid ${payMethod === m ? (m === "wave" ? "#2196F3" : "#FF6600") : "#e0d8c0"}`, borderRadius: "12px", background: payMethod === m ? (m === "wave" ? "#E3F2FD" : "#FFF3E0") : "white", cursor: "pointer", fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: "0.9rem", color: m === "wave" ? "#1565C0" : "#E65100", transition: "all 0.2s" }}>
                  {m === "wave" ? "🌊 Wave" : "🟠 Orange Money"}
                </button>
              ))}
            </div>
            <div style={{ background: "var(--cream)", borderRadius: "12px", padding: "1.25rem", marginBottom: "1.25rem" }}>
              <p style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--forest)", marginBottom: "0.5rem" }}>Étape 1 — Effectuer le transfert</p>
              <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginBottom: "1rem" }}>
                Envoyez {settings.monthlyAmount.toLocaleString("fr-FR")} FCFA au numéro de l'admin.
              </p>
              <button className="btn-gold" onClick={() => openPaymentLink(payMethod)} style={{ width: "100%", fontSize: "0.9rem" }}>
                {payMethod === "wave" ? "🌊 Ouvrir Wave" : "🟠 Voir le numéro Orange Money"}
              </button>
            </div>
            <div style={{ marginBottom: "1.25rem" }}>
              <p style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--forest)", marginBottom: "0.5rem" }}>Étape 2 — Joindre la capture d'écran</p>
              <label style={{ display: "block", border: `2px dashed ${screenshotPreview ? "#A8D5B5" : "#e0d8c0"}`, borderRadius: "12px", padding: "1rem", textAlign: "center", cursor: "pointer", background: screenshotPreview ? "#E6F4EC" : "white", transition: "all 0.2s" }}>
                <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileChange} />
                {screenshotPreview ? (
                  <div>
                    <img src={screenshotPreview} alt="preview" style={{ maxHeight: 120, borderRadius: 8, marginBottom: 8 }} />
                    <p style={{ color: "#1A6B35", fontWeight: 600, fontSize: "0.85rem" }}>✅ Image ajoutée</p>
                  </div>
                ) : (
                  <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>📷 Cliquez pour joindre une capture d'écran</span>
                )}
              </label>
            </div>
            <div style={{ marginBottom: "1.5rem" }}>
              <label>Référence de transaction (optionnel)</label>
              <input placeholder="Ex: TXN123456" value={transactionRef} onChange={e => setTransactionRef(e.target.value)} />
            </div>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button className="btn-outline" onClick={() => setShowPayModal(false)} style={{ flex: 1 }}>Annuler</button>
              <button className="btn-gold" onClick={handleSubmitPayment} disabled={paying} style={{ flex: 2, opacity: paying ? 0.7 : 1 }}>
                {paying ? "Envoi en cours..." : "Confirmer le paiement"}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedTicket && <PaymentTicket payment={selectedTicket} onClose={() => setSelectedTicket(null)} />}
    </div>
  );
}