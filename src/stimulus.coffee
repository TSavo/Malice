_ = require("underscore")
global.$game = {} if not global.$game
global.$game.classes = {} if not global.$game.classes
global.$game.constants = {} if not global.$game.constants

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
global.$game.constants.stimulus.typeList = _(global.$game.constants.stimulus.types).pluck()

stim = global.$game.classes.Stimulus.prototype

stim.init = (@origin, @target, @value, @type = "visual", @language)->
  _ = require("underscore")
  throw new Error("Stimulus type must be of the supported types.") if _(global.$game.constants.stimulus.typeList).indexOf(@type) is -1
    
if not global.$game.classes.StimulusBuilder
  global.$game.classes.StimulusBuilder = class StimulusBuilder
    constructor:->
      @type = "$game.classes.StimulusBuilder"
      this.init.apply(this, arguments)

stimBuilder = global.$game.classes.StimulusBuilder.prototype
      
stimBuilder.init = (@origin, @target, @language = @origin?.language)->
  @stimulus = []

_(global.$game.constants.stimulus.typeList).each (type)->
  stimBuilder[type] = (what)->
    @stimulus = @stimulus.concat(new Stimulus(@origin, @target, what, global.$game.constants.stimulus.types[type], @language))
    this

stimBuilder.hear = stimBuilder.hears = stimBuilder.auditory
stimBuilder.sees = stimBuilder.see = stimBuilder.visual
stimBuilder.feels = stimBuilder.feel = stimBuilder.physical
stimBuilder.thinks = stimBuilder.think = stimBuilder.mental
stimBuilder.smells = stimBuilder.stink = stimBuilder.smell
stimBuilder.tastes = stimBuilder.taste

stimBuilder.quoted = stimBuilder.says = stimBuilder.say = (what)->
  this.hear who,  "\"" + what + "\""
  
stimBuilder.from = (@origin)->
  this
stimBuilder.to = (@target)->
  this
stimBuilder.in = (@language)->
  this
  
stimBuilder.build = ->
  @stimulus
  
if not global.$game.classes.StimulationGroup
  global.$game.classes.StimulationGroup = class StimulationGroup
    constructor:->
      @type = "$game.classes.StimulationGroup"
      this.init.apply(this, arguments)

stimGroup = global.$game.classes.StimulationGroup.prototype
      
stimGroup.init = (@contents)->

stimGroup.stimulate = (stimulation)->
  _ = require("./node_modules/underscore")
  _(@contents).each (who)->
    who.stimulate? stimulation
  
