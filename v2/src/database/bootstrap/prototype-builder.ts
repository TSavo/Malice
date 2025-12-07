import { ObjectManager } from '../object-manager.js';
import {
  DescribableBuilder,
  LocationBuilder,
  ExitBuilder,
  RoomBuilder,
  AgentBuilder,
  EmbodiedBuilder,
  HumanBuilder,
  PlayerBuilder,
  AdminBuilder,
  DecayableBuilder,
  EdibleBuilder,
  FoodBuilder,
  DrinkBuilder,
  StomachContentsBuilder,
  BodyPartBuilder,
  BodyPartsBuilder,
} from './prototypes/index.js';

/**
 * Orchestrates building the object prototype hierarchy
 *
 * Creates prototypes with DYNAMIC IDs (no hardcoding):
 * - Describable: name, description, aliases, location, contents
 * - Location: container behavior (addContent, removeContent)
 * - Exit: direction aliases, destination, distance, locks
 * - Room: exits, go verb
 * - Agent: verbs, movement, actions
 * - Embodied: physical body, sensory organs, calorie/fat/decay metabolism
 * - Human: sex, pronouns, age, language understanding, stat aggregation
 * - Player: auth fields, permissions, connect/checkPassword
 * - Admin: building commands (@dig, @teleport, @set, etc.)
 * - Decayable: objects that decay over time (food, body parts, corpses)
 * - BodyPart: body parts with owner, child parts, conditions (inherits Decayable)
 * - Specialized body parts: Torso, Head, Eye, Ear, Nose, Mouth, Arm, Hand, Finger, Leg, Foot
 *
 * All IDs are dynamically assigned and registered as aliases in root.properties.aliases
 */
export class PrototypeBuilder {
  private describableBuilder: DescribableBuilder;
  private locationBuilder: LocationBuilder;
  private exitBuilder: ExitBuilder;
  private roomBuilder: RoomBuilder;
  private agentBuilder: AgentBuilder;
  private embodiedBuilder: EmbodiedBuilder;
  private humanBuilder: HumanBuilder;
  private playerBuilder: PlayerBuilder;
  private adminBuilder: AdminBuilder;
  private decayableBuilder: DecayableBuilder;
  private edibleBuilder: EdibleBuilder;
  private foodBuilder: FoodBuilder;
  private drinkBuilder: DrinkBuilder;
  private stomachContentsBuilder: StomachContentsBuilder;
  private bodyPartBuilder: BodyPartBuilder;
  private bodyPartsBuilder: BodyPartsBuilder;

