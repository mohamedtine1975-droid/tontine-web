# Firestore Security Rules

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read their own data, admins can read all
    match /users/{userId} {
      allow read: if request.auth != null && (request.auth.uid == userId || isAdmin());
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Payments
    match /payments/{paymentId} {
      allow read: if request.auth != null && (resource.data.memberId == request.auth.uid || isAdmin());
      allow create: if request.auth != null && request.resource.data.memberId == request.auth.uid;
      allow update: if isAdmin();
    }
    
    // Settings - only admin can write
    match /settings/{doc} {
      allow read: if request.auth != null;
      allow write: if isAdmin();
    }
    
    function isAdmin() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

# Storage Rules

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /screenshots/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```
