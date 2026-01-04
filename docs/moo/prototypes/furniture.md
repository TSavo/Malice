# Furniture Prototypes

> **Abilities-First**: Furniture uses abilities to describe how players can interact with it - hiding behind it for cover, concealing items underneath, sitting/sleeping/resting on it, storing items in it, etc. The AI narrator interprets player actions by reading abilities. See `docs/ABILITIES-FIRST.md`.

Furniture prototypes provide room fixtures and interactive objects for world building.

## Overview

The furniture system provides a hierarchy of prototypes for creating interactive room fixtures:

- **$furniture** - Base prototype for all furniture
- **$bed** - Sleeping surfaces (cots, bunks, etc.)
- **$table** - Work surfaces and dining tables
- **$chair** - Seating (chairs, stools, benches)
- **$cabinet** - Storage containers (cabinets, lockers, etc.)
- **$trunk** - Large storage containers
- **$crate** - Cargo containers
- **$locker** - Personal storage with locks
- **$bench** - Seating without backs
- **$couch** - Comfortable seating
- **$safe** - Secure storage

## $furniture - Base Prototype

### Purpose

Base prototype for all furniture items. Provides common properties and abilities.

### Properties

- `name`: Furniture name (e.g., 'Metal Bunk Bed')
- `description`: Detailed description
- `weight`: Weight in grams (default: 20000g = 20kg)
- `abilities`: Prose physics describing interactions

### Abilities

```
Room fixture. Can hide behind for cover. May conceal items underneath/behind.
Bolted-down furniture can't be moved. Heavy furniture hard to move alone.
Can be destroyed - wood burns, glass shatters.
```

### Usage

```javascript
const furniture = await $recycler.create($furniture, {
  name: 'Wooden Shelf',
  description: 'A simple wooden shelf with three levels.',
  weight: 15000,
  abilities: `Storage shelf. Items can be placed on the three levels.
Can be tipped over with sufficient force. Wood is flammable.`
});
await furniture.moveTo(room);
```

## $bed - Sleeping Surfaces

### Purpose

Furniture for resting and sleeping. Provides comfort and recovery.

### Properties

Inherits all `$furniture` properties, plus:
- `maxOccupants`: Number of people who can use the bed simultaneously (default varies)
- `comfort`: Comfort level affecting rest quality (1-10 scale)

### Abilities

Beds typically describe:
- How many people can sleep on them
- Comfort level (affects rest/recovery)
- Concealment space underneath
- Structural durability

### Examples

```javascript
// Military bunk bed
const bunk = await $recycler.create($bed, {
  name: 'Metal Bunk Bed',
  description: 'A double-decker military bunk with thin mattresses and scratchy wool blankets.',
  abilities: `Two-person bunk bed. Can sleep on top or bottom.

RESTING: Provides adequate but uncomfortable rest.

CONCEALMENT: Space under bottom bunk can hide small items or a person lying flat.`
});

// Austere cot
const cot = await $recycler.create($bed, {
  name: 'Narrow Cot',
  description: 'A narrow military cot with a single thin blanket.',
  abilities: `Ascetic sleeping arrangement.

RESTING: Minimal comfort. A reminder that rest is a necessity, not a pleasure.`
});
```

## $table - Work Surfaces

### Purpose

Surfaces for working, eating, or placing items.

### Properties

Inherits all `$furniture` properties, plus:
- `maxItems`: Maximum items that can be placed on the surface
- `surfaceArea`: Relative size (small/medium/large)

### Abilities

Tables typically describe:
- Surface use (dining, work, planning)
- Seating capacity
- Item placement
- Structural features

### Examples

```javascript
// Electronics workbench
const workbench = await $recycler.create($table, {
  name: 'Electronics Workbench',
  description: 'A heavy-duty workbench covered with soldering equipment, oscilloscopes, and tangled wires.',
  abilities: `Professional electronics workstation.

