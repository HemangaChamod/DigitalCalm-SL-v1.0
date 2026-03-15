import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import RNUsageStats from "react-native-usage-stats";
import BottomNav from "../components/BottomNav";
import { getInstalledApps } from "../native/InstalledApps";

/* -------------------- TYPES -------------------- */

type UsageStat = {
  packageName: string;
  totalTimeInForeground: number;
};

type TopApp = {
  name: string;
  iconUri?: string;
  time: string;
};

const SELF_PACKAGE = "com.anonymous.digitalcalmslapp";

/* -------------------- COMPONENT -------------------- */

export default function InsightsScreen({ navigation }: any) {
  const [todayUsage, setTodayUsage] = useState("—");
  const [topApps, setTopApps] = useState<TopApp[]>([]);
  const [dailyUsage, setDailyUsage] = useState<number[]>([]);

  const [loadingChart, setLoadingChart] = useState(true);
  const [loadingTopApps, setLoadingTopApps] = useState(true);

  /* -------------------- HELPERS -------------------- */

  const millisToReadable = (ms: number) => {
    if (!ms || ms <= 0) return "0m";
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const minutesToLabel = (minutes: number) => {
    if (minutes >= 60) {
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      return m ? `${h}h ${m}m` : `${h}h`;
    }
    return `${minutes}m`;
  };

  /* -------------------- MERGE DUPLICATES -------------------- */

  const mergeUsageByPackage = (stats: UsageStat[]): UsageStat[] => {
    const map: Record<string, UsageStat> = {};
    for (const s of stats) {
      if (!s.packageName) continue;
      if (!map[s.packageName]) map[s.packageName] = { ...s };
      else map[s.packageName].totalTimeInForeground += s.totalTimeInForeground;
    }
    return Object.values(map);
  };

  /* -------------------- INSTALLED APPS MAP -------------------- */

  const buildInstalledAppMap = (apps: any[]) => {
    const map: Record<string, any> = {};
    apps.forEach((a) => (map[a.packageName] = a));
    return map;
  };

  /* -------------------- FILTER REAL USAGE -------------------- */

  const filterRealUsage = (
    stats: UsageStat[],
    installedMap: Record<string, any>
  ) =>
    stats.filter(
      (s) =>
        s.packageName &&
        s.packageName !== SELF_PACKAGE &&
        installedMap[s.packageName] &&
        s.totalTimeInForeground >= 20000
    );

  /* -------------------- WEEKLY SCREEN TIME -------------------- */

  const getDailyScreenTime = async (installedMap: Record<string, any>) => {
    const today = new Date();
    const week: number[] = [];

    for (let i = 6; i >= 0; i--) {
      const start = new Date(today);
      start.setDate(start.getDate() - i);
      start.setHours(0, 0, 0, 0);

      const end = new Date(start);
      end.setHours(23, 59, 59, 999);

      const stats = (await RNUsageStats.queryUsageStats(
        start.getTime(),
        end.getTime()
      )) as UsageStat[];

      const merged = mergeUsageByPackage(stats);
      const real = filterRealUsage(merged, installedMap);

      const minutes = Math.floor(
        real.reduce((a, x) => a + x.totalTimeInForeground, 0) / 60000
      );

      week.push(Math.min(minutes, 16 * 60));
    }

    setDailyUsage(week);
    setLoadingChart(false);
  };

  /* -------------------- MAIN FETCH -------------------- */

  useEffect(() => {
    const fetchData = async () => {
      const granted = await RNUsageStats.checkPermission();
      if (!granted) {
        await RNUsageStats.openUsageAccessSettings(SELF_PACKAGE);
        return;
      }

      const installed = await getInstalledApps();
      const installedMap = buildInstalledAppMap(installed);

      const start = new Date();
      start.setHours(0, 0, 0, 0);

      const stats = (await RNUsageStats.queryUsageStats(
        start.getTime(),
        Date.now()
      )) as UsageStat[];

      const merged = mergeUsageByPackage(stats);
      const filtered = filterRealUsage(merged, installedMap);

      const totalMs = filtered.reduce(
        (a, x) => a + x.totalTimeInForeground,
        0
      );
      setTodayUsage(millisToReadable(totalMs));

      setTopApps(
        filtered
          .sort((a, b) => b.totalTimeInForeground - a.totalTimeInForeground)
          .slice(0, 10)
          .map((a) => ({
            name: installedMap[a.packageName].appName,
            iconUri: installedMap[a.packageName].iconUri,
            time: millisToReadable(a.totalTimeInForeground),
          }))
      );

      setLoadingTopApps(false);
      await getDailyScreenTime(installedMap);
    };

    fetchData();
  }, []);

  const maxValue = Math.max(...dailyUsage, 1);

  /* -------------------- UI -------------------- */

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Insights</Text>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
          {/* ---------- SCREEN TIME CARD ---------- */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Today Screen Time</Text>
            <Text style={styles.screenTime}>{todayUsage}</Text>

            {loadingChart ? (
              <View style={styles.loaderBox}>
                <ActivityIndicator size="large" color="#2563EB" />
                <Text style={styles.loaderText}>Loading usage data…</Text>
              </View>
            ) : (
              <>
                <View style={styles.barRow}>
                  {dailyUsage.map((v, i) => (
                    <View key={i} style={styles.barWrap}>
                      <Text style={styles.barValue}>
                        {minutesToLabel(v)}
                      </Text>
                      <View
                        style={[
                          styles.bar,
                          { height: (v / maxValue) * 130 },
                        ]}
                      />
                    </View>
                  ))}
                </View>

                <View style={styles.days}>
                  {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((d) => (
                    <Text key={d} style={styles.day}>
                      {d}
                    </Text>
                  ))}
                </View>
              </>
            )}
          </View>

          {/* ---------- TOP APPS ---------- */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top Used Apps</Text>

            {loadingTopApps ? (
              <View style={styles.loaderBox}>
                <ActivityIndicator size="large" color="#2563EB" />
                <Text style={styles.loaderText}>
                  Analyzing app usage…
                </Text>
              </View>
            ) : (
              topApps.map((app, i) => (
                <View key={i} style={styles.appCard}>
                  {app.iconUri ? (
                    <Image
                      source={{ uri: app.iconUri }}
                      style={styles.appIcon}
                    />
                  ) : (
                    <MaterialIcons
                      name="apps"
                      size={30}
                      color="#2563EB"
                    />
                  )}
                  <Text style={styles.appName}>{app.name}</Text>
                  <Text style={styles.appTime}>{app.time}</Text>
                </View>
              ))
            )}
          </View>
        </ScrollView>

        <BottomNav navigation={navigation} />
      </View>
    </SafeAreaView>
  );
}

/* -------------------- STYLES -------------------- */

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#2563EB" },
  page: { flex: 1, backgroundColor: "#F5F7FB" },

  header: {
    height: 150,
    backgroundColor: "#2563EB",
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    justifyContent: "flex-end",
    paddingBottom: 24,
  },
  headerTitle: {
    textAlign: "center",
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
    bottom: 50,
  },

  card: {
    marginHorizontal: 16,
    marginTop: 20,
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 20,
    elevation: 4,
  },

  cardTitle: { color: "#6B7280", fontSize: 15, fontWeight: "600" },
  screenTime: {
    fontSize: 40,
    fontWeight: "800",
    color: "#111827",
    marginVertical: 12,
  },

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

  barRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    height: 150,
    alignItems: "flex-end",
  },
  barWrap: { alignItems: "center", width: 30 },
  bar: { width: 18, backgroundColor: "#60A5FA", borderRadius: 10 },
  barValue: { fontSize: 10, color: "#6B7280", marginBottom: 6 },

  days: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 12,
  },
  day: { fontSize: 12, color: "#6B7280", fontWeight: "600" },

  section: { marginTop: 28, paddingHorizontal: 16 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
  },

  appCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    padding: 14,
    borderRadius: 16,
    marginBottom: 12,
    elevation: 2,
  },
  appIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    marginRight: 14,
  },
  appName: { flex: 1, fontSize: 16, fontWeight: "700" },
  appTime: { fontSize: 14, color: "#6B7280", fontWeight: "600" },
});
