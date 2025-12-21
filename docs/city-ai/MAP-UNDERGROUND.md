# Seattle Underground - Map

The buried streets and tunnels beneath Pioneer Square. Gray Cartel territory.

---

## Surface Reference (z=0)

```
             x=-21    x=-14    x=-7     x=0      x=+7     x=+14
              │        │        │        │        │        │
        ┌─────┴────────┴────────┴────────┴────────┴────────┴─────┐
y=+12   │ WATER   ═══════════ YESLER WAY (BLOCKED) ═════════════ │
        │ FRONT       │                                          │
y=+11   │   │    ╔════╧════╗ ╔═══════╗                           │
        │   │    ║FABRICATN║ ║ SMITH ║                           │
y=+10   │   │    ║ FACTORY ║ ║ TOWER ║    ╔═════════════════╗    │
        │   │    ║ x=-20   ║ ║ x=-12 ║    ║                 ║    │
y=+9    │   │    ║ to -18  ║ ║to -10 ║    ║    PIONEER      ║    │
        │   │    ╚═════════╝ ╚═══════╝    ║    BUILDING     ║    │
y=+8    │   │                             ║  x=+1 to +4     ║    │
        │   │                             ╚═════════════════╝    │
y=+7    │   │                                                    │
        │   │                                                    │
y=+6    │───┼─────────────────S. WASHINGTON───────────────────── │
        │   │                                                    │
y=+5    │   │                                                    │
        │   │    ╔═══════════╗                                   │
y=+4    │   │    ║   GRAND   ║  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓                │
        │   │    ║  CENTRAL  ║  ▓               ▓                │
y=+3    │   │    ║  x=-13    ║  ▓  OCCIDENTAL   ▓                │
        │   │    ║  to -10   ║  ▓     PARK      ▓                │
y=+2    │   │    ╚═══════════╝  ▓   x=-6 to     ▓                │
        │   │                   ▓    x=-1       ▓                │
y=+1    │   │                   ▓  y=+1 to      ▓                │
        │   │                   ▓    y=+4       ▓                │
y=0     │───┼──────────S. MAIN──▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓──────────────  │
        │   │                                                    │
y=-1    │   │                                                    │
        │   │                                                    │
y=-4    │   │                                                    │
        │╔══╧═══╗                                                │
y=-5    │║SUPPLY║                                                │
        │║DEPOT ║                                                │
y=-6    │╚══════╝─────────────S. JACKSON─────────────────────────│
        │   │                                                    │
y=-7    │   │  ╔═══════════╗                                     │
y=-8    │   │  ║ SINKHOLE  ║                                     │
y=-9    │   │  ║ (FLOODED) ║                                     │
        │   │  ╚═══════════╝                                     │
y=-12   │───┴──────────────────S. KING────────────────────────── │
        └────────────────────────────────────────────────────────┘
```

---

## Underground Entry Points

Entry points connect surface (z=0) to underground (z=-2) through z=-1 transitional areas.

| ID | Location | z=0 (Surface) | z=-1 (Access) | z=-2 (Underground) |
|----|----------|---------------|---------------|-------------------|
| E1 | Smith Tower | n/a (internal) | Escape Tunnel (-13, +9) | Tunnel Mouth (-14, +9) |
| E2 | Fabrication | Door (-21, +10) | Basement (-20, +10) | Fab Access (-20, +10) |
| E3 | Occidental Park | Trapdoor (-3, +2) | Ladder Shaft (-3, +2) | Park Access (-3, +2) |
| E4 | Supply Depot | Door (-21, -5) | Basement (-20, -5) | Supply Access (-20, -5) |

---

## Level z=-1: Access Points (Transitional)

Basements, shafts, and stairways connecting surface to underground.

```
    x=-20              x=-14  x=-13              x=-3
       │                  │      │                 │
  ┌────┴──────────────────┴──────┴─────────────────┴────┐
  │                                                     │
y=+10  ●                                                │  FABRICATION BASEMENT
  │    FAB                                              │  Stairs down from factory floor
  │    BASEMENT                                         │
  │                                                     │
y=+9                            ●                       │  SMITH TOWER ESCAPE
  │                          ESCAPE                     │  From datacenter z=-2
  │                          TUNNEL                     │  (already exists in building)
  │                                                     │
y=+2                                              ●     │  OCCIDENTAL SHAFT
  │                                            LADDER   │  Hidden trapdoor in park
  │                                            SHAFT    │
  │                                                     │
y=-5   ●                                                │  SUPPLY BASEMENT
  │    SUPPLY                                           │  Loading dock access
  │    BASEMENT                                         │
  └─────────────────────────────────────────────────────┘
```

