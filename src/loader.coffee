fs=require("fs")
vm = require("vm")
nodeEval = require("node-eval")
coffee = require "coffee-script"
module.exports.testLoad = (name) ->
  m = require('module')
  sandbox = vm.createContext({})
  statement = "require(\"" + name + "\")"
  try
    vm.runInContext(m.wrap(statement), sandbox)(exports, require, module, __filename, __dirname)
    return true
  catch e
    console.log e
    return false

module.exports.load = (name, callback) ->
  module.exports.loadResource((err, resource)->
    callback(nodeEval(coffee.compile(resource, bare: true)))
  )

module.exports.loadSync = (name) ->
  nodeEval(coffee.compile(module.exports.loadResourceSync(name), bare:true))

module.exports.loadResourceSync = (name) ->
  fs.readFileSync(name).toString()

module.exports.loadResource = (name, callback) ->
  fs.readFile name, (err, data)->
    callback err, data.toString()