require('dotenv').config();
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const { User } = require('./database');
const argon = require('argon2');

const initializingPassport = (passport) => {
    //-LOCAL STRATEGY:
    passport.use(new LocalStrategy(
        { usernameField: 'username' },
        async (username, password, done) => {
            try {
                const user = await User.findOne({ username });
                if (!user) {
                    return done(null, false, { message: 'Incorrect username.' });
                }
                const isPasswordValid = await argon.verify(user.password, password);
                if (!isPasswordValid) {
                    return done(null, false, { message: 'Incorrect password.' });
                }
                return done(null, user);
            } catch (err) {
                return done(err);
            }
        }
    ));
    //-GOOGLE STRATERGY:
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "http://localhost:3000/auth/google/secrets"
    },
        function (accessToken, refreshToken, profile, cb) {
            User.findOrCreate({ googleId: profile.id }, function (err, user) {
                return cb(err, user);
            });
        }
    ));
    //-FACEBOOK STRATEGY:
    passport.use(new FacebookStrategy({
        clientID: process.env.FACEBOOK_CLIENT_ID,
        clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
        callbackURL: "http://localhost:3000/auth/facebook/secrets"
    },
        function (accessToken, refreshToken, profile, cb) {
            console.log(profile);
            User.findOrCreate({ facebookId: profile.id }, function (err, user) {
                return cb(err, user);
            });
        }
    ));
    //-SERIALIZE USER:
    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser(async (id, done) => {
        try {
            const user = await User.findById(id);
            done(null, user);
        } catch (err) {
            done(err);
        }
    });
}
//?ENSURE AUTHENTICATION
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login')
}
module.exports = { initializingPassport, ensureAuthenticated };