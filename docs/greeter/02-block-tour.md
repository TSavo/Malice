# Stage 2: Block Tour

The greeter walks the player around the immediate area, showing them the essential locations they'll need for survival.

---

## Context

**Where this starts:** City Services building entrance

**Trigger:** Stage 1 (Clothing) complete

**State at start:**
- Player is dressed in basic citizen attire
- Player knows basic inventory/wear commands
- Player is unfamiliar with the area
- Player has no credits (or minimal initial grant)

**Goal:** Player can navigate to essential services and understands the block layout

---

## The Tour Route

The tour covers a simple loop around the City Services block:

```
START: City Services entrance (-14, +9)
  ↓
1. Job Board Terminal (inside City Services)
  ↓
2. Ration Dispensary (City Services or nearby)
  ↓
3. Exit to street, point out street signs
  ↓
4. Walk east along Yesler to Occidental
  ↓
5. Point out Occidental Park (the plaza)
  ↓
6. Walk south to S. Main
  ↓
7. Emergency Shelter / Dormitory entrance
  ↓
8. Return to City Services
```

---

## The Scene

### City Services Building

**Building Description:**
```
City Services

A converted two-story building with reinforced doors and barred windows.
The City Services logo — a stylized "CS" inside a gear — adorns the entrance.
Inside, bureaucrats process the endless paperwork of survival. Outside, a
steady trickle of citizens come and go.

The building hums with activity: the whir of terminals, the murmur of voices,
the occasional burst of static from a radio.
```

### The Greeter

