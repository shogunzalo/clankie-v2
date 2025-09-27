# Firebase Authentication Integration

This document explains how to use the Firebase authentication system integrated into the Clankie API.

## Overview

The API now supports Firebase authentication using Firebase Admin SDK. Users authenticate on the frontend using Firebase Auth, and the backend verifies their ID tokens to provide secure access to protected endpoints.

## Architecture

```
Frontend (Firebase Auth) → ID Token → Backend (Firebase Admin SDK) → Database
```

1. **Frontend**: User signs in with Firebase Auth
2. **Token Generation**: Firebase generates an ID token
3. **API Request**: Frontend sends requests with `Authorization: Bearer <token>`
4. **Token Verification**: Backend verifies token with Firebase Admin SDK
5. **User Sync**: Backend creates/updates user record in database
6. **Protected Access**: User can access protected endpoints

## Setup

### 1. Firebase Configuration

The Firebase configuration is already set up in `src/config/firebase.js`:

```javascript
const firebaseConfig = {
    apiKey: "AIzaSyBlvI0ABs_SYHWQo_8idgIvNqUdpXtW5kU",
    authDomain: "clankie-bot.firebaseapp.com",
    projectId: "clankie-bot",
    storageBucket: "clankie-bot.firebasestorage.app",
    messagingSenderId: "126295108739",
    appId: "1:126295108739:web:4bf42b0142f54be9ee3fb6",
    measurementId: "G-4X73CFBTNJ",
};
```

### 2. Database Schema

The `users` table stores Firebase user data:

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    firebase_uid VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(255),
    photo_url VARCHAR(255),
    roles JSON NOT NULL DEFAULT '["user"]',
    metadata JSON DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);
```

## API Endpoints

### Authentication Endpoints

#### POST `/api/v1/auth/sync`

Syncs Firebase user with backend database.

**Headers:**

```
Authorization: Bearer <firebase_id_token>
Content-Type: application/json
```

**Response:**

```json
{
    "success": true,
    "user": {
        "id": 1,
        "firebase_uid": "firebase_uid_123",
        "email": "user@example.com",
        "display_name": "John Doe",
        "roles": ["user"],
        "is_active": true,
        "last_login": "2024-01-15T10:30:00.000Z"
    }
}
```

#### GET `/api/v1/auth/profile`

Gets the authenticated user's profile.

**Headers:**

```
Authorization: Bearer <firebase_id_token>
```

#### PUT `/api/v1/auth/profile`

Updates the authenticated user's profile.

**Headers:**

```
Authorization: Bearer <firebase_id_token>
Content-Type: application/json
```

**Body:**

```json
{
    "display_name": "New Display Name",
    "metadata": {
        "preferences": {
            "theme": "dark"
        }
    }
}
```

#### PUT `/api/v1/auth/roles` (Admin only)

Updates user roles. Requires `admin` role.

**Headers:**

```
Authorization: Bearer <firebase_id_token>
Content-Type: application/json
```

**Body:**

```json
{
    "user_id": 1,
    "roles": ["user", "business_owner"]
}
```

#### GET `/api/v1/auth/users` (Admin only)

Gets all users with pagination. Requires `admin` role.

### Protected Endpoints

All protected endpoints require authentication:

#### GET `/api/v1/protected/dashboard`

Gets user dashboard data including businesses, stats, etc.

#### GET `/api/v1/protected/orders`

Gets user's orders (example protected endpoint).

#### GET `/api/v1/protected/admin-only` (Admin only)

Admin-only endpoint requiring `admin` role.

#### GET `/api/v1/protected/business-owner-only` (Business Owner only)

Business owner endpoint requiring `business_owner` role.

## Frontend Integration

### 1. Install Firebase SDK

```bash
npm install firebase
```

### 2. Initialize Firebase

```javascript
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyBlvI0ABs_SYHWQo_8idgIvNqUdpXtW5kU",
    authDomain: "clankie-bot.firebaseapp.com",
    projectId: "clankie-bot",
    storageBucket: "clankie-bot.firebasestorage.app",
    messagingSenderId: "126295108739",
    appId: "1:126295108739:web:4bf42b0142f54be9ee3fb6",
    measurementId: "G-4X73CFBTNJ",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
```

### 3. User Authentication

```javascript
import {
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
} from "firebase/auth";

// Sign in
const signIn = async (email, password) => {
    try {
        const userCredential = await signInWithEmailAndPassword(
            auth,
            email,
            password
        );
        const user = userCredential.user;
        const token = await user.getIdToken();

        // Store token for API calls
        localStorage.setItem("firebase_token", token);

        return { user, token };
    } catch (error) {
        console.error("Sign in error:", error);
        throw error;
    }
};

