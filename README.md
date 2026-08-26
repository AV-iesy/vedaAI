# Veda AI

AI-assisted assessment extraction and answer mapping for teachers.

## Current milestone

The first vertical slice includes:

- PDF/JPG/PNG upload validation for a question paper and one answer sheet
- backend-confirmed processing stages
- representative question, answer, and mapping data
- mapping confidence and unanswered/unmatched states
- exact normalized bounding-box overlays on answer-sheet pages
- multi-page answer navigation
- responsive review workspace

The extraction provider is intentionally deterministic in this milestone. Its API boundary is ready to be replaced by OCR and LLM provider adapters without changing the review UI.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), select any two supported files, and start extraction.

## Environment

Copy `.env.example` to `.env.local` before enabling external OCR or LLM providers. Never commit provider credentials.
