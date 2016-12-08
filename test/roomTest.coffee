require('app-module-path').addPath(".")
chai = require "chai"
expect = chai.expect
chai.should()
require("../src/room")

describe "Room", ->
  it "should be constructable with a sane set of parameters", ->
    room = new global.$game.classes.Room("Name")
    room.exits.push({name:"test"})
    room.asSeenBy()

  it "should throw an error if we don't provide a name", ->
    x = ->
      new global.$game.classes.Room()
    x.should.throw()

  it "should contain what we put into it", ->
    room = new global.$game.classes.Room("Name")
    room.contents = [{a:1}]
    room.everyone().contents.should.not.be.empty
    room.everyoneExcept(room.contents[0]).contents.should.be.empty

  it "should have some commands when exits are present", ->
    room1 = new global.$game.classes.Room("Name")
    room2 = new global.$game.classes.Room("Name")
    exit1 = new global.$game.classes.RoomExit("north", "north", "%N leaves.", "%N arrives.", ["n", "north"], room1, room2)
    new global.$game.classes.RoomExit("south", "south", "%N leaves.", "%N arrives.", ["s", "south"], room2, room1)
    room1.getCommands().should.not.be.empty
    exit1.accept
      tell:(what)->
        what.should.not.be.empty
      moveTo:(what)->
        what.should.be.equal room2
      look:->

