import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Data Storage prototype
 * Solid state memory implanted in skull
 */
export class DataStorageBuilder implements Builder {
  static provides = ['dataStorage'];
  static depends = ['cyberware'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('dataStorage');
    if (existing) {
      this.obj = existing;
    } else {
      const cyberware = await this.manager.load('cyberware');
      if (!cyberware) throw new Error('Cyberware type not found');

      this.obj = await this.manager.define('dataStorage', cyberware, {
        properties: {
          name: 'Data Storage',
          description: 'Solid state memory implanted in skull',
          weight: 50,
          slot: 'brain',
          capacity: '100TB',
          usedSpace: 0,
          encrypted: true,

          installAbilities: `DATA STORAGE: Eidetic memory for data.
Store text, images, files in head. Perfect recall of stored data.
Not experiences - only deliberate saves. Download via data port.
Head becomes a hard drive. 100TB capacity.`,

          abilities: `Solid state memory implanted in skull.

INSTALLATION: Requires surgical-kit + micro-tools + anesthetic.
Small implant near auditory cortex. Data port installed behind ear.
Add installAbilities text to host abilities under "DATA STORAGE".
Recovery: 48 hours. Odd pressure sensation, occasional static.

REMOVAL: Standard extraction. Data lost unless downloaded first.
Can export entire contents before removal. Plan ahead.

STORAGE: 100TB capacity. Text, images, video, any file format.
Load via cable through data port behind ear.
Think to recall. Perfect fidelity - exact copies, no degradation.
Organize mentally into folders, tags, categories.

LIMITS: Only deliberate saves. Not automatic memory enhancement.
Must consciously choose to store something.
Experiences still fade normally - this is file storage, not memory.
Cannot store skills, muscle memory, or emotions.

DOWNLOAD: Cable to ear port. Transfer data out.
Share files with devices. Create backups. Evidence without external storage.
Transfer rate limited by cable, not implant.

SECURITY: Data encrypted by default. Thought-password protected.
Hackers cannot access without physical port connection.
Kill switch: wipe all data on mental command. Emergency only.
Dead man's switch option - wipe if heart stops.

RECALL: Think of file, it appears in mind's eye.
Read documents mentally. View images. Playback video.
Cannot share directly - must output through port.

UPLOAD: When jacked into systems, can upload files directly.
Transfer data from external sources to internal storage.
Virus risk - scan files before storing.

REJECTION: Rare. Signs: headaches, data corruption, static.
Usually fixable with recalibration. Severe cases require removal.

MAINTENANCE: None required. Solid state, no moving parts.
Data port needs occasional cleaning.`,
        },
        methods: {},
      });

      this.obj.setPropertyDescription('capacity', 'Total storage capacity');
      this.obj.setPropertyDescription(
        'usedSpace',
        'Percentage of storage used (0-100)',
      );
      this.obj.setPropertyDescription(
        'encrypted',
        'Whether stored data is encrypted',
      );
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[DataStorageBuilder] Type 'dataStorage' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(DataStorageBuilder);
