import React, { useEffect, useRef, useState } from "react";
import { Alert } from "react-native";
import * as Location from "expo-location";

import { Box } from "@/components/ui/box";
import { VStack } from "@/components/ui/vstack";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Button, ButtonText } from "@/components/ui/button";

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
    <Box className="flex-1 items-center justify-center bg-background p-6">
      <VStack className="mb-12 items-center">
        <Heading size="5xl">{(distanceMeters / 1000).toFixed(2)} km</Heading>
        <Text className="mt-2 text-2xl text-foreground">{formatDuration(elapsedSeconds)}</Text>
        <Text className="mt-1 text-lg text-muted-foreground">{formatPace(elapsedSeconds, distanceMeters)}</Text>
        {isTracking && (
          <Text className="mt-4 text-sm text-muted-foreground">{pointCount} GPS points recorded</Text>
        )}
      </VStack>

      {!isTracking ? (
        <Button
          className="rounded-full bg-green-600 px-12 py-6 data-[hover=true]:bg-green-600/90 data-[active=true]:bg-green-600/90"
          onPress={handleStart}
          disabled={isSaving}
        >
          <ButtonText className="text-lg">{isSaving ? "Saving..." : "Start Run"}</ButtonText>
        </Button>
      ) : (
        <Button variant="destructive" className="rounded-full px-12 py-6" onPress={handleStop}>
          <ButtonText className="text-lg">Stop Run</ButtonText>
        </Button>
      )}
    </Box>
  );
}
