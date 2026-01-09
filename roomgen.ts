/* roomgen.ts
 * Increment 2.1 (center bias) + Increment 3 (prefabs with portals + private interiors)
 * - Integer XYZ grid
 * - Cardinal adjacency for normal rooms
 * - Prefabs are encapsulated subgraphs:
 *    - internal exits ONLY from prefab definition
 *    - external connections ONLY via portal cells
 * - Deterministic by seed
 */

export type Axis = "x" | "y" | "z";
export type Vec3 = { x: number; y: number; z: number };

export type Room = {
  id: string;
  pos: Vec3;
  meta?: {
    prefabInstanceId?: string;
    prefabId?: string;
    isPortal?: boolean;
  };
};

export type ExitKind = "cardinal" | "arbitrary";

export type Exit = {
  from: string;
  to: string;
  kind: ExitKind;
};

export type World = {
  rooms: Room[];
  exits: Exit[];
};

export type Bounds = { min: Vec3; max: Vec3 };

// -------- Prefab authoring model --------

export type PrefabExit = {
  from: Vec3; // local
  to: Vec3;   // local
  kind: ExitKind; // usually cardinal; arbitrary supported
};

export type PortalDir = "+x" | "-x" | "+y" | "-y" | "+z" | "-z";

export type PrefabPortal = {
  cell: Vec3;                 // local cell allowed to connect externally
  allowedDirs?: PortalDir[];  // optional restriction on how external network may connect
};

export type Prefab = {
  id: string;
  cells: Vec3[];        // local occupied cells
  exits: PrefabExit[];  // internal edges only
  portals: PrefabPortal[];
};

export type GrowthParams = {
  // growth
  maxRooms: number;

  branchChance: number;   // e.g. 0.2
  linearBias: number;     // e.g. 0.7
  centerBias: number;     // e.g. 1.2
  centerPenalty: number;  // e.g. 0.9
  linkPreference: number; // e.g. 0.8 - prefer linking to existing rooms over creating new ones

  // prefab
  prefabChance: number;   // e.g. 0.25
  prefabs: Prefab[];

  // if true, after generation we add cardinal exits between *non-prefab* adjacent rooms
  // and between prefab portals and adjacent non-prefab rooms (privacy rule enforced).
  // Leave true for MOO-like navigation.
  inferCardinalExits: boolean;
};

// -------- Deterministic RNG --------

