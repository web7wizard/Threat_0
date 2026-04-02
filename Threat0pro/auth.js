import { Client, Account, ID } from "https://cdn.jsdelivr.net/npm/appwrite@14.0.1/+esm";
import { appwriteConfig, account } from './appwriteConfig.js';

export const auth = {
    // 1. REGISTER
    register: async (email, password, name) => {
        try {
            // First, ensure no ghost sessions exist
            try { await account.deleteSession('current'); } catch (e) { /* Ignore if no session */ }

            const userId = ID.unique(); 
            await account.create(userId, email, password, name);
            return await auth.login(email, password);
        } catch (error) {
            console.error("Register Error:", error);
            return { success: false, message: error.message };
        }
    },

    // 2. LOGIN (Updated to handle "Session Active" error)
    login: async (email, password) => {
        try {
            await account.createEmailPasswordSession(email, password);
            return { success: true };
        } catch (error) {
            // IF ERROR SAYS "SESSION ACTIVE", LOGOUT AND RETRY
            if (error.code === 401 || error.type === 'user_session_already_active') {
                console.log("Old session detected. Clearing...");
                await account.deleteSession('current');
                // Retry login
                try {
                    await account.createEmailPasswordSession(email, password);
                    return { success: true };
                } catch (retryError) {
                    return { success: false, message: retryError.message };
                }
            }
            return { success: false, message: error.message };
        }
    },

    // 3. LOGOUT
    logout: async () => {
        try {
            await account.deleteSession('current');
            return { success: true };
        } catch (error) {
            console.error("Logout Error:", error);
            // If error is 401, it means we are already logged out, so return success
            return { success: true }; 
        }
    },

    // 4. CHECK SESSION
    getCurrentUser: async () => {
        try {
            return await account.get();
        } catch (error) {
            return null; 
        }
    }
};