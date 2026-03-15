import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithCredential, sendEmailVerification, reload } from 'firebase/auth';
import { auth } from '../config/firebase';
import { showMessage } from 'react-native-flash-message';
import GoogleIcon from '../assets/google.png';

WebBrowser.maybeCompleteAuthSession();

export default function SignupScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [checkingVerification, setCheckingVerification] = useState(false);

  // Google Auth setup
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: "836845831976-r72jhl9drb7ul9ksuaobpr9u1t2cdaf3.apps.googleusercontent.com",
    androidClientId: "836845831976-romg9nudl5409il7goj37mc09dqeu2ec.apps.googleusercontent.com",
  });

  // Handle Google Sign-In
  useEffect(() => {
    const handleGoogleSignIn = async () => {
      if (response?.type === "success") {
        try {
          const idToken = response.authentication?.idToken;

          const credential = GoogleAuthProvider.credential(idToken);

          const userCredential = await signInWithCredential(auth, credential);

          const user = userCredential.user;

          showMessage({
            message: "Welcome!",
            description: `Signed in as ${user.displayName || "Google User"}`,
            type: "success",
          });

          navigation.navigate("AccountCreatedScreen");
        } catch (error) {
          Alert.alert("Google Sign-In Failed", error.message);
        }
      }
    };

    handleGoogleSignIn();
  }, [response]);

  // Error messages
  const getSignupErrorMessage = (errorCode) => {
    switch (errorCode) {
      case 'auth/email-already-in-use':
        return 'This email is already registered. Please sign in instead.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters long.';
      case 'auth/operation-not-allowed':
        return 'Email/password accounts are not enabled. Please contact support.';
      case 'auth/missing-password':
        return 'Please enter a password.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  };

  // Send verification email
  const sendVerificationEmail = async (user) => {
    try {
      await sendEmailVerification(user);
      setVerificationSent(true);
      showMessage({
        message: 'Verification Email Sent',
        description: 'Please check your inbox and click the link to verify your email.',
        type: 'info',
        icon: 'info',
        duration: 4000,
      });
    } catch (error) {
      showMessage({
        message: 'Error Sending Email',
        description: 'Could not send verification email. Please try again.',
        type: 'danger',
        icon: 'danger',
      });
    }
  };

  // Handle Email Sign-Up
  const handleSignup = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      showMessage({
        message: 'Missing Information',
        description: 'Please fill in all fields before continuing.',
        type: 'warning',
        icon: 'warning',
      });
      return;
    }

    try {
      setLoading(true);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: name });

      // Send verification email
      await sendVerificationEmail(user);
    } catch (error) {
      showMessage({
        message: 'Sign Up Failed',
        description: getSignupErrorMessage(error.code),
        type: 'danger',
        icon: 'danger',
        duration: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Check email verification status
  const handleCheckVerification = async () => {
    try {
      setCheckingVerification(true);
      const user = auth.currentUser;
      await reload(user);

      if (user.emailVerified) {
        navigation.navigate('AccountCreatedScreen');
      } else {
        showMessage({
          message: 'Email Not Verified',
          description: 'Please click the link in your email to verify.',
          type: 'warning',
          icon: 'warning',
        });
      }
    } catch (error) {
      showMessage({
        message: 'Error',
        description: 'Could not check verification status.',
        type: 'danger',
        icon: 'danger',
      });
    } finally {
      setCheckingVerification(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Create Account</Text>
      <Text style={styles.subheading}>Join DigitalCalm:</Text>
      <Text style={styles.subheading}>Your First Step to Inner Peace</Text>

      <TextInput
        style={styles.input}
        placeholder="NAME"
        placeholderTextColor="#333"
        value={name}
        onChangeText={setName}
      />

      <TextInput
        style={styles.input}
        placeholder="EMAIL"
        placeholderTextColor="#333"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
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
        <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPassword(!showPassword)}>
          <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={24} color={showPassword ? '#999' : '#333'} />
        </TouchableOpacity>
      </View>

      <Text style={styles.terms}>
        By continuing, you agree to the Conditions and Privacy Policy
      </Text>

      {!verificationSent ? (
        <TouchableOpacity style={styles.continueBtn} onPress={handleSignup} disabled={loading}>
          <Text style={styles.continueText}>{loading ? 'Creating Account...' : 'CONTINUE'}</Text>
        </TouchableOpacity>
      ) : (
        <>
          <Text style={{ textAlign: 'center', marginVertical: 8, color: '#333' }}>
            A verification email has been sent to {email}.
          </Text>
          <TouchableOpacity
            style={[styles.continueBtn, { backgroundColor: '#4caf50' }]}
            onPress={handleCheckVerification}
            disabled={checkingVerification}
          >
            {checkingVerification ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.continueText}>I VERIFIED MY EMAIL</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={{ alignItems: 'center', marginTop: 10 }}
            onPress={async () => {
              const user = auth.currentUser;
              await sendVerificationEmail(user);
            }}
          >
            <Text style={{ color: '#1a73e8' }}>Resend Email</Text>
          </TouchableOpacity>
        </>
      )}

      <Text style={styles.orText}>Or continue with</Text>

      <TouchableOpacity style={styles.googleBtn} onPress={() => promptAsync()}>
        <View style={styles.buttonContent}>
          <Image source={GoogleIcon} style={{ width: 24, height: 24, marginRight: 8 }} />
          <Text style={styles.googleText}>SIGN UP WITH GOOGLE</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.signinRow}>
        <Text>Already have an account? </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.signinText}>SIGN IN</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  heading: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subheading: {
    fontSize: 16,
    color: '#333',
  },
  input: {
    backgroundColor: '#eee',
    padding: 14,
    marginVertical: 10,
    borderRadius: 4,
    fontSize: 13,
  },
  passwordContainer: {
    position: 'relative',
  },
  eyeIcon: {
    position: 'absolute',
    right: 10,
    top: 30,
  },
  terms: {
    textAlign: 'center',
    marginVertical: 12,
    fontSize: 13,
    color: '#444',
  },
  continueBtn: {
    backgroundColor: '#000',
    padding: 16,
    borderRadius: 4,
    alignItems: 'center',
    marginBottom: 12,
  },
  continueText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  orText: {
    textAlign: 'center',
    marginVertical: 12,
  },
  googleBtn: {
    backgroundColor: '#fff',
    paddingVertical: 14,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#dadce0',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  googleText: {
    fontSize: 16,
    color: '#3c4043',
    fontWeight: '500',
  },
  signinRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  signinText: {
    fontWeight: 'bold',
    marginLeft: 4,
  },
});
