global.$game.common = {} if not global.$game.common
global.$game.common.charGen = {} if not global.$game.common.charGen

charGen = global.$game.common.charGen

charGen.start = (socket)->
  socket.tell("Warning: ".red + "You must complete this process without disconnecting, otherwise you will have to start over.")
  options = {"name":"Name", "birthday":"Birthday", "sex":"Sex", "ethnicity":"Ethnicity", "stats":"Height and Weight", "appearance":"Appearance", "language":"Native Language", "abort":"Abort".red}
  remaining = ["Name", "Birthday", "Sex", "Ethnicity", "Height and Weight", "Appearance", "Native Language"]
  results = {}
  makePlayerLoop = ->
    if results.name then options.name = "Name".green
    if results.birthday then options.birthday = "Birthday".green
    if results.sex then options.sex = "Sex".green
    if results.ethnicity then options.ethnicity = "Ethnicity".green
    if results.stats then options.stats = "Height and Weight".green
    if results.appearance then options.appearance = "Appearance".green
    if results.language then options.language = "Native Language".green
    progress = global.$game.common.charGen.formatProgress(results)
    prompt = "#{'Character Generation Main Menu'.bold.green}\n"
    prompt += progress if progress
    prompt += if remaining.length then "Things you still must do before you finish: #{remaining.join(', ').yellow}" else "You're all set. Select ".green + "Finish".green.bold + " to finalize your character.".green
    if remaining.length is 0 and not options.finish then options.finish = "Finish".green.bold
    socket.choice(prompt, options)
    .then (option)->
      console.log("option: " + option)
      if option is "abort" then throw new Error("Aborting...")
      if option is "finish"
        socket.tell("This is how you're character is going to start:")
        socket.tell global.$game.common.charGen.formatProgress(results)
        socket.tell "Now they may not be like that forever, but it may take a little doing to make changes after this."
        socket.tell "This is your last chance to say no and make changes.".bold.underline
        return global.$game.common.yesorno socket, "Continue with creating your character?\n"
        .then ->
          try
            global.$game.common.charGen.cloneNewPlayer(socket, results)
          catch e
            global.catch e
            setTimeout makePlayerLoop, 0
        .catch (err)->
          setTimeout makePlayerLoop, 0
      global.$game.common.charGen[option](socket)
      .then (stats) ->
        console.log("stat: " + stats)
        results[option] = stats
        remaining.remove options[option]
        setTimeout makePlayerLoop, 0
      .catch (error) ->
        global.catch(error)
        socket.tell error.message
        setTimeout makePlayerLoop, 0
    .catch (error) ->
      global.catch(error)
      socket.tell error.message
      setTimeout ->
        socket.user.handleConnection socket
  makePlayerLoop()

