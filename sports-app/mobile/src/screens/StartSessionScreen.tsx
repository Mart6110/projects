import React, { useEffect, useState } from "react";
import { Alert } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { ScrollView } from "@/components/ui/scroll-view";
import { Box } from "@/components/ui/box";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Input, InputField } from "@/components/ui/input";
import { Textarea, TextareaInput } from "@/components/ui/textarea";
import { Button, ButtonText, ButtonSpinner } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

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
      <Box className="flex-1 items-center justify-center bg-background">
        <Spinner />
      </Box>
    );
  }

  let lastExercise = "";

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="p-4 pb-10">
      <Heading size="lg" className="mb-3">
        {routine.name}
      </Heading>

      <VStack space="xs" className="mb-2">
        {draftSets.map((set, index) => {
          const showHeader = set.exerciseName !== lastExercise;
          lastExercise = set.exerciseName;
          return (
            <Box key={index}>
              {showHeader && (
                <Heading size="sm" className="mb-1.5 mt-4 text-primary">
                  {set.exerciseName}
                </Heading>
              )}
              <HStack space="sm" className="items-center">
                <Text className="w-14 text-muted-foreground">Set {set.setNumber}</Text>
                <Input className="w-16">
                  <InputField
                    keyboardType="number-pad"
                    className="text-center"
                    value={set.reps}
                    onChangeText={(v) => updateSet(index, "reps", v)}
                  />
                </Input>
                <Text className="text-muted-foreground">reps</Text>
                <Input className="w-16">
                  <InputField
                    keyboardType="decimal-pad"
                    placeholder="kg"
                    className="text-center"
                    value={set.weight}
                    onChangeText={(v) => updateSet(index, "weight", v)}
                  />
                </Input>
                <Text className="text-muted-foreground">kg</Text>
              </HStack>
            </Box>
          );
        })}
      </VStack>

      <Text className="mb-1.5 mt-5 text-muted-foreground">Notes</Text>
      <Textarea>
        <TextareaInput placeholder="How did it feel?" multiline value={notes} onChangeText={setNotes} />
      </Textarea>

      <Button className="mt-6" onPress={handleFinish} disabled={isSubmitting}>
        {isSubmitting ? <ButtonSpinner /> : <ButtonText>Finish Session</ButtonText>}
      </Button>
    </ScrollView>
  );
}
