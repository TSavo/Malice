import type { RuntimeObject } from '../../../types/object';
import type { ObjectManager } from '../object-manager';
import { type Builder, registerBuilder } from './builder-registry';

/**
 * Adds security locks and furniture to the underground tunnel system.
 *
 * Underground levels:
 * - z=-1: Datacenter (Continuum) + building basements
 * - z=-2: Historic Seattle Underground (public)
 * - z=-3: Vertical shafts (transition)
 * - z=-4: Gray Cartel operational network
 * - z=-5: Sister Gray's domain (Deep Command)
 * - z=-6: The Blind (The Mask's location)
 *
 * Security philosophy:
 * - z=-2 to z=-4 transition: Cartel palm scanners
 * - z=-4 to z=-5 transition: Retinal scanner (high security)
 * - Individual rooms: Appropriate locks for their purpose
 */
export class UndergroundUpgradesBuilder implements Builder {
  static provides: string[] = []; // Creates furniture/locks, not aliased singletons
  static depends = [
    'room',
    'recycler',
    'door',
    'lock',
    'biometricLock',
    'bed',
    'table',
    'chair',
    'cabinet',
    'trunk',
    'crate',
    'locker',
    'bench',
    'couch',
    'safe',
    'sisterGray',
  ];

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const $ = this.manager as any;

    // Check if already built - use a marker room's contents
    const lowerJunction = await this.manager.load(4017);
    if (lowerJunction && lowerJunction.get('contents')?.length > 0) {
      console.log(
        '  ✅ Underground upgrades already applied (Lower Junction has contents)',
      );
      return;
    }

    console.log('  🔐 Upgrading underground with locks and furniture...');

    // Get Sister Gray for verified users
    const sisterGray = await this.manager.load('sisterGray');
    if (!sisterGray) {
      console.log('  ⚠️ Sister Gray not found, skipping underground upgrades');
      return;
    }

    // Add security locks at key access points
    await this.addSecurityLocks($, sisterGray);

    // Add furniture to key rooms
    await this.addFurniture($);

