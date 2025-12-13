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
+11   │ ●  │  │  │  │  │  │  ●  ╔══════════╗  │  │  ●  │  │  │  │  │  │  ●  │  │  │  │  │  │  ●  │  │  │  │  │  │  ● │
      │ │  │  │  │  │  │  │  │  ║ SMITH    ║  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │ │
+10   │ ●  │  │  │  │  │  │  D  ║ TOWER    ║  │  │  ●  │  │  │  │  │  │  ●  ╔══════════════════╗  ●  │  │  │  │  │  ● │
      │ │  │  │  │  │  │  │  │  ║          ║  │  │  │  │  │  │  │  │  │  │  ║                  ║  │  │  │  │  │  │  │ │
 +9   │ ●  │  │  │  │  │  │  ●  ╚══════════╝  │  │  ●  │  │  │  │  │  │  ●  ║    PIONEER       ║  ●  │  │  │  │  │  ● │
      │ │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  ║    BUILDING      ║  │  │  │  │  │  │  │ │
 +8   │ ●  │  │  │  │  │  │  ●  │  │  │  │  │  │  ●  │  │  │  │  │  │  ●  ╚══════════════════╝  ●  │  │  │  ╔═══════════╗
      │ │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  ║ COLLAPSED ║
 +7   │ ●  │  │  │  │  │  │  ●  │  │  │  │  │  │  ●  │  │  │  │  │  │  ●  │  │  │  │  │  │  ●  │  │  │  │  ║  (rubble) ║
      │ │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  ╚═══════════╝
 +6   │ ●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──● │ WASHINGTON
      │ │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │ │
 +5   │ ●  │  │  │  │  │  │  ●  │  │  │  │  │  │  ●  │  │  │  │  │  │  ●  │  │  │  │  │  │  ●  │  │  │  │  │  │  ● │
      │ │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │ │
 +4   │ ●  │  │  │  │  │  │  ●  ╔══════════════╗  ●  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  ╔══════════════════════════╗  │  │  │  ● │
      │ │  │  │  │  │  │  │  │  ║              ║  │  ▓                 ▓  ║                          ║  │  │  │  │ │
 +3   │ ●  │  │  │  │  │  │  ●  ║    GRAND     ║  ●  ▓                 ▓  ║                          ║  │  │  │  ● │
      │ │  │  │  │  │  │  │  │  ║    CENTRAL   ║  │  ▓   OCCIDENTAL    ▓  ║       CORP               ║  │  │  │  │ │
 +2   │ ●  │  │  │  │  │  │  ●  ║              ║  D  ▓      PARK    ⊕  ▓  ║    CONSTRUCTION          ║  │  │  │  ● │
      │ │  │  │  │  │  │  │  │  ╚══════════════╝  │  ▓                 ▓  ║      (fenced)            ║  │  │  │  │ │
 +1   │ ●  │  │  │  │  │  │  ●  │  │  │  │  │  │  ●  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  ║          D               ║  │  │  │  ● │
      │ │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  ╚══════════════════════════╝  │  │  │  │ │
  0   │ ●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──● │ MAIN
      │ │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │ │
 -1   │ ●  │  │  │  │  │  │  ●  │  │  │  │  │  │  ●  │  │  │  │  │  │  ●  │  │  │  │  │  │  ●  │  │  │  │  │  │  ● │
      │ │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │ │
 -2   │ ●  │  │  │  │  │  │  ●  │  │  │  │  │  │  ●  │  │  │  │  │  │  ●  │  │  │  │  │  │  ●  │  │  │  │  │  │  ● │
      │ │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │ │
 -3   │ ●  │  │  │  │  │  │  ●  │  │  │  │  │  │  ●  │  │  │  │  │  │  ●  │  │  │  │  │  │  ●  │  │  │  │  │  │  ● │
      │ │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │ │
 -4   │ ●  │  │  │  │  │  │  ●  │  │  │  │  │  │  ●  │  │  │  │  │  │  ●  │  │  │  │  │  │  ●  │  │  │  │  │  │  ● │
      │ │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │ │
 -5   │ ●  │  │  │  │  │  │  ●  │  │  │  │  │  │  ●  │  │  │  │  │  │  ●  │  │  │  │  │  │  ●  │  │  │  │  │  │  ● │
      │ │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │ │
 -6   │ ●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──● │ JACKSON
      │ │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │ │
 -7   │ ●  │  │  ╔════════════════════╗  │  │  │  ●  │  │  │  │  │  │  ●  │  │  │  │  │  │  ●  ╔══════════╗  │  ● │
      │ │  │  │  ║                    ║  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  ║ CONDEMN  ║  │  │ │
 -8   │ ●  │  │  ║     SINKHOLE       ║  │  │  │  ●  │  │  │  │  │  │  ●  │  │  │  │  │  │  ●  ║  (toxic) ║  │  ● │
      │ │  │  │  ║   ~~~FLOODED~~~    ║  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  ║    ☠     ║  │  │ │
 -9   │ ●  │  │  ║        ☠           ║  │  │  │  ●  │  │  │  │  │  │  ●  │  │  │  │  │  │  ●  ╚══════════╝  │  ● │
      │ │  │  │  ╚════════════════════╝  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │ │
-10   │ ●  │  │  │  │  │  │  │  │  │  │  ●  │  │  │  │  │  │  │  │  │  ●  │  │  │  │  │  │  ●  │  │  │  │  │  │  ● │
      │ │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │ │
-11   │ ●  │  │  │  │  │  │  │  │  │  │  ●  │  │  │  │  │  │  │  │  │  ●  │  │  │  │  │  │  ●  │  │  │  │  │  │  ● │
      │ │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │ │
-12   │ ●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──● │ KING
      ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
         ↑                       ↑                       ↑                       ↑                       ↑
      WATERFRONT              1ST AVE               OCCIDENTAL               2ND AVE                 3RD AVE
        x=-21                  x=-14                   x=-7                    x=0                     x=+7
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
| Smith Tower | -13 to -10 | +9 to +11 | N: (-12, +11), W: (-13, +10) | 38 floors, historic landmark |
| Pioneer Building | +1 to +4 | +8 to +10 | (+5, +9) | 6 floors, offices |
| Grand Central | -13 to -10 | +2 to +4 | (-9, +2) | 4 floors, arcade |
| Corp Construction | 0 to +6 | +1 to +4 | (+6, +1) | Unknown, armed guards, blocks 2nd Ave |

## Hazard Zones (Impassable)

| Name | X Range | Y Range | Notes |
|------|---------|---------|-------|
| Collapsed Building | +9 to +14 | +7 to +10 | Rubble, unstable |
| Sinkhole | -18 to -15 | -9 to -7 | Flooded 15m deep |
| Condemned Block | +9 to +12 | -9 to -7 | Toxic, fenced |

## Open Spaces

| Name | X Range | Y Range | Notes |
|------|---------|---------|-------|
| Occidental Park | -6 to -1 | +1 to +4 | Plaza, dead trees, ⊕ underground access |

## Room Counts

- **Total grid:** 36 x 25 = 900 coordinates
- **Blocked by buildings:** ~100 coordinates
- **Blocked by hazards:** ~50 coordinates
- **Walkable:** ~750 rooms at street level
- **Building interiors (future):** +200 rooms when opened
- **Underground (future):** +100 rooms

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
