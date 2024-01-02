import { Tiktoken } from "@dqbd/tiktoken";
import cl100k_base from "@dqbd/tiktoken/encoders/cl100k_base.json";
import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";
import fs from "fs/promises";
import OpenAI from "openai";
import path from "path";
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

const enconding = new Tiktoken(
  cl100k_base.bpe_ranks,
  cl100k_base.special_tokens,
  cl100k_base.pat_str
);

// -----------
// Step 1
// -----------

type TextFile = {
  filePath: string;
  text: string;
};

async function processFiles(folder: string): Promise<TextFile[]> {
  const files: TextFile[] = [];

  const folderPath = `./data/${folder}`;

  const entries = await fs.readdir(folderPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(folderPath, entry.name);

    if (entry.isDirectory()) {
      continue;
    }

    const text = await fs.readFile(fullPath, "utf-8");

    files.push({
      filePath: entry.name,
      text,
    });
  }

  return files;
}

// -----------
// Step 2
// -----------

type TextFileToken = TextFile & {
  token: Uint32Array;
};

const tiktokenizer = async (files: TextFile[]): Promise<TextFileToken[]> => {
  const textFileTokens: TextFileToken[] = [];

  for (const file of files) {
    const token = enconding.encode(file.text);

    textFileTokens.push({
      ...file,
      token,
    });
  }

  return textFileTokens;
};

// -----------
// Main
// -----------

async function main() {
  const FOLDER = "nextjs";

  const texts = await cache_withFile(
    () => processFiles(FOLDER),
    "processed/texts.json"
  );

  const textsTokens = await cache_withFile(
    () => tiktokenizer(texts),
    "processed/textsTokens.json"
  );
}

main();

async function cache_withFile<T>(
  func: () => Promise<T>,
  filePath: string
): Promise<T> {
  console.log("Running function: ", func.toString());
  console.log("Cache file: ", filePath);

  try {
    await fs.access(filePath);

    const fileData = await fs.readFile(filePath, "utf-8");

    console.log("🛟 Using cache file");
    return JSON.parse(fileData);
  } catch {
    const data = await func();

    console.log("📦 Writing cache file");
    await fs.writeFile(filePath, JSON.stringify(data));

    return data;
  }
}
