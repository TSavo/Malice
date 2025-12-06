chai = require "chai"
spies = require('chai-spies')
chai.use spies
chai.should()
require('app-module-path').addPath(__dirname + '/../src')
require("user")
net = require "net"
stream = require('stream').Duplex

describe "User", ->
  harnessUser = ->
    new global.$game.classes.User(global.randomString(10))
  it "should be constructable", ->
    user = harnessUser()

  it "should get the current socket from the driver and tell it what it's told", ->
    user = harnessUser()
    tell = chai.spy()
    global.$driver =
      getSocket:chai.spy ->
        tell:tell
    user.tell "what"
    global.$driver.getSocket.should.have.been.called.with user
    tell.should.have.been.called.with
    delete global.$driver

  it "should be connected if there is a socket", ->
    user = harnessUser()
    global.$driver =
      getSocket:->
        false
    user.isConnected().should.be.false
    global.$driver =
      getSocket:->
        true
    user.isConnected().should.be.true
    delete global.$driver

  it "should be able to go IC", ->
    global.$driver =
      getSocket:->
        new stream
          read:(size)->
          write:(chunk, encoding, callback)->
    harnessUser().goIC()

  it "should handle a command", ->
    user = harnessUser()
    user.createBody({language:"English"})
    user.handleCommand("look")