    console.log('  ✅ Underground upgrades complete');
  }

  /**
   * Add security locks at key underground access points
   */
  private async addSecurityLocks(
    $: any,
    sisterGray: RuntimeObject,
  ): Promise<void> {
    // 1. LOWER JUNCTION (#4017) - Entry from historic underground to Cartel territory
    const lowerJunction = await this.manager.load(4017);
    if (lowerJunction) {
      const lock1 = await $.recycler.create($.biometricLock, {
        name: 'Cartel Palm Scanner',
        description:
          'A palm-print scanner mounted beside a heavy gate. The LED pulses slowly red.',
        abilities: `Biometric scanner that reads palm prints. LED glows red when locked, green when access granted.

AUTHORIZATION: Player must be in 'verifiedUsers' array. Members of the Gray Cartel are authorized.

SCANNING: Player must place bare palm against the scanner. Gloves block the scan.

BYPASS: Cannot be picked like a mechanical lock. Can be hacked with appropriate electronics skills.`,
        scanType: 'palm',
        verifiedUsers: [sisterGray.id],
      });

      const gate1 = await $.recycler.create($.door, {
        name: 'Tunnel Gate',
        description:
          'A heavy steel gate blocks the shaft upward. Reinforced bars set in a concrete frame, with a biometric scanner on one side.',
        abilities: `Heavy barred gate on industrial hinges. Passage blocked when 'open' is false or 'locked' is true.

UNLOCKING: Requires authorization from the palm scanner. Cartel members have access.

FORCING: Thick steel bars. Would require exceptional strength or cutting tools.

OPENING: Gate swings outward. Makes noise when operated.`,
        locked: true,
        open: false,
        locks: [lock1.id],
        durability: 150,
        lockDifficulty: 8,
        autolockOnClose: true,
      });

      await gate1.call('moveTo', lowerJunction);
    }

    // 2. SUPPLY HUB (#4018) - Other entry from z=-2 to z=-4
    const supplyHub = await this.manager.load(4018);
    if (supplyHub) {
      const lock2 = await $.recycler.create($.biometricLock, {
        name: 'Logistics Scanner',
        description:
          'A weathered palm scanner beside a cargo gate. Scratched from heavy use.',
        abilities: `Biometric scanner for logistics personnel. LED indicates status.

AUTHORIZATION: Player must be in 'verifiedUsers' array. Supply runners and Cartel members have access.

SCANNING: Palm print required. Gloves block the scan.

BYPASS: Old model, slightly easier to hack than newer units.`,
        scanType: 'palm',
        verifiedUsers: [sisterGray.id],
      });

      const gate2 = await $.recycler.create($.door, {
        name: 'Cargo Gate',
        description:
          'A wide steel gate for supply passage. Scuff marks show decades of cargo traffic.',
        abilities: `Wide cargo gate on sliding rails. Passage blocked when 'open' is false or 'locked' is true.

UNLOCKING: Requires authorization from the logistics scanner.

FORCING: Heavy construction but the sliding mechanism is a potential weak point.

OPENING: Slides aside on rails. Rumbles loudly when moving.`,
        locked: true,
        open: false,
        locks: [lock2.id],
        durability: 120,
        lockDifficulty: 6,
        autolockOnClose: true,
      });

      await gate2.call('moveTo', supplyHub);
    }

    // 3. THE DESCENT (#4064) - Entry to Sister Gray's domain (z=-5)
    const theDescent = await this.manager.load(4064);
    if (theDescent) {
      const lock3 = await $.recycler.create($.biometricLock, {
        name: 'Retinal Scanner',
        description:
          'A sleek retinal scanner beside a vault-like door. Emits a faint blue glow.',
        abilities: `Advanced retinal scanner with multi-spectrum analysis. LED glows blue when ready, green when access granted.

AUTHORIZATION: Player must be in 'verifiedUsers' array. Only Sister Gray and her inner circle have access.

SCANNING: Requires direct eye contact. Eyewear must be removed. Prosthetic eyes may fail scan.

BYPASS: Military-grade encryption. Extremely difficult to hack.`,
        scanType: 'retinal',
        verifiedUsers: [sisterGray.id],
      });

      const door3 = await $.recycler.create($.door, {
        name: 'Command Vault Door',
        description:
          'A massive vault door of layered steel and composite armor. No handles or hinges visible.',
        abilities: `Vault-class security door. Passage blocked when 'open' is false or 'locked' is true.

UNLOCKING: Requires retinal authorization. Only Sister Gray's inner circle has access.

FORCING: Vault-class construction. Would require military-grade breaching equipment.

OPENING: Retracts silently into the wall. Seals with a pneumatic hiss.`,
        locked: true,
        open: false,
        locks: [lock3.id],
        durability: 500,
        lockDifficulty: 15,
        autolockOnClose: true,
      });

      await door3.call('moveTo', theDescent);
    }

    // 4. THE VAULT (#4068) - Secondary security within Sister Gray's domain
    const theVault = await this.manager.load(4068);
    if (theVault) {
      const lock4 = await $.recycler.create($.lock, {
        name: 'Vault Combination Lock',
        description:
          'A mechanical combination lock with worn brass dials. Old technology, but formidable.',
        abilities: `Mechanical combination lock with 5 dials. No electronics to hack.

AUTHORIZATION: Player must know the combination OR be in 'verifiedUsers'.

PICKING: Requires exceptional lockpicking skill and time. Difficulty 12.

FORCING: Hardened steel. Destroying the lock would require cutting through the door.`,
        verifiedUsers: [sisterGray.id],
        code: '73-21-88-14-52',
      });

      const door4 = await $.recycler.create($.door, {
        name: 'Inner Vault Door',
        description:
          'A circular vault door of polished steel, with a five-dial combination lock at center.',
        abilities: `Bank-vault style circular door. Passage blocked when 'open' is false or 'locked' is true.

UNLOCKING: Requires the correct combination or inner-circle authorization.

FORCING: Vault-class construction. The door is three feet thick.

OPENING: Swings outward on massive hinges. Takes effort to move even when unlocked.`,
        locked: true,
        open: false,
        locks: [lock4.id],
        durability: 400,
        lockDifficulty: 12,
        autolockOnClose: false,
      });

      await door4.call('moveTo', theVault);
    }

    // 5. CLONE LAB (#4071) - Restricted access
    const cloneLab = await this.manager.load(4071);
    if (cloneLab) {
      const lock5 = await $.recycler.create($.biometricLock, {
        name: 'Cleanroom Scanner',
        description:
          'A sterile white palm scanner beside an airlock door. A display shows contamination readings.',
        abilities: `Cleanroom access scanner combining biometric authorization with contamination check.

AUTHORIZATION: Player must be in 'verifiedUsers'. Only authorized research personnel.

SCANNING: Palm print required. Also checks for contaminants.

BYPASS: Medical-grade security. The contamination sensor may trigger alarms.`,
        scanType: 'palm',
        verifiedUsers: [sisterGray.id],
      });

      const door5 = await $.recycler.create($.door, {
        name: 'Cleanroom Airlock',
        description:
          'A sealed airlock door with positive-pressure indicators. UV strips rim the edges.',
        abilities: `Cleanroom airlock door. Passage blocked when 'open' is false or 'locked' is true.

UNLOCKING: Requires cleanroom scanner authorization.

FORCING: Designed for contamination control, not maximum security. Durable but not vault-class.

OPENING: Cycles through decontamination sequence. UV lights flash, air hisses. Takes ~10 seconds.`,
        locked: true,
        open: false,
        locks: [lock5.id],
        durability: 80,
        lockDifficulty: 7,
        autolockOnClose: true,
      });

      await door5.call('moveTo', cloneLab);
    }

    // 6. HOLDING CELLS (#4067) - Detention security
    const holdingCells = await this.manager.load(4067);
    if (holdingCells) {
      const lock6 = await $.recycler.create($.lock, {
        name: 'Detention Lock',
        description:
          'A heavy-duty mechanical lock with a keypad override. Built for reliability.',
        abilities: `Hybrid mechanical/electronic lock. Keypad provides code access, mechanical lock provides backup.

AUTHORIZATION: Player must know the code OR have the physical key OR be in 'verifiedUsers'.

PICKING: Standard difficulty. The mechanical component is vulnerable to traditional lockpicking.

OVERRIDE: Keypad accepts 4-digit code. Wrong codes trigger lockout after 3 attempts.`,
        verifiedUsers: [sisterGray.id],
        code: '7734',
      });

      const door6 = await $.recycler.create($.door, {
        name: 'Detention Block Door',
        description:
          'A reinforced steel door with a small barred window. A keypad glows beside the frame.',
        abilities: `Heavy security door for detention area. Passage blocked when 'open' is false or 'locked' is true.

UNLOCKING: Requires keypad code, physical key, or guard authorization.

FORCING: Reinforced but not vault-class. Could be forced with sufficient strength and tools.

OPENING: Swings inward. Hinges on the inside prevent removal from the corridor.`,
        locked: true,
        open: false,
        locks: [lock6.id],
        durability: 100,
        lockDifficulty: 6,
        autolockOnClose: true,
      });

      await door6.call('moveTo', holdingCells);
    }
  }

  /**
   * Add furniture to key underground rooms
   */
  private async addFurniture($: any): Promise<void> {
    // CUTTER BARRACKS (#4020) - Military-style sleeping quarters
    const cutterBarracks = await this.manager.load(4020);
    if (cutterBarracks) {
      const bunk1 = await $.recycler.create($.bed, {
        name: 'Metal Bunk Bed',
        description:
          'A double-decker military bunk with thin mattresses and scratchy wool blankets. Names scratched into the frame.',
        abilities: `Two-person bunk bed. Can sleep on top or bottom.

RESTING: Provides adequate but uncomfortable rest.

CONCEALMENT: Space under bottom bunk can hide small items or a person lying flat.`,
      });

      const bunk2 = await $.recycler.create($.bed, {
        name: 'Metal Bunk Bed',
        description:
          'Another bunk identical to the others. The top mattress sags in the middle.',
        abilities: `Two-person bunk bed.

RESTING: Adequate but uncomfortable rest.

CONCEALMENT: Space under bottom bunk can hide small items.`,
      });

      const bunk3 = await $.recycler.create($.bed, {
        name: 'Metal Bunk Bed',
        description:
          'A bunk near the wall. Someone has hung a faded photo on the frame.',
        abilities: `Two-person bunk bed.

RESTING: Adequate but uncomfortable rest.

CONCEALMENT: Space under bottom bunk can hide small items.`,
      });

      const lockerBank = await $.recycler.create($.locker, {
        name: 'Personnel Lockers',
        description:
          'A row of tall metal lockers, dented and scratched from years of use. Each has a combination lock.',
        abilities: `Bank of personal storage lockers.

STORAGE: Each locker holds personal gear, weapons, effects. Combination locks provide basic security.

SEARCHING: Individual lockers can be searched if unlocked.`,
      });

      const footlocker = await $.recycler.create($.trunk, {
        name: 'Communal Footlocker',
        description:
          'A large metal footlocker at the end of the bunks. Unlocked, used for shared supplies.',
        abilities: `Shared storage for communal supplies.

STORAGE: Contains spare blankets, basic toiletries, first aid supplies.

OPEN: No lock - anyone can access the contents.`,
      });

      const messTable = await $.recycler.create($.table, {
        name: 'Mess Table',
        description:
          'A battered folding table with mismatched chairs. Playing cards and coffee rings stain the surface.',
        abilities: `Communal eating and recreation table.

SEATING: Room for 6-8 people on the mismatched chairs.

SURFACE: Can place items. Currently holds scattered playing cards and a tin ashtray.`,
      });

      await bunk1.call('moveTo', cutterBarracks);
      await bunk2.call('moveTo', cutterBarracks);
      await bunk3.call('moveTo', cutterBarracks);
      await lockerBank.call('moveTo', cutterBarracks);
      await footlocker.call('moveTo', cutterBarracks);
      await messTable.call('moveTo', cutterBarracks);
    }

    // SPARK WORKSHOP (#4021) - Electronics/tech workshop
    const sparkWorkshop = await this.manager.load(4021);
    if (sparkWorkshop) {
      const workbench = await $.recycler.create($.table, {
        name: 'Electronics Workbench',
        description:
          'A heavy-duty workbench covered with soldering equipment, oscilloscopes, and tangled wires.',
        abilities: `Professional electronics workstation.

CRAFTING: Equipped for electronics repair, modification, and fabrication.

SURFACE: Cluttered with components, wire spools, and half-finished projects.`,
      });

      const toolCabinet = await $.recycler.create($.cabinet, {
        name: 'Tool Cabinet',
        description:
          'A tall metal cabinet with many small drawers. Labels identify contents: resistors, capacitors, chips.',
        abilities: `Organized storage for electronic components.

STORAGE: Hundreds of small drawers containing sorted components.

CONTENTS: Resistors, capacitors, ICs, connectors, wire, solder, flux, specialized tools.`,
      });

      const workChair = await $.recycler.create($.chair, {
        name: 'Workshop Stool',
        description:
          'A padded stool on wheels, the seat cracked and repaired with tape.',
        abilities: `Mobile work stool.

SEATING: Comfortable for extended work. Wheels allow movement between stations.`,
      });

      const partsCrate = await $.recycler.create($.crate, {
        name: 'Salvage Crate',
        description:
          'A plastic crate overflowing with salvaged electronics: old phones, tablets, circuit boards.',
        abilities: `Salvage bin for electronic components.

CONTENTS: Mix of broken devices waiting to be stripped for parts.

SEARCHING: Digging through reveals useful components, though most is junk.`,
      });

      await workbench.call('moveTo', sparkWorkshop);
      await toolCabinet.call('moveTo', sparkWorkshop);
      await workChair.call('moveTo', sparkWorkshop);
      await partsCrate.call('moveTo', sparkWorkshop);
    }

    // INTERROGATION (#4024) - Spartan, intimidating
    const interrogation = await this.manager.load(4024);
    if (interrogation) {
      const interrogationTable = await $.recycler.create($.table, {
        name: 'Steel Interrogation Table',
        description:
          'A heavy steel table bolted to the floor. Ring anchors allow restraints to be attached.',
        abilities: `Fixed interrogation table with restraint points.

RESTRAINTS: Metal rings welded to surface allow handcuffs or restraints.

IMMOVABLE: Bolted to the floor.`,
      });

      const interrogatorChair = await $.recycler.create($.chair, {
        name: 'Padded Chair',
        description:
          "A reasonably comfortable office chair on the far side of the table. The interrogator's seat.",
        abilities: `Comfortable chair for the questioner.

SEATING: Padded, adjustable. Psychological advantage over the hard chair opposite.`,
      });

      const subjectChair = await $.recycler.create($.chair, {
        name: 'Metal Chair',
        description:
          'A bare metal chair bolted to the floor. Uncomfortable by design.',
        abilities: `Uncomfortable fixed chair for subjects.

RESTRAINTS: Legs have attachment points for ankle restraints.

IMMOVABLE: Bolted to the floor.

DISCOMFORT: Hard metal seat, no padding.`,
      });

      const equipmentCabinet = await $.recycler.create($.cabinet, {
        name: 'Equipment Cabinet',
        description: 'A locked metal cabinet in the corner. Contents unknown.',
        abilities: `Storage for interrogation equipment.

LOCKED: Requires key or authorization to open.

CONTENTS: Unknown. Could contain recording equipment, files, or other tools.`,
      });

      await interrogationTable.call('moveTo', interrogation);
      await interrogatorChair.call('moveTo', interrogation);
      await subjectChair.call('moveTo', interrogation);
      await equipmentCabinet.call('moveTo', interrogation);
    }

    // WAR ROOM (#4065) - Strategic planning center
    const warRoom = await this.manager.load(4065);
    if (warRoom) {
      const planningTable = await $.recycler.create($.table, {
        name: 'Planning Table',
        description:
          'A large rectangular table with a surface designed for displaying maps and documents. Scratch marks suggest heavy use.',
        abilities: `Strategic planning table.

SURFACE: Large enough for city maps, building plans, operation documents.

SEATING: Chairs arranged around for 8-10 people.`,
      });

      const chair1 = await $.recycler.create($.chair, {
        name: 'Council Chair',
        description:
          'A high-backed chair at the head of the table. More ornate than the others.',
        abilities: `Leadership position chair.

SEATING: Comfortable, authoritative position at the head of the table.`,
      });

      const chair2 = await $.recycler.create($.chair, {
        name: 'Planning Chair',
        description: 'A simple but sturdy chair around the planning table.',
        abilities: `Functional seating for planning sessions.`,
      });

      const chair3 = await $.recycler.create($.chair, {
        name: 'Planning Chair',
        description:
          'Another planning chair. Worn from countless strategy sessions.',
        abilities: `Functional seating for planning sessions.`,
      });

      const mapCabinet = await $.recycler.create($.cabinet, {
        name: 'Map Cabinet',
        description:
          'A wide, shallow cabinet designed for storing rolled maps and large documents.',
        abilities: `Storage for maps and plans.

CONTENTS: City maps, building schematics, operation plans, historical records.`,
      });

      await planningTable.call('moveTo', warRoom);
      await chair1.call('moveTo', warRoom);
      await chair2.call('moveTo', warRoom);
      await chair3.call('moveTo', warRoom);
      await mapCabinet.call('moveTo', warRoom);
    }

    // COUNCIL CHAMBERS (#4069) - Deliberation space
    const councilChambers = await this.manager.load(4069);
    if (councilChambers) {
      const roundTable = await $.recycler.create($.table, {
        name: 'Round Council Table',
        description:
          'A large round table, deliberately designed so no position is head. Symbol of equality among those who sit here.',
        abilities: `Circular deliberation table.

SYMBOLISM: Round design indicates equality - no head of table.

SEATING: Room for 12 around the circumference.`,
      });

      for (let i = 0; i < 6; i++) {
        const chair = await $.recycler.create($.chair, {
          name: 'Council Seat',
          description:
            'An identical chair, indistinguishable from the others around the table.',
          abilities: `Equal seating for council deliberations.`,
        });
        await chair.call('moveTo', councilChambers);
      }

      await roundTable.call('moveTo', councilChambers);
    }

    // SISTER'S QUARTERS (#4070) - Austere
    const sistersQuarters = await this.manager.load(4070);
    if (sistersQuarters) {
      const cot = await $.recycler.create($.bed, {
        name: 'Narrow Cot',
        description:
          'A narrow military cot with a single thin blanket. Deliberately uncomfortable.',
        abilities: `Ascetic sleeping arrangement.

RESTING: Minimal comfort. A reminder that rest is a necessity, not a pleasure.`,
      });

      const meditation = await $.recycler.create($.bench, {
        name: 'Meditation Bench',
        description:
          'A low wooden bench, worn smooth from use. For sitting in contemplation.',
        abilities: `Simple bench for meditation and contemplation.

SEATING: Low to the ground. Encourages stillness and focus.`,
      });

      const trunk = await $.recycler.create($.trunk, {
        name: 'Personal Trunk',
        description:
          'A small metal trunk at the foot of the cot. Everything she owns fits inside.',
        abilities: `Personal storage.

CONTENTS: Minimal possessions. What does Sister Gray keep?`,
      });

      await cot.call('moveTo', sistersQuarters);
      await meditation.call('moveTo', sistersQuarters);
      await trunk.call('moveTo', sistersQuarters);
    }

    // CLONE LAB (#4071) - Already has door, add equipment
    const cloneLab2 = await this.manager.load(4071);
    if (cloneLab2) {
      const examTable = await $.recycler.create($.table, {
        name: 'Examination Table',
        description:
          'A stainless steel examination table with adjustable sections. Drains run to collectors beneath.',
        abilities: `Medical examination and procedure table.

PROCEDURES: Equipped for biological examination and minor procedures.

DRAINAGE: Fluids drain to collectors for disposal or analysis.`,
      });

      const specCabinet = await $.recycler.create($.cabinet, {
        name: 'Specimen Cabinet',
        description:
          'A refrigerated cabinet with glass doors. Vials and containers visible inside.',
        abilities: `Temperature-controlled specimen storage.

CONTENTS: Biological samples, cultures, genetic material.

CLIMATE: Maintains precise temperature for sample preservation.`,
      });

      const workstation = await $.recycler.create($.table, {
        name: 'Lab Workstation',
        description:
          'A laboratory workstation with centrifuge, microscope, and various analytical equipment.',
        abilities: `Biological analysis workstation.

EQUIPMENT: Centrifuge, microscope, spectral analyzer, gene sequencer.

WORK: Sample analysis, genetic research, clone development monitoring.`,
      });

      await examTable.call('moveTo', cloneLab2);
      await specCabinet.call('moveTo', cloneLab2);
      await workstation.call('moveTo', cloneLab2);
    }

    // ARCHIVE (#4066) - Information storage
    const archive = await this.manager.load(4066);
    if (archive) {
      const shelf1 = await $.recycler.create($.cabinet, {
        name: 'Archive Shelving',
        description:
          'Floor-to-ceiling metal shelving loaded with boxes, binders, and data storage devices.',
        abilities: `Document and data storage.

CONTENTS: Paper records, digital backups, historical documents.

ORGANIZATION: Labeled by date and subject, though some sections are cryptically coded.`,
      });

      const shelf2 = await $.recycler.create($.cabinet, {
        name: 'Archive Shelving',
        description:
          'More shelving, these holding older materials. Some boxes are sealed with security tape.',
        abilities: `Secure archive storage.

CONTENTS: Sensitive materials. Some boxes sealed and marked classified.`,
      });

      const readingDesk = await $.recycler.create($.table, {
        name: 'Reading Desk',
        description:
          'A simple desk with a lamp for reviewing archive materials.',
        abilities: `Research workspace.

LIGHTING: Adjustable lamp for document review.

SURFACE: Space for spreading out documents and taking notes.`,
      });

      await shelf1.call('moveTo', archive);
      await shelf2.call('moveTo', archive);
      await readingDesk.call('moveTo', archive);
    }

    // HOLDING CELLS (#4067) - Already has door, add cell furniture
    const holdingCells2 = await this.manager.load(4067);
    if (holdingCells2) {
      const cellBench = await $.recycler.create($.bench, {
        name: 'Cell Bench',
        description:
          'A concrete bench built into the wall. Serves as both seat and bed.',
        abilities: `Fixed detention seating/sleeping.

IMMOVABLE: Built into the wall.

DISCOMFORT: Hard concrete. Not meant for comfort.`,
      });

      const cellBench2 = await $.recycler.create($.bench, {
        name: 'Cell Bench',
        description:
          'Another concrete bench in a different cell section. Stains of unknown origin.',
        abilities: `Fixed detention seating/sleeping.

IMMOVABLE: Built into the wall.`,
      });

      await cellBench.call('moveTo', holdingCells2);
      await cellBench2.call('moveTo', holdingCells2);
    }
  }

  async registerAliases(): Promise<void> {
    // No aliases to register - these are furniture/locks, not singletons
  }
}

// Self-register
registerBuilder(UndergroundUpgradesBuilder);
