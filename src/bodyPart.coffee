global.$game = {} if not global.$game
global.$game.constants = {} if not global.$game.constants
global.$game.constants.body = {} if not global.$game.constants.body
global.$game.constants.body.human = {} if not global.$game.constants.body.human
global.$game.classes = {} if not global.$game.classes
global.$game.common = {} if not global.$game.common

if not global.$game.classes.BodyPart
  global.$game.classes.BodyPart = class BodyPart
    constructor:->
      @type="$game.classes.BodyPart"
      this.init.apply(this, arguments)

part = global.$game.classes.BodyPart.prototype

part.init = (@name, @bones, @coverable, @removable, @critical, @parts = {})->
  throw new Error("Body parts must have names.") if not @name
  @condition = {}
  @contents = []

part.findPart = (name)->
  return this if name is @name or @name.indexOf(name) is 0 or name.test?(@name)
  _ = require("underscore")
  _(@parts).find (part)->
    part.findPart(name)

part.coverageMap = (map = {})->
  return map if not @coverable
  _ = require("underscore")
  map[@name] = this
  _(@parts).map (part)->
    part.coverageMap map
  map

part.contentsMap = (map = {})->
  if(this.contents?.length)
    map[this] = this.contents
  _ = require("underscore")
  _(@parts).map (part)->
    part.contentsMap(map)
  map

part.resolveAllContents = ->
  _ = require("underscore")
  _(this.contentsMap()).chain().pluck().flatten().value()

part.randomPart = ->
  return this if not Object.keys(@parts).length
  keys = Object.keys(@parts)
  @parts[keys[keys.length * Math.random() << 0]]

part.canFeel = ->
  true

part.isEmpty = ->
  @contents.length is 0

global.$game.common.makeBodyPart = (name, bones = [], coverable = false, removable = false, critical = false, parts={})->
  new global.$game.classes.BodyPart name, bones, coverable, removable, critical, parts

global.$game.common.makeHead = ->
  makeBodyPart = global.$game.common.makeBodyPart
  head = makeBodyPart "head", ["skull", "jaw", "teeth"], true, true, true,
    scalp:makeBodyPart "scalp", [], true, false, false
    neck:makeBodyPart "neck", ["spine"], true, false, true,
      throat:makeBodyPart "throat", ["larynx"], true, false, true
    rightEar:makeBodyPart "right ear", [], true, true, false
    leftEar:makeBodyPart "left ear", [], true, true, false
    face:makeBodyPart "face", [], true, false, false,
      leftEye:global.$game.common.makeEye("left")
      rightEye:global.$game.common.makeEye("right")
      leftEar:global.$game.common.makeEar("left")
      rightEar:global.$game.common.makeEar("right")
      mouth:makeBodyPart "mouth", [], true, false, false,
        tongue:makeBodyPart "tongue", [], true, true, false
      nose:makeBodyPart "nose", [], true, true, false

  head.parts.face.parts.mouth.parts.tongue.canSpeak = ->
    true
  head.parts.face.parts.mouth.parts.tongue.canTaste = ->
    true
  head.canSee = ->
    head.parts.face?.parts?.leftEye?.canSee?() or head.parts?.face?.parts?.rightEye?.canSee?()
  head.canHear = ->
    head.parts.face?.parts?.leftEar?.canHear?() or head.parts.face?.rightEar?.canHear?()
  head.canThink = ->
    true
  head.canTaste = ->
    head.parts.face?.parts?.mouth?.parts?.tongue?.canTaste?()
  head.canSpeak = ->
    head.parts.face?.parts?.mouth?.isEmpty?() and head.parts.face?.parts?.mouth?.parts?.tongue?.canSpeak?()
  head

global.$game.common.makeArm = (leftOrRight)->
  makeBodyPart = global.$game.common.makeBodyPart
  makeBodyPart leftOrRight + " shoulder", ["clavical", "scapula"], true, false, false,
    arm:makeBodyPart leftOrRight + " arm", ["humerus"], true, true, false,
      forearm:makeBodyPart leftOrRight + " forearm", ["radius", "ulna"], true, true, false,
        hand:makeBodyPart leftOrRight + " hand", ["wrist"], true, true, false,
          thumb:makeBodyPart leftOrRight + " thumb", ["metacarpals", "phalanges"], true, true, false
          index:makeBodyPart leftOrRight + " index finger", ["metacarpals", "phalanges"], true, true, false
          middle:makeBodyPart leftOrRight + " middle finger", ["metacarpals", "phalanges"], true, true, false
          ring:makeBodyPart leftOrRight + " ring finger", ["metacarpals", "phalanges"], true, true, false
          pinky:makeBodyPart leftOrRight + " pinky finger", ["metacarpals", "phalanges"], true, true, false

global.$game.common.makeLeg = (leftOrRight)->
  makeBodyPart = global.$game.common.makeBodyPart
  makeBodyPart leftOrRight + " thigh", ["femur"], true, true, false,
    knee:makeBodyPart leftOrRight + " knee", ["knee cap"], true, true, false,
      leg:makeBodyPart leftOrRight + " leg", ["tibia", "fibula"], true, true, false,
        foot:makeBodyPart leftOrRight + " foot", ["metatarsus", "metatarsal"], true, true, false

global.$game.common.makePenis = ->
  makeBodyPart = global.$game.common.makeBodyPart
  makeBodyPart "groin", ["pelvis"], true, false, false,
    penis:makeBodyPart "penis", [], false, true, false
    leftTestical:makeBodyPart "left testical", [], false, true, false
    rightTestical:makeBodyPart "right testical", [], false, true, false

global.$game.common.makeVagina = ->
  makeBodyPart = global.$game.common.makeBodyPart
  makeBodyPart "groin", ["pelvis"], true, false, false,
    vagina:global.$game.common.makeBodyPart "vagina", [], false, false, false

global.$game.common.makeNeuter = ->
  makeBodyPart = global.$game.common.makeBodyPart
  makeBodyPart "groin", ["pelvis"], true, false, false

global.$game.common.makeEye = (leftOrRight) ->
  makeBodyPart = global.$game.common.makeBodyPart
  eye = makeBodyPart leftOrRight + " eye", [], true, true, false
  eye.canSee = ->
    not Object.keys(eye.condition).length
  eye

global.$game.common.makeEar = (leftOrRight) ->
  makeBodyPart = global.$game.common.makeBodyPart
  ear = makeBodyPart leftOrRight + " ear", [], true, true, false
  ear.canHear = ->
    not ear.contents.length
  ear
