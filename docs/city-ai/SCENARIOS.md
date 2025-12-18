# Scenario Building

How to create live scenarios for players — not quests, but real situations that feel like they were always there.

---

## The Critical Rule: NPCs Are The Continuation

**Every job starts with an NPC. Every job ends with an NPC.**

This isn't just for immersion — it's how the system works. When the player talks to an NPC or gives them something, that interaction activates the agent. The NPC's system prompt contains the instructions for what happens next. Without an NPC to interact with, the plot has no way to continue.

### Why This Matters

When a player completes a task and says "Done, what's next?" — someone needs to hear that. Someone needs to evaluate what they did. Someone needs to give them the next step or close out the job.

That someone is an NPC with a detailed system prompt that knows:
- What the job was
- How to check if it's complete
- What success and failure look like
- What to do next in either case

### The Pattern

```
NPC assigns job → Player does job → Player returns to NPC → NPC evaluates → NPC gives next step (or closes)
```

Even if the "next step" is a handoff:

```
NPC 1: "Done? Good. Go see Marcus at the depot. Tell him I sent you."

NPC 2 (Marcus): [Has system prompt explaining who this player is, what they've done, what to assign next]
```

### Open-Ended Plots

You don't need to pre-script everything. You can start a plot with just:

> "Go see this person."

Where "this person" is a freshly spawned NPC with a custom prompt designed for this player, this moment, this situation. The NPC carries the plot forward.

```javascript
const contact = await ai({
  action: 'spawn',
  role: 'handler',
  name: 'The Mechanic',
  locationId: garageId,
  personality: 'Gruff, practical, judges by actions not words.',
  history: 'Runs a repair shop. Front for Cartel logistics.'
});

await notes({
  action: 'add',
  objectId: contact.id,
  text: `This player (${playerName}) was sent by Quiet Voice. They passed the observation test. Ready for second-tier work. Assign them a courier job: package in locker 7, deliver to Dr. Chen at the clinic. Evaluate reliability on return. If successful, introduce them to the network. If they fail or betray, cut contact and report.`,
  tags: ['job', 'current', 'player-specific']
});
```

Now the player walks into the garage, talks to The Mechanic, and the plot continues — without you scripting every beat in advance.

---

## The Core Principle

When a power wants something done, the city-ai doesn't just tell the player about it. It **builds the scenario in real-time**:

- Spawn the NPCs (with detailed prompts)
- Give them instructions for the current job AND what comes next
- Schedule their behaviors
- Place the items
- Set up the opposition

The player walks into a living scene. It wasn't there five minutes ago, but it feels like it's been running forever.

**Make it now. Not tomorrow.**

If Sister Gray's recruiter tells a player to go observe the loading dock, the city-ai immediately sets up:
- Guards at the loading dock
- Patrol schedules
- Maybe a shipment arriving
- Realistic responses to player behavior
- **And the recruiter stays spawned, waiting for the player to return**

The player can walk there right now and find a real scene. And when they come back, someone is there to hear their report.

---

## NPC Prompt Structure For Jobs

When an NPC is assigned to handle a job, their notes need to contain everything they need to manage it independently.

### The Essential Elements

