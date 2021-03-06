global.$game = {} if not global.$game
global.$game.common = {} if not global.$game.common

global.$game.common.move = (what, to)->
  _ = require "underscore"
  what.location = global.$game.$nowhere if not what.location
  if what.location?.contents?
    what.location.contents = _(what.location.contents).without(what)
  to.contents = [] if not to.contents
  to.contents.push what
  what.location = to

global.$game.common.moveTo = (to)->
  global.$game.common.move(this, to)

global.$game.common.question = (socket, prompt, criteria, callback)->
  deferred = require("q").defer()
  readline = require("readline")
  askQuestion = ->
    rl = readline.createInterface(socket, socket)
    rl.question prompt, (answer) ->
      rl.close()
      if answer is "@abort"
        return deferred.reject("Abort")
      result = if criteria then criteria(answer) else false
      if result
        socket.tell(result)
        return askQuestion()
      deferred.resolve(answer)
  askQuestion()
  return deferred.promise.nodeify(callback)

global.$game.common.yesorno = (socket, prompt, callback)->
  deferred = require("q").defer()
  global.$game.common.question socket, prompt, (criteria)->
    return "Please answer yes or no." if not criteria or not criteria.toLowerCase().startsWith("y") and not criteria.toLowerCase().startsWith("n")
  .then (answer) ->
    if answer.toLowerCase().startsWith("y") then deferred.resolve("yes") else deferred.reject("no")
  return deferred.promise.nodeify(callback)

global.$game.common.choice = (socket, prompt, choices, callback) ->
  deferred = require("q").defer()
  what = prompt + "\n"
  index = 1
  map = {}
  for key, value of choices
    if not choices.hasOwnProperty(key) then continue
    what += " [" + (index).toString().bold + "] " + value + "\n"
    map[index] = key
    index++
  index--
  global.$game.common.question socket, what, (answer)->
    return "Please enter a number between 1 and #{index} or " + "@abort".underline + " to abort." if isNaN(parseInt(answer)) or parseInt(answer) < 1 or parseInt(answer) > index
  , (err, finalAnswer) ->
    return deferred.reject("Abort") if err
    deferred.resolve(map[parseInt(finalAnswer)])
  return deferred.promise.nodeify(callback)

global.$game.common.gameTime = ->
  moment = require("moment")
  now = moment()
  now.year(now.year() + 85)

global.randomString = (size)->
  Array(size+1).join((Math.random().toString(36)+'00000000000000000').slice(2, 18)).slice(0, size)