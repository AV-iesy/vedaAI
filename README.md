# Veda AI

AI-assisted assessment extraction and answer mapping for teachers.

## Current milestone

The first vertical slice includes:

- PDF/JPG/PNG upload validation for a question paper and one answer sheet
- direct browser uploads through UploadThing with signed server receipts
- backend-confirmed processing stages
- native Gemini extraction for PDF, JPG, and PNG documents
- schema-validated question, answer, and region data
- deterministic question-label matching before conservative semantic fallback
- schema-validated grading through `POST /api/grade`
- mapping confidence and unanswered/unmatched states
- exact normalized bounding-box overlays on answer-sheet pages
- multi-page answer navigation
- responsive review workspace

The hobby build uses UploadThing's 2 GB free app tier for file delivery and `gemini-2.5-flash` for extraction. Submission state and intermediate AI results remain in server memory and disappear when the server restarts. No database or paid OCR service is required.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), select any two supported files, and start extraction.

## Environment

Copy `.env.example` to `.env.local`, add a Gemini API key, and restart the development server. Never commit provider credentials.

```dotenv
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-2.5-flash
```

Add the server-only UploadThing v7 token to `.env.local`:

```dotenv
UPLOADTHING_TOKEN=your_v7_token_here
```

`POST /api/grade` accepts the signed `questionPaper` and `answerSheet` objects returned by the UploadThing callback. It rejects arbitrary file URLs, downloads only verified UploadThing files, and returns marks, concise feedback, page numbers, and 0–1000 answer bounding boxes.

## Hobby-project constraints

- The server keeps submissions in memory, so this is suitable for local use and small demos rather than multi-instance production hosting.
- The free UploadThing plan serves uploads from public URLs. Use synthetic or anonymized student work unless private storage is added later.
- Gemini supplies normalized source-region coordinates, but model-generated boxes should still be teacher-reviewed before they are treated as exact evidence.
- Google states that free-tier Gemini API content may be used to improve its products. Use synthetic or anonymized student work for this free-tier build.