### z=-1 Room List

| Name | Coordinates | Connects |
|------|-------------|----------|
| Fabrication Basement | (-20, +10, -1) | up: factory, down: underground |
| Smith Tower Escape | (-13, +9, -1) | *exists in building z=-2.ts* |
| Occidental Shaft | (-3, +2, -1) | up: park trapdoor, down: underground |
| Supply Basement | (-20, -5, -1) | up: depot, down: underground |

**Note:** Smith Tower's escape tunnel is defined in the building file at z=-2 and connects west to the underground tunnel mouth at (-14, +9, -2).

---

## Level z=-2: Upper Tunnels (Dense Corridor Network)

The original 1889 street level. All rooms at adjacent coordinates for auto-connection.

```
    x=-20 -19 -18 -17 -16 -15 -14 -13 -12 -11 -10  -9  -8  -7  -6  -5  -4  -3
       │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │
  ┌────┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴────┐
  │                                                                              │
y=+10  ◆───●───●───●───●───●───●                            FABRICATION BRANCH   │
  │    E2                      │                            (y=+10, x=-20 to -14)│
  │                            │                                                 │
y=+9                           ●───◆E1                      SMITH CONNECTION     │
  │                            │   SMITH                    (y=+9, x=-14 to -13) │
  │                            │   TOWER                                         │
y=+8                           │                                                 │
  │                            │                                                 │
y=+7                           │                                                 │
  │                            │                                                 │
y=+6                           │                            WEST SPINE           │
  │                            │                            (x=-14, y=+10 to -5) │
y=+5                           ●  THE JUNCTION                                   │
  │                            │                                                 │
y=+4                           │                                                 │
  │                            │                                                 │
y=+3                           │                                                 │
  │                            │                                                 │
y=+2                           │                                           ◆ E3  │
  │                            │                                           │PARK │
y=+1                           │                                           │     │
  │                            │                                           │     │
y=0                            ●───●───●───●───●───●───●───●───●───●───●───●     │
  │                         MAIN                                    S. MAIN      │
  │                         CROSSING                               CORRIDOR      │
  │                            │                            (y=0, x=-14 to -3)   │
y=-1                           │                                                 │
  │                            │                                                 │
y=-2                           │                                                 │
  │                            │                                                 │
y=-3                           │                                                 │
  │                            │                                                 │
y=-4                           │                                                 │
  │                            │                                                 │
y=-5   ◆───●───●───●───●───●───●                            SUPPLY BRANCH        │
  │    E4                   SUPPLY                          (y=-5, x=-20 to -14) │
  │    SUPPLY               JUNCTION                                             │
  │    DEPOT                                                                     │
  └──────────────────────────────────────────────────────────────────────────────┘

Legend:
  ◆  = Entry point (building connection)
  ●  = Underground room
  │─ = Tunnel passage (adjacent coordinates auto-connect)
```

### Corridor Definitions

| Corridor | Direction | Start | End | Room Count |
|----------|-----------|-------|-----|------------|
| West Spine | N-S | (-14, +10) | (-14, -5) | 16 |
| Fabrication Branch | E-W | (-20, +10) | (-15, +10) | 6 |
| Supply Branch | E-W | (-20, -5) | (-15, -5) | 6 |
| S. Main Corridor | E-W | (-13, 0) | (-3, 0) | 11 |
| Smith Connection | E-W | (-14, +9) | (-13, +9) | 1 |
| Park Access | N-S | (-3, +1) | (-3, +2) | 2 |

**Total z=-2 rooms: 42** (with shared coordinates at junctions)

### Named Locations (z=-2)

