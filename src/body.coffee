require "bodyPart"
require "proportionate"

global.$game = {} if not global.$game
global.$game.constants = {} if not global.$game.constants
global.$game.constants.body = {} if not global.$game.constants.body
global.$game.constants.body.human = {} if not global.$game.constants.body.human
global.$game.classes = {} if not global.$game.classes
global.$game.common = {} if not global.$game.common

human = global.$game.constants.body.human

human.maxHeight = 3.1
human.maxWeight = 300
human.weight = ["emaciated", "anorexic", "starving", "sickley", "under-weight", "skinny", "thin", "lean", "fit", "proportionate","of average weight", "a little thick", "big-boned", "flabby", "thick", "over-weight", "chubby", "portly", "fluffy", "fat", "obese", "massive", "a small planet"]
human.height = ["non-existent", "microscopic", "itty-bitty", "dwarf-sized", "tiny", "diminutive", "petite", "puny", "very short", "short", "of average height", "slightly tall", "sizable", "pretty tall", "tall", "very tall", "extremely tall", "incredibly tall", "giant", "sky-scraping"]
human.hairCut = ["bald", "balding", "cropped", "crew-cut", "buzzed", "flat-top", "mohawk", "bihawk", "fauxhawk", "devil lock", "shaved", "under-cut", "faded", "long", "shoulder-length", "layered",  "business", "comb-over", "plugged", "uneven", "bobed", "pixied"]
human.hairStyle = ["curly", "pig-tails", "pony-tails", "straight", "wavy", "crimped", "messy", "permed", "dreaded", "unkempt", "neat", "tousled", "greasy", "gnarled", "french-twisted", "bun-curled", "spikey", "uncombed", "lifeless", "bouncy", "sparkly"]
human.hairColor = ["black", "brown", "light brown", "dark brown", "blonde", "dirty blonde", "strawberry blonde", "auburn", "red", "ginger", "blue", "green", "purple", "pink", "orange", "burgundy", "indigo", "violet", "gray", "white", "platinum", "silver"]
human.eyeColor = ["black", "blue", "red", "green", "emerald", "hazel", "brown", "yellow", "purple", "violet", "indigo", "orange", "pink"]
human.eyeStyle = ["hooded", "blood-shot", "squinty", "round", "wide", "big", "small", "slanty", "scarred", "swollen", "puffy", "dark-rimmed", "bulging", "shifty", "doey", "aggressive", "submissive", "assertive", "defiant"]
human.skinStyle = ["scarred", "porcelain", "flawless", "smooth", "rough", "sickly", "pasty", "sweaty", "smelly", "flaking", "calloused", "tattooed", "branded", "soft", "furry", "hairy", "hairless", "bruised", "vainy", "acne-ridden", "thin"]
human.skinColor = ["albino", "ivory", "pale", "white", "tan", "peach", "olive", "jaundiced", "mocha", "rosy", "brown", "dark", "black", "green", "orange", "grey", "ashen", "sun-burnt", "red"]
human.language = ["English", "Spanish", "French", "Chinese", "Japanese", "Korean", "Tagalog", "MixMash", "Hindi", "Arabic", "Portuguese", "German", "Russian"]
human.ethnicity = ["Caucasian", "Latino", "French", "Chinese", "Japanese", "Korean", "Indian", "Native American", "German", "Russian"]
human.stats = {} if not human.stats
human.stats.strengh = ["handicapped", "anemic", "feeble", "frail", "delicate", "weak", "average", "fit", "athletic", "strong", "beefy", "muscular", "built", "tank", "super-human", "god-like"]
human.stats.endurance = ["cadaverous", "wasted", "pathetic", "quickly spent", "sub-standard", "medicore", "sufficient", "reasonable", "above par", "healthy", "sound", "robust", "vigorous", "energetic", "powerful", "machine-like", "nuclear", "eternal"]
human.stats.charisma = ["disgusting", "ugly", "rude", "awkward", "socially inept", "unpleasant", "tolerable", "bland", "agreeable", "pleasant", "nice", "interesting", "charming", "fascinating", "seductive", "dazzling", "prophet", "cult leader", "politician"]
human.stats.perception = ["oblivious", "half-asleep", "easily distracted", "day dreamer", "aware", "alert", "perceptive", "attentive", "acute", "keen", "eagle-eyed", "clairvoyant"]
human.stats.intelligence = ["brain-dead", "dim-witted", "stupid", "ignorant", "dull", "slow", "functional", "smart", "clever", "sharp", "brilliant", "genius", "rocket scientist", "supercomputer", "AI"]
human.stats.agility = ["useless", "sloth-like", "slow", "delayed", "adequate", "dexterous", "agile", "deft", "nimble", "quick", "cat-like", "fast", "ninja", "speeding bullet", "light-speed"]
human.stats.luck = ["non-existant", "doomed", "terrible", "unfortunate", "not the best", "not an issue", "better than some", "better than most", "uncanny", "great", "charmed", "on a streak", "unstoppable", "favored by deities", "so good you can't possibly go wrong"]

