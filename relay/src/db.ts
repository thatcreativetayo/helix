import { Client, Databases, ID, Query } from 'node-appwrite';

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT!)
  .setProject(process.env.APPWRITE_PROJECT_ID!)
  .setKey(process.env.APPWRITE_API_KEY!);

export const db = new Databases(client);
export const DB_ID = process.env.APPWRITE_DB_ID!;
export { ID, Query };