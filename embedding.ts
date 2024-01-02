import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";
import OpenAI from "openai";
dotenv.config();

const databaseUrl = process.env.DATABASE_URL;
const openaiKey = process.env.OPENAI_KEY;

if (!databaseUrl || !openaiKey) {
  throw new Error("Missing environment variables");
}

const openai = new OpenAI({
  apiKey: openaiKey,
});

const sql = neon(databaseUrl);

async function main() {
  const FOLDER = "nextjs";
}

main();
