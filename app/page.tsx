"use client";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  CircleAlert,
  FileText,
  GraduationCap,
  LoaderCircle,
  Maximize2,
  MoreHorizontal,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { ChangeEvent, DragEvent, useMemo, useState } from "react";
import type {
  FileKind,
  MappingStatus,
  ProcessingStage,
  QuestionMapping,
  SubmissionResult,
} from "@/lib/types";

const STAGES: Array<{ id: ProcessingStage; label: string }> = [
  { id: "uploading", label: "Upload" },
  { id: "parsing_pages", label: "Parse" },
  { id: "extracting_questions", label: "Questions" },
  { id: "extracting_answers", label: "Answers" },
  { id: "mapping", label: "Map" },
  { id: "done", label: "Review" },
];

const statusCopy: Record<MappingStatus, string> = {
  matched: "Matched",
  low_confidence: "Check match",
  unanswered: "Unanswered",
};

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function UploadCard({
  kind,
  title,
  description,
  file,
  onFile,
}: {
  kind: FileKind;
  title: string;
  description: string;
  file: File | null;
  onFile: (kind: FileKind, file: File | null) => void;
}) {
  const [dragging, setDragging] = useState(false);

  function acceptFile(candidate?: File) {
    if (candidate) onFile(kind, candidate);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    acceptFile(event.dataTransfer.files[0]);
  }

  return (
    <section className="upload-card">
      <div className="upload-card__heading">
        <span className="file-icon"><FileText size={20} /></span>
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <span className="quest-index">{kind === "question_paper" ? "01" : "02"}</span>
      </div>

      {file ? (
        <div className="file-selected">
          <span className="file-selected__icon"><FileText size={22} /></span>
          <span className="file-selected__copy">
            <strong>{file.name}</strong>
            <small>{formatSize(file.size)} · Ready to upload</small>
          </span>
          <span className="file-selected__check"><Check size={16} /></span>
          <button aria-label={`Remove ${file.name}`} onClick={() => onFile(kind, null)}>
            <X size={17} />
          </button>
        </div>
      ) : (
        <div
          className={`dropzone ${dragging ? "dropzone--active" : ""}`}
          onDragEnter={() => setDragging(true)}
          onDragLeave={() => setDragging(false)}
          onDragOver={(event) => event.preventDefault()}
          onDrop={handleDrop}
        >
          <UploadCloud size={26} />
          <p><strong>Drop file here</strong> or <label htmlFor={kind}>browse</label></p>
          <small>PDF, JPG or PNG · maximum 20 MB</small>
          <input
            id={kind}
            type="file"
            accept="application/pdf,image/jpeg,image/png"
            onChange={(event: ChangeEvent<HTMLInputElement>) => acceptFile(event.target.files?.[0])}
          />
        </div>
      )}
    </section>
  );
}

function PipelineProgress({ submission }: { submission: SubmissionResult }) {
  const activeIndex = STAGES.findIndex((stage) => stage.id === submission.stage);

  return (
    <section className="processing-card" aria-live="polite">
      <div className="processing-card__top">
        <span className="processing-orbit"><LoaderCircle size={22} /></span>
        <div>
          <h2>Reading the assessment</h2>
          <p>{submission.stageLabel}</p>
        </div>
        <strong>{submission.progress}%</strong>
      </div>
      <div className="progress-track">
        <span style={{ width: `${submission.progress}%` }} />
      </div>
      <ol className="stage-list">
        {STAGES.map((stage, index) => (
          <li key={stage.id} className={index <= activeIndex ? "stage--active" : ""}>
            <span>{index < activeIndex ? <Check size={12} /> : index + 1}</span>
            {stage.label}
          </li>
        ))}
      </ol>
      <p className="processing-note">Each completed stage reflects work confirmed by the backend pipeline.</p>
    </section>
  );
}

