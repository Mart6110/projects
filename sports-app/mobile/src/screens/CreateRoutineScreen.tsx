import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { createRoutine } from "../api/routines";
import { ApiError } from "../api/client";
import type { RoutinesStackParamList } from "../navigation/RootNavigator";

type Props = NativeStackScreenProps<RoutinesStackParamList, "CreateRoutine">;

interface DraftExercise {
  name: string;
  sets: string;
  reps: string;
  weight: string;
}

function emptyExercise(): DraftExercise {
  return { name: "", sets: "3", reps: "10", weight: "" };
}

export default function CreateRoutineScreen({ navigation }: Props) {
  const [name, setName] = useState("");
  const [exercises, setExercises] = useState<DraftExercise[]>([emptyExercise()]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateExercise(index: number, field: keyof DraftExercise, value: string) {
    setExercises((prev) => prev.map((ex, i) => (i === index ? { ...ex, [field]: value } : ex)));
  }

  function removeExercise(index: number) {
    setExercises((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    const validExercises = exercises.filter((ex) => ex.name.trim().length > 0);
    if (!name.trim() || validExercises.length === 0) {
      Alert.alert("Missing info", "Give the routine a name and at least one exercise.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createRoutine({
        name: name.trim(),
        exercises: validExercises.map((ex) => ({
          name: ex.name.trim(),
          sets: parseInt(ex.sets, 10) || 1,
          reps: parseInt(ex.reps, 10) || 1,
          weight_kg: ex.weight ? parseFloat(ex.weight) : undefined,
        })),
      });
      navigation.goBack();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Could not save the routine.";
      Alert.alert("Error", message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
        <Text style={styles.label}>Routine name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Push Day"
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.sectionTitle}>Exercises</Text>
        {exercises.map((ex, index) => (
          <View key={index} style={styles.exerciseCard}>
            <TextInput
              style={styles.input}
              placeholder="Exercise name"
              value={ex.name}
              onChangeText={(v) => updateExercise(index, "name", v)}
            />
            <View style={styles.row}>
              <View style={styles.rowField}>
                <Text style={styles.smallLabel}>Sets</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="number-pad"
                  value={ex.sets}
                  onChangeText={(v) => updateExercise(index, "sets", v)}
                />
              </View>
              <View style={styles.rowField}>
                <Text style={styles.smallLabel}>Reps</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="number-pad"
                  value={ex.reps}
                  onChangeText={(v) => updateExercise(index, "reps", v)}
                />
              </View>
              <View style={styles.rowField}>
                <Text style={styles.smallLabel}>Weight (kg)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="decimal-pad"
                  placeholder="optional"
                  value={ex.weight}
                  onChangeText={(v) => updateExercise(index, "weight", v)}
                />
              </View>
            </View>
            {exercises.length > 1 && (
              <TouchableOpacity onPress={() => removeExercise(index)}>
                <Text style={styles.removeText}>Remove exercise</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setExercises((prev) => [...prev, emptyExercise()])}
        >
          <Text style={styles.addButtonText}>+ Add exercise</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveButton, isSubmitting && styles.disabled]}
          onPress={handleSave}
          disabled={isSubmitting}
        >
          <Text style={styles.saveButtonText}>{isSubmitting ? "Saving..." : "Save routine"}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16 },
  label: { fontSize: 14, color: "#555", marginBottom: 6 },
  smallLabel: { fontSize: 12, color: "#777", marginBottom: 4 },
  sectionTitle: { fontSize: 18, fontWeight: "700", marginTop: 20, marginBottom: 10 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  exerciseCard: {
    backgroundColor: "#f9fafb",
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#eee",
  },
  row: { flexDirection: "row", gap: 8 },
  rowField: { flex: 1 },
  removeText: { color: "#dc2626", marginTop: 4 },
  addButton: { alignItems: "center", padding: 12, marginBottom: 20 },
  addButtonText: { color: "#2563eb", fontWeight: "600" },
  saveButton: { backgroundColor: "#16a34a", borderRadius: 10, padding: 16, alignItems: "center" },
  saveButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  disabled: { opacity: 0.5 },
});
