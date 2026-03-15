import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import BottomNav from "../components/BottomNav";
import { StatusBar } from "expo-status-bar";

export default function ActionScreen({ navigation }) {
  return (
    <>
      <StatusBar style="light" />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.page}>
          
          <LinearGradient
            colors={["#7C3AED", "#6D28D9"]}
            style={styles.header}
          >
            <Text style={styles.headerTitle}>Actions</Text>
          </LinearGradient>

          <ScrollView contentContainerStyle={styles.container}>

            <View style={styles.learningCard}>
              <View style={styles.learningRow}>
                <View style={styles.purpleBadge}>
                  <MaterialIcons name="auto-awesome" size={24} color="#6D28D9" />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.learningTitle}>
                    Learning your usage…
                  </Text>

                  <Text style={styles.learningText}>
                    Analyzing your device usage to spot patterns and send helpful
                    reminders to optimize your focus.
                  </Text>

                </View>
              </View>
            </View>

            <Text style={styles.sectionLabel}>Quick Actions</Text>

            {/* APP USAGE LIMITS */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => navigation.navigate("UsageLimitScreen")}
              style={styles.listCard}
            >
              <View style={styles.listIconOrange}>
                <MaterialIcons name="timer" size={24} color="#F59E0B" />
              </View>

              <View style={styles.listText}>
                <Text style={styles.listTitle}>App Usage Limits</Text>
                <Text style={styles.listSubtitle}>
                  Set daily limits for selected apps
                </Text>
              </View>

              <MaterialIcons name="chevron-right" size={26} color="#9CA3AF" />
            </TouchableOpacity>


            {/* FOCUS SESSIONS */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => navigation.navigate("FocusScreen")}
              style={styles.listCard}
            >
              <View style={styles.listIconPurple}>
                <MaterialIcons
                  name="center-focus-strong"
                  size={24}
                  color="#6D28D9"
                />
              </View>

              <View style={styles.listText}>
                <Text style={styles.listTitle}>Focus Sessions</Text>
                <Text style={styles.listSubtitle}>
                  Block distractions and stay productive
                </Text>
              </View>

              <MaterialIcons name="chevron-right" size={26} color="#9CA3AF" />
            </TouchableOpacity>

          </ScrollView>

          <BottomNav navigation={navigation} />
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#7C3AED",
  },

  page: {
    flex: 1,
    backgroundColor: "#F5F6FA",
  },

  header: {
    height: 150,
    alignItems: "center",
    justifyContent: "center",
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: "hidden",
  },

  headerTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "800",
    marginTop: 8,
  },

  container: {
    padding: 18,
    paddingBottom: 140,
  },

  learningCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 24,
    marginBottom: 28,
    minHeight: 130,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },

  learningRow: {
    flexDirection: "row",
    gap: 16,
  },

  purpleBadge: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#EDE9FE",
    alignItems: "center",
    justifyContent: "center",
  },

  learningTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#111827",
  },

  learningText: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 8,
    lineHeight: 20,
  },

  sectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1,
    color: "#9CA3AF",
    marginBottom: 14,
  },

  listCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 22,
    paddingHorizontal: 20,
    borderRadius: 22,
    marginBottom: 18,
    minHeight: 92,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 1,
  },

  listText: {
    flex: 1,
    marginLeft: 16,
  },

  listTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#111827",
  },

  listSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
  },

  listIconOrange: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: "#FEF3C7",
    alignItems: "center",
    justifyContent: "center",
  },

  listIconPurple: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: "#EDE9FE",
    alignItems: "center",
    justifyContent: "center",
  },
});