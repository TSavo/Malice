import type { RuntimeObject } from '../../../../types/object.js';
import type { ObjectManager } from '../../object-manager.js';

// Import all weapon builders
import {
  AxeBuilder,
  BladeBuilder,
  BoxCutterBuilder,
  ButterflyKnifeBuilder,
  CleaverBuilder,
  CombatKnifeBuilder,
  CutlassBuilder,
  FireAxeBuilder,
  HatchetBuilder,
  KatanaBuilder,
  KnifeBuilder,
  KukriBuilder,
  LongswordBuilder,
  MacheteBuilder,
  NinjatōBuilder,
  PocketKnifeBuilder,
  RapierBuilder,
  ShivBuilder,
  ShortswordBuilder,
  StilettoBuilder,
  SwitchbladeBuilder,
  SwordBuilder,
  TantoBuilder,
  TomahawkBuilder,
  WakizashiBuilder,
} from './bladed-weapon-builders.js';

import {
  BallPeenHammerBuilder,
  BaseballBatBuilder,
  BatonBuilder,
  BikeChainBuilder,
  BlackjackBuilder,
  BluntBuilder,
  BoStaffBuilder,
  BrassKnucklesBuilder,
  ChainBuilder,
  ClawHammerBuilder,
  ClubBuilder,
  CrowbarBuilder,
  FlailBuilder,
  HammerBuilder,
  LeadPipeBuilder,
  MaceBuilder,
  MalletBuilder,
  MetalPipeBuilder,
  MorningstarBuilder,
  NightstickBuilder,
  NunchakuBuilder,
  PipeBuilder,
  PoolCueBuilder,
  PushDaggerBuilder,
  SapGlovesBuilder,
  SledgehammerBuilder,
  StaffBuilder,
  TireIronBuilder,
  TonfaBuilder,
  WalkingStickBuilder,
} from './blunt-weapon-builders.js';

import {
  BoltActionRifleBuilder,
  CoachGunBuilder,
  CompactPistolBuilder,
  DerringerBuilder,
  DoubleBarrelBuilder,
  GunBuilder,
  HuntingRifleBuilder,
  LeverActionRifleBuilder,
  M1911Builder,
  Mac10Builder,
  MachinePistolBuilder,
  MagnumBuilder,
  PistolBuilder,
  PumpShotgunBuilder,
  RevolverBuilder,
  Rifle22Builder,
  RifleBuilder,
  SawnOffShotgunBuilder,
  SemiAutoPistolBuilder,
  ShotgunBuilder,
  SmgBuilder,
  TecBuilder,
  UziBuilder,
} from './firearm-builders.js';

import {
  AwlBuilder,
  BeerBottleBuilder,
  BottleBuilder,
  BrickBuilder,
  BrokenBottleBuilder,
  ButcherKnifeBuilder,
  CattleProdBuilder,
  CinderBlockBuilder,
  CricketBatBuilder,
  DartBuilder,
  GarroteBuilder,
  GolfClubBuilder,
  HammerImprovisedBuilder,
  HockeyStickBuilder,
  IcepickBuilder,
  ImprovisedBuilder,
  KitchenKnifeBuilder,
  LacrosseStickBuilder,
  PepperSprayBuilder,
  PrybarBuilder,
  RockBuilder,
  RollingPinBuilder,
  ScrewdriverBuilder,
  SkilletBuilder,
  StunGunBuilder,
  TaserBuilder,
  ThrowingKnifeBuilder,
  ThrowingStarBuilder,
  WhipBuilder,
  WrenchBuilder,
} from './improvised-weapon-builders.js';

