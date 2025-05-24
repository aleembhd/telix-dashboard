// Firebase messaging service worker for push notifications
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js');

// Initialize Firebase
firebase.initializeApp({
  apiKey: "AIzaSyCLrrkbXcW-exG8_n4kOEmzA-SETMWqo-0",
  authDomain: "feedbackapp-5904d.firebaseapp.com",
  databaseURL: "https://feedbackapp-5904d-default-rtdb.firebaseio.com",
  projectId: "feedbackapp-5904d",
  storageBucket: "feedbackapp-5904d.firebasestorage.app",
  messagingSenderId: "620175464767",
  appId: "1:620175464767:web:8054286a27a26210619b8a",
  measurementId: "G-QH8JN7TE0J"
});

// Retrieve Firebase Messaging object
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  // Customize notification here
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: 'icons/icon-192x192.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
}); 