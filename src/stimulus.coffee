if not global.$game.classes.Stimulus
  global.$game.classes.Stimulus = class Stimulus
    constructor:->
      @type = "$game.classes.Stimulus"
      this.init.apply(this, arguments)
      
global.$game.constants.stimulus = {} if not global.$game.constants.stimulus
global.$game.constants.stimulus.types = {} if not global.$game.constants.stimulus.types
global.$game.constants.stimulus.types.mental = "mental"
global.$game.constants.stimulus.types.physical = "physical"
global.$game.constants.stimulus.types.visual = "visual"
global.$game.constants.stimulus.types.auditory = "auditory"
global.$game.constants.stimulus.types.smell = "smell"
global.$game.constants.stimulus.types.taste = "taste"
global.$game.constants.stimulus.typeList = require("./node_modules/underscore")(global.$game.constants.stimulus.types).pluck()

stim = global.$game.classes.Stimulus.prototype

stim.init = (@type, @value)->
  _ = require("./node_modules/underscore")
  throw new Error("Stimulus type must be of the supported types.") if _(global.$game.constants.stimulus.typeList).indexOf(@type) == -1
  