/**
 * Builds all weapon sub-prototypes
 *
 * This creates a hierarchy of weapon prototypes under $.weapon:
 *
 * $.weapon (base)
 *   $.blade (all bladed weapons)
 *     $.knife, $.combatKnife, $.pocketKnife, etc.
 *     $.katana, $.wakizashi, $.tanto, etc.
 *     $.machete, $.cleaver, $.kukri
 *     $.sword, $.longsword, $.rapier, etc.
 *     $.axe, $.hatchet, $.fireAxe, etc.
 *   $.blunt (all blunt weapons)
 *     $.club, $.baseballBat, $.baton, etc.
 *     $.pipe, $.leadPipe, $.crowbar, etc.
 *     $.hammer, $.sledgehammer, etc.
 *     $.staff, $.boStaff, $.poolCue, etc.
 *     $.mace, $.morningstar
 *     $.brassKnuckles, $.sapGloves
 *     $.chain, $.nunchaku, $.flail
 *   $.gun (all firearms)
 *     $.pistol, $.revolver, $.magnum, etc.
 *     $.rifle, $.boltActionRifle, etc.
 *     $.shotgun, $.pumpShotgun, etc.
 *     $.smg, $.uzi, $.mac10, etc.
 *   $.improvised (improvised weapons)
 *     $.bottle, $.brokenBottle, etc.
 *     $.brick, $.rock, $.cinderBlock
 *     $.screwdriver, $.icepick, etc.
 *     $.kitchenKnife, $.skillet, etc.
 *     $.throwingKnife, $.throwingStar, etc.
 *     $.garrote, $.whip, $.taser, etc.
 *     $.golfClub, $.hockeyStick, etc.
 */
export class WeaponPrototypesBuilder {
  static readonly aliases = [
    // Bladed
    'blade', 'knife', 'pocketKnife', 'combatKnife', 'switchblade', 'boxCutter',
    'butterflyKnife', 'stiletto', 'shiv', 'machete', 'cleaver', 'kukri',
    'katana', 'wakizashi', 'tanto', 'ninjato', 'sword', 'longsword', 'shortsword',
    'rapier', 'cutlass', 'axe', 'hatchet', 'fireAxe', 'tomahawk',
    // Blunt
    'blunt', 'club', 'baseballBat', 'baton', 'nightstick', 'tonfa', 'blackjack',
    'tireIron', 'pipe', 'leadPipe', 'metalPipe', 'crowbar', 'hammer', 'clawHammer',
    'sledgehammer', 'ballPeenHammer', 'mallet', 'staff', 'boStaff', 'walkingStick',
    'poolCue', 'mace', 'morningstar', 'brassKnuckles', 'sapGloves', 'pushDagger',
    'chain', 'bikeChain', 'nunchaku', 'flail',
    // Firearms
    'gun', 'pistol', 'revolver', 'magnum', 'semiAutoPistol', 'compactPistol',
    'derringer', 'm1911', 'rifle', 'boltActionRifle', 'leverActionRifle',
    'huntingRifle', 'rifle22', 'shotgun', 'pumpShotgun', 'sawnOffShotgun',
    'doubleBarrel', 'coachGun', 'smg', 'machinePistol', 'uzi', 'mac10', 'tec9',
    // Improvised
    'improvised', 'bottle', 'brokenBottle', 'beerBottle', 'brick', 'rock',
    'cinderBlock', 'screwdriver', 'icepick', 'awl', 'wrench', 'prybar',
    'hammerImprovised', 'kitchenKnife', 'butcherKnife', 'skillet', 'rollingPin',
    'throwingKnife', 'throwingStar', 'dart', 'garrote', 'whip', 'cattleProd',
    'stunGun', 'taser', 'pepperSpray', 'golfClub', 'hockeyStick', 'lacrosseStick',
    'cricketBat',
  ] as const;
  static readonly parent = 'weapon';

  constructor(private manager: ObjectManager) {}

