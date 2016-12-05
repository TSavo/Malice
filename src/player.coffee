require("./dist/proportionate.js")

global.$game.$index = {} if not global.$game.$index
global.$game.$index.players = {} if not global.$game.$index.players
global.$game.constants = {} if not global.$game.constants
global.$game.constants.player = {} if not global.$game.constants.player

pc = global.$game.constants.player

pc.maxHeight = 3.1
pc.maxWeight = 300
pc.weight = ["emaciated", "anorexic", "starving", "sickley", "under-weight", "skinny", "thin", "lean", "fit", "proportionate","of average weight", "a little thick", "big-boned", "flabby", "thick", "over-weight", "chubby", "portly", "fluffy", "fat", "obese", "massive", "a small planet"]
pc.height = ["non-existent", "microscopic", "itty-bitty", "dwarf-sized", "tiny", "diminutive", "petite", "puny", "very short", "short", "of average height", "slightly tall", "sizable", "pretty tall", "tall", "very tall", "extremely tall", "incredibly tall", "giant", "sky-scraping"]
pc.hairCut = ["bald", "balding", "cropped", "crew-cut", "buzzed", "flat-top", "mohawk", "bihawk", "fauxhawk", "devil lock", "shaved", "under-cut", "faded", "long", "shoulder-length", "layered",  "business", "comb-over", "plugged", "uneven", "bobed", "pixied"]
pc.hairStyle = ["curly", "pig-tails", "pony-tails", "straight", "wavy", "crimped", "messy", "permed", "dreaded", "unkempt", "neat", "tousled", "greasy", "gnarled", "french-twisted", "bun-curled", "spikey", "uncombed", "lifeless", "bouncy", "sparkly"]
pc.hairColor = ["black", "brown", "light brown", "dark brown", "blonde", "dirty blonde", "strawberry blonde", "auburn", "red", "ginger", "blue", "green", "purple", "pink", "orange", "burgundy", "indigo", "violet", "gray", "white", "platinum", "silver"]
pc.eyeColor = ["black", "blue", "red", "green", "emerald", "hazel", "brown", "yellow", "purple", "violet", "indigo", "orange", "pink"]
pc.eyeStyle = ["hooded", "blood-shot", "squinty", "round", "wide", "big", "small", "slanty", "scarred", "swollen", "puffy", "dark-rimmed", "bulging", "shifty", "doey", "aggressive", "submissive", "assertive", "defiant"]
pc.skinStyle = ["scarred", "porcelain", "flawless", "smooth", "rough", "sickly", "pasty", "sweaty", "smelly", "flaking", "calloused", "tattooed", "branded", "soft", "furry", "hairy", "hairless", "bruised", "vainy", "acne-ridden", "thin"]
pc.skinColor = ["albino", "ivory", "pale", "white", "tan", "peach", "olive", "jaundiced", "mocha", "rosy", "brown", "dark", "black", "green", "orange", "grey", "ashen", "sun-burnt", "red"]
pc.language = ["English", "Spanish", "French", "Chinese", "Japanese", "Korean", "Tagalog", "MixMash", "Hindi", "Arabic", "Portuguese", "German", "Russian"]
pc.ethnicity = ["Caucasian", "Latino", "French", "Chinese", "Japanese", "Korean", "Indian", "Native American", "German", "Russian"]
pc.stats = {} if not pc.stats
pc.stats.strengh = ["handicapped", "anemic", "feeble", "frail", "delicate", "weak", "average", "fit", "athletic", "strong", "beefy", "muscular", "built", "tank", "super-human", "god-like"]
pc.stats.endurance = ["cadaverous", "wasted", "pathetic", "quickly spent", "sub-standard", "medicore", "sufficient", "reasonable", "above par", "healthy", "sound", "robust", "vigorous", "energetic", "powerful", "machine-like", "nuclear", "eternal"]
pc.stats.charisma = ["disgusting", "ugly", "rude", "awkward", "socially inept", "unpleasant", "tolerable", "bland", "agreeable", "pleasant", "nice", "interesting", "charming", "fascinating", "seductive", "dazzling", "prophet", "cult leader", "politician"]
pc.stats.perception = ["oblivious", "half-asleep", "easily distracted", "day dreamer", "aware", "alert", "perceptive", "attentive", "acute", "keen", "eagle-eyed", "clairvoyant"]
pc.stats.intelligence = ["brain-dead", "dim-witted", "stupid", "ignorant", "dull", "slow", "functional", "smart", "clever", "sharp", "brilliant", "genius", "rocket scientist", "supercomputer", "AI"]
pc.stats.agility = ["useless", "sloth-like", "slow", "delayed", "adequate", "dexterous", "agile", "deft", "nimble", "quick", "cat-like", "fast", "ninja", "speeding bullet", "light-speed"]
pc.stats.luck = ["non-existant", "doomed", "terrible", "unfortunate", "not the best", "not an issue", "better than some", "better than most", "uncanny", "great", "charmed", "on a streak", "unstoppable", "favored by deities", "so good you can't possibly go wrong"]

pc.formatHeight = (height)->
  console.log(global.$game.constants.player.height.proportionate)
  global.$game.constants.player.height.proportionate(height, global.$game.constants.player.maxHeight)

pc.formatWeight = (weight, height = 1.7)->
  return global.$game.constants.player.weight.proportionate(weight, 100 * height)

