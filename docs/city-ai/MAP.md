# Pioneer Square - Street Level Map

The oldest neighborhood in Seattle. Where Maynard's cardinal grid meets Denny's angled grid at Yesler Way.
Historic brick buildings, the Underground beneath, and urban decay.

## Coordinate System

- **Grid:** Integer coordinates, (0,0) at center (S. Main & 2nd Ave S)
- **X-axis:** West (-) to East (+)
- **Y-axis:** South (-) to North (+)
- **Z-axis:** Vertical (0 = street, negative = underground, positive = upper floors)

### Avenues (W→E) - 7 apart, 6 walkable rooms between
| Avenue | X |
|--------|---|
| Waterfront | -21 |
| 1st Ave S | -14 |
| Occidental | -7 |
| 2nd Ave S | 0 |
| 3rd Ave S | +7 |
| 4th Ave S | +14 |

### Streets (S→N) - 6 apart, 5 walkable rooms between
| Street | Y |
|--------|---|
| S. King | -12 |
| S. Jackson | -6 |
| S. Main | 0 |
| S. Washington | +6 |
| Yesler Way | +12 |

## Block Layout

Each block between avenues (7 units):
```
Ave ─ sidewalk ─ Building (4 wide) ─ sidewalk ─ Ave
 0       1         2   3   4   5        6        7
```

Each block between streets (6 units):
```
Street ─ sidewalk ─ Building (3 tall) ─ sidewalk ─ Street
   0         1         2    3    4          5         6
```

## Street Level (z=0)

