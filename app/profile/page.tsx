"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import Navbar from "@/components/Navbar";
import toast from "react-hot-toast";
import Link from "next/link";

export default function ProfilePage() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (userData) {
      setName(userData.name);
      setPhone(userData.phone);
    }
  }, [userData]);

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", user.uid), { name, phone });
      toast.success("Profil mis à jour !");
    } catch {
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (!user || !user.email) return;
    if (newPassword !== confirmPassword) { toast.error("Les mots de passe ne correspondent pas"); return; }
    if (newPassword.length < 6) { toast.error("Minimum 6 caractères"); return; }
    setChangingPassword(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      toast.success("Mot de passe modifié !");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      toast.error("Mot de passe actuel incorrect");
    } finally {
      setChangingPassword(false);
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
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "1.5rem 1rem" }}>

        {/* Back */}
        <Link href={userData?.role === "admin" ? "/admin" : "/dashboard"} style={{ color: "var(--text-muted)", fontSize: "0.88rem", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.4rem", marginBottom: "1.5rem" }}>
          ← Retour
        </Link>

        {/* Avatar */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: "var(--forest)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "white", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "1.5rem", marginBottom: "0.75rem" }}>
            {userData?.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
          </div>
          <p style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "1.1rem", color: "var(--forest)" }}>{userData?.name}</p>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{userData?.email}</p>
          <span style={{ background: userData?.role === "admin" ? "var(--gold)" : "#E6F4EC", color: userData?.role === "admin" ? "#1A1A14" : "#1A6B35", fontSize: "0.75rem", fontWeight: 700, padding: "2px 10px", borderRadius: "20px", fontFamily: "var(--font-heading)" }}>
            {userData?.role === "admin" ? "ADMIN" : "MEMBRE"}
          </span>
        </div>

        {/* Infos */}
        <div className="card" style={{ padding: "1.5rem", marginBottom: "1.25rem" }}>
          <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1rem", fontWeight: 700, color: "var(--forest)", marginBottom: "1.25rem" }}>
            Informations personnelles
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label>Nom complet</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Votre nom" />
            </div>
            <div>
              <label>Numéro de téléphone</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+221 77 000 00 00" />
            </div>
            <div>
              <label>Email</label>
              <input value={userData?.email || ""} disabled style={{ opacity: 0.6, cursor: "not-allowed" }} />
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>L'email ne peut pas être modifié</p>
            </div>
            <button className="btn-gold" onClick={saveProfile} disabled={saving} style={{ opacity: saving ? 0.7 : 1 }}>
              {saving ? "Sauvegarde..." : "Enregistrer"}
            </button>
          </div>
        </div>

        {/* Change password */}
        <div className="card" style={{ padding: "1.5rem" }}>
          <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1rem", fontWeight: 700, color: "var(--forest)", marginBottom: "1.25rem" }}>
            Changer le mot de passe
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label>Mot de passe actuel</label>
              <input type="password" placeholder="••••••••" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
            </div>
            <div>
              <label>Nouveau mot de passe</label>
              <input type="password" placeholder="Minimum 6 caractères" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
            </div>
            <div>
              <label>Confirmer le nouveau mot de passe</label>
              <input type="password" placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
            </div>
            <button className="btn-outline" onClick={changePassword} disabled={changingPassword} style={{ opacity: changingPassword ? 0.7 : 1 }}>
              {changingPassword ? "Modification..." : "Changer le mot de passe"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
