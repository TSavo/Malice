import "dotenv/config";
import { Midjourney } from "../src";
import * as fs from "fs";
import * as https from "https";

async function downloadImage(url: string, filepath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https.get(url, (response) => {
      response.pipe(file);
      file.on("finish", () => {
        file.close();
        resolve();
      });
    }).on("error", (err) => {
      fs.unlink(filepath, () => {});
      reject(err);
    });
  });
}

async function main() {
  console.log("=== Starting Imagine + Upscale + Upscale Subtle Test ===\n");

  const client = new Midjourney({
    ServerId: <string>process.env.SERVER_ID,
    ChannelId: <string>process.env.CHANNEL_ID,
    SalaiToken: <string>process.env.SALAI_TOKEN,
    HuggingFaceToken: <string>process.env.HUGGINGFACE_TOKEN,
    Debug: true,
    Ws: true,
  });

  await client.Connect();
  console.log("\n=== Connected! Starting Imagine... ===\n");

  const Imagine = await client.Imagine(
    "A cute red panda eating bamboo --fast",
    (uri: string, progress: string) => {
      console.log(`[Imagine Progress] ${progress}`);
    }
  );

  console.log("\n=== Imagine Complete ===");
  console.log("Imagine result:", JSON.stringify(Imagine, null, 2));

  if (!Imagine) {
    console.error("Imagine failed!");
    client.Close();
    return;
  }

  console.log("\n=== Starting Upscale U1... ===\n");

  const Upscale = await client.Upscale({
    index: 1,
    msgId: <string>Imagine.id,
    hash: <string>Imagine.hash,
    flags: Imagine.flags,
    content: Imagine.content,
    loading: (uri: string, progress: string) => {
      console.log(`[Upscale Progress] ${progress}`);
    },
  });

  console.log("\n=== Upscale Complete ===");
  console.log("Upscale result:", JSON.stringify(Upscale, null, 2));

  if (!Upscale) {
    console.error("Upscale failed!");
    client.Close();
    return;
  }

  // Find the "Upscale (Subtle)" button
  const subtleOption = Upscale.options?.find(opt => opt.label === "Upscale (Subtle)");
  if (!subtleOption) {
    console.error("Upscale (Subtle) option not found!");
    console.log("Available options:", Upscale.options?.map(o => o.label));
    client.Close();
    return;
  }

  console.log("\n=== Starting Upscale (Subtle)... ===\n");
  console.log("Using customId:", subtleOption.custom);

  const UpscaleSubtle = await client.Custom({
    msgId: <string>Upscale.id,
    customId: subtleOption.custom,
    flags: Upscale.flags,
    content: Upscale.content,
    loading: (uri: string, progress: string) => {
      console.log(`[Upscale Subtle Progress] ${progress}`);
    },
  });

  console.log("\n=== Upscale (Subtle) Complete ===");
  console.log("UpscaleSubtle result:", JSON.stringify(UpscaleSubtle, null, 2));

  if (UpscaleSubtle && UpscaleSubtle.uri) {
    const filename = `output-subtle-${Date.now()}.png`;
    console.log(`\n=== Downloading to ${filename}... ===`);
    await downloadImage(UpscaleSubtle.uri, filename);
    console.log(`Downloaded: ${filename}`);
  }

  client.Close();
  console.log("\n=== Done! ===");
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
