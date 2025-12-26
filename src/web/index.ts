/**
 * Web Server Module
 *
 * Exports the web server factory for serving the Malice website.
 * All content is served from MOO objects ($webSite, $webPage, $webTemplate).
 */

export type { WebServerConfig } from './web-server.js';
export { createWebServer } from './web-server.js';
