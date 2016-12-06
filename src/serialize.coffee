"use strict"
FUNCFLAG = '_$$ND_FUNC$$_'
FUNCBODY = '_$$ND_FUNCBODY$$_'
PROTOFLAG = '_$$ND_PROTO$$_'
PROTOTYPEFLAG = '_$$ND_PROTOTYPE$$_'
CIRCULARFLAG = '_$$ND_CC$$_'
DATEFLAG = '_$$ND_DATE$$_'
INFINITYFLAG = '_$$ND_INFINITY$$_'
UNDEFINEDFLAG = '_$$ND_UNDEFINED$$_'
KEYPATHSEPARATOR = '_$$.$$_'
ISNATIVEFUNC = /^function\s*[^(]*\(.*\)\s*\{\s*\[native code\]\s*\}$/


if (typeof String.prototype.startsWith isnt 'function')
  String.prototype.startsWith = (str)->
    return this.slice(0, str.length) is str

if (typeof String.prototype.endsWith isnt 'function')
  String.prototype.endsWith = (str)->
    return this.slice(-str.length) is str

getKeyPath = (obj, path) ->
  try
    path = path.split(KEYPATHSEPARATOR)
    currentObj = obj
    path.forEach (p, index) ->
      if index
        currentObj = currentObj[p]
      return
    return currentObj
  catch e
    return false
  return

serializeCircular = (obj, cache) ->
  for subKey of cache
    if cache.hasOwnProperty(subKey)
      if cache[subKey] is obj
        return CIRCULARFLAG + subKey
  false

serializeFunction = (func, ignoreNativeFunc) ->
  funcStr = func.toString()
  if ISNATIVEFUNC.test(funcStr)
    if ignoreNativeFunc
      funcStr = 'function() {throw new Error("Call a native function unserialized")}'
    else
      throw new Error('Can\'t serialize a object with a native function property. Use serialize(obj, true) to ignore the error.')
  funcStr

unserializeFunction = (func, originObj) ->
  vm = require("vm")
  funcObj = vm.runInThisContext('( ' + func[FUNCFLAG] + ' )')
  delete func[FUNCFLAG]
  for key of func
    funcObj[key] = func[key]
  funcObj

serializeWrapped = (obj) ->
  if obj instanceof Date then return DATEFLAG + obj.getTime()
  if obj is undefined then return UNDEFINEDFLAG
  if obj is Infinity then return INFINITYFLAG
  return obj

unserializeWrapped = (str) ->
  if str.startsWith(DATEFLAG)
    dateNum = parseInt(str.slice(DATEFLAG.length), 10)
    return new Date(dateNum)
  else if str.startsWith(INFINITYFLAG)
    return Infinity
  else if str.startsWith(UNDEFINEDFLAG)
    return undefined
  else
    return str

serializeObject = (obj, ignoreNativeFunc, outputObj, cache, path) ->
  obj = serializeWrapped(obj)
  output = {}
  keys = Object.keys(obj)
  if !path.endsWith('prototype') and !path.endsWith('__proto__')
    keys.push 'prototype'
    keys.push '__proto__'
  keys.forEach (key) ->
    if obj.hasOwnProperty(key) or key is 'prototype' or key is '__proto__'
      destKey = if key is '__proto__' then PROTOFLAG else if key is 'prototype' then PROTOTYPEFLAG else key
      if (typeof obj[key] is 'object' or typeof obj[key] is 'function') and obj[key] isnt null
        found = serializeCircular(obj[key], cache)
        if found
          output[destKey] = found
        else
          output[destKey] = module.exports.serialize(obj[key], ignoreNativeFunc, outputObj[key], cache, path + KEYPATHSEPARATOR + key)
      else
        output[destKey] = serializeWrapped(obj[key])
  output

module.exports.serialize = (obj, ignoreNativeFunc, outputObj, cache, path) ->
  path = path or '$'
  cache = cache or {}
  outputObj = outputObj or {}
  obj = serializeWrapped(obj)
  if typeof obj is 'string' or typeof obj is 'number'
    outputObj = obj
  else if obj.constructor is Array
    outputObj = []
    cache[path] = outputObj
    obj.forEach (value, index) ->
      outputObj.push module.exports.serialize(value, ignoreNativeFunc, outputObj, cache, path + KEYPATHSEPARATOR + index)
      return
  else
    found = serializeCircular(obj, cache)
    if found
      outputObj = found
    else
      cache[path] = obj
      outputObj = serializeObject(obj, ignoreNativeFunc, outputObj, cache, path)
      if typeof obj is 'function'
        outputObj[FUNCFLAG] = serializeFunction(obj, ignoreNativeFunc)
  if path is '$' then JSON.stringify(outputObj) else outputObj

module.exports.unserialize = (obj, originObj) ->
  isIndex = undefined
  if typeof obj is 'string'
    obj = JSON.parse(obj)
  originObj = originObj or obj
  if obj && obj[FUNCFLAG]
    obj = unserializeFunction(obj)
  if(typeof obj is 'string')
    obj = unserializeWrapped(obj)
  circularTasks = []
  for key of obj
    if obj.hasOwnProperty(key)
      destKey = if key is PROTOFLAG then '__proto__' else if key is PROTOTYPEFLAG then 'prototype' else key
      if(destKey is 'prototype' && obj[key] is UNDEFINEDFLAG)
        delete obj[key]
        continue
      if typeof obj[key] is 'object' or typeof obj[key] is 'function'
        obj[destKey] = module.exports.unserialize(obj[key], originObj)
      else if typeof obj[key] is 'string'
        if obj[key].indexOf(CIRCULARFLAG) is 0
          obj[key] = obj[key].substring(CIRCULARFLAG.length)
          circularTasks.push
            obj: obj
            sourceKey: key
            destKey: destKey
        else
          obj[destKey] = unserializeWrapped(obj[key])
  circularTasks.forEach (task) ->
    found = getKeyPath(originObj, task.obj[task.sourceKey])
    if found
      task.obj[task.destKey] = found

  delete obj[PROTOTYPEFLAG]
  delete obj[PROTOFLAG]
  obj
