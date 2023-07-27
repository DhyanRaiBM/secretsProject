const express = require("express");
const ejs = require("ejs");
const app = express();
const session = require('express-session');
const { mongoConnect, User } = require("./database");
const passport = require("passport");
const { initializingPassport, ensureAuthenticated } = require('./passportconfig');

//? Middleware
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());

//?mongodb connection
mongoConnect();
initializingPassport(passport);

async function start() {
  //- This is the home Route :
  app.get("/", (req, res) => {
    res.render("home");
  });

  //- This is the login Route :
  app.get("/login", (req, res) => {
    res.render("login");
  });

  app.post("/login", passport.authenticate('local', {
    successRedirect: '/secrets',
    failureRedirect: '/login',
  }));
  //- This is the Register Route :
  app.get("/register", (req, res) => {
    res.render("register");
  });

  app.post("/register", async (req, res) => {
    const { username, password } = req.body;
    try {
      const user = new User({ username, password });
      await user.save();
      res.redirect('/login');
    } catch (err) {
      console.error(err);
      res.status(500).send('Error registering user.');
    }
  });
  //- This is the Secrets Route :
  app.get('/secrets', async (req, res) => {
    const usersWithSecret = await User.find({ secret: { $ne: null } });
    res.render('secrets', { usersWithSecret: usersWithSecret });

  });

  //- This is the logout Route :
  app.get("/logout", (req, res) => {
    // Log out the user
    req.logout(() => { });
    // Redirect the user to the home page
    res.redirect("/");
  });
  //-These are the google routes:
  app.get('/auth/google', passport.authenticate('google', {
    scope: ['profile', 'email']
  }));

  app.get('/auth/google/secrets', passport.authenticate('google', {
    successRedirect: '/secrets',
    failureRedirect: '/login'
  }));

  //-These are the facebook routes:
  app.get('/auth/facebook', passport.authenticate('facebook', {
    scope: ['public_profile']
  }));

  app.get('/auth/facebook/secrets', passport.authenticate('facebook', {
    successRedirect: '/secrets',
    failureRedirect: '/login'
  }));

  //-This is the submit route:
  app.get('/submit', ensureAuthenticated, (req, res) => {
    res.render('submit');
  })

  app.post('/submit', async (req, res) => {
    const user = await User.findById(req.user._id);
    user.secret.push(req.body.secret);
    user.save();
    res.redirect('/secrets');
  })

  app.listen(3000, (req, res) => {
    console.log("Server is running on port 3000");
  });
}
start();
