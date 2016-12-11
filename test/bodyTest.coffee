chai = require "chai"
spies = require('chai-spies')
chai.use spies
chai.should()
require('app-module-path').addPath(__dirname + '/../src')
require "base"
require("body")

describe "Human Body", ->

  harnessBody = ->
    new global.$game.classes.HumanBody
      tell:chai.spy()
    ,
      language:"English"
      appearance:
        height:1.7
        weight:80


  it "should be constructable", ->
    harnessBody().should.not.be.undefined

  it "should tell it's owner what it's told", ->
    body = harnessBody()
    body.tell "what"
    body.owner.tell.should.have.been.called.with "what"

  it "should tell it's owner what it sees, unless it's not conscious", ->
    body = harnessBody()
    body.sees "what"
    body.owner.tell.should.have.been.called.with "what"
    body.owner.tell.reset()
    body.concious = false
    body.sees "what"
    body.owner.tell.should.not.have.been.called()

  it "should tell it's owner what it hears, unless it's not conscious", ->
    body = harnessBody()
    body.hears "what"
    body.owner.tell.should.have.been.called.with "what"
    body.owner.tell.reset()
    body.concious = false
    body.hears "what"
    body.owner.tell.should.not.have.been.called()

  it "should tell it's owner what it feels, unless it's not conscious", ->
    body = harnessBody()
    body.feel "what"
    body.owner.tell.should.have.been.called.with "what"
    body.owner.tell.reset()
    body.concious = false
    body.feel "what"
    body.owner.tell.should.not.have.been.called()

  it "should tell it's owner what it smells, unless it's not conscious", ->
    body = harnessBody()
    body.smells "what"
    body.owner.tell.should.have.been.called.with "what"
    body.owner.tell.reset()
    body.concious = false
    body.smells "what"
    body.owner.tell.should.not.have.been.called()

  it "should tell it's owner what it tastes, unless it's not conscious", ->
    body = harnessBody()
    body.tastes "what"
    body.owner.tell.should.have.been.called.with "what"
    body.owner.tell.reset()
    body.concious = false
    body.tastes "what"
    body.owner.tell.should.not.have.been.called()

  it "should tell it's owner what it thinks, unless it's not conscious", ->
    body = harnessBody()
    body.thinks "what"
    body.owner.tell.should.have.been.called.with "what"
    body.owner.tell.reset()
    body.concious = false
    body.thinks "what"
    body.owner.tell.should.not.have.been.called()

  it "should know it's height and weight", ->
    body = harnessBody()
    body.getHeight().should.equal 1.7
    body.getWeight().should.equal 80
    body.getHeightString().should.equal "of average height"
    body.getWeightString().should.equal "of average weight"

  it "should produce a random body part", ->
    harnessBody().randomPart().should.not.be.undefined

  it "should find parts of it by name", ->
    body = harnessBody()
    #body.findPart("head").should.equal body.torso.parts.head
    body.findPart("left eye").should.equal body.torso.parts.head.parts.face.parts.leftEye

  it "should be able to hold something in it's hands", ->
    body = harnessBody()
    body.holdInHands
      moveTo:global.$game.common.moveTo