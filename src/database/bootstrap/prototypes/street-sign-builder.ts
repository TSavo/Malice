import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the StreetSign type
 * Street name signs and directional signage.
 *
 * In 2110 Seattle, street signs are a mix of old and new. Some are the
 * original metal signs from before The Burning—survivors that nobody
 * bothered to replace. Others are digital displays, holographic projectors,
 * or AR markers visible only through The Mask.
 *
 * The old signs have character. Bullet holes. Graffiti. Rust. They mark
 * streets that existed before the corporations, before the AI, before
 * everything changed. The new signs are efficient but soulless.
 *
 * Inherits from Sign (which inherits from Describable).
 *
 * Properties:
 * - streetName: The street name displayed
 * - direction: Cardinal direction the street runs (if applicable)
 * - signType: 'metal' | 'digital' | 'holographic' | 'ar'
 * - damaged: Whether the sign is damaged/vandalized
 * - legible: Whether the text can still be read
 *
 * Methods:
 * - read(): Return the street name
 * - vandalize(method): Damage or deface the sign
 */
export class StreetSignBuilder implements Builder {
  static provides = ['streetSign'];
  static depends = ['sign'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    // Check if type already exists
    const existing = await this.manager.load('streetSign');
    if (existing) {
      this.obj = existing;
    } else {
      // Get parent type
      const sign = await this.manager.load('sign');
      if (!sign) {
        throw new Error('Sign type not found - required for StreetSign');
      }

      this.obj = await this.manager.define('streetSign', sign, {
        properties: {
          name: 'Street Sign',
          description: `A green street sign mounted on a metal pole. White letters spell out the street name. The sign is weathered but legible—a survivor from before The Burning.`,
          // Street info
          streetName: 'Unknown Street',
          direction: [], // Cardinal directions: ['N', 'S'] or ['E', 'W']
          blockNumber: null, // e.g., '100' for "100 block of..."
          // Physical
          signType: 'metal',
          height: 300, // ~10 feet to sign
          boltedDown: true,
          // Condition
          damaged: false,
          legible: true,
          graffiti: null, // Text of any graffiti
          bulletHoles: 0,
          // Abilities
          abilities: `Street name sign indicating location within the city grid.

READING: read() returns the street name. If 'legible' is false, text is
obscured or unreadable. If 'graffiti' is set, may include vandalism.

SIGN TYPES:
- 'metal': Traditional green metal sign. Durable, can be damaged.
- 'digital': LED display. Can be hacked to show different text.
- 'holographic': Projected sign. Flickers in rain. Invisible when power fails.
- 'ar': Augmented reality marker. Only visible through The Mask or AR devices.

DAMAGE: 'bulletHoles' accumulates hits. At 5+, 'legible' becomes false.
Sign can be bent, broken off, or stolen (if someone really wants to).

VANDALISM: vandalize(method) applies damage:
- 'graffiti': Adds text over the sign
- 'shoot': Adds bullet holes
- 'bend': Makes sign point wrong direction
- 'steal': Removes sign entirely (leaves empty pole)

NAVIGATION: Street signs help orient players in the city grid. The
'direction' property indicates which way the street runs. 'blockNumber'
indicates position along the street.

HISTORICAL: Many metal signs predate The Burning. They're artifacts of
a city that no longer exists—street names that outlived the streets.`,
        },
        methods: {},
      });
    }

    // Always rebuild methods
    const obj = this.obj!;

    // Override read() to include street-specific formatting
    obj.setMethod(
      'read',
      `
      /** Read the street sign.
       *  @returns The street name and any additional info
       */
      if (!self.legible) {
        return 'The sign is too damaged to read.';
      }

      let text = self.streetName || 'Unknown Street';

      // Add block number if present
      if (self.blockNumber) {
        text = self.blockNumber + ' ' + text;
      }

      // Add direction if present
      if (self.direction && self.direction.length > 0) {
        text = text + ' (' + self.direction.join('/') + ')';
      }

      // Add graffiti if present
      if (self.graffiti) {
        text = text + ' (graffiti: "' + self.graffiti + '")';
      }

      return text;
      `,
    );

    // vandalize(method) - Damage or deface the sign
    obj.setMethod(
      'vandalize',
      `
      /** Vandalize the street sign.
       *  @param method - 'graffiti', 'shoot', 'bend', or 'steal'
       *  @param detail - Additional detail (graffiti text, etc.)
       *  @returns Status message
       */
      const method = args[0];
      const detail = args[1];

      if (method === 'graffiti') {
        self.graffiti = detail || 'WAS HERE';
        self.damaged = true;
        return 'You spray paint "' + self.graffiti + '" across the sign.';
      }

      if (method === 'shoot') {
        const holes = (self.bulletHoles || 0) + 1;
        self.bulletHoles = holes;
        self.damaged = true;

        if (holes >= 5) {
          self.legible = false;
          return 'The sign is riddled with holes. The text is destroyed.';
        }

        return 'Another bullet hole in the sign. ' + (5 - holes) + ' more and it\\'s unreadable.';
      }

      if (method === 'bend') {
        self.damaged = true;
        self.description = self.description.replace(
          'mounted on a metal pole',
          'bent at an odd angle on a metal pole'
        );
        return 'You bend the sign until it points the wrong way.';
      }

      if (method === 'steal') {
        // This is more complex - should probably remove the object
        self.legible = false;
        self.name = 'Empty Signpost';
        self.description = 'A bare metal pole where a street sign used to be. Bolt holes remain.';
        return 'You wrench the sign free and take it.';
      }

      return 'Unknown vandalism method.';
      `,
    );

    // repair() - Fix a damaged sign
    obj.setMethod(
      'repair',
      `
      /** Repair or replace the street sign.
       *  @returns Status message
       */
      self.damaged = false;
      self.legible = true;
      self.graffiti = null;
      self.bulletHoles = 0;

      return 'The sign has been repaired.';
      `,
    );

    // Property descriptions
    obj.setPropertyDescription(
      'streetName',
      'The name of the street displayed on the sign',
    );
    obj.setPropertyDescription(
      'direction',
      "Cardinal directions the street runs: ['N', 'S'] or ['E', 'W']",
    );
    obj.setPropertyDescription(
      'blockNumber',
      'Block number if applicable (e.g., "100" for 100 block)',
    );
    obj.setPropertyDescription(
      'signType',
      "Physical type: 'metal', 'digital', 'holographic', or 'ar'",
    );
    obj.setPropertyDescription(
      'damaged',
      'Whether the sign has been vandalized or damaged',
    );
    obj.setPropertyDescription(
      'legible',
      'Whether the street name can still be read',
    );
    obj.setPropertyDescription(
      'graffiti',
      'Text of any graffiti sprayed on the sign',
    );
    obj.setPropertyDescription(
      'bulletHoles',
      'Number of bullet holes in the sign (5+ makes illegible)',
    );
  }

  async registerAliases(): Promise<void> {
    console.log("[StreetSignBuilder] Type 'streetSign' auto-aliased");
  }
}

// Self-register
registerBuilder(StreetSignBuilder);
