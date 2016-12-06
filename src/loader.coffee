fs=require("fs")
vm = require("vm")
nodeEval = require("node-eval")
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
    callback(nodeEval(resource))
  )

module.exports.loadSync = (name) ->
  nodeEval(module.exports.loadResourceSync(name))

module.exports.loadResourceSync = (name) ->
  fs.readFileSync(name).toString()

module.exports.loadResource = (name, callback) ->
  fs.readFile name, (err, data)->
    callback err, data.toString()