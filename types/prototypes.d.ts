/**
 * TypeScript definitions for MOO prototypes
 * These allow type-safe MOO code
 */

import type { ObjId, RuntimeObject } from './object.js';
import type { ConnectionContext } from '../src/game/connection-context.js';

/**
 * Describable - Base prototype for things that can be described
 */
export interface Describable extends RuntimeObject {
  name: string;
  description: string;
  aliases: string[];
  location: ObjId | null; // Location where this object is located

  describe(): Promise<string>;
  shortDesc(): Promise<string>;
}

/**
 * Location - Things that can contain other things
 */
export interface Location extends Describable {
  contents: ObjId[]; // Objects in this location

  describe(): Promise<string>;
  addContent(objId: ObjId): Promise<void>;
  removeContent(objId: ObjId): Promise<void>;
}

/**
 * Room - Locations with exits
 */
export interface Room extends Location {
  exits: Record<string, ObjId>; // direction -> destination room

  describe(): Promise<string>;
  addExit(direction: string, destId: ObjId): Promise<void>;
  removeExit(direction: string): Promise<void>;
}

/**
 * Agent - Things that can act (NPCs, players)
 */
export interface Agent extends Describable {
  location: ObjId; // Where the agent is
  inventory: ObjId[]; // What the agent is carrying

  moveTo(targetId: ObjId): Promise<void>;
  say(message: string): Promise<string>;
  emote(action: string): Promise<string>;
}

/**
 * Human - Human-like agents
 */
export interface Human extends Agent {
  sex: string;
  pronouns: {
    subject: string;
    object: string;
    possessive: string;
  };
  age: number;
  species: string;

  pronoun(type: 'subject' | 'object' | 'possessive'): Promise<string>;
}

/**
 * Player - Player characters
 */
export interface Player extends Human {
  // Authentication
  playername: string;
  email: string;
  passwordHash: string;
  sslFingerprint: string;
  oauthSubject: string;

  // Permissions
  canUseDevTools: boolean;
  isWizard: boolean;
  isSuspended: boolean;

  // Stats
  createdAt: Date;
  lastLogin: Date;
  totalPlaytime: number;

  // Player-specific
  title: string;
  homepage: string;

  // Methods
  connect(context: ConnectionContext): Promise<void>;
  disconnect(): Promise<void>;
  onInput(context: ConnectionContext, input: string): Promise<void>;
  checkPassword(password: string): Promise<boolean>;
  setPassword(password: string): Promise<void>;
}
