require("src/stimulus")

global.$game = {} if not global.$game
global.$game.classes = {} if not global.$game.classes

if not global.$game.classes.Room
  global.$game.classes.Room = class Room
    constructor:->
      @type = "$game.classes.Room"
      this.init.apply(this, arguments)

room = global.$game.classes.Room.prototype

room.init = (@name, @description, @aliases = [], @contents = [], location = global.$game.$nowhere) ->
  throw new Error("Rooms must have a name.") if not @name
  @exits = []

room.asSeenBy = (who)->
  result = @name[@color or "strip"] + "\n"
  result += @description + "\n"
  _ = require("underscore")
  if @exits.length then result += "You can go " + require("listify")(_(@exits).map((exit)->
    rest = exit.name.split("")
    first = rest[0]
    rest.splice(0,1)
    rest = rest.join("")
    "(" + first.bold + ")" + rest
  )) + "."
  result

room.everyone = ->
  new global.$game.classes.StimulationGroup @contents

room.everyoneExcept = (who) ->
  _ = require("underscore")
  who = [who] if not Array.isArray who
  new global.$game.classes.StimulationGroup _(@contents).reject (other)->
    _(who).contains(other)

room.getCommands = (who)->
  _ = require("underscore")
  _(@exits).chain().map((exit)->
    exit.getCommands(who)
  ).flatten(true).value()

global.$game.$nowhere = new global.$game.classes.Room("$nowhere", "Nowhere. Literally. The place where things go when they are not in the game.") if not global.$game.$nowhere

if not global.$game.classes.RoomExit
  global.$game.classes.RoomExit = class RoomExit
    constructor:->
      @type = "$game.classes.RoomExit"
      this.init.apply(this, arguments)

exit = global.$game.classes.RoomExit.prototype

exit.init = (@name, @description, @leaveMessage, @arriveMessage, @aliases, @source, @destination)->
  throw new Error("RoomExits must have a name, description, leaveMessage, arriveMessage, aliases, source, and destination.") if not @name and @description and @direction and @leaveMessage and @arriveMessage and @aliases and @source and @destination
  @source.exits.push(this)

exit.destroy = ->
  delete global.$game.$index.roomExits[@keyName]

exit.accept = (who)->
  who.tell(@leaveMessage)
  who.moveTo(@destination)
  who.tell(@arriveMessage)
  who.look()

exit.generateTests = ->
  tests = []
  names = [@name]
  names = names.concat @aliases
  names.forEach (name)->
    nameArr = name.split("")
    regExp = "^" + nameArr.shift()
    nameArr.forEach (ch)->
      regExp += "(" + ch + ")?"
    regExp += "$"
    tests.push
      regexp:new RegExp(regExp, "i")
  tests

exit.getCommands = (who)->
  self = this
  [
    {
      name: self.name
      tests: self.generateTests()
      func:->
        self.accept(who)
      source:self
    }
  ]