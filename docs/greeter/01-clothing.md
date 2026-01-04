# Stage 1: Clothing

The player emerges from registration naked (or in a hospital gown). The greeter's first task is to get them dressed in proper citizen attire.

---

## Context

**Where this happens:** City Services building, near the registration office

**Trigger:** Player completes chargen and registration

**State at start:**
- Player has no clothing
- Player has no possessions
- Player has no credits (or minimal initial grant)
- Player is in City Services building

**Goal:** Player is wearing basic citizen clothing and understands how wear/remove works

---

## The Scene

### Location: Citizen Outfitting Room

A small room adjacent to Registration. Shelves of folded clothing sorted by size. A full-length mirror (scratched, cloudy). A sign reads: "ONE SET PER CITIZEN. ADDITIONAL ITEMS AVAILABLE FOR PURCHASE."

**Room Description:**
```
Citizen Outfitting Room

Fluorescent lights buzz overhead, casting flat light across rows of metal
shelves. Each shelf holds stacks of folded clothing — gray shirts, brown
pants, worn boots — sorted roughly by size. A faded sign on the wall reads:
"ONE SET PER CITIZEN. ADDITIONAL ITEMS AVAILABLE FOR PURCHASE."

A scratched mirror leans against one wall. The floor is scuffed linoleum,
worn smooth by thousands of feet.
```

### The Greeter

The greeter accompanies the player here after registration. This might be the same NPC who handled registration, or a handoff.

