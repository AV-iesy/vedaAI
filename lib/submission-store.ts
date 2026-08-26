import type { SubmissionResult } from "./types";
import type { PipelineArtifacts, SubmissionUploads } from "./extraction-types";

const globalStore = globalThis as typeof globalThis & {
  vedaSubmissions?: Map<string, SubmissionResult>;
  vedaSubmissionUploads?: Map<string, SubmissionUploads>;
  vedaPipelineArtifacts?: Map<string, PipelineArtifacts>;
};

export const submissionStore =
  globalStore.vedaSubmissions ?? new Map<string, SubmissionResult>();

export const submissionUploadStore =
  globalStore.vedaSubmissionUploads ?? new Map<string, SubmissionUploads>();

export const pipelineArtifactStore =
  globalStore.vedaPipelineArtifacts ?? new Map<string, PipelineArtifacts>();

if (process.env.NODE_ENV !== "production") {
  globalStore.vedaSubmissions = submissionStore;
  globalStore.vedaSubmissionUploads = submissionUploadStore;
  globalStore.vedaPipelineArtifacts = pipelineArtifactStore;
}
