import React, { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { getRoutine } from "../api/routines";
import { createSession, NewSessionLog } from "../api/sessions";
import { ApiError } from "../api/client";
import { Routine } from "../types";
import type { RoutinesStackParamList } from "../navigation/RootNavigator";

type Props = NativeStackScreenProps<RoutinesStackParamList, "StartSession">;

interface DraftSet {
  exerciseName: string;
  setNumber: number;
  reps: string;
  weight: string;
}

export default function StartSessionScreen({ route, navigation }: Props) {
  const { routineId } = route.params;
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [draftSets, setDraftSets] = useState<DraftSet[]>([]);
  const [notes, setNotes] = useState("");
  const [startedAt] = useState(new Date().toISOString());
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    getRoutine(routineId).then((data) => {
      setRoutine(data);
      const sets: DraftSet[] = [];
      for (const ex of data.exercises) {
        for (let i = 1; i <= ex.sets; i++) {
          sets.push({
            exerciseName: ex.name,
            setNumber: i,
            reps: String(ex.reps),
            weight: ex.weight_kg ? String(ex.weight_kg) : "",
          });
        }
      }
      setDraftSets(sets);
    });
  }, [routineId]);

  function updateSet(index: number, field: "reps" | "weight", value: string) {
    setDraftSets((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  }

  async function handleFinish() {
    setIsSubmitting(true);
    try {
      const logs: NewSessionLog[] = draftSets.map((s) => ({
        exercise_name: s.exerciseName,
        set_number: s.setNumber,
        reps: parseInt(s.reps, 10) || 0,
        weight_kg: s.weight ? parseFloat(s.weight) : undefined,
      }));
      await createSession({ routine_id: routineId, notes: notes.trim() || undefined, started_at: startedAt, logs });
      navigation.popToTop();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Could not save the session.";
      Alert.alert("Error", message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!routine) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  let lastExercise = "";

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <Text style={styles.title}>{routine.name}</Text>

      {draftSets.map((set, index) => {
        const showHeader = set.exerciseName !== lastExercise;
        lastExercise = set.exerciseName;
        return (
          <View key={index}>
            {showHeader && <Text style={styles.exerciseHeader}>{set.exerciseName}</Text>}
            <View style={styles.setRow}>
              <Text style={styles.setLabel}>Set {set.setNumber}</Text>
              <TextInput
                style={styles.setInput}
                keyboardType="number-pad"
                value={set.reps}
                onChangeText={(v) => updateSet(index, "reps", v)}
              />
              <Text style={styles.unit}>reps</Text>
              <TextInput
                style={styles.setInput}
                keyboardType="decimal-pad"
                placeholder="kg"
                value={set.weight}
                onChangeText={(v) => updateSet(index, "weight", v)}
              />
              <Text style={styles.unit}>kg</Text>
            </View>
          </View>
        );
      })}

      <Text style={styles.label}>Notes</Text>
      <TextInput
        style={styles.notesInput}
        placeholder="How did it feel?"
        multiline
        value={notes}
        onChangeText={setNotes}
      />

      <TouchableOpacity
        style={[styles.finishButton, isSubmitting && styles.disabled]}
        onPress={handleFinish}
        disabled={isSubmitting}
      >
        <Text style={styles.finishButtonText}>{isSubmitting ? "Saving..." : "Finish Session"}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 12 },
  exerciseHeader: { fontSize: 16, fontWeight: "700", marginTop: 16, marginBottom: 6, color: "#2563eb" },
  setRow: { flexDirection: "row", alignItems: "center", marginBottom: 6, gap: 6 },
  setLabel: { width: 56, color: "#555" },
  setInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    padding: 8,
    width: 60,
    textAlign: "center",
  },
  unit: { color: "#888", marginRight: 6 },
  label: { fontSize: 14, color: "#555", marginTop: 20, marginBottom: 6 },
  notesInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    minHeight: 70,
    textAlignVertical: "top",
  },
  finishButton: { backgroundColor: "#16a34a", borderRadius: 10, padding: 16, alignItems: "center", marginTop: 24 },
  finishButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  disabled: { opacity: 0.5 },
});
