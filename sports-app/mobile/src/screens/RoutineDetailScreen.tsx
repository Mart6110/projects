import React, { useCallback, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { deleteRoutine, getRoutine } from "../api/routines";
import { Routine } from "../types";
import type { RoutinesStackParamList } from "../navigation/RootNavigator";

type Props = NativeStackScreenProps<RoutinesStackParamList, "RoutineDetail">;

export default function RoutineDetailScreen({ route, navigation }: Props) {
  const { routineId } = route.params;
  const [routine, setRoutine] = useState<Routine | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      getRoutine(routineId).then((data) => {
        if (!cancelled) setRoutine(data);
      });
      return () => {
        cancelled = true;
      };
    }, [routineId])
  );

  function handleDelete() {
    Alert.alert("Delete routine?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteRoutine(routineId);
          navigation.goBack();
        },
      },
    ]);
  }

  if (!routine) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.title}>{routine.name}</Text>

      {routine.exercises.map((ex, index) => (
        <View key={index} style={styles.exerciseRow}>
          <Text style={styles.exerciseName}>{ex.name}</Text>
          <Text style={styles.exerciseMeta}>
            {ex.sets} sets x {ex.reps} reps{ex.weight_kg ? ` @ ${ex.weight_kg} kg` : ""}
          </Text>
        </View>
      ))}

      <TouchableOpacity
        style={styles.startButton}
        onPress={() => navigation.navigate("StartSession", { routineId: routine.id, routineName: routine.name })}
      >
        <Text style={styles.startButtonText}>Start Session</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
        <Text style={styles.deleteButtonText}>Delete Routine</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 16 },
  exerciseRow: {
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#eee",
  },
  exerciseName: { fontSize: 16, fontWeight: "600" },
  exerciseMeta: { color: "#666", marginTop: 2 },
  startButton: {
    backgroundColor: "#2563eb",
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
    marginTop: 20,
  },
  startButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  deleteButton: { alignItems: "center", padding: 14, marginTop: 12 },
  deleteButtonText: { color: "#dc2626" },
});
