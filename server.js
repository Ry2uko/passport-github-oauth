require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const GithubStrategy = require('passport-github').Strategy;
const passport = require('passport');
const session = require('express-session');

const app = express();
const port = process.env.PORT || 3000;


app.use(cors());
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    secure: false,
    maxAge: 24*60*60*1000
  }
}));
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, cb) => {
  cb(null, user.id);
});
passport.deserializeUser((id, cb) => {
  cb(null, id);
});

passport.use(
  new GithubStrategy({
    clientID: process.env.GITHUB_ID,
    clientSecret: process.env.GITHUB_SECRET,
    callbackURL: process.env.CB_URL
  }, (accessToken, refreshToken, profile, cb) => {
    cb(null, profile);
  })
);

app.get('/', isAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'views/index.html'));
});

app.get('/login', (req, res) => {
  if (req.user) {
    return res.redirect('/');
  }
  res.sendFile(path.join(__dirname, 'views/login.html'));
});

app.get('/logout', (req, res) => {
  if (req.user)
  req.logOut();
  res.redirect('/login');
});

app.get('/auth/github', passport.authenticate('github'));
app.get(
  '/auth/github/cb',
  passport.authenticate('github', { failureRedirect: '/login' }),
  (req, res) => {
    res.redirect('/'); // Success redirect
  }
);

app.use((req, res) => {
  return res.status(404).json({ error: 'Not found' });
});

function isAuth(req, res, next) {
  if (req.user) {
    next();
  } else {
    res.redirect('/login');
  }
}

app.listen(port, () => {
  console.log(`Listening to port ${port}`);
});
