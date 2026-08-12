# VETMIND - API CONTRACT SPECIFICATION

**Version**: 1.0.0  
**Status**: APPROVED  
**Author**: Principal Software Engineer  

---

## 1. COMMUNICATION PROTOCOL & HEADERS

All frontend requests to Vetmind Cloud Functions MUST communicate via HTTPS REST JSON endpoints or Firebase HTTPS Callable Functions.

### 1.1 Mandatory Request Headers
```http
POST /api/v1/clinical/analyze HTTP/1.1
Host: us-central1-vetmind-app.cloudfunctions.net
Content-Type: application/json
Authorization: Bearer <Firebase_ID_Token>
X-Firebase-AppCheck: <AppCheck_Token>
```

### 1.2 Unified Response Envelope

#### Success Response (HTTP 200 / 201)
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2026-08-11T23:35:00.000Z",
    "requestId": "req_88f9a0c1"
  }
}
```

#### Error Response (HTTP 4xx / 5xx)
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CASE_STATUS",
    "message": "Clinical case must be in ANAMNESIS_PENDING state before initiating AI analysis.",
    "details": null
  },
  "meta": {
    "timestamp": "2026-08-11T23:35:00.000Z",
    "requestId": "req_88f9a0c1"
  }
}
```

---

## 2. API ENDPOINTS CATALOG

### 2.1 Clinical Case Lifecycle API

#### `POST /api/v1/cases`
Creates a new `ClinicalCase` bound to a specific `patientId`.
- **Request Payload**:
```json
{
  "patientId": "pat_99812",
  "title": "Severe Acute Vomiting and Lethargy",
  "chiefComplaint": "Canine patient presenting with 48h history of bilious vomiting and weakness."
}
```
- **Response Data**: Returns created `ClinicalCaseDocument`.

#### `GET /api/v1/cases/:caseId`
Retrieves full clinical case details including active anamnesis, latest analysis, and selected hypotheses.

---

### 2.2 Anamnesis API

#### `POST /api/v1/clinical/anamnesis`
Submits or updates physical examination metrics and symptom history for a case.
- **Request Payload**:
```json
{
  "caseId": "case_10293",
  "symptoms": ["vomiting", "lethargy", "abdominal_pain", "anorexia"],
  "onsetDate": "2026-08-09",
  "progression": "ACUTE",
  "dietHistory": "Commercial kibble, no known dietary indiscretion",
  "vaccinationStatus": "UP_TO_DATE",
  "dewormingStatus": "UP_TO_DATE",
  "physicalExam": {
    "temperatureC": 39.4,
    "heartRateBpm": 130,
    "respiratoryRateBpm": 32,
    "mucousMembranes": "PALE_PINK",
    "capillaryRefillTimeSec": 2.5,
    "hydrationStatus": "DEHYDRATED_7_PERCENT",
    "bodyConditionScore": 5
  },
  "rawNotes": "Tense abdomen on cranial palpation."
}
```

---

### 2.3 AI Clinical Analysis & RAG API

#### `POST /api/v1/clinical/analyze`
Triggers Gemini 1.5 Pro clinical reasoning pipeline over anamnesis, physical exam, and uploaded attachments.
- **Request Payload**:
```json
{
  "caseId": "case_10293",
  "anamnesisId": "anam_55102",
  "enableRAG": true
}
```
- **Execution Flow**:
  1. Validates ownership (`case.userId == auth.uid`).
  2. Assembles structured prompt from case anamnesis & attachments.
  3. Queries `RAGService` to retrieve relevant `literatureChunks`.
  4. Invokes Gemini 1.5 Pro JSON Schema mode.
  5. Stores generated `AnalysisDocument`, list of `HypothesisDocument`, and grounded `EvidenceDocument` entries.
  6. Emits `TimelineEvent` ("AI_ANALYSIS_COMPLETED").
- **Response Data**:
```json
{
  "analysisId": "an_77102",
  "urgencyLevel": "HIGH",
  "clinicalSummary": "Acute gastroenteritis vs. acute pancreatitis vs. foreign body obstruction.",
  "hypotheses": [
    {
      "id": "hyp_01",
      "diseaseName": "Acute Pancreatitis",
      "probabilityScore": 0.78,
      "reasoning": "Compatible with fever, cranial abdominal pain, vomiting, and dehydration.",
      "supportingFindings": ["fever", "cranial abdominal tension", "vomiting"],
      "recommendedExams": ["cPLI test", "Abdominal Ultrasound", "Serum Amylase/Lipase"]
    }
  ],
  "evidence": [
    {
      "hypothesisId": "hyp_01",
      "paperTitle": "Veterinary Internal Medicine Guidelines on Canine Pancreatitis",
      "snippet": "Canine acute pancreatitis frequently presents with fever, cranial abdominal discomfort, and acute dehydration.",
      "relevanceScore": 0.91
    }
  ]
}
```

---

### 2.4 Prescription API

#### `POST /api/v1/prescriptions`
Generates a validated drug prescription with veterinary dosage calculations.
- **Request Payload**:
```json
{
  "caseId": "case_10293",
  "patientId": "pat_99812",
  "items": [
    {
      "medicationName": "Maropitant Citrate (Cerenia)",
      "activeIngredient": "Maropitant",
      "dosageMgKg": 1.0,
      "route": "SUBCUTANEOUS",
      "frequency": "Once daily (Q24H)",
      "durationDays": 3,
      "instructions": "Administer subcutaneously for acute vomiting."
    }
  ],
  "specialInstructions": "Provide NPO (nothing by mouth) for 12 hours, then reintroduce soft recovery diet."
}
```

---

### 2.5 Document Engine API

#### `POST /api/v1/documents/generate-pdf`
Renders print-ready clinical reports, discharge instructions, or signed prescriptions.
- **Request Payload**:
```json
{
  "caseId": "case_10293",
  "documentType": "CLINICAL_REPORT",
  "includeEvidenceCitations": true
}
```
- **Response Data**: `{ "documentId": "doc_99182", "downloadUrl": "https://storage.googleapis.com/..." }`.
