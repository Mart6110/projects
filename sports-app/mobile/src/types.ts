export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface RoutineExercise {
  name: string;
  sets: number;
  reps: number;
  weight_kg?: number;
}

export interface Routine {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  exercises: RoutineExercise[];
}

export interface SessionExerciseLog {
  exercise_name: string;
  set_number: number;
  reps: number;
  weight_kg?: number;
}

export interface RoutineSession {
  id: string;
  user_id: string;
  routine_id: string;
  routine_name: string;
  notes?: string;
  started_at: string;
  completed_at: string;
  logs: SessionExerciseLog[];
}

export interface RunPoint {
  sequence: number;
  latitude: number;
  longitude: number;
  recorded_at: string;
}

export interface Run {
  id: string;
  user_id: string;
  started_at: string;
  ended_at: string;
  distance_meters: number;
  duration_seconds: number;
  points?: RunPoint[];
}
