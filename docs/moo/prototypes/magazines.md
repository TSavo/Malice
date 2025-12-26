# Magazine Prototypes

> **Abilities-First**: Magazines use abilities to describe loading, ejecting, and compatibility. The AI interprets reload actions. See `docs/ABILITIES-FIRST.md`.

Detachable ammunition magazines for firearms. Magazines hold ammo and can be loaded into/ejected from guns.

## Base Magazine (`$magazine`)

Inherits from `$describable`.

### Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `ammoType` | string | `'generic'` | Type of ammo this magazine holds |
| `ammo` | number | `0` | Current round count |
| `maxAmmo` | number | `15` | Maximum capacity |

### Methods

| Method | Arguments | Returns | Description |
|--------|-----------|---------|-------------|
| `put(ammoObj)` | ammo object | `{success, loaded, remaining, recycled}` | Load ammo into magazine |
| `remove(amount, caller)` | count, who | `{success, removed, remaining, ammo}` | Unload ammo from magazine |
| `isEmpty()` | none | boolean | True if ammo is 0 |
| `isFull()` | none | boolean | True if ammo equals maxAmmo |
| `describe()` | none | string | Full description with ammo count |
| `shortDesc()` | none | string | "magazine [12/17]" |

---

## Magazine Types

| Prototype | ammoType | Capacity | Description |
|-----------|----------|----------|-------------|
| `$pistolMagazine` | `9mm` | 17 | Standard 9mm pistol magazine |
| `$extendedMagazine` | `9mm` | 30 | High-capacity extended magazine |
| `$m1911Magazine` | `.45` | 7 | Single-stack 1911 magazine |
| `$rifleMagazine` | `.308` | 10 | Detachable rifle magazine |
| `$smgMagazine` | `9mm` | 32 | Submachine gun magazine |
| `$mac10Magazine` | `.45` | 30 | MAC-10 specific magazine |
| `$speedloader` | `.38` | 6 | Revolver speedloader (loads all at once) |

---

## Loading a Magazine

```javascript
// Create a magazine
const mag = await $recycler.create($pistolMagazine, {
  name: 'Glock magazine',
  description: 'A polymer pistol magazine.',
});

// Load ammo into it
const result = await mag.put(ammo9mm);
// {
//   success: true,
//   loaded: 17,      // Rounds loaded
//   remaining: 17,   // Total in magazine
//   recycled: true   // Ammo object was consumed entirely
// }
```

If you have more ammo than the magazine can hold:

```javascript
// Magazine has 10/17, ammo has 20 rounds
const result = await mag.put(bigAmmoStack);
// {
//   success: true,
//   loaded: 7,       // Only loaded 7 (filled magazine)
//   remaining: 17,   // Magazine is now full
//   recycled: false  // Ammo object still exists with 13 rounds
// }
```

---

## Unloading a Magazine

```javascript
// Remove specific amount
const result = await mag.remove(5, player);
// {
//   success: true,
//   removed: 5,
//   remaining: 12,
//   ammo: <new ammo object>  // Placed in player's room
// }

// Remove all (no amount specified)
const result = await mag.remove(null, player);
// Removes everything
```

---

## Loading Magazine into Gun

Magazines are loaded into magazine-fed guns via containment:

```javascript
// Load magazine into gun
const result = await pistol.load(magazine);
// { success: true, loaded: 'magazine', rounds: 17 }
// Magazine is now inside the gun (magazine.location = pistol.id)

// Check loaded magazine
const loadedMag = await pistol.getLoadedMagazine();
// Returns the magazine object

// Get ammo count (checks magazine)
const ammo = await pistol.getAmmoCount();
// 17
```

---

## Ejecting Magazine from Gun

```javascript
// Eject magazine
const result = await pistol.unload(player);
// {
//   success: true,
//   ejected: 'magazine',
//   magazine: <magazine object>,
//   rounds: 12
// }
// Magazine goes to player's free hand, or drops to room
```

---

## Creating Loaded Magazines

For world-building, create pre-loaded magazines:

```javascript
const loadedMag = await $recycler.create($pistolMagazine, {
  name: 'loaded Glock magazine',
  description: 'A full magazine.',
  ammo: 17,  // Pre-loaded
});
```

---

## Combat Display

When in combat, players see magazine status:

```
Your status: Left hand: Glock 17 [12 rounds], Right hand: empty
```

For guns without magazines loaded:

```
Your status: Left hand: Glock 17 [no magazine], Right hand: empty
```

---

## Ammo Type Compatibility

Magazines and guns must have matching `ammoType`:

```javascript
// This fails - wrong ammo type
await pistol9mm.load(m1911Mag);  // m1911Mag is .45
// { success: false, error: 'Wrong magazine type. This gun takes 9mm.' }

// This works
await pistol9mm.load(pistolMag9mm);
// { success: true, ... }
```

Same for loading ammo into magazines:

```javascript
await pistolMag9mm.put(ammo45);
// { success: false, error: 'Wrong ammunition type. This magazine takes 9mm.' }
```

---

## See Also

- [Weapons](./weapons.md) - Firearm prototypes and loading
- [Ammo](./ammo.md) - Ammunition prototypes
- [Combat](./combat.md) - How ammo is tracked in combat
