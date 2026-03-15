import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Switch,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { MaterialIcons } from "@expo/vector-icons";
import { NativeModules } from "react-native";
import BottomNav from "../components/BottomNav";
import { useNavigation } from "@react-navigation/native";
import {
  getInstalledApps,
  AppInfo,
} from "../native/InstalledApps";

const { FocusModule, AccessibilityModule } = NativeModules;

export default function FocusScreen() {
  const navigation = useNavigation();
  const [focusActive, setFocusActive] = useState(false);
  const [apps, setApps] = useState<AppInfo[]>([]);
  const [selectedApps, setSelectedApps] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      if (!FocusModule) return;

      const active = await FocusModule.isFocusActive?.();
      const savedApps = await FocusModule.getDistractingApps?.();
      const installed = await getInstalledApps?.();

      setFocusActive(active ?? false);
      setSelectedApps(new Set(savedApps ?? []));
      setApps(installed ?? []);
    } catch (e) {
      console.warn("Focus load error:", e);
    } finally {
      setLoading(false);
    }
  };

  const toggleFocus = async (val: boolean) => {
    if (!FocusModule) return;

    if (selectedApps.size === 0) return;

    if (val && Platform.OS === "android") {
      const enabled = await FocusModule.isAccessibilityEnabled?.();

      if (!enabled) {
        Alert.alert(
          "Accessibility Required",
          "Please enable Accessibility permission to use Focus Mode.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Open Settings",
              onPress: () =>
                AccessibilityModule?.openAccessibilitySettings?.(),
            },
          ]
        );
        return;
      }
    }

    await FocusModule.setFocusActive?.(val);
    setFocusActive(val);
  };

  const toggleApp = async (pkg: string) => {
    if (!FocusModule) return;

    const updated = new Set(selectedApps);

    if (updated.has(pkg)) updated.delete(pkg);
    else updated.add(pkg);

    setSelectedApps(updated);
    await FocusModule.setDistractingApps?.(Array.from(updated));

    if (updated.size === 0) {
      setFocusActive(false);
      await FocusModule.setFocusActive?.(false);
    }
  };

  const filteredApps = useMemo(() => {
    return apps.filter((a) =>
      a.appName.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, apps]);

  const displayedApps = expanded
    ? filteredApps
    : filteredApps.slice(0, 10);

  const selectedAppObjects = apps.filter((a) =>
    selectedApps.has(a.packageName)
  );

  return (
    <>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.page}>
          <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Focus Mode</Text>
            </View>

            <View style={styles.card}>
              <View style={styles.row}>
                <View>
                  <Text style={styles.cardTitle}>Focus Mode</Text>
                  <Text style={styles.cardSub}>
                    {selectedApps.size === 0
                      ? "Select apps to enable focus"
                      : focusActive
                      ? "Blocking selected apps"
                      : "Currently inactive"}
                  </Text>
                </View>

                <Switch
                  value={focusActive}
                  onValueChange={toggleFocus}
                  disabled={selectedApps.size === 0}
                  trackColor={{ false: "#E5E7EB", true: "#10B981" }}
                />
              </View>
            </View>

            <Text style={styles.sectionTitle}>Distracting Apps</Text>

            {selectedAppObjects.length === 0 && (
              <Text style={styles.emptyText}>No apps selected</Text>
            )}

            {selectedAppObjects.map((app) => (
              <View key={app.packageName} style={styles.selectedRow}>
                <Image source={{ uri: app.iconUri }} style={styles.selectedIcon} />
                <Text style={styles.selectedName}>{app.appName}</Text>
                <TouchableOpacity onPress={() => toggleApp(app.packageName)}>
                  <MaterialIcons name="close" size={20} color="#DC2626" />
                </TouchableOpacity>
              </View>
            ))}

            <View style={styles.selectorCard}>
              <View style={styles.searchBox}>
                <MaterialIcons name="search" size={18} color="#9CA3AF" />
                <TextInput
                  placeholder="Search apps..."
                  placeholderTextColor="#9CA3AF"
                  style={styles.searchInput}
                  value={search}
                  onChangeText={setSearch}
                />
              </View>

              {loading ? (
                <ActivityIndicator />
              ) : (
                <>
                  {displayedApps.map((item) => {
                    const isSelected = selectedApps.has(item.packageName);

                    return (
                      <TouchableOpacity
                        key={item.packageName}
                        style={styles.appRow}
                        onPress={() => toggleApp(item.packageName)}
                      >
                        <Image source={{ uri: item.iconUri }} style={styles.icon} />
                        <Text style={styles.appName}>{item.appName}</Text>
                        {isSelected && (
                          <MaterialIcons
                            name="check-circle"
                            size={22}
                            color="#10B981"
                          />
                        )}
                      </TouchableOpacity>
                    );
                  })}

                  {filteredApps.length > 10 && (
                    <TouchableOpacity
                      style={styles.expandBtn}
                      onPress={() => setExpanded(!expanded)}
                    >
                      <Text style={styles.expandText}>
                        {expanded ? "Show Less" : "Show More"}
                      </Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>
          </ScrollView>

          <BottomNav navigation={navigation} />
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#10B981" },
  page: { flex: 1, backgroundColor: "#F5F7FB" },

  header: {
    height: 140,
    backgroundColor: "#10B981",
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },

  headerTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
  },

  card: {
    backgroundColor: "#FFFFFF",
    margin: 16,
    marginTop: -40,
    padding: 20,
    borderRadius: 20,
    elevation: 3,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },

  cardSub: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 4,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 8,
  },

  emptyText: {
    marginHorizontal: 16,
    color: "#9CA3AF",
  },

  selectedRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    paddingVertical: 8,
  },

  selectedIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    marginRight: 10,
  },

  selectedName: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
  },

  selectorCard: {
    backgroundColor: "#FFFFFF",
    margin: 16,
    padding: 12,
    borderRadius: 20,
    elevation: 3,
  },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 10,
    borderRadius: 12,
    marginBottom: 12,
  },

  searchInput: {
    flex: 1,
    marginLeft: 8,
  },

  appRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },

  appName: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
  },

  icon: {
    width: 36,
    height: 36,
    borderRadius: 10,
  },

  expandBtn: {
    marginTop: 10,
    alignItems: "center",
  },

  expandText: {
    color: "#10B981",
    fontWeight: "600",
  },

  scheduleCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 18,
    elevation: 2,
  },

  scheduleText: {
    fontSize: 13,
    color: "#6B7280",
  },

  scheduleBtn: {
    marginTop: 12,
    backgroundColor: "#10B981",
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },

  scheduleBtnText: {
    color: "#fff",
    fontWeight: "600",
  },
});