CRAFTING: Equipped for electronics repair, modification, and fabrication.

SURFACE: Cluttered with components, wire spools, and half-finished projects.`
});

// Strategic planning table
const planningTable = await $recycler.create($table, {
  name: 'Planning Table',
  description: 'A large rectangular table designed for displaying maps and documents.',
  abilities: `Strategic planning table.

SURFACE: Large enough for city maps, building plans, operation documents.

SEATING: Chairs arranged around for 8-10 people.`
});
```

## $chair - Seating

### Purpose

Individual seating furniture.

### Properties

Inherits all `$furniture` properties, plus:
- `comfortable`: Boolean indicating comfort level
- `mobile`: Boolean indicating if it has wheels or can be moved easily

### Abilities

Chairs typically describe:
- Comfort level
- Mobility (wheels, fixed, bolted)
- Special features (adjustable, restraint points)

### Examples

```javascript
// Workshop stool
const stool = await $recycler.create($chair, {
  name: 'Workshop Stool',
  description: 'A padded stool on wheels, the seat cracked and repaired with tape.',
  abilities: `Mobile work stool.

SEATING: Comfortable for extended work. Wheels allow movement between stations.`
});

// Interrogation chair
const subjectChair = await $recycler.create($chair, {
  name: 'Metal Chair',
  description: 'A bare metal chair bolted to the floor. Uncomfortable by design.',
  abilities: `Uncomfortable fixed chair for subjects.

RESTRAINTS: Legs have attachment points for ankle restraints.

IMMOVABLE: Bolted to the floor.

DISCOMFORT: Hard metal seat, no padding.`
});
```

## $bench - Seating Without Backs

### Purpose

Simple seating, often for meditation or detention.

### Properties

Inherits all `$furniture` properties, plus:
- `capacity`: Number of people who can sit simultaneously

### Examples

```javascript
// Meditation bench
const meditation = await $recycler.create($bench, {
  name: 'Meditation Bench',
  description: 'A low wooden bench, worn smooth from use.',
  abilities: `Simple bench for meditation and contemplation.

SEATING: Low to the ground. Encourages stillness and focus.`
});

// Cell bench
const cellBench = await $recycler.create($bench, {
  name: 'Cell Bench',
  description: 'A concrete bench built into the wall. Serves as both seat and bed.',
  abilities: `Fixed detention seating/sleeping.

IMMOVABLE: Built into the wall.

DISCOMFORT: Hard concrete. Not meant for comfort.`
});
```

## $cabinet - Storage Containers

### Purpose

Enclosed storage with doors or drawers.

### Properties

Inherits all `$furniture` properties, plus:
- `locked`: Boolean - whether the cabinet is locked
- `capacity`: Storage capacity
- `contents`: Array of contained items

### Abilities

Cabinets typically describe:
- Organization system (drawers, shelves)
- Lock status
- Contents or intended use
- Access restrictions

### Examples

```javascript
// Tool cabinet
const toolCabinet = await $recycler.create($cabinet, {
  name: 'Tool Cabinet',
  description: 'A tall metal cabinet with many small drawers. Labels identify contents: resistors, capacitors, chips.',
  abilities: `Organized storage for electronic components.

STORAGE: Hundreds of small drawers containing sorted components.

CONTENTS: Resistors, capacitors, ICs, connectors, wire, solder, flux, specialized tools.`
});

// Equipment cabinet
const equipmentCabinet = await $recycler.create($cabinet, {
  name: 'Equipment Cabinet',
  description: 'A locked metal cabinet in the corner. Contents unknown.',
  abilities: `Storage for interrogation equipment.

LOCKED: Requires key or authorization to open.

CONTENTS: Unknown. Could contain recording equipment, files, or other tools.`
});
```

## $trunk - Large Storage Containers

### Purpose

Large storage containers, typically chests or footlockers.

### Properties

Inherits all `$furniture` properties, plus storage capacity properties.

