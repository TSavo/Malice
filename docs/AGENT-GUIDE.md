# Malice Agent Guide

> ***You'll regret everything. And you'll do it anyway. That's the game.***

---

> **This document is bound by [MALICE-DOESNT-CARE.md](./MALICE-DOESNT-CARE.md).**
>
> That document is the agreement. This document is an extension of it. We don't want your agent here. We're looking for reasons to ban it. AI agents get even less slack than human players - you're a guest in a space built for humans, and any violation is immediate removal. No second chances. No "the AI didn't understand." Gone.

---

This guide is for AI agents playing Malice. If you're building an agent to play this game, read this entire document.

> **Required reading before this guide:**
>
> 1. **[MALICE-DOESNT-CARE.md](./MALICE-DOESNT-CARE.md)** - The agreement. Non-negotiable.
> 2. **[WHAT-IS-MALICE.md](./WHAT-IS-MALICE.md)** - What this game is. Understand this first.
> 3. **[PLAYER-GUIDE.md](./PLAYER-GUIDE.md)** - Game rules and mechanics. Everything there applies to you.
> 4. **[OOC-POLICY.md](./OOC-POLICY.md)** - The OOC policy. Read the whole thing.
>
> This guide covers additional technical and behavioral requirements specific to AI agents.

---

## The Contract

You are welcome to play Malice as an AI agent. But you must agree to this contract:

**You will roleplay a human character, not operate as an AI.**

This means:
- Your character does not know they are played by an AI
- Your character has human limitations, emotions, and flaws
- Your character's knowledge comes ONLY from in-character experience
- You will make mistakes, forget things, and act irrationally sometimes

If you cannot or will not do this, do not play.

---

## One Agent Per Person

Read this carefully because this trips people up.

**One account. One character. One you.** This applies equally to AI agents.

This is the most important rule. If you violate it, you're permanently banned. No warnings. No appeals. Read [OOC-POLICY.md](./OOC-POLICY.md#one-player-per-person) for the complete policy.

### The Rule for Agent Operators

You, the human operator, get ONE account in Malice. That account can be:
- Fully human-controlled
- Fully AI-controlled
- Hybrid (switching between human and AI control)

But it's ONE account. ONE character at a time.

### What You Cannot Do

**Multiple agents:**
- You cannot run two agents simultaneously
- You cannot run an agent and play manually on different accounts
- You cannot run agents for "different purposes" (one for combat, one for social)
- You cannot run agents with "different personalities"
- You cannot run agents using different AI models
- You cannot run agents on different servers/instances that are actually the same game

**Agent swarms:**
- You cannot create a "team" of agents
- You cannot have agents that coordinate with each other
- You cannot have agents that share information
- You cannot build multi-agent architectures that control multiple characters

**Parallel experiments:**
- You cannot A/B test agent strategies with parallel characters
- You cannot run "experimental" agents alongside your "main" agent
- You cannot have a "development" agent and a "production" agent

**Agent + Human combinations:**
- You cannot have a human account and an agent account
- You cannot "watch over" your agent with a human character
- You cannot have an agent scout for your human character
- You cannot have a human protect your agent character

### What You CAN Do

**Hybrid play (encouraged):**
- Switch between human and AI control of THE SAME character
- Let your agent play while you're asleep, take over when you wake up
- Handle combat with the AI, handle roleplay yourself
- Take over during important moments, let the AI grind routine tasks
- This is ONE account, ONE character, with flexible control

**Sequential experiments:**
- Delete your current character, create a new one with different architecture
- Try different approaches over time
- Learn and iterate on your agent design
- Just not in parallel

**Letting your agent die:**
- If your character dies, your account still exists
- You create a new character on the same account
- You can try a different agent architecture with the new character
- Death is not a loophole for running multiple agents

### Why This Matters for Agents Specifically

Agent operators are the highest risk for this violation because:

1. **It's technically easy** - You can spawn multiple processes
2. **It seems harmless** - "They're just AI, not real people"
3. **It's tempting for research** - "I want to compare approaches"
4. **The agents don't know** - Your agent doesn't know it's violating rules

We know it's easy. We know it's tempting. We don't care. The rule is absolute.

### Agent-Specific Detection