**Greeter's Notes (for AI prompt):**
```javascript
await $.notes.add(greeter.id, `
  CURRENT TASK: Orientation Tour
  Player: ${player.name} (#${player.id})
  Status: Just dressed, needs basic orientation

  TOUR STOPS:
  1. Job Board Terminal - show how to check work orders
  2. Ration Dispensary - explain daily rations
  3. Street signs - explain coordinate system
  4. Occidental Park - public space, mention underground access
  5. Dormitory - where they'll sleep tonight

  DEMEANOR: Brisk, informative, pointing things out efficiently

  DETAILS TO MENTION:
  - Street names and how to read directions
  - Curfew exists (don't wander at night)
  - Stay in the footprint (outside is dangerous)
  - Report problems to CorpSec or City Services
`, ['job', 'current']);
```

---

## Dialogue Script

### Starting the Tour

Greeter leads player out of the outfitting room:

> "Follow me. Won't take long, but pay attention. This information might save your life."
>
> *Heads toward the building entrance.*
>
> "First, the things you'll need every day."

### Stop 1: Job Board Terminal

Near the entrance of City Services, a wall-mounted terminal:

> *Gestures at a scratched screen embedded in the wall.*
>
> "Job board. This is where you find work. Work means credits. Credits mean food, housing, everything."
>
> "Touch the screen, it'll show what's available. Accept a job, complete it, get paid. Simple enough."

**If player asks about jobs:**
> "Starts with simple stuff. Deliveries, mostly. Prove you're reliable, you get better work."
>
> "We'll get you set up with something after the tour."

**If player asks about credits:**
> "Digital currency. Pluribus tracks everything. Earn credits for work, spend them on rations, housing, supplies."
>
> "Check your balance at any terminal. You've probably got a small starting grant — don't spend it all at once."

### Stop 2: Ration Dispensary

A vending machine-like device with a biometric scanner:

> *Taps the dispenser.*
>
> "Ration dispenser. Every citizen gets daily rations. Scan your hand, it knows who you are."
>
> "Basic rations are free. Better food costs credits. You'll figure out what you can afford."

**If player asks what rations include:**
> "Protein block. Hydration pack. Vitamin supplement. Keeps you alive, not much more."
>
> "The upgraded options are worth saving for. Real bread. Actual vegetables, sometimes."

**If player asks about going without:**
> "Don't. The body has limits. Skip too many meals, you slow down. Keep skipping, you stop."
>
> "System tracks your intake. Miss too many pickups, someone comes checking on you."

### Stop 3: The Street

Greeter leads player outside onto the street:

> *Steps out into the gray daylight.*
>
> "Streets have names. Learn them. 'Go north on 2nd' is more useful than 'go that way.'"
>
> *Points at a faded street sign.*
>
> "This is 2nd Avenue South. It runs north-south. The cross streets run east-west: King, Jackson, Main, Washington, Yesler."
>
> "City Services is at about 2nd and Yesler. Remember that — it's your anchor point."

**If player asks about navigation:**
> "North is toward the water — you'll hit a collapsed seawall eventually. South goes into the Industrial district. East gets you to the old Chinatown. West is the waterfront, what's left of it."
>
> "Stay within the footprint. Outside is ruins, scavengers, things that'll kill you. Pluribus can't help you out there."

### Stop 4: Walking East

Greeter walks player east along Yesler Way:

> *Walking.*
>
> "The Footprint — that's what we call the safe zone. Pioneer Square, mostly. Pluribus maintains it. Power, water, security."
>
> "You'll learn the boundaries. The patrols will remind you if you forget."

**While walking, observations:**

> *Passes other citizens.*
>
> "See how people move with purpose? Nobody stands around. Standing around gets noticed."

> *Points at a camera on a lamppost.*
>
> "Cameras everywhere. Some people find that unsettling. I find it reassuring. CorpSec responds to problems. Can't respond if they don't see them."

### Stop 5: Occidental Park

A plaza with dead trees and benches:

> *Enters the plaza.*
>
> "Occidental Park. Public space. People gather here, rest, trade information."
>
> *Glances down at a grated access point.*
>
> "Underground access. The old Seattle's down there — tunnels, basements, things from before. Stay out unless you've got business there. Easy to get lost. Easier to get killed."

**If player asks about the Underground:**
> "Scavengers use it. Smugglers. Worse. CorpSec doesn't patrol down there much. You go down, you're on your own."
>
> *Shrugs.*
>
> "Some people prefer it that way. Most people don't come back."

### Stop 6: Walking South

Greeter walks player south toward S. Main:

> "The blocks are laid out on a grid. Buildings between the streets. Sidewalks along the edges. Makes navigation easy once you get used to it."

**While walking:**

> "Smith Tower is north of here. Tallest building in the area. Good landmark. If you can see it, you can find your way home."

### Stop 7: Emergency Shelter / Dormitory

A building entrance with "CITIZEN HOUSING - DORMITORY" stenciled above the door:

> *Stops at the entrance.*
>
> "Dormitory. Where you'll sleep tonight. Maybe longer, depending on your work record."
>
> "Free beds for registered citizens. Not comfortable, not private, but safe. Better than the street."

**If player asks about housing options:**
> "Starts here. Prove you're reliable, you get a bunk — assigned, just for you. Keep proving it, you get a room."
>
> "Eventually, your own apartment. Real door. Real lock. Real privacy. That takes time and credits."

**If player asks about tonight:**
> "Show up before curfew. Find an empty bed. Keep your hands to yourself. Don't make trouble."
>
> "CorpSec checks IDs at the door. Registered citizens only. You're registered, so no problem."

### Stop 8: Return to City Services

Greeter leads player back:

> *Walking back.*
>
> "That's the basics. Job board, rations, shelter, streets. Everything else you'll figure out as you go."
>
> *Pauses.*
>
> "Questions?"

---

## Handling Questions

### Common Questions

**"What's CorpSec?"**
> "Corporate Security. They keep order. Don't cause problems, they won't bother you. Cause problems, they respond efficiently."

**"What's Pluribus?"**
> "The system. The infrastructure. The thing that keeps the lights on and the water running. Some people call it the AI that runs the city. I call it the thing that signs my paychecks."

**"What happens if I break rules?"**
> "Depends on the rule. Minor stuff, you get a warning. Marks go on your record. Too many marks, you lose privileges. Housing. Job access. Rations."
>
> "Major stuff... CorpSec handles it. You don't want them to handle it."

**"Is there anywhere to relax?"**
> "Occidental Park. Some bars open in the evening — they'll take credits or barter. Grand Central Arcade has a social space."
>
> "Relaxing comes after work. Work comes first."

**"What's outside the Footprint?"**
> "Ruins. Collapse. The Long Dark didn't leave much. Scavenger territory, mostly. Some buildings are still standing, but the infrastructure's gone."
>
> "Pluribus is expanding. Slowly. But for now, stay inside the safe zone."

---

## Technical Implementation

### Movement Tracking

Track that the player has visited key locations:

```javascript
// Tour waypoints
const tourStops = [
  { name: 'job_board', location: CITY_SERVICES_ID, visited: false },
  { name: 'rations', location: DISPENSARY_ID, visited: false },
  { name: 'street', location: YESLER_2ND_ID, visited: false },
  { name: 'park', location: OCCIDENTAL_PARK_ID, visited: false },
  { name: 'dormitory', location: DORMITORY_ID, visited: false },
];

// Update as player visits each location
player.onEnterRoom = async (room) => {
  const stop = tourStops.find(s => s.location === room.id);
  if (stop && !stop.visited) {
    stop.visited = true;
    // Trigger greeter commentary if they're together
  }
};
```

### Updating Player Notes

After the tour, update progress:

```javascript
await $.notes.add(player.id, `
  GREETER PROGRESS:
  - Stage: 2 (Block Tour) COMPLETE
  - Locations visited: job board, rations, park, dormitory
  - Engagement: ${askedQuestions ? 'Active, asked questions' : 'Quiet, followed along'}
  - Ready for: Stage 3 (First Courier Job)
`, ['greeter', 'onboarding', 'progress']);
```

---

## Edge Cases

### Player Wanders Off

If the player leaves the greeter during the tour:

> *Greeter doesn't chase.*
>
> (To themselves) "Another independent one."

Wait briefly. If player returns:

> "Back? Good. Let's continue."

If player doesn't return within a few minutes, note and proceed:

```javascript
await $.notes.add(player.id, `
  GREETER INCIDENT:
  - Stage 2: PARTIAL
  - Issue: Wandered off during tour
  - Stops completed: ${completedStops.join(', ')}
  - Flag: INDEPENDENT - may need less hand-holding or more supervision
`, ['greeter', 'incident']);
```

The greeter can find them later to offer Stage 3.

### Player Asks Too Many Questions

If the player keeps asking questions and the tour drags:

> "Good questions, but we need to keep moving. Ask the rest later."
>
> "You'll have plenty of time to figure things out. Right now, basics only."

### Player Tries to Enter Underground

If the player attempts to go into the Underground during the tour:

> *Greeter grabs their arm.*
>
> "Not yet. Not without training, equipment, and a death wish."
>
> "Trust me on this one. The Underground isn't for new arrivals."

If player insists:

> "Your funeral. But not on my tour. Come back after you've been here a month and still think it's a good idea."

---

## Transition to Stage 3

At the end of the tour, back at City Services:

> "That's orientation done. You know where to eat, where to sleep, where to find work."
>
> *Heads toward the job board.*
>
> "Speaking of work — let's get you started. Nothing fancy, but it pays."

Proceed to [03-courier-job.md](./03-courier-job.md).

---

## Related Documentation

- [MAP.md](../city-ai/MAP.md) — Full Pioneer Square map
- [00-overview.md](./00-overview.md) — Greeter system overview
- [01-clothing.md](./01-clothing.md) — Previous stage

---

*This document is builder-facing canon. Do not share with players.*