if not global.$game.classes.Player
  global.$game.classes.Player = class Player
    constructor:->
      @type = "$game.classes.Player"
      this.init.apply(this, arguments)

player = global.$game.classes.Player.prototype

player.init = (@name, @user, @info, @location = global.$game.$index.rooms.$nowhere) ->
  throw new Error("Player names must be unique.") if global.$game.$index.players[@name]
  throw new Error("Player must be associated with a user.") if not @user
  global.$game.$index.players[@name] = this
  @salt = require("./node_modules/uuid").v4()
  @user.player = this
  @description = "Someone who needs a better description."
  @doing = ""
  @body = new global.$game.classes.HumanBody(this, @info)

player.moveTo = ->
  global.$game.common.moveTo.apply(this, arguments)

player.tell = (what)->
  @user.tell(what);

player.walkThrough = (exit) ->
  exit.accept(this)

player.getSex = ->
  @info.sex || "neuter"

player.getHeight = ->
  @info.height || 1.75

player.getWeight = ->
  @info.weight || 75

player.getHeightString = ->
  return global.$game.constants.player.formatHeight @info?.appearance?.height || 1.7

player.getWeightString = ->
  return global.$game.constants.player.formatWeight @info?.appearance?.weight || 80, @getHeight()

player.hold = (what)->
  return @tell("That's not something that can be held.") if what.cantBeHeld
  return @tell("You'll need both hands free for that.") if what.twoHanded && (@leftHand || @rightHand)
  if what.twoHanded
    @leftHand = @rightHand = what
    hands = "both hands"
  if(!@rightHand)
    return @tell("You're now holding the #{what.description()} in your right hand")

player.getSocket = ->
  @user.getSocket()

player.isConnected = ->
  @user.isConnected()

player.goIC = () ->
  @commandLoop()

player.commandLoop = ->
  if not @isConnected() then return console.log("Not connected")
  command = global.$game.common.question @getSocket(), ""
  self = this
  command.then (input)->
    try
      self.getInputHandler()(input)
    catch err
      console.log(err, err.stack.split("\n"))
    self.commandLoop()
  command.done()

player.getInputHandler = ->
  self = this
  return global.$driver.getInputHandler(self) || (input)->
    self.handleCommand(input)

player.setInputHandler = (handler) ->
  global.$game.$driver.setInputHandler(this, handler)

player.clearInputHandler = ->
  global.$game.$driver.clearInputHandler(this)

player.handleCommand = (command)->
  self = this
  func = @matchCommand(command)
  return @tell("I don't understand that.") if not func
  _ = require("./node_modules/underscore")
  test = _(func.tests).find (test)->
    test.regexp.test command
  args = [self]
  groups = test.regexp.exec(command)
  if test.position
    if test.position > -1
      args.push groups[test.position]
    else
      test.position.forEach (item)->
        args.push groups[item]
  func.func.apply(func.source, args)

player.matchCommand = (command)->
  _ = require("./node_modules/underscore")
  self = this
  _(@getCommands(self)).find (options)->
    _(options.tests).find (test)->
      test.regexp.test command

player.getCommands = (who)->
  _ = require("./node_modules/underscore")
  self = this
  commands = [
    {
      name:"l~ook"
      tests:[
        regexp:/l(ook)?$/i
      ]
      description:"Describes the room you're presently in."
      func:self.look
      source:self
    },
    {
      name:"l~ook [at/in] <something>"
      tests:[
        {
          regexp:/^l(ook)?\s(at\s|in\s|the\s)*(.+)$/i
          position:3
        }
      ]
      description:"Describes a specific item in more detail."
      func:self.lookAt
      source:self
    }
  ]
  commands = commands.concat(@location?.getCommands(who)) if @location.getCommands
  _(commands).flatten()

player.sees = (what)->
  if not @blind
    @tell what

player.look = ()->
  @sees(if @location.asSeenBy then @location?.asSeenBy(this) else @location.description)

player.lookAt = (who, what) ->
  listify = require("./node_modules/listify")
  return @tell("You're blind.") if @blind
  what = @resolve(what)
  return @tell("I don't see that here.") if not what
  return @tell("Did you mean the " + listify(_(what).map((item)->
    item.name
  ), {finalWord:"or"})) if what?.length and what.length > 0
  @sees(if what.asSeenBy then what.asSeenBy(who) else what.description)

player.resolveAllContents = ->
  @body.resolveAllContents().concat(@location.contents)

player.resolve = (what) ->
  _ = require("./node_modules/underscore")
  what = what.trim().toLowerCase()
  return this if what == "me"
  return @location if what == "here"
  contents = @resolveAllContents()
  found = _(contents).filter (item)->
    regexp.test(item?.name) || _(item?.aliases).find (alias)->
      regexp.test(alias)
  return found[0] if found and found.length == 1
  return found if found.length > 1
  groups = /^([\w-]+)\s(.*)$/i.exec what
  return undefined if not groups
  ordinal = require("./dist/ordinal.js")
  position = ordinal(groups[1])
  rest = groups[2]
  regexp = new RegExp("^(.*)\b(" + rest + ")(.*)$", "i")
  found = _(contents).filter (item)->
    regexp.test(item?.name || "") || _(item?.aliases || []).find (alias)->
      regexp.test(alias)
  return found[position-1] if found.length > 0 and position > 0 and found.length > position-1
  return undefined if found.length == 0
  found


