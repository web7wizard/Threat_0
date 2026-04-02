
import { Client, Databases, Query, ID } from "https://cdn.jsdelivr.net/npm/appwrite@14.0.1/+esm";

// CONFIGURATION
const PROJECT_ID = '6947cb33000b80a8d383'; 
const DB_ID = 'Threat0_DB';           // Or the ID from your screenshot
const COLLECTION_ID = 'thdb';         // The ID from your screenshot

const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1') 
    .setProject(PROJECT_ID);

const databases = new Databases(client);

export const db = {
    // 1. GET OR CREATE USER PROGRESS
    // This runs when the module loads. If the user is new, it creates a blank record.
    getUserProgress: async function(userId) {
        try {
            // Search for row with this userId
            const response = await databases.listDocuments(
                DB_ID,
                COLLECTION_ID,
                [Query.equal('userId', userId)]
            );

            if (response.documents.length > 0) {
                // Return existing progress
                return response.documents[0];
            } else {
                // Create new progress row
                const newDoc = await databases.createDocument(
                    DB_ID,
                    COLLECTION_ID,
                    ID.unique(),
                    {
                        userId: userId,
                        mod1_complete: false,
                        mod2_complete: false,
                        mod3_complete: false,
                        scores: JSON.stringify({ m1: {}, m2: {}, m3: {} }) // Init empty JSON
                    }
                );
                return newDoc;
            }
        } catch (error) {
            console.error("Database Error:", error);
            return null;
        }
    },

    // 2. SAVE PROGRESS
    // call this when a level is finished
    saveProgress: async function(docId, dataToUpdate) {
        try {
            await databases.updateDocument(
                DB_ID,
                COLLECTION_ID,
                docId,
                dataToUpdate
            );
            console.log("Progress saved to Cloud.");
        } catch (error) {
            console.error("Save Error:", error);
        }
    },

    // 3. MERGE SCORES HELPER
    // Ensures we don't overwrite Module 1 scores when saving Module 2
    mergeScores: function(currentJSON, moduleKey, newScores) {
        let scoresObj = {};
        try {
            scoresObj = JSON.parse(currentJSON);
        } catch (e) {
            scoresObj = { m1: {}, m2: {}, m3: {} };
        }

        // Update only the specific module
        scoresObj[moduleKey] = newScores;
        return JSON.stringify(scoresObj);
    }
};