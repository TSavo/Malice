/**
 * Method Template Generator
 * Auto-generates method templates based on category and patterns
 */

import type { MethodSignature } from '../lsp/virtual-fs.js';

/**
 * Method template with metadata
 */
export interface MethodTemplate {
  category: string;
  methodName: string;
  template: string;
  signature: MethodSignature;
  description: string;
  examples: string[];
}

/**
 * Auto-generated method templates
 */
export class MethodTemplateGenerator {
  private readonly TEMPLATES: Record<string, MethodTemplate[]> = {
    lifecycle: [
      {
        category: 'lifecycle',
        methodName: 'onCreate',
        template: `async function onCreate(self: any, $: any, pass: any, ...args: any[]): Promise<void> {
  // Object initialization logic
  // This method is called when the object is first created

  console.log(\`\${self.name || 'Unnamed object'} created\`);

  // TODO: Add initialization logic here

  return;
}`,
        signature: {
          methodName: 'onCreate',
          args: [],
          returnType: 'void',
          context: [],
          category: 'lifecycle'
        },
        description: 'Called when object is first created or initialized',
        examples: [
          '// Log object creation',
          'await onCreate();'
        ]
      },
      {
        category: 'lifecycle',
        methodName: 'onDestroy',
        template: `async function onDestroy(self: any, $: any, pass: any, ...args: any[]): Promise<void> {
  // Object cleanup logic
  // This method is called when the object is being destroyed

  console.log(\`\${self.name || 'Unnamed object'} destroyed\`);

  // TODO: Add cleanup logic here
  // - Cancel any pending operations
  // - Release resources
  // - Notify other objects
  
  return;
}`,
        signature: {
          methodName: 'onDestroy',
          args: [],
          returnType: 'void',
          context: [],
          category: 'lifecycle'
        },
        description: 'Called when object is being destroyed or cleaned up',
        examples: [
          '// Clean up before destruction',
          'await onDestroy();'
        ]
      }
    ],
    events: [
      {
        category: 'events',
        methodName: 'onPlayerEnter',
        template: `async function onPlayerEnter(self: any, $: any, pass: any, ...args: any[]): Promise<void> {
  const player = args[0];
  
  // Player entered this room/object
  // Register room verbs, show welcome message, etc.
  
  console.log(\`Player \${player.name} entered \${self.name}\`);
  
  // TODO: Handle player entry
  // - Register room verbs with player.registerVerb()
  // - Show room description
  // - Trigger enter events
  
  return;
}`,
        signature: {
          methodName: 'onPlayerEnter',
          args: ['player: any'],
          returnType: 'void',
          context: [],
          category: 'events'
        },
        description: 'Called when a player enters this room or object',
        examples: [
          '// Welcome player to room',
          'await onPlayerEnter(player);'
        ]
      },
      {
        category: 'events',
        methodName: 'onPlayerExit',
        template: `async function onPlayerExit(self: any, $: any, pass: any, ...args: any[]): Promise<void> {
  const player = args[0];
  
  // Player left this room/object
  // Unregister verbs, say goodbye, etc.
  
  console.log(\`Player \${player.name} left \${self.name}\`);
  
  // TODO: Handle player exit
  // - Unregister room verbs with player.unregisterVerb()
  // - Trigger exit events
  // - Update room state
  
  return;
}`,
        signature: {
          methodName: 'onPlayerExit',
          args: ['player: any'],
          returnType: 'void',
          context: [],
          category: 'events'
        },
        description: 'Called when a player leaves this room or object',
        examples: [
          '// Handle player departure',
          'await onPlayerExit(player);'
        ]
      }
    ],
    public: [
      {
        category: 'public',
        methodName: 'look',
        template: `async function look(self: any, $: any, pass: any, ...args: any[]): Promise<string> {
  const target = args[0];
  
  // Look at something or show room description
  if (target) {
    // Looking at specific object
    const obj = typeof target === 'number' ? await $.load(target) : target;
    if (!obj) {
      return "You don't see that here.";
    }
    
    // Use object's describe method if available
    if (obj.describe) {
      return await obj.describe();
    }
    
    return \`You see \${obj.name || 'something'}.\`;
  } else {
    // Look around the room
    if (self.description) {
      let description = self.description;
      
      // List objects in the room
      const contents = self.contents || [];
      if (contents.length > 0) {
        const items = contents.map(obj => 
          typeof obj === 'object' && obj.name ? obj.name : \`object #\${obj}\`
        );
        description += "\\n\\nYou also see: " + items.join(", ");
      }
      
      return description;
    }
    
    return "You see nothing special.";
  }
}`,
        signature: {
          methodName: 'look',
          args: ['target?: any'],
          returnType: 'string',
          context: [],
          category: 'public'
        },
        description: 'Look at surroundings or examine a specific object',
        examples: [
          'await look(); // Look around',
          'await look(object); // Examine object'
        ]
      },
      {
        category: 'public',
        methodName: 'say',
        template: `async function say(self: any, $: any, pass: any, ...args: any[]): Promise<void> {
  const message = args[0];
  
  if (!message) {
    return; // No message to send
  }
  
  // Get all players in the same location
  const location = self.location;
  if (!location) {
    return;
  }
  
  const audience = location.contents || [];
  const speaker = self.name || 'Someone';
  
  // Send message to all players in room
  for (const player of audience) {
    // Make sure it's actually a player
    if (player && player.tell) {
      await player.tell(\`\${speaker} says, "\${message}"\`);
    }
  }
  
  // Also show to the speaker
  console.log(\`You say, "\${message}"\`);
  
  return;
}`,
        signature: {
          methodName: 'say',
          args: ['message: string'],
          returnType: 'void',
          context: [],
          category: 'public'
        },
        description: 'Send a message to everyone in the same location',
        examples: [
          'await say("Hello everyone!");',
          'await say(""); // Try without message'
        ]
      }
    ],
    combat: [
      {
        category: 'combat',
        methodName: 'attack',
        template: `async function attack(self: any, $: any, pass: any, ...args: any[]): Promise<string> {
  const target = args[0];
  
  if (!target) {
    return "Attack what?";
  }
  
  // Resolve target to object
  const targetObj = typeof target === 'number' ? await $.load(target) : target;
  if (!targetObj) {
    return "You don't see that here.";
  }
  
  // Check if target is attackable
  if (targetObj.health === undefined) {
    return \`You can't attack \${targetObj.name || 'that'}.\`;
  }
  
  // Calculate damage (simple example)
  const baseDamage = self.strength || 10;
  const targetDefense = targetObj.defense || 5;
  const damage = Math.max(1, baseDamage - targetDefense);
  
  // Apply damage
  targetObj.health = (targetObj.health || 100) - damage;
  
  // Generate combat message
  const result = damage > 0 ? 
    \`You hit \${targetObj.name} for \${damage} damage!\` :
    \`Your attack on \${targetObj.name} was ineffective!\`;
  
  // Check if target is defeated
  if (targetObj.health <= 0) {
    targetObj.health = 0;
    return \`\${result} \${targetObj.name} has been defeated!\`;
  }
  
  // Target can counter-attack if they have an attack method
  if (targetObj.attack && targetObj.health > 0) {
    // Schedule counter-attack (don't wait to avoid infinite loops)
    setTimeout(async () => {
      try {
        await targetObj.attack(self);
      } catch (err) {
        console.error('Counter-attack failed:', err);
      }
    }, 100);
  }
  
  return result;
}`,
        signature: {
          methodName: 'attack',
          args: ['target: any'],
          returnType: 'string',
          context: [],
          category: 'combat'
        },
        description: 'Attack a target with combat calculations',
        examples: [
          'await attack(monster);',
          'await attack(5); // Attack object #5'
        ]
      }
    ],
    communication: [
      {
        category: 'communication',
        methodName: 'tell',
        template: `async function tell(self: any, $: any, pass: any, ...args: any[]): Promise<void> {
  const target = args[0];
  const message = args[1];
  
  if (!target || !message) {
    return; // Missing target or message
  }
  
  // Resolve target to object
  const targetObj = typeof target === 'number' ? await $.load(target) : target;
  if (!targetObj) {
    console.error("Cannot find target for tell");
    return;
  }
  
  // Check if target can receive messages
  if (!targetObj.tell && !targetObj.hear) {
    console.error(\`\${targetObj.name} cannot receive messages\`);
    return;
  }
  
  // Send the message
  const senderName = self.name || 'Someone';
  const fullMessage = \`\${senderName} tells you, "\${message}"\`;
  
  if (targetObj.tell) {
    await targetObj.tell(fullMessage);
  } else if (targetObj.hear) {
    await targetObj.hear(fullMessage);
  }
  
  // Confirm to sender
  console.log(\`You tell \${targetObj.name}, "\${message}"\`);
  
  return;
}`,
        signature: {
          methodName: 'tell',
          args: ['target: any', 'message: string'],
          returnType: 'void',
          context: [],
          category: 'communication'
        },
        description: 'Send a private message to a specific target',
        examples: [
          'await tell(player, "Hello there!");',
          'await tell(42, "Secret message");'
        ]
      }
    ],
    movement: [
      {
        category: 'movement',
        methodName: 'go',
        template: `async function go(self: any, $: any, pass: any, ...args: any[]): Promise<string> {
  const direction = args[0];
  
  if (!direction) {
    return "Go where?";
  }
  
  // Get current location
  const currentLocation = self.location;
  if (!currentLocation) {
    return "You're not in a location.";
  }
  
  // Find exits in current location
  const exits = currentLocation.exits || {};
  const exitName = direction.toLowerCase();
  
  if (!exits[exitName]) {
    return \`You can't go \${direction} from here.\`;
  }
  
  // Get destination
  const destination = exits[exitName];
  if (!destination) {
    return \`The \${direction} exit seems broken.\`;
  }
  
  // Try to move to destination
  try {
    await self.moveTo(destination, self);
    
    // Look around new location
    if (self.look) {
      const description = await self.look();
      return description;
    }
    
    return \`You go \${direction}.\`;
    
  } catch (error) {
    return \`You can't go \${direction}: \${error.message || error}\`;
  }
}`,
        signature: {
          methodName: 'go',
          args: ['direction: string'],
          returnType: 'string',
          context: [],
          category: 'movement'
        },
        description: 'Move in a direction through exits',
        examples: [
          'await go("north");',
          'await go("up");',
          'await go("out");'
        ]
      }
    ],
    internal: [
      {
        category: 'internal',
        methodName: '_validatePermission',
        template: `async function _validatePermission(self: any, $: any, pass: any, ...args: any[]): Promise<boolean> {
  const player = args[0]; // Player to check
  const permission = args[1]; // Permission required
  const context = args[2]; // Additional context
  
  // Internal helper method to validate player permissions
  // Returns true if player has permission, false otherwise
  
  // Check if player is wizard/admin
  if (player.wizard || player.admin) {
    return true;
  }
  
  // Check specific permission
  const playerPermissions = player.permissions || {};
  
  switch (permission) {
    case 'build':
      return playerPermissions.build === true;
    case 'modify':
      return playerPermissions.modify === true;
    case 'delete':
      return playerPermissions.delete === true;
    case 'teleport':
      return playerPermissions.teleport === true;
    default:
      return playerPermissions[permission] === true;
  }
}`,
        signature: {
          methodName: '_validatePermission',
          args: ['player: any', 'permission: string', 'context?: any'],
          returnType: 'boolean',
          context: [],
          category: 'internal'
        },
        description: 'Internal helper to validate player permissions',
        examples: [
          'if (!await _validatePermission(player, "build")) return;',
          'const canModify = await _validatePermission(player, "modify");'
        ]
      }
    ]
  };