global.$game.constants.body.human.formatHeight = (height)->
  global.$game.constants.body.human.height.proportionate(height, global.$game.constants.body.human.maxHeight)

global.$game.constants.body.human.formatWeight = (weight, height = @getHeight())->
  return global.$game.constants.body.human.weight.proportionate(weight, 100 * height)

if not global.$game.classes.HumanBody
  global.$game.classes.HumanBody = class HumanBody
    constructor:->
      @type = "$game.classes.HumanBody"
      this.init.apply(this, arguments)

body = global.$game.classes.HumanBody.prototype

body.init = (@owner, @info, @primaryHand = Math.floor(Math.random()*2) ? "right" : "left")->
  @concious = true
  @knownLanguages = {}
  @knownLanguages[@info.language] = 1.0
  @language = @info.language
  torso = @torso = global.$game.common.makeBodyPart "torso", [], true, false, true,
    head:global.$game.common.makeHead()
    rightShoulder:global.$game.common.makeArm("right")
    leftShoulder:global.$game.common.makeArm("left")
    rightThigh:global.$game.common.makeLeg("right")
    leftThigh:global.$game.common.makeLeg("left")
    groin:if @info.sex is "male" then global.$game.common.makePenis() else if @info.sex is "female" then global.$game.common.makeVagina() else global.$game.common.makeNeuter()
    leftChest:global.$game.common.makeBodyPart "left half of the chest", ["ribs"], true, false, false
    rightChest:global.$game.common.makeBodyPart "right half of the chest", ["ribs"], true, false, false
    stomach:global.$game.common.makeBodyPart "stomach", [], true, false, false
    back:global.$game.common.makeBodyPart "back", ["spine"], true, false, false

body.getHeight = ->
  @info.appearance.height

body.getWeight = ->
  @info.appearance.weight

body.getHeightString = ->
  global.$game.constants.body.human.formatHeight @info?.appearance?.height or 1.7

body.getWeightString = ->
  global.$game.constants.body.human.formatWeight @info?.appearance?.weight or 80, @getHeight()

body.tell = (what)->
  @owner.tell(what)

body.see = body.sees = (what)->
  @tell(what) if @concious and @canSee()

body.hear = body.hears = (what)->
  @tell(what) if @concious and @canHear()

body.feel = body.feels = (what)->
  @tell(what) if @concious and @canFeel()

body.smells = (what)->
  @tell(what) if @concious and @canSmell()

body.tastes = (what)->
  @tell(what) if @concious and @canTaste()

body.thinks = (what)->
  @tell(what) if @concious and @canThink()

body.randomPart = ->
  @torso.randomPart()

body.findPart = (name)->
  @torso.findPart(name)

body.coverageMap = ->
  @torso.coverageMap()

body.contentsMap = () ->
  @torso.contentsMap()
  
body.resolveAllContents = ->
  @contents.concat(@torso.resolveAllContents())

body.canSee = ->
  @torso.parts.head?.canSee?()

body.canHear = ->
  @torso.parts.head?.canHear?()

body.canSpeak = ->
  @torso.parts.head?.canSpeak?()
  
body.canThink = ->
  @torso.parts.head?.canThink?()

body.canSmell = ->
  @torso.parts.head?.canSmell?()
  
body.canTaste = ->
  @torso.parts.head?.canTaste?()
  
body.canFeel = ->
  @torso.canFeel?()
  
body.say = body.says = (what) ->
  return @tell "You try to speak but you cant!" if not @canSpeak()
  @tell "You say, \"" + what + "\""
  stimulus = new global.$game.classes.StimulusBuilder(what, what.location).visual(this).visual(" says, ").quoted(what).visual(".").build()
  @location.everyoneExcept(this).stimulate(stimulus)

body.contextualizeLanguage = (message, language)->
  _ = require("underscore")
  understanding = @info.knownLanguages[language] or 0.0
  return message if understanding is 1
  _(stimulus.value.split(" ")).chain().map (word)->
    return word if(Math.random() < understanding)
    _(word.split("")).chain().map (letter)->
      return letter if(Math.random() < understanding)
      if(letter.isNumeric())
        parseInt(Math.random()*10)
      else if(letter is letter.toUpperCase())
        String.fromCharCode(65 + Math.floor(Math.random() * 26))
      else
        String.fromCharCode(97 + Math.floor(Math.random() * 26))
    .join("").value()
  .join(" ").value()
  
