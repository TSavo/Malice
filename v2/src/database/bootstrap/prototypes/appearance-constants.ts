/**
 * Appearance Constants
 * Options for character customization and description generation
 */

export const EyeColors = [
  'brown',
  'blue',
  'green',
  'hazel',
  'gray',
  'amber',
  'violet',
  'black',
  'red', // Cyberpunk chromed eyes
  'silver', // Chrome
  'gold', // Chrome
] as const;

export const EyeShapes = [
  'almond',
  'round',
  'hooded',
  'monolid',
  'upturned',
  'downturned',
  'wide-set',
  'close-set',
] as const;

export const HairColors = [
  'black',
  'brown',
  'blonde',
  'red',
  'auburn',
  'gray',
  'white',
  'silver',
  // Unnatural colors (dyed or chrome)
  'blue',
  'green',
  'purple',
  'pink',
  'cyan',
  'neon-green',
] as const;

export const HairStyles = [
  'shaved',
  'buzz cut',
  'short',
  'medium',
  'long',
  'very long',
  'mohawk',
  'dreadlocks',
  'braided',
  'ponytail',
  'bun',
  'afro',
  'curly',
  'wavy',
  'straight',
] as const;

export const SkinTones = [
  'pale',
  'fair',
  'light',
  'medium',
  'olive',
  'tan',
  'brown',
  'dark',
  'ebony',
  // Chrome/cyber modifications
  'chrome',
  'synthetic',
] as const;

export const BodyTypes = [
  'thin',
  'slim',
  'average',
  'athletic',
  'muscular',
  'stocky',
  'heavyset',
  'large',
] as const;

export const NoseShapes = [
  'straight',
  'roman',
  'button',
  'wide',
  'narrow',
  'upturned',
  'hooked',
  'flat',
] as const;

export const EarShapes = [
  'normal',
  'pointed',
  'small',
  'large',
  'flat',
  'protruding',
] as const;

export const VoiceTypes = [
  'whisper',
  'soft',
  'normal',
  'loud',
  'booming',
] as const;

export const VoiceTones = [
  'natural',
  'deep',
  'high',
  'raspy',
  'melodic',
  'synthetic', // Chrome voicebox
  'robotic',
  'distorted',
] as const;

// Height ranges in meters
export const HeightRanges = {
  veryShort: { min: 1.4, max: 1.55, description: 'very short' },
  short: { min: 1.55, max: 1.65, description: 'short' },
  average: { min: 1.65, max: 1.8, description: 'average height' },
  tall: { min: 1.8, max: 1.9, description: 'tall' },
  veryTall: { min: 1.9, max: 2.2, description: 'very tall' },
} as const;

// Weight ranges based on body type
export const WeightModifiers = {
  thin: 0.8,
  slim: 0.9,
  average: 1.0,
  athletic: 1.05,
  muscular: 1.15,
  stocky: 1.1,
  heavyset: 1.25,
  large: 1.35,
} as const;

// Age categories
export const AgeCategories = {
  child: { min: 0, max: 12, description: 'young' },
  teenager: { min: 13, max: 19, description: 'teenage' },
  youngAdult: { min: 20, max: 35, description: 'young adult' },
  middleAged: { min: 36, max: 55, description: 'middle-aged' },
  elderly: { min: 56, max: 100, description: 'elderly' },
} as const;

// Helper to pick random from array
export function randomChoice<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Helper to get height description
export function describeHeight(heightMeters: number): string {
  for (const [, range] of Object.entries(HeightRanges)) {
    if (heightMeters >= range.min && heightMeters < range.max) {
      return range.description;
    }
  }
  return 'average height';
}

// Helper to get age description
export function describeAge(age: number): string {
  for (const [, category] of Object.entries(AgeCategories)) {
    if (age >= category.min && age <= category.max) {
      return category.description;
    }
  }
  return 'adult';
}

// Type exports for TypeScript
export type EyeColor = (typeof EyeColors)[number];
export type EyeShape = (typeof EyeShapes)[number];
export type HairColor = (typeof HairColors)[number];
export type HairStyle = (typeof HairStyles)[number];
export type SkinTone = (typeof SkinTones)[number];
export type BodyType = (typeof BodyTypes)[number];
export type NoseShape = (typeof NoseShapes)[number];
export type EarShape = (typeof EarShapes)[number];
export type VoiceType = (typeof VoiceTypes)[number];
export type VoiceTone = (typeof VoiceTones)[number];
