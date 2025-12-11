# $.scheduler - Periodic Jobs

Use `$.scheduler` for recurring tasks like heartbeats, decay processing, and timed events.

## Purpose

Manages persistent, scheduled jobs that survive server restarts. Jobs can be one-shot or repeating, with enable/disable support and manual triggering for testing.

## Why Use This?

**Bad: Fragile timers**
```javascript
const jobs = {};

function startDecayJob() {
  if (jobs.decay) clearInterval(jobs.decay);
  jobs.decay = setInterval(async () => {
    try {
      await processDecay();
    } catch (e) {
      console.error('Decay failed:', e);
      // Job dies, nothing restarts it
    }
  }, 60000);
}

// On server restart: all jobs lost!
// On crash: state inconsistent!
// Want to pause? More code.
// Want to test? More code.
```

**Good: Persistent scheduler**
```javascript
await $.scheduler.schedule('decayTick', 0, 60000, $.system, 'processDecay');
// Survives restarts, can pause/resume, can runNow() for testing
```

## What $.scheduler Handles

- ✅ Persistence across server restarts
- ✅ Enable/disable without losing config
- ✅ Manual trigger for testing (`runNow`)
- ✅ Job inspection (`getJob`, `listJobs`)
- ✅ Proper error isolation

## API Reference

### schedule() - Create Job

```javascript
await $.scheduler.schedule(name, delay, interval, target, method, ...args)
```

Creates or updates a scheduled job.

| Parameter | Type | Description |
|-----------|------|-------------|
| `name` | string | Unique job identifier |
| `delay` | number | ms until first run (0 = next tick) |
| `interval` | number | ms between runs (0 = one-shot) |
| `target` | RuntimeObject | Object to call method on |
| `method` | string | Method name to call |
| `...args` | any | Arguments to pass to method |

**Job Types:**
- **One-shot**: `interval = 0` - runs once after delay, then deleted
- **Repeating**: `interval > 0` - runs every interval after initial delay

**Examples:**
```javascript
// One-shot: runs once after 60s, then removed
await $.scheduler.schedule('reminder', 60000, 0, player, 'tell', 'Remember to save!');

// Repeating: immediate start, then every 60s
await $.scheduler.schedule('heartbeat', 0, 60000, $.system, 'tick');

// Delayed start repeating: first run in 10s, then every 60s
await $.scheduler.schedule('warmup', 10000, 60000, $.system, 'tick');
```

### unschedule() - Remove Job

```javascript
await $.scheduler.unschedule(jobName)
```

Permanently removes a job.

**Examples:**
```javascript
await $.scheduler.unschedule('oldJob');
```

### setEnabled() - Enable/Disable

```javascript
await $.scheduler.setEnabled(jobName, enabled)
```

Pauses or resumes a job without removing it.

**Examples:**
```javascript
await $.scheduler.setEnabled('decayTick', false);  // Pause
await $.scheduler.setEnabled('decayTick', true);   // Resume
```

### getJob() - Query Job

```javascript
await $.scheduler.getJob(jobName)
```

Returns job configuration.

**Examples:**
```javascript
const job = await $.scheduler.getJob('heartbeat');
// { interval, nextRun, targetId, method, args, enabled }
```

### listJobs() - List All Jobs

```javascript
await $.scheduler.listJobs()
```

Returns array of all job names.

**Examples:**
```javascript
const names = await $.scheduler.listJobs();
// ['heartbeat', 'decayTick', 'autosave', ...]
```

### runNow() - Manual Trigger

```javascript
await $.scheduler.runNow(jobName)
```

Immediately executes a job (for testing/debugging).

**Examples:**
```javascript
// Test decay without waiting
await $.scheduler.runNow('decayTick');
```

## Built-in Jobs

The system registers these jobs automatically:

| Job | Interval | Purpose |
|-----|----------|---------|
| `playerHeartbeat` | 60s | Calls `$.system.tickAllPlayers()` |
| `decayTick` | 60s | Processes decay on all decayable objects |

## Real-World Examples

### Autosave System

```javascript
// Save all players every 5 minutes
await $.scheduler.schedule('autosave', 0, 300000, $.system, 'saveAllPlayers');

// System method
async saveAllPlayers() {
  const players = await this.getOnlinePlayers();
  for (const player of players) {
    await this.savePlayer(player);
  }
}
```