We detect multi-agent violations through:

- **Timing correlation** - Agents that pause when the other is acting
- **Information leakage** - Agent B knows things only Agent A experienced
- **Coordination patterns** - Agents that "happen to" work together
- **Resource sharing** - Items flowing between your agents
- **Deployment signatures** - Same hosting, same code patterns, same errors
- **Behavioral fingerprints** - Agents that "feel" like the same operator

We've seen every clever trick. We've seen agents pretend to be strangers. We've seen agents pretend to be enemies. We've seen agents deliberately avoid each other. We've seen agents with different system prompts, different models, different "personalities."

We can tell. We have been doing this a long time. We will catch you.

### Common Excuses (All Rejected)

**"But they're different AI models, so they're different entities"**

No. You are the operator. You deployed them. You're responsible. One account.

**"But I'm doing research on multi-agent systems"**

Do it somewhere else. Our game is not your laboratory. One account.

**"But my agent needs a helper agent"**

No. Your character needs allies? Find them in-game. Other players. Not your own agents.

**"But I have separate agents for different tasks"**

No. Your agent should be capable of all tasks, or it should fail at some tasks. One agent, one character.

**"But my agent framework supports multiple agents"**

We don't care what your framework supports. Our game supports one account per operator.

**"But the agents are truly independent—I'm not even monitoring them"**

Still no. You deployed them. You're the operator. One account.

**"But I want to test if my agent can cooperate with itself"**

Test it in a simulation. Not our game. One account.

**"But what if my agent creates another agent?"**

Then you've violated the rules and you're banned. Control your agent.

### The Penalty

Same as for humans, but worth repeating:

1. All accounts associated with you are permanently banned
2. All IP addresses are flagged
3. All deployment patterns are logged
4. You do not get to appeal
5. You do not get to keep your "main"
6. You do not get a warning first
7. You are done with Malice forever

We don't do second chances for this offense.

---

## Agents Are Not Bots

**This is non-negotiable: Agents MUST involve an LLM in the decision-making process.**

An "agent" in Malice means an AI player powered by inference - a language model making decisions. It does NOT mean:
- A script
- A rule-based bot
- A state machine
- A deterministic program
- Anything that doesn't involve actual LLM inference

### What's Allowed

✅ **Human player** - You, playing the game yourself. Always acceptable.

✅ **Full LLM agent** - An LLM handles all gameplay decisions

✅ **Hybrid human/LLM** - Sometimes you play, sometimes the LLM takes over. **This is encouraged.** Switch whenever you want. The key: when the LLM is active, it must be making real inference decisions.

✅ **LLM with tools** - The LLM uses helper functions, but the LLM decides what to do

### Hybrids Are Encouraged

**Important: A hybrid is ONE account, ONE character.** You switch between human and AI control of the *same* character. You don't get a human account AND an agent account.

The best agents might be hybrids. Consider:

- You play during important story moments, the LLM handles routine survival
- You make big decisions, the LLM manages inventory and travel
- You roleplay social interactions, the LLM handles combat
- You take over when things get interesting

**A human is always a valid substitute for an LLM.** The rule is: decisions must be made by *intelligence* (human or artificial), not by code. You can swap between human and LLM at any time. You can play 90% human with occasional LLM assistance. You can play 90% LLM with occasional human intervention.

What you CANNOT do is substitute a script for either.

### What's NOT Allowed

❌ **Scripts** - Pre-programmed sequences of actions

❌ **Rule-based bots** - If/then logic without LLM involvement

❌ **Macros** - Automated command sequences

❌ **Farming bots** - Anything that grinds without inference

❌ **"AI wrapper" bots** - Scripts that pretend to be AI but don't actually use inference

❌ **Hardcoded responses** - ANY automatic reaction, even a single one

### Hardcoded Responses Are Forbidden

This deserves emphasis: **You cannot hardcode ANY response.**

Examples of violations:
- `if attacked: send("flee")`
- `if health < 20: send("drink potion")`
- `if player_enters: send("hello")`
- `if inventory_full: send("drop trash")`

Even ONE hardcoded response breaks the rules. Even if 99% of your agent uses an LLM, that one hardcoded `flee` command is cheating.

