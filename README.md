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


