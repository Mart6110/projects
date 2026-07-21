import { apiRequest } from "./client";
import { Run, RunPoint } from "../types";

export interface NewRun {
  started_at: string;
  ended_at: string;
  distance_meters: number;
  duration_seconds: number;
  points: RunPoint[];
}

export function listRuns(): Promise<Run[]> {
  return apiRequest<Run[]>("/runs");
}

export function getRun(id: string): Promise<Run> {
  return apiRequest<Run>(`/runs/${id}`);
}

export function createRun(run: NewRun): Promise<Run> {
  return apiRequest<Run>("/runs", { method: "POST", body: run });
}
