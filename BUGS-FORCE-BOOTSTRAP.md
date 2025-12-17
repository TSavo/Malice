# FORCE_BOOTSTRAP Bug Report

Date: 2025-12-17

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
**Cause**: Player's location property was a raw ID number instead of being properly resolved
**Fix**: Used `moveTo()` to properly set player location

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

---

## OPEN Bugs

### 6. `body.getPart is not a function`
**Status**: OPEN
**Location**: Player login flow -> connect() -> see() -> getEyes() -> getHead() -> getPart()
**Error**:
```
Error executing method 'connect' on object #3068: Error executing method 'see' on object #3068:
Error executing method 'getEyes' on object #3068: Error executing method 'getHead' on object #3068:
body.getPart is not a function
```

**Cause**: The `getPart` method is defined in bodypart-builder.ts (line 614), but bodypart-builder.ts is NOT included in the FORCE_BOOTSTRAP rebuild list.

**Investigation**:
- Embodied prototype #8 does NOT have the getPart method
- getPart is defined on the BodyPart prototype in bodypart-builder.ts
- The player's body object and body parts are missing their methods

**Fix Required**: Add BodyPartBuilder to rebuildMethods() in prototype-builder.ts or core-system-builder.ts

**Affected Builders Not in Rebuild**:
- bodypart-builder.ts (contains getPart, getHead, getEyes, etc.)
- Possibly other prototype builders

---

## Commits Made

1. `df18450` - Add FORCE_BOOTSTRAP to rebuild prototype methods
2. `efa6ae0` - Fix FORCE_BOOTSTRAP to properly rebuild existing objects

---

## Files Modified

- src/index.ts
- src/game/game-coordinator.ts
- src/database/game-bootstrap.ts
- src/database/object-manager.ts
- src/database/bootstrap/core-system-builder.ts
- src/database/bootstrap/format-builder.ts
- src/database/bootstrap/recycler-builder.ts
- src/database/bootstrap/exclusions-builder.ts
- src/database/bootstrap/pronoun-sub-builder.ts
- src/database/bootstrap/emote-builder.ts
- src/database/bootstrap/prototypes/room-builder.ts
- docker-compose.yml

---

## Next Steps

1. Add BodyPartBuilder to FORCE_BOOTSTRAP rebuild list
2. Check for other missing prototype builders
3. Re-test player login and NPC AI interaction
