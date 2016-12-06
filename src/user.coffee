global.$game.classes = {} if not global.$game.classes

if not global.$game.classes.User
  global.$game.classes.User = class User
    constructor:->
      @type = "$game.classes.User"
      this.init.apply(this, arguments)

user = global.$game.classes.User.prototype

global.$game.$index.users = {} if not global.$game.$index.users

user.init = (@name, @email, password, @lastIp) ->
  throw new Error("Username already in use.") if global.$game.$index.users[@name]
  @salt = require("./node_modules/uuid").v4()
  global.$game.$index.users[@name] = this
  crypto = require "crypto"
  hash = crypto.createHash "sha256"
  hash.update password + @salt
  @password = hash.digest("hex")

user.moveTo = global.$game.common.moveTo

user.getSocket = ->
  global.$driver.getSocket(this)

user.tell = (what) ->
  global.$driver.getSocket(this)?.tell(what) if typeof what is "string"

user.handleConnection = (socket) ->
  socket.question = (prompt, criteria, callback)->
    global.$game.common.question socket, prompt, criteria, callback
  socket.choice = (prompt, options, callback)->
    global.$game.common.choice socket, prompt, options, callback
  socket.yesorno = (prompt, callback)->
    global.$game.common.yesorno socket, prompt, callback
  choices = []
  if not socket.user.player
    prompt = """
Please make a selection from the following options:
1. Make a new character
2. Quit

"""
  else
    prompt = """
Please make a selection from the following options:
1. Enter the game as #{socket.user.player.name}
2. Quit

"""
  socket.question prompt, (answer) ->
    return "Invalid selection." if answer.trim() isnt "1" and answer.trim() isnt "2"
  , (err, answer)->
    if(answer is "2")
      return socket.end()
    if(answer is "1")
      if(socket.user.player)
        x = 3
        socket.tell("Now entering the world in 3...")
        ready = ->
          x--
          if(x is 0)
            socket.user.player.goIC(socket)
          else
            socket.tell(x + "...")
            setTimeout ready, 1000
        return setTimeout ready, 1000
      global.$game.common.charGen.start(socket)

user.isConnected = ->
  if global.$driver.getSocket(this) then return true else return false
