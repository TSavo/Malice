###*
# Telnet server implementation.
#
# References:
#  - http://tools.ietf.org/html/rfc854
#  - http://support.microsoft.com/kb/231866
#  - http://www.iana.org/assignments/telnet-options
#
###

###*
# Modules
###

net = require('net')
assert = require('assert')
EventEmitter = require('events').EventEmitter
Stream = require('stream').Stream
util = require('util')

###*
# Constants
###

COMMANDS =
  SE: 240
  NOP: 241
  DM: 242
  BRK: 243
  IP: 244
  AO: 245
  AYT: 246
  EC: 247
  EL: 248
  GA: 249
  SB: 250
  WILL: 251
  WONT: 252
  DO: 253
  DONT: 254
  IAC: 255
COMMAND_NAMES = Object.keys(COMMANDS).reduce(((out, key) ->
  value = COMMANDS[key]
  out[value] = key.toLowerCase()
  out
), {})
OPTIONS =
  TRANSMIT_BINARY: 0
  ECHO: 1
  RECONNECT: 2
  SUPPRESS_GO_AHEAD: 3
  AMSN: 4
  STATUS: 5
  TIMING_MARK: 6
  RCTE: 7
  NAOL: 8
  NAOP: 9
  NAOCRD: 10
  NAOHTS: 11
  NAOHTD: 12
  NAOFFD: 13
  NAOVTS: 14
  NAOVTD: 15
  NAOLFD: 16
  EXTEND_ASCII: 17
  LOGOUT: 18
  BM: 19
  DET: 20
  SUPDUP: 21
  SUPDUP_OUTPUT: 22
  SEND_LOCATION: 23
  TERMINAL_TYPE: 24
  END_OF_RECORD: 25
  TUID: 26
  OUTMRK: 27
  TTYLOC: 28
  REGIME_3270: 29
  X3_PAD: 30
  NAWS: 31
  TERMINAL_SPEED: 32
  TOGGLE_FLOW_CONTROL: 33
  LINEMODE: 34
  X_DISPLAY_LOCATION: 35
  ENVIRON: 36
  AUTHENTICATION: 37
  ENCRYPT: 38
  NEW_ENVIRON: 39
  TN3270E: 40
  XAUTH: 41
  CHARSET: 42
  RSP: 43
  COM_PORT_OPTION: 44
  SLE: 45
  START_TLS: 46
  KERMIT: 47
  SEND_URL: 48
  FORWARD_X: 49
  PRAGMA_LOGON: 138
  SSPI_LOGON: 139
  PRAGMA_HEARTBEAT: 140
  EXOPL: 255
OPTION_NAMES = Object.keys(OPTIONS).reduce(((out, key) ->
  value = OPTIONS[key]
  out[value] = key.toLowerCase()
  out
), {})
SUB =
  IS: 0
  SEND: 1
  INFO: 2
  VARIABLE: 0
  VALUE: 1
  ESC: 2
  USER_VARIABLE: 3

###*
# Client
###

Client = (options) ->
  self = this
  if !(this instanceof Client)
    return new Client(arguments[0], arguments[1], arguments[2])
  Stream.call this
  if options.addListener
    options =
      input: arguments[0]
      output: arguments[1]
      server: arguments[2]
  if options.socket
    options.input = options.socket
    options.output = options.socket
  if !options.output
    options.output = options.input
    options.socket = options.input
  @input = options.input
  @output = options.output
  @socket = options.socket
  @server = options.server
  @env = {}
  @terminal = 'ansi'
  @options = options
  @options.convertLF = options.convertLF != false
  if @options.tty
    @setRawMode = @_setRawMode
    @isTTY = true
    @isRaw = false
    @columns = 80
    @rows = 24
  @open()
  return

###*
# Server
###

Server = (options, callback) ->
  self = this
  if !(this instanceof Server)
    return new Server(options, callback)
  if typeof options != 'object'
    callback = options
    options = null
  options = options or {}
  EventEmitter.call this
  @server = net.createServer((socket) ->
    client = new Client(merge({}, options,
      input: socket
      output: socket
      server: self))
    self.emit 'connection', client
    self.emit 'client', client
    # compat
    if callback
      callback client
    return
  )
  [
    'error'
    'listening'
    'close'
  ].forEach (name) ->
    self.server.on name, ->
      args = Array::slice.call(arguments)
      self.emit.apply self, [ name ].concat(args)
      return
    return
  this

###*
# Telnet
###

Telnet = (options) ->
  if options and (options.input or options.addListener)
    return new Client(arguments[0], arguments[1], arguments[2])
  new Server(arguments[0], arguments[1])

###*
# Helpers
###

