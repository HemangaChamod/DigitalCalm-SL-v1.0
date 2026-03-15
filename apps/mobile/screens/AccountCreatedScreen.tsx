import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Animated, Alert, ActivityIndicator } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import UsageStats from 'react-native-usage-stats';
import { auth } from '../config/firebase'; 
import { sendEmailVerification, reload } from 'firebase/auth'; 

export default function AccountCreatedScreen({ navigation }: any) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const [checking, setChecking] = useState(false);
  const [user, setUser] = useState(auth.currentUser);

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 5,
    }).start();
  }, []);

  const handleCheckVerification = async () => {
    if (!user) return;

    setChecking(true);
    try {
      await reload(user); // Refresh user info
      if (user.emailVerified) {
        Alert.alert('Email Verified!', 'You can now continue.');
        handleContinue(); // proceed to Usage Permission / Home
      } else {
        Alert.alert(
          'Email Not Verified',
          'Please click the link in your email to verify first.'
        );
      }
    } catch (err) {
      console.warn('Error checking verification:', err);
      Alert.alert('Error', 'Could not check verification status. Try again.');
    } finally {
      setChecking(false);
    }
  };

  const handleResendEmail = async () => {
    if (!user) return;
    try {
      await sendEmailVerification(user);
      Alert.alert('Verification Email Sent', 'Please check your inbox.');
    } catch (err) {
      console.warn('Error resending email:', err);
      Alert.alert('Error', 'Could not resend verification email. Try again.');
    }
  };

  const handleContinue = () => {
    // DO NOTHING EXCEPT LET AUTH STATE UPDATE
    Alert.alert("Success", "Email verified. You can continue.");
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.iconWrap, { transform: [{ scale: scaleAnim }] }]}>
        <MaterialIcons name="check-circle" size={120} color="#22c55e" />
      </Animated.View>

      <Text style={styles.title}>Account Created!</Text>
      <Text style={styles.subtitle}>
        Your journey toward a more mindful digital life starts now.
      </Text>

      {!user?.emailVerified && (
        <>
          <Text style={{ textAlign: 'center', marginBottom: 16, color: '#475569' }}>
            Please verify your email before continuing.
          </Text>

          <TouchableOpacity
            style={[styles.continueBtn, { backgroundColor: '#4caf50', marginBottom: 8 }]}
            onPress={handleCheckVerification}
            disabled={checking}
          >
            {checking ? <ActivityIndicator color="#fff" /> : <Text style={styles.continueText}>I VERIFIED MY EMAIL</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={handleResendEmail}>
            <Text style={{ color: '#1a73e8', marginBottom: 24, textAlign: 'center' }}>Resend Email</Text>
          </TouchableOpacity>
        </>
      )}

      {user?.emailVerified && (
        <TouchableOpacity style={styles.continueBtn} onPress={handleContinue}>
          <Text style={styles.continueText}>CONTINUE</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    paddingHorizontal: 24,
  },
  iconWrap: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: "#475569",
    textAlign: "center",
    marginBottom: 32,
    maxWidth: 300,
  },
  continueBtn: {
    backgroundColor: "#22c55e",
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: 999,
  },
  continueText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});
