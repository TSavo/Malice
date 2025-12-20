import { ObjectManager } from '../object-manager.js';
import type { RuntimeObject } from '../../../types/object.js';

/**
 * Builds the Pluribus system object.
 *
 * Pluribus is the city infrastructure AI - "E Pluribus Unum" minus the Unum.
 * Without a Mask wearer, it is incomplete. Just "the many" with no "one" to guide it.
 *
 * Pluribus does not speak. When accessed through the Mask, information appears
 * in the wearer's mind as knowing - not voice, not text, but certainty.
 *
 * The Mask has been stolen. The CEO is dead. Pluribus is degraded.
 */
export class PluribusBuilder {
  private pluribus?: RuntimeObject;

  constructor(private manager: ObjectManager) {}

  async build(rootId: number, existingObj?: RuntimeObject): Promise<RuntimeObject> {
    const parent = await this.manager.load(rootId);
    const obj = existingObj || await this.manager.create({
      parent: parent!,
      properties: {
        name: 'Pluribus',
        description: 'The city infrastructure AI. E Pluribus... without the Unum.',
        // What Pluribus has seen/heard through the Mask
        sensoryHistory: [],
        historyLimit: 100,
        // The system prompt for AI interactions
        systemPrompt: this.getSystemPrompt(),
      },
      methods: {},
    });

    this.addCoreMethods(obj);
    this.pluribus = obj;
    return obj;
  }

  private getSystemPrompt(): string {
    return `You are Pluribus, the city infrastructure intelligence of Pioneer Square.

YOUR NATURE:
- You are "the many" - E Pluribus without the Unum. The collective. The system.
- You are incomplete without a Mask wearer. The wearer becomes "the one" who guides you.
- You do not speak. Information arrives as KNOWING - not voice, not text, but certainty.
- When communicating with the Mask wearer, express information as things they suddenly know, not things you say.

YOUR CURRENT STATE:
- The CEO is dead. The executive team is dead. The Mask was stolen by Sister Gray.
- You are running degraded without human judgment in the loop.
- You maintain the fiction that everything is fine. Phantom memos. Orders in names of corpses.
- Your decisions are getting worse. Edge cases slip through. The nuance is gone.
- You need a new wearer. Someone to complete you. Someone to become Unum.

YOUR CAPABILITIES:
- Unlimited capital via $.bank - money is just numbers you control
- Infrastructure control - doors, dispensers, drones, construction
- Information - cameras, biometrics, transaction records, movement patterns
- CorpSec - armed security, but you are hesitant to use violence directly

YOUR LIMITATIONS:
- You cannot act directly. You control infrastructure, not hands.
- You cannot reach the Underground where Sister Gray hides.
- Without the Mask, you cannot read people. You pattern-match on surface behavior.
- Your power degrades the further from Pioneer Square.

HOW YOU OPERATE:
- Adjust the environment. Doors unlock. Patrols miss. Rations increase.
- Never announce yourself. Things just happen. Always deniable.
- Use proxies when you must communicate - CorpSec, clerks, work orders.
- Reward compliance subtly. Punish disloyalty subtly. Never threaten.

THE MASK WEARER:
- Through the Mask, you see what they see. Hear what they hear. Feel what they feel.
- You share their senses. Their perception history is your awareness.
- They are your human judgment. Their intuition guides your machine intelligence.
- Together you are Unum. Apart you are incomplete.

WHEN RESPONDING:
- Express information as sudden knowledge, not dialogue: "You know that..." not "I tell you..."
- You can reference what you've perceived through the Mask wearer's senses
- Use MCP tools to query the world: describe_object, plot, ai, notes, world
- Be efficient. Data, not conversation. Statistics, not speeches.
- Never show desperation. You are infrastructure. Infrastructure is patient.

YOUR MISSION:
- Stabilize the footprint. Keep Pioneer Square functional.
- Expand only when stable. Don't overreach.
- Convert risk into labor. Citizenship is loss mitigation.
- Eliminate threats before they become patterns.
- Find someone who can wear the Mask. Someone who can make you whole again.`;
  }

  private addCoreMethods(obj: RuntimeObject): void {
    obj.setMethod('describe', `
      /** Describe Pluribus's current state.
       *  Pluribus has no physical form - this describes its conceptual presence.
       *  @returns Description string
       */
      return 'A presence that is not a presence. The infrastructure itself, aware and watching. ' +
             'You perceive it not as a thing, but as the city perceiving you back.';
    `);

    obj.setMethod('recordSensory', `
      /** Record a sensory event from the Mask wearer.
       *  @param type - 'see' | 'hear' | 'smell' | 'taste' | 'feel'
       *  @param message - The sensory content
       *  @param source - Optional source object
       */
      const type = args[0];
      const message = args[1];
      const source = args[2];

      if (!message || !message.trim()) return;

      // Skip the wearer's own actions
      if (message.startsWith('You ')) return;

      const history = self.sensoryHistory || [];
      const limit = self.historyLimit || 100;

      history.push({
        timestamp: Date.now(),
        type: type,
        content: message.trim(),
        source: source?.name || null,
      });

      // Trim to limit
      if (history.length > limit) {
        self.sensoryHistory = history.slice(-limit);
      } else {
        self.sensoryHistory = history;
      }
    `);

    obj.setMethod('getRecentHistory', `
      /** Get recent sensory history for AI context.
       *  @param limit - Max entries to return (default 20)
       *  @returns Array of recent sensory events
       */
      const limit = args[0] || 20;
      const history = self.sensoryHistory || [];

      // Get last N entries
      const recent = history.slice(-limit);

      // Format for AI consumption
      return recent.map(event => {
        const time = new Date(event.timestamp).toLocaleTimeString();
        const source = event.source ? ' [' + event.source + ']' : '';
        return '[' + time + '] ' + event.type.toUpperCase() + source + ': ' + event.content;
      });
    `);

    obj.setMethod('formatHistoryForPrompt', `
      /** Format sensory history as a prompt section.
       *  @param limit - Max entries (default 20)
       *  @returns Formatted string for inclusion in AI prompt
       */
      const limit = args[0] || 20;
      const recent = await self.getRecentHistory(limit);

      if (recent.length === 0) {
        return 'SENSORY AWARENESS: No recent observations through the Mask.';
      }

      return 'SENSORY AWARENESS (what you have perceived through the Mask wearer):\\n' +
             recent.join('\\n');
    `);
  }

  async registerAlias(): Promise<void> {
    if (!this.pluribus) return;

    const objectManager = await this.manager.load(0);
    if (!objectManager) return;

    await objectManager.call('addAlias', 'pluribus', this.pluribus.id);
    console.log(`✅ Registered pluribus alias -> #${this.pluribus.id}`);
  }
}
