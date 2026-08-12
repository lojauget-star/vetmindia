# VETMIND - SECURITY & DATA ISOLATION SPECIFICATION

**Version**: 1.0.0  
**Status**: APPROVED  
**Author**: Principal Software Engineer  

---

## 1. DATA OWNERSHIP & MULTI-TENANCY ISOLATION

Vetmind strictly enforces **UID-based data isolation** across all Firestore collections and Storage paths. Under no circumstance may any user read, mutate, or query documents belonging to another user.

---

## 2. FIRESTORE SECURITY RULES SPECIFICATION

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    function isDocOwner() {
      return isAuthenticated() && request.auth.uid == resource.data.userId;
    }

    function isCreatingWithOwner() {
      return isAuthenticated() && request.auth.uid == request.resource.data.userId;
    }

    // Collection Security Rules
    match /users/{userId} {
      allow read, write: if isOwner(userId);
    }

    match /profiles/{profileId} {
      allow read, write: if isDocOwner() || isCreatingWithOwner();
    }

    match /patients/{patientId} {
      allow read, update, delete: if isDocOwner();
      allow create: if isCreatingWithOwner();
    }

    match /cases/{caseId} {
      allow read, update, delete: if isDocOwner();
      allow create: if isCreatingWithOwner();
    }

    match /anamneses/{anamnesisId} {
      allow read, update, delete: if isDocOwner();
      allow create: if isCreatingWithOwner();
    }

    match /attachments/{attachmentId} {
      allow read, update, delete: if isDocOwner();
      allow create: if isCreatingWithOwner();
    }

    match /analyses/{analysisId} {
      allow read: if isDocOwner();
      allow write: if false; // Writes allowed ONLY via Cloud Functions (Firebase Admin SDK)
    }

    match /hypotheses/{hypothesisId} {
      allow read, update: if isDocOwner();
      allow create, delete: if false; // Managed by Cloud Functions backend
    }

    match /evidence/{evidenceId} {
      allow read: if isDocOwner();
      allow write: if false;
    }

    match /literature/{literatureId} {
      allow read: if isAuthenticated();
      allow write: if false; // Read-only for clinical reference
    }

    match /literatureChunks/{chunkId} {
      allow read: if isAuthenticated();
      allow write: if false;
    }

    match /prescriptions/{prescriptionId} {
      allow read, update, delete: if isDocOwner();
      allow create: if isCreatingWithOwner();
    }

    match /documents/{documentId} {
      allow read, delete: if isDocOwner();
      allow create, update: if false; // Generated via Cloud Functions PDF Engine
    }

    match /timelineEvents/{eventId} {
      allow read: if isDocOwner();
      allow write: if false; // System generated event log
    }

    match /marketingProjects/{projectId} {
      allow read, update, delete: if isDocOwner();
      allow create: if isCreatingWithOwner();
    }

    match /brandKits/{brandKitId} {
      allow read, update, delete: if isDocOwner();
      allow create: if isCreatingWithOwner();
    }

    match /generatedAssets/{assetId} {
      allow read: if isDocOwner();
      allow write: if false;
    }

    match /jobs/{jobId} {
      allow read: if isDocOwner();
      allow write: if false;
    }

    match /auditLogs/{logId} {
      allow read: if isDocOwner();
      allow write: if false; // Immutable audit log written by Admin SDK
    }
  }
}
```

---

## 3. FIREBASE STORAGE SECURITY RULES

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## 4. APP CHECK & API KEY SECURITY

1. **Firebase App Check**: ReCAPTCHA v3 or Play Integrity / DeviceCheck tokens are mandatory for all frontend client invocations. Unverified requests are dropped at the edge.
2. **Gemini API Key Protection**: Stored exclusively in Google Cloud Secret Manager or Cloud Functions secret environment variables (`process.env.GEMINI_API_KEY`). NEVER output into client build targets.
3. **Zod Validation**: All Cloud Functions endpoints parse incoming JSON through Zod schemas before executing business logic, immediately rejecting malformed or unexpected fields.
