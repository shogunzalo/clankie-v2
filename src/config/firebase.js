"use strict";

const admin = require("firebase-admin");

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBlvI0ABs_SYHWQo_8idgIvNqUdpXtW5kU",
    authDomain: "clankie-bot.firebaseapp.com",
    projectId: "clankie-bot",
    storageBucket: "clankie-bot.firebasestorage.app",
    messagingSenderId: "126295108739",
    appId: "1:126295108739:web:4bf42b0142f54be9ee3fb6",
    measurementId: "G-4X73CFBTNJ",
};

// Initialize Firebase Admin SDK
let app;
try {
    // Check if Firebase app is already initialized
    app = admin.app();
} catch (error) {
    // Initialize Firebase Admin SDK
    // In production, you should use a service account key file
    // For development, we'll use the project ID and initialize with default credentials
    app = admin.initializeApp({
        projectId: firebaseConfig.projectId,
        // In production, add your service account key here:
        // credential: admin.credential.cert(serviceAccount),
    });
}

// Export Firebase Admin instance
module.exports = {
    admin,
    auth: admin.auth(),
    firestore: admin.firestore(),
    config: firebaseConfig,
};
