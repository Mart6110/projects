import React from "react";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import { useAuth } from "../context/AuthContext";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import RoutinesListScreen from "../screens/RoutinesListScreen";
import CreateRoutineScreen from "../screens/CreateRoutineScreen";
import RoutineDetailScreen from "../screens/RoutineDetailScreen";
import StartSessionScreen from "../screens/StartSessionScreen";
import RunTrackingScreen from "../screens/RunTrackingScreen";
import HistoryScreen from "../screens/HistoryScreen";
import AccountScreen from "../screens/AccountScreen";

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type RoutinesStackParamList = {
  RoutinesList: undefined;
  CreateRoutine: undefined;
  RoutineDetail: { routineId: string };
  StartSession: { routineId: string; routineName: string };
};

export type RootTabParamList = {
  RoutinesTab: undefined;
  RunTab: undefined;
  HistoryTab: undefined;
  AccountTab: undefined;
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const RoutinesStack = createNativeStackNavigator<RoutinesStackParamList>();
const Tab = createBottomTabNavigator<RootTabParamList>();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

function RoutinesNavigator() {
  return (
    <RoutinesStack.Navigator>
      <RoutinesStack.Screen
        name="RoutinesList"
        component={RoutinesListScreen}
        options={{ title: "Routines" }}
      />
      <RoutinesStack.Screen
        name="CreateRoutine"
        component={CreateRoutineScreen}
        options={{ title: "New Routine" }}
      />
      <RoutinesStack.Screen
        name="RoutineDetail"
        component={RoutineDetailScreen}
        options={{ title: "Routine" }}
      />
      <RoutinesStack.Screen
        name="StartSession"
        component={StartSessionScreen}
        options={({ route }) => ({ title: route.params.routineName })}
      />
    </RoutinesStack.Navigator>
  );
}

function AppNavigator() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="RoutinesTab" component={RoutinesNavigator} options={{ title: "Routines" }} />
      <Tab.Screen name="RunTab" component={RunTrackingScreen} options={{ title: "Run" }} />
      <Tab.Screen name="HistoryTab" component={HistoryScreen} options={{ title: "History" }} />
      <Tab.Screen name="AccountTab" component={AccountScreen} options={{ title: "Account" }} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <NavigationContainer>{user ? <AppNavigator /> : <AuthNavigator />}</NavigationContainer>;
}