merge = (target) ->
  objects = Array::slice.call(arguments, 1)
  objects.forEach (obj) ->
    Object.keys(obj).forEach (key) ->
      target[key] = obj[key]
      return
    return
  target

Client::__proto__ = Stream.prototype

Client::debug = ->
  args = Array::slice.call(arguments)
  msg = undefined
  if !@remoteAddress and @input.remoteAddress
    @remoteAddress = @input.remoteAddress
  args.push '(' + @remoteAddress + ')'
  if @listeners('debug').length
    msg = util.format.apply(util.format, args)
    @emit 'debug', msg
  if @server and @server.listeners('debug').length
    msg = util.format.apply(util.format, args)
    @server.emit 'debug', msg
  if @options.debug
    args.push '(' + @input.remoteAddress + ')'
    console.error args
  return

Client::open = ->
  self = this
  [
    'DO'
    'DONT'
    'WILL'
    'WONT'
  ].forEach (commandName) ->
    self[commandName.toLowerCase()] = {}
    Object.keys(OPTIONS).forEach (optionName) ->
      optionCode = OPTIONS[optionName]

      self[commandName.toLowerCase()][optionName.toLowerCase()] = ->
        buf = new Buffer(3)
        buf[0] = COMMANDS.IAC
        buf[1] = COMMANDS[commandName]
        buf[2] = optionCode
        self.output.write buf

      return
    return
  # compat
  [
    'DO'
    'DONT'
    'WILL'
    'WONT'
  ].forEach (commandName) ->
    cmd = commandName.toLowerCase()
    self[cmd].window_size = self[cmd].naws
    self[cmd].environment_variables = self[cmd].new_environ
    return
  @input.on 'end', ->
    self.debug 'ended'
    self.emit 'end'
    return
  @input.on 'close', ->
    self.debug 'closed'
    self.emit 'close'
    return
  @input.on 'drain', ->
    self.emit 'drain'
    return
  @input.on 'error', (err) ->
    self.debug 'error: %s', if err then err.message + '' else 'Unknown'
    self.emit 'error', err
    return
  @input.on 'data', (data) ->
    self.parse data
    return
  if @options.tty
    @do.transmit_binary()
    @do.terminal_type()
    @do.naws()
    @do.new_environ()
  return

Client::parse = (data) ->
  bufs = []
  i = 0
  l = 0
  needsPush = false
  cdata = undefined
  iacCode = undefined
  iacName = undefined
  commandCode = undefined
  commandName = undefined
  optionCode = undefined
  optionName = undefined
  cmd = undefined
  len = undefined
  if @_last
    data = Buffer.concat([
      @_last.data
      data
    ])
    i = @_last.i
    l = @_last.l
    delete @_last
  while i < data.length
    if data.length - 1 - i >= 2 and data[i] == COMMANDS.IAC and COMMAND_NAMES[data[i + 1]] and OPTION_NAMES[data[i + 2]]
      cdata = data.slice(i)
      iacCode = cdata.readUInt8(0)
      iacName = COMMAND_NAMES[iacCode]
      commandCode = cdata.readUInt8(1)
      commandName = COMMAND_NAMES[commandCode]
      optionCode = cdata.readUInt8(2)
      optionName = OPTION_NAMES[optionCode]
      cmd =
        command: commandName
        option: optionName.replace(/_/g, ' ')
        iacCode: iacCode
        iacName: iacName
        commandCode: commandCode
        commandName: commandName
        optionCode: optionCode
        optionName: optionName
        data: cdata
      # compat
      if cmd.option == 'new environ'
        cmd.option = 'environment variables'
      else if cmd.option == 'naws'
        cmd.option = 'window size'
      if @[cmd.optionName]
        try
          len = @[cmd.optionName](cmd)
        catch e
          if !(e instanceof RangeError)
            @debug 'error: %s', e.message
            @emit 'error', e
            return
          len = -1
          @debug 'Not enough data to parse.'
      else
        if cmd.commandCode == COMMANDS.SB
          len = 0
          while cdata[len] and cdata[len] != COMMANDS.SE
            len++
          if !cdata[len]
            len = 3
          else
            len++
        else
          len = 3
        cmd.data = cmd.data.slice(0, len)
        @debug 'Unknown option: %s', cmd.optionName
      if len == -1
        @debug 'Waiting for more data.'
        @debug iacName, commandName, optionName, cmd.values or len
        @_last =
          data: data
          i: i
          l: l
        return
      @debug iacName, commandName, optionName, cmd.values or len
      @emit 'command', cmd
      needsPush = true
      l = i + len
      i += len - 1
    else
      if data[i] == COMMANDS.IAC and data.length - 1 - i < 2
        @debug 'Waiting for more data.'
        @_last =
          data: data.slice(i)
          i: 0
          l: 0
        if i > l
          @emit 'data', data.slice(l, i)
        return
      if needsPush or i == data.length - 1
        bufs.push data.slice(l, i + 1)
        needsPush = false
    i++
  if bufs.length
    @emit 'data', Buffer.concat(bufs)
  return

