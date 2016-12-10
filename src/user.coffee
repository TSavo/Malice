require("base")

global.$game = {} if not global.$game
global.$game.classes = {} if not global.$game.classes
global.$game.$index = {} if not global.$game.$index
global.$game.$index.users = {} if not global.$game.$index.users

if not global.$game.classes.User
  global.$game.classes.User = class User
    constructor:->
      @type = "$game.classes.User"
      this.init.apply(this, arguments)

user = global.$game.classes.User.prototype

user.init = (@name, @email, password, @lastIp) ->
  throw new Error("Username already in use.") if global.$game.$index.users[@name]
  @salt = require("uuid").v4()
  global.$game.$index.users[@name] = this
  crypto = require "crypto"
  hash = crypto.createHash "sha256"
  hash.update password + @salt
  @password = hash.digest("hex")

user.moveTo = global.$game.common.moveTo

user.getSocket = ->
  global.$driver.getSocket(this)

user.tell = (what) ->
  @getSocket()?.tell(what) if typeof what is "string"

user.isConnected = ->
  console.log("Ah hell")
  !!global.$driver.getSocket(this)

user.goIC = () ->
  @commandLoop()

user.commandLoop = ->
  if not @isConnected() then return console.log("Not connected")
  self = this
  global.$game.common.question @getSocket(), ""
  .then (input)->
    try
      @handleCommand(input)
    catch err
      console.log(err, err.stack.split("\n"))
  .then(self.commandLoop)
  .done()

user.handleCommand = (command)->
  self = this
  func = @matchCommand(command)
  return @tell("I don't understand that.") if not func
  _ = require("underscore")
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

user.matchCommand = (command)->
  _ = require("underscore")
  self = this
  _(@body.getCommands(self)).find (options)->
    _(options.tests).find (test)->
      test.regexp.test command


