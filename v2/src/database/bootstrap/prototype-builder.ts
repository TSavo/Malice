import { ObjectManager } from '../object-manager.js';
import {
  DescribableBuilder,
  LocationBuilder,
  RoomBuilder,
  AgentBuilder,
  HumanBuilder,
  PlayerBuilder,
  BodyPartBuilder,
  BodyPartsBuilder,
} from './prototypes/index.js';

/**
 * Orchestrates building the object prototype hierarchy
 *
 * Creates prototypes with DYNAMIC IDs (no hardcoding):
 * - Describable: name, description, aliases, location, contents
 * - Location: container behavior (addContent, removeContent)
 * - Room: exits, go verb
 * - Agent: verbs, movement, actions
 * - Human: sex, pronouns, age
 * - Player: auth fields, permissions, connect/checkPassword
 * - BodyPart: body parts with owner, child parts, conditions
 * - Specialized body parts: Torso, Head, Eye, Ear, Nose, Mouth, Arm, Hand, Finger, Leg, Foot
 *
 * All IDs are dynamically assigned and registered as aliases in root.properties.aliases
 */
export class PrototypeBuilder {
  private describableBuilder: DescribableBuilder;
  private locationBuilder: LocationBuilder;
  private roomBuilder: RoomBuilder;
  private agentBuilder: AgentBuilder;
  private humanBuilder: HumanBuilder;
  private playerBuilder: PlayerBuilder;
  private bodyPartBuilder: BodyPartBuilder;
  private bodyPartsBuilder: BodyPartsBuilder;

  constructor(private manager: ObjectManager) {
    this.describableBuilder = new DescribableBuilder(manager);
    this.locationBuilder = new LocationBuilder(manager);
    this.roomBuilder = new RoomBuilder(manager);
    this.agentBuilder = new AgentBuilder(manager);
    this.humanBuilder = new HumanBuilder(manager);
    this.playerBuilder = new PlayerBuilder(manager);
    this.bodyPartBuilder = new BodyPartBuilder(manager);
    this.bodyPartsBuilder = new BodyPartsBuilder(manager);
  }

  /**
   * Build all prototype objects
   * Idempotent - checks for existing aliases before creating
   */
  async buildPrototypes(): Promise<void> {
    // Check if prototypes already exist via aliases
    const objectManager = await this.manager.load(0);
    if (!objectManager) throw new Error('Root object not found - run minimal bootstrap first');

    const aliases = (objectManager.get('aliases') as Record<string, number | Record<string, number>>) || {};

    // Create prototypes (or get existing ones)
    const describable = aliases.describable
      ? await this.manager.load(aliases.describable as number)
      : await this.describableBuilder.build(1);

    const location = aliases.location
      ? await this.manager.load(aliases.location as number)
      : await this.locationBuilder.build(describable!.id);

    const room = aliases.room
      ? await this.manager.load(aliases.room as number)
      : await this.roomBuilder.build(location!.id);

    const agent = aliases.agent
      ? await this.manager.load(aliases.agent as number)
      : await this.agentBuilder.build(describable!.id);

    const human = aliases.human
      ? await this.manager.load(aliases.human as number)
      : await this.humanBuilder.build(agent!.id);

    const player = aliases.player
      ? await this.manager.load(aliases.player as number)
      : await this.playerBuilder.build(human!.id);

    const bodyPart = aliases.bodyPart
      ? await this.manager.load(aliases.bodyPart as number)
      : await this.bodyPartBuilder.build(describable!.id);

    // Build specialized body parts (inherit from BodyPart)
    // Store under bodyParts.* namespace in aliases
    let bodyParts = (aliases.bodyParts as Record<string, number>) || {};
    const needsBodyParts = !bodyParts.torso; // Check if any specialized parts exist

    if (needsBodyParts) {
      const builtParts = await this.bodyPartsBuilder.buildAll(bodyPart!.id);
      bodyParts = {};
      for (const [name, part] of Object.entries(builtParts)) {
        bodyParts[name] = part.id;
      }
    }

    // Register aliases in root.properties.aliases
    await this.registerAliases({
      describable: describable!.id,
      location: location!.id,
      room: room!.id,
      agent: agent!.id,
      human: human!.id,
      player: player!.id,
      bodyPart: bodyPart!.id,
      bodyParts,
    });
  }

  private async registerAliases(ids: {
    describable: number;
    location: number;
    room: number;
    agent: number;
    human: number;
    player: number;
    bodyPart: number;
    bodyParts: Record<string, number>;
  }): Promise<void> {
    const objectManager = await this.manager.load(0);
    if (!objectManager) return;

    const aliases = (objectManager.get('aliases') as Record<string, number | Record<string, number>>) || {};
    aliases.describable = ids.describable;
    aliases.location = ids.location;
    aliases.room = ids.room;
    aliases.agent = ids.agent;
    aliases.human = ids.human;
    aliases.player = ids.player;
    aliases.bodyPart = ids.bodyPart;
    aliases.bodyParts = ids.bodyParts;

    // Also expose individual body part prototypes at top level for BodyFactory
    for (const [name, id] of Object.entries(ids.bodyParts)) {
      aliases[name] = id;
    }

    objectManager.set('aliases', aliases);

    const partNames = Object.keys(ids.bodyParts).join(', ');
    console.log(
      `✅ Registered prototype aliases: describable=#${ids.describable}, location=#${ids.location}, room=#${ids.room}, agent=#${ids.agent}, human=#${ids.human}, player=#${ids.player}, bodyPart=#${ids.bodyPart}`,
    );
    console.log(`✅ Registered body part prototypes: ${partNames}`);
  }
}
