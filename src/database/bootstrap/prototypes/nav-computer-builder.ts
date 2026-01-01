import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the NavComputer type
 * An AI-powered navigation computer for vehicles.
 * Inherits from $vehiclePart, uses $aiPrompts.navComputer for AI behavior.
 */
export class NavComputerBuilder implements Builder {
  static provides = ['navComputer'];
  static depends = ['vehiclePart', 'aiPrompts'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    // Check if type already exists
    const existing = await this.manager.load('navComputer');
    if (existing) {
      this.obj = existing;
      return;
    }

    // Get parent type
    const vehiclePart = await this.manager.load('vehiclePart');
    if (!vehiclePart) {
      throw new Error('VehiclePart type not found - required for NavComputer');
    }

    // Load nav computer prompt from $aiPrompts
    const objectManager = await this.manager.load(0);
    const aliases =
      (objectManager?.get('aliases') as Record<string, number>) || {};
    const aiPrompts = aliases.aiPrompts
      ? await this.manager.load(aliases.aiPrompts)
      : null;
    const systemPrompt =
      (aiPrompts?.get('navComputer') as string) ||
      '# Navigation Computer\n\nYou are an onboard navigation computer.';

    this.obj = await this.manager.define('navComputer', vehiclePart, {
      properties: {
        name: 'Navigation Computer',
        description:
          'An onboard navigation computer with voice interface.',
        partType: 'navComputer',
        weight: 2000, // 2kg
        // AI system prompt loaded from docs/prompts/NAV-COMPUTER.md
        agentSystemPrompt: systemPrompt,

        abilities: `Onboard navigation computer. Provides voice-activated navigation when installed in a vehicle.

INSTALLATION: When installed in a vehicle, adds navigation capability.
The vehicle gains the ability: "NAVIGATION: Has nav computer. Players can speak to it for directions."

INTERFACE: Players address the nav computer directly:
- "Nav, how do I get to the airport?"
- "Computer, plot a course to sector 7"
- "What's my ETA?"
- "Where's the nearest fuel station?"

AWARENESS: Knows current location from vehicle. Reads vehicle type and adapts navigation style (ground directions for cars, airspace for aircraft, landing zones for helicopters).

VOICE: Professional but not robotic. Acknowledges commands, gives concise information, warns about hazards.`,
      },
      methods: {},
    });

    // Property descriptions
    this.obj.setPropertyDescription(
      'agentSystemPrompt',
      'AI system prompt defining navigation computer behavior (from docs/prompts/NAV-COMPUTER.md)',
    );
    this.obj.setPropertyDescription(
      'abilities',
      'How the navigation computer works and what it adds to the vehicle',
    );
  }

  async registerAliases(): Promise<void> {
    // Types auto-alias by name
    if (!this.obj) return;
    console.log(`[NavComputerBuilder] Type 'navComputer' auto-aliased`);
  }
}

// Self-register
registerBuilder(NavComputerBuilder);
