require("./dist/proportionate.js")

global.$game.$index = {} if not global.$game.$index
global.$game.$index.players = {} if not global.$game.$index.players
global.$game.constants = {} if not global.$game.constants
global.$game.constants.player = {} if not global.$game.constants.player

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
  @user.tell(what)

player.walkThrough = (exit) ->
  exit.accept(this)

player.getSex = ->
  @info.sex or "neuter"

player.getHeight = ->
  @info.height or 1.75

player.getWeight = ->
  @info.weight or 75

player.getHeightString = ->
  return global.$game.constants.player.formatHeight @info?.appearance?.height or 1.7

player.getWeightString = ->
  return global.$game.constants.player.formatWeight @info?.appearance?.weight or 80, @getHeight()

player.hold = (what)->
  return @tell("That's not something that can be held.") if what.cantBeHeld
  return @tell("You'll need both hands free for that.") if what.twoHanded and (@leftHand or @rightHand)
  if what.twoHanded
    @leftHand = @rightHand = what
    hands = "both hands"
  if not @rightHand
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
  return global.$driver.getInputHandler(self) or (input)->
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
  ordinal = require("./dist/ordinal.js")
  position = ordinal(groups[1])
  rest = groups[2]
  regexp = new RegExp("^(.*)\b(" + rest + ")(.*)$", "i")
  found = _(contents).filter (item)->
    regexp.test(item?.name or "") or _(item?.aliases or []).find (alias)->
      regexp.test(alias)
  return found[position-1] if found.length > 0 and position > 0 and found.length > position-1
  return undefined if found.length is 0
  found


