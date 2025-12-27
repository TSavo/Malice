import type { RuntimeObject } from '../../../../types/object.js';
import type { ObjectManager } from '../../object-manager.js';

/**
 * Builds the TotemPole prototype
 * A landmark with embedded surveillance tech.
 *
 * The Pioneer Square totem pole is real Seattle history:
 * - 1899: Seattle businessmen stole a Tlingit totem pole from Alaska
 * - 1938: After the original burned, they commissioned a replacement
 *   from the same Tlingit community (who charged $5,000)
 * - The replacement has stood in Pioneer Square ever since
 *
 * In Malice, CorpSec installed cameras in the pole decades ago.
 * Pluribus inherited access to the feeds. Raven sees.
 */
export class TotemPoleBuilder {
  static readonly alias = 'totemPole';
  static readonly parent = 'describable';

  constructor(private manager: ObjectManager) {}

  async build(describableId: number): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(describableId);
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Totem Pole',
        description: `A sixty-foot cedar column rises from its concrete base, carved with figures from Tlingit mythology. Raven perches at the top, wings folded, beak pointed toward the sky. Below: Bear, Whale, Wolf—each figure emerging from the one beneath.

The pole has weathered to silver-grey, its original paint faded to ghosts. Rain has darkened the wood in vertical streaks. Moss grows in the deeper carved spaces.

This is the second pole. The first was stolen from a Tlingit village in Alaska during an 1899 "goodwill expedition"—Seattle businessmen literally sawed it down and loaded it onto a steamer. When that one burned in 1938, the city commissioned a replacement from the same community they'd robbed. The Tlingit charged five thousand dollars. The city paid.

If you look carefully at Raven's eyes, you can see the lens housings. CorpSec installed the cameras decades ago. Someone is always watching.`,
        // Physical properties
        height: 1829, // 60 feet in cm
        width: 91, // ~3 feet diameter at base
        depth: 91,
        weight: 4000000, // ~4 tons in grams
        boltedDown: true,
        // Totem-specific
        carvings: ['Raven', 'Bear', 'Whale', 'Wolf', 'Frog', 'Eagle'],
        yearInstalled: 1938,
        yearStolen: 1899,
        originVillage: 'Tongass Island, Alaska',
        // Surveillance
        isPerceptionPoint: true,
        cameraStatus: 'active',
        lastObservation: null,
        observationLog: [],
        // Abilities
        abilities: `A sixty-foot Tlingit totem pole with embedded CorpSec surveillance cameras.

SURVEILLANCE: Cameras are hidden in Raven's carved eyes. Feed goes to CorpSec
network, which Pluribus has access to. The isPerceptionPoint property marks this
as a location Pluribus can observe from.

OBSERVATION LOG: Events within camera range are logged to observationLog via the
observe() method. Pluribus can query recent observations.

CLIMBING: The totem pole can be climbed. $topOfTotemPole is sixty feet up among
Raven's wings. $bottomOfTotemPole is the plaza below.

To climb UP: player.moveTo($topOfTotemPole)
To climb DOWN: player.moveTo($bottomOfTotemPole)

NARRATION when climbing UP:
- $bottomOfTotemPole sees: "[Player] climbs the totem pole, ascending hand over hand
  past Bear and Whale and Wolf until they disappear among Raven's wings."
- $topOfTotemPole sees: "[Player] pulls themselves up onto the narrow platform,
  sixty feet above the plaza."

NARRATION when climbing DOWN:
- $topOfTotemPole sees: "[Player] begins the long climb down, disappearing below Raven's beak."
- $bottomOfTotemPole sees: "[Player] descends the totem pole, emerging from among the
  carved figures to drop the last few feet to the concrete."

PHYSICAL: 60 feet tall, cedar, bolted to concrete base. Cannot be moved.
The carvings are genuine Tlingit art - stolen twice over.`,
      },
      methods: {},
    });

    // observe(event, data) - Log an observation (called by Pluribus or surveillance system)
    obj.setMethod(
      'observe',
      `
      /** Log an observation from the cameras.
       *  @param event - Type of event witnessed
       *  @param data - Event details { who, what, when }
       */
      const event = args[0];
      const data = args[1] || {};

      if (self.cameraStatus !== 'active') {
        return null; // Cameras disabled
      }

      const observation = {
        event,
        timestamp: new Date().toISOString(),
        ...data,
      };

      const log = self.observationLog || [];
      log.push(observation);

      // Keep last 100 observations
      if (log.length > 100) {
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
      /** Get recent observations from cameras.
       *  @param count - Number of observations to return (default: 10)
       *  @returns Array of observations, newest first
       */
      const count = args[0] || 10;
      const log = self.observationLog || [];
      return log.slice(-count).reverse();
      `,
    );

    // disableCameras() - Disable surveillance (requires physical access)
    obj.setMethod(
      'disableCameras',
      `
      /** Disable the surveillance cameras.
       *  Requires physical access and tools.
       *  @returns Status message
       */
      if (self.cameraStatus === 'disabled') {
        return 'The cameras are already disabled.';
      }

      self.cameraStatus = 'disabled';

      // Log the tampering before going dark
      await self.observe('cameras_disabled', {
        note: 'Feed terminated',
      });

      return 'You disable the cameras. The red LED behind Raven\\'s left eye flickers and dies.';
      `,
    );

    // enableCameras() - Re-enable surveillance
    obj.setMethod(
      'enableCameras',
      `
      /** Re-enable the surveillance cameras.
       *  @returns Status message
       */
      if (self.cameraStatus === 'active') {
        return 'The cameras are already active.';
      }

      self.cameraStatus = 'active';

      await self.observe('cameras_enabled', {
        note: 'Feed restored',
      });

      return 'The cameras come back online. Raven watches again.';
      `,
    );

    // Property descriptions
    obj.setPropertyDescription(
      'carvings',
      'The Tlingit figures carved into the pole, from top to bottom',
    );
    obj.setPropertyDescription(
      'yearInstalled',
      'When this replacement pole was installed (1938)',
    );
    obj.setPropertyDescription(
      'yearStolen',
      'When the original was stolen from Alaska (1899)',
    );
    obj.setPropertyDescription(
      'originVillage',
      'The Tlingit village the original pole was stolen from',
    );
    obj.setPropertyDescription(
      'isPerceptionPoint',
      'If true, Pluribus can observe through this location',
    );
    obj.setPropertyDescription(
      'cameraStatus',
      'Status of embedded cameras: active or disabled',
    );
    obj.setPropertyDescription(
      'lastObservation',
      'Most recent observation from cameras',
    );
    obj.setPropertyDescription(
      'observationLog',
      'Array of observations from cameras (last 100)',
    );

    return obj;
  }
}
