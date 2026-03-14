"use client";
import { useRef } from "react";

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

export default function PaymentTicket({ payment, onClose }: { payment: Payment; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  const monthLabel = new Date(payment.month + "-01").toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  const paidDate = new Date(payment.paidAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(26,58,42,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" }}>
      <div style={{ background: "white", borderRadius: "20px", maxWidth: "420px", width: "100%", overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>

        {/* Header */}
        <div style={{ background: "var(--forest)", padding: "1.5rem", textAlign: "center" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>✅</div>
          <h2 style={{ fontFamily: "var(--font-heading)", color: "white", fontSize: "1.3rem", fontWeight: 700 }}>
            Paiement {payment.status === "validated" ? "Confirmé" : "En attente"}
          </h2>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.85rem", marginTop: "0.25rem" }}>Reçu officiel</p>
        </div>

        {/* Ticket body */}
        <div ref={ref} style={{ padding: "1.5rem" }}>
          {/* Dashed separator */}
          <div style={{ borderTop: "2px dashed #e0d8c0", marginBottom: "1.5rem", position: "relative" }}>
            <div style={{ position: "absolute", width: 24, height: 24, borderRadius: "50%", background: "var(--cream)", border: "2px dashed #e0d8c0", top: -12, left: -30 }} />
            <div style={{ position: "absolute", width: 24, height: 24, borderRadius: "50%", background: "var(--cream)", border: "2px dashed #e0d8c0", top: -12, right: -30 }} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
            <Row label="Membre" value={payment.memberName} />
            <Row label="Mois concerné" value={monthLabel} />
            <Row label="Montant" value={payment.amount.toLocaleString("fr-FR") + " FCFA"} highlight />
            <Row label="Méthode" value={payment.method === "wave" ? "🌊 Wave" : "🟠 Orange Money"} />
            <Row label="Date de paiement" value={paidDate} />
            {payment.transactionRef && <Row label="Référence" value={payment.transactionRef} mono />}
            <Row label="Statut" value={payment.status === "validated" ? "✅ Validé par l'admin" : "⏳ En attente de validation"} />
          </div>

          <div style={{ borderTop: "2px dashed #e0d8c0", margin: "1.5rem 0 1rem" }} />

          <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.78rem" }}>
            🤝 Tontine Familiale — Reçu #{payment.id.slice(-8).toUpperCase()}
          </div>
        </div>

        <div style={{ padding: "1rem 1.5rem 1.5rem", display: "flex", gap: "0.75rem" }}>
          <button className="btn-outline" onClick={onClose} style={{ flex: 1 }}>Fermer</button>
          <button className="btn-gold" onClick={() => window.print()} style={{ flex: 1 }}>Imprimer</button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, highlight, mono }: { label: string; value: string; highlight?: boolean; mono?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
      <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{label}</span>
      <span style={{ fontWeight: highlight ? 700 : 500, fontSize: highlight ? "1.05rem" : "0.9rem", color: highlight ? "var(--forest)" : "var(--text-main)", fontFamily: mono ? "monospace" : "inherit", textAlign: "right", maxWidth: "55%" }}>{value}</span>
    </div>
  );
}
