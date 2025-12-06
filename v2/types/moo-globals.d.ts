/**
 * Type definitions for MOO method execution context
 * These types are available in all MOO method code
 */

import type { ObjId } from './object.js';
import type { ObjectManager } from '../src/database/object-manager.js';
import type { RuntimeObject } from './object.js';

/**
 * The global $ object - ObjectManager instance
 * Used to load objects, create objects, and access system functions
 */
declare const $: ObjectManager;

/**
 * The current object ('this' in MOO methods)
 * Type varies based on the prototype - should be narrowed in specific contexts
 */
declare const self: RuntimeObject;

/**
 * Arguments passed to the method
 */
declare const args: unknown[];
