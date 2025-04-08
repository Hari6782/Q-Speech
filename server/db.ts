import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { log } from "./vite";
import * as dotenv from 'dotenv';

dotenv.config();

// Create a PostgreSQL client
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  log("DATABASE_URL is not defined", "server");
  process.exit(1);
}

// Initialize the Postgres client
const client = postgres(connectionString);

// Initialize drizzle with the client
export const db = drizzle(client);

log("Database connected", "server");