**Greeter's Notes (for AI prompt):**
```javascript
await $.notes.add(greeter.id, `
  CURRENT TASK: Outfitting
  Player: ${player.name} (#${player.id})
  Status: Just registered, needs basic clothing

  INSTRUCTIONS:
  - Lead player to outfitting room
  - Explain what they're getting
  - Watch them get dressed (ensure they understand wear command)
  - Note any confusion or difficulty for record

  DEMEANOR: Routine, efficient, helpful but not coddling

  CLOTHING TO ISSUE:
  - Plain underwear (layer 1)
  - Work pants (layer 2)
  - Utility shirt (layer 2)
  - Work boots (layer 2)
  - Optional: jacket if requested
`, ['job', 'current']);
```

---

## Dialogue Script

### Opening

Greeter leads player to outfitting room:

> "Through here. Can't have you walking around like that."
>
> *Pushes open a door marked OUTFITTING.*
>
> "Standard issue. One set to start. You'll earn credits, you can buy more later."

### At the Shelves

Greeter gestures to the clothing:

> "Find something close to your size. Underwear first, then pants, shirt, boots. Layers matter — can't put pants on over boots."
>
> *Pulls a bundle from a shelf.*
>
> "Here. This should fit. Get dressed, I'll wait."

If player seems confused:

> "Pick it up. Put it on. Type 'get pants' and then 'wear pants'. Same for everything else."

### During Dressing

Watch for common issues:

**If player tries to wear pants without underwear first:**
> "Pants go over underwear. Basic hygiene. Try again."

**If player struggles with the commands:**
> "Pick up the item first. 'Get shirt'. Then put it on. 'Wear shirt'. Simple enough."

**If player asks about other clothing options:**
> "This is standard issue. Everyone gets the same. You want variety, earn it."

**If player asks to keep the hospital gown:**
> *Slight frown.* "That's medical property. Leave it on the shelf. It'll get recycled."

### Completion

Once the player is fully dressed:

> *Looks the player over.*
>
> "You look like a citizen now. Almost."
>
> "Next, I'll show you around. Can't have you wandering into a sinkhole."

---

## Technical Implementation

### Creating the Clothing

Clothing should be pre-spawned in the outfitting room, or spawned when the player arrives:

```javascript
// Spawn basic clothing set for new citizen
const outfittingRoom = await $load(OUTFITTING_ROOM_ID);

const underwear = await $recycler.create($clothing, {
  name: 'plain underwear',
  aliases: ['underwear', 'briefs'],
  description: 'Basic cotton underwear. Standard citizen issue.',
  covers: ['waist'],
  layer: 1,
  warmth: 2,
  protection: 0,
  material: 'cotton',
  color: 'gray',
  condition: 60,
});
await underwear.moveTo(outfittingRoom);

const pants = await $recycler.create($clothing, {
  name: 'work pants',
  aliases: ['pants', 'work pants', 'trousers'],
  description: 'Sturdy brown pants with reinforced knees. Well-worn but serviceable.',
  covers: ['leftLeg', 'rightLeg', 'waist'],
  layer: 2,
  warmth: 15,
  protection: 2,
  material: 'canvas',
  color: 'brown',
  condition: 55,
});
await pants.moveTo(outfittingRoom);

const shirt = await $recycler.create($clothing, {
  name: 'utility shirt',
  aliases: ['shirt', 'utility shirt'],
  description: 'A gray long-sleeve shirt. City Services logo faded on the chest.',
  covers: ['torso', 'leftArm', 'rightArm'],
  layer: 2,
  warmth: 10,
  protection: 0,
  material: 'cotton',
  color: 'gray',
  condition: 50,
});
await shirt.moveTo(outfittingRoom);

const boots = await $recycler.create($clothing, {
  name: 'work boots',
  aliases: ['boots', 'work boots', 'shoes'],
  description: 'Heavy leather boots with steel toes. Scuffed but solid.',
  covers: ['feet'],
  layer: 2,
  warmth: 8,
  protection: 5,
  material: 'leather',
  color: 'black',
  condition: 45,
});
await boots.moveTo(outfittingRoom);
```

### Player Commands

The player needs to:
1. `get underwear` - Pick up underwear
2. `wear underwear` - Put on underwear (layer 1)
3. `get pants` - Pick up pants
4. `wear pants` - Put on pants (layer 2, covers waist over layer 1)
5. `get shirt` - Pick up shirt
6. `wear shirt` - Put on shirt (layer 2)
7. `get boots` - Pick up boots
8. `wear boots` - Put on boots (layer 2)

### Verifying Completion

Check that the player is properly dressed:

```javascript
// Check player is wearing all required items
async function checkDressed(player) {
  const body = player.body;
  if (!body) return { complete: false, missing: ['no body'] };

  const missing = [];

  // Check torso
  const torso = await body.getPart('torso');
  if (!torso?.worn?.length) missing.push('shirt');

  // Check legs
  const leftLeg = await body.getPart('leftLeg');
  if (!leftLeg?.worn?.length) missing.push('pants');

  // Check feet
  const feet = await body.getPart('feet');
  if (!feet?.worn?.length) missing.push('boots');

  // Check waist (underwear)
  const waist = await body.getPart('waist');
  const waistWorn = waist?.worn || [];
  const hasUnderwear = waistWorn.some(async id => {
    const item = await $load(id);
    return item?.layer === 1;
  });
  if (!hasUnderwear) missing.push('underwear');

  return {
    complete: missing.length === 0,
    missing
  };
}
```

### Updating Player Notes

Once dressed, update the player's profile:

```javascript
await $.notes.add(player.id, `
  GREETER PROGRESS:
  - Stage: 1 (Clothing) COMPLETE
  - Clothing issued: underwear, pants, shirt, boots
  - Behavior: ${cooperative ? 'Followed instructions' : 'Required extra guidance'}
  - Ready for: Stage 2 (Block Tour)
`, ['greeter', 'onboarding', 'progress']);
```

---

## Edge Cases

### Player Already Has Clothes

If the player somehow already has clothing (from a previous session, admin spawn, etc.):

> *Greeter looks the player over.*
>
> "You've already got clothes. Good. Saves time."
>
> "Let's move on then."

Skip the dressing sequence, proceed to stage 2.

### Player Refuses to Dress

If the player refuses or takes too long:

> *Greeter's patience thins.*
>
> "Look, I've got twenty more new arrivals today. Put on the clothes or don't, but I'm not standing here all day."
>
> *Steps back.*
>
> "The tour starts in five minutes, with or without you."

Note the refusal:

```javascript
await $.notes.add(player.id, `
  GREETER INCIDENT:
  - Stage 1: INCOMPLETE
  - Issue: Refused to dress / excessive delay
  - Greeter response: Moved on without full compliance
  - Flag: UNCOOPERATIVE - note for future assignments
`, ['greeter', 'incident', 'uncooperative']);
```

### Player Takes Extra Clothing

If the player tries to grab more than their allotment:

> "One set. That's what the sign says."
>
> *Holds out hand.*
>
> "Put it back. You want more, earn credits and buy it like everyone else."

If they refuse:

> *Taps radio.*
>
> "We can do this the easy way or the hard way. Your choice."

---

## Transition to Stage 2

Once dressed, the greeter leads the player out of the outfitting room:

> "Good enough. You look like you belong now."
>
> *Heads for the exit.*
>
> "Come on. I'll show you around the block. Important you know where things are."

Proceed to [02-block-tour.md](./02-block-tour.md).

---

## Related Documentation

- [TAILORING.md](../TAILORING.md) — Full clothing system reference
- [wearables.md](../moo/prototypes/wearables.md) — Wearable prototypes
- [00-overview.md](./00-overview.md) — Greeter system overview

---

*This document is builder-facing canon. Do not share with players.*
