chai = require "chai"
expect = chai.expect
chai.should()
require("../src/bodyPart")

describe "BodyPart", ->
  it "should be constructable", ->
    bodyPart = new global.$game.classes.BodyPart("Test body part", [], true, true, true)
    bodyPart.condition.should.be.empty
    bodyPart.contents.should.be.empty

  it "should compute it's own coverage map", ->
    bodyPart = new global.$game.classes.BodyPart "Test body part", [], true, true, true,
      testPart1: testPart1 = new global.$game.classes.BodyPart "Test body part 1", [], true, true, true
      testPart2: testPart2 = new global.$game.classes.BodyPart "Test body part 2", [], true, true, true
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
    testPart1 = testPart2 = undefined
    bodyPart = new global.$game.classes.BodyPart "Test body part", [], true, true, true,
      testPart1: testPart1 = new global.$game.classes.BodyPart "Test body part 1", [], true, true, true
      testPart2: testPart2 = new global.$game.classes.BodyPart "Test body part 2", [], true, true, true

    bodyPart.randomPart().should.not.be.undefined