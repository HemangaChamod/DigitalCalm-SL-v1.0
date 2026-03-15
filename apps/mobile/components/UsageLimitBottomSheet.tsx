import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  SafeAreaView,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

type Props = {
  visible: boolean;
  appName: string;
  iconUri?: string;
  todayUsage?: string;
  onCancel: () => void;
  onSave: (minutes: number) => void;
  onRemove: () => void;
  isLocked?: boolean;
  lockRemaining?: string;
};

const ITEM_HEIGHT = 50;
const VISIBLE_ITEMS = 3;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

export default function UsageLimitBottomSheet({
  visible,
  appName,
  iconUri,
  todayUsage,
  onCancel,
  onSave,
  onRemove,
  isLocked = false,
  lockRemaining,
}: Props) {
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(30);

  const hoursArray = Array.from({ length: 24 }, (_, i) => i);
  const minutesArray = Array.from({ length: 60 }, (_, i) => i);

  const handleScrollEnd = (
    e: NativeSyntheticEvent<NativeScrollEvent>,
    setter: (value: number) => void,
    max: number
  ) => {
    if (isLocked) return;

    const offsetY = e.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);
    const safeIndex = Math.min(Math.max(index, 0), max - 1);
    setter(safeIndex);
  };

  const renderWheelItem = (item: number, selected: boolean) => (
    <View style={styles.wheelItem}>
      <Text
        style={[
          styles.wheelItemText,
          { opacity: selected ? 1 : 0.35 },
          selected && styles.selectedItemText,
        ]}
      >
        {item.toString().padStart(2, "0")}
      </Text>
    </View>
  );

  const totalMinutes = hours * 60 + minutes;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <SafeAreaView style={styles.sheet}>
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            {iconUri ? (
              <Image source={{ uri: iconUri }} style={styles.appIcon} />
            ) : (
              <MaterialIcons name="apps" size={40} color="#2563EB" />
            )}
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={styles.title}>Usage limit</Text>
              <Text style={styles.appName}>{appName}</Text>
            </View>
          </View>

          {/* LOCKED MODE */}
          {isLocked && (
            <View style={styles.lockContainer}>
              <MaterialIcons
                name="lock"
                size={26}
                color="#DC2626"
              />
              <Text style={styles.lockTitle}>
                Daily Limit Reached
              </Text>
              <Text style={styles.lockText}>
                {lockRemaining}
              </Text>
            </View>
          )}

          {/* Wheel Picker */}
          <View
            style={[
              styles.wheelContainer,
              isLocked && { opacity: 0.4 },
            ]}
            pointerEvents={isLocked ? "none" : "auto"}
          >
            {/* HOURS */}
            <View style={styles.wheelBox}>
              <Text style={styles.wheelLabel}>Hours</Text>

              <FlatList
                data={hoursArray}
                keyExtractor={(item) => item.toString()}
                showsVerticalScrollIndicator={false}
                snapToInterval={ITEM_HEIGHT}
                decelerationRate="fast"
                style={{ height: PICKER_HEIGHT }}
                contentContainerStyle={{
                  paddingVertical: ITEM_HEIGHT,
                }}
                scrollEnabled={!isLocked}
                onMomentumScrollEnd={(e) =>
                  handleScrollEnd(e, setHours, hoursArray.length)
                }
                renderItem={({ item }) =>
                  renderWheelItem(item, item === hours)
                }
              />

              <View
                pointerEvents="none"
                style={styles.centerHighlight}
              />
            </View>

            {/* MINUTES */}
            <View style={styles.wheelBox}>
              <Text style={styles.wheelLabel}>Minutes</Text>

              <FlatList
                data={minutesArray}
                keyExtractor={(item) => item.toString()}
                showsVerticalScrollIndicator={false}
                snapToInterval={ITEM_HEIGHT}
                decelerationRate="fast"
                style={{ height: PICKER_HEIGHT }}
                contentContainerStyle={{
                  paddingVertical: ITEM_HEIGHT,
                }}
                scrollEnabled={!isLocked}
                onMomentumScrollEnd={(e) =>
                  handleScrollEnd(e, setMinutes, minutesArray.length)
                }
                renderItem={({ item }) =>
                  renderWheelItem(item, item === minutes)
                }
              />

              <View
                pointerEvents="none"
                style={styles.centerHighlight}
              />
            </View>
          </View>

          {/* Info */}
          {!isLocked && (
            <View style={styles.infoRow}>
              <MaterialIcons
                name="info-outline"
                size={18}
                color="#9CA3AF"
              />
              <Text style={styles.infoText}>
                Exceeding this limit will block the app for the rest of the day.
              </Text>
            </View>
          )}

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              onPress={onRemove}
              disabled={isLocked}
            >
              <Text
                style={[
                  styles.remove,
                  isLocked && { opacity: 0.4 },
                ]}
              >
                Remove Limit
              </Text>
            </TouchableOpacity>

            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <TouchableOpacity onPress={onCancel}>
                <Text style={styles.cancel}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.okButton,
                  isLocked && { opacity: 0.4 },
                ]}
                disabled={isLocked}
                onPress={() => onSave(totalMinutes)}
              >
                <Text style={styles.okText}>
                  {isLocked ? "Locked" : "Save"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },

  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    maxHeight: "75%",
  },

  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    marginBottom: 14,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },

  appIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
  },

  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },

  appName: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },

  lockContainer: {
    alignItems: "center",
    marginVertical: 12,
  },

  lockTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#DC2626",
    marginTop: 6,
  },

  lockText: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 4,
  },

  wheelContainer: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    marginVertical: 20,
  },

  wheelBox: {
    flex: 1,
    alignItems: "center",
    position: "relative",
  },

  wheelLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 6,
  },

  wheelItem: {
    height: ITEM_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
  },

  wheelItemText: {
    fontSize: 20,
    color: "#9CA3AF",
    textAlign: "center",
    includeFontPadding: false,
  },

  selectedItemText: {
    color: "#111827",
    fontWeight: "700",
    fontSize: 24,
  },

  centerHighlight: {
    position: "absolute",
    top: ITEM_HEIGHT,
    left: 12,
    right: 12,
    height: ITEM_HEIGHT,
    borderRadius: 14,
    backgroundColor: "#F3F4F6",
    zIndex: -1,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginVertical: 12,
  },

  infoText: {
    flex: 1,
    fontSize: 12,
    color: "#9CA3AF",
    marginLeft: 6,
  },

  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 40,
  },

  remove: {
    color: "#DC2626",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 25,
  },

  cancel: {
    color: "#6B7280",
    fontSize: 14,
    marginRight: 16,
    marginBottom: 25,
  },

  okButton: {
    backgroundColor: "#2563EB",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 25,
  },

  okText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
