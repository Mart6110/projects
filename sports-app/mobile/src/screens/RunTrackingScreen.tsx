import React, { useEffect, useRef, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import * as Location from "expo-location";

import { createRun } from "../api/runs";
import { ApiError } from "../api/client";
import { RunPoint } from "../types";
import { formatDuration, formatPace, haversineDistanceMeters } from "../utils/geo";

export default function RunTrackingScreen() {
  const [isTracking, setIsTracking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [distanceMeters, setDistanceMeters] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [pointCount, setPointCount] = useState(0);

  const pointsRef = useRef<RunPoint[]>([]);
  const startTimeRef = useRef<number | null>(null);
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      subscriptionRef.current?.remove();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  async function handleStart() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Location permission needed", "Enable location access to track your run.");
      return;
    }

    pointsRef.current = [];
    setDistanceMeters(0);
    setElapsedSeconds(0);
    setPointCount(0);
    startTimeRef.current = Date.now();
    setIsTracking(true);

    timerRef.current = setInterval(() => {
      if (startTimeRef.current) {
        setElapsedSeconds((Date.now() - startTimeRef.current) / 1000);
      }
    }, 1000);

    subscriptionRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        distanceInterval: 5,
        timeInterval: 3000,
      },
      (location) => {
        const point: RunPoint = {
          sequence: pointsRef.current.length,
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          recorded_at: new Date(location.timestamp).toISOString(),
        };

        const prev = pointsRef.current[pointsRef.current.length - 1];
        if (prev) {
          const delta = haversineDistanceMeters(prev.latitude, prev.longitude, point.latitude, point.longitude);
          setDistanceMeters((d) => d + delta);
        }

        pointsRef.current.push(point);
        setPointCount(pointsRef.current.length);
      }
    );
  }

  async function handleStop() {
    subscriptionRef.current?.remove();
    subscriptionRef.current = null;
    if (timerRef.current) clearInterval(timerRef.current);
    setIsTracking(false);

    if (pointsRef.current.length < 2 || !startTimeRef.current) {
      Alert.alert("Run too short", "Not enough GPS data was recorded to save this run.");
      return;
    }

    setIsSaving(true);
    try {
      const startedAt = new Date(startTimeRef.current).toISOString();
      const endedAt = new Date().toISOString();
      await createRun({
        started_at: startedAt,
        ended_at: endedAt,
        distance_meters: Math.round(distanceMeters),
        duration_seconds: Math.round(elapsedSeconds),
        points: pointsRef.current,
      });
      Alert.alert("Run saved", `${(distanceMeters / 1000).toFixed(2)} km in ${formatDuration(elapsedSeconds)}`);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Could not save the run.";
      Alert.alert("Error saving run", message);
    } finally {
      setIsSaving(false);
      setDistanceMeters(0);
      setElapsedSeconds(0);
      setPointCount(0);
      pointsRef.current = [];
      startTimeRef.current = null;
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.stats}>
        <Text style={styles.distance}>{(distanceMeters / 1000).toFixed(2)} km</Text>
        <Text style={styles.duration}>{formatDuration(elapsedSeconds)}</Text>
        <Text style={styles.pace}>{formatPace(elapsedSeconds, distanceMeters)}</Text>
        {isTracking && <Text style={styles.pointCount}>{pointCount} GPS points recorded</Text>}
      </View>

      {!isTracking ? (
        <TouchableOpacity style={styles.startButton} onPress={handleStart} disabled={isSaving}>
          <Text style={styles.buttonText}>{isSaving ? "Saving..." : "Start Run"}</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.stopButton} onPress={handleStop}>
          <Text style={styles.buttonText}>Stop Run</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", justifyContent: "center", alignItems: "center", padding: 24 },
  stats: { alignItems: "center", marginBottom: 48 },
  distance: { fontSize: 56, fontWeight: "800" },
  duration: { fontSize: 28, color: "#333", marginTop: 8 },
  pace: { fontSize: 18, color: "#666", marginTop: 4 },
  pointCount: { fontSize: 13, color: "#999", marginTop: 16 },
  startButton: {
    backgroundColor: "#16a34a",
    borderRadius: 50,
    paddingVertical: 20,
    paddingHorizontal: 48,
  },
  stopButton: {
    backgroundColor: "#dc2626",
    borderRadius: 50,
    paddingVertical: 20,
    paddingHorizontal: 48,
  },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "700" },
});