  constructor(private manager: ObjectManager) {
    this.describableBuilder = new DescribableBuilder(manager);
    this.locationBuilder = new LocationBuilder(manager);
    this.exitBuilder = new ExitBuilder(manager);
    this.roomBuilder = new RoomBuilder(manager);
    this.agentBuilder = new AgentBuilder(manager);
    this.embodiedBuilder = new EmbodiedBuilder(manager);
    this.humanBuilder = new HumanBuilder(manager);
    this.playerBuilder = new PlayerBuilder(manager);
    this.adminBuilder = new AdminBuilder(manager);
    this.decayableBuilder = new DecayableBuilder(manager);
    this.edibleBuilder = new EdibleBuilder(manager);
    this.foodBuilder = new FoodBuilder(manager);
    this.drinkBuilder = new DrinkBuilder(manager);
    this.stomachContentsBuilder = new StomachContentsBuilder(manager);
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

    // Exit inherits from Describable (has name, aliases)
    const exit = aliases.exit
      ? await this.manager.load(aliases.exit as number)
      : await this.exitBuilder.build(describable!.id);

    const room = aliases.room
      ? await this.manager.load(aliases.room as number)
      : await this.roomBuilder.build(location!.id);

    const agent = aliases.agent
      ? await this.manager.load(aliases.agent as number)
      : await this.agentBuilder.build(describable!.id);

    const embodied = aliases.embodied
      ? await this.manager.load(aliases.embodied as number)
      : await this.embodiedBuilder.build(agent!.id);

    const human = aliases.human
      ? await this.manager.load(aliases.human as number)
      : await this.humanBuilder.build(embodied!.id);

    const player = aliases.player
      ? await this.manager.load(aliases.player as number)
      : await this.playerBuilder.build(human!.id);

    // Admin inherits from Player
    const admin = aliases.admin
      ? await this.manager.load(aliases.admin as number)
      : await this.adminBuilder.build(player!.id);

    // Decayable - base for anything that decays over time
    const decayable = aliases.decayable
      ? await this.manager.load(aliases.decayable as number)
      : await this.decayableBuilder.build(describable!.id);

    // Edible inherits from Decayable (food/drink decay)
    const edible = aliases.edible
      ? await this.manager.load(aliases.edible as number)
      : await this.edibleBuilder.build(decayable!.id);

    const food = aliases.food
      ? await this.manager.load(aliases.food as number)
      : await this.foodBuilder.build(edible!.id);

    const drink = aliases.drink
      ? await this.manager.load(aliases.drink as number)
      : await this.drinkBuilder.build(edible!.id);

    const stomachContents = aliases.stomachContents
      ? await this.manager.load(aliases.stomachContents as number)
      : await this.stomachContentsBuilder.build(describable!.id);

    // BodyPart inherits from Edible (severed parts can be eaten, decay over time)
    const bodyPart = aliases.bodyPart
      ? await this.manager.load(aliases.bodyPart as number)
      : await this.bodyPartBuilder.build(edible!.id);

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
      exit: exit!.id,
      room: room!.id,
      agent: agent!.id,
      embodied: embodied!.id,
      human: human!.id,
      player: player!.id,
      admin: admin!.id,
      decayable: decayable!.id,
      edible: edible!.id,
      food: food!.id,
      drink: drink!.id,
      stomachContents: stomachContents!.id,
      bodyPart: bodyPart!.id,
      bodyParts,
    });
  }

  private async registerAliases(ids: {
    describable: number;
    location: number;
    exit: number;
    room: number;
    agent: number;
    embodied: number;
    human: number;
    player: number;
    admin: number;
    decayable: number;
    edible: number;
    food: number;
    drink: number;
    stomachContents: number;
    bodyPart: number;
    bodyParts: Record<string, number>;
  }): Promise<void> {
    const objectManager = await this.manager.load(0);
    if (!objectManager) return;

    const aliases = (objectManager.get('aliases') as Record<string, number | Record<string, number>>) || {};
    aliases.describable = ids.describable;
    aliases.location = ids.location;
    aliases.exit = ids.exit;
    aliases.room = ids.room;
    aliases.agent = ids.agent;
    aliases.embodied = ids.embodied;
    aliases.human = ids.human;
    aliases.player = ids.player;
    aliases.admin = ids.admin;
    aliases.decayable = ids.decayable;
    aliases.edible = ids.edible;
    aliases.food = ids.food;
    aliases.drink = ids.drink;
    aliases.stomachContents = ids.stomachContents;
    aliases.bodyPart = ids.bodyPart;
    aliases.bodyParts = ids.bodyParts;

    // Also expose individual body part prototypes at top level for BodyFactory
    for (const [name, id] of Object.entries(ids.bodyParts)) {
      aliases[name] = id;
    }

    objectManager.set('aliases', aliases);

    const partNames = Object.keys(ids.bodyParts).join(', ');
    console.log(
      `✅ Registered prototype aliases: describable=#${ids.describable}, location=#${ids.location}, exit=#${ids.exit}, room=#${ids.room}, agent=#${ids.agent}, embodied=#${ids.embodied}, human=#${ids.human}, player=#${ids.player}, admin=#${ids.admin}, decayable=#${ids.decayable}, bodyPart=#${ids.bodyPart}`,
    );
    console.log(`✅ Registered body part prototypes: ${partNames}`);
  }
}
