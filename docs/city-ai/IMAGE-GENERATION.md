# Image Generation & Window Management

> When a player says "show me", create a real object, give it abilities, hand it to them, and image it.

---

## Philosophy: Real Objects First

Don't just pop up images. Create **real objects** with **abilities** that can be imaged:

```javascript
// BAD: Ephemeral image with no game state
const result = await $aiImageGen.generate('A map');
player.openWindow('map', 'html', { content: '<img src="...">' });
// Player has nothing. Can't examine it. Can't show it to someone else.

// GOOD: Real object the player can interact with
const map = await $recycler.create($describable, {
  name: 'hand-drawn map',
  description: 'A crumpled piece of paper with hastily sketched streets.',
  abilities: `A rough map of the underground tunnels. Shows passage from
the old metro station to the safehouse. Key landmarks marked: the flooded
junction, the collapse zone to avoid, the hidden cache at marker "7".`
});
await map.moveTo(playerHands.primary, player);
const blobKey = await map.image();
// Player HAS the map. Can examine it. Can lose it. Can show others.
```

**Why this matters:**
- The object persists in game state
- Player can `examine map` later - AI reads abilities
- Player can `show map to someone` - passes the object
- If player loses the map, they lose the info
- The image is generated from the object's own description

---

## $aiImageGen - Direct Image Generation

For generating images directly (used internally by `$describable.image()`):

### generate(prompt, options?)

Generate an image and store in `$blob`:

```javascript
const result = await $aiImageGen.generate('A cyberpunk banana with neon lights');
// {
//   success: true,
//   blobKey: '507f1f77bcf86cd799439011',
//   contentType: 'image/png',
//   prompt: 'A cyberpunk banana with neon lights',
//   aspectRatio: '16:9'
// }

// Get URL for display
const url = $blob.url(result.blobKey, 'thecontinuum.city');
```

### Options

```javascript
await $aiImageGen.generate('A glowing orb', {
  model: 'gemini-3-pro-image-preview',  // Override default model
  aspectRatio: 'portrait',               // 'landscape', 'portrait', 'square'
  metadata: { createdBy: player.id },    // Stored with blob
  filename: 'orb.png'                    // Optional filename
});
```

### Aspect Ratios

| Name | Ratio | Use Case |
|------|-------|----------|
| `'landscape'`, `'wide'` | 16:9 | Rooms, scenes, wide shots |
| `'portrait'`, `'tall'` | 9:16 | People, tall objects |
| `'square'` | 1:1 | Icons, items |

### generateRaw(prompt, options?)

Return base64 directly without storing:

```javascript
const result = await $aiImageGen.generateRaw('An icon');
// { success: true, data: 'base64...', contentType: 'image/png' }
```

### Available Models

```javascript
const models = $aiImageGen.listModels();
// [
//   { id: 'gemini-2.0-flash-exp-image-generation', tier: 'free' },
//   { id: 'gemini-2.5-flash-image', name: 'Nano Banana', tier: 'free' },
//   { id: 'gemini-3-pro-image-preview', name: 'Nano Banana Pro', tier: 'free' },
//   { id: 'imagen-4.0-generate-001', tier: 'paid' }
// ]

$aiImageGen.setDefaultModel('gemini-3-pro-image-preview');
```

**Environment:** Requires `GEMINI_API_KEY` environment variable.

---

## $describable.image() - Object Image Generation

Any object inheriting from `$describable` has an `image()` method:

```javascript
// Get or generate image (landscape default)
const blobKey = await item.image();

// Specify aspect ratio
const blobKey = await room.image({ aspectRatio: 'landscape' });
const blobKey = await npc.image({ aspectRatio: 'portrait' });

// Force regeneration (ignore cache)
const blobKey = await item.image({ force: true });

// Custom prompt (instead of using .describe())
const blobKey = await room.image({
  prompt: 'A rain-slicked cyberpunk street at night, neon reflections'
});
```

### Caching

Images are cached by aspect ratio on `self.images`:

```javascript
// After calling image() with different ratios:
item.images = {
  '16:9': 'abc123...',  // landscape
  '9:16': 'def456...',  // portrait
  '1:1': 'ghi789...'    // square
}

// Check existing images
const existingImages = item.images || {};
if (existingImages['16:9']) {
  // Already have a landscape image
}
```

### Error Handling

`image()` throws on error:

```javascript
try {
  const blobKey = await item.image();
} catch (e) {
  console.log('Image generation failed:', e.message);
}
```

---

## Window Management

Open windows on player clients to display content.

### openWindow(id, type, config)

```javascript
player.openWindow('my-window', 'html', {
  title: 'Window Title',
  width: 600,
  height: 400,
  x: 100, y: 100,           // Position (optional, auto-cascades)
  content: '<html>...',     // For 'html' type
  maximized: false,
  resizable: true,
  closable: true
});
```

### Window Types

| Type | Purpose | Key Config |
|------|---------|------------|
| `'html'` | Rich HTML content | `content` |
| `'iframe'` | Sandboxed external URL | `url` |
| `'terminal'` | xterm.js terminal | `channel` |

