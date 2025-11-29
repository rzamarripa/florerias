// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC-zjbAd_Zdn3-0ANch9eqG1RsZDvyK3cA",
  authDomain: "maflores-5c6c5.firebaseapp.com",
  projectId: "maflores-5c6c5",
  storageBucket: "maflores-5c6c5.firebasestorage.app",
  messagingSenderId: "469732138388",
  appId: "1:469732138388:web:9d303a04a9ab6bea7c8381",
  measurementId: "G-VVS1NPWGYL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics (solo en el navegador)
let analytics;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

// Initialize Cloud Storage
const storage = getStorage(app);

export { app, analytics, storage };
