require("user")
global.$game.$index = {} if not global.$game.$index
global.$game.$index.users = {} if not global.$game.$index.users

global.$game.common = {} if not global.$game.common
global.$game.common.login = {} if not global.$game.common.login

global.$game.common.login.handleNewConnection = (socket) ->
  wrap = global.wordwrap
  readline = require("readline")
  width = 80
  socket.on 'window size', (e) ->
    if e.command is 'sb'
      console.log 'telnet window resized to %d x %d', e.width, e.height
      width = e.width
  rl = readline.createInterface(socket, socket)
  rl.question "Can you see the " + "colors? ".rainbow, (useColor) ->
    rl.close()
    if not useColor.toLowerCase().startsWith("n")
      socket.tell = (str)->
        str.split("\n").forEach (s)->
          socket.write(wrap(width)(s) + "\n")
    else
      socket.tell = (str)->
        str.split("\n").forEach (s)->
          socket.write(wrap(width)(s.strip) + "\n")
    global.$game.common.login.showWelcomeMessage socket, ->
      global.$game.common.login.loginLoop(socket)

global.$game.common.login.loginLoop = (socket) ->
  readline = require('readline')
  _ = require("underscore")
  rl = readline.createInterface(socket, socket)
  loginPrompt = "Login> "
  passwordPrompt = "Password> "
  socket.tell("Please login with your user name, character name or email address.")
  socket.tell("If you don't have a user, please type " + "register".underline.bold + " to create one.")
  socket.tell("One account per person, please.".bold)
  socket.tell("If you require any assistance please email " + "shinmojo@gmail.com".underline.bold + ".")
  rl.question loginPrompt, (login)->
    if(login is "register")
      rl.close()
      return global.$game.common.login.register socket, ->
        global.$game.common.login.loginLoop(socket)
    rl.question(passwordPrompt, (password) ->
      rl.close()
      user = _(global.$game.$index.users).find((user) ->
        return user.name.toLowerCase() is login.toLowerCase() or user.email.toLowerCase() is login.toLowerCase()
      )
      if not user
        user = _(global.$game.$index.players).find((player) ->
          return player.name.toLowerCase() is login.toLowerCase()
        )?.user
      return setTimeout(->
        socket.tell("No such user, player, email or bad password.")
        global.$game.common.login.loginLoop(socket)
      , 0) if not user
      crypto = require "crypto"
      hash = crypto.createHash "sha256"
      hash.update password
      hash.update user.salt + ""
      if(user.password isnt hash.digest("hex"))
        setTimeout(->
          socket.tell("Unknown user or bad password.")
          global.$game.common.login.loginLoop(socket)
        , 0)
        return
      if not user.verified
        global.$game.common.question socket, "Please enter your confirmation code: ", (check) ->
          return "Invalid confirmation code." if check.toLowerCase() isnt user.confirmationCode.toLowerCase()
        , (err, answer) ->
          user.verified = true
          socket.tell("Successfully authenticated as " + login + ". Welcome back!")
          global.$driver.authenticatedUsers[user] = socket
          socket.user = user
          global.$game.common.login.handleConnection(socket)
        return
      socket.tell("Successfully authenticated as " + login + ". Welcome back!")
      global.$driver.authenticatedUsers[user] = socket
      socket.user = user
      user.lastLogin = new Date()
      global.$game.common.login.handleConnection(socket)
    )

global.$game.common.login.showWelcomeMessage = (socket, callback) ->
  loader = require("./src/loader")
  loader.loadResource "./txt/welcome.txt", (err, text)->
    socket.write(text.red + "\r\n")
    callback()

    
    
global.$game.common.login.register = (socket) ->
  global.$game.common.login.getUserName socket, (username) ->
    global.$game.common.login.getPassword socket, (password) ->
      socket.tell("Great. Just one more thing. We need a valid email in case you ever lose your password. " + "We absolutely promise on a stack of Ono-Sendai Cyberspace 7's that we will only ever use it for VERY infrequent game related communication.".bold)
      global.$game.common.question socket, "Please enter your email: ", (email) ->
        if not global.$game.common.login.validateEmail(email) then return "Invalid email address."
      , (err, validEmail) ->
        socket.tell("Perfect! We've created a user for you with the user name " + username.bold + " and sent an email to " + validEmail.bold + " with your confirmation code.\n Now we need you to login with the username you just used, and type in the confirmation code from your email. If you run into any problems, please email shinmojo@gmail.com")
        user = new global.$game.classes.User(username, validEmail, password, socket.remoteAddress)
        code = global.$game.common.login.createConfirmationCode()
        user.confirmationCode = code
        user.verified = false
        global.$game.common.login.sendEmail(username, validEmail, code)
        global.$game.common.login.loginLoop(socket)

global.$game.common.login.createConfirmationCode = ->
  x=Math.random().toString(36).substring(7).substr(0,5).toLowerCase()
  while (x.length isnt 5)
    x=Math.random().toString(36).substring(7).substr(0,5).toLowerCase()
  return x

global.$game.common.login.sendEmail = (username, email, confirmationCode) ->
  nodemailer = require('./node_modules/nodemailer')
  credentials = JSON.parse(require("loader").loadResourceSync(".credentials"))
  transporter = nodemailer.createTransport
    service: 'Gmail',
    auth:
      user: credentials.username,
      pass: credentials.password

  mailOptions =
    from: credentials.sendFrom,
    to: email,
    subject: 'Confirmation code for ' + username + " from Malice.",
    text: 'Hello, ' + username + ". Here is your confirmation code: " + confirmationCode + "\nIf you didn't request this, then we apologize and please ignore this email."

  transporter.sendMail mailOptions, (error, info) ->
    if(error)
      console.log(error)
    else
      console.log('Message sent: ' + info.response)

global.$game.common.login.getPassword = (socket, callback) ->
  global.$game.common.question socket, "Please enter your password (8 characters minimum): ", (answer) ->
    return "Password must be 8 or more characters." if answer.trim().length < 8
  , (err, password)->
    global.$game.common.question socket, "Please enter your password again: ", null, (err, again) ->
      if(again isnt password)
        socket.tell("Your passwords did not match. Try again.")
        return setTimeout global.$game.common.login.getPassword socket, callback
      callback(password)

global.$game.common.login.validateEmail = (email) ->
  re = /\S+@\S+\.\S+/
  re.test(email)

global.$game.common.login.getUserName = (socket, callback) ->
  global.$game.common.question socket, "What would you like your user name to be? ", (answer) ->
    _ = require("./node_modules/underscore")
    if(_(global.$game.$index.users).find (user) ->
      user.name.toLowerCase() is answer
    ) then return "That user name is taken."
    if(_(global.$game.$index.players).find (player) ->
      player.name.toLowerCase() is answer
    ) then return "That user name is taken."
    if answer.length < 3 then return "User names must be 3 or more characters."
    if not /^[a-zA-Z0-9]*$/.test(answer) then return "User names cannot contain any non alphanumeric characters."
    return false
  , (err, answer) ->
    callback(answer)


global.$game.common.login.handleConnection = (socket) ->
  socket.question = (prompt, criteria, callback)->
    global.$game.common.question socket, prompt, criteria, callback
  socket.choice = (prompt, options, callback)->
    global.$game.common.choice socket, prompt, options, callback
  socket.yesorno = (prompt, callback)->
    global.$game.common.yesorno socket, prompt, callback
  choices = []
  if not socket.user.body
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

global.$game.common.login.repl = (socket) ->
  repl = require("repl")
  repl.start(
    prompt: '> ',
    input: socket,
    output: socket,
    useGlobal:true
  ).on 'exit', ->
    socket.end()