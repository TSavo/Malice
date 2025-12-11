# MOO Programming Documentation

Comprehensive guides for programming in Malice's MOO layer.

## Reference

- **[Quick Reference](./reference/quick-reference.md)** ✅ - Fast lookup for common tasks
- **[Common Patterns](./reference/patterns.md)** ✅ - Reusable code patterns
- **[Anti-Patterns](./reference/anti-patterns.md)** ✅ - What NOT to do

## Getting Started

New to Malice? Start here:

- **[Architecture Overview](./architecture.md)** ✅ - Three-layer system design (TypeScript core, MOO bootstrap, database content)
- **[Core Concepts](./core-concepts.md)** ✅ - Objects, properties, methods, references, the $ system
- **[Best Practices](./best-practices.md)** ✅ - The Golden Rule: compose utilities, never duplicate logic

## Utility Libraries

### Text & Formatting
- **[$.english](./utilities/english.md)** ✅ - Grammar: articles, plurals, conjugation, ordinals, lists
- **[$.pronoun](./utilities/pronoun.md)** ✅ - Perspective-aware messaging (you vs Bob)
- **[$.format](./utilities/format.md)** ✅ - Text layout: columns, tables, templates, compose()
- **[$.proportional](./utilities/proportional.md)** ✅ - Proportional message selection (health bars, hunger, etc.)

### Object Management
- **[$.recycler](./utilities/recycler.md)** ✅ - Object lifecycle: create, destroy, recycle, pooling
- **[$.memento](./utilities/memento.md)** ✅ - Object cloning and serialization (templates)

### Concurrency & Actions
- **[$.exclusions](./utilities/exclusions.md)** ✅ - Action exclusion system (sitting/walking conflicts)
- **[$.mutex](./utilities/mutex.md)** ✅ - Object-based locks with timeouts
- **[$.scheduler](./utilities/scheduler.md)** ✅ - Persistent job scheduling (heartbeats, decay, timed events)

### Interactive Systems
- **[$.prompt](./utilities/prompt.md)** ✅ - Interactive prompts and menus (question, yesorno, choice, multiline)
- **[$.emote](./utilities/emote.md)** ✅ - Sensory-aware emotes (visual, audio, smell, taste)

## Prototypes

- **[Prototype System](./prototypes.md)** ✅ - Overview, hierarchy, Base+Implementation pattern, inheritance, pass()
- **[Room System](./prototypes/rooms.md)** ✅ - Rooms, exits, elevators, coordinates, crowd mechanics, environmental properties
- **[World Building](./prototypes/world-building.md)** ✅ - WorldBuilder, BuildingBuilder, Pioneer Square grid, placeholder system
- **[Plot System](./prototypes/plots.md)** ✅ - Narrative event logs, jobs, hooks, dynamic quests, $.plot/$.plotSpawner/$.jobBoard

### Detailed Guides (Coming Soon)
- [Agent System](./prototypes/agents.md) - Players, verbs, movement, perception
- [Body System](./prototypes/body.md) - Human bodies, body parts, metabolism
- [Item Types](./prototypes/items.md) - Food, drink, clothing, wearables, stackables

## Advanced Topics

- **[Verb System](./advanced/verbs.md)** ✅ - Dynamic per-player verb registration, hooks, patterns
- **[Sensory System](./advanced/sensory-system.md)** ✅ - Five senses (see, hear, smell, taste, feel), tell() vs sensory methods
- **[Object Creation & Movement](./advanced/objects.md)** ✅ - $.recycler, moveTo(), hooks, best practices
- **[Bootstrap System](./advanced/bootstrap.md)** ✅ - Three-phase bootstrap, creating custom utilities, builder pattern

### Additional Topics (Coming Soon)
- [Admin Commands](./advanced/admin-commands.md) - @dig, @create, @set, @eval
- [Change Streams](./advanced/change-streams.md) - Reactive data flow
- [Hot Reloading](./advanced/hot-reloading.md) - Update code without restarts

---

**Status:** Documentation is being actively migrated from `/docs/moo-programming.md` (4022 lines). Files marked with ✅ are complete.
