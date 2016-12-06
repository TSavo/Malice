chai = require "chai"
expect = chai.expect
serialize = require("../dist/serialize.js")

describe "Serialization", ->
  it "should serialize a basic graph", ->
    obj = {a:1}
    objb = serialize.serialize obj
    objc = serialize.unserialize objb
    expect(obj.a).to.equal(objc.a)