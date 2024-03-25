import fs from "fs/promises";

// in the folder "./data/tailwindcss/" there is a lot of ".txt" files
// I want to to take them, and create only 10 files with the content of all the files that is in this folder
// the name should be "1.txt" until "10.txt"
// The file will be created in /data-gpt/tailwindcss

const run = async () => {
  const files = await fs.readdir("./data/nextjs");
  const filesContent = await Promise.all(
    files.map(async (file) => {
      const content = await fs.readFile(`./data/nextjs/${file}`, "utf-8");
      return content;
    })
  );

  const filesContentChunks = chunk(filesContent, 10);

  for (const [index, filesContentChunk] of filesContentChunks.entries()) {
    const filePath = `./data-gpt/nextjs/${index + 1}.txt`;
    await fs.writeFile(filePath, filesContentChunk);
  }
};

const chunk = (arr: string[], size: number): string[] => {
  // create a function that make only size elements arr in return
  // you should divid arr by size, then you will get the number of files that need to be in one file
  // you should return only an array of "size"

  const chunks: string[] = [];

  const numberOfFilePerChunk = Math.ceil(arr.length / size);

  for (let i = 0; i < size; i += 1) {
    const chunk = arr.slice(i, i + numberOfFilePerChunk);
    chunks.push(chunk.join("\n"));
  }

  return chunks;
};

run();
