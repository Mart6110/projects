import { apiRequest } from "./client";
import { Routine } from "../types";

export interface NewRoutineExercise {
  name: string;
  sets: number;
  reps: number;
  weight_kg?: number;
}

export interface NewRoutine {
  name: string;
  exercises: NewRoutineExercise[];
}

export function listRoutines(): Promise<Routine[]> {
  return apiRequest<Routine[]>("/routines");
}

export function getRoutine(id: string): Promise<Routine> {
  return apiRequest<Routine>(`/routines/${id}`);
}

export function createRoutine(routine: NewRoutine): Promise<Routine> {
  return apiRequest<Routine>("/routines", { method: "POST", body: routine });
}

export function deleteRoutine(id: string): Promise<void> {
  return apiRequest<void>(`/routines/${id}`, { method: "DELETE" });
}