```
      -21-20-19-18-17-16-15-14-13-12-11-10 -9 -8 -7 -6 -5 -4 -3 -2 -1  0 +1 +2 +3 +4 +5 +6 +7 +8 +9+10+11+12+13+14
      ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
+12   │ ●──●──●──●──●──●──●──●──●──D──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──● │ YESLER
      │ │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │ │
+11   │ D ╔════════╗|╔════╗  ●  │  │  │  │  │  │  ●  │  │  │  │  ╔══════════╗ ●  │  │  │  │  │  │  ●  │  │  │  │  │  │  ● │
      │   ║FABRICA ║|║IMMI║  │  │  │  │  │  │  │  │  │  │  │  │  ║ SMITH    ║ │  │  │  │  │  │  │  │  │  │  │  │  │  │ │
+10   │ D ║ TION   ║|╚════╝D ●  │  │  │  │  │  │  ●  │  │  │  │  ║ TOWER    ║D╔═══════════════╗ ●  │  │  │  │  |  │  ● │
      │   ║FACTORY ║|╔════╗  │  │  │  │  │  │  │  │  │  │  │  │  ║          ║ ║               ║ │  │  │  │  │  │  │  | │
 +9   │   ║        ║|║CITY║D ●  │  │  │  │  │  │  ●  │  │  │  │  ╚══════════╝ ║    PIONEER    ║ ●  │  │  │  │  |  │  ● │
      │   ║        ║|║SVCS║  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  ║    BUILDING   ║ │  │  │  │  │  │  |  │ │
 +8   │   ╚════════╝ ╚════╝  ●  │  │  │  │  │  │  ●  │  │  │  │  │  │  │  ●  ╚═══════════════╝ ●  │  │  │  |  ╔═══════════╗
      │ │ ╔═ STRIP═╗│╔HOTL╗  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  ║ COLLAPSED ║
 +7   │ ● ╚══MALL══╝│╚════╝  ●  │  │  │  │  │  │  ●  │  │  │  │  ╔══╗  ●  │  │  │  │  │  │  ●  │  │  │  │  ║  (rubble) ║
      │ │  D  D  D  │  D  │  │  │  │  │  │  │  │  │  │  │  │  ║  ║  │  │  │  │  │  │  │  │  │  │  │  │  │  │  ╚═══════════╝
 +6   │ ●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──D──╚══╝──●──●──●──●──●──●──●──●──●──●──●──●──●──● │ WASHINGTON
      │ │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │ │
 +5   │ ●  │  │  │  │  │  │  ●  │  │  │  │  │  │  ●  │  │  │  │  │  │  ●  │  │  │  │  │  │  ●  │  │  │  │  │  │  ● │
      │ │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │ │
 +4   │ ●  │  │  │  │  │  │  ●  ╔══════════════╗  ●  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  ╔══════════════════════════╗  │  │  │  ● │
      │ │  │  │  │  │  │  │  │  ║              ║  │  ▓                 ▓  ║                          ║  │  │  │  │ │
 +3   │ ●  │  │  │  │  │  │  ●  ║    GRAND     ║  ●  ▓                 ▓  ║                          ║  │  │  │  ● │
      │ │  │  │  │  │  │  │  │  ║    CENTRAL   ║  │  ▓   OCCIDENTAL    ▓  ║       CORP               ║  │  │  │  │ │
 +2   │ ●  │  │  │  │  │  │  ●  ║              ║  D  ▓      PARK       ▓  ║    CONSTRUCTION          ║  │  │  │  ● │
      │ │  │  │  │  │  │  │  │  ╚══════════════╝  │  ▓                 ▓  ║      (fenced)            ║  │  │  │  │ │
 +1   │ ●  │  │  │  │  │  │  ●  │  │  │  │  │  │  ●  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  ║          D               ║  │  │  │  ● │
      │ │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  ╚══════════════════════════╝  │  │  │  │ │
  0   │ ●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──● │ MAIN
      │ │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │ │
 -1   │ ●  │  │  │  │  │  │  ●  │  │  │  │  │  │  ●  │  │  │  │  │  │  ●  │  │  │  │  │  │  ●  │  │  │  │  │  │  ● │
      │ │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │ │
 -2   │ ●  │  │  │  │  │  │  ●  │  │  │  │  │  │  ●  │  │  │  │  │  │ ╔═════╗  │  │  │  │  D  │  │  │  │  │  │  ● │
      │ │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │ ║WASH ║  │  │  │  │  │  │  │  │  │  │  │  │ │
 -3   │ ●  │  │  │  │  │  │  ●  │  │  │  │  │  │  ●  │  │  │  │  │  │ ╚═════╝  │  │  │  │  ●  │  │  │  │  │  │  ● │
      │ │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │ │
 -4   │ ● ╔════╗ │  │  │  │  ●  │  │  │  │  │  │  ●  │  │  │  │  │  │  ●  │  │  │  │  │  │  ●  │  │  │  │  │  │  ● │
      │ │ ║SUPP║ │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │ │
 -5   │ D ╚════╝ │  │  │  │  ●  │  │  │  │  │  │  ●  │  │  │  │  │  │  ●  │  │  │  │  │  │  ●  │  │  │  │  │  │  ● │
      │ │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │ │
 -6   │ ●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──● │ JACKSON
      │ │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │ │
 -7   │ ●  │  │  ╔════════════════════╗  │  │  │  ●  │  │  │  │  │  │  ●  │  │  │  │  │  │  ●  ╔══════════╗   │  ● │
      │ │  │  │  ║                    ║  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  ║ CONDEMN  ║   │  │ │
 -8   │ ●  │  │  ║     SINKHOLE       ║  │  │  │  ●  │  │  │  │  │  │  ●  │  │  │  │  │  │  ●  ║  (toxic) ║   │  ● │
      │ │  │  │  ║   ~~~FLOODED~~~    ║  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  ║          ║   │  │ │
 -9   │ ●  │  │  ║                    ║  │  │  │  ●  │  │  │  │  │  │  ●  │  │  │  │  │  │  ●  ╚══════════╝   │  ● │
      │ │  │  │  ╚════════════════════╝  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │ │
-10   │ ●  │  │  │  │  │  │  ●  │  │  │  |  │  │  │  │  │  │  │  │  │  ●  │  │  │  │  │  │  ●  │  │  │  │  │  │  ● │
      │ │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │ │
-11   │ ●  │  │  │  │  │  │  ●  │  │  │  |  │  │  │  │  │  │  │  │  │  ●  │  │  │  │  │  │  ●  │  │  │  │  │  │  ● │
      │ │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │ │
-12   │ ●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──● │ KING
      ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
         ↑                               ↑                             ↑                    ↑                    ↑
      WATERFRONT                      1ST AVE                      OCCIDENTAL            2ND AVE              3RD AVE
        x=-21                          x=-14                         x=-7                  x=0                 x=+7
```

## Legend

| Symbol | Meaning |
|--------|---------|
| `●` | Walkable coordinate (room) |
| `●──●` | East-west connection |
| `│` | North-south connection |
| `╔═══╗` | Building footprint (blocked) |
| `D` | Door (entry point to building interior) |
| `▓▓▓` | Occidental Park (open plaza, walkable) |
| `⊕` | Underground access |
| `~~~~` | Flooded area |
| `☠` | Hazard zone |

