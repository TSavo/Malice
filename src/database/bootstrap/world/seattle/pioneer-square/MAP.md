# Pioneer Square - Street Level Map

The oldest neighborhood in Seattle. Where Maynard's cardinal grid meets Denny's angled grid at Yesler Way.
Historic brick buildings, the Underground beneath, and urban decay.

## Coordinate System

- **Grid:** Integer coordinates, (0,0) at center (S. Main & Occidental)
- **X-axis:** West (-) to East (+)
- **Y-axis:** South (-) to North (+)
- **Z-axis:** Vertical (0 = street, negative = underground, positive = upper floors)

### Avenues (W→E) - 6 apart, 5 rooms between
| Avenue | X |
|--------|---|
| Waterfront | -15 |
| 1st Ave S | -9 |
| Occidental | -3 |
| 2nd Ave S | +3 |
| 3rd Ave S | +9 |
| 4th Ave S | +15 |

### Streets (S→N) - 5 apart, 4 rooms between
| Street | Y |
|--------|---|
| S. King | -10 |
| S. Jackson | -5 |
| S. Main | 0 |
| S. Washington | +5 |
| Yesler Way | +10 |

## Street Level (z=0)

```
     -15 -14 -13 -12 -11 -10  -9  -8  -7  -6  -5  -4  -3  -2  -1   0  +1  +2  +3  +4  +5  +6  +7  +8  +9 +10 +11 +12 +13 +14 +15
     ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
+10  │ ●───●───●───●───●───●───●───●───●───●───●───●───●───●───●───●───●───●───●───●───●───●───●───●───●───●───●───●───●───●───● │ YESLER
     │ │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │ │
 +9  │ ●   │   │   │   │   ●   │   │   │   │   ●   ╔═══════════╗   ╔═══════════════════════════╗   ●   │   │   │   │   ●   │   ● │
     │ │   │   │   │   │   │   │   │   │   │   │   ║           ║   ║                           ║   │   │   │   │   │   │   │   │ │
 +8  │ ●   │   │   │   │   ●   │   │   │   │   ●   ║   SMITH   ║   ║       PIONEER             ║   ●   │   │   │   │   ●   ╔═══════════╗
     │ │   │   │   │   │   │   │   │   │   │   │   ║   TOWER   D   ║       BUILDING        D   ║   │   │   │   │   │   │   ║ COLLAPSED ║
 +7  │ ●   │   │   │   │   ●   │   │   │   │   ●   ║           ║   ║                           ║   ●   │   │   │   │   ●   ║  (rubble) ║
     │ │   │   │   │   │   │   │   │   │   │   │   ╚═══════════╝   ╚═══════════════════════════╝   │   │   │   │   │   │   ╚═══════════╝
 +6  │ ●   │   │   │   │   ●   │   │   │   │   ●   │   │   │   │   │   │   │   │   │   │   │   ●   │   │   │   │   ●   │   │   │   ● │
     │ │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │ │
 +5  │ ●───●───●───●───●───●───●───●───●───●───●───●───●───●───●───●───●───●───●───●───●───●───●───●───●───●───●───●───●───●───● │ WASHINGTON
     │ │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │ │
 +4  │ ●   │   │   │   │   ●   │   │   │   │   ●   │   │   │   │   │   │   │   ●   │   │   │   │   ●   │   │   │   │   │   │   ● │
     │ │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │ │
 +3  │ ●   │   │   │   │   ●   ╔═══════════════╗   ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓   ╔═════════════════════════════════╗   │   │   │   ● │
     │ │   │   │   │   │   │   ║               ║   ▓                     ▓   ║                                 ║   │   │   │   │ │
 +2  │ ●   │   │   │   │   ●   ║    GRAND      D   ▓                     ▓   ║                                 ║   │   │   │   ● │
     │ │   │   │   │   │   │   ║    CENTRAL    ║   ▓    OCCIDENTAL       ▓   ║         CORP                    ║   │   │   │   │ │
 +1  │ ●   │   │   │   │   ●   ║               ║   ▓       PARK      ⊕   ▓   ║      CONSTRUCTION               ║   │   │   │   ● │
     │ │   │   │   │   │   │   ╚═══════════════╝   ▓                     ▓   ║        (fenced)                 ║   │   │   │   │ │
  0  │ ●───●───●───●───●───●───●───●───●───●───●───▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓───║            D                    ║───●───●───●───● │ MAIN
     │ │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   ╚═════════════════════════════════╝   │   │   │   │ │
 -1  │ ●   │   │   │   │   ●   │   │   │   │   ●   │   │   │   │   │   │   ●   │   │   │   │   │   ●   │   │   │   │   │   │   ● │
     │ │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │ │
 -2  │ ●   │   │   │   │   ●   │   │   │   │   ●   │   │   │   │   │   │   ●   │   │   │   │   │   ●   │   │   │   │   │   │   ● │
     │ │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │ │
 -3  │ ●   │   │   │   │   ●   │   │   │   │   ●   │   │   │   │   │   │   ●   │   │   │   │   │   ●   │   │   │   │   │   │   ● │
     │ │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │ │
 -4  │ ●   │   │   │   │   ●   │   │   │   │   ●   │   │   │   │   │   │   ●   │   │   │   │   │   ●   │   │   │   │   │   │   ● │
     │ │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │ │
 -5  │ ●───●───●───●───●───●───●───●───●───●───●───●───●───●───●───●───●───●───●───●───●───●───●───●───●───●───●───●───●───●───● │ JACKSON
     │ │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │ │
 -6  │ ●   │   │   ╔═══════════════════════╗   │   │   │   │   ●   │   │   │   │   ●   │   │   │   │   │   │   ╔═══════════╗   ● │
     │ │   │   │   ║                       ║   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   ║  CONDEMN  ║   │ │
 -7  │ ●   │   │   ║       SINKHOLE        ║   │   │   │   │   ●   │   │   │   │   ●   │   │   │   │   │   │   ║  (toxic)  ║   ● │
     │ │   │   │   ║    ~~~FLOODED~~~      ║   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   ║     ☠     ║   │ │
 -8  │ ●   │   │   ║          ☠            ║   │   │   │   │   ●   │   │   │   │   ●   │   │   │   │   │   │   ╚═══════════╝   ● │
     │ │   │   │   ╚═══════════════════════╝   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │ │
 -9  │ ●   │   │   │   │   │   │   │   │   │   ●   │   │   │   │   ●   │   │   │   │   ●   │   │   │   │   │   │   │   │   │   ● │
     │ │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │ │
-10  │ ●───●───●───●───●───●───●───●───●───●───●───●───●───●───●───●───●───●───●───●───●───●───●───●───●───●───●───●───●───●───● │ KING
     ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
       ↑                       ↑                       ↑                       ↑                       ↑                       ↑
    WATERFRONT              1ST AVE               OCCIDENTAL               2ND AVE                 3RD AVE                 4TH AVE
      x=-15                   x=-9                   x=-3                    x=+3                    x=+9                   x=+15
```

