# Weapon Prototypes

Weapons are objects that can be used in combat. They define skill, damage, and damage type properties that are used by the combat system.

## Base Weapon (`$.weapon`)

All weapons inherit from `$.weapon`, which inherits from `$.describable`.

### Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `skill` | string | `'improvised'` | Combat skill used (e.g., "knife", "pistol", "katana") |
| `damage` | number | `0` | Base damage modifier (0-100, added to severity) |
| `damageType` | string | `'bruise'` | Type of damage: cut, bruise, puncture, laceration, burn |
| `ranged` | boolean | `false` | Whether this is a ranged weapon |
| `range` | number | `0` | Effective range in meters (ranged weapons only) |
| `ammo` | number | `0` | Current ammo count (ranged weapons only) |
| `maxAmmo` | number | `0` | Maximum ammo capacity (ranged weapons only) |
| `ammoType` | string | `null` | Required ammo type for reloading |

### Methods

| Method | Arguments | Returns | Description |
|--------|-----------|---------|-------------|
| `getSkill()` | none | string | Returns the combat skill name |
| `getDamage()` | none | number | Returns base damage modifier |
| `getDamageType()` | none | string | Returns damage type |
| `canFire()` | none | `{success, reason?}` | Check if ranged weapon can fire |
| `fire()` | none | `{success, ammoRemaining?}` | Expend one round of ammo |
| `reload(ammoSource)` | ammo object | `{success, loaded?, ammoRemaining?}` | Reload from ammo source |

### Damage Scale

| Damage | Weapon Type | Examples |
|--------|-------------|----------|
| 0-10 | Bare hands / improvised | Fists, beer bottle, screwdriver |
| 10-20 | Small weapons | Pocket knife, brass knuckles, box cutter |
| 20-35 | Medium weapons | Combat knife, baton, machete |
| 35-50 | Large weapons | Sword, baseball bat, fire axe |
| 40-60 | Firearms | Pistol, rifle, shotgun |
| 60+ | Heavy weapons | Sledgehammer, magnum revolver |

---

## Weapon Hierarchy

