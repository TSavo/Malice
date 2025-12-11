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
  CorpseBuilder,
  HumanRemainsBuilder,
  SkeletalRemainsBuilder,
  WoundBuilder,
  EdibleBuilder,
  FoodBuilder,
  DrinkBuilder,
  StomachContentsBuilder,
  BodyPartBuilder,
  BodyPartsBuilder,
  WearableBuilder,
  ClothingBuilder,
  LockerBuilder,
  OneTimeLockerBuilder,
  BankBuilder,
  BankTerminalBuilder,
  StackableBuilder,
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
  private corpseBuilder: CorpseBuilder;
  private humanRemainsBuilder: HumanRemainsBuilder;
  private skeletalRemainsBuilder: SkeletalRemainsBuilder;
  private woundBuilder: WoundBuilder;
  private edibleBuilder: EdibleBuilder;
  private foodBuilder: FoodBuilder;
  private drinkBuilder: DrinkBuilder;
  private stomachContentsBuilder: StomachContentsBuilder;
  private bodyPartBuilder: BodyPartBuilder;
  private bodyPartsBuilder: BodyPartsBuilder;
  private wearableBuilder: WearableBuilder;
  private clothingBuilder: ClothingBuilder;
  private lockerBuilder: LockerBuilder;
  private oneTimeLockerBuilder: OneTimeLockerBuilder;
  private bankBuilder: BankBuilder;
  private bankTerminalBuilder: BankTerminalBuilder;
  private stackableBuilder: StackableBuilder;

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
    this.corpseBuilder = new CorpseBuilder(manager);
    this.humanRemainsBuilder = new HumanRemainsBuilder(manager);
    this.skeletalRemainsBuilder = new SkeletalRemainsBuilder(manager);
    this.woundBuilder = new WoundBuilder(manager);
    this.edibleBuilder = new EdibleBuilder(manager);
    this.foodBuilder = new FoodBuilder(manager);
    this.drinkBuilder = new DrinkBuilder(manager);
    this.stomachContentsBuilder = new StomachContentsBuilder(manager);
    this.bodyPartBuilder = new BodyPartBuilder(manager);
    this.bodyPartsBuilder = new BodyPartsBuilder(manager);
    this.wearableBuilder = new WearableBuilder(manager);
    this.clothingBuilder = new ClothingBuilder(manager);
    this.lockerBuilder = new LockerBuilder(manager);
    this.oneTimeLockerBuilder = new OneTimeLockerBuilder(manager);
    this.bankBuilder = new BankBuilder(manager);
    this.bankTerminalBuilder = new BankTerminalBuilder(manager);
    this.stackableBuilder = new StackableBuilder(manager);
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

    // Corpse inherits from Decayable (dead bodies decay)
    const corpse = aliases.corpse
      ? await this.manager.load(aliases.corpse as number)
      : await this.corpseBuilder.build(decayable!.id);

    // HumanRemains inherits from Describable (dried remains, very slow decay)
    const humanRemains = aliases.humanRemains
      ? await this.manager.load(aliases.humanRemains as number)
      : await this.humanRemainsBuilder.build(describable!.id);

    // SkeletalRemains inherits from Describable (permanent bones)
    const skeletalRemains = aliases.skeletalRemains
      ? await this.manager.load(aliases.skeletalRemains as number)
      : await this.skeletalRemainsBuilder.build(describable!.id);

    // Wound inherits from Describable (wounds are objects on body parts)
    const wound = aliases.wound
      ? await this.manager.load(aliases.wound as number)
      : await this.woundBuilder.build(describable!.id);

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

    // Wearable - base for clothing, armor, jewelry (inherits from Describable)
    const wearable = aliases.wearable
      ? await this.manager.load(aliases.wearable as number)
      : await this.wearableBuilder.build(describable!.id);

    // Clothing - wearable items that provide warmth (inherits from Wearable)
    const clothing = aliases.clothing
      ? await this.manager.load(aliases.clothing as number)
      : await this.clothingBuilder.build(wearable!.id);

    // Locker - lockable containers with codes (inherits from Location)
    const locker = aliases.locker
      ? await this.manager.load(aliases.locker as number)
      : await this.lockerBuilder.build(location!.id);

    // OneTimeLocker - courier-friendly lockers (inherits from Locker)
    const oneTimeLocker = aliases.oneTimeLocker
      ? await this.manager.load(aliases.oneTimeLocker as number)
      : await this.oneTimeLockerBuilder.build(locker!.id);

    // Bank - electronic currency ledger (inherits from Root)
    const bank = aliases.bank
      ? await this.manager.load(aliases.bank as number)
      : await this.bankBuilder.build(1);

    // BankTerminal - player-facing banking kiosk (inherits from Describable)
    const bankTerminal = aliases.bankTerminal
      ? await this.manager.load(aliases.bankTerminal as number)
      : await this.bankTerminalBuilder.build(describable!.id);

    // Stackable - physical commodities (inherits from Describable)
    const stackable = aliases.stackable
      ? await this.manager.load(aliases.stackable as number)
      : await this.stackableBuilder.build(describable!.id);

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
      corpse: corpse!.id,
      humanRemains: humanRemains!.id,
      skeletalRemains: skeletalRemains!.id,
      wound: wound!.id,
      edible: edible!.id,
      food: food!.id,
      drink: drink!.id,
      stomachContents: stomachContents!.id,
      bodyPart: bodyPart!.id,
      bodyParts,
      wearable: wearable!.id,
      clothing: clothing!.id,
      locker: locker!.id,
      oneTimeLocker: oneTimeLocker!.id,
      bank: bank!.id,
      bankTerminal: bankTerminal!.id,
      stackable: stackable!.id,
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
    corpse: number;
    humanRemains: number;
    skeletalRemains: number;
    wound: number;
    edible: number;
    food: number;
    drink: number;
    stomachContents: number;
    bodyPart: number;
    bodyParts: Record<string, number>;
    wearable: number;
    clothing: number;
    locker: number;
    oneTimeLocker: number;
    bank: number;
    bankTerminal: number;
    stackable: number;
  }): Promise<void> {
    const objectManager = await this.manager.load(0);
    if (!objectManager) return;

    // Register all prototype aliases using addAlias
    await objectManager.call('addAlias', 'describable', ids.describable);
    await objectManager.call('addAlias', 'location', ids.location);
    await objectManager.call('addAlias', 'exit', ids.exit);
    await objectManager.call('addAlias', 'room', ids.room);
    await objectManager.call('addAlias', 'agent', ids.agent);
    await objectManager.call('addAlias', 'embodied', ids.embodied);
    await objectManager.call('addAlias', 'human', ids.human);
    await objectManager.call('addAlias', 'player', ids.player);
    await objectManager.call('addAlias', 'admin', ids.admin);
    await objectManager.call('addAlias', 'decayable', ids.decayable);
    await objectManager.call('addAlias', 'corpse', ids.corpse);
    await objectManager.call('addAlias', 'humanRemains', ids.humanRemains);
    await objectManager.call('addAlias', 'skeletalRemains', ids.skeletalRemains);
    await objectManager.call('addAlias', 'wound', ids.wound);
    await objectManager.call('addAlias', 'edible', ids.edible);
    await objectManager.call('addAlias', 'food', ids.food);
    await objectManager.call('addAlias', 'drink', ids.drink);
    await objectManager.call('addAlias', 'stomachContents', ids.stomachContents);
    await objectManager.call('addAlias', 'bodyPart', ids.bodyPart);
    await objectManager.call('addAlias', 'wearable', ids.wearable);
    await objectManager.call('addAlias', 'clothing', ids.clothing);
    await objectManager.call('addAlias', 'locker', ids.locker);
    await objectManager.call('addAlias', 'oneTimeLocker', ids.oneTimeLocker);
    await objectManager.call('addAlias', 'bank', ids.bank);
    await objectManager.call('addAlias', 'bankTerminal', ids.bankTerminal);
    await objectManager.call('addAlias', 'stackable', ids.stackable);

    // Store bodyParts object directly (addAlias only supports simple id values)
    const aliases = (objectManager.get('aliases') as Record<string, number | Record<string, number>>) || {};
    aliases.bodyParts = ids.bodyParts;
    objectManager.set('aliases', aliases);

    // Also expose individual body part prototypes at top level for BodyFactory
    for (const [name, id] of Object.entries(ids.bodyParts)) {
      await objectManager.call('addAlias', name, id);
    }

    const partNames = Object.keys(ids.bodyParts).join(', ');
    console.log(
      `✅ Registered prototype aliases: describable=#${ids.describable}, location=#${ids.location}, exit=#${ids.exit}, room=#${ids.room}, agent=#${ids.agent}, embodied=#${ids.embodied}, human=#${ids.human}, player=#${ids.player}, admin=#${ids.admin}, decayable=#${ids.decayable}, bodyPart=#${ids.bodyPart}, wearable=#${ids.wearable}, clothing=#${ids.clothing}, locker=#${ids.locker}, oneTimeLocker=#${ids.oneTimeLocker}`,
    );
    console.log(`✅ Registered body part prototypes: ${partNames}`);
  }
}