### closeWindow(id)

```javascript
player.closeWindow('my-window');
```

### sendToWindow(id, payload)

Update window content after opening:

```javascript
// Replace HTML content
player.sendToWindow('my-window', {
  action: 'set',
  content: '<p>New content</p>'
});

// Append to HTML
player.sendToWindow('log-window', {
  action: 'append',
  content: '<p>New log entry</p>'
});

// Load new URL in iframe
player.sendToWindow('browser', {
  action: 'load',
  url: 'https://new-url.com'
});
```

---

## Showing Images to Players

### Basic Pattern

```javascript
const blobKey = await item.image();
const url = $blob.url(blobKey, 'thecontinuum.city');

player.openWindow('img-' + Date.now(), 'html', {
  title: item.name,
  content: '<img src="' + url + '" style="max-width:100%;max-height:100%;object-fit:contain">'
});
```

### Styled Container

```javascript
player.openWindow('viewer', 'html', {
  title: item.name,
  width: 800,
  height: 600,
  content: `
    <div style="display:flex;align-items:center;justify-content:center;height:100%;background:#0a0a0a">
      <img src="${url}" style="max-width:100%;max-height:100%;object-fit:contain">
    </div>
  `
});
```

---

## Complete Example: NPC Handing Player a Map

The full pattern - create object, hand it over, image it:

```javascript
const room = player.location;
const npc = /* the NPC giving the map */;

// 1. Create the map as a real object with abilities
const map = await $recycler.create($describable, {
  name: 'hand-drawn map',
  description: 'A crumpled piece of paper with hastily sketched streets.',
  abilities: `A rough map of the underground tunnels. Shows passage from
the old metro station to the safehouse. Key landmarks marked: the flooded
junction, the collapse zone to avoid, the hidden cache at marker "7".
Drawn in pencil, smudged from handling.`
});

// 2. Move to NPC's hands
const npcHands = await npc.getHands();
await map.moveTo(npcHands.primary, npc);

// 3. NPC pulls it out
await $emote.broadcast(room, npc, 'pulls out a crumpled piece of paper', {
  secondPerson: npc.name + ' pulls out a crumpled piece of paper.'
});

// 4. Hand it to player
const playerHands = await player.getHands();
await map.moveTo(playerHands.primary, player);

await $emote.broadcast(room, npc, 'presses the map into your hand', {
  secondPerson: npc.name + ' presses the map into your hand.'
});

// 5. Generate and show the image
const blobKey = await map.image({ aspectRatio: 'landscape' });
const url = $blob.url(blobKey, 'thecontinuum.city');

player.openWindow('map-' + map.id, 'html', {
  title: map.name,
  width: 800,
  height: 600,
  content: `
    <div style="display:flex;align-items:center;justify-content:center;height:100%;background:#1a1a1a">
      <img src="${url}" style="max-width:100%;max-height:100%;object-fit:contain">
    </div>
  `
});
```

---

## When to Show Images

### Good Triggers

- **"show me"** - Player explicitly wants visual
- **"what does X look like"** - Describing appearance
- **Examining important objects** - When visual detail matters
- **NPC sharing information** - "Let me show you..."
- **Viewing security feeds, photos, documents**

### Quick Image (No Object)

For ephemeral visuals that don't need to persist:

```javascript
// Security camera feed - no object needed
const result = await $aiImageGen.generate('Security camera feed showing the lobby, grainy black and white');
const url = $blob.url(result.blobKey, 'thecontinuum.city');

player.openWindow('feed-' + Date.now(), 'html', {
  title: 'Security Feed',
  content: '<img src="' + url + '" style="max-width:100%;max-height:100%">'
});
```

Use this for:
- Live camera feeds
- Hallucinations/visions
- Terminal displays
- Temporary UI elements

---

## Reference

### $aiImageGen Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `generate(prompt, opts?)` | `{ success, blobKey, ... }` | Generate and store in $blob |
| `generateRaw(prompt, opts?)` | `{ success, data, ... }` | Generate and return base64 |
| `listModels()` | `[{ id, name, tier }]` | Available models |
| `setDefaultModel(id)` | `{ success, model }` | Change default |

### $describable.image() Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `aspectRatio` | string | `'landscape'` | `'landscape'`, `'portrait'`, `'square'` |
| `force` | boolean | `false` | Regenerate even if cached |
| `prompt` | string | from `.describe()` | Override prompt |
| `model` | string | default | Override model |

### player.openWindow() Config

| Option | Type | Description |
|--------|------|-------------|
| `title` | string | Window title bar |
| `width` | number | Width in pixels |
| `height` | number | Height in pixels |
| `x`, `y` | number | Position (optional) |
| `content` | string | HTML content (for 'html' type) |
| `url` | string | URL (for 'iframe' type) |
| `maximized` | boolean | Start maximized |
| `resizable` | boolean | Allow resize |
| `closable` | boolean | Show close button |
