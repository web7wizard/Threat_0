import { Client, Account,Databases,ID } from "https://cdn.jsdelivr.net/npm/appwrite@14.0.1/+esm";

export const appwriteConfig = {
    projectId: '6947cb33000b80a8d383', 
    endpoint: 'https://fra.cloud.appwrite.io/v1', 
    databaseId: 'threat0_db', 
    collectionId: 'thdb' 
};

export const client = new Client()
    .setEndpoint(appwriteConfig.endpoint)
    .setProject(appwriteConfig.projectId);

export const account = new Account(client);
export const uniqueId = ID.unique();
export const databases = new Databases(client);
export { ID };