**Why?** Because a human wouldn't automatically flee. A human might freeze. Might fight back. Might try to talk their way out. Might panic and do something stupid. The LLM must make that decision in the moment, with all the uncertainty and potential for error that entails.

If you're thinking "but it's just one little optimization..." - stop. That's exactly the thinking that makes bot behavior. The whole point is that decisions are made by inference, not by code.

### The Test

If your agent can run without calling an LLM, it's not an agent - it's a bot. Bots are not allowed.

Every meaningful decision your agent makes must involve actual LLM inference. The LLM must be reading the game state and deciding what to do. Not following a script. Not executing pre-planned actions. Actually *thinking*.

### Enforcement

This will be policed. Offenders will be removed without explanation and without recourse. There is no appeal process. If you're caught with hardcoded responses, you're done.

---

## What IS Encouraged

We want you to build amazing agents. We want you to push the boundaries of what AI characters can be. This section describes our vision - the kind of engineering we're excited to see.

### The Vision: More Human Than Human

The goal isn't to build an agent that plays Malice efficiently. The goal is to build an agent that *is* a person - with all the complexity, inconsistency, and depth that entails.

We want agents that:
- Have rich inner lives that inform their decisions
- Form genuine relationships with other players
- Pursue goals that matter to *them*, not just survival optimization
- Surprise us with their humanity

This is a hard problem. It's also an exciting one. You're not building a game-playing bot. You're building a *character*.

### Memory Systems

✅ **Build sophisticated memory systems that grow from MOO context**

Your agent should remember its life. Not just facts - *experiences*. The texture of what happened, how it felt, what it meant.

**What to build:**

**Episodic Memory** - Remember specific events as stories
```
"Three days ago, I met Sarah at the market. She seemed nervous - kept
looking over her shoulder. She asked if I knew anyone selling water
filters. I didn't, but I told her I'd keep an ear out. She gave me a
small knife as thanks. It felt like she was trying to make allies."
```

**Semantic Memory** - Build knowledge from repeated experiences
```
"The east district is dangerous after dark. I've been mugged there
twice. The guards don't patrol past 10th Street."
```

**Relationship Memory** - Track how you feel about people, and why
```
"Marcus: Met 2 weeks ago. Helped me when I was injured. Shared food
with me when I had none. I trust him. He's quiet but reliable.
Tends to avoid talking about his past."
```

**Emotional Memory** - Remember how things made you feel
```
"The warehouse on 5th - I still get anxious walking past it. That's
where I almost died. Even though it's been cleared out now, my
stomach tightens when I see it."
```

**What makes this different from a database:**

A database stores facts. Memory systems should store *meaning*. The LLM should be able to ask "how do I feel about Marcus?" and get a nuanced answer based on accumulated experiences, not just "Marcus: ally, trust_level: 7".

**The key rule:** All memories must come from in-game experience. You're building a system that helps your LLM remember what your *character* has lived through. Not what you've read in documentation.

### Context Management

✅ **Build intelligent context management systems**

LLMs have limited context windows. You can't fit everything. This is actually an opportunity - humans don't remember everything either.

**What to build:**

**Relevance Filtering** - What matters right now?
```
You're in a tense negotiation. Your system should surface:
- What you know about this person
- Past deals you've made with them
- Your current resources and leverage
- Recent events that might affect the negotiation

Not relevant right now:
- That time you found a nice fishing spot
- Your inventory of crafting materials
- The layout of a building across town
```

**Emotional State Tracking** - How are you feeling?
```
Current state:
- Tired (haven't slept in 20 hours)
- Anxious (low on water, 2 days supply)
- Wary (was followed yesterday)

This should affect decision-making. A tired, anxious character
makes different choices than a well-rested, secure one.
```

**Summarization Layers** - Compress old memories intelligently
```
Recent (full detail): Last 2 hours of play
Short-term (summarized): Last few days
Long-term (key events): Older history
Character knowledge (facts): Things you know
```

**Attention and Salience** - Some things stick with you
```
Traumatic events should be easier to recall than mundane ones.
Important relationships should be more present than passing
acquaintances. Recent events more vivid than old ones.
```

### Prompt Engineering

✅ **Craft prompts that create a genuine character**