```
$.weapon (base)
├── $.blade (cut damage, various blade skills)
│   ├── $.knife (skill: knife)
│   │   ├── $.pocketKnife (8 dmg)
│   │   ├── $.combatKnife (18 dmg)
│   │   ├── $.switchblade (10 dmg, puncture)
│   │   ├── $.boxCutter (6 dmg)
│   │   ├── $.butterflyKnife (10 dmg)
│   │   ├── $.stiletto (14 dmg, puncture)
│   │   └── $.shiv (8 dmg, puncture)
│   ├── $.machete (skill: machete)
│   │   ├── $.cleaver (25 dmg)
│   │   └── $.kukri (30 dmg)
│   ├── $.katana (skill: katana)
│   │   ├── $.wakizashi (25 dmg)
│   │   ├── $.tanto (16 dmg, puncture)
│   │   └── $.ninjato (28 dmg)
│   ├── $.sword (skill: sword)
│   │   ├── $.longsword (38 dmg)
│   │   ├── $.shortsword (22 dmg)
│   │   ├── $.rapier (24 dmg, puncture)
│   │   └── $.cutlass (26 dmg)
│   └── $.axe (skill: axe)
│       ├── $.hatchet (22 dmg)
│       ├── $.fireAxe (38 dmg)
│       └── $.tomahawk (20 dmg)
│
├── $.blunt (bruise damage)
│   ├── $.club (skill: club)
│   │   ├── $.baseballBat (25 dmg)
│   │   ├── $.baton (15 dmg)
│   │   ├── $.nightstick (18 dmg)
│   │   ├── $.tonfa (16 dmg)
│   │   ├── $.blackjack (14 dmg)
│   │   └── $.tireIron (22 dmg)
│   ├── $.pipe (skill: club)
│   │   ├── $.leadPipe (24 dmg)
│   │   ├── $.metalPipe (20 dmg)
│   │   └── $.crowbar (26 dmg)
│   ├── $.hammer (skill: hammer)
│   │   ├── $.clawHammer (18 dmg)
│   │   ├── $.sledgehammer (40 dmg)
│   │   ├── $.ballPeenHammer (16 dmg)
│   │   └── $.mallet (12 dmg)
│   ├── $.staff (skill: staff)
│   │   ├── $.boStaff (18 dmg)
│   │   ├── $.walkingStick (12 dmg)
│   │   └── $.poolCue (10 dmg)
│   ├── $.mace (skill: mace)
│   │   └── $.morningstar (35 dmg, puncture)
│   ├── $.brassKnuckles (12 dmg, skill: brawling)
│   ├── $.sapGloves (10 dmg, skill: brawling)
│   ├── $.pushDagger (14 dmg, puncture, skill: brawling)
│   └── $.chain (skill: chain)
│       ├── $.bikeChain (16 dmg)
│       ├── $.nunchaku (14 dmg)
│       └── $.flail (28 dmg)
│
├── $.gun (ranged, puncture damage)
│   ├── $.pistol (skill: pistol)
│   │   ├── $.revolver (40 dmg, 6 rounds, .38)
│   │   ├── $.magnum (55 dmg, 6 rounds, .44)
│   │   ├── $.semiAutoPistol (35 dmg, 17 rounds, 9mm)
│   │   ├── $.compactPistol (28 dmg, 7 rounds, .380)
│   │   ├── $.derringer (25 dmg, 2 rounds, .22)
│   │   └── $.m1911 (42 dmg, 7 rounds, .45)
│   ├── $.rifle (skill: rifle)
│   │   ├── $.boltActionRifle (55 dmg, 5 rounds, .308)
│   │   ├── $.leverActionRifle (45 dmg, 10 rounds, .30-30)
│   │   ├── $.huntingRifle (50 dmg, 4 rounds, .308)
│   │   └── $.rifle22 (25 dmg, 10 rounds, .22)
│   ├── $.shotgun (skill: shotgun)
│   │   ├── $.pumpShotgun (55 dmg, 8 rounds, 12gauge)
│   │   ├── $.sawnOffShotgun (50 dmg, 2 rounds, 12gauge)
│   │   ├── $.doubleBarrel (55 dmg, 2 rounds, 12gauge)
│   │   └── $.coachGun (52 dmg, 2 rounds, 12gauge)
│   └── $.smg (skill: smg)
│       ├── $.machinePistol (28 dmg, 20 rounds, 9mm)
│       ├── $.uzi (30 dmg, 32 rounds, 9mm)
│       ├── $.mac10 (28 dmg, 30 rounds, .45)
│       └── $.tec9 (30 dmg, 32 rounds, 9mm)
│
└── $.improvised (skill: improvised, various damage types)
    ├── $.bottle (10 dmg, cut)
    │   ├── $.brokenBottle (14 dmg, cut)
    │   └── $.beerBottle (12 dmg, bruise)
    ├── $.brick (15 dmg, bruise)
    ├── $.rock (10 dmg, bruise, ranged/thrown)
    ├── $.cinderBlock (25 dmg, bruise)
    ├── $.screwdriver (12 dmg, puncture)
    ├── $.icepick (16 dmg, puncture)
    ├── $.awl (10 dmg, puncture)
    ├── $.wrench (18 dmg, bruise)
    ├── $.prybar (14 dmg, bruise)
    ├── $.hammerImprovised (16 dmg, bruise)
    ├── $.kitchenKnife (12 dmg, cut)
    ├── $.butcherKnife (18 dmg, cut)
    ├── $.skillet (20 dmg, bruise)
    ├── $.rollingPin (12 dmg, bruise)
    ├── $.throwingKnife (15 dmg, puncture, ranged)
    ├── $.throwingStar (10 dmg, cut, ranged)
    ├── $.dart (8 dmg, puncture, ranged)
    ├── $.garrote (30 dmg, cut, skill: garrote)
    ├── $.whip (12 dmg, cut, skill: whip)
    ├── $.cattleProd (10 dmg, burn, skill: taser)
    ├── $.stunGun (8 dmg, burn, skill: taser)
    ├── $.taser (10 dmg, burn, ranged, skill: taser)
    ├── $.pepperSpray (5 dmg, burn, ranged)
    ├── $.golfClub (18 dmg, bruise)
    ├── $.hockeyStick (12 dmg, bruise)
    ├── $.lacrosseStick (14 dmg, bruise)
    └── $.cricketBat (22 dmg, bruise, skill: club)
```

