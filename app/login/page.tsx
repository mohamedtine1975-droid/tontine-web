"use client";
import { useState } from "react";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const userSnap = await getDoc(doc(db, "users", cred.user.uid));
      if (userSnap.exists() && userSnap.data().status === "pending") {
        await signOut(auth);
        toast.error("Votre compte est en attente de validation par l'admin.");
        setLoading(false);
        return;
      }
      if (userSnap.exists() && userSnap.data().status === "rejected") {
        await signOut(auth);
        toast.error("Votre compte a été refusé. Contactez l'admin.");
        setLoading(false);
        return;
      }
      toast.success("Bienvenue !");
      const role = userSnap.data()?.role;
      if (role === "admin") router.push("/admin");
      else router.push("/dashboard");
    } catch {
      toast.error("Email ou mot de passe incorrect");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--forest)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div style={{ width: "100%", maxWidth: "420px" }}>
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <div style={{ width: 64, height: 64, background: "var(--gold)", borderRadius: "16px", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem", fontSize: "1.8rem" }}>
            🤝
          </div>
          <h1 style={{ fontFamily: "var(--font-heading)", color: "white", fontSize: "1.8rem", fontWeight: 700 }}>Tontine Familiale</h1>
          <p style={{ color: "rgba(255,255,255,0.55)", marginTop: "0.4rem", fontSize: "0.9rem" }}>Connectez-vous à votre espace</p>
        </div>

        <div className="card" style={{ padding: "2rem" }}>
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div>
              <label>Adresse email</label>
              <input type="email" placeholder="vous@exemple.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                <label style={{ margin: 0 }}>Mot de passe</label>
                <Link href="/forgot-password" style={{ fontSize: "0.8rem", color: "var(--gold-dark)", fontWeight: 600, textDecoration: "none" }}>
                  Mot de passe oublié ?
                </Link>
              </div>
              <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <button className="btn-gold" type="submit" disabled={loading} style={{ width: "100%", marginTop: "0.5rem", opacity: loading ? 0.7 : 1 }}>
              {loading ? "Connexion..." : "Se connecter"}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: "1.25rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Pas encore de compte ?{" "}
            <Link href="/register" style={{ color: "var(--gold-dark)", fontWeight: 600, textDecoration: "none" }}>S'inscrire</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
