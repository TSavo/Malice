chai = require "chai"
spies = require('chai-spies')
chai.use spies
expect = chai.expect
chai.should()
require('app-module-path').addPath(__dirname + '/../src')
require("body")

describe "Human Body", ->

  harnessBody = ->
    new global.$game.classes.HumanBody({}, {language:"English"})

  it "should be constructable", ->
    harnessBody().should.not.be.undefined

  it "should tell it's owner what it's told", ->
    owner =
      tell:chai.spy ->

    body = new global.$game.classes.HumanBody owner,
      language:"English"
    body.tell "what"
    owner.tell.should.have.been.called.with "what"
