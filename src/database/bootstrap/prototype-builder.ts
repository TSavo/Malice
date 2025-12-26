import type { ObjectManager } from '../object-manager.js';
import { CashBuilder } from './cash-builder.js';
import {
  AdminBuilder,
  AgentBuilder,
  AmmoBuilder,
  AmmoPrototypesBuilder,
  BankBuilder,
  BankTerminalBuilder,
  BiometricLockBuilder,
  BodyPartBuilder,
  BodyPartsBuilder,
  BottledWaterBuilder,
  CloneRecordingStudioBuilder,
  CloneTankBuilder,
  ClothingBuilder,
  CorpseBuilder,
  DecayableBuilder,
  DescribableBuilder,
  DisposalBuilder,
  DollarBuilder,
  DoorBuilder,
  DrinkBuilder,
  EdibleBuilder,
  ElevatorBuilder,
  EmbodiedBuilder,
  ExitBuilder,
  FactionBuilder,
  FoodBuilder,
  GuardedExitBuilder,
  HumanBuilder,
  HumanRemainsBuilder,
  IncineratorBuilder,
  LocationBuilder,
  LockBuilder,
  LockerBuilder,
  MagazineBuilder,
  MagazinePrototypesBuilder,
  OneTimeLockerBuilder,
  PayphoneBuilder,
  PhoneBuilder,
  PhoneDbBuilder,
  PlayerBuilder,
  PocketBuilder,
  RentableLockBuilder,
  RoomBuilder,
  SealedBoxBuilder,
  SignBuilder,
  SkeletalRemainsBuilder,
  StackableBuilder,
  StomachContentsBuilder,
  SustainBuilder,
  VendableBuilder,
  WeaponBuilder,
  WeaponPrototypesBuilder,
  WearableBuilder,
  WirelessPhoneBuilder,
  WoundBuilder,
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
  private guardedExitBuilder: GuardedExitBuilder;
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
  private sustainBuilder: SustainBuilder;
  private drinkBuilder: DrinkBuilder;
  private bottledWaterBuilder: BottledWaterBuilder;
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
  private dollarBuilder: DollarBuilder;
  private sealedBoxBuilder: SealedBoxBuilder;
  private vendableBuilder: VendableBuilder;
  private elevatorBuilder: ElevatorBuilder;
  private doorBuilder: DoorBuilder;
  private signBuilder: SignBuilder;
  private lockBuilder: LockBuilder;
  private biometricLockBuilder: BiometricLockBuilder;
  private rentableLockBuilder: RentableLockBuilder;
  private phoneBuilder: PhoneBuilder;
  private wirelessPhoneBuilder: WirelessPhoneBuilder;
  private payphoneBuilder: PayphoneBuilder;
  private phoneDbBuilder: PhoneDbBuilder;
  private disposalBuilder: DisposalBuilder;
  private incineratorBuilder: IncineratorBuilder;
  private factionBuilder: FactionBuilder;
  private cloneTankBuilder: CloneTankBuilder;
  private cloneRecordingStudioBuilder: CloneRecordingStudioBuilder;
  private pocketBuilder: PocketBuilder;
  private cashBuilder: CashBuilder;
  private weaponBuilder: WeaponBuilder;
  private weaponPrototypesBuilder: WeaponPrototypesBuilder;
  private ammoBuilder: AmmoBuilder;
  private ammoPrototypesBuilder: AmmoPrototypesBuilder;
  private magazineBuilder: MagazineBuilder;
  private magazinePrototypesBuilder: MagazinePrototypesBuilder;

  constructor(private manager: ObjectManager) {
    this.describableBuilder = new DescribableBuilder(manager);

    this.locationBuilder = new LocationBuilder(manager);

    this.exitBuilder = new ExitBuilder(manager);
    this.guardedExitBuilder = new GuardedExitBuilder(manager);
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
    this.sustainBuilder = new SustainBuilder(manager);
    this.drinkBuilder = new DrinkBuilder(manager);
    this.bottledWaterBuilder = new BottledWaterBuilder(manager);
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
    this.dollarBuilder = new DollarBuilder(manager);
    this.sealedBoxBuilder = new SealedBoxBuilder(manager);
    this.vendableBuilder = new VendableBuilder(manager);
    this.elevatorBuilder = new ElevatorBuilder(manager);
    this.doorBuilder = new DoorBuilder(manager);
    this.signBuilder = new SignBuilder(manager);
    this.lockBuilder = new LockBuilder(manager);
    this.biometricLockBuilder = new BiometricLockBuilder(manager);
    this.rentableLockBuilder = new RentableLockBuilder(manager);
    this.phoneBuilder = new PhoneBuilder(manager);
    this.wirelessPhoneBuilder = new WirelessPhoneBuilder(manager);
    this.payphoneBuilder = new PayphoneBuilder(manager);
    this.phoneDbBuilder = new PhoneDbBuilder(manager);
    this.disposalBuilder = new DisposalBuilder(manager);
    this.incineratorBuilder = new IncineratorBuilder(manager);
    this.factionBuilder = new FactionBuilder(manager);
    this.cloneTankBuilder = new CloneTankBuilder(manager);
    this.cloneRecordingStudioBuilder = new CloneRecordingStudioBuilder(manager);
    this.pocketBuilder = new PocketBuilder(manager);
    this.cashBuilder = new CashBuilder(manager);
    this.weaponBuilder = new WeaponBuilder(manager);
    this.weaponPrototypesBuilder = new WeaponPrototypesBuilder(manager);
    this.ammoBuilder = new AmmoBuilder(manager);
    this.ammoPrototypesBuilder = new AmmoPrototypesBuilder(manager);
    this.magazineBuilder = new MagazineBuilder(manager);
    this.magazinePrototypesBuilder = new MagazinePrototypesBuilder(manager);
  }

  /**
   * Build all prototype objects
   * Idempotent - checks for existing aliases before creating
   */
  async buildPrototypes(): Promise<void> {
    // Check if prototypes already exist via aliases
    const objectManager = await this.manager.load(0);
    if (!objectManager)
      throw new Error('Root object not found - run minimal bootstrap first');
    const aliases =
      (objectManager.get('aliases') as Record<
        string,
        number | Record<string, number>
      >) || {};

    // Create prototypes (or get existing ones)
    const describable = aliases.describable
      ? await this.manager.load(aliases.describable as number)
      : await this.describableBuilder.build(1);

    const location = aliases.location
      ? await this.manager.load(aliases.location as number)
      : await this.locationBuilder.build(describable?.id);

    // Exit inherits from Describable (has name, aliases)
    const exit = aliases.exit
      ? await this.manager.load(aliases.exit as number)
      : await this.exitBuilder.build(describable?.id);

    // GuardedExit - faction-restricted exit (inherits from Exit)
    const guardedExit = aliases.guardedExit
      ? await this.manager.load(aliases.guardedExit as number)
      : await this.guardedExitBuilder.build(exit?.id);

    const room = aliases.room
      ? await this.manager.load(aliases.room as number)
      : await this.roomBuilder.build(location?.id);

    const agent = aliases.agent
      ? await this.manager.load(aliases.agent as number)
      : await this.agentBuilder.build(describable?.id);

    const embodied = aliases.embodied
      ? await this.manager.load(aliases.embodied as number)
      : await this.embodiedBuilder.build(agent?.id);

    const human = aliases.human
      ? await this.manager.load(aliases.human as number)
      : await this.humanBuilder.build(embodied?.id);

    const player = aliases.player
      ? await this.manager.load(aliases.player as number)
      : await this.playerBuilder.build(human?.id);

    // Admin inherits from Player
    const admin = aliases.admin
      ? await this.manager.load(aliases.admin as number)
      : await this.adminBuilder.build(player?.id);

    // Decayable - base for anything that decays over time
    const decayable = aliases.decayable
      ? await this.manager.load(aliases.decayable as number)
      : await this.decayableBuilder.build(describable?.id);

    // Corpse inherits from Decayable (dead bodies decay)
    const corpse = aliases.corpse
      ? await this.manager.load(aliases.corpse as number)
      : await this.corpseBuilder.build(decayable?.id);

    // HumanRemains inherits from Describable (dried remains, very slow decay)
    const humanRemains = aliases.humanRemains
      ? await this.manager.load(aliases.humanRemains as number)
      : await this.humanRemainsBuilder.build(describable?.id);

    // SkeletalRemains inherits from Describable (permanent bones)
    const skeletalRemains = aliases.skeletalRemains
      ? await this.manager.load(aliases.skeletalRemains as number)
      : await this.skeletalRemainsBuilder.build(describable?.id);

    // Wound inherits from Describable (wounds are objects on body parts)
    const wound = aliases.wound
      ? await this.manager.load(aliases.wound as number)
      : await this.woundBuilder.build(describable?.id);

    // Edible inherits from Decayable (food/drink decay)
    const edible = aliases.edible
      ? await this.manager.load(aliases.edible as number)
      : await this.edibleBuilder.build(decayable?.id);

    const food = aliases.food
      ? await this.manager.load(aliases.food as number)
      : await this.foodBuilder.build(edible?.id);

    const sustain = aliases.sustain
      ? await this.manager.load(aliases.sustain as number)
      : await this.sustainBuilder.build(food?.id);

    const drink = aliases.drink
      ? await this.manager.load(aliases.drink as number)
      : await this.drinkBuilder.build(edible?.id);

    const bottledWater = aliases.bottledWater
      ? await this.manager.load(aliases.bottledWater as number)
      : await this.bottledWaterBuilder.build(drink?.id);

    // BodyPart inherits from Edible (severed parts can be eaten, decay over time)
    const bodyPart = aliases.bodyPart
      ? await this.manager.load(aliases.bodyPart as number)
      : await this.bodyPartBuilder.build(edible?.id);

    // Build specialized body parts (inherit from BodyPart)
    // Store under bodyParts.* namespace in aliases
    let bodyParts = (aliases.bodyParts as Record<string, number>) || {};
    const needsBodyParts = !bodyParts.torso; // Check if any specialized parts exist

    if (needsBodyParts) {
      const builtParts = await this.bodyPartsBuilder.buildAll(bodyPart?.id);
      bodyParts = {};
      for (const [name, part] of Object.entries(builtParts)) {
        bodyParts[name] = part.id;
      }
    }

    // Wearable - base for clothing, armor, jewelry (inherits from Describable)
    const wearable = aliases.wearable
      ? await this.manager.load(aliases.wearable as number)
      : await this.wearableBuilder.build(describable?.id);

    // Clothing - wearable items that provide warmth (inherits from Wearable)
    const clothing = aliases.clothing
      ? await this.manager.load(aliases.clothing as number)
      : await this.clothingBuilder.build(wearable?.id);

    // Locker - lockable containers with codes (inherits from Location)
    const locker = aliases.locker
      ? await this.manager.load(aliases.locker as number)
      : await this.lockerBuilder.build(location?.id);

    // OneTimeLocker - courier-friendly lockers (inherits from Locker)
    const oneTimeLocker = aliases.oneTimeLocker
      ? await this.manager.load(aliases.oneTimeLocker as number)
      : await this.oneTimeLockerBuilder.build(locker?.id);

    // Bank - electronic currency ledger (inherits from Root)
    const bank = aliases.bank
      ? await this.manager.load(aliases.bank as number)
      : await this.bankBuilder.build(1);

    // BankTerminal - player-facing banking kiosk (inherits from Describable)
    const bankTerminal = aliases.bankTerminal
      ? await this.manager.load(aliases.bankTerminal as number)
      : await this.bankTerminalBuilder.build(describable?.id);

    // Stackable - physical commodities (inherits from Describable)
    const stackable = aliases.stackable
      ? await this.manager.load(aliases.stackable as number)
      : await this.stackableBuilder.build(describable?.id);

    // Dollar - physical US currency, contraband (inherits from Stackable)
    const dollar = aliases.dollar
      ? await this.manager.load(aliases.dollar as number)
      : await this.dollarBuilder.build(stackable?.id);

    // StomachContents - digesting food in stomach (inherits from Stackable)
    const stomachContents = aliases.stomachContents
      ? await this.manager.load(aliases.stomachContents as number)
      : await this.stomachContentsBuilder.build(stackable?.id);

    // Weapon - base for all weapons (inherits from Describable)
    const weapon = aliases.weapon
      ? await this.manager.load(aliases.weapon as number)
      : await this.weaponBuilder.build(describable?.id);

    // Build weapon sub-prototypes (inherit from weapon)
    // Store under weapons.* namespace in aliases
    let weapons = (aliases.weapons as Record<string, number>) || {};
    const needsWeapons = !weapons.blade; // Check if any weapon prototypes exist

    if (needsWeapons) {
      const builtWeapons = await this.weaponPrototypesBuilder.buildAll(
        weapon?.id,
      );
      weapons = {};
      for (const [name, weaponObj] of Object.entries(builtWeapons)) {
        weapons[name] = weaponObj.id;
      }
    }

    // Ammo - base for all ammunition (inherits from Stackable)
    const ammo = aliases.ammo
      ? await this.manager.load(aliases.ammo as number)
      : await this.ammoBuilder.build(stackable?.id);

    // Build ammo sub-prototypes (inherit from ammo)
    // Store under ammoTypes.* namespace in aliases
    let ammoTypes = (aliases.ammoTypes as Record<string, number>) || {};
    const needsAmmo = !ammoTypes.ammo9mm; // Check if any ammo prototypes exist

    if (needsAmmo) {
      const builtAmmo = await this.ammoPrototypesBuilder.buildAll(ammo?.id);
      ammoTypes = {};
      for (const [name, ammoObj] of Object.entries(builtAmmo)) {
        ammoTypes[name] = ammoObj.id;
      }
    }

    // Magazine - base for all magazines (inherits from Describable)
    const magazine = aliases.magazine
      ? await this.manager.load(aliases.magazine as number)
      : await this.magazineBuilder.build(describable?.id);

    // Build magazine sub-prototypes (inherit from magazine)
    // Store under magazines.* namespace in aliases
    let magazines = (aliases.magazines as Record<string, number>) || {};
    const needsMagazines = !magazines.pistolMagazine; // Check if any magazine prototypes exist

    if (needsMagazines) {
      const builtMagazines = await this.magazinePrototypesBuilder.buildAll(
        magazine?.id,
      );
      magazines = {};
      for (const [name, magazineObj] of Object.entries(builtMagazines)) {
        magazines[name] = magazineObj.id;
      }
    }

    // SealedBox - tamper-proof delivery containers (inherits from Describable)
    const sealedBox = aliases.sealedBox
      ? await this.manager.load(aliases.sealedBox as number)
      : await this.sealedBoxBuilder.build(describable?.id);

    const vendable = aliases.vendable
      ? await this.manager.load(aliases.vendable as number)
      : await this.vendableBuilder.build(location?.id);

    // Elevator - vertical transport system (inherits from Room for addExit)
    const elevator = aliases.elevator
      ? await this.manager.load(aliases.elevator as number)
      : await this.elevatorBuilder.build(room?.id);

    // Door - shared bidirectional access object (inherits from Describable)
    const door = aliases.door
      ? await this.manager.load(aliases.door as number)
      : await this.doorBuilder.build(describable?.id);

    // Sign - readable, bolted-down object (inherits from Describable)
    const sign = aliases.sign
      ? await this.manager.load(aliases.sign as number)
      : await this.signBuilder.build(describable?.id);

    // Phones
    const phone = aliases.phone
      ? await this.manager.load(aliases.phone as number)
      : await this.phoneBuilder.build(describable?.id);

    const wirelessPhone = aliases.wirelessPhone
      ? await this.manager.load(aliases.wirelessPhone as number)
      : await this.wirelessPhoneBuilder.build(phone?.id);

    const payphone = aliases.payphone
      ? await this.manager.load(aliases.payphone as number)
      : await this.payphoneBuilder.build(phone?.id);

    const phoneDb = aliases.phoneDb
      ? await this.manager.load(aliases.phoneDb as number)
      : await this.phoneDbBuilder.build(describable?.id);

    // Lock - base access control (inherits from Describable)
    const lock = aliases.lock
      ? await this.manager.load(aliases.lock as number)
      : await this.lockBuilder.build(describable?.id);

    // BiometricLock - body-scanning access control (inherits from Lock)
    const biometricLock = aliases.biometricLock
      ? await this.manager.load(aliases.biometricLock as number)
      : await this.biometricLockBuilder.build(lock?.id);

    const rentableLock = aliases.rentableLock
      ? await this.manager.load(aliases.rentableLock as number)
      : await this.rentableLockBuilder.build(lock?.id);

    // Disposal - base class for item destruction (inherits from Describable)
    const disposal = aliases.disposal
      ? await this.manager.load(aliases.disposal as number)
      : await this.disposalBuilder.build(describable?.id);

    // Incinerator - burns items (inherits from Disposal)
    const incinerator = aliases.incinerator
      ? await this.manager.load(aliases.incinerator as number)
      : await this.incineratorBuilder.build(disposal?.id);

    // Faction - manages faction memberships and relationships (inherits from Root)
    const faction = aliases.faction
      ? await this.manager.load(aliases.faction as number)
      : await this.factionBuilder.build(1);

    // CloneTank - stores clone backup data and handles resurrection (inherits from Describable)
    const cloneTank = aliases.cloneTank
      ? await this.manager.load(aliases.cloneTank as number)
      : await this.cloneTankBuilder.build(describable?.id);

    // CloneRecordingStudio - captures body data for backup (inherits from Describable)
    const cloneRecordingStudio = aliases.cloneRecordingStudio
      ? await this.manager.load(aliases.cloneRecordingStudio as number)
      : await this.cloneRecordingStudioBuilder.build(describable?.id);

    // Pocket - container for pockets in clothing (inherits from Describable)
    const pocket = aliases.pocket
      ? await this.manager.load(aliases.pocket as number)
      : await this.pocketBuilder.build(describable?.id);

    // Cash - utility object for cash operations (inherits from Root)
    const cash = aliases.cash
      ? await this.manager.load(aliases.cash as number)
      : await this.cashBuilder.build();

    // Register aliases in root.properties.aliases
    await this.registerAliases({
      describable: describable?.id,
      location: location?.id,
      exit: exit?.id,
      guardedExit: guardedExit?.id,
      room: room?.id,
      agent: agent?.id,
      embodied: embodied?.id,
      human: human?.id,
      player: player?.id,
      admin: admin?.id,
      decayable: decayable?.id,
      corpse: corpse?.id,
      humanRemains: humanRemains?.id,
      skeletalRemains: skeletalRemains?.id,
      wound: wound?.id,
      edible: edible?.id,
      food: food?.id,
      sustain: sustain?.id,
      drink: drink?.id,
      bottledWater: bottledWater?.id,
      stomachContents: stomachContents?.id,
      bodyPart: bodyPart?.id,
      bodyParts,
      wearable: wearable?.id,
      clothing: clothing?.id,
      locker: locker?.id,
      oneTimeLocker: oneTimeLocker?.id,
      bank: bank?.id,
      bankTerminal: bankTerminal?.id,
      stackable: stackable?.id,
      dollar: dollar?.id,
      weapon: weapon?.id,
      weapons,
      ammo: ammo?.id,
      ammoTypes,
      magazine: magazine?.id,
      magazines,
      sealedBox: sealedBox?.id,
      vendable: vendable?.id,
      elevator: elevator?.id,
      door: door?.id,
      sign: sign?.id,
      phone: phone?.id,
      wirelessPhone: wirelessPhone?.id,
      payphone: payphone?.id,
      phoneDb: phoneDb?.id,
      lock: lock?.id,
      biometricLock: biometricLock?.id,
      rentableLock: rentableLock?.id,
      disposal: disposal?.id,
      incinerator: incinerator?.id,
      faction: faction?.id,
      cloneTank: cloneTank?.id,
      cloneRecordingStudio: cloneRecordingStudio?.id,
      pocket: pocket?.id,
      cash: cash?.id,
    });
  }

  private async registerAliases(ids: {
    describable: number;

    location: number;
    exit: number;
    guardedExit: number;
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
    sustain: number;
    drink: number;
    bottledWater: number;
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
    dollar: number;
    weapon: number;
    weapons: Record<string, number>;
    ammo: number;
    ammoTypes: Record<string, number>;
    magazine: number;
    magazines: Record<string, number>;
    sealedBox: number;
    vendable: number;
    elevator: number;
    door: number;
    sign: number;
    phone: number;
    wirelessPhone: number;
    payphone: number;
    phoneDb: number;
    lock: number;
    biometricLock: number;
    rentableLock: number;
    disposal: number;
    incinerator: number;
    faction: number;
    cloneTank: number;
    cloneRecordingStudio: number;
    pocket: number;
    cash: number;
  }): Promise<void> {
    const objectManager = await this.manager.load(0);
    if (!objectManager) return;

    const aliases =
      (objectManager.get('aliases') as Record<
        string,
        number | Record<string, number>
      >) || {};

    // Register all prototype aliases directly in #0.properties.aliases
    // (do not depend on #0 having an `addAlias` method)
    aliases.describable = ids.describable;
    aliases.location = ids.location;
    aliases.exit = ids.exit;
    aliases.guardedExit = ids.guardedExit;
    aliases.room = ids.room;
    aliases.agent = ids.agent;
    aliases.embodied = ids.embodied;
    aliases.human = ids.human;
    aliases.player = ids.player;
    aliases.admin = ids.admin;
    aliases.decayable = ids.decayable;
    aliases.corpse = ids.corpse;
    aliases.humanRemains = ids.humanRemains;
    aliases.skeletalRemains = ids.skeletalRemains;
    aliases.wound = ids.wound;
    aliases.edible = ids.edible;
    aliases.food = ids.food;
    aliases.sustain = ids.sustain;
    aliases.drink = ids.drink;
    aliases.bottledWater = ids.bottledWater;
    aliases.stomachContents = ids.stomachContents;
    aliases.bodyPart = ids.bodyPart;
    aliases.wearable = ids.wearable;
    aliases.clothing = ids.clothing;
    aliases.locker = ids.locker;
    aliases.oneTimeLocker = ids.oneTimeLocker;
    aliases.bank = ids.bank;
    aliases.bankTerminal = ids.bankTerminal;
    aliases.stackable = ids.stackable;
    aliases.dollar = ids.dollar;
    aliases.sealedBox = ids.sealedBox;
    aliases.vendable = ids.vendable;
    aliases.elevator = ids.elevator;
    aliases.door = ids.door;
    aliases.sign = ids.sign;
    aliases.phone = ids.phone;
    aliases.wirelessPhone = ids.wirelessPhone;
    aliases.payphone = ids.payphone;
    aliases.phoneDb = ids.phoneDb;
    aliases.lock = ids.lock;
    aliases.biometricLock = ids.biometricLock;
    aliases.rentableLock = ids.rentableLock;
    aliases.disposal = ids.disposal;
    aliases.incinerator = ids.incinerator;
    aliases.faction = ids.faction;
    aliases.cloneTank = ids.cloneTank;
    aliases.cloneRecordingStudio = ids.cloneRecordingStudio;
    aliases.pocket = ids.pocket;
    aliases.cash = ids.cash;

    // Store bodyParts object directly (not a runtime alias, used as a namespace)
    aliases.bodyParts = ids.bodyParts;

    // Also expose individual body part prototypes at top-level for BodyFactory
    for (const [name, id] of Object.entries(ids.bodyParts)) {
      aliases[name] = id;
    }

    // Store weapons object directly (namespace for weapon prototypes)
    aliases.weapons = ids.weapons;

    // Also expose individual weapon prototypes at top-level
    for (const [name, id] of Object.entries(ids.weapons)) {
      aliases[name] = id;
    }

    // Store ammo base and ammoTypes namespace
    aliases.ammo = ids.ammo;
    aliases.ammoTypes = ids.ammoTypes;

    // Also expose individual ammo prototypes at top-level
    for (const [name, id] of Object.entries(ids.ammoTypes)) {
      aliases[name] = id;
    }

    // Store magazine base and magazines namespace
    aliases.magazine = ids.magazine;
    aliases.magazines = ids.magazines;

    // Also expose individual magazine prototypes at top-level
    for (const [name, id] of Object.entries(ids.magazines)) {
      aliases[name] = id;
    }

    objectManager.set('aliases', aliases);

    const partNames = Object.keys(ids.bodyParts).join(', ');
    const weaponNames = Object.keys(ids.weapons).join(', ');
    const ammoNames = Object.keys(ids.ammoTypes).join(', ');
    const magazineNames = Object.keys(ids.magazines).join(', ');
    console.log(
      `✅ Registered prototype aliases: describable=#${ids.describable}, location=#${ids.location}, exit=#${ids.exit}, room=#${ids.room}, agent=#${ids.agent}, embodied=#${ids.embodied}, human=#${ids.human}, player=#${ids.player}, admin=#${ids.admin}, decayable=#${ids.decayable}, bodyPart=#${ids.bodyPart}, wearable=#${ids.wearable}, clothing=#${ids.clothing}, locker=#${ids.locker}, oneTimeLocker=#${ids.oneTimeLocker}`,
    );
    console.log(`✅ Registered body part prototypes: ${partNames}`);
    console.log(`✅ Registered weapon prototypes: ${weaponNames}`);
    console.log(`✅ Registered ammo prototypes: ${ammoNames}`);
    console.log(`✅ Registered magazine prototypes: ${magazineNames}`);
  }

  /**
   * Rebuild methods on existing prototypes
   * Called when FORCE_BOOTSTRAP=true to update methods without recreating objects
   */
  async rebuildMethods(): Promise<void> {
    const objectManager = await this.manager.load(0);
    if (!objectManager) throw new Error('Root object not found');
    const aliases =
      (objectManager.get('aliases') as Record<
        string,
        number | Record<string, number>
      >) || {};

    // Rebuild Room methods
    if (aliases.room) {
      const room = await this.manager.load(aliases.room as number);
      if (room) {
        console.log('  Rebuilding Room methods...');
        await this.roomBuilder.build(0, room); // 0 is unused when existingObj provided
      }
    }

    // Rebuild Human methods
    if (aliases.human) {
      const human = await this.manager.load(aliases.human as number);
      if (human) {
        console.log('  Rebuilding Human methods...');
        await this.humanBuilder.build(0, human);
      }
    }

    // Rebuild Player methods
    if (aliases.player) {
      const player = await this.manager.load(aliases.player as number);
      if (player) {
        console.log('  Rebuilding Player methods...');
        await this.playerBuilder.build(0, player);
      }
    }

    // Rebuild Agent methods
    if (aliases.agent) {
      const agent = await this.manager.load(aliases.agent as number);
      if (agent) {
        console.log('  Rebuilding Agent methods...');
        await this.agentBuilder.build(0, agent);
      }
    }

    // Rebuild Embodied methods
    if (aliases.embodied) {
      const embodied = await this.manager.load(aliases.embodied as number);
      if (embodied) {
        console.log('  Rebuilding Embodied methods...');
        await this.embodiedBuilder.build(0, embodied);
      }
    }

    // Rebuild Location methods
    if (aliases.location) {
      const location = await this.manager.load(aliases.location as number);
      if (location) {
        console.log('  Rebuilding Location methods...');
        await this.locationBuilder.build(0, location);
      }
    }

    // Rebuild Describable methods
    if (aliases.describable) {
      const describable = await this.manager.load(
        aliases.describable as number,
      );
      if (describable) {
        console.log('  Rebuilding Describable methods...');
        await this.describableBuilder.build(0, describable);
      }
    }

    // Rebuild BodyPart methods
    if (aliases.bodyPart) {
      const bodyPart = await this.manager.load(aliases.bodyPart as number);
      if (bodyPart) {
        console.log('  Rebuilding BodyPart methods...');
        await this.bodyPartBuilder.build(0, bodyPart);
      }
    }

    console.log('  ✅ Prototype methods rebuilt');
  }
}
