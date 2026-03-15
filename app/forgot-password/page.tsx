"use client";
import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import Link from "next/link";
import toast from "react-hot-toast";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSent(true);
      toast.success("Email envoyé !");
    } catch {
      toast.error("Email introuvable. Vérifiez votre adresse.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--forest)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div style={{ width: "100%", maxWidth: "420px" }}>
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <div style={{ width: 64, height: 64, background: "var(--gold)", borderRadius: "16px", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem", fontSize: "1.8rem" }}>
            🔑
          </div>
          <h1 style={{ fontFamily: "var(--font-heading)", color: "white", fontSize: "1.8rem", fontWeight: 700 }}>Mot de passe oublié</h1>
          <p style={{ color: "rgba(255,255,255,0.55)", marginTop: "0.4rem", fontSize: "0.9rem" }}>
            On vous envoie un lien de réinitialisation
          </p>
        </div>

        <div className="card" style={{ padding: "2rem" }}>
          {!sent ? (
            <form onSubmit={handleReset} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div>
                <label>Votre adresse email</label>
                <input type="email" placeholder="vous@exemple.com" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <button className="btn-gold" type="submit" disabled={loading} style={{ width: "100%", opacity: loading ? 0.7 : 1 }}>
                {loading ? "Envoi..." : "Envoyer le lien"}
              </button>
            </form>
          ) : (
            <div style={{ textAlign: "center", padding: "1rem 0" }}>
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📧</div>
              <h3 style={{ fontFamily: "var(--font-heading)", color: "var(--forest)", fontWeight: 700, marginBottom: "0.75rem" }}>
                Email envoyé !
              </h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: 1.6 }}>
                Vérifiez votre boîte mail et cliquez sur le lien pour réinitialiser votre mot de passe.
              </p>
            </div>
          )}

          <p style={{ textAlign: "center", marginTop: "1.25rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>
            <Link href="/login" style={{ color: "var(--gold-dark)", fontWeight: 600, textDecoration: "none" }}>
              ← Retour à la connexion
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
