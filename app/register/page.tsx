"use client";
import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

export default function RegisterPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", code: "" });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const isAdmin = form.code === process.env.NEXT_PUBLIC_ADMIN_CODE;
      const role = isAdmin ? "admin" : "member";

      const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
      await setDoc(doc(db, "users", cred.user.uid), {
        uid: cred.user.uid,
        name: form.name,
        email: form.email,
        phone: form.phone,
        role,
        status: isAdmin ? "approved" : "pending",
        createdAt: new Date().toISOString(),
      });

      if (isAdmin) {
        toast.success("Compte admin créé !");
        router.push("/admin");
      } else {
        toast.success("Inscription envoyée ! Attendez la validation de l'admin.");
        router.push("/login");
      }
    } catch (err: unknown) {
      const error = err as { code?: string };
      if (error.code === "auth/email-already-in-use") toast.error("Cet email est déjà utilisé");
      else toast.error("Erreur lors de la création du compte");
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
          <h1 style={{ fontFamily: "var(--font-heading)", color: "white", fontSize: "1.8rem", fontWeight: 700 }}>Rejoindre la tontine</h1>
          <p style={{ color: "rgba(255,255,255,0.55)", marginTop: "0.4rem", fontSize: "0.9rem" }}>Créez votre compte membre</p>
        </div>

        <div className="card" style={{ padding: "2rem" }}>
          <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
            <div>
              <label>Nom complet</label>
              <input name="name" placeholder="Fatou Diallo" value={form.name} onChange={handleChange} required />
            </div>
            <div>
              <label>Email</label>
              <input type="email" name="email" placeholder="vous@exemple.com" value={form.email} onChange={handleChange} required />
            </div>
            <div>
              <label>Numéro de téléphone</label>
              <input name="phone" placeholder="+221 77 000 00 00" value={form.phone} onChange={handleChange} required />
            </div>
            <div>
              <label>Mot de passe</label>
              <input type="password" name="password" placeholder="Minimum 6 caractères" value={form.password} onChange={handleChange} required minLength={6} />
            </div>
            <div>
              <label>Code admin (optionnel)</label>
              <input name="code" placeholder="Laissez vide si membre" value={form.code} onChange={handleChange} />
            </div>
            <button className="btn-gold" type="submit" disabled={loading} style={{ width: "100%", marginTop: "0.5rem", opacity: loading ? 0.7 : 1 }}>
              {loading ? "Création..." : "Créer mon compte"}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: "1.25rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Déjà inscrit ?{" "}
            <Link href="/login" style={{ color: "var(--gold-dark)", fontWeight: 600, textDecoration: "none" }}>Se connecter</Link>
          </p>
        </div>
      </div>
    </div>
  );
}