| Name | Coordinates | Description |
|------|-------------|-------------|
| Tunnel Mouth | (-14, +9) | Where Smith Tower escape meets underground |
| The Junction | (-14, +5) | Main hub on West Spine |
| Main Crossing | (-14, 0) | Where spine meets S. Main corridor |
| Fabrication Access | (-20, +10) | Entry from Fabrication basement |
| Supply Access | (-20, -5) | Entry from Supply Depot basement |
| Park Access | (-3, +2) | Hidden entry in Occidental Park |
| Supply Junction | (-14, -5) | Where spine meets Supply branch |

### Generic Passage Types

Rooms without special names use one of these types based on conditions:

| Type | Name | Conditions |
|------|------|------------|
| Standard | Underground Passage | Default brick-lined tunnel |
| Wet | Flooded Section | Near water table, ankle-deep |
| Damaged | Collapsed Rubble | Debris, narrow gap |
| Historic | Old Storefront | Ghost of 1889 shop visible |
| Utility | Service Tunnel | Pipes, utility access |

---

## Level z=-3: Transitional Shafts (Buffer Zone)

Vertical connections only. Narrow shafts, steep stairs. No horizontal passages.
Creates defensive depth between public tunnels (z=-2) and secured territory.

```
        x=-14         x=-3
           │            │
      ┌────┴────────────┴────┐
      │                      │
y=+5  │    ●  JUNCTION       │
      │    │  SHAFT          │
      │    ↓                 │
      │                      │
y=+2  │                 ●  PARK SHAFT
      │                 ↓
      │                      │
y=-5  │    ●  SUPPLY         │
      │    │  SHAFT          │
      │    ↓                 │
      └──────────────────────┘
```

| Name | Coordinates | Connects |
|------|-------------|----------|
| Junction Shaft | (-14, +5, -3) | up: The Junction, down: Lower Junction |
| Supply Shaft | (-14, -5, -3) | up: Supply Junction, down: Supply Hub |
| Park Shaft | (-3, +2, -3) | up: Park Access, down: Runner's Den |

**Total z=-3 rooms: 3**

---

## Level z=-4: Lower Passages (Operational)

Cramped service tunnels (6-8 ft). Cell bases, logistics, operational infrastructure.

```
        x=-16    x=-14    x=-12    x=-10    x=-8     x=-6     x=-4
           │        │        │        │        │        │        │
      ┌────┴────────┴────────┴────────┴────────┴────────┴────────┴────┐
      │                                                               │
y=+6  │         ●  CUTTER BARRACKS                                   │
      │         │                                                     │
y=+5  │   ●─────●  LOWER JUNCTION                                    │
      │         │                                                     │
y=+4  │         │                                                     │
y=+3  │         ●                                                     │
y=+2  │         │                                    ●  RUNNER'S DEN  │
y=+1  │   ●─────●─────●─────●─────●─────●─────●─────●                 │
      │  SPARK                                                        │
      │  WORKSHOP                                                     │
y=0   │         ●─────●  SAFE     ●  DEAD                            │
      │         │     HOUSE       DROP                                │
y=-1  │         │                             │                       │
y=-2  │         ●  INTERROGATION              ●                       │
y=-3  │         │                             │                       │
y=-4  │   ●─────●  KEEPER'S      ●─────●─────●                       │
      │         │  VAULT                                              │
y=-5  │         ●  SUPPLY HUB                                        │
      │         ↓                                                     │
      └───────────────────────────────────────────────────────────────┘
```

### Named Locations (z=-4)

| Name | Coordinates | Purpose |
|------|-------------|---------|
| Lower Junction | (-14, +5, -4) | Main entry from z=-3 |
| Cutter Barracks | (-14, +6, -4) | Combat cell base |
| Spark Workshop | (-16, +1, -4) | Tech operations, salvage |
| Safe House | (-12, 0, -4) | Hideout with multiple exits |
| Dead Drop | (-8, 0, -4) | Message exchange point |
| Runner's Den | (-4, +2, -4) | Courier cell |
| Interrogation | (-14, -2, -4) | Prisoner holding |
| Keeper's Vault | (-14, -4, -4) | Armored supply cache |
| Supply Hub | (-14, -5, -4) | Continues down to z=-5 |

### Corridor Structure (z=-4)

