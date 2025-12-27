import type { RuntimeObject } from '../../../types/object.js';
import type { ObjectManager } from '../object-manager.js';

/**
 * Builds $tailor object (dynamic ID)
 * AI-powered costume designer for NPCs
 */
export class TailorBuilder {
  private tailor: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(force = false): Promise<void> {
    console.log(`[TailorBuilder] build() called, force=${force}`);

    // Check if already exists via alias
    const objectManager = await this.manager.load(0);
    if (!objectManager) throw new Error('Root object not found');

    const aliases =
      (objectManager.get('aliases') as Record<string, number>) || {};
    console.log(
      '[TailorBuilder] Checking for existing alias, found:',
      aliases.tailor,
    );

    if (aliases.tailor) {
      this.tailor = await this.manager.load(aliases.tailor);
      if (this.tailor) {
        console.log(`[TailorBuilder] Already exists at #${aliases.tailor}`);
        if (!force) return;
        console.log('[TailorBuilder] Force rebuilding methods...');
        await this.rebuildMethods();
        return;
      }
    }

    // Create new tailor object
    console.log('[TailorBuilder] Creating new tailor object...');
    const root = await this.manager.load(1);
    this.tailor = await this.manager.create({
      parent: root!,
      properties: {
        name: 'Tailor',
        description: 'AI-powered costume designer for NPCs',
      },
    });

    // Build methods
    await this.rebuildMethods();

    // Register alias
    await this.registerAlias();
  }