Client::echo = (cmd) ->
  if cmd.data.length < 3
    return -1
  cmd.data = cmd.data.slice(0, 3)
  @emit 'echo', cmd
  3

Client::status = (cmd) ->
  if cmd.data.length < 3
    return -1
  cmd.data = cmd.data.slice(0, 3)
  @emit 'status', cmd
  3

Client::linemode = (cmd) ->
  if cmd.data.length < 3
    return -1
  cmd.data = cmd.data.slice(0, 3)
  @emit 'linemode', cmd
  3

Client::transmit_binary = (cmd) ->
  if cmd.data.length < 3
    return -1
  cmd.data = cmd.data.slice(0, 3)
  @emit 'transmit binary', cmd
  3

Client::authentication = (cmd) ->
  if cmd.data.length < 3
    return -1
  cmd.data = cmd.data.slice(0, 3)
  @emit 'authentication', cmd
  3

Client::terminal_speed = (cmd) ->
  if cmd.data.length < 3
    return -1
  cmd.data = cmd.data.slice(0, 3)
  @emit 'terminal speed', cmd
  3

Client::remote_flow_control = (cmd) ->
  if cmd.data.length < 3
    return -1
  cmd.data = cmd.data.slice(0, 3)
  @emit 'remote flow control', cmd
  3

Client::x_display_location = (cmd) ->
  if cmd.data.length < 3
    return -1
  cmd.data = cmd.data.slice(0, 3)
  @emit 'x display location', cmd
  3

Client::suppress_go_ahead = (cmd) ->
  if cmd.data.length < 3
    return -1
  cmd.data = cmd.data.slice(0, 3)
  @emit 'suppress go ahead', cmd
  3

Client::naws = (cmd) ->
  data = cmd.data
  i = 0
  if cmd.commandCode != COMMANDS.SB
    if data.length < 3
      return -1
    cmd.data = cmd.data.slice(0, 3)
    @emit 'window size', cmd
    # compat
    @emit 'naws', cmd
    return 3
  if data.length < 9
    return -1
  iac1 = data.readUInt8(i)
  i += 1
  sb = data.readUInt8(i)
  i += 1
  naws = data.readUInt8(i)
  i += 1
  width = data.readUInt16BE(i)
  i += 2
  height = data.readUInt16BE(i)
  i += 2
  iac2 = data.readUInt8(i)
  i += 1
  se = data.readUInt8(i)
  i += 1
  assert iac1 == COMMANDS.IAC
  assert sb == COMMANDS.SB
  assert naws == OPTIONS.NAWS
  assert iac2 == COMMANDS.IAC
  assert se == COMMANDS.SE
  cmd.cols = width
  cmd.columns = width
  cmd.width = width
  cmd.rows = height
  cmd.height = height
  cmd.values = [
    cmd.width
    cmd.height
  ]
  cmd.data = cmd.data.slice(0, i)
  if @options.tty
    @columns = width
    @rows = height
    @emit 'resize'
  @emit 'window size', cmd
  # compat
  @emit 'naws', cmd
  @emit 'size', width, height
  i

# compat
Client::window_size = Client::naws

Client::new_environ = (cmd) ->
  `var s`
  data = cmd.data
  i = 0
  if cmd.commandCode != COMMANDS.SB
    if data.length < 3
      return -1
    cmd.data = cmd.data.slice(0, 3)
    @emit 'environment variables', cmd
    # compat
    @emit 'new environ', cmd
    return 3
  if data.length < 10
    return -1
  iac1 = data.readUInt8(i)
  i += 1
  sb = data.readUInt8(i)
  i += 1
  newenv = data.readUInt8(i)
  i += 1
  info = data.readUInt8(i)
  i += 1
  variable = data.readUInt8(i)
  i += 1
  name = undefined
  s = i
  while i < data.length
    if data[i] == SUB.VALUE
      name = data.toString('ascii', s, i)
      i++
      break
    i++
  value = undefined
  s = i
  while i < data.length
    if data[i] == COMMANDS.IAC
      value = data.toString('ascii', s, i)
      break
    i++
  iac2 = data.readUInt8(i)
  i += 1
  se = data.readUInt8(i)
  i += 1
  assert iac1 == COMMANDS.IAC
  assert sb == COMMANDS.SB
  assert newenv == OPTIONS.NEW_ENVIRON
  assert info == SUB.INFO
  assert variable == SUB.VARIABLE or variable == SUB.USER_VARIABLE
  assert name.length > 0
  assert value.length > 0
  assert iac2 == COMMANDS.IAC
  assert se == COMMANDS.SE
  cmd.name = name
  cmd.value = value
  cmd.type = if variable == SUB.VARIABLE then 'system' else 'user'
  # Always uppercase for some reason.
  if cmd.name == 'TERM'
    cmd.value = cmd.value.toLowerCase()
    @terminal = cmd.value
    @emit 'term', cmd.value
  cmd.values = [
    cmd.name
    cmd.value
    cmd.type
  ]
  cmd.data = cmd.data.slice(0, i)
  @env[cmd.name] = cmd.value
  @emit 'environment variables', cmd
  # compat
  @emit 'new environ', cmd
  @emit 'env', cmd.name, cmd.value, cmd.type
  i

