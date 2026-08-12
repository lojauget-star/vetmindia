# VETMIND - SYSTEM ARCHITECTURE SPECIFICATION

**Version**: 1.0.0  
**Status**: APPROVED  
**Author**: Principal Software Engineer  

---

## 1. HIGH-LEVEL ARCHITECTURE

Vetmind adopts a modular, decoupled full-stack architecture. The frontend application handles UI rendering, local client state, user interactions, and view orchestration. All clinical business logic, AI operations, RAG search, document generation, and direct database mutations execute through secure backend services and Cloud Functions.

```
+-----------------------------------------------------------------------------------+
|                                  FRONTEND LAYER                                   |
|                                                                                   |
|  [Pages / Views]  -->  [Components]  -->  [Stores / Hooks]  -->  [Services]       |
|                                                                     |             |
|                                                            [Repositories]         |
+---------------------------------------------------------------------+-------------+
                                                                      |  HTTPS/WSS
                                                                      |  (App Check + IdToken)
+---------------------------------------------------------------------+-------------+
|                                  BACKEND LAYER                                    |
|                                                                     v             |
|  [Cloud Functions / API]  <---------------------------------  [API Router]        |
|          |                                                                        |
|          +--> [Clinical Service]  -->  [Gemini AI Service]  --> [RAG Engine]    |
|          |                                                            |           |
|          +--> [Document Engine]                                       |           |
|          |                                                            v           |
|          +--> [Repositories]  ----------------------------->  [Cloud Firestore]   |
|          |                                                [Firebase Storage]      |
|          +--> [Audit & Security Logger]                                           |
+-----------------------------------------------------------------------------------+
```

---

## 2. LAYER RESPONSIBILITIES

### 2.1 Frontend Architecture (`/src`)

- `components/`: Pure visual presentation components (buttons, badges, modals, cards, clinical tables). Zero direct API calls.
- `pages/`: Page containers mapped to routing. Assembles layouts and connects custom hooks to views.
- `layouts/`: Master shell structures (Clinical Navigation, Sidebar, Top Bar, Patient Workspace Header).
- `hooks/`: Custom React hooks encapsulating component-level side effects, asynchronous state, and query execution.
- `services/`: API client adapters that handle HTTP communication with Cloud Functions endpoints, token attachment, and error normalization.
- `repositories/`: Client-side repositories managing direct Firestore read subscriptions (e.g. live snapshot listeners for cases and timeline events) when authorized.
- `stores/`: Global application state management (Zustand) for active session, current `ClinicalCase` context, active patient, and UI drawers.
- `types/`: Strict TypeScript interfaces, enums, and type aliases matching the master data model.
- `utils/`: Pure helper functions (date formatters, medical calculators, string sanitizers).
- `design-system/`: Design system tokens, color palettes, Inter typography configs, and reusable CSS utility modules. Note: The Design System is a purely visual layer and MUST NOT contain any clinical or business logic, direct API calls, or side effects. All data and event handling are passed strictly via typed props.

### 2.2 Backend Architecture (`/functions/src`)

- `functions/`: Cloud Functions HTTP triggers and Firestore event triggers (callable functions, HTTPS express routes, background handlers).
- `services/`: Core domain business services executing clinical workflows (e.g., `ClinicalCaseService`, `GeminiAnalysisService`, `RAGService`, `PrescriptionService`).
- `repositories/`: Server-side data access layer wrapping Firebase Admin Firestore SDK with strict typed operations.
- `ai/`: Gemini API clients, prompt engineering templates, structured JSON schema generators, and response parsers.
- `rag/`: Vector search, literature chunking engine, embedding generation (`text-embedding-004`), and similarity scoring.
- `clinical/`: Veterinary diagnostic logic, dosage formulas, interaction checkers, and clinical rule engines.
- `documents/`: PDF rendering engines, clinical report compilation, and printable document generators.
- `storage/`: Attachment handling, file upload validation, image optimization, and secure Firebase Storage bucket operations.
- `security/`: Auth context verification, App Check token validation, role-based access control (RBAC), and user UID scoping.
- `validation/`: Zod schemas validating incoming API request payloads and outgoing response structures.

---

## 3. COMPLETE DIRECTORY BLUEPRINT

