
readline = require("readline")
chai = require "chai"
expect = chai.expect
chai.should()
q = require("q")

describe "Telnet", ->
  it "should create a server that can be connected to by a client", ->
    port = parseInt((Math.random() * 60000) + 1024)
    telnet = require('../src/telnet')
    serverDefer = q.defer()
    clientDefer = q.defer()
    telnet.createServer serverDefer.resolve
    .listen port
    client = require("telnet-client")
    connection = new client()
    connection.on "connect", clientDefer.resolve
    connection.connect({
      host:"localhost",
      port:port
      shellPrompt:""
      loginPrompt:""
      stripShellPrompt:false
      debug:true
    })
    q.allSettled([serverDefer, clientDefer])
  .timeout 5000    


