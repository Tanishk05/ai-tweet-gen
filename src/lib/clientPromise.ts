// src/lib/clientPromise.ts

import { MongoClient } from "mongodb";
import client from "./db"; // Import the client instance

// The Auth.js adapter needs a promise that resolves to the connected client.
const clientPromise: Promise<MongoClient> = client.connect();

export default clientPromise;