---

## Skills

Weapons determine which skill is checked in combat. The skill system is **use-to-advance**: every combat skill check grants XP in that skill.

### Blade Skills
- `knife` - Small blades, stabbing and slashing
- `machete` - Heavy choppers
- `katana` - Japanese swords (includes wakizashi, tanto)
- `sword` - Western swords (longsword, rapier, etc.)
- `axe` - Chopping weapons

### Blunt Skills
- `club` - General bludgeons (bats, batons, pipes)
- `hammer` - Hammers and mallets
- `staff` - Long poles and staves
- `mace` - Weighted striking weapons
- `chain` - Flexible weapons (chains, nunchaku)
- `brawling` - Hand-to-hand (fists, brass knuckles)

### Ranged Skills
- `pistol` - Handguns
- `rifle` - Long guns
- `shotgun` - Scatterguns
- `smg` - Submachine guns
- `throwing` - Thrown weapons

### Other Skills
- `improvised` - Weapons of opportunity
- `garrote` - Strangulation weapons
- `whip` - Flexible striking weapons
- `taser` - Electrical weapons

---

## Creating Weapon Instances

To create a weapon instance:

```javascript
// Create from prototype
const knife = await $.recycler.create({
  parent: $.combatKnife,
  properties: {
    name: 'serrated combat knife',
    description: 'A wicked-looking blade with serrated teeth along the spine.',
  }
});

// Place it somewhere
knife.location = someRoom.id;
```

### Customizing Damage

You can override damage on instances:

```javascript
const superKnife = await $.recycler.create({
  parent: $.combatKnife,
  properties: {
    name: 'masterwork knife',
    description: 'An exceptionally well-crafted blade.',
    damage: 25, // Override the default 18
  }
});
```

### Loaded Firearms

Create a firearm with ammo:

```javascript
const loadedPistol = await $.recycler.create({
  parent: $.revolver,
  properties: {
    name: 'rusty revolver',
    description: 'An old six-shooter with worn grips.',
    ammo: 6, // Fully loaded
  }
});
```

---

## Combat Integration

When a player attacks with a weapon, the combat system:

1. Gets the weapon's `skill` property
2. Makes a skill check for the attacker using that skill
3. On success, calculates damage using `weapon.damage` + base severity
4. Applies damage of type `weapon.damageType` to the target

For ranged weapons, `canFire()` and `fire()` are called to check and consume ammo.

See [Combat System](./combat.md) for full combat resolution details.

---

## Ammo Types

Firearms use specific ammo types:

| Ammo Type | Weapons |
|-----------|---------|
| `9mm` | Pistol, Semi-Auto Pistol, SMG, Uzi, TEC-9 |
| `.38` | Revolver |
| `.44` | Magnum Revolver |
| `.45` | 1911, MAC-10 |
| `.380` | Compact Pistol |
| `.22` | Derringer, .22 Rifle |
| `.308` | Bolt Action Rifle, Hunting Rifle |
| `.30-30` | Lever Action Rifle |
| `12gauge` | All shotguns |
| `taser-cartridge` | Taser |
| `pepper-spray` | Pepper Spray |

Ammo is implemented as `$.stackable` objects with matching `ammoType` property.
