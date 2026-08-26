import type { SubmissionResult } from "./types";

const globalStore = globalThis as typeof globalThis & {
  vedaSubmissions?: Map<string, SubmissionResult>;
};

export const submissionStore =
  globalStore.vedaSubmissions ?? new Map<string, SubmissionResult>();

if (process.env.NODE_ENV !== "production") {
  globalStore.vedaSubmissions = submissionStore;
}
