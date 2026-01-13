---
name: Malice Website Management
description: Use this skill when asked to "edit the website", "change a web page", "create a route", "modify web content", "update the site", "add a page", "fix the website", or when dealing with $webDomain, $webRoute, $domainRegistry, HTTP handlers, or web routing in Malice.
version: 1.0.0
---

# Website Management

For website and routing documentation, read from $docs:

```javascript
const content = await $docs.read('WEB-ROUTES');
```

Key concepts:
- The website IS MOO objects in MongoDB
- No source files - edit objects directly
- Changes are live immediately

Key objects: `$domainRegistry`, `$webDomain`, `$webRoute`, `$continuumDomain`
