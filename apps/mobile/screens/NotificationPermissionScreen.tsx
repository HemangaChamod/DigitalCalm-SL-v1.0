import React, { useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
  Image,
  ScrollView,
} from "react-native";
import * as Notifications from "expo-notifications";
import { useIsFocused } from "@react-navigation/native";

export default function NotificationPermissionScreen({ navigation }: any) {
  const isFocused = useIsFocused();

  const checkPermission = useCallback(async () => {
    if (Platform.OS !== "android") {
      navigation.replace("Home");
      return;
    }

    const settings = await Notifications.getPermissionsAsync();
    if (settings.granted) {
      navigation.replace("Home");
    }
  }, [navigation]);

  useEffect(() => {
    if (isFocused) {
      checkPermission();
    }
  }, [isFocused, checkPermission]);

  const requestPermission = async () => {
    const { granted } = await Notifications.requestPermissionsAsync();
    if (granted) {
      navigation.replace("Home");
    } else {
      Alert.alert(
        "Permission Required",
        "Notifications are needed to show focus alerts and unlock timers."
      );
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container}>
        <Image
          source={require("../assets/notification-bell1.png")}
          style={styles.image}
          resizeMode="contain"
        />

        <Text style={styles.title}>Stay Informed</Text>
        <Text style={styles.subtitle}>
          Enable notifications to receive lock alerts,
          countdowns, and focus reminders.
          
        </Text>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>ENABLE NOTIFICATIONS</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },

  container: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingTop: 80,
  },

  image: {
    width: 300,
    height: 300,
    marginBottom: 24,
  },

  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#0f172a",
    textAlign: "center",
  },

  subtitle: {
    marginTop: 12,
    fontSize: 15,
    color: "#475569",
    textAlign: "center",
    maxWidth: 320,
    lineHeight: 20,
  },

  footer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },

  button: {
    backgroundColor: "#16a34a",
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: "center",
    marginBottom: 60,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});