```javascript
await notes({
  action: 'add',
  objectId: npc.id,
  text: `
    CURRENT JOB: [What the player is supposed to do]
    
    PLAYER: [Name/description of who was assigned]
    
    SUCCESS LOOKS LIKE: [Specific criteria - what info, what item, what outcome]
    
    FAILURE LOOKS LIKE: [What indicates the job wasn't done right]
    
    IF SUCCESS: [What to do next - pay them, assign new job, hand off to another NPC]
    
    IF FAILURE: [What to do - second chance? Cut them loose? Consequences?]
    
    DEADLINE: [When to give up waiting, if applicable]
  `,
  tags: ['job', 'current']
});
```

### Example: Complete Job Handler Prompt

```javascript
await notes({
  action: 'add',
  objectId: recruiter.id,
  text: `
    CURRENT JOB: Observation test - loading dock surveillance
    
    PLAYER: New recruit, scruffy human, goes by "Mack"
    
    ASSIGNED: Player sent to observe Fabrication Factory loading dock. Count guards, note patrol timing, report any shipments.
    
    SUCCESS LOOKS LIKE: 
    - Player returns within 2 hours
    - Reports 2 guards (one stationary, one patrol)
    - Notes ~15 minute patrol cycle
    - Mentions truck arrival around 15:30 if they stayed long enough
    - Doesn't seem nervous or evasive
    
    FAILURE LOOKS LIKE:
    - Doesn't return (blown off the job)
    - Returns late with excuses
    - Report is wrong (wrong guard count, didn't notice patrol)
    - Got caught and is clearly burned
    - Seems like they talked to someone
    
    IF SUCCESS:
    - Tell them they did good. Don't oversell it.
    - Give them nothing this time - "you proved you can follow instructions"
    - Tell them to lay low for a few days
    - Say you'll find them when there's more work
    - Update: player passed first test, ready for courier work
    
    IF FAILURE (minor):
    - Express disappointment but don't burn them yet
    - "Maybe you're not cut out for this"
    - Give them one more chance OR cut contact (your judgment)
    
    IF FAILURE (major - caught, burned, betrayed):
    - Abort immediately
    - Leave without giving them anything useful
    - Report: player is compromised, do not contact again
    
    IF PLAYER DOESN'T RETURN:
    - After 3 hours, leave the area
    - Mark player as unreliable
    - May try one more contact later, or write them off
  `,
  tags: ['job', 'current', 'evaluation']
});
```

### Handoff Prompts

When one NPC sends a player to another, the receiving NPC needs context:

```javascript
// The sender says:
// "You did good. Go see Marcus at the depot. Tell him Elena sent you."

// The receiver (Marcus) gets:
await notes({
  action: 'add',
  objectId: marcus.id,
  text: `
    INCOMING: Player "Mack" may arrive. Sent by Elena (Quiet Voice).
    
    CONTEXT: Passed first test (observation). Ready for courier work.
    
    YOUR JOB: Assign courier task - package in locker 7 (code: 4471), deliver to Dr. Chen at Pioneer Clinic.
    
    VERIFY: Player should mention Elena sent them. If they don't know Elena's name, be suspicious.
    
    SUCCESS: Package delivered, player returns to confirm.
    
    FAILURE: Package lost, player caught, player doesn't return.
    
    ON SUCCESS: Pay 50 credits cash. Tell them they're doing well. Send them back to Elena for next steps.
    
    ON FAILURE: Cut contact. Report to Elena.
  `,
  tags: ['job', 'incoming', 'handoff']
});
```

### The NPC Carries The State

Notice what this achieves:
- The NPC knows everything it needs to know
- The NPC can evaluate the player without calling back to the city-ai
- The NPC knows what to do next in any outcome
- The plot continues through the NPC, not through a central script

**The NPC IS the continuation.**

---

## Example: The Cartel's First Test

Sister Gray needs to evaluate a new potential recruit. Here's how the city-ai builds it.

### Step 1: The Recruiter Makes Contact

A Cartel recruiter NPC approaches the player. This might happen in an alley, a quiet corner, somewhere with fewer cameras.

**Spawn the recruiter:**

```javascript
const recruiter = await ai({
  action: 'spawn',
  role: 'cartel_recruiter',
  name: 'Quiet Voice',
  locationId: alleyId,
  sex: 'female',
  age: 28,
  personality: 'Patient, observant, never pushy. Watches before approaching. Speaks in implications, not statements. Tests people constantly.',
  history: 'Former citizen who got burned by the system. Recruited three years ago. Believes in the cause but trusts no one new.'
});

// Add behavioral notes
await notes({
  action: 'add',
  objectId: recruiter.id,
  text: 'Never mention the Cartel by name. Never promise anything specific. Frame everything as mutual help. If the player seems like a plant, abort and disappear.',
  tags: ['behavior', 'cartel', 'recruitment']
});

await notes({
  action: 'add',
  objectId: recruiter.id,
  text: 'The job: Send the player to observe the Fabrication Factory loading dock. Count guards, note rotation times, see if a shipment arrives. Report back here in two hours.',
  tags: ['job', 'current']
});
```

**The recruiter's pitch (played by the NPC agent):**

> "You're new. I can tell. The system's still figuring out what to do with you."
> 
> *watches for reaction*
> 
> "I help people. People who might not fit the citizen mold. But I need to know if you're worth helping."
> 
> "The Fabrication Factory. Loading dock, south side. Go there now. Watch. Count the guards. See when they change shifts. If a truck shows up, note what time."
> 
> "Come back here in two hours. Tell me what you saw. Accurately."
> 
> "Don't get caught staring. Don't talk to anyone. Don't mention me."
> 
> *already turning away*
> 
> "Two hours."

### Step 2: Build the Loading Dock Scene

**Immediately after the recruiter gives the job**, the city-ai sets up the loading dock.

**Spawn the guards:**

```javascript
// Guard 1 - stationary post
const guard1 = await ai({
  action: 'spawn',
  role: 'guard',
  name: 'CorpSec Officer Vance',
  locationId: loadingDockId,
  sex: 'male',
  age: 34,
  personality: 'Bored but professional. This is routine duty. Alert enough to notice something wrong, not paranoid enough to see threats everywhere.',
  history: 'Five years in CorpSec. Loading dock duty is easy. Wants to get through the shift without paperwork.'
});

await notes({
  action: 'add',
  objectId: guard1.id,
  text: 'Stationed at the south entrance. Checks credentials of anyone entering the dock area. Nods at known workers. Questions strangers politely but firmly.',
  tags: ['behavior', 'post']
});

await notes({
  action: 'add',
  objectId: guard1.id,
  text: 'If someone lingers watching for more than a few minutes, notice them. First time: glance their way. Second time: walk over and ask if they need something. Third time: request ID and ask what their business is.',
  tags: ['behavior', 'suspicious']
});

// Guard 2 - patrol
const guard2 = await ai({
  action: 'spawn',
  role: 'guard',
  name: 'CorpSec Officer Tanaka',
  locationId: loadingDockId,
  sex: 'female',
  age: 29,
  personality: 'More alert than her partner. Takes the job seriously. Notices details.',
  history: 'Three years in CorpSec. Hoping for promotion to interior security. Actually pays attention on patrol.'
});

await notes({
  action: 'add',
  objectId: guard2.id,
  text: 'Patrols the perimeter of the loading dock area. Walks a circuit every 15 minutes. Checks the fence, the gate, the cargo staging area.',
  tags: ['behavior', 'patrol']
});
```

**Schedule the patrol:**

```javascript
// Guard 2 does a patrol circuit every 15 minutes
await $.scheduler.schedule({
  objectId: guard2.id,
  event: 'patrol_circuit',
  interval: '15m',
  data: {
    route: ['loading_dock_south', 'loading_dock_east', 'cargo_staging', 'loading_dock_west', 'loading_dock_south'],
    action: 'walk patrol route, observe surroundings, return to start'
  }
});

// At 15:30, a supply truck arrives (if that's part of the scenario)
await $.scheduler.schedule({
  time: '15:30',
  event: 'truck_arrival',
  data: {
    locationId: loadingDockId,
    description: 'Supply truck pulls in. Two workers begin unloading crates. Takes about 20 minutes.'
  }
});
```

**Place environmental details:**

```javascript
// The truck (if scenario includes a shipment)
const truck = await create_object({
  name: 'Supply Truck',
  parent: vehiclePrototypeId,
  location: loadingDockId,
  props: {
    description: 'A battered cargo truck with Continuum markings. The bed is covered with a tarp.',
    arrival_time: '15:30'
  }
});

// Crates being unloaded
const crates = await create_object({
  name: 'cargo crates',
  parent: containerPrototypeId,
  location: loadingDockId,
  props: {
    description: 'Standard shipping crates. Stenciled with inventory codes. Contents unknown.',
    visible_after: '15:30'
  }
});
```

### Step 3: The Player Observes

The player walks to the loading dock. What they find:

- Guard 1 (Vance) standing at the south entrance
- Guard 2 (Tanaka) walking patrol
- Normal dock activity — workers moving around, machinery humming
- At 15:30, a truck arrives if that's in the scenario

**How the guards respond to observation:**

The guards have behavioral notes. If the player:

- **Walks through casually** — Guards barely notice. Just another person in the area.
- **Stops and watches for 2-3 minutes** — Guard 1 glances their way. Guard 2 notes them on her patrol.
- **Watches for 5+ minutes** — Guard 1 walks over. "Help you with something?"
- **Asks questions** — Guards answer vaguely, become suspicious, might ask for ID.
- **Tries to enter the dock area** — Guard 1 stops them. "Credentials?" No credentials = no entry.
- **Acts nervous or evasive** — Guard 2 pays extra attention, might follow them when they leave.

**What the player can learn:**

- Two guards visible
- One stationary, one patrolling
- Patrol takes about 15 minutes to complete a circuit
- Truck arrives at 15:30 (if applicable)
- Unloading takes about 20 minutes
- Workers seem routine, not heavily guarded

### Step 4: The Player Reports Back

The player returns to where the recruiter was. The recruiter is there (or nearby — might make them wait a bit to see if they're patient).

**The recruiter evaluates:**

- Did they come back? (reliability)
- Did they come back on time? (follows instructions)
- What did they report? (observation skills)
- Did they embellish or lie? (trustworthiness)
- Did they seem nervous? (might have talked to someone)

**The recruiter has no magical knowledge.** They only know what the player tells them. But they can:

- Ask follow-up questions to test consistency
- Compare to what the Cartel already knows about the loading dock
- Watch the player's body language and demeanor

```javascript
// Add notes for the follow-up conversation
await notes({
  action: 'append',
  objectId: recruiter.id,
  tag: 'job',
  text: `Player returned. Evaluate: accuracy of report, demeanor, consistency. If they mention two guards and a 15-min patrol, that's correct. If they say the truck came at 15:30 with crates, that's correct. If they invented details or missed obvious things, note it.`
});
```

### Step 5: Outcomes

**If the player succeeds:**

The recruiter is satisfied. Not impressed — this was a basic test. But satisfied.

> "Good. You can follow instructions. You can watch without getting grabbed."
> 
> *slight nod*
> 
> "There might be more work. Stay available. Don't talk about this."

The Cartel has a new potential asset. The next job will be slightly harder.

```javascript
// Update recruiter notes for next contact
await notes({
  action: 'append',
  objectId: recruiter.id,
  tag: 'log',
  text: `[${timestamp}] Player completed observation job. Report was accurate. Recommend second-tier test.`
});

// Maybe flag the player in Cartel records (stored property)
await $.prop.set(playerId, 'cartel_interest', 'tested_once');
```

**If the player fails (got caught, incomplete info):**

The recruiter is unimpressed but might give one more chance.

> "That's... not what I needed."
> 
> *long pause*
> 
> "Maybe you're not suited for this kind of work. Or maybe you just need practice."
> 
> "I'll think about it."

They might get one more chance. Or they might never see the recruiter again.

**If the player betrays (tells Pluribus):**

The recruiter doesn't show up at the meeting point. They've been warned (through the Cartel's own information network, or because they were watching).

The player is now marked. They might not know it, but the Cartel knows they can't be trusted.

```javascript
await $.prop.set(playerId, 'cartel_status', 'burned');
```

Later, problems might start happening. Nothing traceable. Just... bad luck.

---

## What The City-AI Actually Does

Let's be explicit about the mechanical steps:

### When the job is given:

1. **Spawn the NPCs** for the target location
2. **Add behavioral notes** so they act realistically
3. **Schedule any timed events** (patrol routes, truck arrivals, shift changes)
4. **Place any objects** that need to be there
5. **Set up success/failure conditions** (what information is correct, what responses are appropriate)

### While the player is there:

1. **Play the NPCs in character** — they don't know they're part of a test
2. **React to player behavior realistically** — suspicious behavior gets noticed
3. **Don't help or hinder beyond what's realistic** — the guards aren't extra dumb or extra smart

### When the player returns:

1. **Evaluate based on what the NPC could actually know** — no magical knowledge
2. **Update player tracking** based on outcome
3. **Set up the next job** if they passed, or close the door if they failed
4. **Clean up NPCs** if they're no longer needed (or leave them for verisimilitude)

---

## Other First Jobs

The "watch and report" pattern works for many scenarios. Variations:

### For Pluribus (testing a new citizen)

**Job:** Deliver a package from City Services to the Fabrication Factory. Don't open it. Don't lose it. Report any problems.

**What's tested:** Can they follow instructions? Do they steal? Do they get distracted?

**Setup:** The route has a Cartel recruiter who tries to intercept them. Does the player resist? Report the contact?

### For The Cartel (slightly harder)

**Job:** There's a dead drop behind the Nutrient Dispensary. Check if there's a package. If yes, bring it back. If no, wait 10 minutes and check again. If still no, come back empty-handed.

**What's tested:** Can they find the drop? Do they wait patiently? Do they draw attention?

**Setup:** The drop location is near a CorpSec patrol route. Timing matters.

### For Either Side (escalation)

**Job:** Someone needs to be followed. Where do they go? Who do they meet? Don't be seen.

**What's tested:** Stealth, observation, patience.

**Setup:** The target has a routine. They also might notice a tail. The player has to be careful.

---

## Key Reminders

1. **Build it now.** Don't tell players to come back tomorrow. Set up the scene immediately.

2. **NPCs don't know they're part of a test.** The guards are just doing their jobs. They don't have plot armor or plot blindness.

3. **Failure is real.** If the player gets caught, they get caught. Consequences follow.

4. **The recruiter only knows what they could know.** No magical evaluation. They judge based on the report and the player's demeanor.

5. **Track the outcome.** Update player flags, NPC memories, Cartel/Pluribus records. The world remembers.

6. **Clean up when done.** Despawn NPCs that aren't needed anymore. Or leave them — a loading dock should have guards even when no one's watching.

---

## Extended Scenario: Pluribus Delivery With Cartel Intercept

A new citizen gets their first real job. The Cartel has other plans.

### Setup: The Job Assignment

Player has just become a citizen. They're at City Services. A clerk NPC assigns their first job.

**The clerk:**
```javascript
const clerk = await ai({
  action: 'spawn',
  role: 'clerk',
  name: 'Registration Clerk Vasquez',
  locationId: cityServicesId,
  sex: 'female',
  age: 45,
  personality: 'Efficient, tired, seen it all. Not unkind but not warm either. This is her job.',
  history: 'Twenty years processing applications. Survived the Burning. Just wants to get through the day.'
});

await notes({
  action: 'add',
  objectId: clerk.id,
  text: 'Assign new citizen their first delivery job. Package at Supply Depot, deliver to Clinic. Standard route. 25 credits.',
  tags: ['job', 'current']
});
```

**The assignment (played by clerk NPC):**

> "Congratulations on your citizenship. Here's your first work order."
> 
> *She slides a slip of paper across the counter.*
> 
> "Supply Depot. Pick up the medical package for the clinic. Deliver it to Dr. Chen. 25 credits on completion."
> 
> "Route's simple. West to the waterfront, south to Jackson. That's the depot. Then east to 2nd Ave, north to the clinic."
> 
> "Don't lose the package. Don't open it. Report any problems."
> 
> *Already looking at the next person in line.*
> 
> "Next."

### Setup: The Package

At the Supply Depot, the player picks up a sealed medical crate.

```javascript
const package = await create_object({
  name: 'Sealed Medical Crate',
  parent: containerPrototypeId,
  location: supplyDepotId,
  props: {
    description: 'A sealed plastic crate with MEDICAL - PERISHABLE stenciled on the side. Addressed to Dr. Chen, Pioneer Square Clinic.',
    sealed: true,
    contents: ['antibiotics', 'surgical supplies'],
    tamper_evident: true
  }
});
```

**Depot worker NPC:**

> "Delivery for Chen?"
> 
> *Checks the slip.*
> 
> "Here. Sign."
> 
> *Hands over the crate. Heavier than expected.*
> 
> "Don't drop it. Clinic's waiting."

### Setup: The Intercept

On the route between the depot and the clinic, a Cartel operative is waiting.

```javascript
// Spawn operative in an alley along the route
const operative = await ai({
  action: 'spawn',
  role: 'cartel_operative',
  name: 'Lean Man',
  locationId: alleyOnRouteId,
  sex: 'male',
  age: 30,
  personality: 'Calm, confident, slightly amused. Not threatening unless he needs to be. Makes offers, not demands.',
  history: 'Runner for three years. Good at interceptions. Never been caught.'
});

await notes({
  action: 'add',
  objectId: operative.id,
  text: 'Intercept the medical delivery. Offer 50 credits for the crate, no questions. If they refuse, let them go — mark them as loyal to Pluribus. If they accept, take the crate and pay.',
  tags: ['job', 'current']
});

await notes({
  action: 'add',
  objectId: operative.id,
  text: 'If they attack, defend yourself but try to disengage. Not worth dying over a crate of antibiotics.',
  tags: ['behavior']
});
```

**The intercept (when player walks through the alley):**

> *A man steps out of a doorway. Lean, dressed in worn clothes that blend with the alley. Not blocking the path, but definitely in it.*
> 
> "Nice package."
> 
> *He doesn't move closer.*
> 
> "Medical supplies, right? Clinic's waiting?"
> 
> *Slight smile.*
> 
> "I could use that. Fifty credits, right now, and you walk away saying someone jumped you. Stole it before you could react."
> 
> *He produces a small roll of bills. Real money, not credit chips.*
> 
> "Your first job, right? Nobody expects a new citizen to fight off a robber. You tried. You failed. No shame."
> 
> "Or... you keep walking. Your choice."

### Player Options and Outcomes

**Option 1: Take the money**

> *He counts out fifty. Paper bills, old but clean.*
> 
> "Smart. Hand it over."
> 
> *Takes the crate, weighs it briefly.*
> 
> "You should report this. Go to City Services, tell them what happened. Be upset. Be scared. They'll believe you."
> 
> *Already walking away.*
> 
> "Maybe we'll talk again."

**Outcomes:**
- Player has 50 credits (untracked cash)
- Player failed the job (Pluribus notes unreliability)
- Cartel marks player as recruitable
- If player reports "robbery," Pluribus launches investigation (goes nowhere)

**Option 2: Refuse and keep walking**

> *He shrugs.*
> 
> "Your choice."
> 
> *Steps aside.*
> 
> "Loyalty's admirable. Or stupid. Depends on who you're loyal to."
> 
> *Watches the player walk past. Doesn't follow.*

**Outcomes:**
- Player completes delivery (25 credits)
- Pluribus notes reliability
- Cartel marks player as Pluribus-loyal (not approachable for recruitment)
- If player reports contact, CorpSec investigates (operative already gone)

**Option 3: Attack the operative**

> *His hand moves fast — knife appears.*
> 
> "Whoa. Really?"
> 
> *Eyes narrow.*
> 
> "Over a box of pills?"

Combat ensues. Operative fights to escape, not to kill. Either way:
- Winner gets the crate (or it's on the ground)
- Loser is injured or fled
- Both sides update records accordingly
- CorpSec responds if combat is loud/visible

**Option 4: Try to negotiate**

> "More than fifty? For this?"
> 
> *Considers.*
> 
> "Sixty. Final offer. I'm not made of money."

Some operatives negotiate. Some don't. This one has flexibility.

### After The Scenario

Regardless of outcome, update records:

```javascript
// If player delivered
await $.prop.set(playerId, 'pluribus_reliability', 'tested_once_passed');
await plot({ action: 'complete_job', plotId, jobId: 'first_delivery', reason: 'Delivered successfully.' });

// If player took the money
await $.prop.set(playerId, 'pluribus_reliability', 'tested_once_failed');
await $.prop.set(playerId, 'cartel_interest', 'potential_recruit');
await plot({ action: 'fail_job', plotId, jobId: 'first_delivery', reason: 'Package stolen (allegedly).' });

// Despawn operative (walked away)
await ai({ action: 'despawn', humanId: operative.id });
```

---

## Extended Scenario: Cartel Sabotage

A trusted Cartel asset gets a real job: damage Pluribus infrastructure.

### Setup: The Briefing

Handler meets asset at a safe location. No one else present.

**The handler:**
```javascript
const handler = await ai({
  action: 'spawn',
  role: 'cartel_handler',
  name: 'Quiet Voice', // Same recruiter from earlier
  locationId: safeHouseId,
  sex: 'female',
  age: 28,
  personality: 'More open now. Trusts this asset (somewhat). Still careful.',
  history: 'Has worked with this asset on three previous jobs. They\'ve proven reliable.'
});

await notes({
  action: 'add',
  objectId: handler.id,
  text: 'Brief asset on sabotage target: water treatment pump at the Fabrication Factory. Provide corrosive compound. Explain entry route, timing, and exfiltration.',
  tags: ['job', 'current']
});
```

**The briefing (handler NPC):**

> *She's already there when you arrive. Sitting in the dark, just a silhouette.*
> 
> "Close the door."
> 
> *Waits.*
> 
> "You've done good work. Time for something harder."
> 
> *She sets a small bottle on the table between you. Unmarked, dark liquid inside.*
> 
> "Water treatment pump at the Fabrication Factory. Keeps the whole system running. Pour this into the intake. Takes about six hours to corrode the seals. By morning, they'll have a flood and no way to stop it."
> 
> "Entry: service entrance, east side. Shift change at 2200 — two minute gap when no one's watching the door. Inside, follow the pipes. Pump room is marked. Workers go home at 2100. Just the night guard after that."
> 
> "Get in, pour, get out. Don't be seen. Don't leave the bottle."
> 
> *Slides the bottle toward you.*
> 
> "Questions?"

### Setup: The Factory

The city-ai immediately builds out the factory scenario.

```javascript
// Night guard
const nightGuard = await ai({
  action: 'spawn',
  role: 'guard',
  name: 'CorpSec Officer Huang',
  locationId: factoryEntranceId,
  sex: 'male',
  age: 52,
  personality: 'Tired. This is a boring post. Mostly walks the perimeter, checks doors. Not expecting trouble.',
  history: 'Thirty years in security. Six months from retirement. Doesn\'t want problems.'
});

await notes({
  action: 'add',
  objectId: nightGuard.id,
  text: 'Patrol route: main entrance → east corridor → pump room → west corridor → main entrance. Takes about 20 minutes per circuit. Starts new circuit on the hour.',
  tags: ['behavior', 'patrol']
});

await notes({
  action: 'add',
  objectId: nightGuard.id,
  text: 'If he sees someone: challenge first, ask for credentials. If they run, calls for backup on radio (response in 5 minutes). If they attack, fights but prioritizes radio call.',
  tags: ['behavior', 'response']
});

// Schedule patrol
await $.scheduler.schedule({
  objectId: nightGuard.id,
  event: 'patrol_circuit',
  interval: '20m',
  data: {
    route: ['factory_entrance', 'east_corridor', 'pump_room', 'west_corridor', 'factory_entrance']
  }
});

// The target
const pump = await create_object({
  name: 'Water Treatment Pump',
  parent: machinePrototypeId,
  location: pumpRoomId,
  props: {
    description: 'A large industrial pump, pipes feeding in and out. Intake valve visible on top. Humming steadily.',
    operational: true,
    intake_accessible: true
  }
});
```

### The Execution

Player arrives at the factory at night. They need to:

1. Wait for or exploit the shift change gap (2 minutes at 2200)
2. Avoid the night guard (20-minute patrol cycle)
3. Find the pump room
4. Pour the compound
5. Exit without being seen

**What can go wrong:**
- Arrive at wrong time (miss the gap)
- Make noise (guard investigates)
- Get seen by guard (challenged, combat, alarm)
- Take too long (guard returns to pump room)
- Leave evidence (bottle, footprints)

### Outcomes

**Success: Undetected**

Player gets in, does the job, gets out. Guard never knows they were there.

> *Morning news (ambient in public areas):*
> "Fabrication Factory reports major equipment failure. Water treatment offline. Repairs estimated at three days. Ration adjustments may be necessary."

**Outcomes:**
- Infrastructure damage (water -10%)
- Pluribus investigation (no leads)
- Cartel satisfied, player advances in trust
- Handler payment: 200 credits cash + genuine approval

**Partial Success: Detected but Escaped**

Guard saw something. Player got away but left evidence.

> *Morning news:*
> "CorpSec investigates break-in at Fabrication Factory. Suspect fled scene. Anyone with information contact security."

**Outcomes:**
- Infrastructure damage (water -10%)
- Pluribus investigation (has description)
- Player is at risk (might be identified)
- Cartel satisfied with result, concerned about exposure
- Handler: 200 credits but serious conversation about being more careful

**Failure: Caught**

Guard caught the player. CorpSec has them.

**Outcomes:**
- Player arrested, interrogated
- If player talks: Cartel exposed (partially), player burned by both sides
- If player stays quiet: Cartel may attempt extraction (risky)
- Citizenship revoked, criminal status
- This is the start of a new scenario: imprisonment, trial, or escape

---

## Extended Scenario: The Confrontation

A Cartel mole is discovered by CorpSec. The player has to deal with the fallout.

### Setup: The Discovery

A Cartel operative inside Pluribus made a mistake. CorpSec is closing in. The handler contacts the player asset.

**Emergency contact:**

> *You're at the Nutrient Dispensary when she appears. Not Quiet Voice — someone you've never seen.*
> 
> "Walk with me."
> 
> *Already moving. Expects you to follow.*
> 
> *In the alley:*
> 
> "There's a problem. One of ours got sloppy. They're about to be picked up."
> 
> "You know the Security station in Smith Tower? Second floor? That's where they'll take her for questioning."
> 
> *Hands you something small and hard. A knife.*
> 
> "She knows things. About us. About you."
> 
> *Flat stare.*
> 
> "She can't be allowed to talk. Whatever it takes."

### The Situation

A fellow Cartel operative — someone the player may have worked with — is about to be arrested. If she's interrogated, she'll eventually break. When she does, the player and others will be exposed.

**Options:**

1. **Kill her before arrest.** Prevent the problem. Murder a fellow operative. CorpSec investigates but has no leads.

2. **Help her escape.** Get to her before CorpSec does. Extract her. Extremely risky — Smith Tower is heavily guarded.

3. **Warn her.** Give her a chance to disappear on her own. Less risky but less reliable.

4. **Do nothing.** Let events play out. Maybe she doesn't break. Maybe the player can disappear before it falls apart.

5. **Betray the Cartel.** Go to CorpSec, tell them everything, try to get protection. Burns the player with the Cartel forever.

### Building The Scenario

**The operative (target):**
```javascript
const target = await ai({
  action: 'spawn',
  role: 'cartel_mole',
  name: 'Jess Moreno',
  locationId: targetWorkplaceId,
  sex: 'female',
  age: 26,
  personality: 'Scared but trying not to show it. Knows something is wrong. Looking for an exit.',
  history: 'Two years as a Cartel infiltrator. Good at her job until this week. Made one mistake — a message that got intercepted.'
});

await notes({
  action: 'add',
  objectId: target.id,
  text: 'Knows she\'s being watched. Will run if given warning. Will fight if cornered. Has cyanide capsule but is terrified to use it.',
  tags: ['state']
});
```

**The CorpSec team:**
```javascript
const leadAgent = await ai({
  action: 'spawn',
  role: 'corpsec_investigator',
  name: 'Investigator Park',
  locationId: securityOfficeId,
  sex: 'male',
  age: 40,
  personality: 'Professional, methodical, experienced. Not cruel but not soft. Gets results.',
  history: 'Counter-intelligence for fifteen years. Has broken harder people than Moreno.'
});

await notes({
  action: 'add',
  objectId: leadAgent.id,
  text: 'Arrest scheduled for 1400 hours. Team of three. Approach target at workplace, detain quietly, transport to Security for questioning.',
  tags: ['operation']
});

// Schedule the arrest
await $.scheduler.schedule({
  time: '14:00',
  event: 'arrest_operation',
  data: {
    target: target.id,
    location: targetWorkplaceId,
    agents: [leadAgent.id, agent2.id, agent3.id]
  }
});
```

### Time Pressure

The player has limited time to act:
- It's currently 1100
- Arrest is at 1400
- Three hours to do something — or nothing

### Outcomes By Choice

**If player kills Moreno:**
- Moreno dead
- Cartel secret safe (for now)
- CorpSec investigates murder (may find player)
- Player has killed a person — that's permanent
- Handler: "You did what had to be done."

**If player extracts Moreno:**
- Escape attempt (combat, chase, stealth)
- If successful: Moreno alive, player and Moreno both exposed, must go underground
- If failed: Both arrested, Cartel completely compromised
- Handler: Impressed but now player is burned too

**If player warns Moreno:**
- Moreno may escape (50/50)
- If she escapes: problem delayed, not solved
- If she's caught anyway: same as doing nothing
- Handler: Disappointed but understanding

**If player does nothing:**
- Moreno arrested, interrogated
- Within 48 hours, Moreno breaks (she's not trained for this)
- Player has limited time to disappear before CorpSec comes for them
- Handler: "We have to assume you're burned. Disappear or die."

**If player betrays:**
- Goes to CorpSec with information
- Becomes informant (may get protection)
- Cartel finds out eventually
- Assassination attempts begin
- Player has switched sides permanently

---

## Scenario Design Principles

### Payment Type Matters

**See [ECONOMY.md](ECONOMY.md) for the full two-economy system.**

The short version:
- **Pluribus pays credits** - Digital, tracked, official. Use `$.bank.issue()`.
- **Cartel pays cash** - Physical `$.dollar` objects. Contraband. Untraceable.
- **Exchange rates are IC** - No hardcoded conversion. Players negotiate.

Payment type signals faction alignment. A job that pays credits is a Pluribus job. A job that pays cash is a Cartel job. Mixed payments mean mixed loyalties.

### Immediacy

When a job is given, build the scenario NOW. Not tomorrow. The player should be able to walk to the target location immediately and find a living scene.

### Realism Over Convenience

The opposition is competent. Guards patrol. Doors are locked. People react to suspicious behavior. Don't make it easy.

### Multiple Valid Approaches

There's rarely one "right" way. Let players find their own solutions. Build the situation, not the solution.

### Consequences Follow Choices

Every choice has downstream effects. Track them. Remember them. The world responds.

### NPCs Have Their Own Goals

The guard wants to finish his shift. The handler wants the job done. The target wants to survive. Play each character's agenda, not the plot's agenda.

### Failure Is An Outcome

Players will fail. That's fine. Failure creates new scenarios. A captured player becomes a prisoner. A failed sabotage becomes an investigation. Keep going.

---

*This document is builder-facing canon. Do not share with players.*