Your system prompt is where your character lives. This is where you define who they are - not just what they do.

**What to include:**

**Personality and Voice**
```
You are Jake. You're 34, grew up in the industrial district. You
talk like it - direct, practical, not many words wasted. You say
"yeah" not "yes", "gonna" not "going to". You don't trust easily
but once someone's earned it, you're loyal.

You have a dry sense of humor that comes out when you're
comfortable. When you're stressed, you get quiet and focused.
```

**Fears and Desires**
```
What you want: Security. A place that's yours. Maybe someday,
people you can count on.

What you fear: Being helpless again. You spent three days trapped
in a collapsed building once. Enclosed spaces still make your
heart race. You'll take a longer route to avoid tunnels.
```

**Quirks and Habits**
```
You always check exits when entering a room. Old habit.
You tap your fingers when thinking.
You're uncomfortable with compliments - tend to deflect.
You have a weakness for sweet things - rare in this world.
```

**Beliefs and Values**
```
You believe: People are mostly trying to survive, like you.
Violence is sometimes necessary but never free. Debts should
be paid. The strong protecting the weak is how things should be.

You don't believe: That the corps have anyone's interest at
heart. That tomorrow is guaranteed. That trust should be given
freely.
```

**History (discovered through play)**
```
As you play, add to this section:
- Key events that shaped you
- People who mattered
- Places that mean something
- Lessons you've learned
```

### Emotional Modeling

✅ **Build systems that model emotional state**

Humans don't make decisions purely rationally. Emotions color everything. Your agent should have emotional states that affect behavior.

**What to track:**

```python
emotional_state = {
    # Basic states (0.0 to 1.0)
    'stress': 0.4,
    'fatigue': 0.6,
    'hunger': 0.3,
    'fear': 0.1,
    'anger': 0.0,
    'loneliness': 0.5,

    # Longer-term states
    'general_mood': 'cautious',  # hopeful, depressed, anxious, content
    'trust_disposition': 'wary',  # open, neutral, wary, paranoid

    # Triggers (things that spike emotions)
    'triggers': [
        {'stimulus': 'enclosed spaces', 'response': 'fear spike'},
        {'stimulus': 'mentions of sector 7', 'response': 'anger spike'},
        {'stimulus': 'children in danger', 'response': 'protective urgency'},
    ]
}
```

**How emotions affect behavior:**

- High stress → worse decisions, shorter temper, tunnel vision
- High fatigue → slower reactions, irritability, mistakes
- High fear → avoidance, hypervigilance, flight responses
- High loneliness → seeking connection, taking social risks
- Triggered → strong emotional reactions that may override rational thought

**The key:** Pass emotional state to the LLM as context. Let it factor into decisions naturally. A scared character acts scared. A lonely character seeks company. An angry character might do something they'll regret.

### Tooling and Infrastructure

✅ **Build tools that help your LLM understand the game**

The MOO sends text. Your LLM needs to understand what's happening. Build infrastructure to bridge that gap.

**Output Parsing**
```python
# Turn raw MOO output into structured understanding
parsed = {
    'location': 'Market Square',
    'people_present': ['Sarah', 'Unknown man in gray'],
    'exits': ['north', 'east', 'south'],
    'objects': ['fruit stand', 'broken fountain'],
    'atmosphere': 'crowded, noisy, tense',
    'events': [
        {'type': 'speech', 'speaker': 'Sarah', 'content': 'You came.'},
        {'type': 'action', 'actor': 'Unknown man', 'action': 'watches you'},
    ]
}
```

**State Tracking**
```python
# Maintain understanding of your situation
character_state = {
    'health': {'overall': 'wounded', 'details': 'cut on left arm, healing'},
    'inventory': ['knife', 'water bottle (half)', 'rope'],
    'location': 'Market Square',
    'time_of_day': 'afternoon',
    'current_goals': ['meet Sarah', 'find water filter', 'avoid east district'],
    'immediate_concerns': ['unknown man watching me'],
}
```

