chai = require "chai"
expect = chai.expect
chai.should()
require("../src/proportionate")

describe "Proportionate", ->
  it "should index directly on a one-to-one mapping", ->
    [1, 2, 3].proportionate(0, 3).should.equal 1
    [1, 2, 3].proportionate(1, 3).should.equal 2
    [1, 2, 3].proportionate(2, 3).should.equal 2
    [1, 2, 3].proportionate(3, 3).should.equal 3
    
  it "should only index extremes when extremes are met", ->
    [1, 2, 3].proportionate(0, 6).should.equal 1
    [1, 2, 3].proportionate(1, 6).should.equal 2
    [1, 2, 3].proportionate(2, 6).should.equal 2
    [1, 2, 3].proportionate(3, 6).should.equal 2
    [1, 2, 3].proportionate(4, 6).should.equal 2
    [1, 2, 3].proportionate(5, 6).should.equal 2
    [1, 2, 3].proportionate(6, 6).should.equal 3
    
  it "should skip items when the max is small", ->
    [1,2,3,4,5,6,7,8,9,10].proportionate(0,3).should.equal 1
    [1,2,3,4,5,6,7,8,9,10].proportionate(1,3).should.equal 4
    [1,2,3,4,5,6,7,8,9,10].proportionate(2,3).should.equal 7
    [1,2,3,4,5,6,7,8,9,10].proportionate(3,3).should.equal 10