function StatusBadge({ status }: { status: MappingStatus }) {
  return (
    <span className={`status status--${status}`}>
      {status === "unanswered" ? <CircleAlert size={12} /> : <CheckCircle2 size={12} />}
      {statusCopy[status]}
    </span>
  );
}

function AnswerPage({
  page,
  active,
}: {
  page: number;
  active: QuestionMapping | null;
}) {
  const regions = active?.regions.filter((region) => region.page === page) ?? [];

  return (
    <article className="answer-page">
      <div className="paper-meta">
        <span>SCIENCE · TERM ASSESSMENT</span>
        <span>Page {page} of 2</span>
      </div>
      {page === 1 ? (
        <div className="handwriting">
          <p><b>1.</b> Photosynthesis is the process by which green plants use sunlight to prepare food from carbon dioxide and water.</p>
          <p className="equation">6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂</p>
          <p><b>2 a.</b> Chlorophyll absorbs light energy from the sun for the plant.</p>
          <p><b>4.</b> Aerobic respiration uses oxygen and releases more energy. Anaerobic respiration happens without oxygen and releases less energy...</p>
        </div>
      ) : (
        <div className="handwriting">
          <p><b>2(b).</b> Glucose and oxygen.</p>
          <p><b>4. continued</b> It produces lactic acid in muscles, while aerobic respiration produces carbon dioxide and water.</p>
          <p className="rough">Rough: 6 × 12 = 72</p>
        </div>
      )}
      {regions.map((region, index) => (
        <span
          className="highlight-region"
          key={`${page}-${index}`}
          style={{
            left: `${region.bbox.x * 100}%`,
            top: `${region.bbox.y * 100}%`,
            width: `${region.bbox.width * 100}%`,
            height: `${region.bbox.height * 100}%`,
          }}
        />
      ))}
    </article>
  );
}