body.contextualizeStimulus = (stimulus)->
  if stimulus.type is "visual" and not @canSee()
    ""
  else if stimulus.type is "auditory" and not @canHear()
    ""
  else if stimulus.type is "smell" and not @canSmell()
    ""
  else if stimulus.type is "taste" and not @canTaste()
    ""
  else if stimulus.type is "mental" and not @canThink()
    ""
  else if stimulus.type is "physical" and not @canFeel()
    ""
  else if stimulus.type is "auditory" and stimulus.language
    @contextualizeLanguage stimulus.value, stimulus.language
  else if stimulus.type is "visual" and typeof stimulus.value is "object"
    stimulus.value.asSeenBy?(this) or stimulus.value.name
  else
    stimulus.value

body.stimulate = (stimulus)->
  _ = require("underscore")
  @tell _(stimulus).chain().map(@contextualizeStimulus).join("").value()

body.getPart = (name)->
  @getTorso().getPart(name)

body.getHead = ->
  @getTorso().parts.head

body.getRightHand = ->
  @getTorso().parts.rightShoulder?.parts?.arm?.parts?.forearm?.parts?.hand

body.getLeftHand = ->
  @getTorso().parts.leftShoulder?.parts?.arm?.parts?.forearm?.parts?.hand

body.getRightFoot = ->
  @getTorso().parts.rightThigh?.parts?.knee?.parts?.leg?.parts?.foot

body.getLeftFoot = ->
  @getTorso().parts.leftThigh?.parts?.knee?.parts?.leg?.parts?.foot

body.getPrimaryHand = ->
  if primaryHand is "right" then @getRightHand() else @getLeftHand()

body.getSecondaryHand = ->
  if primaryHand is "right" then @getLeftHand() else @getRightHand()

body.getHand = ->
  @getPrimaryHand() or @getSecondaryHand()

body.getBothHands = ->
  [@getPrimaryHand(), @getSecondaryHand()]

body.getFreeHand = ->
  if @getPrimaryHand?.isEmpty() then @getPrimaryHand else if @getSecondaryHand()?.isEmpty() then @getSecondaryHand() else undefined

body.isOneHandEmpty = ->
  @getPrimaryHand()?.isEmpty() or @getSecondaryHand()?.isEmpty()

body.isBothHandsEmpty = ->
  @getPrimaryHand()?.isEmpty() and @getSecondaryHand()?.isEmpty()

body.holdInHands = (what)->
  q = require("q")
  return q.reject("You don't have any free hands.") if not @isOneHandEmpty()
  return q.reject("That requires both hands to hold.") if what.isTwoHanded?() and not @isBothHandsEmpty()
  firstHand = @getFreeHand()
  where = firstHand
  if(what.isTwoHanded?())
    secondHand = @getFreeHand()
    secondHand.holding = what
    where = [firstHand, secondHand]
  what.moveTo(where)
  q(where)

body.moveTo = ->
  global.$game.common.moveTo.apply(this, arguments)

body.look = ()->
  @sees @location?.asSeenBy?(this) or @location?.description or "There doesn't seem to be anything to see."

body.lookAt = (who, what) ->
  listify = require("listify")
  return @tell("You're blind.") if not @canSee()
  what = @resolve(what)
  return @tell("I don't see that here.") if not what
  return @tell("Did you mean the " + listify(_(what).pluck("name"), {finalWord:"or"})) if what?.length and what.length > 0
  @sees(if what.asSeenBy then what.asSeenBy(who) else what.description)


body.resolve = (what) ->
  _ = require("underscore")
  what = what.trim().toLowerCase()
  return this if what is "me"
  return @location if what is "here"
  contents = @resolveAllContents()
  found = _(contents).filter (item)->
    regexp.test(item?.name) or _(item?.aliases).find (alias)->
      regexp.test(alias)
  return found[0] if found and found.length is 1
  return found if found.length > 1
  groups = /^([\w-]+)\s(.*)$/i.exec what
  return undefined if not groups
  ordinal = require("ordinal")
  position = ordinal(groups[1])
  rest = groups[2]
  regexp = new RegExp("^(.*)\b(" + rest + ")(.*)$", "i")
  found = _(contents).filter (item)->
    regexp.test(item?.name or "") or _(item?.aliases or []).find (alias)->
      regexp.test(alias)
  return found[position-1] if found.length > 0 and position > 0 and found.length > position-1
  return undefined if found.length is 0
  found


body.resolveAllContents = ->
  @body.resolveAllContents().concat(@location.contents)

body.getCommands = ->
  _ = require("underscore")
  commands = [
    {
      name:"l~ook"
      tests:[
        regexp:/l(ook)?$/i
      ]
      description:"Describes the room you're presently in."
      func:@look
      source:this
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
      func:@lookAt
      source:this
    }
  ]
  commands = commands.concat(@location?.getCommands?(this)) if @location?.getCommands
  _(commands).flatten()
