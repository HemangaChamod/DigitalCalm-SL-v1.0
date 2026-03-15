import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from "react-native";
import UsageStats from "react-native-usage-stats";
import { useIsFocused } from "@react-navigation/native";

export default function UsagePermissionScreen({ navigation }: any) {
  const isFocused = useIsFocused();
  const [granted, setGranted] = useState<boolean>(false);
  const [checking, setChecking] = useState<boolean>(true);

  const APP_PACKAGE = "com.anonymous.digitalcalmslapp";

  const checkPermission = useCallback(async () => {
    try {
      if (Platform.OS !== "android") {
        setGranted(true);
        setChecking(false);
        navigation.replace("NotificationPermissionScreen");
        return;
      }

      setChecking(true);
      const has = await UsageStats.checkPermission();
      setGranted(Boolean(has));

      if (has) {
        navigation.replace("NotificationPermissionScreen");
      }

    } catch (err) {
      console.warn("checkPermission error:", err);
      setGranted(false);
    } finally {
      setChecking(false);
    }
  }, [navigation]);

  useEffect(() => {
    if (isFocused) checkPermission();
  }, [isFocused, checkPermission]);

  const openSettings = async () => {
    if (Platform.OS !== "android") {
      Alert.alert("Not supported", "Usage Access is only available on Android.");
      return;
    }

    try {
      UsageStats.openUsageAccessSettings(APP_PACKAGE);

      let attempts = 0;
      const poll = setInterval(async () => {
        attempts += 1;
        const has = await UsageStats.checkPermission();
        if (has) {
          clearInterval(poll);
          setGranted(true);
          navigation.replace("NotificationPermissionScreen");
        } else if (attempts >= 8) {
          clearInterval(poll);
        }
      }, 1000);
    } catch (err) {
      console.warn("openSettings error:", err);
      Alert.alert("Error", "Couldn't open settings. Please open Usage Access manually.");
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Access App Usage Data</Text>
          <Text style={styles.subtitle}>
            To show your personalized usage insights, this permission is required.
          </Text>
        </View>

        <View style={styles.imageWrap}>
          <Image
            source={require("../assets/grant-permision.png")}
            style={styles.illustration}
            resizeMode="contain"
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.grantBtn} onPress={openSettings}>
          <Text style={styles.grantText}>GRANT PERMISSION</Text>
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
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 80,
  },

  header: {
    alignItems: "center",
    marginBottom: 32,
    width: "100%",
  },

  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#0f172a",
    textAlign: "center",
    marginBottom: 12,
  },

  subtitle: {
    fontSize: 15,
    color: "#475569",
    textAlign: "center",
    maxWidth: 320,
    lineHeight: 20,
  },

  imageWrap: {
    alignItems: "center",
    marginTop: -50,
    marginBottom: 30,
  },

  illustration: {
    width: 500,
    height: 500,
  },

  footer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },

  grantBtn: {
    backgroundColor: "#28a745",
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: "center",
    marginBottom:60,
  },

  grantText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 16,
  },
});
