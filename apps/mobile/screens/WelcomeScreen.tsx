import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  StatusBar,
  Animated,
  Dimensions,
} from "react-native";

const { width, height } = Dimensions.get("window");

export default function WelcomeScreen({ onContinue }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideUp, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <View style={styles.bottomCircle} />

      <Animated.View
        style={[
          styles.content,
          { opacity: fadeAnim, transform: [{ translateY: slideUp }] },
        ]}
      >
        <Image source={require("../assets/icon.png")} style={styles.logo} />

        <Text style={styles.welcome}>Welcome to</Text>
        <Text style={styles.appName}>DigitalCalm</Text>

        <Text style={styles.tagline}>Your Digital Well-being Companion</Text>

        <Text style={styles.description}>
          Take control of your screen time, boost your focus, and build better digital habits.
          DigitalCalm helps you find peace and balance in your digital life.
        </Text>

        <TouchableOpacity style={styles.button} onPress={onContinue}>
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>

        <View style={styles.dotsContainer}>
          <View style={[styles.dot, styles.activeDot]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fbff",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    paddingHorizontal: 28,
  },

  bottomCircle: {
    position: "absolute",
    bottom: -height * 0.25,
    right: -width * 0.3,
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: width * 0.45,
    backgroundColor: "#b2f2bb",
    opacity: 0.3,
  },

  content: {
    alignItems: "center",
    justifyContent: "center",
  },

  logo: {
    width: 150,
    height: 150,
    resizeMode: "contain",
    marginBottom: 20,
  },

  welcome: {
    fontSize: 16,
    color: "#5c5c5c",
    letterSpacing: 1,
    marginBottom: 4,
  },

  appName: {
    fontSize: 34,
    fontWeight: "800",
    color: "#1b1b1b",
  },

  tagline: {
    fontSize: 17,
    color: "#3d3d3d",
    marginTop: 6,
    marginBottom: 20,
  },

  description: {
    fontSize: 15,
    color: "#555",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 50,
    paddingHorizontal: 10,
  },

  button: {
    backgroundColor: "#3dbb6f",
    paddingVertical: 15,
    paddingHorizontal: 60,
    borderRadius: 30,
    elevation: 3,
    shadowColor: "#3dbb6f",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 17,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  dotsContainer: {
    flexDirection: "row",
    marginTop: 50,
    justifyContent: "center",
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#cfcfcf",
    marginHorizontal: 5,
  },

  activeDot: {
    backgroundColor: "#3dbb6f",
  },
});
