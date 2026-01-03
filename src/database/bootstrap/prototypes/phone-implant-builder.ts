import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * PhoneImplant type extends WirelessPhone with cyberware installation.
 * Cochlear speaker + bone conduction mic + neural link.
 * Uses abilities-first architecture - bioelectric power, subvocal speech.
 */
export class PhoneImplantBuilder implements Builder {
  static provides = ['phoneImplant'];
  static depends = ['wirelessPhone'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    // Check if type already exists (types auto-alias)
    const existing = await this.manager.load('phoneImplant');
    if (existing) {
      this.obj = existing;
    } else {
      // Create phoneImplant as a TYPE extending wirelessPhone
      const wirelessPhone = await this.manager.load('wirelessPhone');
      if (!wirelessPhone) throw new Error('WirelessPhone type not found');

      this.obj = await this.manager.define('phoneImplant', wirelessPhone, {
        properties: {
          name: 'Phone Implant',
          description: 'A cybernetic communication implant.',
          weight: 15,

          // Cyberware properties
          slot: 'ear',
          installedIn: null,
          installedOn: null,
          condition: 100,

          // Override wireless phone defaults
          battery: 100, // Bioelectric - always full
          signal: 5,
          ringtone: 'vibrates in your skull',

          installAbilities: `PHONE IMPLANT: Internal communication system.
Subvocal calls - speak without moving lips.
Private audio - only you hear incoming.
Always connected. Never needs charging.`,

          abilities: `Cybernetic communication implant. Cochlear speaker + bone conduction mic + neural link.

INSTALLATION: Requires surgical-kit + micro-tools + anesthetic.
Implanted in inner ear, connects to auditory nerve. Bone conduction
transducers placed along jaw. Neural link for subvocal detection.
Add installAbilities text to host abilities under "PHONE IMPLANT".
Recovery: 48 hours of hearing sensitivity, phantom sounds.

REMOVAL: Surgical extraction. Host loses implant capabilities.
Can reinstall biological hearing aid or new implant.
Leaves no visible scarring - all internal.

CALLS: Sound "in your head" - only you hear them.
Subvocalize to speak - lips barely move, private conversation.
Others nearby cannot hear your side of the call.
dial(number) to call out, answer() when ringing, hangup() to end.

MESSAGES: Text arrives as "knowing" - you just know the content.
With retinal display: visual text overlay optional.
Without: pure intuition, like remembering something you forgot.
sendMessage(number, text) to send, getMessages() to review.

RINGING: Feel vibration in jaw/skull - private alert.
'ringing' property becomes true. Only you feel it.
No audible ring - completely silent to others.

NETWORK: Connects to ad-hoc networks automatically.
Signal still location-dependent - underground areas block signal.
'signal' property reflects current reception strength 0-5.

POWER: Bioelectric - draws from body's electrical system.
Never needs charging. Always on unless deliberately disabled.
'battery' always reads 100 - ignore it.

REJECTION: Signs: tinnitus, vertigo, hearing distortion.
Immunosuppressants help. Severe = removal required.
Check 'condition' property - below 50 means problems.

MAINTENANCE: Rippers can service. Neglected implant
causes audio glitches, phantom sounds, dropped calls.
'condition' degrades 0-100 without regular maintenance.`,
        },
        methods: {},
      });
    }

    // Always rebuild methods (ensures they exist even if type was pre-existing)
    const obj = this.obj!;

    // canUse() - override to ignore battery (bioelectric power)
    obj.setMethod(
      'canUse',
      `
      /** Check if implant can be used (has signal, is installed).
       *  Battery is ignored - bioelectric power never runs out.
       *  @returns true if usable, or error string if not
       */
      if (!self.installedOn) return { success: false, error: 'The implant is not installed.' };
      if ((self.signal ?? 0) <= 0) return { success: false, error: 'No signal here.' };
      if ((self.condition ?? 0) <= 0) return { success: false, error: 'The implant is non-functional.' };
      return { success: true };
    `,
    );

    // Property descriptions - cyberware properties
    obj.setPropertyDescription(
      'slot',
      'Body part slot this implant occupies (ear)',
    );
    obj.setPropertyDescription(
      'installedIn',
      'Body part slot name when installed',
    );
    obj.setPropertyDescription('installedOn', 'Host agent when installed');
    obj.setPropertyDescription(
      'condition',
      'Implant condition 0-100, degrades without maintenance',
    );
    obj.setPropertyDescription(
      'installAbilities',
      'Ability text added to host when installed',
    );

    this.obj = obj;
  }

  async registerAliases(): Promise<void> {
    // Types auto-alias by name, no manual registration needed
    if (!this.obj) return;
    console.log(`[PhoneImplantBuilder] Type 'phoneImplant' auto-aliased`);
  }
}

// Self-register
registerBuilder(PhoneImplantBuilder);
