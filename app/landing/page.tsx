"use client";
import Link from "next/link";
import { useEffect, useRef } from "react";

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 20;
      const y = (e.clientY / window.innerHeight - 0.5) * 20;
      el.style.transform = `translate(${x}px, ${y}px)`;
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "var(--forest)", overflowX: "hidden" }}>

      {/* Nav */}
      <nav style={{ padding: "1.25rem 2rem", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 50, background: "rgba(26,58,42,0.9)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(201,168,76,0.15)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <span style={{ fontSize: "1.4rem" }}>🤝</span>
          <span style={{ fontFamily: "var(--font-heading)", color: "white", fontWeight: 700, fontSize: "1.1rem" }}>Tontine Familiale</span>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <Link href="/login" style={{ color: "rgba(255,255,255,0.75)", textDecoration: "none", fontSize: "0.9rem", fontFamily: "var(--font-heading)", fontWeight: 500, padding: "0.45rem 1rem" }}>
            Connexion
          </Link>
          <Link href="/register" style={{ background: "var(--gold)", color: "#1A1A14", textDecoration: "none", fontSize: "0.9rem", fontFamily: "var(--font-heading)", fontWeight: 700, padding: "0.45rem 1.25rem", borderRadius: "8px" }}>
            S'inscrire
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ minHeight: "90vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "4rem 1.5rem", position: "relative", overflow: "hidden" }}>
        <div ref={heroRef} style={{ position: "absolute", inset: 0, pointerEvents: "none", transition: "transform 0.1s ease-out" }}>
          <div style={{ position: "absolute", top: "10%", right: "5%", width: 300, height: 300, borderRadius: "50%", background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.15)" }} />
          <div style={{ position: "absolute", top: "20%", right: "10%", width: 180, height: 180, borderRadius: "50%", background: "rgba(201,168,76,0.05)", border: "1px solid rgba(201,168,76,0.1)" }} />
          <div style={{ position: "absolute", bottom: "15%", left: "5%", width: 250, height: 250, borderRadius: "50%", background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.12)" }} />
        </div>

        <div style={{ maxWidth: 700, textAlign: "center", position: "relative", zIndex: 1 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.3)", borderRadius: "20px", padding: "0.4rem 1rem", marginBottom: "2rem" }}>
            <span style={{ fontSize: "0.85rem" }}>✨</span>
            <span style={{ color: "var(--gold-light)", fontSize: "0.82rem", fontFamily: "var(--font-heading)", fontWeight: 600, letterSpacing: "0.05em" }}>GESTION DE TONTINE SIMPLIFIÉE</span>
          </div>

          <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(2.2rem, 8vw, 4.5rem)", fontWeight: 700, color: "white", lineHeight: 1.1, marginBottom: "1.5rem", letterSpacing: "-0.02em" }}>
            La tontine de votre famille,{" "}
            <span style={{ color: "var(--gold)" }}>digitalisée</span>
          </h1>

          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "clamp(1rem, 2.5vw, 1.2rem)", lineHeight: 1.7, marginBottom: "2.5rem", maxWidth: 520, margin: "0 auto 2.5rem" }}>
            Gérez vos cotisations mensuelles, suivez les paiements Wave et Orange Money, et gardez toute la famille informée en temps réel.
          </p>

          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/register" style={{ background: "var(--gold)", color: "#1A1A14", textDecoration: "none", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "1rem", padding: "0.9rem 2rem", borderRadius: "12px", display: "inline-block" }}>
              Rejoindre la tontine →
            </Link>
            <Link href="/login" style={{ background: "rgba(255,255,255,0.08)", color: "white", textDecoration: "none", fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: "1rem", padding: "0.9rem 2rem", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.15)", display: "inline-block" }}>
              Se connecter
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: "5rem 1.5rem", background: "rgba(0,0,0,0.2)" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "var(--font-heading)", color: "white", fontSize: "clamp(1.6rem, 4vw, 2.2rem)", fontWeight: 700, textAlign: "center", marginBottom: "0.75rem" }}>
            Tout ce dont vous avez besoin
          </h2>
          <p style={{ color: "rgba(255,255,255,0.5)", textAlign: "center", marginBottom: "3rem", fontSize: "0.95rem" }}>
            Simple, transparent et accessible depuis n'importe quel appareil
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.25rem" }}>
            {[
              { icon: "🌊", title: "Paiement Wave & Orange Money", desc: "Payez votre cotisation directement depuis l'app. Le numéro de l'admin est copié automatiquement." },
              { icon: "✅", title: "Validation par l'admin", desc: "L'admin vérifie chaque paiement et valide en un clic. Le membre reçoit son ticket instantanément." },
              { icon: "📊", title: "Suivi en temps réel", desc: "Voyez qui a payé, qui n'a pas encore payé, et le total encaissé pour chaque mois." },
              { icon: "🎫", title: "Tickets de paiement", desc: "Chaque paiement validé génère un reçu officiel imprimable avec tous les détails." },
              { icon: "👤", title: "Approbation des membres", desc: "L'admin contrôle qui peut rejoindre la tontine. Aucun accès sans validation préalable." },
              { icon: "📱", title: "100% mobile", desc: "Conçu pour être utilisé depuis votre téléphone. Installez-le comme une vraie application." },
            ].map(f => (
              <div key={f.title} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(201,168,76,0.15)", borderRadius: "16px", padding: "1.5rem" }}>
                <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>{f.icon}</div>
                <h3 style={{ fontFamily: "var(--font-heading)", color: "white", fontSize: "1rem", fontWeight: 600, marginBottom: "0.5rem" }}>{f.title}</h3>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.85rem", lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: "5rem 1.5rem" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "var(--font-heading)", color: "white", fontSize: "clamp(1.6rem, 4vw, 2.2rem)", fontWeight: 700, textAlign: "center", marginBottom: "3rem" }}>
            Comment ça marche ?
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {[
              { step: "01", title: "Inscrivez-vous", desc: "Créez votre compte en quelques secondes. L'admin reçoit une notification et approuve votre accès." },
              { step: "02", title: "Payez votre cotisation", desc: "Chaque mois, cliquez sur Payer. Le numéro Wave ou Orange Money de l'admin est copié automatiquement." },
              { step: "03", title: "Envoyez la preuve", desc: "Prenez une capture d'écran de votre transfert et uploadez-la sur le site." },
              { step: "04", title: "Recevez votre ticket", desc: "L'admin valide et vous recevez immédiatement votre reçu de paiement officiel." },
            ].map(s => (
              <div key={s.step} style={{ display: "flex", gap: "1.25rem", alignItems: "flex-start" }}>
                <div style={{ width: 48, height: 48, borderRadius: "12px", background: "rgba(201,168,76,0.15)", border: "1px solid rgba(201,168,76,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontFamily: "var(--font-heading)", color: "var(--gold)", fontWeight: 700, fontSize: "0.85rem" }}>{s.step}</span>
                </div>
                <div>
                  <h3 style={{ fontFamily: "var(--font-heading)", color: "white", fontWeight: 600, fontSize: "1rem", marginBottom: "0.3rem" }}>{s.title}</h3>
                  <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.88rem", lineHeight: 1.6 }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "5rem 1.5rem", textAlign: "center", background: "rgba(201,168,76,0.06)", borderTop: "1px solid rgba(201,168,76,0.15)" }}>
        <div style={{ maxWidth: 500, margin: "0 auto" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🤝</div>
          <h2 style={{ fontFamily: "var(--font-heading)", color: "white", fontSize: "clamp(1.5rem, 4vw, 2rem)", fontWeight: 700, marginBottom: "1rem" }}>
            Prêt à rejoindre la tontine ?
          </h2>
          <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: "2rem", fontSize: "0.95rem" }}>
            Demandez à l'admin de vous ajouter ou inscrivez-vous directement.
          </p>
          <Link href="/register" style={{ background: "var(--gold)", color: "#1A1A14", textDecoration: "none", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "1rem", padding: "1rem 2.5rem", borderRadius: "12px", display: "inline-block" }}>
            S'inscrire maintenant
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: "1.5rem", textAlign: "center", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <p style={{ color: "rgba(255,255,255,0.25)", fontSize: "0.8rem", fontFamily: "var(--font-heading)" }}>
          🤝 Tontine Familiale — Gérez votre épargne collective simplement
        </p>
      </footer>
    </div>
  );
}
