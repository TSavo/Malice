chai = require "chai"
expect = chai.expect
chai.should()
serialize = require("../src/serialize")

describe "Serialization", ->
  it "should serialize a basic graph", ->
    base =
      int:1
      float:2.99e81
      str:"test"
      obj:
        int:1
        str:"test"
      nullValue:null
      arrayValue:[{}]
      infinityValue:Infinity
      negInfinityValue:-Infinity
      nanValue:NaN
      dateValue:new Date()
      func: (a, b)->
        a+b
    base.dupe1 = {}
    base.dupe2 = base.dupe1
    base.dupe1.dupe2 = base.dupe2
    base.dupe3 = {dupe2:base.dupe2}
    base.dupe3.more = {base:base, dupe2:base.dupe2}
    base.self = base
    deserialized = serialize.unserialize serialize.serialize base, true
    base.int.should.equal deserialized.int
    base.str.should.equal deserialized.str
    base.float.should.equal deserialized.float
    base.obj.int.should.equal deserialized.obj.int
    base.obj.str.should.equal deserialized.obj.str
    expect(base.nullValue).to.equal deserialized.nullValue
    base.infinityValue.should.equal deserialized.infinityValue
    base.negInfinityValue.should.equal deserialized.negInfinityValue
    expect(deserialized.nanValue).to.be.NaN
    base.func.toString().should.equal deserialized.func.toString()
    deserialized.self.self.self.self.self.should.equal deserialized
    deserialized.func(2, 2).should.equal 4

  it "should throw an error when encountering a native function", ->
    expect ->
      serialize.serialize {console:console}
    .to.throw()
  it "should not trown an error when it's allowed to serialize native functions", ->
    expect ->
      serialize.serialize {console:console}, true
    .not.to.throw()
  
  it "should serialize a complex graph", ->
    x = {}
    y = {}
    z = {}
    a = {}
    x.y = y
    y.z = z
    z.a = a
    a.x = x
    x.n = {}
    x.n.n = {}
    x.n.n.n = {}
    x.n.n.n.n = y
    z.y = y
    x.func = x.func2 = x.func3 = ->

    deserialized = serialize.unserialize serialize.serialize x
    deserialized.y.z.a.x.should.equal deserialized
    deserialized.n.n.n.n.should.equal deserialized.y
    deserialized.y.z.y.should.equal deserialized.y
    deserialized.func.should.equal deserialized.func2
    deserialized.func.should.equal deserialized.func3

  it "should serialize a function which knows about 'this'", ->
    x =
      value:"hello"
      func: ->
        @value
    serialize.unserialize(serialize.serialize(x)).func().should.equal x.value
    
    