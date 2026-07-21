import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { useAuth } from "../context/AuthContext";

export default function AccountScreen() {
  const { user, logout } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.email}>{user?.email}</Text>
      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Log out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 24, justifyContent: "center", alignItems: "center" },
  email: { fontSize: 16, color: "#333", marginBottom: 24 },
  logoutButton: { backgroundColor: "#dc2626", borderRadius: 10, paddingVertical: 14, paddingHorizontal: 32 },
  logoutText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
