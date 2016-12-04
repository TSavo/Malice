if not global.$game.classes.BodyPart
  global.$game.classes.BodyPart = class BodyPart
    constructor:->
      @type="$game.classes.BodyPart"
      this.init.apply(this, arguments)

part = global.$game.classes.BodyPart.prototype

part.init = (@name, @bones, @coverable, @removable, @critical, @parts)->
  @condition = {}
  @wearing = []

part.findPart = (name)->
  return this if name == @name || @name.indexOf(name) == 0 || name.test?(@name)
  require("underscore").find @parts, (part)->
    part.findPart(name)

part.coverageMap = (map = {})->
  return map if not @coverable
  map[@name] = this
  @parts.forEach (part)->
    part.coverageMap map
  map

global.$game.common.makeBodyPart = (name, bones = [], coverable = false, removable = false, critical = false, parts={})->
  new global.$game.classes.BodyPart name, bones, coverable, removable, critical, parts

global.$game.common.makeHead = ->
  makeBodyPart = global.$game.common.makeBodyPart
  head = makeBodyPart "head", ["skull", "jaw", "teeth"], true, true, true,
    scalp:makeBodyPart "scalp", [], true, false, false
    throat:makeBodyPart "throat", ["larynx"], true, false, true
    neck:makeBodyPart "neck", ["spine"], true, false, true
    rightEar:makeBodyPart "right ear", [], true, true, false
    leftEar:makeBodyPart "left ear", [], true, true, false
    face:makeBodyPart "face", [], true, false, false,
      leftEye:makeBodyPart "left eye", [], true, true, false
      rightEye:makeBodyPart "right eye", [], true, true, false
      mouth:makeBodyPart "mouth", [], true, false, false
      nose:makeBodyPart "nose", [], true, true, false
  head.canSee = ->
    head?.leftEye?.canSee() || head?.rightEye?.canSee()
  head.canHear = ->
    head?.leftEar?.canHear() || head?.rightEar?.canHear()
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
    global.$game.common.makeBodyPart "vagina", [], false, false, false

global.$game.common.makeNeuter = ->
  makeBodyPart = global.$game.common.makeBodyPart
  makeBodyPart "groin", ["pelvis"], true, false, false

if not global.$game.classes.HumanBody
  global.$game.classes.HumanBody = class HumanBody
    constructor:->
      @type = "$game.classes.HumanBody"
      this.init.apply(this, arguments)

body = global.$game.classes.HumanBody.prototype

body.init = (@sex = "female", @primaryHand = "right")->
  @torso = global.$game.common.makeBodyPart "torso", [], true, false, true,
    head:global.$game.common.makeHead()
    rightShoulder:global.$game.common.makeArm("right")
    leftShoulder:global.$game.common.makeArm("left")
    rightThigh:global.$game.common.makeLeg("right")
    leftThigh:global.$game.common.makeLeg("left")
    groin:if @sex == "male" then global.$game.common.makePenis() else if @sex == "female" then global.$game.common.makeVagina() else global.$game.common.makeNeuter()
    leftChest:global.$game.common.makeBodyPart "left half of the chest", ["ribs"], true, false, false
    rightChest:global.$game.common.makeBodyPart "right half of the chest", ["ribs"], true, false, false
    stomach:global.$game.common.makeBodyPart "stomach", [], true, false, false
    back:global.$game.common.makeBodyPart "back", ["spine"], true, false, false

body.getTorso = ->
  @torso

body.getPart = (name)->
  @getTorso().getPart(name)

body.getHead = ->
  @getTorso().parts.head

body.getRightHand = ->
  @getTorso().parts.rightShoulder.parts.arm.parts.forearm.parts.hand

body.getLeftHand = ->
  @getTorso().parts.leftShoulder?.parts?.arm?.parts?.forearm?.parts?.hand

body.getRightFoot = ->
  @getTorso().parts.rightThigh?.parts?.knee?.parts?.leg?.parts?.foot

body.getLeftFoot = ->
  @getTorso().parts.leftThigh?.parts?.knee?.parts?.leg?.parts?.foot

body.getPrimaryHand = ->
  if primaryHand == "right" then @getRightHand() else @getLeftHand()

body.getSecondaryHand = ->
  if primaryHand == "right" then @getLeftHand() else @getRightHand()

body.getHand = ->
  @getPrimaryHand() || @getSecondaryHand()

body.getBothHands = ->
  [@getPrimaryHand(), @getSecondaryHand()]

body.getFreeHand = ->
  if @getPrimaryHand.isEmpty() then @getPrimaryHand else if @getSecondaryHand().isEmpty() then @getSecondaryHand() else undefined

body.isOneHandEmpty = ->
  @getPrimaryHand().isEmpty() || @getSecondaryHand().isEmpty()

body.isBothHandsEmpty = ->
  @getPrimaryHand().isEmpty() && @getSecondaryHand().isEmpty()

body.holdInHands = (what)->
  q = require("./node_modules/q")
  return q.reject("Your hands are full.") if not @isOneHandEmpty
  return q.reject("That requires both hands to hold.") if what.isTwoHanded?() and not @isBothHandsFree()
  firstHand = @getFreeHand()
  where = firstHand
  if(what.isTwoHanded?())
    secondHand = @getFreeHand()
    secondHand.holding = what
    where = [firstHand, secondHand]
  what.moveTo(where)
  q(where)

