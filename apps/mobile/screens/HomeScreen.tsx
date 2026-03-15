import React, { useEffect, useState, useCallback } from "react";

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  RefreshControl,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { MaterialIcons } from "@expo/vector-icons";
import BottomNav from "../components/BottomNav";

import { getAuth } from "firebase/auth";
import { getFirestore, doc, onSnapshot } from "firebase/firestore";

import RNUsageStats from "react-native-usage-stats";
import { getInstalledApps } from "../native/InstalledApps";
import { useIsFocused } from "@react-navigation/native";

type UsageStat = {
  packageName: string;
  totalTimeInForeground: number;
};

const SELF_PACKAGE = "com.anonymous.digitalcalmslapp";

export default function HomeScreen({ navigation }) {

  const auth = getAuth();
  const db = getFirestore();
  const user = auth.currentUser;
  const isFocused = useIsFocused();

  const [name, setName] = useState(user?.displayName || "");
  const [photo, setPhoto] = useState(null);

  const [screenTime, setScreenTime] = useState("0m");

  const [mostUsedApp, setMostUsedApp] = useState({
    name: "N/A",
    time: "0m",
    icon: "",
  });

  const [refreshing, setRefreshing] = useState(false);

  /* ---------------- NEW AI NUDGE STATE ---------------- */

  const [nudge, setNudge] = useState("");

  const avatarMap = {
    boy: require("../assets/boy.png"),
    girl: require("../assets/girl.png"),
    man: require("../assets/man.png"),
  };

  /* ---------------- HELPERS ---------------- */

  const millisToReadable = (ms) => {
    if (!ms || ms <= 0) return "0m";
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const mergeUsageByPackage = (stats: UsageStat[]): UsageStat[] => {
    const map: Record<string, UsageStat> = {};

    for (const s of stats) {
      if (!s.packageName) continue;

      if (!map[s.packageName]) {
        map[s.packageName] = { ...s };
      } else {
        map[s.packageName].totalTimeInForeground +=
          s.totalTimeInForeground || 0;
      }
    }

    return Object.values(map);
  };

  /* ---------------- SEND DATA TO AI ---------------- */

  const sendUsageForNudge = async (totalMs, mostUsedAppName) => {
    try {
      if (!user) return;

      await fetch(
        "https://us-central1-digitalcalm.cloudfunctions.net/generateMindfulnessNudge",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            uid: user.uid,
            screenTime: totalMs,
            mostUsedApp: mostUsedAppName,
            timeOfDay: new Date().getHours()
          }),
        }
      );
    } catch (err) {
      console.log("Nudge API error:", err);
    }
  };

  /* ---------------- LISTEN FOR AI NUDGE ---------------- */

  const listenForNudge = () => {

    if (!user) return;

    const today = new Date().toISOString().split("T")[0];

    return onSnapshot(
      doc(db, "users", user.uid, "nudges", today),
      (snap) => {
        if (snap.exists()) {
          setNudge(snap.data().content);
        }
      }
    );
  };

  /* ---------------- USAGE ---------------- */

  const fetchUsageStats = async () => {
    try {

      const granted = await RNUsageStats.checkPermission();

      if (!granted) {
        await RNUsageStats.openUsageAccessSettings(SELF_PACKAGE);
        return;
      }

      const installed = await getInstalledApps();

      const installedMap = {};
      installed.forEach((a) => {
        installedMap[a.packageName] = a;
      });

      const start = new Date();
      start.setHours(0, 0, 0, 0);

      const rawStats = (await RNUsageStats.queryUsageStats(
        start.getTime(),
        Date.now()
      )) as UsageStat[];

      const merged = mergeUsageByPackage(rawStats);

      const realUsage = merged.filter((s: UsageStat) => {
        if (!s.packageName) return false;
        if (s.packageName === SELF_PACKAGE) return false;
        if (!installedMap[s.packageName]) return false;
        return s.totalTimeInForeground >= 20000;
      });

      /* ---------- TODAY TOTAL ---------- */

      const totalMs = realUsage.reduce(
        (a, x) => a + (x.totalTimeInForeground || 0),
        0
      );

      setScreenTime(millisToReadable(totalMs));

      /* ---------- MOST USED APP ---------- */

      if (realUsage.length > 0) {

        const top = realUsage.sort(
          (a, b) =>
            (b.totalTimeInForeground || 0) -
            (a.totalTimeInForeground || 0)
        )[0];

        const match = installedMap[top.packageName];

        setMostUsedApp({
          name: match?.appName || "Unknown",
          time: millisToReadable(top.totalTimeInForeground),
          icon: match?.iconUri || "",
        });

        /* ---------- SEND DATA TO AI ---------- */

        await sendUsageForNudge(totalMs, match?.appName);

      } else {

        setMostUsedApp({
          name: "N/A",
          time: "0m",
          icon: "",
        });

      }

    } catch {
      setScreenTime("0m");
    }
  };

  /* ---------------- USER DATA ---------------- */

  const fetchUserData = useCallback(() => {
    if (!user) return;

    return onSnapshot(doc(db, "users", user.uid), (snap) => {

      if (snap.exists()) {

        const data = snap.data();

        setName(data.name || "User");

        setPhoto(
          data.photo
            ? avatarMap[data.photo]
            : require("../assets/user.png")
        );
      }
    });

  }, [user]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchUsageStats();
    setRefreshing(false);
  }, []);

  useEffect(() => {

    if (!isFocused) return;

    const unsubUser = fetchUserData();
    const unsubNudge = listenForNudge();

    fetchUsageStats();

    const interval = setInterval(() => {
      const now = new Date();

      if (now.getHours() === 0 && now.getMinutes() === 0) {
        fetchUsageStats();
      }
    }, 60000);

    return () => {
      if (unsubUser) unsubUser();
      if (unsubNudge) unsubNudge();
      clearInterval(interval);
    };

  }, [isFocused]);

  return (
    <>
      <StatusBar style="light" />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.page}>

          <View style={styles.header}>
            <View>
              <Text style={styles.appName}>DigitalCalm SL</Text>
              <Text style={styles.subtitle}>Your Wellbeing Companion</Text>
            </View>

            <TouchableOpacity
              onPress={() => navigation.navigate("UserProfileScreen")}
            >
              <Image
                source={photo || require("../assets/user.png")}
                style={styles.avatar}
              />
            </TouchableOpacity>
          </View>

          <ScrollView
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            contentContainerStyle={styles.container}
          >

            <View style={styles.cardFloating}>

              <Text style={styles.cardTitle}>Today's Usage</Text>

              <View style={styles.grid}>

                <Stat label="Screen Time" value={screenTime} icon="schedule" />

                <View style={styles.stat}>

                  {mostUsedApp.icon ? (
                    <Image
                      source={{ uri: mostUsedApp.icon }}
                      style={styles.appIcon}
                    />
                  ) : (
                    <MaterialIcons name="apps" size={34} color="#10B981" />
                  )}

                  <Text style={styles.statValue}>{mostUsedApp.name}</Text>
                  <Text style={styles.statLabel}>{mostUsedApp.time}</Text>

                </View>

                <Stat label="vs Average" value="0%" icon="trending-up" />
                <Stat label="App Sessions" value="0" icon="repeat" />

              </View>
            </View>

            {/* ---------------- AI MINDFULNESS NUDGE ---------------- */}

            <View style={styles.clayWrapper}>

              <View style={styles.clayLeaf}>
                <MaterialIcons
                  name="energy-savings-leaf"
                  size={26}
                  color="#FFFFFF"
                />
              </View>

              <View style={styles.clayCard}>

                <Text style={styles.nudgeMessage}>
                  {nudge || "Generating your personalized mindfulness nudge..."}
                </Text>

                <Text style={styles.claySubtitle}>
                  Small mindful moments can help reset your focus and bring calm to your day.
                </Text>

              </View>
            </View>

          </ScrollView>

          <BottomNav navigation={navigation} />

        </View>
      </SafeAreaView>
    </>
  );
}