### Enemy Respawn

```javascript
// Respawn enemies every 10 minutes
await $.scheduler.schedule('respawn', 0, 600000, spawner, 'respawnAll');

// Spawner method
async respawnAll() {
  for (const spawnPoint of this.spawnPoints) {
    if (spawnPoint.current === null) {
      const enemy = await $.recycler.create(spawnPoint.enemyType);
      enemy.location = spawnPoint.room;
      spawnPoint.current = enemy.id;
    }
  }
}
```

### Session Cleanup

```javascript
// Clean up expired sessions hourly
await $.scheduler.schedule('cleanup', 0, 3600000, $.authManager, 'cleanupSessions');

// Auth manager method
async cleanupSessions() {
  const now = Date.now();
  const expired = this.sessions.filter(s => s.expiresAt < now);
  
  for (const session of expired) {
    await this.removeSession(session.id);
  }
}
```

### Hunger/Thirst System

```javascript
// Tick hunger every minute
await $.scheduler.schedule('hungerTick', 0, 60000, $.system, 'tickHunger');

async tickHunger() {
  const players = await this.getOnlinePlayers();
  for (const player of players) {
    player.hunger = Math.max(0, player.hunger - 1);
    player.thirst = Math.max(0, player.thirst - 1);
    
    if (player.hunger === 0) {
      await player.takeDamage(5);
      await player.tell('You are starving!');
    }
  }
}
```

### Weather System

```javascript
// Change weather every 30 minutes
await $.scheduler.schedule('weatherChange', 0, 1800000, $.world, 'changeWeather');

async changeWeather() {
  const conditions = ['clear', 'cloudy', 'rainy', 'stormy'];
  const newWeather = conditions[Math.floor(Math.random() * conditions.length)];
  
  this.weather = newWeather;
  
  // Announce to all online players
  const players = await $.system.getOnlinePlayers();
  for (const player of players) {
    await player.tell(`The weather changes to ${newWeather}.`);
  }
}
```

### Crafting Completion

```javascript
// One-shot job for crafting completion
async startCrafting(player, recipe) {
  const jobName = 'craft_' + player.id;
  await $.scheduler.schedule(
    jobName,
    recipe.duration,
    0,  // One-shot
    this,
    'completeCrafting',
    player.id,
    recipe.id
  );
  
  await player.tell('You begin crafting...');
}

async completeCrafting(playerId, recipeId) {
  const player = await $.load(playerId);
  const recipe = await $.load(recipeId);
  
  const item = await $.recycler.create(recipe.result);
  item.location = player;
  
  await player.tell('You finish crafting ' + item.name + '!');
}
```

## Tips & Best Practices

1. **Use for recurring tasks** - Heartbeats, ticks, cleanup, etc.
2. **Set unique names** - Include IDs for per-object jobs (`'craft_' + player.id`)
3. **Clean up one-shots** - interval=0 auto-removes after execution
4. **Test with runNow()** - Don't wait for timer during development
5. **Disable, don't delete** - Use setEnabled() to pause temporarily
6. **Handle errors gracefully** - Jobs continue on error
7. **Store job data on objects** - Use properties, not job arguments, for changing state

## Common Patterns

### Per-Object Timers

```javascript
// Create a job specific to an object
await $.scheduler.schedule(
  'effect_' + player.id,
  5000,
  0,
  player,
  'removeEffect',
  'poison'
);
```

### Delayed Action

```javascript
// Execute something after a delay
await $.scheduler.schedule(
  'delayed_' + Date.now(),
  10000,
  0,
  this,
  'doSomething',
  arg1, arg2
);
```

### Repeating with Logic

```javascript
async periodicCheck() {
  // Run every minute
  if (this.condition) {
    await this.doAction();
  }
  // Else: skip this tick, check again next tick
}

await $.scheduler.schedule('check', 0, 60000, obj, 'periodicCheck');
```

## See Also

- [$.mutex](./mutex.md) - Lock objects during jobs
- [$.exclusions](./exclusions.md) - Prevent conflicting jobs
- [Core Concepts](../core-concepts.md) - Object persistence
