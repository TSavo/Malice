"use strict"
FUNCFLAG = '_$$ND_FUNC$$_'
PROTOFLAG = '_$$ND_PROTO$$_'
PROTOTYPEFLAG = '_$$ND_PROTOTYPE$$_'
CIRCULARFLAG = '_$$ND_CC$$_'
DATEFLAG = '_$$ND_DATE$$_'
INFINITYFLAG = '_$$ND_INFINITY$$_'
NEGINFINITYFLAG = '_$$ND_NEGINFINITY$$_'
NANFLAG = '_$$ND_NAN$$_'
UNDEFINEDFLAG = '_$$ND_UNDEFINED$$_'
NULLFLAG = '_$$ND_NULL$$_'
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
      currentObj = currentObj[p] if index
    currentObj
  catch e
    false

serializeCircular = (obj, cache) ->
  for subKey of cache
    return CIRCULARFLAG + subKey if cache.hasOwnProperty(subKey) and cache[subKey] is obj
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
  if obj is null then return NULLFLAG
  if obj is Infinity then return INFINITYFLAG
  if obj is -Infinity then return NEGINFINITYFLAG
  if Number.isNaN(obj) then return NANFLAG
  obj

unserializeWrapped = (str) ->
  if str.startsWith(DATEFLAG)
    dateNum = parseInt(str.slice(DATEFLAG.length), 10)
    new Date(dateNum)
  else if str.startsWith(INFINITYFLAG)
    Infinity
  else if str.startsWith(NEGINFINITYFLAG)
    -Infinity
  else if str.startsWith(UNDEFINEDFLAG)
    undefined
  else if str.startsWith(NULLFLAG)
    null
  else if str.startsWith(NANFLAG)
    NaN
  else
    str

serializeObject = (obj, ignoreNativeFunc, outputObj, cache, path) ->
  obj = serializeWrapped(obj)
  output = {}
  keys = Object.keys(obj)
  if not path.endsWith('prototype') and not path.endsWith('__proto__')
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

module.exports.serialize = (obj, ignoreNativeFunc = false, outputObj = {}, cache = {}, path = "$") ->
  obj = serializeWrapped(obj)
  if typeof obj is 'string' or typeof obj is 'number'
    outputObj = obj
  else if obj.constructor is Array
    outputObj = []
    cache[path] = outputObj
    obj.forEach (value, index) ->
      outputObj.push module.exports.serialize(value, ignoreNativeFunc, outputObj, cache, path + KEYPATHSEPARATOR + index)
  else
    found = serializeCircular(obj, cache)
    if found
      outputObj = found
    else
      cache[path] = obj
      outputObj = serializeObject(obj, ignoreNativeFunc, outputObj, cache, path)
      outputObj[FUNCFLAG] = serializeFunction(obj, ignoreNativeFunc) if typeof obj is 'function'
  if path is '$' then JSON.stringify(outputObj) else outputObj

module.exports.unserialize = (obj, originObj) ->
  isIndex = undefined
  obj = JSON.parse(obj) if typeof obj is 'string'
  originObj = originObj or obj
  obj = unserializeFunction(obj) if obj and obj[FUNCFLAG]
  obj = unserializeWrapped(obj) if(typeof obj is 'string')
  circularTasks = []
  for key of obj
    if obj.hasOwnProperty(key)
      destKey = if key is PROTOFLAG then '__proto__' else if key is PROTOTYPEFLAG then 'prototype' else key
      if(destKey is 'prototype' and obj[key] is UNDEFINEDFLAG)
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
    task.obj[task.destKey] = found if found
  delete obj[PROTOTYPEFLAG] if obj
  delete obj[PROTOFLAG] if obj
  obj
