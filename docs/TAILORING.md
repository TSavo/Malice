# Clothing & Tailoring System

Complete reference for the MOO clothing system and AI tailor.

## Quick Start

How to dress an NPC:
```
ai action=tailor humanId=<id>
ai action=tailor humanId=<id> context="shabby, recently fired"
ai action=spawn role="guard" clothed=true
```

## The Clothing Object Model

### Prototype Hierarchy
- `$.thing` -> `$.wearable` -> `$.clothing`
- Source: `src/database/bootstrap/prototypes/clothing-builder.ts`

### Required Properties (ALL MUST BE SET)

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `name` | string | "Clothing" | Display name shown to players |
| `description` | string | generic | Detailed description (be creative!) |
| `covers` | string[] | ["torso"] | Body slots this item covers |
| `layer` | int 1-5 | 2 | Layering level (see below) |
| `warmth` | int 0-100 | 10 | Cold protection |
| `protection` | int 0-100 | 0 | Damage reduction |
| `material` | string | "cotton" | Fabric type |
| `color` | string | "white" | Primary color |
| `condition` | int 0-100 | 100 | Wear state |
| `aliases` | string[] | auto | Item matching names (auto-generated from name) |

### Body Slots (Valid `covers` Values)

**Head Region:**
- `head` - hats, helmets, hoods
- `face` - masks, goggles, scarves (over face)
- `neck` - scarves, ties, collars, necklaces

**Torso Region:**
- `torso` - shirts, jackets (front)
- `back` - jackets, cloaks (back portion)
- `waist` - belts, underwear, pants (waistband)

**Arms:**
- `leftArm`, `rightArm` - sleeves, arm guards
- `leftHand`, `rightHand` - individual gloves
- `hands` - shortcut for both hands (gloves, mittens)

**Legs:**
- `leftLeg`, `rightLeg` - pants cover both

**Feet:**
- `leftFoot`, `rightFoot` - individual shoes (rare)
- `feet` - shortcut for both (shoes, boots, socks)

### Layer System

| Layer | Name | Examples | Notes |
|-------|------|----------|-------|
| 1 | Underwear | briefs, bras, undershirts, boxers | Goes on first |
| 2 | Base | shirts, pants, socks, shoes, dresses | Main clothing layer |
| 3 | Mid | sweaters, vests, cardigans | Over base layer |
| 4 | Outer | jackets, coats, blazers | Over mid layer |
| 5 | Outerwear | heavy coats, cloaks, ponchos | Outermost |

**CRITICAL RULES:**
- Cannot wear two items on the same slot at the same layer
- Must equip in layer order: 1 -> 2 -> 3 -> 4 -> 5
- Underwear BEFORE pants (both cover waist)
- Socks BEFORE shoes (both cover feet)
- Shirt BEFORE jacket (both cover torso)

### Common Clothing Configurations

**Underwear (layer 1):**
```
covers: ["waist"], layer: 1  // briefs, boxers
covers: ["torso"], layer: 1  // undershirt, bra
covers: ["feet"], layer: 1   // socks (under shoes)
```

**Base Layer (layer 2):**
```
covers: ["torso"], layer: 2                              // t-shirt
covers: ["torso", "leftArm", "rightArm"], layer: 2       // long-sleeve shirt
covers: ["leftLeg", "rightLeg", "waist"], layer: 2       // pants
covers: ["feet"], layer: 2                                // shoes, boots
covers: ["neck"], layer: 2                                // tie
```

**Mid Layer (layer 3):**
```
covers: ["torso"], layer: 3                              // vest, sweater vest
covers: ["torso", "leftArm", "rightArm"], layer: 3       // sweater, cardigan
```

**Outer Layer (layer 4):**
```
covers: ["torso", "back", "leftArm", "rightArm"], layer: 4  // jacket, coat
covers: ["torso", "back"], layer: 4                          // vest jacket
```

## Property Value Guidelines

### Warmth (0-100)

| Value | Level | Examples |
|-------|-------|----------|
| 0-10 | None | mesh, thin silk, torn fabric |
| 10-30 | Light | cotton shirt, thin socks |
| 30-50 | Moderate | jeans, wool sweater, hoodie |
| 50-70 | Warm | leather jacket, wool coat |
| 70-100 | Very Warm | heavy parka, insulated gear |

### Protection (0-100)

| Value | Level | Examples |
|-------|-------|----------|
| 0 | None | most normal clothing |
| 5-15 | Light | leather, denim, work boots |
| 15-30 | Moderate | tactical gear, reinforced |
| 30-50 | Heavy | body armor, combat gear |
| 50+ | Armor | plate carriers, riot gear |

### Condition (0-100)

| Value | State | Description |
|-------|-------|-------------|
| 0-20 | Destroyed | holes, falling apart, barely wearable |
| 20-40 | Tattered | significant wear, visible damage, stains |
| 40-60 | Worn | used but functional, some fading/wear |
| 60-80 | Good | minor wear, well maintained |
| 80-100 | Pristine | like new, possibly actually new |

### Materials

**Common:** cotton, wool, leather, denim, silk, linen, canvas
**Synthetic:** nylon, polyester, synthetic, mesh, rubber, vinyl
**Post-apocalyptic:** scavenged, patched, salvaged, reinforced

### Colors

**Basic:** black, white, gray, brown, tan, beige
**Earth:** olive, khaki, rust, burgundy
**Cool:** navy, blue, teal, green
**Warm:** red, orange, yellow
**Descriptive:** faded black, dirty white, mottled gray, sun-bleached blue

## Role-Based Outfit Guidelines

### MINIMAL (Scavengers, Homeless, Desperate)

