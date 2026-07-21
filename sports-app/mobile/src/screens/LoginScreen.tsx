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

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

export default function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    setIsSubmitting(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Something went wrong. Please try again.";
      Alert.alert("Login failed", message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const disabled = !email || !password || isSubmitting;

  return (
    <Box className="flex-1 justify-center bg-background p-6">
      <Heading size="2xl" className="mb-8 text-center">
        Welcome back
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
          <InputField placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />
        </Input>

        <Button className="mt-2" onPress={handleSubmit} disabled={disabled}>
          {isSubmitting ? <ButtonSpinner /> : <ButtonText>Log in</ButtonText>}
        </Button>

        <Pressable onPress={() => navigation.navigate("Register")}>
          <Text className="mt-2 text-center text-primary">Don't have an account? Register</Text>
        </Pressable>
      </VStack>
    </Box>
  );
}