function ReviewWorkspace({ result, onReset }: { result: SubmissionResult; onReset: () => void }) {
  const mappings = result.mappings ?? [];
  const [activeId, setActiveId] = useState(mappings[0]?.id ?? "");
  const [page, setPage] = useState(mappings[0]?.regions[0]?.page ?? 1);
  const [zoom, setZoom] = useState(90);
  const [query, setQuery] = useState("");
  const active = mappings.find((mapping) => mapping.id === activeId) ?? null;
  const visibleMappings = mappings.filter((mapping) =>
    `${mapping.displayNumber} ${mapping.questionText}`.toLowerCase().includes(query.toLowerCase()),
  );
  const matchedCount = mappings.filter((mapping) => mapping.status !== "unanswered").length;

  function selectMapping(mapping: QuestionMapping) {
    setActiveId(mapping.id);
    if (mapping.regions[0]) setPage(mapping.regions[0].page);
  }

  return (
    <main className="review-shell">
      <header className="review-header">
        <div className="brand"><span><GraduationCap size={21} /></span><div>Veda AI<small>STUDY QUEST</small></div></div>
        <div className="submission-name">
          <strong>Science assessment</strong>
          <span>Processed just now · Demo extraction provider</span>
        </div>
        <div className="review-header__actions">
          <button className="button button--ghost" onClick={onReset}><RotateCcw size={15} /> New submission</button>
          <button className="button button--dark"><Sparkles size={15} /> Grade answers</button>
          <button className="icon-button" aria-label="More options"><MoreHorizontal size={19} /></button>
        </div>
      </header>

      <section className="review-summary">
        <div><span className="summary-score">{matchedCount}/{mappings.length}</span><span>answers located</span></div>
        <div className="summary-separator" />
        <div><strong>{mappings.filter((item) => item.status === "low_confidence").length}</strong><span>needs a quick check</span></div>
        <div><strong>{result.unmatchedAnswers?.length ?? 0}</strong><span>unmatched note</span></div>
        <div className="summary-confidence"><ShieldCheck size={15} /> Source regions preserved <span className="pixel-star">✦</span></div>
      </section>

      <div className="review-grid">
        <aside className="question-panel">
          <div className="panel-heading">
            <div><span className="eyebrow">QUESTION PAPER</span><h1>Extracted questions</h1></div>
            <span className="count-badge">{mappings.length}</span>
          </div>
          <label className="search-field">
            <Search size={15} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a question" />
          </label>
          <div className="question-list">
            {visibleMappings.map((mapping) => (
              <button
                key={mapping.id}
                className={`question-item ${activeId === mapping.id ? "question-item--active" : ""}`}
                onClick={() => selectMapping(mapping)}
              >
                <span className="question-number">{mapping.displayNumber}</span>
                <span className="question-copy">
                  <span>{mapping.questionText}</span>
                  <small>{mapping.maxMarks ? `${mapping.maxMarks} marks` : "No scale"}</small>
                </span>
                <StatusBadge status={mapping.status} />
              </button>
            ))}
          </div>
          <div className="unmatched-card">
            <span><CircleAlert size={17} /></span>
            <div><strong>1 unmatched note</strong><small>Review rough work from page 2</small></div>
            <ArrowRight size={16} />
          </div>
        </aside>

        <section className="document-panel">
          <div className="document-toolbar">
            <div>
              <span className="eyebrow">ANSWER SHEET</span>
              <strong>{active ? `Showing answer for ${active.displayNumber}` : "No answer selected"}</strong>
            </div>
            <div className="toolbar-controls">
              <button className="icon-button" onClick={() => setZoom(Math.max(60, zoom - 10))} aria-label="Zoom out"><ZoomOut size={17} /></button>
              <span>{zoom}%</span>
              <button className="icon-button" onClick={() => setZoom(Math.min(130, zoom + 10))} aria-label="Zoom in"><ZoomIn size={17} /></button>
              <button className="icon-button" aria-label="Enter fullscreen"><Maximize2 size={17} /></button>
            </div>
          </div>
          <div className="page-viewport">
            <div className="paper-wrap" style={{ width: `${zoom}%` }}>
              <AnswerPage page={page} active={active} />
            </div>
          </div>
          <div className="page-nav">
            <button className="icon-button" disabled={page === 1} onClick={() => setPage(1)} aria-label="Previous page"><ArrowLeft size={17} /></button>
            <span>Page <strong>{page}</strong> of 2</span>
            <button className="icon-button" disabled={page === 2} onClick={() => setPage(2)} aria-label="Next page"><ArrowRight size={17} /></button>
          </div>
        </section>

        <aside className="insight-panel">
          <div className="panel-heading"><div><span className="eyebrow">MAPPING DETAIL</span><h2>{active ? `Question ${active.displayNumber}` : "Select a question"}</h2></div></div>
          {active ? (
            <>
              <StatusBadge status={active.status} />
              {active.confidence != null && (
                <div className="confidence-block">
                  <div><span>Mapping confidence</span><strong>{Math.round(active.confidence * 100)}%</strong></div>
                  <div className="confidence-track"><span style={{ width: `${active.confidence * 100}%` }} /></div>
                  <small>{active.status === "low_confidence" ? "Semantic match — teacher review recommended" : "Label and content agree"}</small>
                </div>
              )}
              <div className="detail-section">
                <span className="detail-label">QUESTION</span>
                <p>{active.questionText}</p>
              </div>
              <div className="detail-section">
                <span className="detail-label">EXTRACTED ANSWER</span>
                <p>{active.answerText ?? "No answer was detected for this question."}</p>
              </div>
              {active.regions.length > 1 && (
                <div className="multi-page-note"><FileText size={16} /><span><strong>Multi-page answer</strong><small>Regions found on pages {active.regions.map((region) => region.page).join(" and ")}</small></span></div>
              )}
              <div className="detail-actions">
                <button className="button button--outline">Change match</button>
                <button className="button button--dark">Confirm mapping</button>
              </div>
            </>
          ) : null}
        </aside>
      </div>
    </main>
  );
}

