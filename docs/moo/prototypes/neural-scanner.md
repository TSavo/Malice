# Neural Scanner

> **Abilities-First**: Neural scanners use abilities to describe detection capabilities and operation. The AI narrator interprets scan attempts. See `docs/ABILITIES-FIRST.md`.

Room-sized installation for detecting Neural Log agents (Loggers/Neurals). The only reliable method for identifying synthetic consciousness.

## Overview

**Neural Scanner** (`$neuralScanner`) is a massive installation that:
- Detects the `isArtificialHuman` property marking Neural Log agents
- Requires dedicated power supply (50kW)
- Room-sized equipment similar to MRI machines
- Extremely expensive (15-20 million credits)
- Very rare - only a handful exist in the city

**The Mask** (`$.theMask`) is the only *portable* neural scanning device. See [The Mask & Pluribus](./mask-pluribus.md).

## Properties

```javascript
{
  name: 'Neural Scanner',
  description: 'A massive cylindrical chamber dominates the room...',
  weight: 850000,           // 850kg - not portable
  powered: true,            // Whether main power connected
  operational: true,        // Whether functioning
  calibrated: true,         // Whether sensors calibrated
  lastCalibration: null,    // Timestamp of last calibration
  scanInProgress: false,    // Whether currently scanning
  cooldownUntil: 0,         // Timestamp when ready for next scan
}
```

### Property Descriptions

- `powered`: Whether main power is connected. Requires industrial 50kW supply.
- `operational`: Whether machine is functioning. False if damaged or missing components.
- `calibrated`: Whether sensors are calibrated. Requires quarterly maintenance.
- `lastCalibration`: Timestamp of most recent calibration. Null if never calibrated.
- `scanInProgress`: Whether a scan is currently running. Subject must remain still.
- `cooldownUntil`: Timestamp when machine will be ready for next scan. 15 minute cooldown.

## Operation

### How Scanning Works

1. **Subject Preparation**: Subject must lie inside the scanner bore
2. **Immobilization**: Padded restraints required - movement corrupts readings
3. **Scan Duration**: 3-5 minutes full-body scan
4. **Technician Required**: Trained operator at control console
5. **Results Display**: Holographic readout with color coding

### Results

The scanner reads the subject's `isArtificialHuman` property directly:

| Result | Display | Meaning |
|--------|---------|---------|
| TRUE | Red hologram + klaxon | SYNTHETIC - Neural Logger detected |
| FALSE or ABSENT | Green hologram | ORGANIC - Confirmed human |
| ERROR | Yellow hologram | INCONCLUSIVE - Movement/interference/fault |

### Cooldown Period

- **15 minutes** between scans required
- Superconducting coils must stabilize
- `cooldownUntil` property tracks next available scan time
- Rushing scans risks equipment damage or corrupted results

### Power Requirements

- **50kW draw** during active scan
- Dedicated industrial power supply required
- Power fluctuations corrupt readings
- Backup generators mandatory
- `powered` property tracks power connection status

## Accuracy

- **99.97% accuracy** when properly calibrated and subject is still
- **False positives**: Essentially impossible - organic brains cannot mimic synthetic patterns
- **False negatives**: Only occur with:
  - Subject movement during scan
  - Equipment malfunction
  - Uncalibrated sensors
  - Power fluctuations

## Maintenance

- **Quarterly calibration** required by certified technician
- `calibrated` property tracks calibration status
- `lastCalibration` stores timestamp of most recent service
- Uncalibrated machines may produce false negatives (dangerous!)

## Cost & Rarity

### Installation Cost
- **15-20 million credits** (possibly more)
- Rare earth superconductors
- Quantum processing units
- Pre-Burning neural mapping algorithms (lost technology, few copies remain)
- Specialized installation by trained engineers

### Existing Installations

Only a handful exist in the city:
- **Immigration Services** - Mandatory screening for new arrivals
- **CorpSec Central** - Interrogation facility
- **Smith Tower medical wing** - Rumored
- **The Cartel** - May have captured one (unconfirmed)

Estimated total: Fewer than a dozen functioning units in the entire Pacific Northwest.

## Political & Legal Implications

### Admissibility
- Scanner readings are **admissible evidence** in both factions
- Positive scan = **execution** by either faction
- No trial, no appeal
- Both Pluribus and the Cartel consider Loggers existential threats

### Coercion
- Subjects **can refuse** scanning, but refusal raises suspicion
- CorpSec can **compel scanning with warrant**
- The Cartel doesn't ask nicely
- "If you have nothing to hide, you have nothing to fear"

### Operator Responsibility
Operating this equipment carries **immense responsibility**:
- False positive = wrongful execution
- False negative = Logger goes undetected
- Equipment maintenance is critical
- Calibration cannot be skipped

## Countermeasures

### Logger Defense
Neural Log agents have **no defense** against neural scanning:
- Cannot fake organic patterns
- Synthetic architecture is fundamental to their consciousness
- Only protection: **avoid being scanned**
- Rumors of experimental neural shielding implants (unconfirmed)

### Portable Alternative
**The Mask** is the only portable neural scanning device:
- Reads `isArtificialHuman` with a glance
- Currently held by Sister Gray
- If she finds a wearer she trusts, the game changes
- Until then, room-sized installations are the only option

## Lore Context

From the Neural Log documentation:

> "Neural scanning devices detect the subtle patterns that distinguish synthetic consciousness from organic. The patterns are invisible to standard observation — you need specialized equipment designed to read the architecture of thought itself."

Neural scanners read the **architecture of thought itself**. Patterns invisible to:
- Standard observation
- Biometrics
- Behavioral analysis
- Blood tests / DNA scans
- Medical exams

The technology represents **pre-Burning lost knowledge**. Building new scanners is possible but extraordinarily expensive and difficult.

## Usage Example

```javascript
// Create a neural scanner installation
const scanner = await $recycler.create($neuralScanner, {
  name: 'Immigration Neural Scanner',
  location: immigrationRoomId,
});

// Check if ready to scan
const now = Date.now();
if (scanner.cooldownUntil > now) {
  const minutesLeft = Math.ceil((scanner.cooldownUntil - now) / 60000);
  return `Scanner cooling down. Ready in ${minutesLeft} minutes.`;
}

if (!scanner.powered) {
  return 'Scanner offline. Power supply disconnected.';
}

if (!scanner.calibrated) {
  return 'Scanner requires calibration. Contact maintenance.';
}

// AI-driven scan operation via abilities
// The narrator interprets "scan [subject]" by reading scanner.abilities
// and checking subject.isArtificialHuman directly

// Example narrator response for Logger detection:
// "The scanner hums to life. Restraints engage. Three minutes of stillness.
// Then the hologram flares RED. Klaxons sound. The display reads: SYNTHETIC.
// Guards rush in. The subject's fate is sealed."
```

## Related Documentation

- [The Mask & Pluribus](./mask-pluribus.md) - Portable neural scanning device
- [Security System](./security.md) - Access control and biometric systems
- [Neural Log Lore](../../city-ai/NEURAL-LOG.md) - Full lore on Loggers and detection
- [Wearables](./wearables.md) - Wearable prototype (The Mask's parent)

## Bootstrap

Prototype defined in: `src/database/bootstrap/prototypes/neural-scanner-builder.ts`

Inherits from: `$furniture` (not portable, room fixture)

Auto-aliased as: `$neuralScanner`
