# Contributing

We love pull requests from everyone. Here's the steps to get going with development:

###Step 1: Fork, then clone the repo:

    git clone git@github.com:your-username/malice.git

###Step 2: Set up your machine:

    nvm use 7
    npm install

###Step 3: Make sure the tests pass:

    npm test

###Step 4: Create a new Gmail account for sending mail, and create a .credentials file.
 
 Be sure to enable allow less secure apps: https://support.google.com/accounts/answer/6010255?hl=en

```json
{
  "username":"myuser@gmail.com",
  "password":"************"
}
```

'.credentials' is in the .gitignore. Please don't commit your credentials to the repo.

###Step 5: Start up the server:

    npm start &

###Step 6: Connect to your locally running machine:

    telnet localhost 5555
    
###Step 7: Create a character, log in.

At this point you should be able to start issuing commands.

###Step 8: Read our style guide.
 
 The style of coding is very unique and is constrained by a number of factors, but the good news is if you make a change to a script file in the /src directory, your changes will be loaded, live, against your running copy.
 
 This is required reading: https://github.com/TSavo/Malice/wiki/Style-guide

###Step 9: Make your change. 

Add tests for your change. Make the tests pass! 

###Step 10: Push to your fork and [submit a pull request][pr].

[pr]: https://github.com/tsavo/malice/compare/

The continuous deployment process will take over from there and give you lots of feedback.

Some things that will increase the chance that your pull request is accepted:

* Write tests.
* Write a [good commit message][commit].

[commit]: http://tbaggery.com/2008/04/19/a-note-about-git-commit-messages.html