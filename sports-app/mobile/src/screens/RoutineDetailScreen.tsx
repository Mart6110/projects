import React, { useCallback, useState } from "react";
import { Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { ScrollView } from "@/components/ui/scroll-view";
import { Box } from "@/components/ui/box";
import { VStack } from "@/components/ui/vstack";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Button, ButtonText } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

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
      <Box className="flex-1 items-center justify-center bg-background">
        <Spinner />
      </Box>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="p-4">
      <Heading size="xl" className="mb-4">
        {routine.name}
      </Heading>

      <VStack space="sm" className="mb-5">
        {routine.exercises.map((ex, index) => (
          <Card key={index}>
            <Text className="font-semibold">{ex.name}</Text>
            <Text className="mt-0.5 text-muted-foreground">
              {ex.sets} sets x {ex.reps} reps{ex.weight_kg ? ` @ ${ex.weight_kg} kg` : ""}
            </Text>
          </Card>
        ))}
      </VStack>

      <Button onPress={() => navigation.navigate("StartSession", { routineId: routine.id, routineName: routine.name })}>
        <ButtonText>Start Session</ButtonText>
      </Button>

      <Button variant="ghost" className="mt-3" onPress={handleDelete}>
        <ButtonText className="text-destructive">Delete Routine</ButtonText>
      </Button>
    </ScrollView>
  );
}