export function mulberry32(seed: number) {
  return function rand() {
    let t = (seed += 0x6D2B79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// -------- Utilities --------

const AXES: Axis[] = ["x", "y", "z"];

function key(p: Vec3): string {
  return `${p.x},${p.y},${p.z}`;
}

function addVec(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

function eqVec(a: Vec3, b: Vec3): boolean {
  return a.x === b.x && a.y === b.y && a.z === b.z;
}

function inBounds(p: Vec3, b: Bounds): boolean {
  return (
    p.x >= b.min.x && p.x <= b.max.x &&
    p.y >= b.min.y && p.y <= b.max.y &&
    p.z >= b.min.z && p.z <= b.max.z
  );
}

function manhattan(a: Vec3, b: Vec3): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y) + Math.abs(a.z - b.z);
}

function neighbors6(p: Vec3): Vec3[] {
  return [
    { x: p.x + 1, y: p.y, z: p.z },
    { x: p.x - 1, y: p.y, z: p.z },
    { x: p.x, y: p.y + 1, z: p.z },
    { x: p.x, y: p.y - 1, z: p.z },
    { x: p.x, y: p.y, z: p.z + 1 },
    { x: p.x, y: p.y, z: p.z - 1 },
  ];
}

function dirBetween(a: Vec3, b: Vec3): PortalDir | null {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dz = b.z - a.z;
  if (Math.abs(dx) + Math.abs(dy) + Math.abs(dz) !== 1) return null;
  if (dx === 1) return "+x";
  if (dx === -1) return "-x";
  if (dy === 1) return "+y";
  if (dy === -1) return "-y";
  if (dz === 1) return "+z";
  if (dz === -1) return "-z";
  return null;
}

function dirToVec(d: PortalDir): Vec3 {
  switch (d) {
    case "+x": return { x: 1, y: 0, z: 0 };
    case "-x": return { x: -1, y: 0, z: 0 };
    case "+y": return { x: 0, y: 1, z: 0 };
    case "-y": return { x: 0, y: -1, z: 0 };
    case "+z": return { x: 0, y: 0, z: 1 };
    case "-z": return { x: 0, y: 0, z: -1 };
  }
}

function vecToDir(v: Vec3): PortalDir | null {
  if (v.x === 1 && v.y === 0 && v.z === 0) return "+x";
  if (v.x === -1 && v.y === 0 && v.z === 0) return "-x";
  if (v.x === 0 && v.y === 1 && v.z === 0) return "+y";
  if (v.x === 0 && v.y === -1 && v.z === 0) return "-y";
  if (v.x === 0 && v.y === 0 && v.z === 1) return "+z";
  if (v.x === 0 && v.y === 0 && v.z === -1) return "-z";
  return null;
}

// -------- Proper rotations (no mirrors) --------

type Rot = { ax: Axis; ay: Axis; az: Axis; sx: 1 | -1; sy: 1 | -1; sz: 1 | -1 };

function detSign(r: Rot): 1 | -1 {
  // permutation sign via inversion count (Axis order)
  const order: Record<Axis, number> = { x: 0, y: 1, z: 2 };
  const perm = [order[r.ax], order[r.ay], order[r.az]];
  const inv =
    (perm[0] > perm[1] ? 1 : 0) +
    (perm[0] > perm[2] ? 1 : 0) +
    (perm[1] > perm[2] ? 1 : 0);
  const permSign = (inv % 2 === 0) ? 1 : -1;
  const flipSign = (r.sx * r.sy * r.sz) as 1 | -1;
  return (permSign * flipSign) as 1 | -1;
}

function allProperRotations(): Rot[] {
  const rots: Rot[] = [];
  for (const ax of AXES) for (const ay of AXES) for (const az of AXES) {
    if (new Set([ax, ay, az]).size !== 3) continue;
    for (const sx of [1, -1] as const)
      for (const sy of [1, -1] as const)
        for (const sz of [1, -1] as const) {
          const r: Rot = { ax, ay, az, sx, sy, sz };
          if (detSign(r) === 1) rots.push(r);
        }
  }
  return rots;
}

const PROPER_ROTS = allProperRotations();

function rotateVec(p: Vec3, r: Rot): Vec3 {
  const get = (a: Axis) => p[a];
  return {
    x: get(r.ax) * r.sx,
    y: get(r.ay) * r.sy,
    z: get(r.az) * r.sz,
  };
}

function rotateDir(d: PortalDir, r: Rot): PortalDir {
  const v = dirToVec(d);
  const rv = rotateVec(v, r);
  const result = vecToDir(rv);
  if (!result) throw new Error(`rotateDir produced invalid direction`);
  return result;
}

// -------- Union-Find for connectivity --------

class UnionFind {
  private parent: Map<string, string> = new Map();
  private rank: Map<string, number> = new Map();

  find(x: string): string {
    if (!this.parent.has(x)) {
      this.parent.set(x, x);
      this.rank.set(x, 0);
    }
    const p = this.parent.get(x)!;
    if (p !== x) {
      this.parent.set(x, this.find(p));
    }
    return this.parent.get(x)!;
  }

  union(a: string, b: string): void {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra === rb) return;
    const rankA = this.rank.get(ra)!;
    const rankB = this.rank.get(rb)!;
    if (rankA < rankB) {
      this.parent.set(ra, rb);
    } else if (rankA > rankB) {
      this.parent.set(rb, ra);
    } else {
      this.parent.set(rb, ra);
      this.rank.set(ra, rankA + 1);
    }
  }

  connected(a: string, b: string): boolean {
    return this.find(a) === this.find(b);
  }
}

// -------- Generator core --------

type Frontier = { pos: Vec3; dir?: Axis; target?: Vec3 };

type InternalState = {
  roomsByPos: Map<string, Room>;
  exits: Exit[];
  sumPos: Vec3; // for dynamic centroid
  nextRoomId: number;
  nextPrefabInstance: number;

  // fast lookups
  roomIdByPosKey: Map<string, string>;
  portalPosKeys: Set<string>; // absolute positions that are portals
  prefabPosKeys: Set<string>; // absolute positions that belong to any prefab cell
  
  // connectivity tracking
  connectivity: UnionFind;
};

function addExitBidirectional(state: InternalState, aId: string, bId: string, kind: ExitKind) {
  state.exits.push({ from: aId, to: bId, kind });
  state.exits.push({ from: bId, to: aId, kind });
  state.connectivity.union(aId, bId);
}

function ensureRoom(
  state: InternalState,
  pos: Vec3,
  meta?: Room["meta"]
): Room {
  const k = key(pos);
  const existing = state.roomsByPos.get(k);
  if (existing) {
    // merge meta conservatively
    if (meta) existing.meta = { ...(existing.meta ?? {}), ...meta };
    return existing;
  }
  const id = `r${state.nextRoomId++}`;
  const room: Room = { id, pos: { ...pos }, meta: meta ? { ...meta } : undefined };
  state.roomsByPos.set(k, room);
  state.roomIdByPosKey.set(k, id);
  state.sumPos = addVec(state.sumPos, pos);
  return room;
}

function roomCount(state: InternalState): number {
  return state.roomsByPos.size;
}

function centroid(state: InternalState): Vec3 {
  const n = state.roomsByPos.size;
  return { x: state.sumPos.x / n, y: state.sumPos.y / n, z: state.sumPos.z / n };
}

function isOccupied(state: InternalState, pos: Vec3): boolean {
  return state.roomsByPos.has(key(pos));
}

function isPortal(state: InternalState, pos: Vec3): boolean {
  return state.portalPosKeys.has(key(pos));
}

function isPrefabCell(state: InternalState, pos: Vec3): boolean {
  return state.prefabPosKeys.has(key(pos));
}

// Privacy rule: external network may only connect to prefab cells if they are portals.
function canLinkCardinal(state: InternalState, a: Vec3, b: Vec3): boolean {
  const aIsPrefab = isPrefabCell(state, a);
  const bIsPrefab = isPrefabCell(state, b);
  if (!aIsPrefab && !bIsPrefab) return true;
  // if one side is prefab, that side must be a portal
  if (aIsPrefab && !isPortal(state, a)) return false;
  if (bIsPrefab && !isPortal(state, b)) return false;
  return true;
}

function validatePrefab(p: Prefab): void {
  const cellSet = new Set(p.cells.map(key));
  if (!cellSet.has(key({ x: 0, y: 0, z: 0 }))) {
    // not strictly required, but recommended. We'll allow it.
  }
  for (const portal of p.portals) {
    if (!cellSet.has(key(portal.cell))) {
      throw new Error(`Prefab ${p.id}: portal cell not in cells`);
    }
  }
  for (const ex of p.exits) {
    if (!cellSet.has(key(ex.from)) || !cellSet.has(key(ex.to))) {
      throw new Error(`Prefab ${p.id}: exit references non-cell`);
    }
  }
}

// Attempt to place prefab such that ONE selected portal aligns to attachPos.
// Also respects portal.allowedDirs against the direction from outside -> portal.
function tryPlacePrefabAt(
  state: InternalState,
  bounds: Bounds,
  params: GrowthParams,
  rand: () => number,
  outsidePos: Vec3,
  attachPos: Vec3
): boolean {
  if (params.prefabs.length === 0) return false;
  if (rand() >= params.prefabChance) return false;

  const attachDir = dirBetween(outsidePos, attachPos); // outside -> attach
  if (!attachDir) return false; // not adjacent; should not happen for cardinal growth

  const prefab = params.prefabs[Math.floor(rand() * params.prefabs.length)];
  validatePrefab(prefab);

  // Choose a portal to align
  const portal = prefab.portals[Math.floor(rand() * prefab.portals.length)];

  const rotStart = Math.floor(rand() * PROPER_ROTS.length);

  for (let i = 0; i < PROPER_ROTS.length; i++) {
    const rot = PROPER_ROTS[(rotStart + i) % PROPER_ROTS.length];

    // Check if portal allows entry from this direction after rotation
    if (portal.allowedDirs) {
      const rotatedAllowed = portal.allowedDirs.map(d => rotateDir(d, rot));
      if (!rotatedAllowed.includes(attachDir)) continue;
    }

    // We want rotated(portal.cell) + offset == attachPos  => offset = attachPos - rotated(portal.cell)
    const portalRot = rotateVec(portal.cell, rot);
    const offset: Vec3 = {
      x: attachPos.x - portalRot.x,
      y: attachPos.y - portalRot.y,
      z: attachPos.z - portalRot.z,
    };

    // Compute absolute cells
    const absCells: Vec3[] = [];
    for (const c of prefab.cells) {
      const rc = rotateVec(c, rot);
      const abs = addVec(offset, rc);
      if (!inBounds(abs, bounds)) {
        absCells.length = 0;
        break;
      }
      // no overlap allowed
      if (isOccupied(state, abs)) {
        absCells.length = 0;
        break;
      }
      absCells.push(abs);
    }
    if (absCells.length === 0) continue;

    // respect maxRooms
    if (roomCount(state) + absCells.length > params.maxRooms) return false;

    // Commit instance id
    const instanceId = `p${state.nextPrefabInstance++}`;

    // Create rooms; mark portals and prefab cells
    // Determine which absolute positions are portals
    const portalAbsSet = new Set<string>();
    for (const prt of prefab.portals) {
      const pr = rotateVec(prt.cell, rot);
      const abs = addVec(offset, pr);
      portalAbsSet.add(key(abs));
    }

    for (const abs of absCells) {
      const k = key(abs);
      state.prefabPosKeys.add(k);
      const isP = portalAbsSet.has(k);
      if (isP) state.portalPosKeys.add(k);

      ensureRoom(state, abs, {
        prefabInstanceId: instanceId,
        prefabId: prefab.id,
        isPortal: isP || undefined,
      });
    }

    // Link outside room to the attach portal cell (cardinal)
    // This is allowed by construction because attachPos is a portal.
    const outsideRoom = ensureRoom(state, outsidePos);
    const attachRoom = ensureRoom(state, attachPos);
    addExitBidirectional(state, outsideRoom.id, attachRoom.id, "cardinal");

    // Create internal exits ONLY as defined
    for (const ex of prefab.exits) {
      const aLocal = rotateVec(ex.from, rot);
      const bLocal = rotateVec(ex.to, rot);
      const aAbs = addVec(offset, aLocal);
      const bAbs = addVec(offset, bLocal);

      const aR = ensureRoom(state, aAbs);
      const bR = ensureRoom(state, bAbs);
      addExitBidirectional(state, aR.id, bR.id, ex.kind);
    }

    return true;
  }

  return false;
}

function chooseNextStep(
  state: InternalState,
  bounds: Bounds,
  rand: () => number,
  frontier: Frontier,
  params: GrowthParams
): { nextPos: Vec3; nextDir: Axis } | null {
  const cur = frontier.pos;
  // Use frontier's target if available, otherwise fall back to centroid
  const target = frontier.target ?? centroid(state);
  const curDist = manhattan(cur, target);

  const candidates: Array<{ pos: Vec3; axis: Axis; score: number; isExisting: boolean }> = [];

  for (const axis of AXES) {
    for (const step of [-1, 1] as const) {
      const nxt: Vec3 = { ...cur, [axis]: (cur[axis] + step) } as Vec3;
      if (!inBounds(nxt, bounds)) continue;
      
      // Never go above z=-2 during generation (z=-1 is only for entrance rooms)
      if (nxt.z > -2) continue;

      const isExisting = isOccupied(state, nxt);
      let score = 1.0;

      // LINK PREFERENCE: Strongly prefer connecting to existing rooms
      // This creates a denser, more interconnected network with fewer isolated branches
      if (isExisting) {
        score += params.linkPreference * 3.0; // Big bonus for linking to existing rooms
      }

      // linear bias
      if (frontier.dir && frontier.dir === axis) score += params.linearBias;

      // target bias - move toward the target entrance
      const nextDist = manhattan(nxt, target);
      if (nextDist < curDist) score += 2.0;  // strongly prefer moving closer
      else if (nextDist > curDist) score -= 0.5;  // mild penalty for moving away

      candidates.push({ pos: nxt, axis, score, isExisting });
    }
  }

  if (candidates.length === 0) return null;

  // weighted choice; clamp scores positive
  const weights = candidates.map(cand => Math.max(0.01, cand.score));
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rand() * total;
  for (let i = 0; i < candidates.length; i++) {
    r -= weights[i];
    if (r <= 0) return { nextPos: candidates[i].pos, nextDir: candidates[i].axis };
  }
  return { nextPos: candidates[candidates.length - 1].pos, nextDir: candidates[candidates.length - 1].axis };
}

// -------- Public API --------

export function generateWorld(
  entrances: Vec3[],
  bounds: Bounds,
  seed: number,
  params: GrowthParams
): World {
  if (entrances.length < 2) {
    throw new Error("Need at least 2 entrances to enforce all-to-all reachability meaningfully.");
  }

  const rand = mulberry32(seed);

  const state: InternalState = {
    roomsByPos: new Map(),
    exits: [],
    sumPos: { x: 0, y: 0, z: 0 },
    nextRoomId: 0,
    nextPrefabInstance: 0,
    roomIdByPosKey: new Map(),
    portalPosKeys: new Set(),
    prefabPosKeys: new Set(),
    connectivity: new UnionFind(),
  };

  // Place entrances and create frontiers toward 3 closest + 1 most distant neighbor
  // z=-1 entrances must first descend to z=-2
  const frontiers: Frontier[] = [];
  for (const e of entrances) {
    if (!inBounds(e, bounds)) throw new Error("Entrance out of bounds");
    ensureRoom(state, e);
    
    // For z=-1 entrances, first create a room at z=-2 directly below
    let startPos = { ...e };
    if (e.z === -1) {
      const belowPos = { x: e.x, y: e.y, z: -2 };
      if (inBounds(belowPos, bounds)) {
        const above = ensureRoom(state, e);
        const below = ensureRoom(state, belowPos);
        addExitBidirectional(state, above.id, below.id, "cardinal");
        startPos = belowPos; // Frontiers start from z=-2
      }
    }
    
    // Sort all other entrances by distance (from the start position)
    const others = entrances
      .filter(o => !eqVec(o, e))
      .map(o => ({ pos: o, dist: manhattan(startPos, o) }))
      .sort((a, b) => a.dist - b.dist);
    
    // Take 3 closest and 1 most distant (deduplicated if overlap)
    const closest = others.slice(0, 3);
    const mostDistant = others.slice(-1); // Just 1 most distant
    const targets = [...closest];
    for (const t of mostDistant) {
      if (!targets.some(c => eqVec(c.pos, t.pos))) {
        targets.push(t);
      }
    }
    
    for (const other of targets) {
      // Determine initial direction toward this target
      const dx = other.pos.x - startPos.x;
      const dy = other.pos.y - startPos.y;
      const dz = other.pos.z - startPos.z;
      
      // Pick the axis with the largest delta as initial direction
      let dir: Axis;
      if (Math.abs(dx) >= Math.abs(dy) && Math.abs(dx) >= Math.abs(dz)) {
        dir = "x";
      } else if (Math.abs(dy) >= Math.abs(dz)) {
        dir = "y";
      } else {
        dir = "z";
      }
      
      frontiers.push({ pos: { ...startPos }, dir, target: { ...other.pos } });
    }
  }

  // Growth loop - stop when all targeted frontiers complete (not when hitting room budget)
  while (frontiers.length > 0) {
    // Check if any targeted frontiers remain - if not, we're done
    const hasTargetedFrontier = frontiers.some(f => f.target);
    if (!hasTargetedFrontier) break;
    
    // Safety check for room budget (but targeted frontiers should complete first)
    if (roomCount(state) >= params.maxRooms) break;
    
    // Only process targeted frontiers - discard untargeted ones
    const targetedIdx = frontiers.findIndex(f => f.target);
    if (targetedIdx === -1) break;
    
    const frontier = frontiers.splice(targetedIdx, 1)[0];

    // If frontier position is invalid (shouldn't be), skip
    if (!inBounds(frontier.pos, bounds)) continue;

    // Check if frontier has reached its target (or is adjacent to it)
    if (frontier.target) {
      const distToTarget = manhattan(frontier.pos, frontier.target);
      
      // If we're AT the target, we're done with this frontier
      if (distToTarget === 0) {
        continue; // Don't re-add this frontier
      }
      
      // If we're adjacent to target, connect and stop
      if (distToTarget === 1) {
        const a = ensureRoom(state, frontier.pos);
        const b = ensureRoom(state, frontier.target);
        addExitBidirectional(state, a.id, b.id, "cardinal");
        continue; // Frontier completed its mission
      }
      
      // Check if we're already connected to the target via existing rooms
      const frontierRoom = state.roomsByPos.get(key(frontier.pos));
      const targetRoom = state.roomsByPos.get(key(frontier.target));
      if (frontierRoom && targetRoom && state.connectivity.connected(frontierRoom.id, targetRoom.id)) {
        continue; // Already connected - frontier done
      }
      
      // Check if current pos is adjacent to any room in target's component
      if (targetRoom) {
        for (const neighbor of neighbors6(frontier.pos)) {
          const neighborRoom = state.roomsByPos.get(key(neighbor));
          if (neighborRoom && state.connectivity.connected(neighborRoom.id, targetRoom.id)) {
            // We're adjacent to target's network - connect and done
            const a = ensureRoom(state, frontier.pos);
            addExitBidirectional(state, a.id, neighborRoom.id, "cardinal");
            continue; // Frontier completed
          }
        }
      }
    }

    const step = chooseNextStep(state, bounds, rand, frontier, params);
    if (!step) continue;

    const curPos = frontier.pos;
    const nextPos = step.nextPos;

    // Option A: try prefab placement anchored by a portal at nextPos
    // This requires outside->attach adjacency (which holds for cardinal step selection).
    const placedPrefab = tryPlacePrefabAt(state, bounds, params, rand, curPos, nextPos);

    if (!placedPrefab) {
      // Normal single-cell expansion (non-prefab)
      const a = ensureRoom(state, curPos);
      const b = ensureRoom(state, nextPos);
      addExitBidirectional(state, a.id, b.id, "cardinal");
    }

    // Continue frontier from nextPos, inheriting the target (no branching)
    frontiers.push({ pos: { ...nextPos }, dir: step.nextDir, target: frontier.target });
  }

  // Ensure all entrances are connected by bridging disconnected components
  const entranceRooms = entrances.map(e => state.roomsByPos.get(key(e))!.id);
  for (let i = 1; i < entranceRooms.length; i++) {
    if (!state.connectivity.connected(entranceRooms[0], entranceRooms[i])) {
      // Find closest pair of rooms between the two components and connect them
      const comp1Rooms = Array.from(state.roomsByPos.values()).filter(
        r => state.connectivity.connected(r.id, entranceRooms[0])
      );
      const comp2Rooms = Array.from(state.roomsByPos.values()).filter(
        r => state.connectivity.connected(r.id, entranceRooms[i])
      );
      
      let bestDist = Infinity;
      let bestPair: [Room, Room] | null = null;
      for (const r1 of comp1Rooms) {
        for (const r2 of comp2Rooms) {
          // Only consider adjacent rooms for cardinal linking
          const dist = manhattan(r1.pos, r2.pos);
          if (dist === 1 && canLinkCardinal(state, r1.pos, r2.pos)) {
            if (dist < bestDist) {
              bestDist = dist;
              bestPair = [r1, r2];
            }
          }
        }
      }
      
      if (bestPair) {
        addExitBidirectional(state, bestPair[0].id, bestPair[1].id, "cardinal");
      } else {
        // No adjacent rooms found - find closest and create bridge rooms with prefab chances
        for (const r1 of comp1Rooms) {
          for (const r2 of comp2Rooms) {
            const dist = manhattan(r1.pos, r2.pos);
            if (dist < bestDist) {
              bestDist = dist;
              bestPair = [r1, r2];
            }
          }
        }
        if (bestPair) {
          // Create a path with limited meandering (max 20% extra steps)
          let current = bestPair[0];
          const target = bestPair[1].pos;
          const directDist = manhattan(current.pos, target);
          const maxExtraSteps = Math.max(2, Math.floor(directDist * 0.2));
          let extraSteps = 0;
          let lastAxis: Axis | null = null;
          
          while (!eqVec(current.pos, target)) {
            const dx = target.x - current.pos.x;
            const dy = target.y - current.pos.y;
            const dz = target.z - current.pos.z;
            
            // Always include moves toward target
            const moves: { next: Vec3; axis: Axis; isToward: boolean }[] = [];
            if (dx !== 0) moves.push({ next: { ...current.pos, x: current.pos.x + Math.sign(dx) }, axis: "x", isToward: true });
            if (dy !== 0) moves.push({ next: { ...current.pos, y: current.pos.y + Math.sign(dy) }, axis: "y", isToward: true });
            if (dz !== 0) moves.push({ next: { ...current.pos, z: current.pos.z + Math.sign(dz) }, axis: "z", isToward: true });
            
            // Only consider perpendicular if we have budget left
            if (extraSteps < maxExtraSteps) {
              for (const axis of AXES) {
                const isPerp = (axis === "x" && dx === 0) || (axis === "y" && dy === 0) || (axis === "z" && dz === 0);
                if (isPerp) {
                  for (const step of [-1, 1]) {
                    const next: Vec3 = { ...current.pos, [axis]: current.pos[axis] + step };
                    if (inBounds(next, bounds) && !isOccupied(state, next)) {
                      moves.push({ next, axis, isToward: false });
                    }
                  }
                }
              }
            }
            
            if (moves.length === 0) break;
            
            // Weight: toward=3, perpendicular=1, plus jitter
            const weights = moves.map(m => {
              let w = m.isToward ? 3.0 : 1.0;
              if (lastAxis && m.axis === lastAxis) w += 0.3;
              w += rand() * 0.4;
              return w;
            });
            
            const total = weights.reduce((a, b) => a + b, 0);
            let r = rand() * total;
            let chosenMove = moves[0];
            for (let j = 0; j < moves.length; j++) {
              r -= weights[j];
              if (r <= 0) { chosenMove = moves[j]; break; }
            }
            
            if (!chosenMove.isToward) extraSteps++;
            
            const nextPos = chosenMove.next;
            lastAxis = chosenMove.axis;
            
            // Try to place a prefab along the bridge (boosted chance: 50%)
            let placedPrefab = false;
            if (rand() < 0.5 && params.prefabs.length > 0) {
              // Force try prefab by temporarily setting high chance
              const origChance = params.prefabChance;
              params.prefabChance = 1.0; // guarantee attempt
              placedPrefab = tryPlacePrefabAt(state, bounds, params, rand, current.pos, nextPos);
              params.prefabChance = origChance;
            }
            
            if (!placedPrefab) {
              if (!inBounds(nextPos, bounds)) break;
              const nextRoom = ensureRoom(state, nextPos);
              addExitBidirectional(state, current.id, nextRoom.id, "cardinal");
              current = nextRoom;
            } else {
              const nextRoom = state.roomsByPos.get(key(nextPos));
              if (nextRoom) current = nextRoom;
              else break;
            }
          }
        }
      }
    }
  }

  // Infer cardinal adjacency exits with privacy rule
  if (params.inferCardinalExits) {
    // For each room, check 6 neighbors; create exits if allowed by privacy rule
    for (const room of state.roomsByPos.values()) {
      for (const n of neighbors6(room.pos)) {
        if (!inBounds(n, bounds)) continue;
        const nk = key(n);
        const nRoom = state.roomsByPos.get(nk);
        if (!nRoom) continue;

        // Privacy gate: if either side is prefab non-portal, do not link.
        if (!canLinkCardinal(state, room.pos, n)) continue;

        addExitBidirectional(state, room.id, nRoom.id, "cardinal");
      }
    }
  }

  // NOTE: This increment does not add arbitrary exits outside prefabs; that’s a later increment.
  // Prefab internal exits may be arbitrary per prefab definition.

  // Deduplicate exits (since we may infer and also explicitly add)
  const seen = new Set<string>();
  const deduped: Exit[] = [];
  for (const ex of state.exits) {
    const k = `${ex.from}->${ex.to}:${ex.kind}`;
    if (seen.has(k)) continue;
    seen.add(k);
    deduped.push(ex);
  }

  return {
    rooms: Array.from(state.roomsByPos.values()),
    exits: deduped,
  };
}
