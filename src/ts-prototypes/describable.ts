// @ts-nocheck

// Local no-op decorator stub so this file can be parsed/extracted.
// The extractor only needs the decorator call + object literal.
function prototype(_info: { alias: string; parent: string }) {
  return (_target: unknown) => {};
}

@prototype({ alias: 'describable', parent: 'root' })
export class Describable {
  static defaults = {
    name: 'Describable',
    description: 'Base prototype for things that exist in the world',
    aliases: [],
    location: null,
    contents: [],
    width: 0,
    height: 0,
    depth: 0,
    weight: 0,
    boltedDown: false,
  };

  async describe(self, $, pass) {
    return `${self.name}\r\n${self.description}`;
  }

  async shortDesc(self, $, pass) {
    return self.name;
  }

  async getVolume(self, $, pass) {
    return (self.width || 0) * (self.height || 0) * (self.depth || 0);
  }

  async canFitIn(self, $, pass) {
    const container = args[0];
    const dims = [self.width || 0, self.height || 0, self.depth || 0].sort((a, b) => a - b);
    const containerDims = [container.width || 0, container.height || 0, container.depth || 0].sort((a, b) => b - a);
    return dims[0] <= containerDims[0] && dims[1] <= containerDims[1] && dims[2] <= containerDims[2];
  }

  async canContain(self, $, pass) {
    const obj = args[0];
    const objName = obj?.name || 'that';
    return `The ${self.name} cannot contain ${objName}.`;
  }

  async moveTo(self, $, pass) {
    let dest = args[0];
    const mover = args[1];

    if (typeof dest === 'number') {
      dest = await $.load(dest);
    }

    if (!dest || dest.id === undefined) {
      throw new Error('Invalid destination');
    }

    const source = self.location;

    const canContain = await dest.canContain(self);
    if (canContain !== true) {
      return canContain;
    }

    if (source && source.onContentLeaving) {
      await source.onContentLeaving(self, dest, mover);
    }
    await self.onLeaving(source, dest, mover);

    if (source && source.removeContent) {
      await source.removeContent(self);
    }
    self.location = dest;
    if (dest.addContent) {
      await dest.addContent(self);
    }

    if (source && source.onContentLeft) {
      await source.onContentLeft(self, dest, mover);
    }
    await self.onArrived(dest, source, mover);
    if (dest.onContentArrived) {
      await dest.onContentArrived(self, source, mover);
    }
  }

  async addContent(self, $, pass) {
    const item = args[0];
    if (!item || typeof item.id !== 'number') {
      return;
    }

    const contents = self.contents || [];
    const alreadyPresent = contents.some((c) => (c?.id || c) === item.id);
    if (!alreadyPresent) {
      contents.push(item);
      self.contents = contents;
      item.location = self;
    }
  }

  async removeContent(self, $, pass) {
    let item = args[0];

    const targetId = typeof item === 'number' ? item : item?.id;
    if (targetId === undefined) {
      return;
    }

    const contents = self.contents || [];
    const index = contents.findIndex((c) => (c?.id || c) === targetId);
    if (index !== -1) {
      contents.splice(index, 1);
      self.contents = contents;
    }
  }

  async onLeaving(self, $, pass) {
    const source = args[0];
    const dest = args[1];
    const mover = args[2];
  }

  async onArrived(self, $, pass) {
    const dest = args[0];
    const source = args[1];
    const mover = args[2];
  }

  async onPlayerEnter(self, $, pass) {
    const player = args[0];
    for (const obj of self.contents || []) {
      if (obj.getRoomVerbs) {
        for (const { pattern, method } of obj.getRoomVerbs()) {
          await player.registerVerb(pattern, obj, method);
        }
      }
    }
  }

  async onPlayerExit(self, $, pass) {
    const player = args[0];
    for (const obj of self.contents || []) {
      if (obj.getRoomVerbs) {
        for (const { pattern } of obj.getRoomVerbs()) {
          await player.unregisterVerb(pattern);
        }
      }
    }
  }

  async triggerPlotHooks(self, $, pass) {
    const eventName = args[0];
    const data = args[1] || {};

    const plotHooks = self.plotHooks || {};
    const hooks = plotHooks[eventName] || [];

    if (hooks.length === 0) {
      return 0;
    }

    let triggered = 0;

    for (const hook of hooks) {
      const filter = hook.filter || {};
      let matches = true;
      for (const [key, value] of Object.entries(filter)) {
        if (data[key] !== value) {
          matches = false;
          break;
        }
      }

      if (!matches) {
        continue;
      }

      let plot = hook.plot;
      if (typeof plot === 'number') {
        plot = await $.load(plot);
      }
      if (!plot) {
        continue;
      }

      try {
        if (hook.jobId) {
          if (plot.onJobHookTriggered) {
            await plot.onJobHookTriggered(hook.jobId, eventName, self.id, data, filter);
            triggered++;
          }
        } else {
          if (plot.onHookTriggered) {
            await plot.onHookTriggered(eventName, self.id, data, filter);
            triggered++;
          }
        }
      } catch (e) {
        console.error('Error triggering hook for plot #' + (plot?.id || plot) + ':', e.message);
      }
    }

    return triggered;
  }

  async getPlotHooks(self, $, pass) {
    return self.plotHooks || {};
  }

  async hasPlotHook(self, $, pass) {
    const eventName = args[0];
    const plotHooks = self.plotHooks || {};
    const hooks = plotHooks[eventName] || [];
    return hooks.length > 0;
  }
}
