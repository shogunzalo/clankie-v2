#!/usr/bin/env node

/**
 * Firebase Authentication Example
 *
 * This script demonstrates how to use the Firebase authentication endpoints
 * with the Clankie API.
 *
 * Prerequisites:
 * 1. Get a Firebase ID token from your frontend application
 * 2. Replace the placeholder token below with your actual token
 */

const axios = require("axios");

const API_BASE_URL = "http://localhost:3000/api/v1";

// Replace this with your actual Firebase ID token
const FIREBASE_ID_TOKEN = "your_firebase_id_token_here";

const headers = {
    Authorization: `Bearer ${FIREBASE_ID_TOKEN}`,
    "Content-Type": "application/json",
};

async function testFirebaseAuth() {
    console.log("🔥 Firebase Authentication Test\n");

    try {
        // Test 1: Sync user with backend
        console.log("1. Testing POST /auth/sync...");
        const syncResponse = await axios.post(
            `${API_BASE_URL}/auth/sync`,
            {},
            { headers }
        );
        console.log("✅ User synced successfully:");
        console.log(JSON.stringify(syncResponse.data, null, 2));
        console.log();

        // Test 2: Get user profile
        console.log("2. Testing GET /auth/profile...");
        const profileResponse = await axios.get(
            `${API_BASE_URL}/auth/profile`,
            { headers }
        );
        console.log("✅ Profile retrieved successfully:");
        console.log(JSON.stringify(profileResponse.data, null, 2));
        console.log();

        // Test 3: Update user profile
        console.log("3. Testing PUT /auth/profile...");
        const updateData = {
            display_name: "Updated Name",
            metadata: {
                preferences: {
                    theme: "dark",
                    notifications: true,
                },
            },
        };
        const updateResponse = await axios.put(
            `${API_BASE_URL}/auth/profile`,
            updateData,
            { headers }
        );
        console.log("✅ Profile updated successfully:");
        console.log(JSON.stringify(updateResponse.data, null, 2));
        console.log();

        // Test 4: Get dashboard data
        console.log("4. Testing GET /protected/dashboard...");
        const dashboardResponse = await axios.get(
            `${API_BASE_URL}/protected/dashboard`,
            { headers }
        );
        console.log("✅ Dashboard data retrieved successfully:");
        console.log(JSON.stringify(dashboardResponse.data, null, 2));
        console.log();

        // Test 5: Get orders (example protected endpoint)
        console.log("5. Testing GET /protected/orders...");
        const ordersResponse = await axios.get(
            `${API_BASE_URL}/protected/orders`,
            { headers }
        );
        console.log("✅ Orders retrieved successfully:");
        console.log(JSON.stringify(ordersResponse.data, null, 2));
        console.log();

        console.log(
            "🎉 All tests passed! Firebase authentication is working correctly."
        );
    } catch (error) {
        console.error("❌ Test failed:");

        if (error.response) {
            console.error("Status:", error.response.status);
            console.error(
                "Data:",
                JSON.stringify(error.response.data, null, 2)
            );
        } else if (error.request) {
            console.error("No response received:", error.request);
        } else {
            console.error("Error:", error.message);
        }

        if (FIREBASE_ID_TOKEN === "your_firebase_id_token_here") {
            console.log("\n💡 To run this test:");
            console.log(
                "1. Get a Firebase ID token from your frontend application"
            );
            console.log("2. Replace the placeholder token in this script");
            console.log("3. Run: node firebase-auth-example.js");
        }
    }
}

// Helper function to get Firebase ID token (for frontend integration)
function getFirebaseTokenExample() {
    console.log(`
// Frontend Example (JavaScript/TypeScript):
import { getAuth } from 'firebase/auth';

const auth = getAuth();
const user = auth.currentUser;

if (user) {
    // Get the ID token
    const token = await user.getIdToken();
    
    // Use it in API calls
    const response = await fetch('/api/v1/auth/sync', {
        method: 'POST',
        headers: {
            'Authorization': \`Bearer \${token}\`,
            'Content-Type': 'application/json'
        }
    });
    
    const data = await response.json();
    console.log('User synced:', data);
}
`);
}

if (require.main === module) {
    if (FIREBASE_ID_TOKEN === "your_firebase_id_token_here") {
        console.log(
            "⚠️  Please replace the placeholder Firebase ID token to run the test.\n"
        );
        getFirebaseTokenExample();
    } else {
        testFirebaseAuth();
    }
}

module.exports = { testFirebaseAuth, getFirebaseTokenExample };
