const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const database = require('./database.cjs');

// Only configure Google OAuth if credentials are provided
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/auth/google/callback'
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user already exists with this Google ID
      let user = await database.findUserByGoogleId(profile.id);
      
      if (user) {
        return done(null, user);
      }

      // Check if user exists with this email
      user = await database.findUserByEmail(profile.emails[0].value);
      
      if (user) {
        // Link Google account to existing user
        user = await database.updateUser(user.id, {
          googleId: profile.id,
          avatar: profile.photos[0]?.value
        });
        return done(null, user);
      }

      // Create new user
      user = await database.createUser({
        googleId: profile.id,
        email: profile.emails[0].value,
        name: profile.displayName,
        firstName: profile.name.givenName,
        lastName: profile.name.familyName,
        avatar: profile.photos[0]?.value,
        provider: 'google',
        isVerified: true
      });

      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }));
} else {
  console.warn('Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env file to enable Google authentication.');
}

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await database.findUserById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;