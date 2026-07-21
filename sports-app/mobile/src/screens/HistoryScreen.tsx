import React, { useCallback, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";

import { listSessions } from "../api/sessions";
import { listRuns } from "../api/runs";
import { formatDuration, formatPace } from "../utils/geo";

type HistoryEntry =
  | { type: "session"; date: string; id: string; routineName: string; setCount: number }
  | { type: "run"; date: string; id: string; distanceMeters: number; durationSeconds: number };

export default function HistoryScreen() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    const [sessions, runs] = await Promise.all([listSessions(), listRuns()]);

    const sessionEntries: HistoryEntry[] = sessions.map((s) => ({
      type: "session",
      date: s.completed_at,
      id: s.id,
      routineName: s.routine_name,
      setCount: s.logs.length,
    }));
    const runEntries: HistoryEntry[] = runs.map((r) => ({
      type: "run",
      date: r.started_at,
      id: r.id,
      distanceMeters: r.distance_meters,
      durationSeconds: r.duration_seconds,
    }));

    const merged = [...sessionEntries, ...runEntries].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    setEntries(merged);
    setIsLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={entries}
        keyExtractor={(item) => `${item.type}-${item.id}`}
        contentContainerStyle={styles.list}
        refreshing={isLoading}
        onRefresh={load}
        ListEmptyComponent={
          !isLoading ? <Text style={styles.empty}>No workouts or runs logged yet.</Text> : null
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            {item.type === "session" ? (
              <>
                <Text style={styles.cardTitle}>🏋️ {item.routineName}</Text>
                <Text style={styles.cardSubtitle}>{item.setCount} sets logged</Text>
              </>
            ) : (
              <>
                <Text style={styles.cardTitle}>🏃 Run · {(item.distanceMeters / 1000).toFixed(2)} km</Text>
                <Text style={styles.cardSubtitle}>
                  {formatDuration(item.durationSeconds)} · {formatPace(item.durationSeconds, item.distanceMeters)}
                </Text>
              </>
            )}
            <Text style={styles.cardDate}>{new Date(item.date).toLocaleString()}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f7fa" },
  list: { padding: 16 },
  empty: { textAlign: "center", color: "#888", marginTop: 40 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#eee",
  },
  cardTitle: { fontSize: 16, fontWeight: "600" },
  cardSubtitle: { color: "#666", marginTop: 4 },
  cardDate: { color: "#999", fontSize: 12, marginTop: 8 },
});
