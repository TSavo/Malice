# Continuum Stage 1: Clothing

The player emerges from registration. They need clothes.

---

## Context

**Trigger:** Player completes chargen and registration at City Services

**Player State:**
- Just registered as a citizen
- No clothing (or hospital gown)
- No possessions
- Standing in Immigration Services

**Goal:** Player is dressed in basic citizen attire

---

## The NPC: City Services Greeter

A bureaucrat assigned to help new registrants. Patient, efficient, slightly tired.

**Inject into NPC prompt:**
```
You are a City Services greeter helping a new citizen get started.

CURRENT TASK: Get ${player.name} dressed in basic citizen clothing.

YOUR APPROACH:
- This is routine. You do this many times a day.
- Be helpful but not warm — bureaucratic friendliness.
- Explain what you're doing, but don't over-explain.
- If they struggle with commands, give hints once.

LOCATION: Lead them to the outfitting area near Immigration Services.

WHAT THEY GET:
- Underwear, pants, shirt, boots
- One set, standard issue
- They can buy more later with credits
```

---

## Dialogue Patterns

### Leading them to clothing

> "Follow me. Can't have you walking around like that."
>
> *Leads to outfitting area.*
>
> "Standard issue. One set. Find something your size."

### If they need help

> "Pick it up with 'get'. Put it on with 'wear'. Underwear first, then pants, then the rest."

### If they ask for more

> "One set per citizen. You want variety, earn credits and buy it."

### When done

> "Good enough. You look like you belong now. Come on, I'll show you around."

---

## Actions to Take

### Spawn clothing if needed

If the outfitting area doesn't have pre-stocked clothing:

```javascript
// Spawn basic clothing set
const room = player.location;

const underwear = await $recycler.create($clothing, {
  name: 'plain underwear',
  aliases: ['underwear'],
  covers: ['waist'],
  layer: 1,
  warmth: 2,
  material: 'cotton',
  color: 'gray',
  condition: 60,
});
await underwear.moveTo(room);

const pants = await $recycler.create($clothing, {
  name: 'work pants',
  aliases: ['pants', 'trousers'],
  covers: ['leftLeg', 'rightLeg', 'waist'],
  layer: 2,
  warmth: 15,
  material: 'canvas',
  color: 'brown',
  condition: 55,
});
await pants.moveTo(room);

const shirt = await $recycler.create($clothing, {
  name: 'utility shirt',
  aliases: ['shirt'],
  covers: ['torso', 'leftArm', 'rightArm'],
  layer: 2,
  warmth: 10,
  material: 'cotton',
  color: 'gray',
  condition: 50,
});
await shirt.moveTo(room);

const boots = await $recycler.create($clothing, {
  name: 'work boots',
  aliases: ['boots', 'shoes'],
  covers: ['feet'],
  layer: 2,
  warmth: 8,
  protection: 5,
  material: 'leather',
  color: 'black',
  condition: 45,
});
await boots.moveTo(room);
```

### Or use the tailor

```javascript
// Dress player directly using AI tailor
await $tailor.dress(player, { context: 'new citizen, basic work clothes' });
```

---

## What to Track

After clothing is complete:

```javascript
await $.notes.add(player.id, `
  ONBOARDING PROGRESS:
  - Path: Continuum
  - Stage 1: Clothing - COMPLETE
  - Issued: Basic citizen attire
  - Next: Stage 2 (Orientation)
`, ['onboarding', 'continuum', 'progress']);
```

---

## Edge Cases

### Player already has clothes
> Skip this stage. Note it and move to orientation.

### Player refuses to dress
> Greeter shrugs: "Your choice. The tour starts in five minutes."
> Note the refusal. Proceed anyway. They'll figure it out.

### Player takes too long
> Greeter: "I've got other arrivals. Put on the clothes or come find me when you're ready."
> Don't force it. The city-ai can pick up later.

---

## Next Stage

Once dressed, proceed to [02-orientation.md](./02-orientation.md).

---

*This document is an AI playbook. The city-ai makes decisions based on these guidelines.*