charGen.cloneNewPlayer = (socket, info)->
  player = new global.$game.classes.Player(info.name.alias, socket.user, info)
  socket.tell("Designing bio-specification for clone job.".cyan)
  socket.tell("Please wait...".italic)

  phrases = [
    "Checking the geans that code for histocampatibility antigens.".blue,
    "Counting and eliminating NK cells.".yellow,
    "Activating humoral immunity and stimulating antibody production.".green,
    "Checking B cell response for memory properties.".cyan
    "Injecting antigens and stimulating natural immune response.".cyan
    "Expressing maximum sensitivity though knock-in mutation to combat transgenic mutations.".red
    "Modulating tissue plasminogen activator to induce fibrinolsis.".red
    "Initiating homologous recombination on all prepared DNA sequences.".blue
    "Mapping positional effects of transitive genome inhibitors.".yellow
    "Eliminating hereditary conditions and mapping to substitute sequences.".yellow
    "Looking for dominant negatives in defected RNA protein molecules.".green
    "Permanently hibernating unwanted mutations through insertional mutagenesis.".yellow
    "Building scaffolding for cartiovascular structures.".white
    "Running Monte Carlo simulation on best drug compatibility matrix.".white
    "Slowly devouring your soul.".trap
  ]
  enders = [
    "Finished.".green
    "Process complete.".green
    "Process failed. Removing from process queue and scheduling replacement process to compensate.".yellow
    "Partial completion. Scheduling follow up check.".yellow
    "Done.".green
    "Complete.".green
    "Awaiting completion.".green
    "Task complete.".green
    "Job done.".green
    "Scheduled task finished.".green
    "Task was interrupted. Scheduling follow up check.".yellow
    "Status unknown. Rescheduling job.".red
    "System Error! Status unknown. Possible infection.".trap
  ]
  setTimeout ->
    socket.tell("Allocating resources on the cluster and scheduling clone job according to your specifications.".cyan)
    socket.tell("Please wait... this might take a minute.".italic)
    x = 2 + Math.floor(Math.random()*3)
    waitMore = ->
      if x is 0
        socket.tell("Progress: ".cyan + "Vital signs detected! ".blue + "Completing cloning process...".yellow)
        return setTimeout ->
          socket.tell("Cloning process successful! Returning control to user...".green.bold.italic)
          return socket.user.handleConnection socket
        , 3000
      x--
      setTimeout ->
        phrase = phrases[Math.floor(Math.random()*(phrases.length))]
        phrases.remove(phrase)
        socket.tell("Progress: ".cyan + phrase)
        setTimeout ->
          ender = enders[Math.floor(Math.random()*(enders.length))]
          enders.remove(ender)
          socket.tell("Progress: ".cyan + ender)
          setTimeout waitMore, 1000 + Math.floor(Math.random()*1000)
        , 1000 + Math.floor(Math.random()*1000)
      , 1000 + Math.floor(Math.random()*1000)
    waitMore()
  , 1000 + Math.floor(Math.random()*1000)

charGen.formatProgress = (progress)->
  results = ""
  moment = require("./node_modules/moment")
  if progress.name then results += "Alias: " + progress.name.alias + "\n"
  if progress.name then results += "First Name: " + progress.name.firstName + "\n"
  if progress.name then results += "Last Name: " + progress.name.lastName + "\n"
  if progress?.name?.middleName then results += "Middle Name: " + progress.name.middleName + "\n"
  if progress.sex then results += "Sex: " + progress.sex + "\n"
  if progress.ethnicity then results += "Ethnicity: " + progress.ethnicity + "\n"
  if progress.birthday then results += "Birthday: " + moment(progress.birthday).format("dddd, MMMM Do, YYYY") + "\n"
  if progress.stats then results += "Height: " + progress.stats.height + " Meters" + " (" + global.$game.constants.body.human.formatHeight(progress.stats.height) + ")" + "\n"
  if progress.stats then results += "Weight: " + progress.stats.weight + " Kilograms (#{global.$game.constants.body.human.formatWeight(progress.stats.weight, progress.stats.height)} for your height)\n"
  if progress.appearance then results += "Eyes: " + progress.appearance.eyeStyle + " " + progress.appearance.eyeColor + " eyes\n"
  if progress.appearance then results += "Hair: " + progress.appearance.hairCut + " " + progress.appearance.hairColor + " " + progress.appearance.hairStyle + "\n"
  if progress.appearance then results += "Skin: " + progress.appearance.skinStyle + " " + progress.appearance.skinColor + "\n"
  if progress.language then results += "Language: " + progress.language + "\n"
  return results.bgBlue.white

