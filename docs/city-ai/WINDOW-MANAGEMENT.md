# Window Management

> Open windows on player clients to display images, HTML, terminals, and external content.

---

## Overview

The multiplexed WebSocket connection supports a `wm` (window manager) channel for controlling client-side windows. There are two APIs:

1. **Simple API**: `player.show()`, `close()`, `hide()` - For showing object images or HTML content
2. **Advanced API**: `player.openWindow()`, `closeWindow()`, `sendToWindow()` - Full control over window types and behavior

---

## Simple API (Recommended)

### player.show(name, content, options?)

Display an object's image or HTML content to the player. This is the easiest way to show visual content.

**Display an object:**
```javascript
// Show a locked door's image
const lock = await $load(42);
player.show('lock', lock, {
  icon: '🔐',
  persist: true  // Adds to start menu, persists across reconnects
});
```

**Display HTML:**
```javascript
// Show a document or custom UI
player.show('note', '<h1>Classified Memo</h1><p>Project UNUM is active...</p>', {
  icon: '📄',
  title: 'Classified Document',
  persist: false
});
```

**Options:**
- `persist` (boolean) - If true, adds window to start menu and persists across reconnects
- `icon` (string) - Unicode emoji for title bar/taskbar/start menu (e.g., '🔐', '📄', '🖼')
- `title` (string) - Override window title (defaults to object name or 'View')

### player.close(name)

Close a window. If the window was opened with `persist: true`, it stays in the start menu and can be reopened.

```javascript
player.close('lock');
```

### player.hide(name)

Close a window AND remove it from the start menu completely.

```javascript
player.hide('note');
```

### Persistence

Windows opened with `persist: true` are saved in `player.windowLayout` and automatically restored when the player reconnects:
- **Object windows**: Re-fetched from database with fresh image URLs
- **HTML windows**: Frame persists but HTML content is not stored (to avoid stale/large data)

---

## Advanced API

For more control over window behavior, use the lower-level `openWindow()` API.

## Window Types

| Type | Purpose | Key Config |
|------|---------|------------|
| `'html'` | Rich HTML content | `content` |
| `'iframe'` | Sandboxed external URL | `url` |
| `'terminal'` | xterm.js terminal | `channel` |

---

## Opening Windows

### player.openWindow(id, type, config)

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

### Config Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `title` | string | `''` | Window title bar text |
| `width` | number | `400` | Width in pixels |
| `height` | number | `300` | Height in pixels |
| `x` | number | auto | X position (auto-cascades if omitted) |
| `y` | number | auto | Y position (auto-cascades if omitted) |
| `content` | string | `''` | HTML content (for `'html'` type) |
| `url` | string | `''` | URL to load (for `'iframe'` type) |
| `channel` | string | `''` | Channel name (for `'terminal'` type) |
| `maximized` | boolean | `false` | Start maximized |
| `resizable` | boolean | `true` | Allow resize |
| `closable` | boolean | `true` | Show close button |
| `minimizable` | boolean | `true` | Allow minimize |

---

## HTML Windows

Display rich HTML content:

```javascript
player.openWindow('info-panel', 'html', {
  title: 'Character Sheet',
  width: 400,
  height: 600,
  content: `
    <div style="padding: 20px; font-family: monospace; color: #0f0; background: #000;">
      <h2>${player.name}</h2>
      <p>Health: ${player.hp} / ${player.maxHp}</p>
      <p>Credits: ${player.credits}</p>
    </div>
  `
});
```

### Styled Image Display

```javascript
const url = $blob.url(blobKey, 'thecontinuum.city');

player.openWindow('image-viewer', 'html', {
  title: 'Photo',
  width: 800,
  height: 600,
  content: `
    <div style="display:flex;align-items:center;justify-content:center;height:100%;background:#0a0a0a">
      <img src="${url}" style="max-width:100%;max-height:100%;object-fit:contain">
    </div>
  `
});
```

### Document Display

```javascript
player.openWindow('document', 'html', {
  title: 'Classified Memo',
  width: 500,
  height: 400,
  content: `
    <div style="padding: 20px; background: #fffef0; color: #333; font-family: 'Courier New', monospace;">
      <h3 style="color: red;">CLASSIFIED</h3>
      <p>To: All Department Heads</p>
      <p>Re: Project UNUM</p>
      <hr>
      <p>${memoContent}</p>
    </div>
  `
});
```

---

## Iframe Windows

Display external URLs in a sandboxed iframe:

```javascript
player.openWindow('browser', 'iframe', {
  title: 'Terminal Access',
  width: 800,
  height: 600,
  url: 'https://thecontinuum.city/terminal'
});
```

### Security

Iframes are sandboxed with restricted permissions. External content cannot access the parent window or game state.

---

## Terminal Windows

Create additional terminal windows connected to custom channels:

```javascript
player.openWindow('debug-console', 'terminal', {
  title: 'Debug Console',
  width: 800,
  height: 400,
  channel: 'debug:' + player.id
});

// Send output to the terminal
player.channel('debug:' + player.id, 'System initialized.\n');
player.channel('debug:' + player.id, 'Awaiting commands...\n');
```

---

## Closing Windows

### player.closeWindow(id)

```javascript
player.closeWindow('my-window');
```

---

## Updating Windows

### player.sendToWindow(id, payload)

Update window content after opening:

```javascript
// Replace HTML content
player.sendToWindow('info-panel', {
  action: 'set',
  content: '<p>Updated content</p>'
});

// Append to HTML
player.sendToWindow('log-window', {
  action: 'append',
  content: '<p>New log entry: ' + message + '</p>'
});

// Load new URL in iframe
player.sendToWindow('browser', {
  action: 'load',
  url: 'https://new-url.com'
});
```

### Actions

| Action | Window Type | Description |
|--------|-------------|-------------|
| `'set'` | html | Replace all content |
| `'append'` | html | Add to existing content |
| `'load'` | iframe | Navigate to new URL |

---

## Window Manager Channel

Under the hood, window management uses the `wm` channel:

```javascript
// This is what openWindow() does internally
player.channel('wm', {
  action: 'open',
  windowId: 'my-window',
  windowType: 'html',
  config: { title: 'Window', content: '...' }
});

// Close
player.channel('wm', {
  action: 'close',
  windowId: 'my-window'
});

// Update
player.channel('wm', {
  action: 'update',
  windowId: 'my-window',
  payload: { action: 'set', content: '...' }
});

// Focus (bring to front)
player.channel('wm', {
  action: 'focus',
  windowId: 'my-window'
});

// Flash (notification)
player.channel('wm', {
  action: 'flash',
  windowId: 'my-window'
});
```

---

## Examples

### Security Camera Feed

```javascript
// Generate camera view and display
const result = await $aiImageGen.generate(
  'Security camera feed, grainy black and white, showing empty corridor'
);
const url = $blob.url(result.blobKey, 'thecontinuum.city');

player.openWindow('cam-lobby', 'html', {
  title: 'CAM-07: Lobby',
  width: 640,
  height: 480,
  content: `
    <div style="background:#000;height:100%;display:flex;align-items:center;justify-content:center;position:relative">
      <img src="${url}" style="max-width:100%;max-height:100%;filter:grayscale(100%) contrast(1.2)">
      <div style="position:absolute;top:10px;left:10px;color:#0f0;font-family:monospace;font-size:12px">
        CAM-07 | ${new Date().toLocaleTimeString()} | REC
      </div>
    </div>
  `
});
```

### Live Updating Log

```javascript
// Open log window
player.openWindow('event-log', 'html', {
  title: 'Event Log',
  width: 400,
  height: 300,
  content: '<div id="log" style="padding:10px;font-family:monospace;font-size:12px;color:#0f0;background:#000;height:100%;overflow-y:auto"></div>'
});

// Append new entries as events happen
function logEvent(message) {
  const timestamp = new Date().toLocaleTimeString();
  player.sendToWindow('event-log', {
    action: 'append',
    content: `<p style="margin:2px 0">[${timestamp}] ${message}</p>`
  });
}

logEvent('System online');
logEvent('Motion detected: Sector 7');
logEvent('Door access: ID #4471');
```

### Multi-Panel Dashboard

```javascript
// Open multiple windows as a dashboard
player.openWindow('dash-map', 'html', {
  title: 'Map',
  x: 0, y: 0,
  width: 600, height: 400,
  content: mapHtml
});

player.openWindow('dash-status', 'html', {
  title: 'Status',
  x: 610, y: 0,
  width: 300, height: 200,
  content: statusHtml
});

player.openWindow('dash-alerts', 'html', {
  title: 'Alerts',
  x: 610, y: 210,
  width: 300, height: 190,
  content: alertsHtml
});
```

### NPC Showing Player a Photo

```javascript
// Create photo as real object
const photo = await $recycler.create($describable, {
  name: 'faded photograph',
  description: 'A creased photo showing two people standing in front of a building.',
  abilities: `Shows a younger Sister Gray with an older man - her father.
The building behind them is the old Cartel headquarters before the flush.
Both are smiling. The photo is worn from handling.`
});

// NPC hands it over
await photo.moveTo(npcHands.primary, npc);
await $emote.broadcast(room, npc, 'pulls out a worn photograph', {
  secondPerson: npc.name + ' pulls out a worn photograph.'
});

await photo.moveTo(playerHands.primary, player);
await $emote.broadcast(room, npc, 'hands you the photo', {
  secondPerson: npc.name + ' hands you the photo, eyes distant.'
});

// Generate and display
const blobKey = await photo.image({ aspectRatio: 'square' });
const url = $blob.url(blobKey, 'thecontinuum.city');

player.openWindow('photo-' + photo.id, 'html', {
  title: photo.name,
  width: 500,
  height: 500,
  content: `
    <div style="display:flex;align-items:center;justify-content:center;height:100%;background:#1a1a1a;padding:20px">
      <img src="${url}" style="max-width:100%;max-height:100%;object-fit:contain;border:8px solid #2a2a2a">
    </div>
  `
});
```

---

## Reference

### player.openWindow(id, type, config)

| Param | Type | Description |
|-------|------|-------------|
| `id` | string | Unique window identifier |
| `type` | string | `'html'`, `'iframe'`, or `'terminal'` |
| `config` | object | Window configuration |

### player.closeWindow(id)

| Param | Type | Description |
|-------|------|-------------|
| `id` | string | Window identifier to close |

### player.sendToWindow(id, payload)

| Param | Type | Description |
|-------|------|-------------|
| `id` | string | Window identifier |
| `payload` | object | `{ action, content?, url? }` |