  /**
   * Build all weapon sub-prototypes
   * @param weaponId - ID of the base $.weapon prototype
   * @returns Record of weapon name -> RuntimeObject
   */
  async buildAll(weaponId: number): Promise<Record<string, RuntimeObject>> {
    const weapons: Record<string, RuntimeObject> = {};

    // ═══════════════════════════════════════════════════════════════════════
    // BLADED WEAPONS
    // ═══════════════════════════════════════════════════════════════════════

    // Base blade (inherits from weapon)
    const blade = await new BladeBuilder(this.manager).build(weaponId);
    weapons.blade = blade;

    // Knives (inherit from blade)
    const knife = await new KnifeBuilder(this.manager).build(blade.id);
    weapons.knife = knife;
    weapons.pocketKnife = await new PocketKnifeBuilder(this.manager).build(
      knife.id,
    );
    weapons.combatKnife = await new CombatKnifeBuilder(this.manager).build(
      knife.id,
    );
    weapons.switchblade = await new SwitchbladeBuilder(this.manager).build(
      knife.id,
    );
    weapons.boxCutter = await new BoxCutterBuilder(this.manager).build(
      knife.id,
    );
    weapons.butterflyKnife = await new ButterflyKnifeBuilder(
      this.manager,
    ).build(knife.id);
    weapons.stiletto = await new StilettoBuilder(this.manager).build(knife.id);
    weapons.shiv = await new ShivBuilder(this.manager).build(knife.id);

    // Machetes (inherit from blade)
    const machete = await new MacheteBuilder(this.manager).build(blade.id);
    weapons.machete = machete;
    weapons.cleaver = await new CleaverBuilder(this.manager).build(machete.id);
    weapons.kukri = await new KukriBuilder(this.manager).build(machete.id);

    // Japanese swords (inherit from blade)
    const katana = await new KatanaBuilder(this.manager).build(blade.id);
    weapons.katana = katana;
    weapons.wakizashi = await new WakizashiBuilder(this.manager).build(
      katana.id,
    );
    weapons.tanto = await new TantoBuilder(this.manager).build(katana.id);
    weapons.ninjato = await new NinjatōBuilder(this.manager).build(katana.id);

    // Western swords (inherit from blade)
    const sword = await new SwordBuilder(this.manager).build(blade.id);
    weapons.sword = sword;
    weapons.longsword = await new LongswordBuilder(this.manager).build(
      sword.id,
    );
    weapons.shortsword = await new ShortswordBuilder(this.manager).build(
      sword.id,
    );
    weapons.rapier = await new RapierBuilder(this.manager).build(sword.id);
    weapons.cutlass = await new CutlassBuilder(this.manager).build(sword.id);

    // Axes (inherit from blade)
    const axe = await new AxeBuilder(this.manager).build(blade.id);
    weapons.axe = axe;
    weapons.hatchet = await new HatchetBuilder(this.manager).build(axe.id);
    weapons.fireAxe = await new FireAxeBuilder(this.manager).build(axe.id);
    weapons.tomahawk = await new TomahawkBuilder(this.manager).build(axe.id);

    // ═══════════════════════════════════════════════════════════════════════
    // BLUNT WEAPONS
    // ═══════════════════════════════════════════════════════════════════════

    // Base blunt (inherits from weapon)
    const blunt = await new BluntBuilder(this.manager).build(weaponId);
    weapons.blunt = blunt;

    // Clubs (inherit from blunt)
    const club = await new ClubBuilder(this.manager).build(blunt.id);
    weapons.club = club;
    weapons.baseballBat = await new BaseballBatBuilder(this.manager).build(
      club.id,
    );
    weapons.baton = await new BatonBuilder(this.manager).build(club.id);
    weapons.nightstick = await new NightstickBuilder(this.manager).build(
      club.id,
    );
    weapons.tonfa = await new TonfaBuilder(this.manager).build(club.id);
    weapons.blackjack = await new BlackjackBuilder(this.manager).build(club.id);
    weapons.tireIron = await new TireIronBuilder(this.manager).build(club.id);

    // Pipes (inherit from blunt)
    const pipe = await new PipeBuilder(this.manager).build(blunt.id);
    weapons.pipe = pipe;
    weapons.leadPipe = await new LeadPipeBuilder(this.manager).build(pipe.id);
    weapons.metalPipe = await new MetalPipeBuilder(this.manager).build(pipe.id);
    weapons.crowbar = await new CrowbarBuilder(this.manager).build(pipe.id);

    // Hammers (inherit from blunt)
    const hammer = await new HammerBuilder(this.manager).build(blunt.id);
    weapons.hammer = hammer;
    weapons.clawHammer = await new ClawHammerBuilder(this.manager).build(
      hammer.id,
    );
    weapons.sledgehammer = await new SledgehammerBuilder(this.manager).build(
      hammer.id,
    );
    weapons.ballPeenHammer = await new BallPeenHammerBuilder(
      this.manager,
    ).build(hammer.id);
    weapons.mallet = await new MalletBuilder(this.manager).build(hammer.id);

    // Staves (inherit from blunt)
    const staff = await new StaffBuilder(this.manager).build(blunt.id);
    weapons.staff = staff;
    weapons.boStaff = await new BoStaffBuilder(this.manager).build(staff.id);
    weapons.walkingStick = await new WalkingStickBuilder(this.manager).build(
      staff.id,
    );
    weapons.poolCue = await new PoolCueBuilder(this.manager).build(staff.id);

    // Maces (inherit from blunt)
    const mace = await new MaceBuilder(this.manager).build(blunt.id);
    weapons.mace = mace;
    weapons.morningstar = await new MorningstarBuilder(this.manager).build(
      mace.id,
    );

    // Hand weapons (inherit from blunt)
    weapons.brassKnuckles = await new BrassKnucklesBuilder(this.manager).build(
      blunt.id,
    );
    weapons.sapGloves = await new SapGlovesBuilder(this.manager).build(
      blunt.id,
    );
    weapons.pushDagger = await new PushDaggerBuilder(this.manager).build(
      blunt.id,
    );

    // Chains (inherit from blunt)
    const chain = await new ChainBuilder(this.manager).build(blunt.id);
    weapons.chain = chain;
    weapons.bikeChain = await new BikeChainBuilder(this.manager).build(
      chain.id,
    );
    weapons.nunchaku = await new NunchakuBuilder(this.manager).build(chain.id);
    weapons.flail = await new FlailBuilder(this.manager).build(chain.id);

    // ═══════════════════════════════════════════════════════════════════════
    // FIREARMS
    // ═══════════════════════════════════════════════════════════════════════

    // Base gun (inherits from weapon)
    const gun = await new GunBuilder(this.manager).build(weaponId);
    weapons.gun = gun;

    // Pistols (inherit from gun)
    const pistol = await new PistolBuilder(this.manager).build(gun.id);
    weapons.pistol = pistol;
    weapons.revolver = await new RevolverBuilder(this.manager).build(pistol.id);
    weapons.magnum = await new MagnumBuilder(this.manager).build(pistol.id);
    weapons.semiAutoPistol = await new SemiAutoPistolBuilder(
      this.manager,
    ).build(pistol.id);
    weapons.compactPistol = await new CompactPistolBuilder(this.manager).build(
      pistol.id,
    );
    weapons.derringer = await new DerringerBuilder(this.manager).build(
      pistol.id,
    );
    weapons.m1911 = await new M1911Builder(this.manager).build(pistol.id);

    // Rifles (inherit from gun)
    const rifle = await new RifleBuilder(this.manager).build(gun.id);
    weapons.rifle = rifle;
    weapons.boltActionRifle = await new BoltActionRifleBuilder(
      this.manager,
    ).build(rifle.id);
    weapons.leverActionRifle = await new LeverActionRifleBuilder(
      this.manager,
    ).build(rifle.id);
    weapons.huntingRifle = await new HuntingRifleBuilder(this.manager).build(
      rifle.id,
    );
    weapons.rifle22 = await new Rifle22Builder(this.manager).build(rifle.id);

    // Shotguns (inherit from gun)
    const shotgun = await new ShotgunBuilder(this.manager).build(gun.id);
    weapons.shotgun = shotgun;
    weapons.pumpShotgun = await new PumpShotgunBuilder(this.manager).build(
      shotgun.id,
    );
    weapons.sawnOffShotgun = await new SawnOffShotgunBuilder(
      this.manager,
    ).build(shotgun.id);
    weapons.doubleBarrel = await new DoubleBarrelBuilder(this.manager).build(
      shotgun.id,
    );
    weapons.coachGun = await new CoachGunBuilder(this.manager).build(
      shotgun.id,
    );

    // SMGs (inherit from gun)
    const smg = await new SmgBuilder(this.manager).build(gun.id);
    weapons.smg = smg;
    weapons.machinePistol = await new MachinePistolBuilder(this.manager).build(
      smg.id,
    );
    weapons.uzi = await new UziBuilder(this.manager).build(smg.id);
    weapons.mac10 = await new Mac10Builder(this.manager).build(smg.id);
    weapons.tec9 = await new TecBuilder(this.manager).build(smg.id);

    // ═══════════════════════════════════════════════════════════════════════
    // IMPROVISED WEAPONS
    // ═══════════════════════════════════════════════════════════════════════

    // Base improvised (inherits from weapon)
    const improvised = await new ImprovisedBuilder(this.manager).build(
      weaponId,
    );
    weapons.improvised = improvised;

    // Bottles (inherit from improvised)
    const bottle = await new BottleBuilder(this.manager).build(improvised.id);
    weapons.bottle = bottle;
    weapons.brokenBottle = await new BrokenBottleBuilder(this.manager).build(
      bottle.id,
    );
    weapons.beerBottle = await new BeerBottleBuilder(this.manager).build(
      bottle.id,
    );

    // Debris (inherit from improvised)
    weapons.brick = await new BrickBuilder(this.manager).build(improvised.id);
    weapons.rock = await new RockBuilder(this.manager).build(improvised.id);
    weapons.cinderBlock = await new CinderBlockBuilder(this.manager).build(
      improvised.id,
    );

    // Tools (inherit from improvised)
    weapons.screwdriver = await new ScrewdriverBuilder(this.manager).build(
      improvised.id,
    );
    weapons.icepick = await new IcepickBuilder(this.manager).build(
      improvised.id,
    );
    weapons.awl = await new AwlBuilder(this.manager).build(improvised.id);
    weapons.wrench = await new WrenchBuilder(this.manager).build(improvised.id);
    weapons.prybar = await new PrybarBuilder(this.manager).build(improvised.id);
    weapons.hammerImprovised = await new HammerImprovisedBuilder(
      this.manager,
    ).build(improvised.id);

    // Kitchen implements (inherit from improvised)
    weapons.kitchenKnife = await new KitchenKnifeBuilder(this.manager).build(
      improvised.id,
    );
    weapons.butcherKnife = await new ButcherKnifeBuilder(this.manager).build(
      improvised.id,
    );
    weapons.skillet = await new SkilletBuilder(this.manager).build(
      improvised.id,
    );
    weapons.rollingPin = await new RollingPinBuilder(this.manager).build(
      improvised.id,
    );

    // Throwing weapons (inherit from improvised)
    weapons.throwingKnife = await new ThrowingKnifeBuilder(this.manager).build(
      improvised.id,
    );
    weapons.throwingStar = await new ThrowingStarBuilder(this.manager).build(
      improvised.id,
    );
    weapons.dart = await new DartBuilder(this.manager).build(improvised.id);

    // Exotic weapons (inherit from improvised)
    weapons.garrote = await new GarroteBuilder(this.manager).build(
      improvised.id,
    );
    weapons.whip = await new WhipBuilder(this.manager).build(improvised.id);
    weapons.cattleProd = await new CattleProdBuilder(this.manager).build(
      improvised.id,
    );
    weapons.stunGun = await new StunGunBuilder(this.manager).build(
      improvised.id,
    );
    weapons.taser = await new TaserBuilder(this.manager).build(improvised.id);
    weapons.pepperSpray = await new PepperSprayBuilder(this.manager).build(
      improvised.id,
    );

    // Sports equipment (inherit from improvised)
    weapons.golfClub = await new GolfClubBuilder(this.manager).build(
      improvised.id,
    );
    weapons.hockeyStick = await new HockeyStickBuilder(this.manager).build(
      improvised.id,
    );
    weapons.lacrosseStick = await new LacrosseStickBuilder(this.manager).build(
      improvised.id,
    );
    weapons.cricketBat = await new CricketBatBuilder(this.manager).build(
      improvised.id,
    );

    console.log(`✅ Built ${Object.keys(weapons).length} weapon prototypes`);
    return weapons;
  }
}
