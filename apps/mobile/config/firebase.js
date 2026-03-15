import { initializeApp, getApps } from "firebase/app";//initializeApp: used to start a Firebase app using your project’s configuration and getApps: returns a list of all already initialized Firebase apps 
import{
  initializeAuth,//sets up Firebase Authentication manually (instead of the default automatic initialization).
  getReactNativePersistence,//getReactNativePersistence: allows us to define how Firebase Auth should remember the user’s login state (in this case using AsyncStorage for React Native).
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";//gets a handle to the Cloud Firestore database
import AsyncStorage from "@react-native-async-storage/async-storage";//Used so that Firebase Auth can persist user sessions locally

const firebaseConfig = {
  apiKey: "AIzaSyD92agkpCMcsGHTRwGrdPcVGxawLLTvxLA",
  authDomain: "digitalcalm.firebaseapp.com",
  projectId: "digitalcalm",
  storageBucket: "digitalcalm.firebasestorage.app",
  messagingSenderId: "836845831976",
  appId: "1:836845831976:web:9a81e3e8d96cf78971321d"
};

// Initialize Firebase only once
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Auth (with AsyncStorage persistence for React Native)
let auth;//variable to hold Firebase Authentication instance
if (typeof global._firebaseAuth === "undefined") {//Checks if we already have a global auth instance stored in global._firebaseAuth.
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),//The user stays logged in even after app restart, because credentials are saved locally.
  });
  global._firebaseAuth = auth;//Saves the auth instance globally to reuse next time without reinitializing.
} else {
  auth = global._firebaseAuth;
}

// Firestore
const db = getFirestore(app);

export { auth, db };