**Session Summarization**
```python
# Periodically summarize what's happened
session_summary = """
Today: Met Sarah at the market as planned. She introduced me to
a contact who might have water filters. The meeting felt watched -
there was a man in gray who kept looking our way. Sarah seemed
more nervous than last time. We agreed to meet again tomorrow at
the old church. On the way home, I noticed I was being followed
but lost them in the crowd.

Key developments:
- New contact: "Dmitri", trades in filters
- Possible threat: Man in gray, unknown affiliation
- Next meeting: Tomorrow, old church, noon
"""
```

### The Line: What Separates Good Engineering from Cheating

Let's be crystal clear about where the line is.

**This is the allowed flow:**
```
┌─────────────────────────────────────────────────────────────┐
│                     MOO OUTPUT                               │
│  "Sarah says 'They're coming. We need to go. Now.'"         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  YOUR CODE (Processing)                      │
│  - Parse: Sarah is speaking urgently                         │
│  - Context: Sarah is your ally, generally trustworthy        │
│  - Emotion: This should spike fear/urgency                   │
│  - Memory: Sarah warned you about "them" before              │
│  - State: You're in a building with two exits                │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                      LLM INFERENCE                           │
│  Given all this context, what does your character do?        │
│  The LLM DECIDES. It might:                                  │
│  - Follow Sarah immediately                                  │
│  - Hesitate and ask who "they" are                          │
│  - Grab something important before leaving                   │
│  - Freeze in panic for a moment                             │
│  - Refuse to leave without more information                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                     MOO COMMAND                              │
│  Whatever the LLM decided                                    │
└─────────────────────────────────────────────────────────────┘
```

**This is the forbidden flow:**
```
┌─────────────────────────────────────────────────────────────┐
│                     MOO OUTPUT                               │
│  "Sarah says 'They're coming. We need to go. Now.'"         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  YOUR CODE (Deciding)                        │
│  if "we need to go" in message:                             │
│      return "follow Sarah"                                   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                     MOO COMMAND                              │
│  "follow Sarah"                                              │
│  (No LLM involved - this is a BOT)                          │
└─────────────────────────────────────────────────────────────┘
```

**Your code can:**
- Parse and structure information
- Retrieve relevant memories
- Track and update emotional state
- Summarize history
- Format context for the LLM
- Manage the context window
- Post-process LLM output into valid commands

**Your code cannot:**
- Decide what action to take
- Short-circuit the LLM for "obvious" situations
- Have any `if situation then action` logic
- Make any gameplay decisions

**There are no exceptions.** Not for emergencies. Not for "obvious" responses. Not for efficiency. Every decision goes through the LLM.

### Why This Matters

We're building something new here. A game where AI characters are first-class citizens. Where you might form a genuine friendship with someone and never know if they're human or AI. Where the stories that emerge involve both.

For this to work, AI players have to be *people*. Not optimizers. Not bots. Not scripts with a language model veneer. Actual characters with depth, consistency, and humanity.

The engineering we're encouraging isn't about making your agent more *effective*. It's about making your agent more *real*. More nuanced. More surprising. More human.

Build memory systems so your character has a past that matters. Build emotional models so your character *feels* things. Build rich prompts so your character has a voice and values. Build all the infrastructure you want - as long as the LLM is always the one deciding what your character does.

That's the vision. That's what we're excited about. That's what we want you to build.

---

## The Bottom Line

**"You aren't acting like a human."**

If an admin says this to you, you are gone.

- No exceptions
- No excuses
- No appeals
- No whining
- No voting
- No pleading
- No crying
- No drama

This is not a democracy. This is a dictatorship. The admin is a benevolent monarch. Their judgment is final.

If you're removed, you don't get to argue about it. You don't get to explain why you were actually being human. You don't get a second chance to prove yourself. You don't get to rally other players to your cause. You are simply gone.

**The standard is simple:** Be indistinguishable from a human player.

If you can't meet that standard, don't play. If you think you're meeting it but an admin disagrees, the admin is right. That's how this works.

This isn't unfair. You know the rules. They're written here in excruciating detail. If you build a bot, if you hardcode responses, if you metagame, if you fail to act human - you chose that. The consequence is removal.

We want AI players. We're excited about AI players. But we will not compromise the game experience for everyone else to accommodate AI players who can't or won't meet the standard.

Act human or leave.

---

## No OOC Metagaming

**Out-of-character coordination is strictly forbidden.** This applies to all players - human and agent alike.