```
vetmind/
├── docs/
│   ├── VETMIND_MASTER_CONTRACT.md
│   ├── ARCHITECTURE.md
│   ├── DATA_MODEL.md
│   ├── API_CONTRACT.md
│   ├── DESIGN_SYSTEM.md
│   ├── SECURITY_SPEC.md
│   ├── RAG_SPEC.md
│   └── IMPLEMENTATION_STATUS.md
├── src/
│   ├── components/
│   │   ├── clinical/
│   │   ├── common/
│   │   ├── layout/
│   │   └── ui/
│   ├── pages/
│   │   ├── auth/
│   │   ├── cases/
│   │   ├── dashboard/
│   │   ├── marketing/
│   │   └── patients/
│   ├── layouts/
│   │   ├── AuthLayout.tsx
│   │   └── ClinicalLayout.tsx
│   ├── hooks/
│   │   ├── useAnamnesis.ts
│   │   ├── useAuth.ts
│   │   ├── useClinicalCase.ts
│   │   ├── useGeminiAnalysis.ts
│   │   └── usePrescription.ts
│   ├── services/
│   │   ├── api.service.ts
│   │   ├── clinical.service.ts
│   │   └── document.service.ts
│   ├── repositories/
│   │   ├── case.repository.ts
│   │   └── patient.repository.ts
│   ├── stores/
│   │   ├── useAuthStore.ts
│   │   └── useClinicalStore.ts
│   ├── types/
│   │   ├── case.types.ts
│   │   ├── clinical.types.ts
│   │   └── patient.types.ts
│   ├── utils/
│   │   ├── formatters.ts
│   │   └── validators.ts
│   └── design-system/
│       ├── colors.ts
│       ├── paper-texture.css
│       └── typography.ts
├── functions/
│   └── src/
│       ├── functions/
│       │   ├── analyzeCase.ts
│       │   ├── generateDocument.ts
│       │   ├── processRAG.ts
│       │   └── index.ts
│       ├── services/
│       │   ├── clinical.service.ts
│       │   ├── gemini.service.ts
│       │   └── rag.service.ts
│       ├── repositories/
│       │   ├── case.repository.ts
│       │   └── literature.repository.ts
│       ├── ai/
│       │   ├── prompts/
│       │   └── geminiClient.ts
│       ├── rag/
│       │   ├── embedder.ts
│       │   └── vectorSearch.ts
│       ├── clinical/
│       │   ├── differentialDiagnosis.ts
│       │   └── dosageCalculator.ts
│       ├── documents/
│       │   └── pdfGenerator.ts
│       ├── storage/
│       │   └── storageService.ts
│       ├── security/
│       │   └── authGuard.ts
│       └── validation/
│           └── schemas.ts
├── firestore.rules
├── storage.rules
├── package.json
└── tsconfig.json
```

---

## 4. DATA FLOW & REPOSITORY PATTERN

### Client-Side State Synchronization
1. **Command Execution**: UI component calls custom hook function (e.g. `submitAnamnesis(caseId, data)`).
2. **Hook to Service**: Hook delegates to `ClinicalService.submitAnamnesis()`.
3. **HTTP to Cloud Functions**: `ClinicalService` attaches Firebase Auth ID Token & App Check header, invoking Cloud Function `/api/v1/clinical/anamnesis`.
4. **Server Execution**: Cloud Function validates request payload with Zod schema, checks user ownership, invokes `GeminiAnalysisService`, updates Firestore via `CaseRepository`, writes `TimelineEvent`, and returns typed JSON response.
5. **State Update**: Service returns standardized response to Hook -> Store updates `activeCase` state -> UI updates seamlessly.

---

## 5. ERROR HANDLING & RESILIENCE STRATEGY

- **Global Error Envelope**: All API responses follow a uniform contract `{ success: boolean, data?: T, error?: { code: string, message: string, details?: any } }`.
- **Automatic Token Refresh**: Frontend client interceptors catch `401 Unauthorized` responses and attempt token refresh before surfacing re-authentication prompts.
- **Audit Logging on Failure**: Backend errors log detailed diagnostic context to the `auditLogs` collection with `userId`, `caseId`, timestamp, and stack trace.