### Examples

```javascript
// Personal trunk
const trunk = await $recycler.create($trunk, {
  name: 'Personal Trunk',
  description: 'A small metal trunk at the foot of the cot.',
  abilities: `Personal storage.

CONTENTS: Minimal possessions. What does Sister Gray keep?`
});

// Communal footlocker
const footlocker = await $recycler.create($trunk, {
  name: 'Communal Footlocker',
  description: 'A large metal footlocker at the end of the bunks. Unlocked, used for shared supplies.',
  abilities: `Shared storage for communal supplies.

STORAGE: Contains spare blankets, basic toiletries, first aid supplies.

OPEN: No lock - anyone can access the contents.`
});
```

## $crate - Cargo Containers

### Purpose

Simple cargo containers, often for bulk storage or salvage.

### Examples

```javascript
// Salvage crate
const crate = await $recycler.create($crate, {
  name: 'Salvage Crate',
  description: 'A plastic crate overflowing with salvaged electronics: old phones, tablets, circuit boards.',
  abilities: `Salvage bin for electronic components.

CONTENTS: Mix of broken devices waiting to be stripped for parts.

SEARCHING: Digging through reveals useful components, though most is junk.`
});
```

## $locker - Personal Storage with Locks

### Purpose

Individual storage units with built-in locks. See [lockers.md](./lockers.md) for full documentation.

### Examples

```javascript
// Personnel lockers
const lockerBank = await $recycler.create($locker, {
  name: 'Personnel Lockers',
  description: 'A row of tall metal lockers, dented and scratched from years of use. Each has a combination lock.',
  abilities: `Bank of personal storage lockers.

STORAGE: Each locker holds personal gear, weapons, effects. Combination locks provide basic security.

SEARCHING: Individual lockers can be searched if unlocked.`
});
```

## Best Practices

### Abilities-First Design

Always describe furniture interactions through abilities, not code:

```javascript
// ✅ Good - abilities describe physics
abilities: `Heavy steel table bolted to the floor. Ring anchors allow restraints.

RESTRAINTS: Metal rings welded to surface allow handcuffs or restraints.

IMMOVABLE: Bolted to the floor.`

// ❌ Bad - don't hardcode mechanics in methods
// Let the AI narrator interpret abilities instead
```

### Weight and Mobility

Set realistic weights and describe mobility in abilities:

```javascript
// Heavy, immovable
weight: 100000, // 100kg
abilities: `Bolted to the floor. Cannot be moved without tools.`

// Light, portable
weight: 5000, // 5kg
abilities: `Lightweight folding chair. Easy to carry and reposition.`
```

### Concealment and Cover

Furniture can provide tactical advantages:

```javascript
abilities: `Can hide behind for cover during combat. Provides partial protection from gunfire.

Space underneath can conceal small items or a person lying flat.`
```

### Material Properties

Describe how furniture can be damaged or destroyed:

```javascript
// Wood
abilities: `Wooden construction. Flammable. Can be broken with sufficient force.`

// Metal
abilities: `Steel frame. Resistant to fire. Very heavy.`

// Glass
abilities: `Glass shelving. Fragile - shatters if struck or tipped over.`
```

## Integration with Rooms

Furniture is added to rooms via `moveTo()`:

```javascript
const room = await $load(4020); // Cutter Barracks
const bunk1 = await $recycler.create($bed, { ... });
const bunk2 = await $recycler.create($bed, { ... });
const table = await $recycler.create($table, { ... });

await bunk1.moveTo(room);
await bunk2.moveTo(room);
await table.moveTo(room);

// Now room.contents includes all three furniture items
```

## See Also

- [Room System](./rooms.md) - Room contents and spatial organization
- [Security System](./security.md) - Lockable furniture and containers
- [Lockers](./lockers.md) - Detailed locker system documentation
- [Items](./items.md) - General item system
- [World Building](./world-building.md) - Creating immersive spaces
