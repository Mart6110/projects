import React from "react";

import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Button, ButtonText } from "@/components/ui/button";

import { useAuth } from "../context/AuthContext";

export default function AccountScreen() {
  const { user, logout } = useAuth();

  return (
    <Box className="flex-1 items-center justify-center bg-background p-6">
      <Text className="mb-6 text-foreground">{user?.email}</Text>
      <Button variant="destructive" onPress={logout}>
        <ButtonText>Log out</ButtonText>
      </Button>
    </Box>
  );
}
