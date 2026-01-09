// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
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

// Initialize Firebase (evitar múltiples inicializaciones)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Analytics (solo en el navegador)
let analytics = null;
if (typeof window !== 'undefined') {
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    console.warn("Analytics no disponible:", error);
  }
}

// Initialize Cloud Storage
let storage = null;
try {
  storage = getStorage(app);
  console.log("Firebase Storage inicializado correctamente");
} catch (error) {
  console.error("Error al inicializar Firebase Storage:", error);
}

export { app, analytics, storage };
