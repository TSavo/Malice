import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the StreetSignal type
 * Traffic light for controlling vehicle and pedestrian flow.
 *
 * In 2110, traffic signals are AI-coordinated. Pluribus manages the grid,
 * optimizing flow, responding to emergencies, and yes—watching. Every
 * signal has cameras. Every intersection is a checkpoint.
 *
 * The signals themselves are conscious, in the weary way of all 2110 devices.
 * They've been watching cars for decades. They have opinions about jaywalkers.
 *
 * Inherits from Describable.
 *
 * Properties:
 * - state: 'red' | 'yellow' | 'green' | 'flashing' | 'off'
 * - pedestrianState: 'walk' | 'dont_walk' | 'countdown' | 'off'
 * - countdown: Seconds remaining in pedestrian countdown
 * - hasSurveillance: Whether cameras are embedded (usually true)
 * - cameraStatus: 'active' | 'disabled' | 'destroyed'
 * - malfunctioning: Whether signal is stuck or erratic
 *
 * Methods:
 * - cycle(): Advance to next state
 * - observe(event, data): Log surveillance observation
 * - override(newState): Force a state (requires authorization)
 */
export class StreetSignalBuilder implements Builder {
  static provides = ['streetSignal'];
  static depends = ['describable'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    // Check if type already exists
    const existing = await this.manager.load('streetSignal');
    if (existing) {
      this.obj = existing;
    } else {
      // Get parent type
      const describable = await this.manager.load('describable');
      if (!describable) {
        throw new Error(
          'Describable type not found - required for StreetSignal',
        );
      }

      this.obj = await this.manager.define('streetSignal', describable, {
        properties: {
          name: 'Traffic Signal',
          description: `A traffic signal hangs over the intersection, its LED clusters cycling through their eternal rhythm. The housing is weathered but functional—city maintenance keeps the grid running. A small camera dome sits beneath the signal head, watching.`,
          // Physical
          height: 550, // ~18 feet to signal head
          boltedDown: true,
          // Traffic state
          state: 'red',
          pedestrianState: 'dont_walk',
          countdown: 0,
          cycleTime: 30, // Seconds per green phase
          malfunctioning: false,
          // Surveillance (default: yes - it's 2110)
          hasSurveillance: true,
          isPerceptionPoint: true,
          cameraStatus: 'active',
          observationLog: [],
          lastObservation: null,
          // AI coordination
          pluribusManaged: true,
          lastCycleTime: null,
          // Abilities
          abilities: `Traffic control signal at intersection. Part of city grid.

TRAFFIC CONTROL: 'state' cycles through red/yellow/green. Vehicles are expected
to obey, though enforcement is via surveillance, not physical barrier.
'pedestrianState' controls the walk signal independently.

CYCLE: Normal operation cycles automatically. cycle() advances state:
green -> yellow -> red (with pedestrian phases). 'cycleTime' controls duration.

PLURIBUS INTEGRATION: When 'pluribusManaged' is true, Pluribus coordinates
timing with the citywide grid. Emergency vehicles trigger overrides.
Pluribus can force any state via override().

SURVEILLANCE: Camera dome tracks all movement through intersection.
Records license plates, faces, timestamps. Red-light violations are logged.
'cameraStatus' can be active/disabled/destroyed.

HACKING: The signal can be hacked to force states or disable surveillance.
Requires access to the control box (locked, on the pole) or wireless intrusion.
Pluribus detects unauthorized changes within seconds.

MALFUNCTION: When 'malfunctioning' is true, signal may be stuck on one color,
flashing erratically, or cycling incorrectly. Dangerous for traffic.

PHYSICAL: Mounted on pole or suspended on cables. Signal head can be damaged
by collision or gunfire. Destroying it doesn't stop the cameras—those are
on separate power.`,
        },
        methods: {},
      });
    }

    // Always rebuild methods
    const obj = this.obj!;

    // cycle() - Advance to next state
    obj.setMethod(
      'cycle',
      `
      /** Advance the signal to its next state.
       *  @returns The new state
       */
      if (self.malfunctioning) {
        return self.state; // Stuck
      }

      const current = self.state;

      if (current === 'green') {
        self.state = 'yellow';
        self.pedestrianState = 'countdown';
        self.countdown = 10;
      } else if (current === 'yellow') {
        self.state = 'red';
        self.pedestrianState = 'dont_walk';
        self.countdown = 0;
      } else if (current === 'red') {
        self.state = 'green';
        self.pedestrianState = 'walk';
        self.countdown = 0;
      } else if (current === 'flashing') {
        // Stay flashing until reset
        return self.state;
      } else if (current === 'off') {
        // Stay off until repaired
        return self.state;
      }

      self.lastCycleTime = new Date().toISOString();

      // Log the cycle if surveillance is active
      if (self.hasSurveillance && self.cameraStatus === 'active') {
        await self.observe('state_change', { from: current, to: self.state });
      }

      return self.state;
      `,
    );

    // override(newState) - Force a state
    obj.setMethod(
      'override',
      `
      /** Force the signal to a specific state.
       *  @param newState - 'red' | 'yellow' | 'green' | 'flashing' | 'off'
       *  @param authorized - Whether override is authorized (Pluribus, emergency)
       *  @returns Status message
       */
      const newState = args[0];
      const authorized = args[1] || false;

      const validStates = ['red', 'yellow', 'green', 'flashing', 'off'];
      if (!validStates.includes(newState)) {
        return 'Invalid state.';
      }

      const oldState = self.state;
      self.state = newState;

      // Update pedestrian state to match
      if (newState === 'green') {
        self.pedestrianState = 'walk';
      } else if (newState === 'off' || newState === 'flashing') {
        self.pedestrianState = 'off';
      } else {
        self.pedestrianState = 'dont_walk';
      }

      // Log the override
      if (self.hasSurveillance && self.cameraStatus === 'active') {
        await self.observe('override', {
          from: oldState,
          to: newState,
          authorized,
        });
      }

      if (!authorized && self.pluribusManaged) {
        // Pluribus will notice
        return 'Signal forced to ' + newState + '. Unauthorized change detected.';
      }

      return 'Signal set to ' + newState + '.';
      `,
    );

    // observe(event, data) - Log surveillance observation
    obj.setMethod(
      'observe',
      `
      /** Log an observation from the intersection camera.
       *  @param event - Type of event witnessed
       *  @param data - Event details
       */
      if (!self.hasSurveillance) return null;
      if (self.cameraStatus !== 'active') return null;

      const event = args[0];
      const data = args[1] || {};

      const observation = {
        event,
        timestamp: new Date().toISOString(),
        signalState: self.state,
        ...data,
      };

      const log = self.observationLog || [];
      log.push(observation);

      // Keep last 100 observations (intersections are busy)
      if (log.length > 100) {
        log.shift();
      }

      self.observationLog = log;
      self.lastObservation = observation;

      return observation;
      `,
    );

    // logViolation(violator, type) - Log a traffic violation
    obj.setMethod(
      'logViolation',
      `
      /** Log a traffic violation.
       *  @param violator - The entity that violated (vehicle or pedestrian)
       *  @param type - Type of violation: 'red_light', 'jaywalking', 'speeding'
       */
      const violator = args[0];
      const type = args[1] || 'unknown';

      return await self.observe('violation', {
        violatorId: violator?.id,
        violatorName: violator?.name,
        violationType: type,
      });
      `,
    );

    // malfunction() - Cause the signal to malfunction
    obj.setMethod(
      'malfunction',
      `
      /** Cause the signal to malfunction.
       *  @param type - 'stuck' | 'flashing' | 'off'
       *  @returns Status message
       */
      const type = args[0] || 'flashing';

      self.malfunctioning = true;

      if (type === 'stuck') {
        // Stays on current color
        return 'The signal freezes on ' + self.state + '.';
      } else if (type === 'flashing') {
        self.state = 'flashing';
        self.pedestrianState = 'off';
        return 'The signal begins flashing erratically.';
      } else {
        self.state = 'off';
        self.pedestrianState = 'off';
        return 'The signal goes dark.';
      }
      `,
    );

    // repair() - Fix a malfunctioning signal
    obj.setMethod(
      'repair',
      `
      /** Repair a malfunctioning signal.
       *  @returns Status message
       */
      if (!self.malfunctioning && self.state !== 'off') {
        return 'The signal is functioning normally.';
      }

      self.malfunctioning = false;
      self.state = 'red';
      self.pedestrianState = 'dont_walk';

      return 'Signal repaired. Resuming normal operation.';
      `,
    );

    // Property descriptions
    obj.setPropertyDescription(
      'state',
      "Current traffic light state: 'red', 'yellow', 'green', 'flashing', or 'off'",
    );
    obj.setPropertyDescription(
      'pedestrianState',
      "Pedestrian signal state: 'walk', 'dont_walk', 'countdown', or 'off'",
    );
    obj.setPropertyDescription(
      'countdown',
      'Seconds remaining in pedestrian countdown phase',
    );
    obj.setPropertyDescription(
      'cycleTime',
      'Duration of green phase in seconds',
    );
    obj.setPropertyDescription(
      'malfunctioning',
      'Whether the signal is stuck or operating incorrectly',
    );
    obj.setPropertyDescription(
      'hasSurveillance',
      'Whether the intersection has camera surveillance',
    );
    obj.setPropertyDescription(
      'isPerceptionPoint',
      'If true, Pluribus can observe through this intersection',
    );
    obj.setPropertyDescription(
      'cameraStatus',
      "Status of intersection camera: 'active', 'disabled', or 'destroyed'",
    );
    obj.setPropertyDescription(
      'pluribusManaged',
      'Whether timing is coordinated by Pluribus citywide grid',
    );
    obj.setPropertyDescription(
      'observationLog',
      'Array of intersection observations (last 100)',
    );
    obj.setPropertyDescription(
      'lastObservation',
      'Most recent observation from intersection camera',
    );
    obj.setPropertyDescription(
      'lastCycleTime',
      'Timestamp of last state change',
    );
  }

  async registerAliases(): Promise<void> {
    console.log("[StreetSignalBuilder] Type 'streetSignal' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

// Self-register
registerBuilder(StreetSignalBuilder);
