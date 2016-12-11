# The City of Malice

##Overview:

The City of Malice is a TMMO game: A text-based massively multipler online game.

The code base is 100% Open Source, written in Coffeescript, and runs on NodeJS 6 or higher.

##Project Build:
| Service                         |  Status |
|---|---|
| GitLab Continous Deployment     | [![buildstatus](https://gitlab.com/TSavo/Malice/badges/master/build.svg)](https://gitlab.com/TSavo/Malice/commits/master) [![coverage report](https://gitlab.com/TSavo/Malice/badges/master/coverage.svg)](https://gitlab.com/TSavo/Malice/commits/master)                                                                                                                                                                                                                              |
| Travis CI                       | [![Build Status](https://travis-ci.org/TSavo/Malice.svg?branch=master)](https://travis-ci.org/TSavo/Malice)                                                                                                                                                                                                                                                                                                                                                                             |
| David Dependencies              | [![dependencies Status](https://david-dm.org/tsavo/malice/status.svg)](https://david-dm.org/tsavo/malice)                                                                                                                                                                                                                                                                                                                                                                               |
| Codeship                        | [![Codeship Status for TSavo/Malice](https://app.codeship.com/projects/a96ec000-9efd-0134-348a-7e4e3750070c/status?branch=master)](https://app.codeship.com/projects/189180)                                                                                                                                                                                                                                                                                                            |
| Shippable                       | [![Run Status](https://api.shippable.com/projects/584707eb3ee1d30f00c9c783/badge?branch=master)](https://app.shippable.com/projects/584707eb3ee1d30f00c9c783) [![Coverage Badge](https://api.shippable.com/projects/584707eb3ee1d30f00c9c783/coverageBadge?branch=master)](https://app.shippable.com/projects/584707eb3ee1d30f00c9c783)                                                                                                                                                 |
| Wercker                         | [![wercker status](https://app.wercker.com/status/2d07c3e55a5ce14178ca10d00653c3d0/s/master "wercker status")](https://app.wercker.com/project/byKey/2d07c3e55a5ce14178ca10d00653c3d0)                                                                                                                                                                                                                                                                                                  |
| Codacy Grade                    | [![Codacy Badge](https://api.codacy.com/project/badge/Grade/868a65096baa466b86b0412868f34c5d)](https://www.codacy.com/app/evilgenius/Malice?utm_source=github.com&utm_medium=referral&utm_content=TSavo/Malice&utm_campaign=Badge_Grade) [![Codacy Badge](https://api.codacy.com/project/badge/Coverage/868a65096baa466b86b0412868f34c5d)](https://www.codacy.com/app/evilgenius/Malice?utm_source=github.com&utm_medium=referral&utm_content=TSavo/Malice&utm_campaign=Badge_Coverage) |
| Code Climate                    | [![Code Climate](https://codeclimate.com/github/TSavo/Malice/badges/gpa.svg)](https://codeclimate.com/github/TSavo/Malice) [![Test Coverage](https://codeclimate.com/github/TSavo/Malice/badges/coverage.svg)](https://codeclimate.com/github/TSavo/Malice/coverage) [![Issue Count](https://codeclimate.com/github/TSavo/Malice/badges/issue_count.svg)](https://codeclimate.com/github/TSavo/Malice) |
| Drone.io                        | [![Build Status](https://drone.io/github.com/TSavo/Malice/status.png)](https://drone.io/github.com/TSavo/Malice/latest) |
| Semaphore CI                    | [![Build Status](https://semaphoreci.com/api/v1/kevlar/malice/branches/master/badge.svg)](https://semaphoreci.com/kevlar/malice) |
| Snap CI                         | [![Build Status](https://app.snap-ci.com/TSavo/Malice/branch/master/build_image)](https://app.snap-ci.com/TSavo/Malice/branch/master) |
| Magnum CI                       | [![Magnum CI](https://magnum-ci.com/status/231d6835620015c564d80ac62ece7374.png)](https://magnum-ci.com/projects/4715) |
| Circle CI                       | [![CircleCI](https://circleci.com/gh/TSavo/Malice.svg?style=svg)](https://circleci.com/gh/TSavo/Malice) |
| Vexor CI                        | [![Vexor status](https://ci.vexor.io/projects/e9c6aa49-1a76-4fc6-bb02-a3b04a422f3d/status.svg)](https://ci.vexor.io/ui/projects/e9c6aa49-1a76-4fc6-bb02-a3b04a422f3d/builds) |


## Design and Style

The City of Malice lives entirely in the Node VM memory space, and is accessable throught the global.$game namespace, AND serializable. Changes to object states represent changes in the game world. The entire global.$game graph is peridocally serialized to disk, including all the objects's prototypes and functions, so if the VM needs to be brought down, the latest checkpoint can be loaded on startup.

That means no object property references to native code in the global.$game graph, or references to exotic objects with large serialization graphs.

For this reason it's critical to observe the following rules:

- EVERYTHING that isn't core driver code to be loaded at startup needs to be accessible via the global.$game namespace. This includes all game world assets AND object prototypes.
- Every code with an external dependency that isn't accessible via global.$game needs to be loaded at each use. For example, each method that uses _ need to include the line `_ = require "underscore"` inside the method (not at the top)
- Code is hot-loaded off the file system when it changes without restarting the VM. Changes to prototypes's methods need to be made on existing global.$game objects.
- For this reason, class definitions need to follow the following format without exception, so that they can be executed against a new AND live environment, maintaining the live references:

```coffeescript
### Ensue our global namespace is set up correctly. ###
global.$game = {} if not global.$game
global.$game.classes = {} if not global.$game.classes

### If there's not an existing definition ###
if not global.$game.classes.MyClass
  ### Define a new class and register it in the global.$game.classes namespace ###
  global.$game.classes.MyClass = class MyClass
    constructor:->
      ### Set it's type the same as it's class name ###
      @type = "$game.classes.MyClass"
      ### Delegate construction a potentially live method reference ###
      @init.apply(this, arguments)

### Get the prototype reference ###
### Note that this could be a live object that we have existing instances of this class in memory. ###
myClass = global.$game.classes.MyClass.prototype

### (Re)Set the methods on the prototype which use 'this' (@). These could be in use by live objects in the VM. ###
### Only code after this point can be customized.###
  
myClass.init = (@prop1, @prop2, @prop3 = "default value")->
  #constructor code goes here
  
myClass.method1 = ->
  #method code goes here
  _ = require "underscore"
  ...
  
myClass.method2 = (arg1, arg2)->
  #method code goes here
  _ = require "underscore"
  ...
  
```

First, we ensure that our global namespace is set up correctly, but only if it's not done already. If it's done already, we're running in a live environment and hot-loading code.

Then, we define our new class, and set it on the global.$game.classes namespace, but only if we've not done this once before. The first time we start out, this won't be loaded, but once it's in the global.$game namespace, it will be serialized/deserialzied and not loaded from the file UNLESS the file changes.

Then, we grab the current prototype of the object in our global.$game namespace. If this is the first time, we just make this object. But subsequent times this object may have been loaded from a snapshot of the serialized global.$game graph, so you may be overwriting 'live' object's methods.

Finally we set, without concern if we've done this before, methods on our class prototype. These can use the this operator (@), and they can reference objects by name. They can use closures and do all the things you want to do. But they cannot themselves be closures, for instance over a require at the top of the file, because when they are serialized and deserialized those closure contexts are lost. That's why each method requires underscore reduntantly, because they cannot share a common reference to it though closures.

## Running your own copy of the game

`npm install && npm start`

That will start the driver listening on port 5555.
