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
// Step 3
// -----------

const MAX_TOKENS = 500;

async function splitTextToMany(text: TextFileToken): Promise<TextFileToken[]> {
  const sentences = text.text
    .split(". ")
    .map((sentence) => ({
      text: sentence,
      numberTokens: enconding.encode(sentence).length,
    }))
    .reduce((acc, sentence) => {
      // if the sentence is too long, split it by \n
      if (sentence.numberTokens > MAX_TOKENS) {
        const sentences = sentence.text.split("\n").map((sentence) => ({
          text: sentence,
          numberTokens: enconding.encode(sentence).length,
        }));

        return [...acc, ...sentences];
      }
      return [...acc, sentence];
    }, [] as { text: string; numberTokens: number }[]);

  const chunks: TextFileToken[] = [];

  let tokensSoFar = 0;
  let currentChunks: TextFileToken[] = [];

  for (const sentence of sentences) {
    const numberToken = sentence.numberTokens;

    if (tokensSoFar + numberToken > MAX_TOKENS) {
      const chunkText = currentChunks.map((c) => c.text).join(". ");
      chunks.push({
        filePath: text.filePath,
        text: currentChunks.map((c) => c.text).join(". "),
        token: enconding.encode(chunkText),
      });

      currentChunks = [];
      tokensSoFar = 0;
    }

    currentChunks.push({
      filePath: text.filePath,
      text: sentence.text,
      token: new Uint32Array(),
    });

    tokensSoFar += numberToken;
  }

  if (currentChunks.length > 0) {
    const chunkText = currentChunks.map((c) => c.text).join(". ");
    chunks.push({
      filePath: text.filePath,
      text: currentChunks.map((c) => c.text).join(". "),
      token: enconding.encode(chunkText),
    });
  }

  return chunks;
}

async function splitTexts(texts: TextFileToken[]): Promise<TextFileToken[]> {
  const shortened: TextFileToken[] = [];

  for (const file of texts) {
    if (file.token.length > MAX_TOKENS) {
      const chunks = await splitTextToMany(file);
      shortened.push(...chunks);
    } else {
      shortened.push(file);
    }
  }

  return shortened;
}

// -----------
// Step 4
// -----------

type TextFileTokenEmbedding = TextFile & {
  embedding: number[];
};

async function processEmbeddings(
  texts: TextFileToken[]
): Promise<TextFileTokenEmbedding[]> {
  const embededs: TextFileTokenEmbedding[] = [];
  let i = 0;

  for await (const file of texts) {
    const result = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: file.text,
      encoding_format: "float",
    });

    const embeddings = result.data[0].embedding;

    embededs.push({
      ...file,
      embedding: embeddings,
    });

    i++;

    console.log(
      "⛏️ Finished embedding: ",
      file.filePath,
      `${i}/${texts.length}`
    );
  }

  return embededs;
}

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

  const textsTokensShortened = await cache_withFile(
    () => splitTexts(textsTokens),
    "processed/textsTokensShortened.json"
  );

  const textsTokensEmbeddings = await cache_withFile(
    () => processEmbeddings(textsTokensShortened),
    "processed/textsTokensEmbeddings.json"
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
