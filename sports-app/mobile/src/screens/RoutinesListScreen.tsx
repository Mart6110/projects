import React, { useCallback, useState } from "react";
import { FlatList } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { Box } from "@/components/ui/box";
import { Card } from "@/components/ui/card";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { Button, ButtonText } from "@/components/ui/button";

import { listRoutines } from "../api/routines";
import { Routine } from "../types";
import type { RoutinesStackParamList } from "../navigation/RootNavigator";

type Props = NativeStackScreenProps<RoutinesStackParamList, "RoutinesList">;

export default function RoutinesListScreen({ navigation }: Props) {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setIsLoading(true);
      listRoutines()
        .then((data) => {
          if (!cancelled) setRoutines(data);
        })
        .finally(() => {
          if (!cancelled) setIsLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }, [])
  );

  return (
    <Box className="flex-1 bg-background">
      <FlatList
        data={routines}
        keyExtractor={(item) => item.id}
        contentContainerClassName="p-4 pb-24"
        refreshing={isLoading}
        onRefresh={() => listRoutines().then(setRoutines)}
        ListEmptyComponent={
          !isLoading ? (
            <Text className="mt-10 text-center text-muted-foreground">
              No routines yet. Create one to get started.
            </Text>
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => navigation.navigate("RoutineDetail", { routineId: item.id })}>
            <Card className="mb-3">
              <Heading size="sm">{item.name}</Heading>
              <Text className="mt-1 text-muted-foreground">{item.exercises.length} exercises</Text>
            </Card>
          </Pressable>
        )}
      />

      <Button className="absolute bottom-6 left-4 right-4" onPress={() => navigation.navigate("CreateRoutine")}>
        <ButtonText>+ New Routine</ButtonText>
      </Button>
    </Box>
  );
}
