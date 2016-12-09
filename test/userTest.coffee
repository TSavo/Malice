chai = require "chai"
spies = require('chai-spies')
chai.use spies
chai.should()
require('app-module-path').addPath(__dirname + '/../src')
require("user")

describe "User", ->
  it "should be constructable", ->
    user = new global.$game.classes.User()