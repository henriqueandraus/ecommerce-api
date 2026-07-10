const passport = require('passport')
const bcrypt = require('bcrypt')
const pool = require('./db.js')
const { Strategy } = require('passport-local')



passport.use(new Strategy((username, password, done) => {
  pool.query('SELECT * FROM users WHERE username = $1', [username], (error, results) => {
    if (error) {
      return done(error);
    }

    if (results.rows.length === 0) {
      return done(null, false, { message: 'Incorrect username' });
    }

    const user = results.rows[0];

    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) {
        return done(err);
      }

      if (!isMatch) {
        return done(null, false, { message: 'Incorrect password' });
      }

      return done(null, user);
    });
  });
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  pool.query('SELECT * FROM users WHERE id = $1', [id], (err, results) => {
    if (err) return done(err);
    done(null, results.rows[0]);
  });
});

module.exports = passport;