  /**
   * Get template for a specific method and category
   */
  getTemplate(category: string, methodName?: string): MethodTemplate | null {
    const templates = this.TEMPLATES[category] || [];
    
    if (methodName) {
      // Find specific method template
      const template = templates.find(t => t.methodName === methodName);
      return template || null;
    } else {
      // Return first template from category as example
      return templates.length > 0 ? templates[0] : null;
    }
  }

  /**
   * Get all templates for a category
   */
  getCategoryTemplates(category: string): MethodTemplate[] {
    return this.TEMPLATES[category] || [];
  }

  /**
   * Get all available categories
   */
  getCategories(): string[] {
    return Object.keys(this.TEMPLATES);
  }

  /**
   * Generate custom template based on pattern
   */
  generateTemplate(
    category: string,
    methodName: string,
    pattern: 'getter' | 'setter' | 'validator' | 'handler'
  ): MethodTemplate | null {
    const baseTemplate = this.getBasePatternTemplate(pattern);
    if (!baseTemplate) return null;

    return {
      category,
      methodName,
      template: baseTemplate.template.replace(/METHOD_NAME/g, methodName),
      signature: {
        methodName,
        args: baseTemplate.args,
        returnType: baseTemplate.returnType,
        context: [],
        category
      },
      description: baseTemplate.description.replace(/METHOD_NAME/g, methodName),
      examples: baseTemplate.examples.map((ex: string) => ex.replace(/METHOD_NAME/g, methodName))
    };
  }

