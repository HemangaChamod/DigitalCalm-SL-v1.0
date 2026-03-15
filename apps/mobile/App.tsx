import React, { useEffect, useState } from "react";
import { AppState } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { onAuthStateChanged } from "firebase/auth";
import FlashMessage from "react-native-flash-message";

import { auth } from "./config/firebase";

import WelcomeScreen from "./screens/WelcomeScreen";
import SigninScreen from "./screens/SigninScreen";
import SignupScreen from "./screens/SignupScreen";
import AccountCreatedScreen from "./screens/AccountCreatedScreen";
import UsagePermissionScreen from "./screens/UsagePermissionScreen";
import NotificationPermissionScreen from "./screens/NotificationPermissionScreen";
import HomeScreen from "./screens/HomeScreen";
import InsightScreen from "./screens/InsightScreen";
import ActionsScreen from "./screens/ActionsScreen";
import SettingsScreen from "./screens/SettingsScreen";
import UserProfileScreen from "./screens/UserProfileScreen";
import UsageLimitScreen from "./screens/UsageLimitScreen";
import FocusScreen from "./screens/FocusScreen"

const Stack = createNativeStackNavigator();

export default function App() {
  const [user, setUser] = useState<any | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [appFlow, setAppFlow] = useState<
    "loading" | "welcome" | "auth" | "permission" | "app"
  >("loading");

  /* ---------------- AUTH FLOW ---------------- */

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        setUser(currentUser);
        setAuthReady(true);

        const hasSeenWelcome = await AsyncStorage.getItem("hasSeenWelcome");

        if (!hasSeenWelcome) {
          setAppFlow("welcome");
          return;
        }

        if (!currentUser) {
          setAppFlow("auth");
          return;
        }

        setAppFlow("app");
      } catch (e) {
        console.log("App init error:", e);
        setAppFlow("welcome");
      }
    });

    return unsubscribe;
  }, []);

  if (!authReady || appFlow === "loading") {
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        key={appFlow}
        screenOptions={{ headerShown: false }}
        initialRouteName={
          appFlow === "welcome"
            ? "Welcome"
            : appFlow === "auth"
            ? "Login"
            : appFlow === "permission"
            ? "UsagePermissionScreen"
            : "Home"
        }
      >
        {/* ONBOARDING */}
        <Stack.Screen name="Welcome">
          {(props) => (
            <WelcomeScreen
              {...props}
              onContinue={async () => {
                await AsyncStorage.setItem("hasSeenWelcome", "true");
                setAppFlow("auth");
              }}
            />
          )}
        </Stack.Screen>

        {/* AUTH */}
        <Stack.Screen name="Login" component={SigninScreen} />
        <Stack.Screen name="SignupScreen" component={SignupScreen} />
        <Stack.Screen
          name="AccountCreatedScreen"
          component={AccountCreatedScreen}
        />

        {/* PERMISSIONS */}
        <Stack.Screen
          name="UsagePermissionScreen"
          component={UsagePermissionScreen}
        />
        <Stack.Screen
          name="NotificationPermissionScreen"
          component={NotificationPermissionScreen}
        />

        {/* APP */}
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Insight" component={InsightScreen} />
        <Stack.Screen name="Action" component={ActionsScreen} />
        <Stack.Screen name="Setting" component={SettingsScreen} />
        <Stack.Screen
          name="UserProfileScreen"
          component={UserProfileScreen}
        />
        <Stack.Screen name="UsageLimitScreen" component={UsageLimitScreen} />
        <Stack.Screen name="FocusScreen" component={FocusScreen} />
      </Stack.Navigator>

      {/* TOP POP NOTIFICATIONS */}
      <FlashMessage position="top" />
    </NavigationContainer>
  );
}