/* ---------------- SMALL COMPONENT ---------------- */

const Stat = ({ label, value, icon }) => (
  <View style={styles.stat}>
    <MaterialIcons name={icon} size={34} color="#10B981" />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({

  safeArea: {
    flex: 1,
    backgroundColor: "#10B981",
  },

  page: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },

  header: {
    height: 150,
    backgroundColor: "#10B981",
    paddingHorizontal: 16,
    paddingBottom: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },

  appName: { color: "#fff", fontSize: 24, fontWeight: "800", bottom: 30 },
  subtitle: { color: "#ECFEF5", fontSize: 14, bottom: 30 },

  avatar: {
    width: 46,
    height: 46,
    bottom: 30,
    borderRadius: 23,
    backgroundColor: "#fff",
  },

  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 120,
  },

  cardFloating: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    elevation: 4,
  },

  cardTitle: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 14,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  stat: {
    width: "48%",
    backgroundColor: "#F9FAFB",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },

  statValue: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 8,
  },

  statLabel: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 4,
  },

  appIcon: {
    width: 34,
    height: 34,
    borderRadius: 6,
  },

  clayWrapper: {
    marginBottom: 24,
  },

  clayLeaf: {
    position: "absolute",
    top: -18,
    left: 15,
    zIndex: 10,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#22C55E",
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    marginTop: 15,
  },

  clayCard: {
    backgroundColor: "#F9FAF9",
    borderRadius: 20,
    paddingTop: 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
    elevation: 6,
    marginTop: 25,
  },

  claySubtitle: {
    fontSize: 15,
    color: "#11181399",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 20,
  },

  nudgeMessage: {
    fontSize: 17,
    fontWeight: "500",
    color: "#1F2937",
    lineHeight: 26,
    letterSpacing: 0.2,
    marginBottom: 10,
    textAlign: "center",
  }

});