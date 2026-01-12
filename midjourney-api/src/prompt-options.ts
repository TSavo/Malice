/**
 * MidJourney Prompt Options
 *
 * These options map to MidJourney parameters that can be appended to prompts.
 * See: https://docs.midjourney.com/docs/parameter-list
 */

export interface MJPromptOptions {
  /**
   * Aspect Ratio (--ar)
   * Controls the image dimensions.
   * Examples: "1:1", "16:9", "9:16", "3:2", "2:3", "4:5", "5:4"
   * Default: "1:1"
   */
  aspectRatio?: string;

  /**
   * Negative Prompt (--no)
   * Elements to exclude from the image.
   * Can be a single item or comma-separated list.
   * Example: "text, watermark, blurry"
   */
  no?: string;

  /**
   * Stylize (--s or --stylize)
   * Controls artistic influence. Higher = more artistic, lower = closer to prompt.
   * Range: 0-1000
   * Default: 100
   */
  stylize?: number;

  /**
   * Chaos (--c or --chaos)
   * Controls variation/randomness in results.
   * Range: 0-100
   * Default: 0
   */
  chaos?: number;

  /**
   * Quality (--q or --quality)
   * Controls detail level and render time.
   * Values: 0.25, 0.5, 1
   * Default: 1
   */
  quality?: 0.25 | 0.5 | 1;

  /**
   * Seed (--seed)
   * Set a specific seed for reproducible results.
   * Range: 0-4294967295
   */
  seed?: number;

  /**
   * Stop (--stop)
   * Stop generation before 100% completion.
   * Range: 10-100
   * Default: 100
   */
  stop?: number;

  /**
   * Version (--v)
   * MidJourney model version to use.
   * Values: "5", "5.1", "5.2", "6", "6.1", "7"
   * Default: "7" (current default)
   */
  version?: string;

  /**
   * Style (--style)
   * Apply alternative aesthetics.
   * Values: "raw" (less beautification), "scenic" (cinematic)
   */
  style?: "raw" | "scenic";

  /**
   * Weird (--weird or --w)
   * Introduces unusual/unexpected qualities.
   * Range: 0-3000
   * Default: 0
   */
  weird?: number;

  /**
   * Tile (--tile)
   * Creates seamless repeating patterns.
   */
  tile?: boolean;

  /**
   * Repeat (--r or --repeat)
   * Generate multiple variations from a single prompt.
   * Range: 1-40
   */
  repeat?: number;

  /**
   * Niji Mode (--niji)
   * Use the anime-focused Niji model.
   * Values: "5", "6"
   */
  niji?: string;

  /**
   * Style Reference URL (--sref)
   * Reference image URL for style matching.
   */
  styleRef?: string;

  /**
   * Style Weight (--sw)
   * How strongly the style reference influences the image.
   * Range: 0-1000
   * Default: 100
   */
  styleWeight?: number;

  /**
   * Character Reference URL (--cref)
   * Reference image URL for character consistency.
   */
  characterRef?: string;

  /**
   * Character Weight (--cw)
   * How strongly the character reference influences the image.
   * Lower values focus on face only, higher includes clothing.
   * Range: 0-100
   * Default: 100
   */
  characterWeight?: number;

  /**
   * Image Weight (--iw)
   * Controls reference image influence vs text prompt.
   * Range: 0-2 (V6), 0-3 (V7)
   * Default: 1
   */
  imageWeight?: number;

  /**
   * Fast Mode (--fast)
   * Use fast generation mode (uses fast GPU hours).
   */
  fast?: boolean;

  /**
   * Relax Mode (--relax)
   * Use relaxed generation mode (slower but doesn't use fast hours).
   */
  relax?: boolean;

  /**
   * Turbo Mode (--turbo)
   * Use turbo generation mode (fastest, uses more GPU hours).
   */
  turbo?: boolean;
}

/**
 * Builds a prompt string with options appended
 */
