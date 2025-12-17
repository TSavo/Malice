# FORCE_BOOTSTRAP Bug Report

Date: 2025-12-17 (Updated)

## Summary

During implementation of FORCE_BOOTSTRAP functionality to rebuild prototype methods, several bugs were encountered. This document tracks them for future reference.

---

## FIXED Bugs

### 1. `format.bar is not a function`
**Status**: FIXED
**Cause**: FormatBuilder was not included in `rebuildMethods()` in core-system-builder.ts
**Fix**: Added FormatBuilder to the rebuildMethods() function

### 2. `format.keyValue is not a function`
**Status**: FIXED
**Cause**: When `forceRebuild=true`, builders were creating NEW objects instead of reusing existing ones. The pattern was:
```typescript
if (this.format && !forceRebuild) return;
// Always runs create() when forceRebuild=true, even if object exists
this.format = await this.manager.create({...});
```
**Fix**: Wrapped create blocks with `if (!this.object)` guards:
```typescript
if (this.format && !forceRebuild) return;
if (!this.format) {
  this.format = await this.manager.create({...});
}
// setMethod calls always run
```

### 3. `obj.shortDesc is not a function` (in room describe)
**Status**: FIXED
**Cause**: Room describe method calling shortDesc on objects that might be raw IDs or objects without that method
**Fix**: Added defensive check: `typeof obj.shortDesc === 'function'`

### 4. `location.describe is not a function`
**Status**: FIXED
**Cause**: Player's location property stored as objref, but when object not in cache, `fromValue()` returned raw number ID instead of RuntimeObject
**Fix**: Modified player connect/disconnect methods to explicitly load location if it's a raw number:
```typescript
let location = self.location;
if (typeof location === 'number') {
  location = await $.load(location);
}
```

### 5. "#N" objref strings not converted
**Status**: FIXED
**Cause**: object-manager.ts toValue() was not converting strings like "#5" to objrefs
**Fix**: Added regex check in toValue():
```typescript
if (/^#\d+$/.test(jsValue)) {
  const objId = parseInt(jsValue.slice(1), 10);
  return { type: 'objref', value: objId };
}
```

### 6. `body.getPart is not a function`
**Status**: FIXED
**Cause**: Multiple related issues:
1. BodyPartBuilder not included in FORCE_BOOTSTRAP rebuild list
2. `getBody()` method in embodied-builder returned raw ID when body not cached
3. `getPart()` method in bodypart-builder returned raw ID when part not cached

**Fixes Applied**:
1. Modified BodyPartBuilder to accept `existingObj` parameter for rebuilding
2. Added BodyPartBuilder to `rebuildMethods()` in prototype-builder.ts
3. Fixed `getBody()` to explicitly load body if raw number:
```typescript
let body = self.body;
if (!body) return null;
if (typeof body === 'number') {
  body = await $.load(body);
}
return body || null;
```
4. Fixed `getPart()` to explicitly load part if raw number:
```typescript
let part = parts[partName];
if (!part) return null;
if (typeof part === 'number') {
  part = await $.load(part);
}
return part || null;
```

### 7. Architectural Fix: Load All Objects at Startup
**Status**: FIXED
**Cause**: The root issue was that `fromValue()` uses synchronous `getSync()` to resolve objrefs. When objects weren't cached, it returned raw number IDs instead of RuntimeObjects.

**Original Problem**: Lazy loading + synchronous access = objects not in cache when needed.

**Solution**: Load ALL objects into memory at startup. Database access now only happens for:
1. Initial startup load
2. Writes (persist changes)
3. Change stream invalidation (replica set sync)

**Implementation**:
```typescript
// In ObjectManager - new loadAll() method
async loadAll(): Promise<number> {
  const allObjects = await this.db.listAll(false);
  for (const obj of allObjects) {
    if (!this.cache.getObject(obj._id)) {
      const runtime = new RuntimeObjectImpl(obj, this);
      const proxy = runtime.getProxy();
      this.cache.setObject(obj._id, proxy);
    }
  }
  return count;
}

// Called at start of bootstrap
await this.manager.loadAll();
```

**Result**: 3163 objects loaded in 529ms. No more defensive `typeof x === 'number'` checks needed.

---

## Root Cause Analysis

The underlying issue was that `RuntimeObject.fromValue()` uses `manager.getSync()` to resolve objrefs synchronously. With lazy loading, objects not yet accessed weren't in cache, causing `getSync()` to return null and `fromValue()` to fall back to raw number IDs.

**Final Solution**: For a MOO system with finite objects that constantly reference each other, keeping ALL objects in memory is the correct architecture. This eliminates the lazy-loading vs synchronous-access conflict entirely.

---

## Commits Made

1. `df18450` - Add FORCE_BOOTSTRAP to rebuild prototype methods
2. `efa6ae0` - Fix FORCE_BOOTSTRAP to properly rebuild existing objects
3. (Pending) - Fix objref resolution in connect/getBody/getPart methods

---

## Files Modified

- src/index.ts
- src/game/game-coordinator.ts
- src/database/game-bootstrap.ts (added loadAll() call)
- src/database/object-manager.ts (added loadAll() method, removed preloadRelated)
- src/database/runtime-object.ts (removed preloadRelated() method)
- src/database/bootstrap/core-system-builder.ts
- src/database/bootstrap/format-builder.ts
- src/database/bootstrap/recycler-builder.ts
- src/database/bootstrap/exclusions-builder.ts
- src/database/bootstrap/pronoun-sub-builder.ts
- src/database/bootstrap/emote-builder.ts
- src/database/bootstrap/prompt-builder.ts
- src/database/bootstrap/prototype-builder.ts
- src/database/bootstrap/prototypes/room-builder.ts
- src/database/bootstrap/prototypes/player-builder.ts
- src/database/bootstrap/prototypes/embodied-builder.ts
- src/database/bootstrap/prototypes/bodypart-builder.ts
- docker-compose.yml

---

## Testing Results

After all fixes:
- Player login: **WORKING**
- Room description on connect: **WORKING**
- Look command: **WORKING**
- Body/head/eyes resolution: **WORKING**

---

## Remaining Issues

1. NPC Clara aliases may need to be set up properly for `to clara` command to work
2. Some items showing as "something" in room description instead of proper names
