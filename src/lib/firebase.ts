import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAaPgjFfzucF2NNZDw3czS2JKmeNBOjToQ",
  authDomain: "omnitest-c5dd8.firebaseapp.com",
  projectId: "omnitest-c5dd8",
  storageBucket: "omnitest-c5dd8.firebasestorage.app",
  messagingSenderId: "686599093140",
  appId: "1:686599093140:web:b7b20e2fd2ced7eb8ead81",
  measurementId: "G-YZLWHY4FMD",
};

const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);

export { app, auth, db };