export function buildPrompt(basePrompt: string, options?: MJPromptOptions): string {
  if (!options) return basePrompt;

  const params: string[] = [];

  // Aspect Ratio
  if (options.aspectRatio) {
    params.push(`--ar ${options.aspectRatio}`);
  }

  // Negative Prompt
  if (options.no) {
    params.push(`--no ${options.no}`);
  }

  // Stylize
  if (options.stylize !== undefined) {
    const value = Math.max(0, Math.min(1000, options.stylize));
    params.push(`--s ${value}`);
  }

  // Chaos
  if (options.chaos !== undefined) {
    const value = Math.max(0, Math.min(100, options.chaos));
    params.push(`--c ${value}`);
  }

  // Quality
  if (options.quality !== undefined) {
    params.push(`--q ${options.quality}`);
  }

  // Seed
  if (options.seed !== undefined) {
    params.push(`--seed ${options.seed}`);
  }

  // Stop
  if (options.stop !== undefined) {
    const value = Math.max(10, Math.min(100, options.stop));
    params.push(`--stop ${value}`);
  }

  // Version (only if not using niji)
  if (options.version && !options.niji) {
    params.push(`--v ${options.version}`);
  }

  // Niji (anime model)
  if (options.niji) {
    params.push(`--niji ${options.niji}`);
  }

  // Style
  if (options.style) {
    params.push(`--style ${options.style}`);
  }

  // Weird
  if (options.weird !== undefined) {
    const value = Math.max(0, Math.min(3000, options.weird));
    params.push(`--w ${value}`);
  }

  // Tile
  if (options.tile) {
    params.push("--tile");
  }

  // Repeat
  if (options.repeat !== undefined) {
    const value = Math.max(1, Math.min(40, options.repeat));
    params.push(`--r ${value}`);
  }

  // Style Reference
  if (options.styleRef) {
    params.push(`--sref ${options.styleRef}`);
    if (options.styleWeight !== undefined) {
      params.push(`--sw ${options.styleWeight}`);
    }
  }

  // Character Reference
  if (options.characterRef) {
    params.push(`--cref ${options.characterRef}`);
    if (options.characterWeight !== undefined) {
      params.push(`--cw ${options.characterWeight}`);
    }
  }

  // Image Weight
  if (options.imageWeight !== undefined) {
    params.push(`--iw ${options.imageWeight}`);
  }

  // Speed modes (mutually exclusive)
  if (options.turbo) {
    params.push("--turbo");
  } else if (options.fast) {
    params.push("--fast");
  } else if (options.relax) {
    params.push("--relax");
  }

  // Combine base prompt with parameters
  if (params.length > 0) {
    return `${basePrompt} ${params.join(" ")}`;
  }

  return basePrompt;
}

/**
 * Validate prompt options and return any errors
 */
export function validateOptions(options: MJPromptOptions): string[] {
  const errors: string[] = [];

  if (options.aspectRatio && !/^\d+:\d+$/.test(options.aspectRatio)) {
    errors.push("aspectRatio must be in format 'width:height' (e.g., '16:9')");
  }

  if (options.stylize !== undefined && (options.stylize < 0 || options.stylize > 1000)) {
    errors.push("stylize must be between 0 and 1000");
  }

  if (options.chaos !== undefined && (options.chaos < 0 || options.chaos > 100)) {
    errors.push("chaos must be between 0 and 100");
  }

  if (options.quality !== undefined && ![0.25, 0.5, 1].includes(options.quality)) {
    errors.push("quality must be 0.25, 0.5, or 1");
  }

  if (options.stop !== undefined && (options.stop < 10 || options.stop > 100)) {
    errors.push("stop must be between 10 and 100");
  }

  if (options.weird !== undefined && (options.weird < 0 || options.weird > 3000)) {
    errors.push("weird must be between 0 and 3000");
  }

  if (options.repeat !== undefined && (options.repeat < 1 || options.repeat > 40)) {
    errors.push("repeat must be between 1 and 40");
  }

  if (options.styleWeight !== undefined && (options.styleWeight < 0 || options.styleWeight > 1000)) {
    errors.push("styleWeight must be between 0 and 1000");
  }

  if (options.characterWeight !== undefined && (options.characterWeight < 0 || options.characterWeight > 100)) {
    errors.push("characterWeight must be between 0 and 100");
  }

  if (options.imageWeight !== undefined && (options.imageWeight < 0 || options.imageWeight > 3)) {
    errors.push("imageWeight must be between 0 and 3");
  }

  return errors;
}
