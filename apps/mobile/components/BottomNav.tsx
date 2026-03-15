import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function BottomNav({ navigation }) {
  const insets = useSafeAreaInsets();
  const state = navigation.getState();
  const currentRoute = state.routes[state.index].name;

  const getActiveColor = (route) => {
    if (currentRoute !== route) return "#9CA3AF"; 

    switch (route) {
      case "Home":
        return "#10B981"; 
      case "Insight":
        return "#3B82F6"; 
      case "Action":
        return "#8B5CF6"; 
      case "Setting":
        return "#6B7280"; 
      default:
        return "#9CA3AF";
    }
  };

  return (
    <View
      style={[
        styles.navbar,
        { paddingBottom: insets.bottom > 0 ? insets.bottom : 12 },
      ]}
    >
      <NavItem
        label="Dashboard"
        icon="home"
        route="Home"
        navigation={navigation}
        color={getActiveColor("Home")}
      />

      <NavItem
        label="Insight"
        icon="stats-chart-outline"
        route="Insight"
        navigation={navigation}
        color={getActiveColor("Insight")}
      />

      <NavItem
        label="Action"
        icon="flash-outline"
        route="Action"
        navigation={navigation}
        color={getActiveColor("Action")}
      />

      <NavItem
        label="Setting"
        icon="settings-outline"
        route="Setting"
        navigation={navigation}
        color={getActiveColor("Setting")}
      />
    </View>
  );
}

const NavItem = ({ label, icon, route, navigation, color }) => (
  <TouchableOpacity
    onPress={() => navigation.navigate(route)}
    style={styles.navItem}
    activeOpacity={0.7}
  >
    <Ionicons name={icon} size={26} color={color} />
    <Text style={[styles.navLabel, { color }]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  navbar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingTop: 10,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    position: "absolute",
    bottom: 0,
    width: "100%",
    elevation: 10,
    zIndex: 100,
  },

  navItem: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    marginBottom:-30,
  },

  navLabel: {
    fontSize: 13,
    marginTop: 4,
    fontWeight: "600",
  },
});