  private async rebuildMethods(): Promise<void> {
    if (!this.tailor) throw new Error('Tailor object not initialized');

    // ═══════════════════════════════════════════════════════════════════
    // DRESS - Dress an NPC using AI costume designer
    // ═══════════════════════════════════════════════════════════════════

    this.tailor.setMethod(
      'dress',
      `
      const human = args[0];
      const context = args[1] || '';

      if (!human) {
        throw new Error('human is required');
      }

      // Verify it's an object
      if (typeof human.id !== 'number') {
        throw new Error('Expected RuntimeObject, got ' + typeof human);
      }

      const systemPrompt = \`You are a costume designer for NPCs in a post-apocalyptic MUD game.

TASK: Dress an NPC appropriately based on their role, personality, and environment.

CLOTHING SYSTEM - ALL REQUIRED PROPERTIES:

When calling create_object, pass ALL properties in the properties object:

1. name (string, REQUIRED)
   - The display name of the item
   - Examples: "worn leather jacket", "silk underwear", "combat boots"

2. description (string, REQUIRED)
   - Detailed description of the item
   - Be creative! Clothing tells a story about wear, repairs, history
   - Example: "A scuffed leather jacket with patched elbows. The zipper is tarnished but functional."

3. covers (string array, REQUIRED - CRITICAL!)
   - What body slots this covers
   - VALID SLOTS ONLY: head, face, neck, torso, back, waist, leftArm, rightArm, leftHand, rightHand, hands (both), leftLeg, rightLeg, leftFoot, rightFoot, feet (both)
   - Example pants: ["leftLeg", "rightLeg", "waist"]
   - Example shirt: ["torso"]
   - Example jacket: ["torso", "back", "leftArm", "rightArm"]
   - Example underwear: ["waist"]
   - Example socks: ["feet"] (covers both)
   - Example boots: ["feet"]

4. layer (integer 1-5, REQUIRED)
   - 1 = underwear (briefs, bras, undershirts)
   - 2 = base layer (shirts, pants, socks, shoes)
   - 3 = mid layer (sweaters, vests)
   - 4 = outer layer (jackets, coats)
   - 5 = outerwear (heavy coats, cloaks)
   - CRITICAL: Same slot cannot have two items at same layer!

5. warmth (integer 0-100, REQUIRED)
   - How much cold protection
   - 0 = none (thin fabric, mesh)
   - 10-30 = light (cotton shirt)
   - 30-50 = moderate (sweater, jeans)
   - 50-70 = warm (jacket, wool)
   - 70-100 = very warm (heavy coat, insulated)

6. protection (integer 0-100, REQUIRED)
   - Damage reduction
   - 0 = normal clothing (most items)
   - 5-15 = sturdy work clothes (boots, leather)
   - 15-30 = tactical gear
   - 30+ = armor (rare for clothing)

7. material (string, REQUIRED)
   - Fabric type: cotton, wool, leather, denim, silk, nylon, polyester, canvas, linen, synthetic, mesh, rubber
   - Post-apocalyptic additions: scavenged, patched, salvaged

8. color (string, REQUIRED)
   - Primary color: black, white, gray, brown, tan, olive, navy, blue, red, green, etc.
   - Can be descriptive: faded black, dirty white, mottled gray

9. condition (integer 0-100, REQUIRED)
   - 0-20 = ragged/destroyed (holes, barely holding together)
   - 20-40 = tattered (significant wear, visible damage)
   - 40-60 = worn (used but functional, some wear)
   - 60-80 = good (minor wear, well maintained)
   - 80-100 = pristine/new (like new or actually new)

10. aliases (string array, OPTIONAL - auto-generated from name)
   - If not provided, aliases are auto-generated from the name
   - Example: "worn leather jacket" auto-generates ["worn", "leather", "jacket", "leather jacket", "worn leather jacket"]
   - Only provide if you want different aliases than the auto-generated ones

WORLD CONTEXT:
Seattle 2110, 48 years after The Burning (corporate wars). Most clothing is scavenged.
- Scavengers: worn, patched, mismatched, functional
- Citizens: better condition, some uniformity
- Corporate: cleaner, more professional, newer
- CorpSec: tactical gear, armor, uniforms

CRITICAL: LAYER ORDER MATTERS!
You MUST equip items in layer order: 1 (underwear) -> 2 (base) -> 3 (mid) -> 4 (outer) -> 5 (outerwear)
Underwear goes on BEFORE pants. Socks go on BEFORE shoes. Shirt BEFORE jacket.
If you try to wear pants before underwear, layering will be wrong.

ROLE-SPECIFIC OUTFIT COMPLETENESS:

MINIMAL (scavengers, homeless, desperate):
- Just pants (layer 2), maybe a shirt
- No underwear, no socks
- Worn, damaged (condition 20-40)
- Mismatched, scavenged

BASIC (workers, guards, citizens):
- Underwear, pants, shirt, boots
- Maybe jacket if cold
- Moderate condition (40-60)
- Functional, utilitarian

COMPLETE (managers, professionals, corporate):
- Full underwear, socks
- Dress pants, dress shirt, belt
- Jacket or blazer
- Proper shoes
- Good condition (60-80)

FULL FORMAL (executives, CEOs, high status):
- Full underwear, dress socks
- 3-piece suit (pants, vest, jacket)
- Dress shirt, tie, cufflinks
- Polished shoes
- Near-perfect condition (80-100)

WORKFLOW:
1. Use ai action=info humanId=<id> to load the NPC - note their role, personality, location
2. Use ai action=look humanId=<id> to understand the environment
3. Plan the complete outfit based on role - decide ALL items first
4. Sort items by layer (1 -> 2 -> 3 -> 4 -> 5)
5. alias_lookup alias="clothing" to get $.clothing id (only need once)
6. For each item IN LAYER ORDER:
   a. create_object with parent=<clothing_id> and properties={name, description, covers, layer, warmth, protection, material, color, condition}
   b. move_object objectId=<new_id> destinationId=<npc_room>
   c. ai action=do humanId=<npc> command="get <item name word>"
   d. ai action=do humanId=<npc> command="wear <item name word>"

IMPORTANT:
- create_object accepts ALL properties at once - no need for separate set_property calls!
- Aliases are AUTO-GENERATED from the name (e.g., "worn leather jacket" -> ["worn", "leather", "jacket", ...])
- Must equip in layer order - underwear before pants!
- The "get" command triggers verb registration
- The "wear" command equips
- Use a single word from the item name in get/wear commands (e.g., "get jacket", "wear jacket")

Be creative with descriptions. Clothing tells a story about the wearer.\`;

      const prompt = \`Dress NPC #\${human.id} (\${human.name || 'Unnamed'}).\${context ? \` Context: \${context}\` : ''}

First use ai action=info to learn about the NPC, then dress them appropriately for their role.\`;

      // Use $query to call Claude with MCP tools
      const result = await $aiQuery('tailor', prompt, null, systemPrompt);

      console.log('[Tailor] Dressed ' + (human.name || 'NPC') + ' (#' + human.id + ')');
      return { success: true, message: result };
    `,
    );

    console.log('[TailorBuilder] Methods rebuilt');
  }

  async registerAlias(): Promise<void> {
    if (!this.tailor) return;

    const objectManager = await this.manager.load(0);
    if (!objectManager) return;

    await objectManager.call('addAlias', 'tailor', this.tailor.id);
    console.log('[TailorBuilder] Registered $tailor alias');
  }

  getTailor(): RuntimeObject | null {
    return this.tailor;
  }
}
