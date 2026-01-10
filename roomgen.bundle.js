// roomgen.ts
function mulberry32(seed) {
  return function rand() {
    let t = seed += 1831565813;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
var AXES = ["x", "y", "z"];
function key(p) {
  return `${p.x},${p.y},${p.z}`;
}
function addVec(a, b) {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}
function eqVec(a, b) {
  return a.x === b.x && a.y === b.y && a.z === b.z;
}
function inBounds(p, b) {
  return p.x >= b.min.x && p.x <= b.max.x && p.y >= b.min.y && p.y <= b.max.y && p.z >= b.min.z && p.z <= b.max.z;
}
function manhattan(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y) + Math.abs(a.z - b.z);
}
function neighbors6(p) {
  return [
    { x: p.x + 1, y: p.y, z: p.z },
    { x: p.x - 1, y: p.y, z: p.z },
    { x: p.x, y: p.y + 1, z: p.z },
    { x: p.x, y: p.y - 1, z: p.z },
    { x: p.x, y: p.y, z: p.z + 1 },
    { x: p.x, y: p.y, z: p.z - 1 }
  ];
}
function dirBetween(a, b) {
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
function dirToVec(d) {
  switch (d) {
    case "+x":
      return { x: 1, y: 0, z: 0 };
    case "-x":
      return { x: -1, y: 0, z: 0 };
    case "+y":
      return { x: 0, y: 1, z: 0 };
    case "-y":
      return { x: 0, y: -1, z: 0 };
    case "+z":
      return { x: 0, y: 0, z: 1 };
    case "-z":
      return { x: 0, y: 0, z: -1 };
  }
}
function vecToDir(v) {
  if (v.x === 1 && v.y === 0 && v.z === 0) return "+x";
  if (v.x === -1 && v.y === 0 && v.z === 0) return "-x";
  if (v.x === 0 && v.y === 1 && v.z === 0) return "+y";
  if (v.x === 0 && v.y === -1 && v.z === 0) return "-y";
  if (v.x === 0 && v.y === 0 && v.z === 1) return "+z";
  if (v.x === 0 && v.y === 0 && v.z === -1) return "-z";
  return null;
}
function detSign(r) {
  const order = { x: 0, y: 1, z: 2 };
  const perm = [order[r.ax], order[r.ay], order[r.az]];
  const inv = (perm[0] > perm[1] ? 1 : 0) + (perm[0] > perm[2] ? 1 : 0) + (perm[1] > perm[2] ? 1 : 0);
  const permSign = inv % 2 === 0 ? 1 : -1;
  const flipSign = r.sx * r.sy * r.sz;
  return permSign * flipSign;
}
function allProperRotations() {
  const rots = [];
  for (const ax of AXES) for (const ay of AXES) for (const az of AXES) {
    if ((/* @__PURE__ */ new Set([ax, ay, az])).size !== 3) continue;
    for (const sx of [1, -1])
      for (const sy of [1, -1])
        for (const sz of [1, -1]) {
          const r = { ax, ay, az, sx, sy, sz };
          if (detSign(r) === 1) rots.push(r);
        }
  }
  return rots;
}
var PROPER_ROTS = allProperRotations();
function rotateVec(p, r) {
  const get = (a) => p[a];
  return {
    x: get(r.ax) * r.sx,
    y: get(r.ay) * r.sy,
    z: get(r.az) * r.sz
  };
}
function rotateDir(d, r) {
  const v = dirToVec(d);
  const rv = rotateVec(v, r);
  const result = vecToDir(rv);
  if (!result) throw new Error(`rotateDir produced invalid direction`);
  return result;
}
var UnionFind = class {
  parent = /* @__PURE__ */ new Map();
  rank = /* @__PURE__ */ new Map();
  find(x) {
    if (!this.parent.has(x)) {
      this.parent.set(x, x);
      this.rank.set(x, 0);
    }
    const p = this.parent.get(x);
    if (p !== x) {
      this.parent.set(x, this.find(p));
    }
    return this.parent.get(x);
  }
  union(a, b) {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra === rb) return;
    const rankA = this.rank.get(ra);
    const rankB = this.rank.get(rb);
    if (rankA < rankB) {
      this.parent.set(ra, rb);
    } else if (rankA > rankB) {
      this.parent.set(rb, ra);
    } else {
      this.parent.set(rb, ra);
      this.rank.set(ra, rankA + 1);
    }
  }
  connected(a, b) {
    return this.find(a) === this.find(b);
  }
};
function addExitBidirectional(state, aId, bId, kind) {
  state.exits.push({ from: aId, to: bId, kind });
  state.exits.push({ from: bId, to: aId, kind });
  state.connectivity.union(aId, bId);
}
function ensureRoom(state, pos, meta) {
  const k = key(pos);
  const existing = state.roomsByPos.get(k);
  if (existing) {
    if (meta) existing.meta = { ...existing.meta ?? {}, ...meta };
    return existing;
  }
  const id = `r${state.nextRoomId++}`;
  const room = { id, pos: { ...pos }, meta: meta ? { ...meta } : void 0 };
  state.roomsByPos.set(k, room);
  state.roomIdByPosKey.set(k, id);
  state.sumPos = addVec(state.sumPos, pos);
  return room;
}
function roomCount(state) {
  return state.roomsByPos.size;
}
function centroid(state) {
  const n = state.roomsByPos.size;
  return { x: state.sumPos.x / n, y: state.sumPos.y / n, z: state.sumPos.z / n };
}
function isOccupied(state, pos) {
  return state.roomsByPos.has(key(pos));
}
function isPortal(state, pos) {
  return state.portalPosKeys.has(key(pos));
}
function isPrefabCell(state, pos) {
  return state.prefabPosKeys.has(key(pos));
}
function canLinkCardinal(state, a, b) {
  const aIsPrefab = isPrefabCell(state, a);
  const bIsPrefab = isPrefabCell(state, b);
  if (!aIsPrefab && !bIsPrefab) return true;
  if (aIsPrefab && !isPortal(state, a)) return false;
  if (bIsPrefab && !isPortal(state, b)) return false;
  return true;
}
function validatePrefab(p) {
  const cellSet = new Set(p.cells.map(key));
  if (!cellSet.has(key({ x: 0, y: 0, z: 0 }))) {
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
function tryPlacePrefabAt(state, bounds, params, rand, outsidePos, attachPos) {
  if (params.prefabs.length === 0) return false;
  if (rand() >= params.prefabChance) return false;
  const attachDir = dirBetween(outsidePos, attachPos);
  if (!attachDir) return false;
  const prefab = params.prefabs[Math.floor(rand() * params.prefabs.length)];
  validatePrefab(prefab);
  const portal = prefab.portals[Math.floor(rand() * prefab.portals.length)];
  const rotStart = Math.floor(rand() * PROPER_ROTS.length);
  for (let i = 0; i < PROPER_ROTS.length; i++) {
    const rot = PROPER_ROTS[(rotStart + i) % PROPER_ROTS.length];
    if (portal.allowedDirs) {
      const rotatedAllowed = portal.allowedDirs.map((d) => rotateDir(d, rot));
      if (!rotatedAllowed.includes(attachDir)) continue;
    }
    const portalRot = rotateVec(portal.cell, rot);
    const offset = {
      x: attachPos.x - portalRot.x,
      y: attachPos.y - portalRot.y,
      z: attachPos.z - portalRot.z
    };
    const absCells = [];
    for (const c of prefab.cells) {
      const rc = rotateVec(c, rot);
      const abs = addVec(offset, rc);
      if (!inBounds(abs, bounds)) {
        absCells.length = 0;
        break;
      }
      if (isOccupied(state, abs)) {
        absCells.length = 0;
        break;
      }
      absCells.push(abs);
    }
    if (absCells.length === 0) continue;
    if (roomCount(state) + absCells.length > params.maxRooms) return false;
    const instanceId = `p${state.nextPrefabInstance++}`;
    const portalAbsSet = /* @__PURE__ */ new Set();
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
        isPortal: isP || void 0
      });
    }
    const outsideRoom = ensureRoom(state, outsidePos);
    const attachRoom = ensureRoom(state, attachPos);
    addExitBidirectional(state, outsideRoom.id, attachRoom.id, "cardinal");
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
function chooseNextStep(state, bounds, rand, frontier, params) {
  const cur = frontier.pos;
  const target = frontier.target ?? centroid(state);
  const curDist = manhattan(cur, target);
  const candidates = [];
  for (const axis of AXES) {
    for (const step of [-1, 1]) {
      const nxt = { ...cur, [axis]: cur[axis] + step };
      if (!inBounds(nxt, bounds)) continue;
      if (nxt.z > -2) continue;
      const isExisting = isOccupied(state, nxt);
      let score = 1;
      if (isExisting) {
        score += params.linkPreference * 3;
      }
      if (frontier.dir && frontier.dir === axis) score += params.linearBias;
      const nextDist = manhattan(nxt, target);
      if (nextDist < curDist) score += 2;
      else if (nextDist > curDist) score -= 0.5;
      candidates.push({ pos: nxt, axis, score, isExisting });
    }
  }
  if (candidates.length === 0) return null;
  const weights = candidates.map((cand) => Math.max(0.01, cand.score));
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rand() * total;
  for (let i = 0; i < candidates.length; i++) {
    r -= weights[i];
    if (r <= 0) return { nextPos: candidates[i].pos, nextDir: candidates[i].axis };
  }
  return { nextPos: candidates[candidates.length - 1].pos, nextDir: candidates[candidates.length - 1].axis };
}
function generateWorld(entrances, bounds, seed, params) {
  if (entrances.length < 2) {
    throw new Error("Need at least 2 entrances to enforce all-to-all reachability meaningfully.");
  }
  const rand = mulberry32(seed);
  const state = {
    roomsByPos: /* @__PURE__ */ new Map(),
    exits: [],
    sumPos: { x: 0, y: 0, z: 0 },
    nextRoomId: 0,
    nextPrefabInstance: 0,
    roomIdByPosKey: /* @__PURE__ */ new Map(),
    portalPosKeys: /* @__PURE__ */ new Set(),
    prefabPosKeys: /* @__PURE__ */ new Set(),
    connectivity: new UnionFind()
  };
  const frontiers = [];
  for (const e of entrances) {
    if (!inBounds(e, bounds)) throw new Error("Entrance out of bounds");
    ensureRoom(state, e);
    let startPos = { ...e };
    if (e.z === -1) {
      const belowPos = { x: e.x, y: e.y, z: -2 };
      if (inBounds(belowPos, bounds)) {
        const above = ensureRoom(state, e);
        const below = ensureRoom(state, belowPos);
        addExitBidirectional(state, above.id, below.id, "cardinal");
        startPos = belowPos;
      }
    }
    const others = entrances.filter((o) => !eqVec(o, e)).map((o) => ({ pos: o, dist: manhattan(startPos, o) })).sort((a, b) => a.dist - b.dist);
    const closest = others.slice(0, 3);
    const mostDistant = others.slice(-1);
    const targets = [...closest];
    for (const t of mostDistant) {
      if (!targets.some((c) => eqVec(c.pos, t.pos))) {
        targets.push(t);
      }
    }
    for (const other of targets) {
      const dx = other.pos.x - startPos.x;
      const dy = other.pos.y - startPos.y;
      const dz = other.pos.z - startPos.z;
      let dir;
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
  while (frontiers.length > 0) {
    const hasTargetedFrontier = frontiers.some((f) => f.target);
    if (!hasTargetedFrontier) break;
    if (roomCount(state) >= params.maxRooms) break;
    const targetedIdx = frontiers.findIndex((f) => f.target);
    if (targetedIdx === -1) break;
    const frontier = frontiers.splice(targetedIdx, 1)[0];
    if (!inBounds(frontier.pos, bounds)) continue;
    if (frontier.target) {
      const distToTarget = manhattan(frontier.pos, frontier.target);
      if (distToTarget === 0) {
        continue;
      }
      if (distToTarget === 1) {
        const a = ensureRoom(state, frontier.pos);
        const b = ensureRoom(state, frontier.target);
        addExitBidirectional(state, a.id, b.id, "cardinal");
        continue;
      }
      const frontierRoom = state.roomsByPos.get(key(frontier.pos));
      const targetRoom = state.roomsByPos.get(key(frontier.target));
      if (frontierRoom && targetRoom && state.connectivity.connected(frontierRoom.id, targetRoom.id)) {
        continue;
      }
      if (targetRoom) {
        for (const neighbor of neighbors6(frontier.pos)) {
          const neighborRoom = state.roomsByPos.get(key(neighbor));
          if (neighborRoom && state.connectivity.connected(neighborRoom.id, targetRoom.id)) {
            const a = ensureRoom(state, frontier.pos);
            addExitBidirectional(state, a.id, neighborRoom.id, "cardinal");
            continue;
          }
        }
      }
    }
    const step = chooseNextStep(state, bounds, rand, frontier, params);
    if (!step) continue;
    const curPos = frontier.pos;
    const nextPos = step.nextPos;
    const placedPrefab = tryPlacePrefabAt(state, bounds, params, rand, curPos, nextPos);
    if (!placedPrefab) {
      const a = ensureRoom(state, curPos);
      const b = ensureRoom(state, nextPos);
      addExitBidirectional(state, a.id, b.id, "cardinal");
    }
    frontiers.push({ pos: { ...nextPos }, dir: step.nextDir, target: frontier.target });
  }
  const entranceRooms = entrances.map((e) => state.roomsByPos.get(key(e)).id);
  for (let i = 1; i < entranceRooms.length; i++) {
    if (!state.connectivity.connected(entranceRooms[0], entranceRooms[i])) {
      const comp1Rooms = Array.from(state.roomsByPos.values()).filter(
        (r) => state.connectivity.connected(r.id, entranceRooms[0])
      );
      const comp2Rooms = Array.from(state.roomsByPos.values()).filter(
        (r) => state.connectivity.connected(r.id, entranceRooms[i])
      );
      let bestDist = Infinity;
      let bestPair = null;
      for (const r1 of comp1Rooms) {
        for (const r2 of comp2Rooms) {
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
          let current = bestPair[0];
          const target = bestPair[1].pos;
          const directDist = manhattan(current.pos, target);
          const maxExtraSteps = Math.max(2, Math.floor(directDist * 0.2));
          let extraSteps = 0;
          let lastAxis = null;
          while (!eqVec(current.pos, target)) {
            const dx = target.x - current.pos.x;
            const dy = target.y - current.pos.y;
            const dz = target.z - current.pos.z;
            const moves = [];
            if (dx !== 0) moves.push({ next: { ...current.pos, x: current.pos.x + Math.sign(dx) }, axis: "x", isToward: true });
            if (dy !== 0) moves.push({ next: { ...current.pos, y: current.pos.y + Math.sign(dy) }, axis: "y", isToward: true });
            if (dz !== 0) moves.push({ next: { ...current.pos, z: current.pos.z + Math.sign(dz) }, axis: "z", isToward: true });
            if (extraSteps < maxExtraSteps) {
              for (const axis of AXES) {
                const isPerp = axis === "x" && dx === 0 || axis === "y" && dy === 0 || axis === "z" && dz === 0;
                if (isPerp) {
                  for (const step of [-1, 1]) {
                    const next = { ...current.pos, [axis]: current.pos[axis] + step };
                    if (inBounds(next, bounds) && !isOccupied(state, next)) {
                      moves.push({ next, axis, isToward: false });
                    }
                  }
                }
              }
            }
            if (moves.length === 0) break;
            const weights = moves.map((m) => {
              let w = m.isToward ? 3 : 1;
              if (lastAxis && m.axis === lastAxis) w += 0.3;
              w += rand() * 0.4;
              return w;
            });
            const total = weights.reduce((a, b) => a + b, 0);
            let r = rand() * total;
            let chosenMove = moves[0];
            for (let j = 0; j < moves.length; j++) {
              r -= weights[j];
              if (r <= 0) {
                chosenMove = moves[j];
                break;
              }
            }
            if (!chosenMove.isToward) extraSteps++;
            const nextPos = chosenMove.next;
            lastAxis = chosenMove.axis;
            let placedPrefab = false;
            if (rand() < 0.5 && params.prefabs.length > 0) {
              const origChance = params.prefabChance;
              params.prefabChance = 1;
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
  if (params.inferCardinalExits) {
    for (const room of state.roomsByPos.values()) {
      for (const n of neighbors6(room.pos)) {
        if (!inBounds(n, bounds)) continue;
        const nk = key(n);
        const nRoom = state.roomsByPos.get(nk);
        if (!nRoom) continue;
        if (!canLinkCardinal(state, room.pos, n)) continue;
        addExitBidirectional(state, room.id, nRoom.id, "cardinal");
      }
    }
  }
  const seen = /* @__PURE__ */ new Set();
  const deduped = [];
  for (const ex of state.exits) {
    const k = `${ex.from}->${ex.to}:${ex.kind}`;
    if (seen.has(k)) continue;
    seen.add(k);
    deduped.push(ex);
  }
  return {
    rooms: Array.from(state.roomsByPos.values()),
    exits: deduped
  };
}
export {
  generateWorld,
  mulberry32
};
