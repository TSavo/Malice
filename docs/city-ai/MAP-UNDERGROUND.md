# Seattle Underground - Map

The buried streets and tunnels beneath Pioneer Square. Gray Cartel territory.

---

## Surface Reference (z=0)

```
             x=-21    x=-14    x=-7     x=0      x=+7     x=+14
              │        │        │        │        │        │
        ┌─────┴────────┴────────┴────────┴────────┴────────┴─────┐
y=+12   │ WATER   ═══════════ YESLER WAY ══════════════════════ │
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
| E5 | Yesler Way | Hidden grating (-7, +12) | Shaft (new) | Yesler Access (-7, +12) |
| E6 | 4th Avenue | Utility hatch (+14, 0) | Steam shaft | 4th Ave Access (+14, 0) |
| E7 | King Street Station | Platform access (+4, -12) | Service shaft | Platform Tunnel (+4, -12) |

---

## Level z=-2: Upper Tunnels (Dense Corridor Network)

The original 1889 street level plus modern expansions. All rooms at adjacent coordinates for auto-connection.

### Full Network Overview

```
    x=-21 -20 -19 -18 -17 -16 -15 -14 -13 -12 -11 -10  -9  -8  -7  -6  -5  -4  -3  -2  -1   0  +1  +2  +3  +4  +5  +6  +7  +8  +9 +10 +11 +12 +13 +14
       │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │
  ┌────┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴────┐
  │                                                                                                                                                      │
y=+12 ●───●───●───●───●───●───●───●───●   ●───●───●───●───●───●───●───●───●───●                                       ●───●   YESLER WAY UNDERGROUND  │
  │   WATERFRONT           │         │   │   YESLER UNDERGROUND        │   │                                         │   │   (y=+12, full width)        │
  │   NORTHERN             │         │   │   (PROHIBITION ERA)         │   │                                         │   │                              │
y=+11                      │         │   │                             │   │                                         │   │                              │
  │                        │         │   │                             │   │                                         │   │                              │
y=+10  ◆───●───●───●───●───●───●───●───●───●───●───●                    │   │   │   │                                │   │   FABRICATION BRANCH        │
  │    E2                              │                                │   │   │   │                                │   │   (y=+10, x=-20 to -11)     │
  │                                    │                                │   │   │   │                                │   │                              │
y=+9                                   ●───●───●───◆E1                  │   │   │   │                                │   │   SMITH TOWER FOUNDATIONS   │
  │                                    │           SMITH                │   │   │   │                                │   │   (y=+9, x=-14 to -12)      │
  │                                    │           TOWER                │   │   │   │                                │   │                              │
y=+8                                   │                                │   │   │   │                   ●───●───●───●───●   FOURTH AVE NORTH           │
  │                                    │                                │   │   │   │                   │                   (y=+8, steam tunnels)      │
y=+7                                   │                                │   │   │   │                   │                                              │
  │                                    │                                │   │   │   │                   │                                              │
y=+6                                   │                                ●   │   │   │                   │                   WEST SPINE                 │
  │                                    │                                │   │   │   │                   │                   (x=-14, y=+10 to -8)       │
y=+5                                   ●                                │   │   │   │                   │                   THE JUNCTION               │
  │                                    │                                │   │   │   │                   │                                              │
y=+4       ●───●───●                   ●───●───●───●───●───●───●───●───●   │   │   │   ●───●───●───●───●                   GRAND CENTRAL & PARK       │
  │        │       │                   │                       ▓   ▓   │   │   │   │   │                                   (x=-14 to -4, y=+4)         │
y=+3       │       ●───●───●           ●───●───●───●───●───●───●───●   │   │   │   │   │                                   TIDAL CAVES                │
  │        │       TIDAL               │                       ▓   ▓   │   │   │   │   │                                                              │
y=+2       │       CAVE                │                   ●───●───●───◆E3 │   │   │   ●───●───●                                                      │
  │        │       │                   │                   ▓   ▓       │   │   │   │   BOILER                                                         │
y=+1       │       │                   │                   ●───●───●───●   │   │   │   ROOM                                                           │
  │        │       │                   │                   ▓   ▓   ▓   ▓   │   │   │   │                                                              │
y=0   ●───●───●───●───●───●───●───●───●───●───●───●───●───●───●───●───●───●───●───●───●───●───●───●───●───●   ●───●───●───●───●───●───●───●───●───●───●───●
  │   SEAWALL              │       MAIN                                 S. MAIN  2ND AVE      │   │   │       STEAM                           4TH AVE  │
  │   PIER                 │       CROSSING                             CORRIDOR  BASEMENT    │   │   │       MAIN                           ACCESS     │
y=-1       ●               │           │                                                      │   │   │       JUNCTION                                  │
  │        │               │           │                                                      │   │   │       │                                         │
y=-2       ●               │           │                                                      │   │   │       │                                         │
  │        │               │           │                                                      │   │   │       │                                         │
