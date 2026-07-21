import React, { useState } from "react";
import { Alert } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { Box } from "@/components/ui/box";
import { VStack } from "@/components/ui/vstack";
import { Heading } from "@/components/ui/heading";
import { Button, ButtonSpinner, ButtonText } from "@/components/ui/button";
import { Input, InputField } from "@/components/ui/input";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";

import { useAuth } from "../context/AuthContext";
import { ApiError } from "../api/client";
import type { AuthStackParamList } from "../navigation/RootNavigator";

type Props = NativeStackScreenProps<AuthStackParamList, "Register">;

export default function RegisterScreen({ navigation }: Props) {
  const { register } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    setIsSubmitting(true);
    try {
      await register(email.trim(), password);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Something went wrong. Please try again.";
      Alert.alert("Registration failed", message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const disabled = !email || password.length < 6 || isSubmitting;

  return (
    <Box className="flex-1 justify-center bg-background p-6">
      <Heading size="2xl" className="mb-8 text-center">
        Create an account
      </Heading>

      <VStack space="md">
        <Input>
          <InputField
            placeholder="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
        </Input>
        <Input>
          <InputField
            placeholder="Password (min 6 characters)"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </Input>

        <Button className="mt-2" onPress={handleSubmit} disabled={disabled}>
          {isSubmitting ? <ButtonSpinner /> : <ButtonText>Register</ButtonText>}
        </Button>

        <Pressable onPress={() => navigation.navigate("Login")}>
          <Text className="mt-2 text-center text-primary">Already have an account? Log in</Text>
        </Pressable>
      </VStack>
    </Box>
  );
}