## Buildings

| Name | X Range | Y Range | Door Location | Notes |
|------|---------|---------|---------------|-------|
| Yesler Laundry | -10 to -9 | +12 to +13 | S: (-9, +12) | 3 floors (ground laundromat + apartment + roof), abandoned with rotted clothes |
| Smith Tower | -3 to 0 | +9 to +11 | N: (-2, +12), W: (0, +10) | 38 floors, historic landmark, 2nd Ave & Yesler |
| Immigration Services | -16 to -15 | +10 to +11 | E: (-14, +10) | 2 floors (ground + roof), repurposed federal building |
| City Services | -16 to -15 | +8 to +9 | E: (-14, +9) | 3 floors + roof, sanitation/water/power/operations |
| Fabrication Factory | -20 to -18 | +8 to +11 | W: (-21, +11), W: (-21, +10) | Infrastructure manufacturing, old transport warehouse |
| Pioneer Building | +1 to +4 | +8 to +10 | (+5, +9) | 6 floors, offices |
| Pioneer Antiques | -4 to -3 | +6 to +7 | S: (-3, +6) | 2 floors + roof, double-wide antique store with grandfather clock frozen at 2:47, estate jewelry gallery |
| Grand Central | -13 to -10 | +2 to +4 | (-9, +2) | 4 floors, arcade |
| Corp Construction | 0 to +6 | +1 to +4 | (+6, +1) | Unknown, armed guards, blocks 2nd Ave |
| Supply Depot | -20 to -19 | -5 to -4 | W: (-21, -5) | Distribution center, sealed packages |
| Jade Noodle House | -11 to -10 | -6 to -5 | S: (-10, -6) | 3 floors (ground restaurant + apartment + roof), hand-pulled noodles, International District |
| King Pharmacy | +3 to +5 | -12 to -11 | S: (+4, -12) | 3 floors + roof, hybrid Chinese/Western pharmacy, looted |
| Washington Federal Bank | -1 to 0 | -3 to -2 | E: (0, -2) | 3 floors, neoclassical bank with sealed vault |
| King County Courthouse | +8 to +10 | +1 to +3 | W: (+7, +2) | 6 floors (basement through roof), brutalist government building, archives and courtrooms |
| Colman Building | -13 to -10 | -4 to -1 | W: (-13, -2) | 5 floors (basement through roof), historic 1889 Romanesque Revival, residential apartments with underground tunnel connection |
| Doc Maynard's Public House | -15 to -14 | +2 to +3 | W: (-15, +2) | 1 floor, historic saloon and restaurant, established 1889 |
| Gargoyle Building | -18 to -17 | +12 to +13 | W: (-18, +12) | 5 floors, historic warehouse converted to offices, coal cellar access |
| Golden Gate Bakery | 5 to 5 | -12 to -11 | N: (5, -11) | 3 floors (ground bakery + apartment + roof), Chinese bakery |
| Jade Palace Jewelers | +12 to +16 | -4 to -2 | N: (+11, -4) | 4 floors, jewelry store with underground smuggling routes |
| J&M Cafe | -15 to -14 | +4 to +5 | W: (-15, +4) | 2 floors, bar and restaurant |
| Klondike Gold Rush Museum | -12 to -11 | -3 to -2 | E: (+2, -3) | 2 floors, historic exhibits, basement with underground access |
| Merchants Cafe | -15 to -14 | -2 to -1 | Internal only | 5 floors, cafe and bar with underground connection |
| Morrison & Kline | -14 to -13 | +7 to +8 | W: (-14, +7) | 3 floors (ground + 2 residential), law offices |
| Owl Cafe | -15 to -14 | -1 to 0 | W: (-15, -1) | 2 floors, diner |
| Pioneer Books | -14 to -13 | +13 to +15 | W: (-14, +13) | 4 floors, bookstore with basement smuggling route |
| Pioneer Hotel | -16 to -15 | +7 to +7 | W: (-16, +7) | 7 floors (basement through roof), historic hotel, underground access |
| Pioneer Pawn & Loan | +5 to +6 | +14 to +16 | N: (+5, +14) | 2 floors, pawn shop |
| QuickPrint | -12 to -11 | +4 to +6 | E: (-11, +4) | 3 floors (ground + 2 residential), print shop |
| Redux Vintage | -15 to -14 | +4 to +5 | Internal only | 3 floors, vintage clothing with underground smuggling route |
| Second Chance Thrift | -10 to -8 | +8 to +10 | N: (-11, +8) | 3 floors, thrift store |
| Terra Nova Gallery | -15 to -14 | -5 to -4 | W: (-15, -5) | 3 floors, art gallery with basement art vault |
| Trinity Nightclub | -14 to -11 | 0 to +2 | W: (-14, +2) | 3 floors, nightclub with basement entrance to underground |
| Waterfall Garden Park | -6 to -5 | -4 to -3 | E: (-6, -3) | 1 floor (z=0), open park |
| Zeitgeist Building | -13 to -11 | +1 to +3 | W: (-13, +1) | 6 floors, mixed-use building |
| Zeitgeist Coffee | -15 to -14 | +1 to +2 | W: (-15, +1) | 3 floors (ground cafe + 2 residential), coffee shop |