y=-3       ●               │           │                                                      │   │   │       │                                         │
  │        SMUGGLER        │           │                                                      │   │   │       │                                         │
y=-4       ●               │           │                                                      │   │   │       ●───●───●───●                             │
  │        DOCK            │           │                                                      │   │   │       TRANSFORMER                               │
y=-5   ◆──●───●───●───●───●───●───●───●───●                                                   │   │   │       │                                         │
  │    E4                       SUPPLY                                                        │   │   │       │                                         │
  │    SUPPLY                   JUNCTION                                                      │   │   │       │                                         │
y=-6       ●                   ●───●   │                                                      │   │   │       │                                         │
  │        │                           │                                                      │   │   │       │                                         │
y=-7       │                   ●───●   │                                                      │   │   │       │                                         │
  │        │                   EDGE    │                                                      │   │   │       │                                         │
y=-8       │                       ●   ⊗                                                      │   │   │       │                                         │
  │        │                    DROWNED                                                       │   │   │       │                                         │
y=-10      │                                                                                  │   │   │   ●───●───●───●───●───●                         │
  │        │                                                                                  │   │   │   FREIGHT                                       │
y=-12 ●───●───●───●───●───●───●───●───●───●───●───●───●───●───●───●───●───●───●───●───●───●───●───●───●───●───●───●───●───●───●   KING STREET UNDERGROUND│
  │   KING WEST             │               KING MAIN                              │   │   │   │                   KING TERMINUS │                     │
  │                         │                                                      │   │   │   │                                 │                     │
  └──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

Legend:
  ◆  = Entry point (building/surface connection)
  ●  = Underground room
  ⊗  = Dead end (blocked/flooded)
  │─ = Tunnel passage (adjacent coordinates auto-connect)

### Network Sections

#### Western Network (Gray Cartel Core)
| Corridor | Direction | Start | End | Room Count |
|----------|-----------|-------|-----|------------|
| West Spine | N-S | (-14, +12) | (-14, -8) | 21 |
| Fabrication Branch | E-W | (-20, +10) | (-11, +10) | 10 |
| Supply Branch | E-W | (-20, -5) | (-14, -5) | 7 |
| S. Main Corridor | E-W | (-21, 0) | (-3, 0) | 19 |

#### Waterfront Underground (NEW)
| Corridor | Direction | Start | End | Room Count |
|----------|-----------|-------|-----|------------|
| Pier Spine | N-S | (-21, +4) | (-21, -6) | 11 |
| Tidal Caves | N-S | (-21, -3) | (-21, -6) | 4 |
| Wharf Connections | E-W | (-21, 0) | (-17, 0) | 5 |
| Warehouse Row | N-S | (-19, +4) | (-19, -3) | 9 |

#### Eastern Underground (underground-east)
| Corridor | Direction | Start | End | Room Count |
|----------|-----------|-------|-----|------------|
| Occidental Corridor | N-S | (-7, -5) | (-7, +6) | 12 |
| Second Ave Underground | N-S | (0, -3) | (0, +5) | 9 |
| Eastern Extension | E-W | (0, 0) | (+7, 0) | 8 |

#### Eastside Underground (NEW)
| Corridor | Direction | Start | End | Room Count |
|----------|-----------|-------|-----|------------|
| Steam Tunnel | E-W | (+8, 0) | (+14, 0) | 7 |
| Fourth Ave Spine | N-S | (+14, -4) | (+14, +4) | 9 |
| Utility North | E-W | (+10, +4) | (+14, +4) | 5 |

#### Yesler Underground (NEW)
| Corridor | Direction | Start | End | Room Count |
|----------|-----------|-------|-----|------------|
| Yesler Way Main | E-W | (-14, +12) | (+14, +12) | 29 |
| Prohibition Hall | cluster | (-14, +6) | (-10, +10) | 8 |
| Historic Basements | scattered | (+2, +8) | (+10, +10) | 12 |

#### King Street Underground (NEW)
| Corridor | Direction | Start | End | Room Count |
|----------|-----------|-------|-----|------------|
| King Street Main | E-W | (-21, -12) | (+14, -12) | 36 |
| Freight Tunnels | cluster | (-17, -10) | (-7, -10) | 12 |
| Rail Platform | E-W | (+4, -10) | (+7, -10) | 4 |

**Total z=-2 rooms: ~267** (88 original + 29 waterfront + 35 eastside + 36 yesler + 39 king + 40 eastern)

---

## Level z=-3: Transitional Layer (Buffer Zone with Horizontal Network)

The deep transitional level connecting z=-2 to z=-4. Includes natural caves, utility infrastructure, and flooded sections.

