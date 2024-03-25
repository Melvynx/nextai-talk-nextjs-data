import fs from "fs/promises";
import { chromium } from "playwright";

const run = async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto("https://tailwindcss.com/docs/installation");

  // get the `nav` element
  const nav = await page.$("#nav");

  if (!nav) {
    throw new Error("nav element not found");
  }

  // get all the `a` element
  const links = await nav.$$("a");

  const urls = (
    await Promise.all(
      links.map(async (link) => {
        const href = await link.getAttribute("href");
        return href;
      })
    )
  ).filter((url) => url && url.startsWith("/docs"));

  for (const url of urls) {
    console.log("👀 Visiting", url);
    await page.goto(`https://tailwindcss.com${url}`);

    // get the content of the div with .prose.prose-vercel
    const content = await page.$eval(".prose", (el) => el.textContent);

    if (!content) {
      continue;
    }

    const encodedUrlForFileName = `https://tailwindcss.com${url}`.replace(
      /\//g,
      "_"
    );

    // write the content to a file
    const filePath = `./data/tailwindcss/${encodedUrlForFileName}.txt`;

    console.log("🛟 Save", filePath);
    fs.writeFile(filePath, content);
  }

  await browser.close();
};

run();