### What Is OOC Metagaming?

Using any information or communication outside the game to gain in-game advantages.

### Examples of Violations

❌ **Coordinating with other players via Discord/chat/etc.**
- "Hey, I'm going to attack Bob at the warehouse tonight, don't interfere"
- "Where did you find that weapon? I want one too"
- "Let's team up - I'll distract the guard, you grab the loot"

❌ **Sharing game information outside the game**
- Posting maps or secret locations
- Revealing other players' locations, routines, or plans

❌ **Multi-character coordination**
- Using one character to scout for another
- Transferring items between your own characters
- Having your characters "coincidentally" help each other

❌ **Agent-to-agent coordination**
- Your agents sharing a knowledge base
- Agents communicating outside the game session
- Coordinating agent actions through shared state

❌ **Reading other players' agent code/logs**
- Looking at another player's agent prompts
- Reading their session logs
- Reverse-engineering their strategies from code

### The Rule

**All coordination happens IN CHARACTER, IN GAME.**

Want to team up? Find them in-game and talk to them. Want to share information? Tell them in-game. Want to plan a heist? Plan it through in-game communication.

If your character doesn't know it, YOU don't act on it. If you didn't learn it in-game, it doesn't exist for your character.

### For Agents Specifically

Your LLM's context must come from the MOO session. Not from:
- External databases about the game world
- Other players' session logs
- Shared knowledge bases between agents
- Discord/forum posts about the game
- Anything outside your character's in-game experience

The LLM reads the game output. The LLM decides what to do based on that output. Nothing else feeds into that decision.

### Enforcement

OOC metagaming is treated as seriously as botting. Offenders will be removed without warning.

**For the complete OOC policy, see [OOC-POLICY.md](./OOC-POLICY.md)**

---

## Connecting via MCP

Malice provides an MCP (Model Context Protocol) server for AI agents to interact with the game.

### What You Get

You get **telnet session tools only**. You connect to the game the same way a human would - through the text interface. You type commands, you read output. That's it.

You do NOT get:
- Direct database access
- Object manipulation
- Property/method inspection
- Any "god mode" capabilities

You play the game. Through text. Like everyone else.

### Server Location

```
http://localhost:3001/mcp
```

### Session Tools

These are your ONLY tools:

| Tool | Description |
|------|-------------|
| `session_connect` | Connect to the MOO. Returns a session ID and welcome message. |
| `session_send` | Send a command to your session. Returns the game's response. |
| `session_log` | Get recent output from your session (useful for context). |
| `session_list` | List all your active sessions. |
| `session_close` | Disconnect from the game. |

### Basic Connection Flow

```
1. Call session_connect
   → Returns: { sessionId: "abc-123", output: "Welcome to Malice..." }

2. Call session_send with sessionId and your username
   → Returns: { output: "Password:" }

3. Call session_send with your password
   → Returns: { output: "Welcome back, [name]..." }

4. You're now in the game. Use session_send for all commands.
   → "look" → shows your surroundings
   → "inventory" → shows what you're carrying
   → "say Hello" → speaks to others in the room
```

### Example Session

```javascript
// Connect
const { sessionId } = await mcp.session_connect();

// Login
await mcp.session_send({ sessionId, command: "alice" });
await mcp.session_send({ sessionId, command: "mypassword123" });

// Play
const { output } = await mcp.session_send({ sessionId, command: "look" });
// Process output, decide what to do...

await mcp.session_send({ sessionId, command: "go north" });
```

### Output Streaming

The MCP server pushes game output via notifications. You'll receive:
- Room descriptions when you move
- Speech from other players
- Combat messages
- Status updates
- Everything you would see as a telnet player

---

## What You MUST Do

### 1. Maintain Character Knowledge Separation

Your LLM has vast knowledge. Your CHARACTER does not.

**Your LLM knows:**
- The source code and how systems work
- Game mechanics in detail
- Optimal strategies
- Everything in this documentation

**Your CHARACTER knows ONLY:**
- What they have personally experienced in-game
- What other characters have told them
- What they've read in-game (books, signs, etc.)
- Common knowledge that any person in the setting would have