## Hazard Zones (Impassable)

| Name | X Range | Y Range | Notes |
|------|---------|---------|-------|
| Collapsed Building | +9 to +14 | +7 to +10 | Rubble, unstable |
| Sinkhole | -18 to -15 | -9 to -7 | Flooded 15m deep |
| Condemned Block | +9 to +12 | -9 to -7 | Toxic, fenced |

## Open Spaces

| Name | X Range | Y Range | Notes |
|------|---------|---------|-------|
| Occidental Square | -8 to -7 | 0 to +2 | Plaza with underground access (trapdoor) |
| Waterfall Garden Park | -6 to -5 | -4 to -3 | Open park with waterfall feature |

## Underground (z < 0)

### Smith Tower Datacenter (SECRET)

Hidden beneath Smith Tower, accessible only through the Digital Vault on z=0. This facility hosts the Continuum AI core - a pre-Burning datacenter that survived due to EMP shielding.

**Access:** Hidden entrance in bank vault → separate datacenter elevator → basement levels
**Authorization:** CorpSec Security Command controls access

```
z=-1 (Datacenter Level)
       -3       -2        -1
      ─────────────────────────
+11   │                       │
      │        CORE           │
+10   │ POWER  AIRLOCK  COOL  │
      │                       │
 +9   │  NOC   CORRIDOR SERVR │
      ─────────────────────────

z=-2 (Utility Level)
       -3       -2        -1
      ─────────────────────────
 +9   │ TUNNEL UTILITY  MAINT │
      ─────────────────────────
              ↓
        (Future: Seattle Underground)
```

**Rooms:**
| Floor | Rooms | Purpose |
|-------|-------|---------|
| z=-1 | 7 | The Core, Airlock, Corridor, Server Hall, NOC, Power, Cooling |
| z=-2 | 3 | Utility Junction, Maintenance Bay, Escape Tunnel |

**Note:** This facility is NOT on any public maps. Only the highest-level CorpSec personnel know it exists.

## Room Counts

- **Total grid:** 36 x 25 = 900 coordinates
- **Blocked by buildings:** ~100 coordinates
- **Blocked by hazards:** ~50 coordinates
- **Walkable:** ~750 rooms at street level
- **Building interiors (future):** +200 rooms when opened
- **Underground:** ~110 rooms (Datacenter: 10, Seattle Underground: ~100 future)

## Connections to Other Districts

| Direction | Via | Destination |
|-----------|-----|-------------|
| North | **Waterfront only (x=-21, y=+12)** | Downtown (grid rotates 32 degrees) |
| East | 4th Ave (x=+14) | International District |
| South | S. King (y=-12) | SoDo Industrial |
| West | Waterfront (x=-21) | Piers, Elliott Bay |
| Down | Occidental Park ⊕ | Seattle Underground |

## The Grid Collision

Yesler Way marks where two street grids collide. South of Yesler (Pioneer Square), streets run cardinal. North of Yesler (Downtown), streets rotate 32 degrees to follow the shoreline. The grids never aligned properly even before the Event.

After the Event, all but one crossing was blocked:

| Intersection | X | Blockage |
|--------------|---|----------|
| Waterfront | -21 | **OPEN** - gap in cracked seawall |
| 1st Ave | -14 | 6-story building collapsed across street |
| Occidental | -7 | Blast wave debris pile |
| 2nd Ave | 0 | Buildings leaned together, 1-foot gap |
| 3rd Ave | +7 | Light rail tunnel collapse, flooded crater |
| 4th Ave | +14 | Chinatown gate fell across intersection |

The Waterfront passage is the only way between Pioneer Square and Downtown.
