# 🤝 Tontine Familiale

Application de gestion de tontine familiale avec paiement Wave et Orange Money.

## Stack technique
- **Frontend & Backend** : Next.js 14 (App Router)
- **Auth & Database** : Firebase (Authentication + Firestore + Storage)
- **Paiement** : Deeplinks Wave / Orange Money → numéro admin
- **Style** : CSS custom (design forest/gold)

## Installation

```bash
npm install
```

## Configuration Firebase

1. Créer un projet sur [Firebase Console](https://console.firebase.google.com)
2. Activer **Authentication** (Email/Password)
3. Créer une base **Firestore** (mode production)
4. Activer **Storage**
5. Copier vos clés dans `.env.local`

```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_ADMIN_CODE=TONTINE2025
```

6. Coller les règles Firestore et Storage depuis `FIREBASE_RULES.md`

## Lancement

```bash
npm run dev
# → http://localhost:3000
```

## Fonctionnement

### Rôles
- **Admin** : créé en s'inscrivant avec le code `TONTINE2025` (personnalisable dans `.env.local`)
- **Membre** : tout compte sans code admin

### Flux de paiement
1. Le membre clique "Payer maintenant" sur son dashboard
2. Il choisit Wave ou Orange Money → un lien s'ouvre vers le numéro de l'admin
3. Il effectue le transfert dans l'app bancaire
4. Il revient, uploade la capture d'écran de la transaction
5. L'admin voit le paiement en attente, vérifie la capture → valide ou rejette
6. Une fois validé, le ticket de paiement apparaît sur le dashboard du membre

### Paramètres admin
L'admin peut configurer depuis "Paramètres" :
- Nom du groupe
- Montant mensuel
- Numéro Wave
- Numéro Orange Money

## Déploiement
```bash
npm run build
# Déployer sur Vercel, Netlify, ou Firebase Hosting
```
