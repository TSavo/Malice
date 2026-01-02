import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Internal Clock prototype
 * Precision chronometer implanted in brain
 */
export class InternalClockBuilder implements Builder {
  static provides = ['internalClock'];
  static depends = ['cyberware'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('internalClock');
    if (existing) {
      this.obj = existing;
    } else {
      const cyberware = await this.manager.load('cyberware');
      if (!cyberware) throw new Error('Cyberware type not found');

      this.obj = await this.manager.define('internalClock', cyberware, {
        properties: {
          name: 'Internal Clock',
          description: 'A precision chronometer implanted in the brain',
          weight: 20,
          slot: 'brain',
          alarms: [],

          installAbilities: `INTERNAL CLOCK: Perfect timekeeping without devices.
Always know exact time. Wake on schedule without alarm.
Precise sense of duration. Never late unless you choose.`,

          abilities: `Precision chronometer implanted in brain.

INSTALLATION: Requires surgical-kit + micro-tools + anesthetic.
Smallest brain chrome. Low risk procedure.
Tiny unit near temporal lobe. Minimal neural connection.
Add installAbilities text to host abilities under "INTERNAL CLOCK".
Recovery: 24 hours. Slight headache, occasional time confusion.

REMOVAL: Simple extraction. No significant side effects.
May feel time-blind for a few days after removal.

TIMEKEEPING: Know exact time always. Synced to satellite time.
Works underground, underwater, in shielded rooms - internal battery.
Accuracy: nanosecond precision. Never need a watch again.
Time zones automatically tracked based on location.

SCHEDULING: Set internal alarms. Wake at exact moment.
Appointments tracked mentally. Reminders without devices.
Perfect punctuality if you want it. Never miss a deadline.

DURATION: Know exactly how long something takes.
Precise sense of elapsed time. Useful for timed tasks.
Cooking, combat, interrogation resistance - know when breaks should come.
Time distortion from drugs/trauma becomes noticeable.

COUNTDOWN: Mental countdown timers. Multiple simultaneous.
Useful for coordinated operations. Breach in 3... 2... 1...

SLEEP: Set wake time. Body wakes naturally at that moment.
No jarring alarms. Peaceful awakening at precise time.
Can override with emergency wake if startled.

REJECTION: Extremely rare. Signs: time slippage, confusion.
Usually means unit failure, not rejection. Simple replacement.

MAINTENANCE: Battery replacement every 5 years.
Otherwise maintenance-free. Most reliable chrome available.`,
        },
        methods: {},
      });

      this.obj.setPropertyDescription('alarms', 'Array of scheduled alarm times');
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[InternalClockBuilder] Type 'internalClock' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(InternalClockBuilder);
