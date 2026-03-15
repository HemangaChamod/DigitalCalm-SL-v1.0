import React, { useState, useEffect } from 'react';
import GoogleIcon from "../assets/google.png"; 
import { Image, View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { sendPasswordResetEmail, signInWithEmailAndPassword, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '../config/firebase';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { showMessage } from "react-native-flash-message";
import UsageStats from 'react-native-usage-stats';
import { Ionicons } from '@expo/vector-icons';

WebBrowser.maybeCompleteAuthSession();

export default function SigninScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: "YOUR_WEB_CLIENT_ID",
    androidClientId: "YOUR_ANDROID_CLIENT_ID",
  });

  // Friendly error messages
  const getFriendlyErrorMessage = (error: any) => {
    const code = error?.code || "";
    switch (code) {
      case "auth/invalid-email": return "Please enter a valid email address.";
      case "auth/missing-email": return "Email address is required.";
      case "auth/missing-password": return "Please enter your password.";
      case "auth/invalid-credential":
      case "auth/wrong-password": return "Invalid email or password. Please try again.";
      case "auth/user-not-found": return "No account found with this email address.";
      case "auth/user-disabled": return "This account has been disabled. Please contact support.";
      case "auth/too-many-requests": return "Too many failed attempts. Please try again later.";
      case "auth/network-request-failed": return "Network error. Check your connection.";
      default: return "An unexpected error occurred. Please try again.";
    }
  };

  // Redirect user based on Usage Access
  const redirectAfterSignIn = async () => {
    try {
      const hasPermission = await UsageStats.checkPermission();
      if (!hasPermission) {
        navigation.replace("UsagePermissionScreen"); // Navigate to permission screen
        return;
      }
      navigation.replace("Home"); // Has permission, go fetch data and then Home
    } catch (err) {
      console.log("Permission check failed:", err);
      Alert.alert("Error", "Failed to check permissions.");
    }
  };

  // Google sign-in
  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);

      signInWithCredential(auth, credential)
        .then(() => redirectAfterSignIn())
        .catch((error) => {
          showMessage({
            message: "Google Sign In Failed",
            description: getFriendlyErrorMessage(error),
            type: "danger",
            icon: "danger",
            duration: 4000,
          });
        });
    }
  }, [response]);

  // Email sign-in
  const handleSignin = async () => {
    if (!email || !password) {
      showMessage({
        message: "Missing Information",
        description: "Please enter both email and password.",
        type: "warning",
        icon: "warning",
      });
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      redirectAfterSignIn();
    } catch (error) {
      showMessage({
        message: "Sign In Failed",
        description: getFriendlyErrorMessage(error),
        type: "danger",
        icon: "danger",
        duration: 4000,
      });
    }
  };

  // Forgot password
  const handleForgotPassword = async (email: string) => {
    if (!email) {
      showMessage({
        message: "Email Required",
        description: "Please enter your email first.",
        type: "warning",
        icon: "warning",
      });
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      showMessage({
        message: "Reset Email Sent",
        description: "We’ve sent you a password reset link.",
        type: "info",
        icon: "info",
      });
    } catch (error) {
      showMessage({
        message: "Reset Failed",
        description: getFriendlyErrorMessage(error),
        type: "danger",
        icon: "danger",
        duration: 4000,
      });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Welcome Back</Text>
      <Text style={styles.subheading}>Sign In for a Healthier Mind</Text>

      <TextInput
        style={styles.input}
        placeholder="EMAIL"
        placeholderTextColor="#333"
        value={email}
        onChangeText={setEmail}
      />

      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.input}
          placeholder="PASSWORD"
          placeholderTextColor="#333"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity
          style={styles.eyeIcon}
          onPress={() => setShowPassword(!showPassword)}
        >
          <Ionicons
            name={showPassword ? 'eye-off' : 'eye'}
            size={24}
            color={showPassword ? '#999' : '#333'} 
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={() => handleForgotPassword(email)}>
        <Text style={styles.forgotPassword}>FORGOT PASSWORD?</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.signinBtn} onPress={handleSignin}>
        <Text style={styles.signinText}>SIGN IN</Text>
      </TouchableOpacity>

      <Text style={styles.orText}>Or continue with</Text>

      <TouchableOpacity style={styles.googleBtn} onPress={() => promptAsync()}>
        <View style={styles.buttonContent}>
          <Image source={GoogleIcon} style={{ width: 24, height: 24, marginRight: 8 }} />
          <Text style={styles.googleText}>SIGN IN WITH GOOGLE</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.signupRow}>
        <Text>Don’t have an account? </Text>
        <TouchableOpacity onPress={() => navigation.navigate('SignupScreen')}>
          <Text style={styles.signupText}>SIGN UP</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: { padding: 24, flex: 1, backgroundColor: '#fff', justifyContent: 'center' },
  heading: { fontSize: 28, fontWeight: 'bold', marginBottom: 8 },
  subheading: { fontSize: 16, color: '#333', marginBottom: 20 },
  input: { backgroundColor: '#eee', padding: 14, marginVertical: 10, borderRadius: 4, fontSize: 13 },
  passwordContainer: { position: 'relative' },
  eyeIcon: { position: 'absolute', right: 10, top: 30 },
  forgotPassword: { alignSelf: 'flex-end', marginTop: 4, marginBottom: 20, fontWeight: '600', color: '#000' },
  signinBtn: { backgroundColor: '#000', padding: 16, borderRadius: 4, alignItems: 'center', marginBottom: 12 },
  signinText: { color: '#fff', fontWeight: 'bold' },
  orText: { textAlign: 'center', marginVertical: 12 },
  signupRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  signupText: { fontWeight: 'bold', marginLeft: 4 },
  googleBtn: { backgroundColor: '#fff', paddingVertical: 14, borderRadius: 4, borderWidth: 1, borderColor: '#dadce0', alignItems: 'center', justifyContent: 'center', marginVertical: 8 },
  buttonContent: { flexDirection: 'row', alignItems: 'center' },
  googleText: { fontSize: 16, color: '#3c4043', fontWeight: '500' },
});
