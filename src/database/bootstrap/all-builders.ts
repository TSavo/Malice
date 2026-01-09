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

// Street furniture / urban infrastructure
import './prototypes/lamppost-builder';
import './prototypes/park-lamp-builder';
import './prototypes/street-signal-builder';
import './prototypes/street-sign-builder';
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
import './prototypes/phone-implant-builder';

// Cyberware
import './prototypes/cyberware-builder';
import './prototypes/cyber-arm-builder';
import './prototypes/cyber-leg-builder';
import './prototypes/cyber-tools-builder';

// Vehicle system
import './prototypes/vehicle-part-builder';
import './prototypes/engine-builder';
import './prototypes/fuel-tank-builder';
import './prototypes/vehicle-battery-builder';
import './prototypes/wheel-builder';
import './prototypes/transmission-builder';
import './prototypes/vehicle-builder';
import './prototypes/car-builder';
import './prototypes/garage-builder';
import './prototypes/mechanic-builder';

// Dynamic room types (created by $spatial)
import './prototypes/airspace-room-builder';
import './prototypes/water-room-builder';
import './prototypes/underwater-room-builder';

// Aircraft
import './prototypes/rotor-builder';
import './prototypes/aircraft-builder';
import './prototypes/helicopter-builder';

// Watercraft
import './prototypes/watercraft-builder';
import './prototypes/boat-builder';
import './prototypes/submarine-builder';

// Medical & drugs
import './prototypes/medical-builder';
import './prototypes/adrenaline-builder';
import './prototypes/anesthetic-builder';
import './prototypes/antibiotics-builder';
import './prototypes/bandage-builder';
import './prototypes/blood-bag-builder';
import './prototypes/defibrillator-builder';
import './prototypes/medkit-builder';
import './prototypes/morphine-builder';
import './prototypes/painkillers-builder';
import './prototypes/pill-builder';
import './prototypes/splint-builder';
import './prototypes/stimpak-builder';
import './prototypes/surgical-kit-builder';
import './prototypes/suture-kit-builder';
import './prototypes/syringe-builder';
import './prototypes/tourniquet-builder';
import './prototypes/drug-builder';
import './prototypes/alcohol-builder';
import './prototypes/cigar-builder';
import './prototypes/cigarette-builder';
import './prototypes/smokable-builder';

// Additional cyberware
import './prototypes/arm-blade-builder';
import './prototypes/audio-enhancer-builder';
import './prototypes/bone-lacing-builder';
import './prototypes/bone-weave-builder';
import './prototypes/chrome-eye-builder';
import './prototypes/combat-computer-builder';
import './prototypes/data-storage-builder';
import './prototypes/dermal-display-builder';
import './prototypes/echolocation-module-builder';
import './prototypes/internal-clock-builder';
import './prototypes/micro-tools-builder';
import './prototypes/neural-probe-builder';
import './prototypes/neural-scanner-builder';
import './prototypes/olfactory-booster-builder';
import './prototypes/pain-editor-builder';
import './prototypes/reflex-booster-builder';
import './prototypes/retractable-claws-builder';
import './prototypes/subdermal-armor-builder';
import './prototypes/subdermal-pocket-builder';
import './prototypes/tactile-boost-builder';
import './prototypes/targeting-system-builder';
import './prototypes/taste-analyzer-builder';
import './prototypes/toxin-filter-builder';
import './prototypes/voice-modulator-builder';

// Armor & protective gear
import './prototypes/armor-builder';
import './prototypes/armor-mesh-builder';
import './prototypes/ballistic-vest-builder';
import './prototypes/combat-boots-builder';
import './prototypes/combat-gloves-builder';
import './prototypes/gas-mask-builder';
import './prototypes/helmet-builder';
import './prototypes/rebreather-builder';
import './prototypes/riot-helmet-builder';
import './prototypes/riot-shield-builder';
import './prototypes/stab-vest-builder';
import './prototypes/tactical-vest-builder';