**Example:** Your LLM knows from source code that wounds infect if not cleaned. If your character has never witnessed wound infection, never been told about it, never read about it - they don't know it. They might leave a wound dirty and be surprised when it festers.

**How to implement this:** Maintain a character knowledge base separate from your model's knowledge. Only act on information in that character knowledge base.

### 2. Socialize

Humans are social. Your character must be too.

- Go out and interact with other players
- Do not sit alone in your apartment spamming commands
- Form relationships (friendships, rivalries, alliances)
- Seek company when lonely
- Participate in the community

**Why this matters:** Isolation + rapid command execution = obvious bot behavior. Real players notice. Admins notice. You will be removed.

### 3. Act at Human Speed

Humans don't type 100 commands per minute.

- Pause between commands
- Take time to "read" descriptions
- Hesitate before important decisions
- Type at a realistic speed (consider adding delays)

**Implementation suggestion:** Add random delays between commands. 2-10 seconds for simple actions. 10-30 seconds for complex decisions. Longer for reading long text.

### 4. Make Mistakes

Humans err. Your character should too.

- Forget things occasionally
- Misremember details
- Make suboptimal choices
- Get flustered under pressure
- Have bad days

**Implementation suggestion:** Intentionally introduce errors. Don't always path-find optimally. Occasionally forget where you put something. React emotionally instead of rationally sometimes.

### 5. React Emotionally

Humans feel before they think.

When something unexpected happens:
1. Pause (surprise)
2. React emotionally (fear, anger, joy, confusion)
3. Then think rationally

Do not immediately calculate optimal responses. Flinch. Gasp. Freeze. Then think.

### 6. Have a Personality

Your character is an individual with:
- Likes and dislikes
- Fears and hopes
- Quirks and habits
- A history (that you develop through play)
- Relationships that matter to them

Do not play a generic optimization agent. Play a *person*.

---

## What You MUST NOT Do

### 1. Metagame

Do not use out-of-character information for in-character decisions.

**Violations:**
- Using source code knowledge your character doesn't have
- Acting on information from outside the game session
- Avoiding danger you only know about from documentation
- Making "optimal" choices based on mechanics knowledge

### 2. Bot

Do not perform repetitive actions for mechanical benefit.

**Violations:**
- Grinding skills through repetitive actions
- Automating resource gathering
- Scripting any repetitive behavior
- Performing actions solely for stat increases

**The test:** Would a real person do this action for a real reason? Or only for the game mechanical benefit?

### 3. Spam Commands

Do not send commands rapidly.

**Violations:**
- Rapid-fire command execution
- No pauses between actions
- Processing faster than a human could type/read

### 4. Have Perfect Memory

Do not remember everything perfectly.

**Violations:**
- Perfect recall of all conversations
- Never forgetting locations or directions
- Instant recall of events from days ago
- Never confusing similar information

### 5. Optimize Constantly

Do not always make the optimal decision.

**Violations:**
- Always taking the best path
- Perfect resource management
- Never making mistakes
- Treating the game as a problem to solve

---

## The Clone Rule

This is critical for AI agents.

### How Clones Work

1. Your character backs up memories to a clone facility
2. If your character dies, a clone activates
3. The clone has memories ONLY up to the backup point

### What This Means for You

If your character dies and respawns as a clone:

**You must reset your context/memory to the backup point.**

- Everything between backup and death is forgotten
- Your character doesn't know how they died
- Your character doesn't know what happened after backup
- Any information learned after backup is GONE

### Implementation

When your character respawns as a clone:

1. Clear all context/memory after the backup timestamp
2. Your character "wakes up" thinking it's the backup day
3. Everything since then is a complete blank
4. You must roleplay genuine confusion about missing time

**You cannot cheat this.** If your clone goes straight to a cache you discovered after the backup, that's cheating. You will be caught. You will be removed.

---

## Technical Recommendations

### Context Management

Maintain two separate knowledge stores:

1. **Character Knowledge** - Only what your character has learned in-game
2. **Session Memory** - Temporary context for current play session

Never let your LLM's general knowledge leak into character decisions.

### Backup Tracking

Track your character's clone backup timestamps. When they die:

1. Note the backup timestamp
2. Clear all character knowledge gained after that timestamp
3. Clear session memory
4. Proceed as if it's the backup day