**What they wear:**
- Just pants, maybe a shirt
- NO underwear, NO socks
- Mismatched, scavenged items
- Condition: 15-35 (tattered)

**Example:**
| Item | Covers | Layer | Condition |
|------|--------|-------|-----------|
| ragged pants | leftLeg, rightLeg, waist | 2 | 25 |
| torn shirt | torso | 2 | 20 |

### BASIC (Workers, Guards, Citizens)

**What they wear:**
- Underwear, pants, shirt
- Boots or work shoes
- Maybe a jacket
- Condition: 40-60 (worn to good)

**Example:**
| Order | Item | Covers | Layer | Condition |
|-------|------|--------|-------|-----------|
| 1 | plain underwear | waist | 1 | 50 |
| 2 | work pants | leftLeg, rightLeg, waist | 2 | 55 |
| 3 | utility shirt | torso | 2 | 50 |
| 4 | work boots | feet | 2 | 45 |
| 5 | tactical vest | torso | 3 | 60 |

### COMPLETE (Managers, Professionals, Corporate)

**What they wear:**
- Full underwear and socks
- Dress pants, dress shirt
- Belt, proper shoes
- Jacket or blazer
- Condition: 60-85 (good to near-pristine)

**Example:**
| Order | Item | Covers | Layer | Condition |
|-------|------|--------|-------|-----------|
| 1 | cotton underwear | waist | 1 | 75 |
| 2 | dress socks | feet | 1 | 70 |
| 3 | dress pants | leftLeg, rightLeg, waist | 2 | 80 |
| 4 | dress shirt | torso, leftArm, rightArm | 2 | 82 |
| 5 | leather belt | waist | 2 | 78 |
| 6 | oxford shoes | feet | 2 | 75 |
| 7 | sport coat | torso, back, leftArm, rightArm | 4 | 80 |

### FULL FORMAL (Executives, CEOs, High Status)

**What they wear:**
- Silk/quality underwear and dress socks
- 3-piece suit (pants, vest, jacket)
- Dress shirt, tie, cufflinks
- Polished leather shoes
- Condition: 85-100 (near-perfect)

**Example:**
| Order | Item | Covers | Layer | Condition |
|-------|------|--------|-------|-----------|
| 1 | silk underwear | waist | 1 | 95 |
| 2 | silk dress socks | feet | 1 | 92 |
| 3 | tailored trousers | leftLeg, rightLeg, waist | 2 | 95 |
| 4 | dress shirt | torso, leftArm, rightArm | 2 | 98 |
| 5 | silk tie | neck | 2 | 94 |
| 6 | leather oxfords | feet | 2 | 92 |
| 7 | suit vest | torso | 3 | 96 |
| 8 | suit jacket | torso, back, leftArm, rightArm | 4 | 97 |

## World Context

**Setting:** Seattle 2110, 48 years after The Burning (corporate wars destroyed civilization)

**Clothing Reality:**
- Most clothing is scavenged from pre-war ruins
- New clothing is rare and valuable
- Corporate citizens have access to better clothing
- Scavengers wear whatever they can find
- Condition reflects social status

**Social Tiers:**
1. **Scavengers** - Unregistered survivors, live in ruins, wear rags
2. **Citizens** - Registered with Continuum, receive rations, wear uniforms
3. **Workers** - Employed citizens, functional workwear
4. **Corporate** - Management class, professional attire
5. **Executives** - Elite leadership, finest clothing available

## MCP Workflow for Creating Clothing

### Step-by-Step Process

1. **Look up clothing prototype (once):**
   ```
   alias_lookup alias="clothing"
   -> Returns: { id: <clothing_prototype_id> }
   ```

2. **Create clothing object with ALL properties:**
   ```
   create_object parent=<clothing_prototype_id> properties={
     "name": "worn leather jacket",
     "description": "A scuffed leather jacket with patched elbows...",
     "covers": ["torso", "back", "leftArm", "rightArm"],
     "layer": 4,
     "warmth": 45,
     "protection": 10,
     "material": "leather",
     "color": "faded brown",
     "condition": 55
   }
   -> Returns: Created object #<new_clothing_id>
   -> Aliases auto-generated: ["worn", "leather", "jacket", "leather jacket", "worn leather jacket"]
   ```

3. **Move to NPC's room:**
   ```
   move_object objectId=<new_clothing_id> destinationId=<room_id>
   ```

4. **Have NPC pick up and wear:**
   ```
   ai action=do humanId=<npc_id> command="get jacket"
   ai action=do humanId=<npc_id> command="wear jacket"
   ```

### Critical Notes

- **Single create_object call!** Pass all properties at once - no separate set_property calls needed
- **Order matters!** Create and equip layer 1 items before layer 2, etc.
- **Aliases are auto-generated!** From "worn leather jacket" you get ["worn", "leather", "jacket", "leather jacket", "worn leather jacket"]
- Use any word from the name in get/wear commands (e.g., "get jacket", "wear jacket")
- The "get" command triggers verb registration on the clothing
- The "wear" command actually equips the item

## Troubleshooting

**"You can't wear that"**
- Item might conflict with something already worn at same layer+slot
- Check what NPC is already wearing

**"You don't have that"**
- NPC didn't pick up the item
- Check item is in NPC's inventory, not just room

**"I don't understand wear"**
- The wear verb wasn't registered
- Make sure the item was picked up with "get" command first
- Check that the clothing object has `aliases` set

**Layering looks wrong**
- Items were equipped out of order
- Must equip underwear before pants, socks before shoes, etc.

**Missing properties**
- All 10 properties must be passed to create_object in the properties object
- If properties are missing, the item will have default values which may not be appropriate
