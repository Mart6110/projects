import { apiRequest } from "./client";
import { RoutineSession } from "../types";

export interface NewSessionLog {
  exercise_name: string;
  set_number: number;
  reps: number;
  weight_kg?: number;
}

export interface NewSession {
  routine_id: string;
  notes?: string;
  started_at: string;
  logs: NewSessionLog[];
}

export function listSessions(): Promise<RoutineSession[]> {
  return apiRequest<RoutineSession[]>("/sessions");
}

export function getSession(id: string): Promise<RoutineSession> {
  return apiRequest<RoutineSession>(`/sessions/${id}`);
}

export function createSession(session: NewSession): Promise<RoutineSession> {
  return apiRequest<RoutineSession>("/sessions", { method: "POST", body: session });
}