// Tools
import './prototypes/tool-builder';
import './prototypes/bolt-cutters-builder';
import './prototypes/crowbar-builder';
import './prototypes/duct-tape-builder';
import './prototypes/flashlight-builder';
import './prototypes/generator-builder';
import './prototypes/grappling-hook-builder';
import './prototypes/hacksaw-builder';
import './prototypes/hammer-builder';
import './prototypes/ladder-builder';
import './prototypes/lighter-builder';
import './prototypes/lockpick-builder';
import './prototypes/multitool-builder';
import './prototypes/pliers-builder';
import './prototypes/prybar-builder';
import './prototypes/radio-builder';
import './prototypes/rope-builder';
import './prototypes/screwdriver-builder';
import './prototypes/torch-builder';
import './prototypes/wire-cutters-builder';
import './prototypes/wrench-builder';

// Explosives & grenades
import './prototypes/explosive-builder';
import './prototypes/grenade-builder';
import './prototypes/c4-builder';
import './prototypes/detonator-builder';
import './prototypes/dynamite-builder';
import './prototypes/flashbang-builder';
import './prototypes/frag-grenade-builder';
import './prototypes/ied-builder';
import './prototypes/mine-builder';
import './prototypes/molotov-builder';
import './prototypes/smoke-grenade-builder';

// Restraints
import './prototypes/handcuffs-builder';
import './prototypes/zip-ties-builder';

// Food & consumables
import './prototypes/candy-builder';
import './prototypes/canned-food-builder';
import './prototypes/coffee-builder';
import './prototypes/ration-pack-builder';
import './prototypes/snack-builder';
import './prototypes/soda-builder';

// Containers & storage
import './prototypes/backpack-builder';
import './prototypes/cabinet-builder';
import './prototypes/crate-builder';
import './prototypes/dumpster-builder';
import './prototypes/safe-builder';
import './prototypes/trunk-builder';
import './prototypes/wardrobe-builder';

// Furniture
import './prototypes/furniture-builder';
import './prototypes/bed-builder';
import './prototypes/bench-builder';
import './prototypes/chair-builder';
import './prototypes/couch-builder';
import './prototypes/desk-builder';
import './prototypes/table-builder';

// Electronics & sensors
import './prototypes/alarm-builder';
import './prototypes/camera-builder';
import './prototypes/sensor-builder';

// Vehicle parts (additional)
import './prototypes/alternator-builder';
import './prototypes/brakes-builder';
import './prototypes/bumper-builder';
import './prototypes/ecu-builder';
import './prototypes/exhaust-builder';
import './prototypes/fender-builder';
import './prototypes/headlights-builder';
import './prototypes/radiator-builder';
import './prototypes/starter-builder';
import './prototypes/steering-builder';
import './prototypes/vehicle-door-builder';
import './prototypes/vehicle-exit-builder';
import './prototypes/vehicle-room-builder';
import './prototypes/windshield-builder';
import './prototypes/wiring-harness-builder';
import './prototypes/motorcycle-builder';
import './prototypes/av-builder';
import './prototypes/vector-thruster-builder';
import './prototypes/nav-computer-builder';
import './prototypes/hardpoint-builder';
import './prototypes/turret-builder';

// Fuel system
import './prototypes/fuel-builder';
import './prototypes/fuel-container-builder';
import './prototypes/fuel-pump-builder';
import './prototypes/fuel-siphon-builder';

// Filtration & breathing
import './prototypes/air-filter-builder';
import './prototypes/air-tank-builder';
import './prototypes/filter-unit-builder';

// Power
import './prototypes/power-cell-builder';
import './prototypes/port-builder';

// Traps
import './prototypes/trap-builder';

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
import './image-bootstrap-builder';
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
import './builder-system-builder';

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

// Blog (depends on metaDomain, webPage, webRoute)
import './blog-builder';

// Faction-specific chargen
import './cartel-chargen-builder';
import './neural-log-chargen-builder';

// Underground upgrades (locks and furniture, depends on sisterGray)
import './underground-upgrades-builder';
