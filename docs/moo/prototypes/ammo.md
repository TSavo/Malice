# Ammo Prototypes

> **Abilities-First**: Ammo uses abilities to describe loading, compatibility, and handling. The AI interprets reloading actions. See `docs/ABILITIES-FIRST.md`.

Ammunition for firearms. Ammo is stackable - multiple rounds merge into a single object with a quantity.

## Base Ammo (`$ammo`)

Inherits from `$stackable`.

### Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `ammoType` | string | `'generic'` | Type of ammunition (must match gun's ammoType) |
| `quantity` | number | `0` | Number of rounds (inherited from stackable) |
| `unit` | string | `'rounds'` | Display unit |
| `contraband` | boolean | `false` | Whether this ammo is illegal |

### Methods

| Method | Arguments | Returns | Description |
|--------|-----------|---------|-------------|
| `canStackWith(other)` | ammo object | boolean | True if same ammoType |
| `shortDesc()` | none | string | "12 rounds of 9mm" |
| `describe()` | none | string | Full description with contraband status |

### Stacking Behavior

Ammo stacks automatically when placed in the same container:

```javascript
// Two piles of 9mm in the same room will merge
ammo1.quantity = 10;  // 10 rounds of 9mm
ammo2.quantity = 15;  // 15 rounds of 9mm
// After placement, one pile of 25 rounds
```

Only ammo with matching `ammoType` will stack.

---

## Ammo Types

| Prototype | ammoType | Description | Used By |
|-----------|----------|-------------|---------|
| `$ammo9mm` | `9mm` | 9x19mm Parabellum | Pistols, SMGs |
| `$ammo38` | `.38` | .38 Special | Revolvers |
| `$ammo44` | `.44` | .44 Magnum | Magnum revolvers |
| `$ammo45` | `.45` | .45 ACP | 1911, MAC-10 |
| `$ammo22` | `.22` | .22 LR rimfire | Derringer, .22 Rifle |
| `$ammo380` | `.380` | .380 ACP | Compact pistols |
| `$ammo308` | `.308` | .308 Winchester | Rifles |
| `$ammo3030` | `.30-30` | .30-30 Winchester | Lever-action rifles |
| `$ammo12gauge` | `12gauge` | 12 gauge shells | Shotguns |

---

## Creating Ammo

```javascript
// Create loose ammo from prototype
const ammo = await $recycler.create($ammo9mm, {
  quantity: 50,
  name: 'box of 9mm',
  description: 'A cardboard box of ammunition.',
});

// Place it
await ammo.moveTo(someRoom);
```

### Custom Ammo

```javascript
// Hollow points (higher damage potential - flavor only)
const hollowPoints = await $recycler.create($ammo9mm, {
  quantity: 20,
  name: '9mm hollow points',
  description: 'Expanding ammunition. Nasty.',
  contraband: true,
});
```

---

## Loading Ammo

Ammo is loaded into guns, not held directly in combat.

### Direct-Load Guns (revolvers, shotguns)

```javascript
// Load shells into shotgun
const result = await shotgun.load(shells);
// { success: true, loaded: 5, remaining: 5 }
// The shells object is recycled (destroyed)
```

### Magazine-Fed Guns

```javascript
// Load ammo into a magazine first
const result = await magazine.put(ammo);
// { success: true, loaded: 15, remaining: 15 }
// Ammo object is recycled

// Then load the magazine into the gun
await pistol.load(magazine);
```

---

## Unloading Ammo

### From Direct-Load Guns

```javascript
const result = await revolver.unload(player);
// { success: true, unloaded: 4, ammo: newAmmoObject }
// Creates new ammo object with 4 rounds
```

### From Magazines

```javascript
const result = await magazine.remove(10, player);
// { success: true, removed: 10, remaining: 5, ammo: newAmmoObject }
// Creates new ammo object, placed in room
```

---

## See Also

- [Weapons](./weapons.md) - Firearm prototypes
- [Magazines](./magazines.md) - Magazine system
- [Stackables](./stackables.md) - Base stackable behavior
