import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import BottomNav from "../components/BottomNav";

export default function SettingsScreen({ navigation }) {
  const [enabled, setEnabled] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [strictFocus, setStrictFocus] = useState(false);

  type SettingRowProps = {
    icon: any;
    title: string;
    subtitle?: string;
    switchValue?: boolean;
    onToggle?: (value: boolean) => void;
    onPress?: () => void;
  };

  const SettingRow = ({
    icon,
    title,
    subtitle,
    switchValue,
    onToggle,
    onPress,
  }: SettingRowProps) => (
    <TouchableOpacity
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
      onPress={onPress}
      style={styles.row}
    >
      <View style={styles.rowLeft}>
        <MaterialIcons name={icon} size={22} color="#6B7280" />
        <View>
          <Text style={styles.rowTitle}>{title}</Text>
          {subtitle && (
            <Text style={styles.rowSubtitle}>{subtitle}</Text>
          )}
        </View>
      </View>

      {onToggle && (
        <Switch
          value={switchValue}
          onValueChange={onToggle}
          trackColor={{ false: "#E5E7EB", true: "#10B981" }}
        />
      )}

      {onPress && !onToggle && (
        <MaterialIcons name="chevron-right" size={22} color="#9CA3AF" />
      )}
    </TouchableOpacity>
  );

  return (
    <>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.page}>
          
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Settings</Text>
          </View>

          <ScrollView contentContainerStyle={styles.container}>

            {/* GENERAL */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>General</Text>

              <SettingRow
                icon="power-settings-new"
                title="Enable DigitalCalm"
                subtitle="Master switch for the app"
                switchValue={enabled}
                onToggle={setEnabled}
              />

              <SettingRow
                icon="notifications"
                title="Notifications"
                subtitle="Receive alerts from DigitalCalm"
                switchValue={notifications}
                onToggle={setNotifications}
              />
            </View>

            {/* ABOUT */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>About</Text>

              <SettingRow
                icon="info"
                title="App Version"
                subtitle="DigitalCalm v1.0"
              />

              <SettingRow
                icon="privacy-tip"
                title="Privacy Policy"
                onPress={() => {}}
              />

              <SettingRow
                icon="mail"
                title="Contact Support"
                onPress={() => {}}
              />

              <SettingRow
                icon="star-rate"
                title="Rate the App"
                onPress={() => {}}
              />
            </View>

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
    backgroundColor: "#6B7280",
  },

  page: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },

  header: {
    height: 150,
    backgroundColor: "#6B7280",
    alignItems: "center",
    justifyContent: "center",
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },

  headerTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "800",
    marginTop: 8,
  },

  container: {
    padding: 16,
    paddingBottom: 120,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 10,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },

  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  rowTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },

  rowSubtitle: {
    fontSize: 12,
    color: "#6B7280",
  },
});