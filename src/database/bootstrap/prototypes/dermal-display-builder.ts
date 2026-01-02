import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Dermal Display prototype
 * OLED matrix implanted beneath forearm skin
 */
export class DermalDisplayBuilder implements Builder {
  static provides = ['dermalDisplay'];
  static depends = ['cyberware'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('dermalDisplay');
    if (existing) {
      this.obj = existing;
    } else {
      const cyberware = await this.manager.load('cyberware');
      if (!cyberware) throw new Error('Cyberware type not found');

      this.obj = await this.manager.define('dermalDisplay', cyberware, {
        properties: {
          name: 'Dermal Display',
          description: 'An OLED matrix implanted beneath forearm skin',
          weight: 100,
          slot: 'forearm',
          displayActive: true,
          brightness: 50,

          installAbilities: `DERMAL DISPLAY: Screen embedded in forearm skin.
Check messages, maps, data without devices. Touch sensitive surface.
Visible to others if not covered. Can display custom images/text.`,

          abilities: `OLED matrix implanted beneath forearm skin.

INSTALLATION: Requires surgical-kit + micro-tools + anesthetic.
Flexible display woven under dermis. Touch sensors embedded.
Add installAbilities text to host abilities under "DERMAL DISPLAY".
Recovery: 1 week. Arm itchy, display flickery until settled.

REMOVAL: Display extraction. Leaves faint rectangular scar.
Skin heals but outline may remain visible.

DISPLAY: 15cm x 8cm screen area. Full color. Touch sensitive.
Shows messages, maps, notes, images. Syncs with wireless devices.
Custom wallpapers, tattoo effects, animated displays.
Resolution sufficient for text and simple graphics.

VISIBILITY: Others can see your screen if arm uncovered.
Privacy concerns - cover with sleeve for sensitive data.
Can be advantage - show maps, share info without speaking.
Brightness adjustable - dim for stealth, bright for visibility.

INTERFACE: Touch to interact. Swipe, tap, gestures.
Takes practice to use smoothly. Subvocal command option.
Can link to other chrome for data display.
Notifications appear on skin - feel slight warmth.

CUSTOMIZATION: Change display appearance at will.
Mimic normal skin when blanked. Show static tattoos.
Animated graphics. Clock display. Vital signs if linked to monitors.

DURABILITY: Display survives normal wear. Flexible with skin.
Sharp impacts can damage. Healing takes time if display breaks.
Damaged sections go dark until repaired.

POWER: Draws from bioelectricity. Low drain.
Always on unless deliberately blanked.
No charging required.

REJECTION: Rare. Signs: skin irritation, display flicker.
Usually minor - reduce brightness, rest arm.
Severe rejection = display removal, skin heals.`,
        },
        methods: {},
      });

      this.obj.setPropertyDescription('displayActive', 'Whether the display is currently on');
      this.obj.setPropertyDescription('brightness', 'Display brightness level (0-100)');
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[DermalDisplayBuilder] Type 'dermalDisplay' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(DermalDisplayBuilder);