  /**
   * Get base template pattern
   */
  private getBasePatternTemplate(pattern: string) {
    const patterns = {
      getter: {
        template: `async function METHOD_NAME(self: any, $: any, pass: any, ...args: any[]): Promise<any> {
  // Getter method - return property value
  
  // TODO: Implement getter logic
  const result = self[PropertyName]; // Change PropertyName to actual property
  
  return result;
}`,
        args: [],
        returnType: 'any',
        description: 'Get METHOD_NAME property value',
        examples: ['const value = await METHOD_NAME();']
      },
      setter: {
        template: `async function METHOD_NAME(self: any, $: any, pass: any, ...args: any[]): Promise<void> {
  const value = args[0];
  
  // Setter method - update property value
  
  // TODO: Add validation if needed
  self[PropertyName] = value; // Change PropertyName to actual property
  
  // TODO: Trigger any side effects
  console.log(\`METHOD_NAME set to: \${value}\`);
  
  return;
}`,
        args: ['value: any'],
        returnType: 'void',
        description: 'Set METHOD_NAME property value',
        examples: ['await METHOD_NAME(newValue);']
      },
      validator: {
        template: `async function METHOD_NAME(self: any, $: any, pass: any, ...args: any[]): Promise<boolean> {
  const input = args[0];
  
  // Validator method - check if input is valid
  
  // TODO: Implement validation logic
  const isValid = true; // Replace with actual validation
  
  if (!isValid) {
    // TODO: Provide meaningful error message
    console.error(\`METHOD_NAME validation failed: \${input}\`);
  }
  
  return isValid;
}`,
        args: ['input: any'],
        returnType: 'boolean',
        description: 'Validate METHOD_NAME input or state',
        examples: ['const isValid = await METHOD_NAME(input);']
      },
      handler: {
        template: `async function METHOD_NAME(self: any, $: any, pass: any, ...args: any[]): Promise<void> {
  const event = args[0];
  const data = args[1];
  
  // Event handler - respond to specific event
  
  console.log(\`METHOD_NAME handling event: \${event.type}\`);
  
  // TODO: Implement event handling logic
  switch (event.type) {
    case 'some-event':
      // Handle specific event type
      break;
    default:
      // Default handling
      break;
  }
  
  return;
}`,
        args: ['event: any', 'data?: any'],
        returnType: 'void',
        description: 'Handle METHOD_NAME events',
        examples: ['await METHOD_NAME(event, data);']
      }
    };

    return (patterns as Record<string, { template: string; args: string[]; returnType: string; description: string; examples: string[] }>)[pattern] || null;
  }
}