/**
 * all-builders.ts - Barrel file that imports all builders
 *
 * Import order doesn't matter - topological sort handles dependencies.
 * Each builder self-registers when imported.
 */

// ═══════════════════════════════════════════════════════════════════════════
// PROTOTYPES (base object types) - order doesn't matter, deps are declared
// ═══════════════════════════════════════════════════════════════════════════
import './prototypes/describable-builder';
import './prototypes/location-builder';
import './prototypes/room-builder';
import './prototypes/exit-builder';
import './prototypes/door-builder';
import './prototypes/lock-builder';
import './prototypes/sign-builder';
import './prototypes/agent-builder';
import './prototypes/embodied-builder';
import './prototypes/human-builder';
import './prototypes/player-builder';
import './prototypes/wearable-builder';
import './prototypes/weapon-builder';
import './prototypes/stackable-builder';
import './prototypes/decayable-builder';
import './prototypes/edible-builder';
import './prototypes/food-builder';
import './prototypes/drink-builder';
import './prototypes/clothing-builder';
import './prototypes/corpse-builder';
import './prototypes/wound-builder';
import './prototypes/bodypart-builder';
import './prototypes/admin-builder';
import './prototypes/dollar-builder';
import './prototypes/pocket-builder';
import './prototypes/writable-builder';
import './prototypes/letter-builder';
import './prototypes/locker-builder';
import './prototypes/ammo-builder';
import './prototypes/elevator-builder';
import './prototypes/elevator-door-builder';
import './prototypes/body-parts-builder';
import './prototypes/call-button-builder';
import './prototypes/magazine-builder';
import './prototypes/one-time-locker-builder';
import './prototypes/phone-db-builder';
import './prototypes/telescope-builder';
import './prototypes/clone-recording-studio-builder';
import './prototypes/clone-tank-builder';
import './prototypes/rentable-lock-builder';
import './prototypes/totem-pole-builder';
import './prototypes/sealed-box-builder';
import './prototypes/faction-builder';
import './prototypes/faction-manager-builder';

// Weapon sub-prototypes (all depend on weapon)
import './prototypes/bladed-weapon-builders';
import './prototypes/blunt-weapon-builders';
import './prototypes/firearm-builders';
import './prototypes/improvised-weapon-builders';

// Additional prototypes
import './prototypes/bank-builder';
import './prototypes/bank-terminal-builder';
import './prototypes/biometric-lock-builder';
import './prototypes/bottled-water-builder';
import './prototypes/disposal-builder';
import './prototypes/guarded-exit-builder';
import './prototypes/human-remains-builder';
import './prototypes/incinerator-builder';
import './prototypes/payphone-builder';
import './prototypes/phone-builder';
import './prototypes/skeletal-remains-builder';
import './prototypes/stomach-contents-builder';
import './prototypes/sustain-builder';
import './prototypes/vendable-builder';
import './prototypes/wireless-phone-builder';

// ═══════════════════════════════════════════════════════════════════════════
// CLIENT MODULES (JS served to browser)
// ═══════════════════════════════════════════════════════════════════════════
import './client/window-builder';
import './client/window-manager-builder';
import './client/desktop-builder';
import './client/taskbar-builder';
import './client/terminal-window-builder';
import './client/html-window-builder';
import './client/iframe-window-builder';
import './client/malice-client-builder';

// ═══════════════════════════════════════════════════════════════════════════
// CORE UTILITIES (no dependencies)
// ═══════════════════════════════════════════════════════════════════════════
import './http-builder';
import './blob-builder';
import './ai-image-gen-builder';
import './email-builder';
import './npm-builder';
import './format-builder';
import './mutex-builder';
import './recycler-builder';

// Web infrastructure (webDomain depends on webNode)
import './web-node-builder';
import './web-domain-builder';

// Auth and player management
import './auth-manager-builder';
import './chargen-builder';
import './preauth-handler-builder';

// Spatial and environment
import './spatial-builder';

// Text formatting and language
import './prompt-builder';
import './pronoun-sub-builder';
import './proportional-builder';
import './english-builder';
import './emote-builder';

// Body and embodiment
import './body-factory-builder';

// Utility systems
import './exclusions-builder';
import './memento-builder';
import './notes-builder';
import './combat-builder';
import './greeter-builder';
import './news-builder';

// AI systems (ai depends on aiPrompts)
import './ai-prompts-builder';
import './ai-builder';

// Game systems
import './cash-builder';
import './game-events-builder';
import './plot-builder';
import './session-builder';
import './scheduler-builder';

// World building (depends on room, exit, recycler)
import './world-builder';
import './building-builder';
import './world-api-builder';

// Web infrastructure
import './web-router-builder';
import './web-route-builder';
import './domain-registry-builder';

// MCP infrastructure
import './mcp-builder';

// City AI systems (pluribus/sisterGray depend on agent and aiPrompts)
import './mask-builder';
import './pluribus-builder';
import './sister-gray-builder';

// Additional AI/NPC systems
import './tailor-builder';

// Faction infrastructure
import './transports-builder';
import './default-factions-builder';

// Website (depends on webRoute, webRouter)
import './website-builder';

// Domain builders (depend on webDomain, domainRegistry, webRoute)
import './meta-domain-builder';
import './continuum-domain-builder';
import './cartel-domain-builder';
import './neurallog-domain-builder';

// Faction-specific chargen
import './cartel-chargen-builder';
import './neural-log-chargen-builder';
