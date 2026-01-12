import "dotenv/config";
import express, { Request, Response } from "express";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";
import { Midjourney } from "./index";
import { MJPromptOptions, buildPrompt, validateOptions } from "./prompt-options";
import * as https from "https";
import * as fs from "fs";
import * as path from "path";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

const app = express();
app.use(express.json());

// Swagger configuration
const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "MidJourney API",
      version: "1.0.0",
      description: "REST API for MidJourney image generation with full parameter support",
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}`,
        description: "Local server",
      },
    ],
    components: {
      schemas: {
        PromptOptions: {
          type: "object",
          properties: {
            aspectRatio: {
              type: "string",
              description: "Image aspect ratio (e.g., '16:9', '1:1', '9:16')",
              example: "16:9",
            },
            no: {
              type: "string",
              description: "Elements to exclude (negative prompt)",
              example: "text, watermark, blurry",
            },
            stylize: {
              type: "integer",
              minimum: 0,
              maximum: 1000,
              description: "Artistic influence level (0-1000, default: 100)",
              example: 100,
            },
            chaos: {
              type: "integer",
              minimum: 0,
              maximum: 100,
              description: "Variation/randomness level (0-100, default: 0)",
              example: 0,
            },
            quality: {
              type: "number",
              enum: [0.25, 0.5, 1],
              description: "Detail level (0.25, 0.5, or 1)",
              example: 1,
            },
            seed: {
              type: "integer",
              description: "Seed for reproducible results",
              example: 12345,
            },
            stop: {
              type: "integer",
              minimum: 10,
              maximum: 100,
              description: "Stop generation at percentage (10-100)",
              example: 100,
            },
            version: {
              type: "string",
              description: "MidJourney version (5, 5.1, 5.2, 6, 6.1, 7)",
              example: "7",
            },
            style: {
              type: "string",
              enum: ["raw", "scenic"],
              description: "Style mode (raw = less beautification)",
            },
            weird: {
              type: "integer",
              minimum: 0,
              maximum: 3000,
              description: "Unusual/unexpected qualities (0-3000)",
              example: 0,
            },
            tile: {
              type: "boolean",
              description: "Create seamless repeating pattern",
            },
            repeat: {
              type: "integer",
              minimum: 1,
              maximum: 40,
              description: "Number of variations to generate (1-40)",
            },
            niji: {
              type: "string",
              description: "Use Niji anime model (5 or 6)",
            },
            styleRef: {
              type: "string",
              description: "Style reference image URL",
            },
            styleWeight: {
              type: "integer",
              minimum: 0,
              maximum: 1000,
              description: "Style reference influence (0-1000, default: 100)",
            },
            characterRef: {
              type: "string",
              description: "Character reference image URL",
            },
            characterWeight: {
              type: "integer",
              minimum: 0,
              maximum: 100,
              description: "Character reference influence (0-100, default: 100)",
            },
            imageWeight: {
              type: "number",
              minimum: 0,
              maximum: 3,
              description: "Image vs text prompt weight (0-3)",
            },
            fast: {
              type: "boolean",
              description: "Use fast generation mode",
            },
            relax: {
              type: "boolean",
              description: "Use relaxed generation mode",
            },
            turbo: {
              type: "boolean",
              description: "Use turbo generation mode (fastest)",
            },
          },
        },
        ImagineRequest: {
          type: "object",
          required: ["prompt"],
          properties: {
            prompt: {
              type: "string",
              description: "The image generation prompt",
              example: "A beautiful sunset over mountains",
            },
            options: {
              $ref: "#/components/schemas/PromptOptions",
            },
          },
        },
        GenerateRequest: {
          type: "object",
          required: ["prompt"],
          properties: {
            prompt: {
              type: "string",
              description: "The image generation prompt",
              example: "A beautiful sunset over mountains",
            },
            options: {
              $ref: "#/components/schemas/PromptOptions",
            },
            upscaleIndex: {
              type: "integer",
              minimum: 1,
              maximum: 4,
              description: "Which image to upscale (1-4)",
              default: 1,
            },
            download: {
              type: "boolean",
              description: "Download the final image locally",
              default: true,
            },
          },
        },
        UpscaleRequest: {
          type: "object",
          required: ["msgId", "hash"],
          properties: {
            msgId: {
              type: "string",
              description: "Message ID from previous response",
            },
            hash: {
              type: "string",
              description: "Image hash from previous response",
            },
            flags: {
              type: "integer",
              description: "Flags from previous response",
            },
            content: {
              type: "string",
              description: "Content from previous response",
            },
            index: {
              type: "integer",
              minimum: 1,
              maximum: 4,
              description: "Which image to upscale (1-4)",
              default: 1,
            },
          },
        },
        CustomRequest: {
          type: "object",
          required: ["msgId", "customId"],
          properties: {
            msgId: {
              type: "string",
              description: "Message ID from previous response",
            },
            customId: {
              type: "string",
              description: "Custom action ID (from options array)",
            },
            flags: {
              type: "integer",
              description: "Flags from previous response",
            },
            content: {
              type: "string",
              description: "Content from previous response",
            },
          },
        },
        ImageResponse: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "Message ID",
            },
            hash: {
              type: "string",
              description: "Image hash",
            },
            content: {
              type: "string",
              description: "Full content string",
            },
            uri: {
              type: "string",
              description: "Discord CDN image URL",
            },
            proxy_url: {
              type: "string",
              description: "Proxy image URL",
            },
            localPath: {
              type: "string",
              description: "Local file path (if downloaded)",
            },
            flags: {
              type: "integer",
            },
            options: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  label: { type: "string" },
                  custom: { type: "string" },
                },
              },
              description: "Available actions (upscale, vary, etc.)",
            },
            width: {
              type: "integer",
            },
            height: {
              type: "integer",
            },
          },
        },
        Error: {
          type: "object",
          properties: {
            error: {
              type: "string",
            },
          },
        },
      },
    },
  },
  apis: [], // We define routes inline
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Serve Swagger UI
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/openapi.json", (req: Request, res: Response) => {
  res.json(swaggerSpec);
});

// Global client instance
let client: Midjourney | null = null;

// Output directory for downloaded images
const OUTPUT_DIR = process.env.OUTPUT_DIR || "./outputs";
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function getClient(): Promise<Midjourney> {
  if (!client) {
    client = new Midjourney({
      ServerId: process.env.SERVER_ID!,
      ChannelId: process.env.CHANNEL_ID!,
      SalaiToken: process.env.SALAI_TOKEN!,
      HuggingFaceToken: process.env.HUGGINGFACE_TOKEN,
      Debug: process.env.DEBUG === "true",
      Ws: true,
    });
    await client.Connect();
    console.log("MidJourney client connected!");
  }
  return client;
}

async function downloadImage(url: string, filepath: string): Promise<void> {
  // Download the image
  await new Promise<void>((resolve, reject) => {
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

  // Compress with oxipng -o4 (lossless, good compression)
  if (filepath.endsWith('.png')) {
    try {
      const originalSize = fs.statSync(filepath).size;
      const oxipng = '/usr/bin/oxipng'; // Use system binary (installed in Dockerfile)
      await execFileAsync(oxipng, ['-o', '4', '--strip', 'safe', filepath]);
      const compressedSize = fs.statSync(filepath).size;
      const savings = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
      console.log(`[Compress] ${path.basename(filepath)}: ${(originalSize/1024/1024).toFixed(2)}MB -> ${(compressedSize/1024/1024).toFixed(2)}MB (${savings}% smaller)`);
    } catch (err: any) {
      console.warn(`[Compress] oxipng failed for ${path.basename(filepath)}: ${err.message}`);
      console.warn(`[Compress] Stack trace:`, err.stack);
    }
  }
}

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Health check
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Server status
 */
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok", connected: client !== null });
});

/**
 * @openapi
 * /imagine:
 *   post:
 *     summary: Generate initial image grid
 *     tags: [Generation]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ImagineRequest'
 *     responses:
 *       200:
 *         description: Generated image grid
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ImageResponse'
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Generation failed
 */
app.post("/imagine", async (req: Request, res: Response) => {
  try {
    const { prompt, options } = req.body as { prompt: string; options?: MJPromptOptions };
    if (!prompt) {
      return res.status(400).json({ error: "prompt is required" });
    }

    // Validate options
    if (options) {
      const errors = validateOptions(options);
      if (errors.length > 0) {
        return res.status(400).json({ error: errors.join("; ") });
      }
    }

    // Build prompt with options
    const fullPrompt = buildPrompt(prompt, options);
    console.log(`[Imagine] Starting: ${fullPrompt}`);

    const mj = await getClient();
    const result = await mj.Imagine(fullPrompt, (uri, progress) => {
      console.log(`[Imagine] Progress: ${progress}`);
    });

    if (!result) {
      return res.status(500).json({ error: "Imagine failed" });
    }

    console.log(`[Imagine] Complete: ${result.id}`);
    res.json({
      id: result.id,
      hash: result.hash,
      content: result.content,
      uri: result.uri,
      proxy_url: result.proxy_url,
      flags: result.flags,
      options: result.options?.map(o => ({ label: o.label, custom: o.custom })),
      width: result.width,
      height: result.height,
    });
  } catch (error: any) {
    console.error("[Imagine] Error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @openapi
 * /upscale:
 *   post:
 *     summary: Upscale a specific image from the grid
 *     tags: [Generation]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpscaleRequest'
 *     responses:
 *       200:
 *         description: Upscaled image
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ImageResponse'
 */
app.post("/upscale", async (req: Request, res: Response) => {
  try {
    const { msgId, hash, flags, content, index = 1 } = req.body;
    if (!msgId || !hash) {
      return res.status(400).json({ error: "msgId and hash are required" });
    }

    console.log(`[Upscale] Starting U${index} for ${msgId}`);
    const mj = await getClient();

    const result = await mj.Upscale({
      index: index as 1 | 2 | 3 | 4,
      msgId,
      hash,
      flags: flags || 0,
      content,
      loading: (uri, progress) => {
        console.log(`[Upscale] Progress: ${progress}`);
      },
    });

    if (!result) {
      return res.status(500).json({ error: "Upscale failed" });
    }

    console.log(`[Upscale] Complete: ${result.id}`);
    res.json({
      id: result.id,
      hash: result.hash,
      content: result.content,
      uri: result.uri,
      proxy_url: result.proxy_url,
      flags: result.flags,
      options: result.options?.map(o => ({ label: o.label, custom: o.custom })),
      width: result.width,
      height: result.height,
    });
  } catch (error: any) {
    console.error("[Upscale] Error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @openapi
 * /custom:
 *   post:
 *     summary: Execute a custom action (Upscale Subtle, Vary, Zoom, etc.)
 *     tags: [Generation]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CustomRequest'
 *     responses:
 *       200:
 *         description: Result of custom action
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ImageResponse'
 */
app.post("/custom", async (req: Request, res: Response) => {
  try {
    const { msgId, customId, flags, content } = req.body;
    if (!msgId || !customId) {
      return res.status(400).json({ error: "msgId and customId are required" });
    }

    console.log(`[Custom] Starting ${customId} for ${msgId}`);
    const mj = await getClient();

    const result = await mj.Custom({
      msgId,
      customId,
      flags: flags || 0,
      content,
      loading: (uri, progress) => {
        console.log(`[Custom] Progress: ${progress}`);
      },
    });

    if (!result) {
      return res.status(500).json({ error: "Custom action failed" });
    }

    console.log(`[Custom] Complete: ${result.id}`);
    res.json({
      id: result.id,
      hash: result.hash,
      content: result.content,
      uri: result.uri,
      proxy_url: result.proxy_url,
      flags: result.flags,
      options: result.options?.map(o => ({ label: o.label, custom: o.custom })),
      width: result.width,
      height: result.height,
    });
  } catch (error: any) {
    console.error("[Custom] Error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @openapi
 * /generate:
 *   post:
 *     summary: Full pipeline - Imagine, Upscale, Upscale Subtle, Download
 *     description: Complete image generation workflow that produces a high-resolution 2048x2048 image
 *     tags: [Generation]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GenerateRequest'
 *           examples:
 *             simple:
 *               summary: Simple prompt
 *               value:
 *                 prompt: "A beautiful sunset over mountains"
 *             withOptions:
 *               summary: With options
 *               value:
 *                 prompt: "A cyberpunk city at night"
 *                 options:
 *                   aspectRatio: "16:9"
 *                   stylize: 200
 *                   no: "text, watermark"
 *                   fast: true
 *     responses:
 *       200:
 *         description: Final high-resolution image
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ImageResponse'
 */
app.post("/generate", async (req: Request, res: Response) => {
  try {
    const { prompt, options, upscaleIndex = 1, download = true } = req.body as {
      prompt: string;
      options?: MJPromptOptions;
      upscaleIndex?: number;
      download?: boolean;
    };

    if (!prompt) {
      return res.status(400).json({ error: "prompt is required" });
    }

    // Validate options
    if (options) {
      const errors = validateOptions(options);
      if (errors.length > 0) {
        return res.status(400).json({ error: errors.join("; ") });
      }
    }

    // Build prompt with options
    const fullPrompt = buildPrompt(prompt, options);
    console.log(`[Generate] Starting full pipeline: ${fullPrompt}`);

    const mj = await getClient();

    // Step 1: Imagine
    console.log("[Generate] Step 1: Imagine");
    const imagine = await mj.Imagine(fullPrompt, (uri, progress) => {
      console.log(`[Generate/Imagine] ${progress}`);
    });

    if (!imagine) {
      return res.status(500).json({ error: "Imagine failed" });
    }

    // Step 2: Upscale
    console.log(`[Generate] Step 2: Upscale U${upscaleIndex}`);
    const upscale = await mj.Upscale({
      index: upscaleIndex as 1 | 2 | 3 | 4,
      msgId: imagine.id!,
      hash: imagine.hash!,
      flags: imagine.flags,
      content: imagine.content,
      loading: (uri, progress) => {
        console.log(`[Generate/Upscale] ${progress}`);
      },
    });

    if (!upscale) {
      return res.status(500).json({ error: "Upscale failed" });
    }

    // Step 3: Upscale Subtle
    const subtleOption = upscale.options?.find(o => o.label === "Upscale (Subtle)");
    if (!subtleOption) {
      return res.status(500).json({ error: "Upscale (Subtle) option not found" });
    }

    console.log("[Generate] Step 3: Upscale (Subtle)");
    const upscaleSubtle = await mj.Custom({
      msgId: upscale.id!,
      customId: subtleOption.custom,
      flags: upscale.flags,
      content: upscale.content,
      loading: (uri, progress) => {
        console.log(`[Generate/UpscaleSubtle] ${progress}`);
      },
    });

    if (!upscaleSubtle) {
      return res.status(500).json({ error: "Upscale Subtle failed" });
    }

    let localPath: string | undefined;

    // Step 4: Download (optional)
    if (download && upscaleSubtle.uri) {
      const filename = `${upscaleSubtle.hash || Date.now()}.png`;
      localPath = path.join(OUTPUT_DIR, filename);
      console.log(`[Generate] Step 4: Downloading to ${localPath}`);
      await downloadImage(upscaleSubtle.uri, localPath);
    }

    console.log("[Generate] Complete!");
    res.json({
      id: upscaleSubtle.id,
      hash: upscaleSubtle.hash,
      content: upscaleSubtle.content,
      uri: upscaleSubtle.uri,
      proxy_url: upscaleSubtle.proxy_url,
      localPath,
      width: upscaleSubtle.width,
      height: upscaleSubtle.height,
    });
  } catch (error: any) {
    console.error("[Generate] Error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @openapi
 * /options:
 *   get:
 *     summary: Get available prompt options with descriptions
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Available options
 */
app.get("/options", (req: Request, res: Response) => {
  res.json({
    aspectRatio: {
      description: "Image aspect ratio",
      examples: ["1:1", "16:9", "9:16", "3:2", "4:5"],
      default: "1:1",
    },
    no: {
      description: "Elements to exclude (negative prompt)",
      examples: ["text", "watermark", "blurry", "text, watermark, blurry"],
    },
    stylize: {
      description: "Artistic influence level",
      range: "0-1000",
      default: 100,
    },
    chaos: {
      description: "Variation/randomness level",
      range: "0-100",
      default: 0,
    },
    quality: {
      description: "Detail level and render time",
      values: [0.25, 0.5, 1],
      default: 1,
    },
    seed: {
      description: "Seed for reproducible results",
      range: "0-4294967295",
    },
    stop: {
      description: "Stop generation at percentage",
      range: "10-100",
      default: 100,
    },
    version: {
      description: "MidJourney model version",
      values: ["5", "5.1", "5.2", "6", "6.1", "7"],
      default: "7",
    },
    style: {
      description: "Style mode",
      values: ["raw", "scenic"],
    },
    weird: {
      description: "Unusual/unexpected qualities",
      range: "0-3000",
      default: 0,
    },
    tile: {
      description: "Create seamless repeating pattern",
      type: "boolean",
    },
    repeat: {
      description: "Number of variations to generate",
      range: "1-40",
    },
    niji: {
      description: "Use Niji anime model",
      values: ["5", "6"],
    },
    styleRef: {
      description: "Style reference image URL",
    },
    styleWeight: {
      description: "Style reference influence",
      range: "0-1000",
      default: 100,
    },
    characterRef: {
      description: "Character reference image URL",
    },
    characterWeight: {
      description: "Character reference influence",
      range: "0-100",
      default: 100,
    },
    imageWeight: {
      description: "Image vs text prompt weight",
      range: "0-3",
      default: 1,
    },
    fast: {
      description: "Use fast generation mode",
      type: "boolean",
    },
    relax: {
      description: "Use relaxed generation mode",
      type: "boolean",
    },
    turbo: {
      description: "Use turbo generation mode (fastest)",
      type: "boolean",
    },
  });
});

// Serve downloaded images
app.use("/outputs", express.static(OUTPUT_DIR));

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Swagger docs available at http://localhost:${PORT}/docs`);

  // Pre-connect to MidJourney
  try {
    await getClient();
  } catch (error) {
    console.error("Failed to connect to MidJourney:", error);
  }
});