| Corridor | Direction | Rooms |
|----------|-----------|-------|
| West Spine | (-14, +6) to (-14, -5) | 12 rooms (N-S) |
| Upper Cross | (-16, +1) to (-4, +1) | 13 rooms (E-W) |
| Safe House Corridor | (-14, 0) to (-8, 0) | 6 rooms (E-W) |
| Eastern Spur | (-8, +1) to (-8, -4) | 5 rooms (N-S) |
| Lower Cross | (-14, -4) to (-8, -4) | 6 rooms (E-W) |

**Total z=-4 rooms: 40** (9 named + 31 passages)

---

## Level z=-5: Deep Tunnels (Command)

Reinforced chambers. Near water table. Sister Gray's domain.

```
        x=-16    x=-14    x=-12    x=-10
           │        │        │        │
      ┌────┴────────┴────────┴────────┴────┐
      │                                     │
y=-5  │         ●  THE DESCENT              │
y=-4  │         │                           │
y=-3  │   ●─────●─────●─────●─────●         │
      │  ARCHIVE WAR        │   HOLDING     │
      │         ROOM        │   CELLS       │
y=-2  │         │           │               │
y=-1  │   ●─────●  THE VAULT                │
      │  COUNCIL│                           │
y=0   │  CHAMB  │                           │
y=+1  │   ●─────●  SISTER'S QUARTERS       │
      │  CLONE  │                           │
      │  LAB    ↓ (to z=-6 The Blind)      │
      └─────────────────────────────────────┘
```

### Named Locations (z=-5)

| Name | Coordinates | Purpose |
|------|-------------|---------|
| The Descent | (-14, -5, -5) | Entry from Supply Hub z=-4 |
| War Room | (-14, -3, -5) | Command center, planning |
| Archive | (-16, -3, -5) | Intelligence files, dossiers |
| Holding Cells | (-10, -3, -5) | High-value prisoners |
| The Vault | (-14, -1, -5) | Mask decoy chamber |
| Council Chambers | (-16, -1, -5) | Inner circle meetings |
| Sister's Quarters | (-14, +1, -5) | Her austere private space |
| Clone Lab | (-16, +1, -5) | Continuity operations |

### Corridor Structure (z=-5)

| Corridor | Direction | Rooms |
|----------|-----------|-------|
| Main Spine | (-14, -5) to (-14, +1) | 7 rooms (S-N) |
| Command Cross | (-16, -3) to (-10, -3) | 7 rooms (E-W) |
| Lower Cross | (-16, +1) to (-14, +1) | 3 rooms (E-W) |

**Total z=-5 rooms: 16** (8 named + 8 passages)

---

## Level z=-6: The Blind

Ultra-secure chamber below water table. Pluribus cannot see here.

```
        x=-14
           │
      ┌────┴────┐
      │         │
y=+1  │    ●    │  THE BLIND
      │         │  Where the Mask is kept
      └─────────┘
```

| Name | Coordinates | Purpose |
|------|-------------|---------|
| The Blind | (-14, +1, -6) | Faraday-cage isolation, total darkness |

**Characteristics:**
- No signals penetrate (electromagnetic isolation)
- Complete darkness (engineered, not merely unlit)
- Below water table (constant seepage pressure)
- Only Sister Gray and one trusted keeper know location
- The Mask is here

**Total z=-6 rooms: 1**

---

## Strategic Value

**Bypass Surface Blockages:**
- Yesler Way is blocked (except Waterfront) - underground goes anywhere
- Sinkhole is impassable on surface - tunnels route around it
- All major buildings connected below

**Cartel Advantage:**
- Multiple entry/exit points (if one is compromised, others remain)
- Depth = security (deeper = harder to reach = more secure)
- Pluribus cannot monitor underground (no sensors, no drones)

**The Network Pattern:**

```
SURFACE:  [Fabrication] ──blocked── [Smith Tower] ──blocked── [Occidental Park]
               │                          │                          │
               ↓                          ↓                          ↓
z=-2:     ◆────●────●────●────●────●────●────◆────────────●────●────◆
          │         WEST SPINE              │       S. MAIN CORRIDOR │
          │                                 │                        │
          ◆ Supply Depot                    └────────────────────────┘
```

---

*This document is builder-facing canon. Do not share with players.*
