import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Cyberware prototype
 * Base for all cybernetic implants that replace body parts
 */
export class CyberwareBuilder implements Builder {
  static provides = ['cyberware'];
  static depends = ['describable'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('cyberware');
    if (existing) {
      this.obj = existing;
    } else {
      const describable = await this.manager.load('describable');
      if (!describable) throw new Error('Describable type not found');

      this.obj = await this.manager.define('cyberware', describable, {
        properties: {
          name: 'Cyberware',
          description: 'A cybernetic implant',
          weight: 200,
          slot: null,
          installedIn: null,
          installedOn: null,
          replacedPart: null,
          powerDraw: 0,
          installAbilities: '',
          condition: 100,

          abilities: `Cybernetic implant. Replaces biological body part.

INSTALLATION: Requires ripper doc with surgical-kit. Patient must be
anesthetized or restrained. Doc removes biological part from socket,
keeps it. Cyberware attaches to nervous system. Recovery time varies.

REMOVAL: Requires ripper doc with surgical-kit. Doc detaches from
nervous system, removes from socket. Host loses granted abilities.
Socket remains empty until replacement installed.

REJECTION: Some hosts reject chrome. Signs: inflammation, pain,
glitching. Immunosuppressants help. Severe rejection = emergency removal.

MAINTENANCE: Chrome degrades. Rippers can service/repair. Neglected
chrome malfunctions - abilities become unreliable. Condition tracks
overall state 0-100.`,
        },
        methods: {},
      });

      this.obj.setPropertyDescription(
        'slot',
        'Body part slot this replaces (eye, arm, spine, etc.)',
      );
      this.obj.setPropertyDescription(
        'installedIn',
        'Body part slot name when installed',
      );
      this.obj.setPropertyDescription(
        'installedOn',
        'Host agent when installed',
      );
      this.obj.setPropertyDescription(
        'replacedPart',
        'Reference to biological part that was replaced',
      );
      this.obj.setPropertyDescription(
        'powerDraw',
        'Power consumption in mW per hour (0 = passive/bioelectric)',
      );
      this.obj.setPropertyDescription(
        'installAbilities',
        'Ability text to add to host when installed',
      );
      this.obj.setPropertyDescription(
        'condition',
        'Chrome condition 0-100, degrades without maintenance',
      );
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[CyberwareBuilder] Type 'cyberware' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(CyberwareBuilder);