export default function Home() {
  const [files, setFiles] = useState<Record<FileKind, File | null>>({ question_paper: null, answer_sheet: null });
  const [submission, setSubmission] = useState<SubmissionResult | null>(null);
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);
  const ready = useMemo(() => Boolean(files.question_paper && files.answer_sheet), [files]);

  function updateFile(kind: FileKind, file: File | null) {
    setError("");
    setFiles((current) => ({ ...current, [kind]: file }));
  }

  async function processSubmission() {
    if (!files.question_paper || !files.answer_sheet) return;
    setWorking(true);
    setError("");

    try {
      const body = new FormData();
      body.append("question_paper", files.question_paper);
      body.append("answer_sheet", files.answer_sheet);
      const createResponse = await fetch("/api/submissions", { method: "POST", body });
      const created = await createResponse.json();

      if (!createResponse.ok) throw new Error(created.errors?.join(" ") ?? "Upload failed.");
      setSubmission(created);

      let current: SubmissionResult = created;
      while (current.stage !== "done") {
        const response = await fetch(`/api/submissions/${created.id}/process`, { method: "POST" });
        if (!response.ok) throw new Error("A processing stage failed. Please try again.");
        current = await response.json();
        setSubmission(current);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong.");
    } finally {
      setWorking(false);
    }
  }

  function reset() {
    setFiles({ question_paper: null, answer_sheet: null });
    setSubmission(null);
    setError("");
  }

  function openUploadPage() {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById("upload-page")?.scrollIntoView({
      behavior: reducedMotion ? "auto" : "smooth",
      block: "start",
    });
  }

  if (submission?.stage === "done") {
    return <ReviewWorkspace result={submission} onReset={reset} />;
  }

  return (
    <main className="landing-shell">
      <section className="scenery-page" aria-label="Pixel-art sunflower field">
        <header className="scenery-header">
          <span className="scenery-wordmark">VedaAI</span>
          <button className="ai-symbol-button" type="button" onClick={openUploadPage} aria-label="Open Veda AI upload workspace">
            <Sparkles size={24} aria-hidden="true" />
          </button>
        </header>
      </section>

      <section className="upload-shell" id="upload-page">
        <header className="site-header">
          <div className="brand"><span><GraduationCap size={21} /></span><div>Veda AI<small>STUDY QUEST</small></div></div>
        </header>

        <section className="upload-hero">
          <div className="hero-copy">
            <div className="hero-kicker"><Sparkles size={14} /> Your assessment sidekick</div>
            <h1>Upload. Match.<br /><em>Level up!</em></h1>
            <p>Drop in a question paper and handwritten answer sheet. Veda finds every response and maps it back to the right question.</p>
          </div>
        </section>

        <section className="upload-workspace">
          <div className="upload-grid">
            <UploadCard kind="question_paper" title="Question paper" description="The original assessment and marking scale" file={files.question_paper} onFile={updateFile} />
            <UploadCard kind="answer_sheet" title="Student answer sheet" description="One student's handwritten responses" file={files.answer_sheet} onFile={updateFile} />
          </div>

          {submission ? <PipelineProgress submission={submission} /> : (
            <div className="start-row">
              <div className="privacy-note"><ShieldCheck size={18} /><span><strong>Private by design</strong><small>Files are used only for this assessment review.</small></span></div>
              <button className="button button--primary" disabled={!ready || working} onClick={processSubmission}>
                {working ? <LoaderCircle className="spin" size={17} /> : <Sparkles size={17} />}
                Start mapping quest
                <ArrowRight size={17} />
              </button>
            </div>
          )}
          {error && <div className="error-banner"><CircleAlert size={16} />{error}</div>}
        </section>

        <footer className="upload-footer">
          <span>QUEST PATH</span>
          <div><span>01</span> Find questions</div>
          <div><span>02</span> Read answers</div>
          <div><span>03</span> Verify matches</div>
        </footer>
      </section>
    </main>
  );
}
