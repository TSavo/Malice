chai = require "chai"
expect = chai.expect
chai.should()
require("../src/bodyPart")

describe "BodyPart", ->
  it "should be constructable", ->
    bodyPart = new global.$game.classes.BodyPart("Test body part")
    bodyPart.condition.should.be.empty
    bodyPart.contents.should.be.empty

