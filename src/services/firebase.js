// src/services/firebase.js
import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "demo",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "demo",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "demo",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "demo",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "demo",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "demo",
};

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

let messaging = null;

if (typeof window !== 'undefined' && 'Notification' in window) {
  try {
    messaging = getMessaging(app);
  } catch (err) {
    console.warn('Firebase messaging not supported', err);
  }
}

// Request permission for notifications
export const requestNotificationPermission = async () => {
  if (!messaging) return null;
  
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY || 'demo_key';
      // In a real app we would get a token, but for missing config we return a mock token
      if (vapidKey === 'demo_key') return 'mock_firebase_token_for_demo';
      
      const token = await getToken(messaging, { vapidKey });
      console.log('FCM Token:', token);
      return token;
    }
  } catch (error) {
    console.error('Error getting notification permission:', error);
    return null;
  }
};

// Listen to incoming messages
export const onMessageListener = (callback) => {
  if (!messaging) return;
  return onMessage(messaging, (payload) => {
    console.log('Message received:', payload);
    callback(payload);
  });
};

// Get FCM token
export const getFCMToken = async () => {
  if (!messaging) return null;
  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY || 'demo_key';
  if (vapidKey === 'demo_key') return 'mock_firebase_token_for_demo';
  return await getToken(messaging, { vapidKey });
};

export default { messaging, app };