// Sign out
const signOut = async () => {
    try {
        await signOut(auth);
        localStorage.removeItem("firebase_token");
    } catch (error) {
        console.error("Sign out error:", error);
        throw error;
    }
};

// Listen for auth state changes
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const token = await user.getIdToken();
        localStorage.setItem("firebase_token", token);

        // Sync user with backend
        await syncUserWithBackend(token);
    } else {
        localStorage.removeItem("firebase_token");
    }
});
```

### 4. API Calls with Authentication

```javascript
const API_BASE_URL = "http://localhost:3000/api/v1";

const getAuthHeaders = () => {
    const token = localStorage.getItem("firebase_token");
    return {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
    };
};

// Sync user with backend
const syncUserWithBackend = async (token) => {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/sync`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });

        const data = await response.json();
        console.log("User synced:", data);
        return data;
    } catch (error) {
        console.error("Sync error:", error);
        throw error;
    }
};

// Get user profile
const getUserProfile = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/profile`, {
            headers: getAuthHeaders(),
        });

        const data = await response.json();
        return data.user;
    } catch (error) {
        console.error("Profile error:", error);
        throw error;
    }
};

// Get dashboard data
const getDashboardData = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/protected/dashboard`, {
            headers: getAuthHeaders(),
        });

        const data = await response.json();
        return data.dashboard;
    } catch (error) {
        console.error("Dashboard error:", error);
        throw error;
    }
};
```

## User Roles

The system supports the following roles:

-   **`user`**: Basic user role (default)
-   **`admin`**: Full administrative access
-   **`business_owner`**: Can manage businesses and related data
-   **`agent`**: Can manage conversations and customer support

## Security Features

### 1. Token Verification

-   All tokens are verified with Firebase Admin SDK
-   Expired tokens are rejected
-   Invalid tokens are rejected

### 2. Rate Limiting

-   API endpoints are rate limited (except webhooks)
-   Prevents abuse and DoS attacks

### 3. Role-Based Access Control

-   Endpoints can require specific roles
-   Users can only access data they're authorized for

### 4. Input Validation

-   All inputs are validated and sanitized
-   SQL injection protection via Sequelize ORM

## Error Handling

### Common Error Responses

#### 401 Unauthorized

```json
{
    "error": "Unauthorized",
    "message": "No valid authorization header found"
}
```

#### 403 Forbidden

```json
{
    "error": "Forbidden",
    "message": "Required roles: admin"
}
```

#### 400 Bad Request

```json
{
    "error": "Bad Request",
    "message": "Validation failed",
    "details": [
        {
            "field": "email",
            "message": "Invalid email format"
        }
    ]
}
```

## Testing

### 1. Manual Testing

Use the provided test script:

```bash
node firebase-auth-example.js
```

### 2. Swagger Documentation

Visit `http://localhost:3000/api/v1/docs/` to test endpoints interactively.

### 3. Unit Tests

```bash
npm test
```

## Production Considerations

### 1. Service Account Key

For production, you should use a Firebase service account key:

```javascript
// src/config/firebase.js
const serviceAccount = require("./path/to/serviceAccountKey.json");

const app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: firebaseConfig.projectId,
});
```

### 2. Environment Variables

Store sensitive configuration in environment variables:

```bash
FIREBASE_PROJECT_ID=clankie-bot
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@clankie-bot.iam.gserviceaccount.com
```

### 3. Token Refresh

Implement token refresh on the frontend:

```javascript
// Refresh token every hour
setInterval(async () => {
    const user = auth.currentUser;
    if (user) {
        const token = await user.getIdToken(true); // Force refresh
        localStorage.setItem("firebase_token", token);
    }
}, 3600000); // 1 hour
```

## Troubleshooting

### Common Issues

1. **"Token verification failed"**

    - Check if Firebase project ID is correct
    - Verify token is not expired
    - Ensure token is properly formatted

2. **"User not found"**

    - User will be created automatically on first API call
    - Check if user exists in Firebase console

3. **"Forbidden" errors**
    - Check user roles in database
    - Verify endpoint requires correct role

### Debug Mode

Enable debug logging:

```javascript
// In firebase config
admin.initializeApp({
    // ... config
    logging: true,
});
```

## Support

For issues or questions:

1. Check the Swagger documentation at `/api/v1/docs/`
2. Review the test examples in `firebase-auth-example.js`
3. Check server logs for detailed error messages
