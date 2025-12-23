# MOO Programming Documentation

Comprehensive guides for programming in Malice's MOO layer.

## MCP Integration (Direct MOO Code)

**NEW**: Malice uses direct MOO code execution via `execute_moo_code`. No wrappers - just native MOO:

```typescript
execute_moo_code({
  code: `
    // Use $recycler to create objects
    const room = await $recycler.create($room, {
      name: "Hall",
      x: 0, y: 0, z: 0
    });

    // Create and move item
    const torch = await $recycler.create($item, {name: "torch"});
    await torch.moveTo(room, player);

    return {roomId: room.id, torchId: torch.id};
  `
})
```

**Benefits**: No wrapper layer, composable code, full MOO context ($, $load(), $recycler, $aliases), HTTP Basic Auth for player variable.

See:
- **[Direct MOO Manipulation Skill](../../.claude/skills/moo-manipulation/SKILL.md)** - Canonical guide
- **[MCP Tools Reference](../MCP-TOOLS.md)** - Legacy tool reference
- **[CLAUDE.md](../../CLAUDE.md#mcp-integration)** - Direct MOO philosophy

## Reference

- **[Quick Reference](./reference/quick-reference.md)** ✅ - Fast lookup for common tasks
- **[Common Patterns](./reference/patterns.md)** ✅ - Reusable code patterns
- **[Anti-Patterns](./reference/anti-patterns.md)** ✅ - What NOT to do

### System References

- **[$ Globals](./reference/globals.md)** ✅ - Core aliases and global services
- **[Prototypes](./reference/prototypes.md)** ✅ - Complete prototype hierarchy and API tables
- **[Verb System](./reference/verbs.md)** ✅ - Patterns, registration, dispatch, best practices
- **[Prompt System](./reference/prompts.md)** ✅ - Menus, prompts, and interaction flow
- **[Event Hooks](./reference/hooks.md)** ✅ - Hook points, conventions, lifecycle patterns
- **[Plot System](./reference/plots.md)** ✅ - Plot logs, jobs, triggers, story plumbing
- **[Body System](./reference/body-system.md)** ✅ - Bodies, parts, metabolism helpers
- **[Exclusions System](./reference/exclusions.md)** ✅ - Mutual exclusion rules and action conflicts
- **[AI/NPC System](./reference/ai-npc.md)** ✅ - NPC architecture, prompts, fixtures

## Getting Started

New to Malice? Start here:

- **[Architecture Overview](./architecture.md)** ✅ - Three-layer system design (TypeScript core, MOO bootstrap, database content)
- **[Core Concepts](./core-concepts.md)** ✅ - Objects, properties, methods, references, the $ system
- **[Best Practices](./best-practices.md)** ✅ - The Golden Rule: compose utilities, never duplicate logic

## Utility Libraries

### Text & Formatting
- **[$english](./utilities/english.md)** ✅ - Grammar: articles, plurals, conjugation, ordinals, lists
- **[$pronoun](./utilities/pronoun.md)** ✅ - Perspective-aware messaging (you vs Bob)
- **[$format](./utilities/format.md)** ✅ - Text layout: columns, tables, templates, compose()
- **[$proportional](./utilities/proportional.md)** ✅ - Proportional message selection (health bars, hunger, etc.)

### Object Management
- **[$recycler](./utilities/recycler.md)** ✅ - Object lifecycle: create, destroy, recycle, pooling
- **[$memento](./utilities/memento.md)** ✅ - Object cloning and serialization (templates)

### Concurrency & Actions
- **[$exclusions](./utilities/exclusions.md)** ✅ - Action exclusion system (sitting/walking conflicts)
- **[$mutex](./utilities/mutex.md)** ✅ - Object-based locks with timeouts
- **[$scheduler](./utilities/scheduler.md)** ✅ - Persistent job scheduling (heartbeats, decay, timed events)

### Interactive Systems
- **[$prompt](./utilities/prompt.md)** ✅ - Interactive prompts and menus (question, yesorno, choice, multiline)
- **[$emote](./utilities/emote.md)** ✅ - Sensory-aware emotes (visual, audio, smell, taste)

## Prototypes

### Core Systems
- **[Prototype System](./prototypes.md)** ✅ - Overview, hierarchy, Base+Implementation pattern, inheritance, pass()
- **[Agent System](./prototypes/agents.md)** ✅ - Players, NPCs, verbs, movement, perception
- **[Body System](./prototypes/body.md)** ✅ - Human bodies, body parts, metabolism, digestion
- **[Room System](./prototypes/rooms.md)** ✅ - Rooms, exits, elevators, coordinates, crowd mechanics

### Items & Equipment
- **[Item Types](./prototypes/items.md)** ✅ - Overview of all item prototypes
- **[Wearables](./prototypes/wearables.md)** ✅ - Clothing, armor, body coverage, layering
- **[Consumables](./prototypes/consumables.md)** ✅ - Food, drink, effects, nutrition
- **[Stackables](./prototypes/stackables.md)** ✅ - Currency, ammo, resources
- **[Decay System](./prototypes/decay.md)** ✅ - Spoilage, damage, time-based decay

### World Systems
- **[World Building](./prototypes/world-building.md)** ✅ - WorldBuilder, BuildingBuilder, Pioneer Square grid
- **[Plot System](./prototypes/plots.md)** ✅ - Narrative event logs, jobs, hooks, dynamic quests
- **[Security System](./prototypes/security.md)** ✅ - Locks, keypads, biometrics, access control
- **[Doors](./prototypes/door.md)** ✅ - Door mechanics, locks, open/close
- **[Signs](./prototypes/signs.md)** ✅ - Readable signs and notices
- **[Elevators](./prototypes/elevator.md)** ✅ - Multi-floor vertical transport

### Economy & Social
- **[Bank System](./prototypes/bank.md)** ✅ - Electronic currency, accounts, transactions
- **[Factions](./prototypes/faction.md)** ✅ - Faction membership, relationships, reputation
- **[Lockers](./prototypes/lockers.md)** ✅ - Rentable storage, access control
- **[Phones](./prototypes/phones.md)** ✅ - Communication devices

### Combat & Health
- **[Wounds](./prototypes/wounds.md)** ✅ - Injury system, bleeding, infection, healing

## AI & NPCs

- **[Building Great NPCs](./npc-guide.md)** ✅ - Practical guide: spawn, personality, memories, system prompts
- **[$ai Registry](./ai.md)** ✅ - AI-controlled humans, spawn, $query(), API reference
- **[NPC Agent System](../npc-agent.md)** ✅ - Technical architecture, MCP integration

## Advanced Topics

- **[Verb System](./advanced/verbs.md)** ✅ - Dynamic per-player verb registration, hooks, patterns
- **[Sensory System](./advanced/sensory-system.md)** ✅ - Five senses (see, hear, smell, taste, feel), tell() vs sensory methods
- **[Object Creation & Movement](./advanced/objects.md)** ✅ - $recycler, moveTo(), hooks, best practices
- **[Bootstrap System](./advanced/bootstrap.md)** ✅ - Three-phase bootstrap, creating custom utilities, builder pattern

### Additional Topics (Coming Soon)
- [Admin Commands](./reference/prototypes.md) - @dig, @create, @set, @eval
- [Change Streams](../../CHANGE-STREAMS.md) - Reactive data flow and cache invalidation
- [Hot Reloading](./architecture.md) - What is hot-reloadable (and what isn’t)

---

**Status:** Core docs complete; some advanced topics are still pending.

