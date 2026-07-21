import React, { useState } from "react";
import { Alert, Platform } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { KeyboardAvoidingView } from "@/components/ui/keyboard-avoiding-view";
import { ScrollView } from "@/components/ui/scroll-view";
import { Box } from "@/components/ui/box";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Input, InputField } from "@/components/ui/input";
import { Button, ButtonText, ButtonSpinner } from "@/components/ui/button";
import { Pressable } from "@/components/ui/pressable";

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
    <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView className="flex-1 bg-background p-4" contentContainerClassName="pb-10">
        <Text className="mb-1.5 text-muted-foreground">Routine name</Text>
        <Input className="mb-5">
          <InputField placeholder="e.g. Push Day" value={name} onChangeText={setName} />
        </Input>

        <Heading size="md" className="mb-3">
          Exercises
        </Heading>

        <VStack space="md" className="mb-2">
          {exercises.map((ex, index) => (
            <Card key={index}>
              <Input className="mb-3">
                <InputField
                  placeholder="Exercise name"
                  value={ex.name}
                  onChangeText={(v) => updateExercise(index, "name", v)}
                />
              </Input>
              <HStack space="sm">
                <Box className="flex-1">
                  <Text className="mb-1 text-xs text-muted-foreground">Sets</Text>
                  <Input>
                    <InputField
                      keyboardType="number-pad"
                      value={ex.sets}
                      onChangeText={(v) => updateExercise(index, "sets", v)}
                    />
                  </Input>
                </Box>
                <Box className="flex-1">
                  <Text className="mb-1 text-xs text-muted-foreground">Reps</Text>
                  <Input>
                    <InputField
                      keyboardType="number-pad"
                      value={ex.reps}
                      onChangeText={(v) => updateExercise(index, "reps", v)}
                    />
                  </Input>
                </Box>
                <Box className="flex-1">
                  <Text className="mb-1 text-xs text-muted-foreground">Weight (kg)</Text>
                  <Input>
                    <InputField
                      keyboardType="decimal-pad"
                      placeholder="optional"
                      value={ex.weight}
                      onChangeText={(v) => updateExercise(index, "weight", v)}
                    />
                  </Input>
                </Box>
              </HStack>
              {exercises.length > 1 && (
                <Pressable onPress={() => removeExercise(index)}>
                  <Text className="mt-2 text-destructive">Remove exercise</Text>
                </Pressable>
              )}
            </Card>
          ))}
        </VStack>

        <Button
          variant="ghost"
          className="mb-5"
          onPress={() => setExercises((prev) => [...prev, emptyExercise()])}
        >
          <ButtonText>+ Add exercise</ButtonText>
        </Button>

        <Button onPress={handleSave} disabled={isSubmitting}>
          {isSubmitting ? <ButtonSpinner /> : <ButtonText>Save routine</ButtonText>}
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