# compat
Client::environment_variables = Client::new_environ

Client::terminal_type = (cmd) ->
  data = cmd.data
  i = 0
  if cmd.commandCode != COMMANDS.SB
    if data.length < 3
      return -1
    cmd.data = cmd.data.slice(0, 3)
    @emit 'terminal type', cmd
    if cmd.commandCode == COMMANDS.WILL
      @output.write new Buffer([
        COMMANDS.IAC
        COMMANDS.SB
        OPTIONS.TERMINAL_TYPE
        SUB.SEND
        COMMANDS.IAC
        COMMANDS.SE
      ])
    return 3
  if data.length < 7
    return -1
  iac1 = data.readUInt8(i)
  i += 1
  sb = data.readUInt8(i)
  i += 1
  termtype = data.readUInt8(i)
  i += 1
  isa = data.readUInt8(i)
  i += 1
  name = undefined
  s = i
  while i < data.length
    if data[i] == COMMANDS.IAC
      name = data.toString('ascii', s, i)
      break
    i++
  iac2 = data.readUInt8(i)
  i += 1
  se = data.readUInt8(i)
  i += 1
  assert iac1 == COMMANDS.IAC
  assert sb == COMMANDS.SB
  assert termtype == OPTIONS.TERMINAL_TYPE
  assert isa == SUB.IS
  assert name.length > 0
  assert iac2 == COMMANDS.IAC
  assert se == COMMANDS.SE
  # Always uppercase for some reason.
  cmd.name = name.toLowerCase()
  cmd.values = [ cmd.name ]
  cmd.data = cmd.data.slice(0, i)
  @terminal = cmd.name
  @emit 'terminal type', cmd
  @emit 'term', cmd.name
  i

Client::_setRawMode = (mode) ->
  @isRaw = mode
  if !@writable
    return
  if mode
    @debug 'switching to raw:'
    @do.suppress_go_ahead()
    @will.suppress_go_ahead()
    @will.echo()
    @debug 'switched to raw'
  else
    @debug 'switching to cooked:'
    @dont.suppress_go_ahead()
    @wont.suppress_go_ahead()
    @wont.echo()
    @debug 'switched to cooked'
  return

Client::__defineGetter__ 'readable', ->
  @input.readable
Client::__defineGetter__ 'writable', ->
  @output.writable
Client::__defineGetter__ 'destroyed', ->
  @output.destroyed

Client::pause = ->
  @input.pause.apply @output, arguments

Client::resume = ->
  @input.resume.apply @output, arguments

Client::write = (b) ->
  if @options.convertLF
   arguments[0] = arguments[0].toString('utf8').replace(/\r?\n/g, '\r\n')
  @output.write.apply @output, arguments

Client::end = ->
  @output.end.apply @output, arguments

Client::destroy = ->
  @output.destroy.apply @output, arguments

Client::destroySoon = ->
  @output.destroySoon.apply @output, arguments

Server::__proto__ = EventEmitter.prototype
Object.keys(net.Server.prototype).forEach ((key) ->
  value = net.Server.prototype[key]
  if typeof value != 'function'
    return

  Server.prototype[key] = ->
    @server[key].apply @server, arguments

  return
), this

###*
# Expose
###

exports = Telnet
exports.Client = Client
exports.Server = Server
exports.createClient = Client
exports.createServer = Server
exports.COMMANDS = COMMANDS
exports.COMMAND_NAMES = COMMAND_NAMES
exports.OPTIONS = OPTIONS
exports.OPTION_NAMES = OPTION_NAMES
exports.SUB = SUB
module.exports = exports

# ---
# generated by js2coffee 2.1.0