charGen.birthday = (socket) ->
  moment = require("./node_modules/moment")
  socket.tell("The City of Malice exists in " + "real-time".bold + ", " + "85 years in the future".underline + ", in the Pacific time zone.")
  socket.tell("The current game time is #{global.$game.common.gameTime().format('dddd, MMMM Do, YYYY')}. Please take that into consideration when you give your birthdate. Your character should have an appropriate birth date to reflect the game's timeline.")
  socket.question "Please enter your birthday in the format: MM/DD/YYYY. So for April 3rd, 2068, you would enter: 4/3/2068.\n", (criteria)->
    date = moment(criteria.trim(), "MM/DD/YYYY")
    return "Please enter a valid birthday." if not date.isValid()
    return "Please enter a birthday after today's date." if date.isBefore(moment())
    before = global.$game.common.gameTime()
    before = before.year(before.year()-18)
    return "Please enter a birthday making your character at least 18 years of age." if before.isBefore(date)
  .then (birthday) ->
    moment(birthday.trim(), "MM/DD/YYYY").toDate()

charGen.ethnicity = (socket) ->
  socket.choice "What is your ethnicity?",  global.$game.constants.body.human.ethnicity
  .then (choice) ->
    global.$game.constants.body.human.ethnicity[choice]

charGen.language = (socket) ->
  socket.tell "The game is in English, but your character may be a foreigner, in which case they may not speak the local language. In any case, you can always learn a new language once in the game."
  socket.choice "What is your primary language?", global.$game.constants.body.human.language
  .then (result)->
    global.$game.constants.body.human.language[result]

charGen.name = (socket)->
  alias = firstName = lastName = middleName = ""
  namePrompt = """
What is your character's most common name?
This can be their first name, last name, or a nick name that they're always called. It should be a single word.
You can also log in with this name, and be addressed by others with it by default, so make it easy to type or at least shorten.

"""
  socket.question namePrompt, (criteria) ->
    return "It must be at least three letters long." if criteria.trim().length < 3
    return "It must be a single word." if criteria.trim().indexOf(" ") > -1
    return "User names cannot contain any non alphabet characters." if not /^[a-zA-Z]*$/.test(criteria)
    _ = require("./node_modules/underscore")
    existingUsers = _(global.$game.$index.users).find (user) ->
      user.name.toLowerCase() is criteria
    existingPlayers = _(global.$game.$index.players).find (player) ->
      player.name.toLowerCase() is criteria
    if existingUsers or existingPlayers then return "That name is taken."
  .then (aliasAnswer)->
    alias = aliasAnswer
    socket.question "Ok. What is their real first name from birth?\n", (criteria) ->
      return "Please enter their first name from birth." if criteria.trim().length < 2
      return "First names cannot contain any non alphabet characters." if not /^[a-zA-Z]*$/.test(criteria)
  .then (firstNameAnswer) ->
    firstName = firstNameAnswer
    socket.question "Now please enter your last name, or the last name of the mother at birth?\n", (criteria) ->
      return "Please enter their last name from birth." if criteria.trim().length < 2
      return "Middle names cannot contain any non alphabet characters." if not /^[a-zA-Z]*$/.test(criteria)
  .then (lastNameAnswer) ->
    lastName = lastNameAnswer
    socket.question "And if they have a middle name, please enter it now, otherwise leave it blank.\n", (criteria) ->
      return "Middle names cannot contain any non alphabet characters." if criteria.trim().length > 0 and not /^[a-zA-Z]*$/.test(criteria)
  .then (middleNameAnswer) ->
    middleName = middleNameAnswer
    return {
      alias:alias.trim()
      firstName:firstName.trim()
      lastName:lastName.trim()
      middleName:middleName.trim()
    }

charGen.sex = (socket)->
  sexPrompt = """
What is your characters #{'sex'.bold}?
(We're going to keep it simple here, although we do understand sometimes the reality can be a little more complex.)
"""
  socket.choice sexPrompt, {"male":"Male", "female":"Female"}