### Western Network (Gray Cartel Secured)
```
    x=-14 -13 -12 -11 -10  -9  -8  -7  -6  -5  -4  -3  -2  -1   0
       │   │   │   │   │   │   │   │   │   │   │   │   │   │   │
  ┌────┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴────┐
y=+5  │    ●  JUNCTION SHAFT                                        │
y=+4  │    │                                                        │
y=+2  │    │   ●───●───●───●───●───●───●───●   CISTERN BRANCH       │
y=0   │    ●───────────────────────●───●───●   THE DEEP CROSSING    │
y=-4  │    ●───────────────────────●  SUPPLY SHAFT                  │
y=-8  │    ↓                          ●  DROWNED TERMINUS           │
  └────────────────────────────────────────────────────────────────────┘
```

### Eastern Deep Network (underground-east z=-3)
Horizontal passages connecting upper tunnels to Gray Cartel territory.

### Waterfront Deep (NEW)
Sea caves, flooded passages, and cistern access beneath the piers.

### Eastside Deep (NEW)
Rail tunnel connections and deep eastern passages.

**Total z=-3 rooms: ~75** (29 original + 22 waterfront + 18 eastside + 6 yesler)

---

## Level z=-4: Lower Passages (Operational)

Cramped service tunnels (6-8 ft). Cell bases, logistics, operational infrastructure.
Gray Cartel secured territory.

```
        x=-16    x=-14    x=-12    x=-10    x=-8     x=-6     x=-4
           │        │        │        │        │        │        │
      ┌────┴────────┴────────┴────────┴────────┴────────┴────────┴────┐
y=+6  │         ●  CUTTER BARRACKS                                   │
y=+5  │   ●─────●  LOWER JUNCTION                                    │
y=+2  │         │                                    ●  RUNNER'S DEN  │
y=+1  │   ●─────●─────●─────●─────●─────●─────●─────●                 │
y=0   │         ●─────●  SAFE     ●  DEAD                            │
y=-2  │         ●  INTERROGATION              ●                       │
y=-4  │   ●─────●  KEEPER'S      ●─────●─────●                       │
y=-5  │         ●  SUPPLY HUB                                        │
      └───────────────────────────────────────────────────────────────┘
```

**Total z=-4 rooms: 40**

---

## Level z=-5: Deep Tunnels (Command)

Reinforced chambers. Near water table. Sister Gray's domain.

```
        x=-16    x=-14    x=-12    x=-10
           │        │        │        │
      ┌────┴────────┴────────┴────────┴────┐
y=-5  │         ●  THE DESCENT              │
y=-3  │   ●─────●─────●─────●─────●         │
      │  ARCHIVE WAR        │   HOLDING     │
y=-1  │   ●─────●  THE VAULT                │
      │  COUNCIL│                           │
y=+1  │   ●─────●  SISTER'S QUARTERS       │
      │  CLONE  ↓ (to z=-6 The Blind)      │
      └─────────────────────────────────────┘
```

**Total z=-5 rooms: 16**

---

## Level z=-6: The Blind

Ultra-secure chamber below water table. Pluribus cannot see here.

| Name | Coordinates | Purpose |
|------|-------------|---------|
| The Blind | (-14, +1, -6) | Faraday-cage isolation, total darkness |

**Total z=-6 rooms: 1**

---

## Network Statistics

| Level | Original | Waterfront | Eastside | Yesler | King Street | Eastern | Total |
|-------|----------|------------|----------|--------|-------------|---------|-------|
| z=-2 | 88 | 29 | 35 | 36 | 39 | 40 | **267** |
| z=-3 | 29 | 22 | 18 | 6 | 0 | 0 | **75** |
| z=-4 | 40 | 0 | 0 | 0 | 0 | 0 | **40** |
| z=-5 | 16 | 0 | 0 | 0 | 0 | 0 | **16** |
| z=-6 | 1 | 0 | 0 | 0 | 0 | 0 | **1** |
| **Total** | **174** | **51** | **53** | **42** | **39** | **40** | **399** |

---

## Strategic Value

**City-Wide Coverage:**
- Underground now reaches ALL edges of the city
- Waterfront (x=-21) to 4th Avenue (x=+14)
- King Street (y=-12) to Yesler Way (y=+12)
- True 3D network from z=-2 to z=-6

**Bypass Surface Blockages:**
- Yesler Way blocked above - underground goes anywhere
- Sinkhole impassable on surface - tunnels route around it
- All major buildings connected below
- Multiple entry/exit points (if one compromised, others remain)

**Thematic Zones:**
- **Waterfront:** Salt-crusted smuggler caves, tidal flooding, hidden docks
- **Eastside:** Steam tunnels, utility infrastructure, rail connections
- **Yesler:** Prohibition speakeasies, gambling dens, historic basements
- **King Street:** Industrial freight, rail yard access, platform tunnels

**Territorial Control:**
- **Gray Cartel Core (x < -7):** Secured to z=-6, defensive depth
- **Eastern Expansion (x >= -7):** Contested, only to z=-3
- **Waterfront (x=-21):** Smuggler routes, tidal access
- **Rail Network (y=-12):** Industrial infrastructure, freight movement

---

*This document is builder-facing canon. Do not share with players.*
