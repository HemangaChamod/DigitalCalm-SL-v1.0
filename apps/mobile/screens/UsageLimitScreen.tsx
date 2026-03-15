import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import BottomNav from "../components/BottomNav";
import UsageLimitBottomSheet from "../components/UsageLimitBottomSheet";
import {
  getInstalledApps,
  AppInfo,
} from "../native/InstalledApps";
import { NativeModules } from "react-native";

const { LimitModule, AccessibilityModule } = NativeModules;

export default function UsageLimitScreen({ navigation }: any) {
  const [apps, setApps] = useState<AppInfo[]>([]);
  const [limits, setLimits] = useState<Record<string, number>>({});
  const [lockedApps, setLockedApps] = useState<Record<string, boolean>>({});
  const [selectedApp, setSelectedApp] = useState<AppInfo | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loadingApps, setLoadingApps] = useState(true);

  useEffect(() => {
    loadApps();
  }, []);

  const loadApps = async () => {
    try {
      setLoadingApps(true);

      const list = await getInstalledApps();
      setApps(list);

      const limitMap: Record<string, number> = {};
      const lockMap: Record<string, boolean> = {};

      for (const app of list) {
        try {
          const limit = await LimitModule.getLimit(app.packageName);
          const locked = await LimitModule.isLocked(app.packageName);

          limitMap[app.packageName] = limit;
          lockMap[app.packageName] = locked;
        } catch {}
      }

      setLimits(limitMap);
      setLockedApps(lockMap);
    } catch (e) {
      console.warn("Failed to load apps:", e);
    } finally {
      setLoadingApps(false);
    }
  };

  const checkAccessibilityAndProceed = async (app: AppInfo) => {
    try {
      const enabled =
        await AccessibilityModule.isAccessibilityEnabled();

      if (!enabled) {
        Alert.alert(
          "Permission Required",
          "To set usage limits, enable Accessibility permission for DigitalCalm.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Open Settings",
              onPress: () =>
                AccessibilityModule.openAccessibilitySettings(),
            },
          ]
        );
        return;
      }

      setSelectedApp(app);
      setModalVisible(true);

    } catch (e) {
      console.warn("Accessibility check failed", e);
    }
  };

  const handleSaveLimit = async (minutes: number) => {
    if (!selectedApp) return;

    await LimitModule.setAppLimit(
      selectedApp.packageName,
      minutes
    );

    await loadApps();

    setModalVisible(false);
    setSelectedApp(null);
  };

  const handleRemoveLimit = async () => {
    if (!selectedApp) return;

    const locked = await LimitModule.isLocked(
      selectedApp.packageName
    );

    if (locked) {
      Alert.alert(
        "App Locked",
        "This app is locked for today and cannot be unlocked."
      );
      return;
    }

    await LimitModule.setAppLimit(
      selectedApp.packageName,
      0
    );

    await loadApps();

    setModalVisible(false);
    setSelectedApp(null);
  };

  const getLockRemainingText = () => {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);

    const diffMs = midnight.getTime() - now.getTime();
    const hours = Math.floor(diffMs / 3600000);
    const minutes = Math.floor((diffMs % 3600000) / 60000);

    return `Locked for ${hours}h ${minutes}m`;
  };

  return (
    <>
      <StatusBar style="light" />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.page}>
          <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
            <View style={styles.header}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.backBtn}
              >
                <MaterialIcons
                  name="arrow-back-ios-new"
                  size={22}
                  color="#fff"
                />
              </TouchableOpacity>

              <Text style={styles.headerTitle}>
                Set Usage Limits
              </Text>
            </View>

            <View style={styles.section}>
              {loadingApps ? (
                <View style={styles.loaderBox}>
                  <ActivityIndicator size="large" color="#2563EB" />
                  <Text style={styles.loaderText}>
                    Loading your installed apps…
                  </Text>
                </View>
              ) : (
                apps.map((app) => (
                  <TouchableOpacity
                    key={app.packageName}
                    style={styles.appCard}
                    onPress={() =>
                      checkAccessibilityAndProceed(app)
                    }
                  >
                    {app.iconUri ? (
                      <Image
                        source={{ uri: app.iconUri }}
                        style={styles.icon}
                      />
                    ) : (
                      <MaterialIcons
                        name="apps"
                        size={34}
                        color="#2563EB"
                      />
                    )}

                    <View style={{ flex: 1 }}>
                      <Text style={styles.appName}>
                        {app.appName}
                      </Text>

                      <Text style={styles.limitText}>
                        {lockedApps[app.packageName]
                          ? "Locked"
                          : limits[app.packageName] > 0
                            ? `Limit: ${limits[app.packageName]} min`
                            : "No limit set"}
                      </Text>
                    </View>

                    <MaterialIcons
                      name="chevron-right"
                      size={24}
                      color="#9CA3AF"
                    />
                  </TouchableOpacity>
                ))
              )}
            </View>
          </ScrollView>

          <UsageLimitBottomSheet
            visible={modalVisible}
            appName={selectedApp?.appName || ""}
            iconUri={selectedApp?.iconUri}
            isLocked={
              selectedApp
                ? lockedApps[selectedApp.packageName]
                : false
            }
            lockRemaining={getLockRemainingText()}
            onCancel={() => {
              setModalVisible(false);
              setSelectedApp(null);
            }}
            onSave={handleSaveLimit}
            onRemove={handleRemoveLimit}
          />

          <BottomNav navigation={navigation} />
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#2563EB" },
  page: { flex: 1, backgroundColor: "#F5F7FB" },
  header: {
    height: 150,
    backgroundColor: "#2563EB",
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  backBtn: {
    position: "absolute",
    left: 16,
    top: 35,
    backgroundColor: "rgba(255,255,255,0.3)",
    padding: 10,
    borderRadius: 24,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 40,
  },
  section: { paddingHorizontal: 16, marginTop: -40 },
  loaderBox: {
    height: 150,
    justifyContent: "center",
    alignItems: "center",
  },
  loaderText: {
    marginTop: 10,
    color: "#6B7280",
    fontWeight: "600",
  },
  appCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 18,
    marginBottom: 12,
    elevation: 3,
  },
  icon: { width: 44, height: 44, borderRadius: 12, marginRight: 14 },
  appName: { fontSize: 16, fontWeight: "700", color: "#111827" },
  limitText: { fontSize: 13, color: "#6B7280", marginTop: 4 },
});