charGen.stats = (socket) ->
  socket.tell("In The City of Malice, appearances matter.")
  socket.tell("The 'average' weight and height for people is about 1.7 meters and 75 kilograms (or about 6 foot tall and 180 pounds). Deviation from that is going to impact your play style.")
  formatHeight = global.$game.constants.body.human.formatHeight
  formatWeight = global.$game.constants.body.human.formatWeight
  console.log(formatHeight)
  askQuestion = ->
    heightPrompt = """
What is the #{'height'.bold} of your character? Please answer in meters, between 0.5 and 3.
For example, if your character was 1.8 meters (about 6 feet tall), you would type: '1.8'.\n
"""
    height = weight = 0
    socket.question heightPrompt, (criteria) ->
      return "Please enter a number between 0.5 and 3, like 1.8." if isNaN(criteria) or parseFloat(criteria) < 0.5 or parseFloat(criteria) > 3
    .then (heightInput) ->
      height = Math.floor(heightInput * 100) / 100
      heightWord = formatHeight(height)
      console.log "Ok " + heightWord
      socket.question "That would make you " + heightWord + ". And your weight in kilograms?\n", (criteria) ->
        return "Please enter a number between 15 and 300." if isNaN(parseInt(criteria)) or parseInt(criteria) < 15 or parseInt(criteria) > 300
    .then (weightInput)->
      weight = parseInt(weightInput)
      socket.yesorno "That would make you " + formatWeight(weight, height) + " for your height. Is that ok?\n"
    .then ->
      return {
        height:height
        weight:weight
      }
    .catch (err)->
      global.catch(err)
      askQuestion()
  askQuestion()

charGen.appearance = (socket) ->
  hairCut = hairStyle = hairColor = eyeColor = eyeStyle = skinStyle = undefined
  socket.choice "What would you like your #{'hair cut'.bold} to be?",  global.$game.constants.body.human.hairCut
  .then (hairCutChoice)->
    hairCut =  global.$game.constants.body.human.hairCut[hairCutChoice]
    socket.choice "And the #{'hair style'.bold} to go with your #{hairCut} hair?",  global.$game.constants.body.human.hairStyle
  .then (hairStyleChoice)->
    hairStyle = global.$game.constants.body.human.hairStyle[hairStyleChoice]
    socket.choice "And is the #{'hair color'.bold} of your #{hairCut} #{hairStyle} hair?", global.$game.constants.body.human.hairColor
  .then (hairColorChoice)->
    hairColor = global.$game.constants.body.human.hairColor[hairColorChoice]
    socket.choice "Fine. You have #{hairCut} #{hairColor} #{hairStyle} hair.\nWhat is your #{'eye color'.bold}?", global.$game.constants.body.human.eyeColor
  .then (eyeColorChoice)->
    eyeColor = global.$game.constants.body.human.eyeColor[eyeColorChoice]
    socket.choice "Ok, and the #{'eye style'.bold} of these #{eyeColor} eyes?", global.$game.constants.body.human.eyeStyle
  .then (eyeStyleChoice)->
    eyeStyle = global.$game.constants.body.human.eyeStyle[eyeStyleChoice]
    socket.choice "Perfect. You've got #{eyeColor} #{eyeStyle} eyes. Let's talk about your #{'skin'.bold}. How would you describe it?", global.$game.constants.body.human.skinStyle
  .then (skinStyleChoice)->
    skinStyle = global.$game.constants.body.human.skinStyle[skinStyleChoice]
    socket.choice "Great. And what's the #{'skin color'.bold} of your #{skinStyle}?", global.$game.constants.body.human.skinColor
  .then (skinColorChoice)->
    skinColor = global.$game.constants.body.human.skinColor[skinColorChoice]
    console.log({
      hairCut:hairCut,
      hairColor:hairColor,
      hairStyle:hairStyle,
      eyeColor:eyeColor,
      eyeStyle:eyeStyle,
      skinColor:skinColor,
      skinStyle:skinStyle
    })
    return {
      hairCut:hairCut,
      hairColor:hairColor,
      hairStyle:hairStyle,
      eyeColor:eyeColor,
      eyeStyle:eyeStyle,
      skinColor:skinColor,
      skinStyle:skinStyle
    }