## Legend

| Symbol | Meaning |
|--------|---------|
| `●` | Walkable coordinate (room) |
| `●───●` | East-west connection |
| `│` | North-south connection |
| `╔═══╗` | Building footprint (sealed interior) |
| `D` | Door (sealed entry point) |
| `▓▓▓` | Occidental Park (open plaza) |
| `⊕` | Underground access |
| `~~~~` | Flooded area |
| `☠` | Hazard zone |

## Buildings (Sealed Interiors)

| Name | X Range | Y Range | Door | Notes |
|------|---------|---------|------|-------|
| Smith Tower | -5 to -2 | +7 to +9 | (-2, +8) | 12 floors, historic landmark |
| Pioneer Building | 0 to +4 | +7 to +9 | (+4, +8) | 6 floors, offices |
| Grand Central | -8 to -5 | +1 to +3 | (-5, +2) | 4 floors, arcade |
| Corp Construction | +5 to +10 | 0 to +3 | (+10, 0) | Unknown, armed guards |

## Hazard Zones (Impassable)

| Name | X Range | Y Range | Notes |
|------|---------|---------|-------|
| Collapsed Building | +11 to +15 | +7 to +9 | Rubble, unstable |
| Sinkhole | -12 to -8 | -8 to -6 | Flooded 15m deep |
| Condemned Block | +11 to +14 | -8 to -6 | Toxic, fenced |

## Open Spaces

| Name | X Range | Y Range | Notes |
|------|---------|---------|-------|
| Occidental Park | -4 to +2 | 0 to +3 | Plaza, dead trees, ⊕ underground access |

## Alley Sections (Service character, reduced lighting)

Between S. Main (y=0) and S. Washington (y=+5), these avenue sections take on alley character:

| Avenue | X | Y Range | Notes |
|--------|---|---------|-------|
| 1st Ave S | -9 | +1, +2 | Service corridor, lighting 35-45 |
| Occidental | -3 | +1, +2 | Park-adjacent, lighting 50-55 |
| 2nd Ave S | +3 | +1, +2 | Narrow/dark, lighting 30-40 |
| 3rd Ave S | +9 | +1, +2 | Loading docks, lighting 35-40 |

All alley sections use standard grid coordinates and auto-connect with adjacent rooms.

## Room Counts

- **Total grid:** 31 x 21 = 651 coordinates
- **Blocked by buildings:** ~80 coordinates
- **Blocked by hazards:** ~40 coordinates
- **Walkable:** ~530 rooms at street level
- **Alley sections:** +8 rooms (service corridors, darker, y=1-2 between Main & Washington)
- **Building interiors (future):** +150 rooms when opened
- **Underground (future):** +75 rooms

## Connections to Other Districts

| Direction | Via | Destination |
|-----------|-----|-------------|
| North | **Waterfront only (x=-15, y=+10)** | Downtown (grid rotates 32 degrees) |
| East | 4th Ave (x=+15) | International District |
| South | S. King (y=-10) | SoDo Industrial |
| West | Waterfront (x=-15) | Piers, Elliott Bay |
| Down | Occidental Park ⊕ | Seattle Underground |

## The Grid Collision

Yesler Way marks where two street grids collide. South of Yesler (Pioneer Square), streets run cardinal. North of Yesler (Downtown), streets rotate 32 degrees to follow the shoreline. The grids never aligned properly even before the Event.

After the Event, all but one crossing was blocked:

| Intersection | X | Blockage |
|--------------|---|----------|
| Waterfront | -15 | **OPEN** - gap in cracked seawall |
| 1st Ave | -9 | 6-story building collapsed across street |
| Occidental | -3 | Blast wave debris pile |
| 2nd Ave | +3 | Buildings leaned together, 1-foot gap |
| 3rd Ave | +9 | Light rail tunnel collapse, flooded crater |
| 4th Ave | +15 | Chinatown gate fell across intersection |

The Waterfront passage is the only way between Pioneer Square and Downtown.