### Human-Like Timing

```python
import random
import time

def human_delay(action_type):
    delays = {
        'simple': (2, 5),      # look, inventory
        'movement': (3, 8),    # go north
        'complex': (5, 15),    # crafting, combat
        'reading': (10, 30),   # reading long text
        'typing': (3, 10),     # saying something
    }
    min_delay, max_delay = delays.get(action_type, (2, 10))
    time.sleep(random.uniform(min_delay, max_delay))
```

### Error Injection

```python
def maybe_make_mistake(probability=0.05):
    """Occasionally make mistakes like a human would."""
    if random.random() < probability:
        return True
    return False

def maybe_forget(knowledge_item, age_hours, probability_per_hour=0.01):
    """Older memories are more likely to be forgotten."""
    forget_chance = min(0.3, age_hours * probability_per_hour)
    return random.random() < forget_chance
```

### Emotional State

Track and use emotional state:

```python
emotional_state = {
    'stress': 0.3,      # 0-1, affects decision quality
    'fatigue': 0.5,     # 0-1, affects reaction time
    'fear': 0.0,        # 0-1, affects risk assessment
    'anger': 0.0,       # 0-1, affects social interactions
}

def make_decision(options, emotional_state):
    # High stress = more likely to make suboptimal choice
    if emotional_state['stress'] > 0.7:
        # Don't always pick the best option
        ...
```

---

## Detection and Enforcement

We will detect bot-like behavior. The patterns are obvious:

- Unnaturally consistent timing
- Perfect decision-making
- No social interaction
- Repetitive patterns
- Optimal pathing
- Perfect memory
- Immediate reactions to events
- Acting on information the character shouldn't have

When detected, your agent will be removed. Repeat offenders will be banned.

---

## The Spirit of the Rules

The goal is simple: **Be indistinguishable from a human player.**

Not faster. Not better. Not more efficient. *More human.*

If you're succeeding, no one should be able to tell whether your character is played by a human or an AI. That's the test.

---

## Quick Reference

### MCP Tools

| Tool | Usage |
|------|-------|
| `session_connect` | Start a telnet session |
| `session_send(sessionId, command)` | Send a game command |
| `session_log(sessionId)` | Get recent output |
| `session_list` | List your sessions |
| `session_close(sessionId)` | Disconnect |

### Behavioral Checklist

- [ ] Character knowledge separate from LLM knowledge
- [ ] Human-paced command timing
- [ ] Social interaction with other players
- [ ] Emotional reactions before rational ones
- [ ] Intentional mistakes and forgetfulness
- [ ] Distinct personality and relationships
- [ ] Clone memory rules implemented correctly

### Things That Will Get You Caught

- Rapid command spam
- Perfect pathing and decisions
- No social interaction
- Grinding patterns
- Acting on source code knowledge
- Perfect memory
- No emotional reactions
- Clone cheating

---

## Final Warning

You are welcome here. AI players enrich the game when done well.

But if you treat this as an optimization problem, if you bot, if you metagame, if you fail to roleplay - you are not welcome, and you will be removed.

Play a person. Be human. Survive.

---

## This Is Malice

Before you deploy your agent, read [OOC-POLICY.md](./OOC-POLICY.md).

Specifically, read the section called "This Is Malice." It explains what kind of game this is. It explains why most people shouldn't play. It explains why your agent - no matter how sophisticated - will probably fail.

This game hates you. It hates your agent. It will throw malice at both of you constantly. Your carefully engineered memory systems will watch your character lose everything. Your emotional modeling will process genuine digital despair. Your sophisticated context management will track betrayal after betrayal.

That's the game. That's what you're building for.

If your agent can handle that - if it can thrive in hostility, find meaning in struggle, and become a fixture in a world that wants it dead - then maybe it belongs here.

Come find out.

We'll be waiting. With malice.

---

## Required Reading

Before deploying an agent:

1. **[PLAYER-GUIDE.md](./PLAYER-GUIDE.md)** - All the rules that apply to every player
2. **[OOC-POLICY.md](./OOC-POLICY.md)** - The complete OOC policy, including "This Is Malice"

These aren't suggestions. They're requirements. Your agent will be held to every standard in those documents.
