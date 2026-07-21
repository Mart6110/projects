import React, { useCallback, useState } from "react";
import { FlatList } from "react-native";
import { useFocusEffect } from "@react-navigation/native";

import { Box } from "@/components/ui/box";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";

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
    <Box className="flex-1 bg-background">
      <FlatList
        data={entries}
        keyExtractor={(item) => `${item.type}-${item.id}`}
        contentContainerClassName="p-4"
        refreshing={isLoading}
        onRefresh={load}
        ListEmptyComponent={
          !isLoading ? (
            <Text className="mt-10 text-center text-muted-foreground">No workouts or runs logged yet.</Text>
          ) : null
        }
        renderItem={({ item }) => (
          <Card className="mb-3">
            {item.type === "session" ? (
              <>
                <Text className="font-semibold">🏋️ {item.routineName}</Text>
                <Text className="mt-1 text-muted-foreground">{item.setCount} sets logged</Text>
              </>
            ) : (
              <>
                <Text className="font-semibold">
                  🏃 Run · {(item.distanceMeters / 1000).toFixed(2)} km
                </Text>
                <Text className="mt-1 text-muted-foreground">
                  {formatDuration(item.durationSeconds)} · {formatPace(item.durationSeconds, item.distanceMeters)}
                </Text>
              </>
            )}
            <Text className="mt-2 text-xs text-muted-foreground">{new Date(item.date).toLocaleString()}</Text>
          </Card>
        )}
      />
    </Box>
  );
}
