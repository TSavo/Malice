import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Lamppost type
 * Street light with optional surveillance capabilities.
 *
 * In 2110 Seattle, lampposts are part of the city infrastructure.
 * Many have embedded cameras - CorpSec installed them decades ago.
 * Pluribus sees through them now. The light is almost incidental.
 *
 * Inherits from Describable.
 *
 * Properties:
 * - lit: Whether the light is currently on
 * - lightType: 'led' | 'sodium' | 'halogen' - affects color/intensity
 * - hasSurveillance: Whether cameras are embedded
 * - cameraStatus: 'active' | 'disabled' | 'destroyed'
 * - damaged: Whether the lamppost is damaged
 * - flickering: Whether the light is malfunctioning
 *
 * Methods:
 * - observe(event, data): Log surveillance observation
 * - damage(amount): Damage the lamppost
 * - repair(): Repair damage
 */
export class LamppostBuilder implements Builder {
  static provides = ['lamppost'];
  static depends = ['describable'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    // Check if type already exists
    const existing = await this.manager.load('lamppost');
    if (existing) {
      this.obj = existing;
    } else {
      // Get parent type
      const describable = await this.manager.load('describable');
      if (!describable) {
        throw new Error('Describable type not found - required for Lamppost');
      }

      this.obj = await this.manager.define('lamppost', describable, {
        properties: {
          name: 'Lamppost',
          description: `A tall metal pole topped with a light fixture. The design is utilitarian—function over form. A faded city maintenance tag is riveted near the base.`,
          // Physical
          height: 450, // ~15 feet in cm
          weight: 150000, // ~150kg in grams
          boltedDown: true,
          // Lighting
          lit: true,
          lightType: 'led',
          flickering: false,
          damaged: false,
          durability: 100,
          // Surveillance (optional - set per instance)
          hasSurveillance: false,
          isPerceptionPoint: false,
          cameraStatus: 'inactive',
          observationLog: [],
          lastObservation: null,
          // AI status reporting
          lastStatusReport: null,
          reportedMalfunction: false,
          // Abilities
          abilities: `Street light providing illumination. Part of city infrastructure.

LIGHTING: When 'lit' is true, illuminates the room at night. The room's
effective lighting becomes 100 (full daylight equivalent) regardless of
time of day. Multiple lampposts don't stack - one working light is enough.

DAMAGE: 'durability' 0-100. Physical attacks reduce it. Below 30, light
flickers. At 0, light fails completely and 'lit' becomes false.

SELF-REPORTING: These lampposts have basic AI—just enough to phone home.
When durability drops below 30 or 'lit' becomes false, the lamppost
automatically reports its malfunction to city maintenance systems. In
practice, this means Pluribus knows. Whether anyone comes to fix it
is another matter.

The AI isn't conversational—it's more like a smoke detector that calls
the fire department. It knows when it's broken. That's about it.`,
        },
        methods: {},
      });
    }

    // Always rebuild methods
    const obj = this.obj!;

    // observe(event, data) - Log surveillance observation
    obj.setMethod(
      'observe',
      `
      /** Log an observation from embedded camera.
       *  @param event - Type of event witnessed
       *  @param data - Event details { who, what, when }
       */
      if (!self.hasSurveillance) return null;
      if (self.cameraStatus !== 'active') return null;

      const event = args[0];
      const data = args[1] || {};

      const observation = {
        event,
        timestamp: new Date().toISOString(),
        ...data,
      };

      const log = self.observationLog || [];
      log.push(observation);

      // Keep last 50 observations
      if (log.length > 50) {
        log.shift();
      }

      self.observationLog = log;
      self.lastObservation = observation;

      return observation;
      `,
    );

    // getRecentObservations(count) - Get recent observations
    obj.setMethod(
      'getRecentObservations',
      `
      /** Get recent observations from camera.
       *  @param count - Number of observations to return (default: 10)
       *  @returns Array of observations, newest first
       */
      if (!self.hasSurveillance) return [];
      const count = args[0] || 10;
      const log = self.observationLog || [];
      return log.slice(-count).reverse();
      `,
    );

    // damage(amount) - Damage the lamppost
    obj.setMethod(
      'damage',
      `
      /** Apply damage to the lamppost.
       *  @param amount - Damage amount (reduces durability)
       *  @returns Status message
       */
      const amount = args[0] || 10;

      self.durability = Math.max(0, (self.durability || 100) - amount);

      // Log the damage if surveillance is active
      if (self.hasSurveillance && self.cameraStatus === 'active') {
        await self.observe('damage_taken', { amount, remaining: self.durability });
      }

      if (self.durability <= 0) {
        self.lit = false;
        self.damaged = true;
        self.cameraStatus = 'destroyed';
        // Report malfunction
        if (!self.reportedMalfunction) {
          self.reportedMalfunction = true;
          self.lastStatusReport = {
            type: 'failure',
            timestamp: new Date().toISOString(),
            message: 'Unit offline. Light destroyed.',
          };
        }
        return 'The lamppost shatters. Glass rains down. Darkness.';
      } else if (self.durability < 30) {
        self.flickering = true;
        // Report malfunction
        if (!self.reportedMalfunction) {
          self.reportedMalfunction = true;
          self.lastStatusReport = {
            type: 'malfunction',
            timestamp: new Date().toISOString(),
            message: 'Unit degraded. Light flickering. Maintenance required.',
          };
        }
        return 'The light sparks and begins to flicker.';
      } else if (self.durability < 60) {
        return 'The impact dents the pole. The light wavers momentarily.';
      }

      return 'The lamppost shudders but holds.';
      `,
    );

    // repair() - Repair the lamppost
    obj.setMethod(
      'repair',
      `
      /** Repair the lamppost (requires maintenance access).
       *  @returns Status message
       */
      self.durability = 100;
      self.damaged = false;
      self.flickering = false;
      self.lit = true;
      self.reportedMalfunction = false;
      self.lastStatusReport = null;

      if (self.hasSurveillance && self.cameraStatus === 'destroyed') {
        self.cameraStatus = 'active';
      }

      return 'The lamppost has been repaired. Light restored.';
      `,
    );

    // disableSurveillance() - Disable camera without destroying
    obj.setMethod(
      'disableSurveillance',
      `
      /** Disable surveillance camera (spray paint, tape, etc.).
       *  @returns Status message
       */
      if (!self.hasSurveillance) {
        return 'This lamppost has no surveillance equipment.';
      }

      if (self.cameraStatus === 'disabled') {
        return 'The camera is already disabled.';
      }

      if (self.cameraStatus === 'destroyed') {
        return 'The camera is destroyed.';
      }

      // Log before going dark
      await self.observe('camera_disabled', { note: 'Feed terminated' });

      self.cameraStatus = 'disabled';

      return 'You disable the camera. The red LED behind the lens goes dark.';
      `,
    );

    // Property descriptions
    obj.setPropertyDescription('lit', 'Whether the light is currently on');
    obj.setPropertyDescription(
      'lightType',
      "Type of light: 'led' (white), 'sodium' (orange), or 'halogen' (warm)",
    );
    obj.setPropertyDescription(
      'flickering',
      'Whether the light is malfunctioning and stuttering',
    );
    obj.setPropertyDescription(
      'damaged',
      'Whether the lamppost has been significantly damaged',
    );
    obj.setPropertyDescription(
      'durability',
      'Structural integrity 0-100. At 0, light fails completely',
    );
    obj.setPropertyDescription(
      'hasSurveillance',
      'Whether this lamppost has embedded surveillance cameras',
    );
    obj.setPropertyDescription(
      'isPerceptionPoint',
      'If true and hasSurveillance, Pluribus can observe through this location',
    );
    obj.setPropertyDescription(
      'cameraStatus',
      "Status of embedded camera: 'active', 'disabled', or 'destroyed'",
    );
    obj.setPropertyDescription(
      'observationLog',
      'Array of surveillance observations (last 50)',
    );
    obj.setPropertyDescription(
      'lastObservation',
      'Most recent observation from camera',
    );
    obj.setPropertyDescription(
      'reportedMalfunction',
      'Whether the lamppost has reported its malfunction to city systems',
    );
    obj.setPropertyDescription(
      'lastStatusReport',
      'Most recent status report sent to city maintenance',
    );
  }

  async registerAliases(): Promise<void> {
    console.log("[LamppostBuilder] Type 'lamppost' auto-aliased");
  }
}

// Self-register
registerBuilder(LamppostBuilder);
