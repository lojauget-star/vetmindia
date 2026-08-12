# VETMIND - VETERINARY RAG & EVIDENCE GROUNDING SPECIFICATION

**Version**: 1.0.0  
**Status**: APPROVED  
**Author**: Principal Software Engineer  

---

## 1. RAG ARCHITECTURE OVERVIEW

Vetmind implements a specialized **Veterinary Retrieval-Augmented Generation (RAG)** pipeline. Instead of relying solely on baseline LLM parametric memory, every generated differential diagnosis hypothesis is grounded against peer-reviewed veterinary literature, clinical textbooks, and established consensus guidelines.

```
+------------------+      +-------------------+      +-----------------------+
| Veterinary Text  | ---> | Text Ingestion    | ---> | Chunking & Embedding  |
| & Guidelines     |      | & Parsing Engine  |      | (Gemini 004 / 768-dim)|
+------------------+      +-------------------+      +-----------+-----------+
                                                                 |
                                                                 v
+------------------+      +-------------------+      +-----------------------+
| Anamnesis / Case | ---> | Vector Similarity | <--- | Firestore Vector      |
| Context Query    |      | Search Engine     |      | Collection            |
+------------------+      +---------+---------+      +-----------------------+
                                    |
                                    v
                          +-------------------+
                          | Grounded Gemini   |
                          | Reasoning Prompt  |
                          +---------+---------+
                                    |
                                    v
                          +-------------------+
                          | Evidence Record   |
                          | & Hypotheses      |
                          +-------------------+
```

---

## 2. CHUNKING & EMBEDDING SPECIFICATION

### 2.1 Literature Ingestion Strategy
1. **Document Parsing**: PDF/Text veterinary papers parsed into clean Markdown strings.
2. **Chunking Parameters**:
   - Chunk Size: 512 tokens (~350 words).
   - Chunk Overlap: 64 tokens (~45 words).
   - Metadata Preservation: preserving `title`, `authors`, `sourceName`, `year`, `category`, and `doi`.

### 2.2 Embedding Generator
- **Model**: Google Gemini `text-embedding-004`
- **Vector Dimension**: 768 float values.
- **Storage Location**: `literatureChunks` collection in Cloud Firestore (or Firestore Vector Search extension).

---

## 3. RETRIEVAL & GROUNDING PIPELINE

### 3.1 Similarity Query Execution
When Cloud Function `/api/v1/clinical/analyze` runs:
1. Construct Query String: Combines species, age, chief complaint, key symptoms, and physical exam findings.
2. Generate Query Vector: Invokes `text-embedding-004` on the query string.
3. Cosine Distance Search: Executes K-Nearest Neighbors (KNN) search over `literatureChunks` (K=5 top matches with threshold $\ge 0.72$).

### 3.2 Evidence Grounding Model
Top matched literature chunks are formatted into the system prompt for Gemini 1.5 Pro:

```markdown
You are a senior veterinary specialist.
Analyze the following patient anamnesis using ONLY the provided verified literature context for grounding.

VETERINARY LITERATURE CONTEXT:
[Chunk #1 - ID: chunk_8812] Title: Canine Pancreatitis Consensus. Excerpt: "Canine acute pancreatitis..."
[Chunk #2 - ID: chunk_9901] Title: Small Animal Gastroenterology. Excerpt: "Acute abdominal pain..."

PATIENT ANAMNESIS:
Species: Canine, Age: 4y, Symptoms: Acute vomiting, Cranial abdominal discomfort.

OUTPUT FORMAT:
Generate structured JSON output containing hypotheses and explicit citation mappings linking hypothesis items to Chunk IDs.
```

### 3.3 Evidence Record Creation
For every citation returned by Gemini, the system writes a document to `evidence`:
- Links `hypothesisId` to `literatureChunkId`
- Stores exact snippet, paper title, DOI, and cosine similarity score
- UI renders clickable "Evidence Grounding" drawer displaying paper source to the veterinarian.
