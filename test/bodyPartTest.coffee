chai = require "chai"
expect = chai.expect
chai.should()
require("../src/bodyPart")



describe "BodyPart", ->
  harnessPart = ->
    bodyPart = global.$game.common.makeBodyPart "Test body part", [], true, true, true,
      testPart1: testPart1 = global.$game.common.makeBodyPart "Test body part 1", [], true, true, true
      testPart2: testPart2 = global.$game.common.makeBodyPart "Test body part 2", [], true, true, true
  it "should be constructable", ->
    bodyPart = harnessPart()
    bodyPart.condition.should.be.empty
    bodyPart.contents.should.be.empty

  it "should compute it's own coverage map", ->
    bodyPart = harnessPart()
    bodyPart.coverageMap()

  it "should be able to find a part", ->
    testPart1 = testPart2 = undefined
    bodyPart = new global.$game.classes.BodyPart "Test body part", [], true, true, true,
      testPart1: testPart1 = new global.$game.classes.BodyPart "Test body part 1", [], true, true, true
      testPart2: testPart2 = new global.$game.classes.BodyPart "Test body part 2", [], true, true, true
    bodyPart.findPart("Test body part 1").should.equal testPart1
    bodyPart.findPart("Test body part 2").should.equal testPart2

  it "should return a map of it's contents", ->
    testPart1 = testPart2 = undefined
    bodyPart = new global.$game.classes.BodyPart "Test body part", [], true, true, true,
      testPart1: testPart1 = new global.$game.classes.BodyPart "Test body part 1", [], true, true, true
      testPart2: testPart2 = new global.$game.classes.BodyPart "Test body part 2", [], true, true, true

    inventory1 = {}
    inventory2 = {}
    testPart1.contents.push inventory1
    testPart2.contents.push inventory2

    bodyPart.contentsMap().should.not.be.undefined

  it "should resolve all it's contents", ->
    testPart1 = testPart2 = undefined
    bodyPart = new global.$game.classes.BodyPart "Test body part", [], true, true, true,
      testPart1: testPart1 = new global.$game.classes.BodyPart "Test body part 1", [], true, true, true
      testPart2: testPart2 = new global.$game.classes.BodyPart "Test body part 2", [], true, true, true

    inventory1 = {}
    inventory2 = {}
    testPart1.contents.push inventory1
    testPart2.contents.push inventory2

    bodyPart.resolveAllContents().should.not.be.undefined

  it "should resolve all it's contents", ->
    bodyPart =  harnessPart()
    bodyPart.randomPart().should.not.be.undefined

  it "should feel", ->
    harnessPart().canFeel().should.be.true

  it "should be empty", ->
    harnessPart().isEmpty().should.be.true

describe "Human Head", ->

  harnessHead = global.$game.common.makeHead

  it "can be constructed", ->
    head = harnessHead()
    head.should.not.be.undefined

  it "can see, but only when one eye is uncovered", ->
    head = harnessHead()
    head.canSee().should.be.true

  it "can speaak, but only when the mouth is empty", ->
    harnessHead().canSpeak().should.be.true

  it "can taste, but only when it has a tongue", ->
    harnessHead().canTaste().should.be.true

  it "can hear, but only when there's not something in one of it's ears", ->
    harnessHead().canHear()

  it "can think", ->
    harnessHead().canThink()

describe "Human Arm", ->
  harnessArm = global.$game.common.makeArm
  it "can be constructed", ->
    harnessArm("left").should.not.be.undefined

describe "Human Leg", ->
  harnessLeg = global.$game.common.makeLeg
  it "can be constructed", ->
    harnessLeg("left").should.not.be.undefined

describe "Human Penis", ->
  harnessPenis = global.$game.common.makePenis
  it "can be constructed", ->
    harnessPenis().should.not.be.undefined

describe "Human Vagina", ->
  harnessVagina = global.$game.common.makeVagina
  it "can be constructed", ->
    harnessVagina().should.not.be.undefined

describe "Human Neuter", ->
  harnessNeuter = global.$game.common.makeNeuter
  it "can be constructed", ->
    harnessNeuter().should.not.be.undefined

describe "Human Ear", ->
  harnessEar = global.$game.common.makeEar
  it "can be constructed", ->
    harnessEar().should.not.be.undefined
