import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { auth } from "../config/firebase";
import { signOut, updateProfile, updatePassword } from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import { showMessage } from "react-native-flash-message";
import BottomNav from "../components/BottomNav";
import { StatusBar } from "expo-status-bar";

export default function ProfileScreen({ navigation }) {
  const db = getFirestore();
  const user = auth.currentUser;

  const defaultAvatar = require("../assets/user.png");

  const [name, setName] = useState(user?.displayName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [photoKey, setPhotoKey] = useState<string | null>(null);

  const [editNameModal, setEditNameModal] = useState(false);
  const [newName, setNewName] = useState("");

  const [editPassModal, setEditPassModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  const [avatarModal, setAvatarModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const avatarMap: Record<string, any> = {
    boy: require("../assets/boy.png"),
    girl: require("../assets/girl.png"),
    man: require("../assets/man.png"),
    woman: require("../assets/user.png"),
  };

  const avatarOptions = ["boy", "girl", "man", "woman"];

  useEffect(() => {
    if (!user) return;

    const fetchUserDoc = async () => {
      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        const data = snap.data();
        setName(data.name || "");
        setEmail(data.email || user.email);
        setPhotoKey(data.photo || null);
      } else {
        await setDoc(ref, {
          name: user.displayName || "",
          email: user.email,
          photo: null,
        });
      }
    };

    fetchUserDoc();
  }, [user]);

  const chooseAvatar = async (key: string) => {
    if (!user) return;
    try {
      setPhotoKey(key);
      await updateDoc(doc(db, "users", user.uid), { photo: key });
      setAvatarModal(false);
      showMessage({ message: "Avatar updated!", type: "success" });
    } catch (err: any) {
      showMessage({
        message: "Update Failed",
        description: err.message,
        type: "danger",
      });
    }
  };

  const handleNameChange = async () => {
    if (!newName.trim() || !user) return;
    try {
      await updateProfile(user, { displayName: newName });
      await updateDoc(doc(db, "users", user.uid), { name: newName });
      setName(newName);
      setEditNameModal(false);
      showMessage({ message: "Name updated!", type: "success" });
    } catch (err: any) {
      showMessage({
        message: "Update Failed",
        description: err.message,
        type: "danger",
      });
    }
  };

  const handleChangePassword = async () => {
    if (!user || newPassword.length < 6) return;
    try {
      await updatePassword(user, newPassword);
      setEditPassModal(false);
      showMessage({ message: "Password updated!", type: "success" });
    } catch (err: any) {
      showMessage({
        message: "Password Update Failed",
        description: err.message,
        type: "danger",
      });
    }
  };

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await signOut(auth);
      navigation.reset({
        index: 0,
        routes: [{ name: "Login" }],
      });
      showMessage({ message: "Logged out", type: "info" });
    } catch (err: any) {
      setLoggingOut(false);
      showMessage({
        message: "Logout Failed",
        description: err.message,
        type: "danger",
      });
    }
  };

  return (
    <>
      {/* Fix notch color and status bar */}
      <StatusBar style="light" />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.page}>
          {/* HEADER */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Profile</Text>
          </View>

          {/* FLOATING PROFILE */}
          <View style={styles.profileFloating}>
            <Image
              source={photoKey ? avatarMap[photoKey] : defaultAvatar}
              style={styles.profileImage}
            />
            <TouchableOpacity
              style={styles.editAvatar}
              onPress={() => setAvatarModal(true)}
            >
              <MaterialIcons name="edit" size={16} color="#fff" />
            </TouchableOpacity>

            <Text style={styles.name}>{name || "No name set"}</Text>
            <Text style={styles.email}>{email}</Text>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.card}>
              <View>
                <Text style={styles.cardLabel}>Name</Text>
                <Text style={styles.cardValue}>{name}</Text>
              </View>
              <TouchableOpacity onPress={() => setEditNameModal(true)}>
                <Text style={styles.cardAction}>Edit</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.card}>
              <View>
                <Text style={styles.cardLabel}>Password</Text>
                <Text style={styles.cardValue}>********</Text>
              </View>
              <TouchableOpacity onPress={() => setEditPassModal(true)}>
                <Text style={styles.cardAction}>Change</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.logoutButton, loggingOut && { opacity: 0.6 }]}
              onPress={handleLogout}
              disabled={loggingOut}
            >
              <MaterialIcons name="logout" size={20} color="#DC2626" />
              <Text style={styles.logoutText}>
                {loggingOut ? "Logging out..." : "Logout"}
              </Text>
            </TouchableOpacity>
          </ScrollView>

          <BottomNav navigation={navigation} />

          {/* AVATAR MODAL */}
          <Modal visible={avatarModal} transparent animationType="fade">
            <View style={styles.modalOverlay}>
              <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>Choose an Avatar</Text>
                <View style={styles.avatarOptions}>
                  {avatarOptions.map((key) => (
                    <TouchableOpacity key={key} onPress={() => chooseAvatar(key)}>
                      <Image source={avatarMap[key]} style={styles.avatarImage} />
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity
                  style={styles.modalClose}
                  onPress={() => setAvatarModal(false)}
                >
                  <Text style={styles.modalCloseText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FF8C00", // same as header to fill notch
  },

  page: {
    flex: 1,
    backgroundColor: "#F3F4F6", // content background
  },

  header: {
    height: 150,
    backgroundColor: "#FF8C00",
    alignItems: "center",
    justifyContent: "center",
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },

  headerTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
  },

  profileFloating: {
    alignItems: "center",
    marginTop: -50, // float over header
    marginBottom: 20,
  },

  profileImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 4,
    borderColor: "#fff",
    backgroundColor: "#fff",
  },

  editAvatar: {
    position: "absolute",
    right: 12,
    bottom: 32,
    backgroundColor: "#10B981",
    padding: 6,
    borderRadius: 14,
  },

  name: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginTop: 8,
  },

  email: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 2,
  },

  scrollContainer: {
    padding: 16,
    paddingBottom: 120,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 3,
  },

  cardLabel: {
    fontSize: 12,
    color: "#6B7280",
  },

  cardValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },

  cardAction: {
    color: "#10B981",
    fontWeight: "600",
  },

  logoutButton: {
    backgroundColor: "#FEE2E2",
    padding: 16,
    borderRadius: 14,
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },

  logoutText: {
    color: "#DC2626",
    fontSize: 16,
    fontWeight: "600",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalContainer: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 18,
    width: "80%",
    alignItems: "center",
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 16,
  },

  avatarOptions: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
  },

  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },

  modalClose: {
    backgroundColor: "#10B981",
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 12,
  },

  modalCloseText: {
    color: "#fff",
    fontWeight: "600",
  },
});
