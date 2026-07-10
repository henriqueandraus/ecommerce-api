const express = require('express')
const pool = require('./db.js')
const bcrypt = require('bcrypt')
const session = require('express-session')
const passport = require('./passportConfig')
require('dotenv').config();

const app = express()

app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

app.get('/', (req, res) => {
  res.send('Hello World!');
})

app.get('/test-db', (req, res, next) => {
  pool.query('SELECT NOW()', (error, results) => {
    if (error) {
      throw error;
    }
    res.send(results.rows)
  })
})

app.post('/register', (req, res) => {
  const { username, email, password } = req.body;

  pool.query('SELECT * FROM users WHERE username = $1 OR email = $2', [username, email], (error, results) => {
    if (error) {
      throw error;
    }
    if (results.rows.length > 0) {
      return res.status(409).send('User already exists');
    }

    bcrypt.hash(password, 10, (err, hashedPassword) => {
      if (err) {
        throw err;
      }

      pool.query(
        'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email, created_at',
        [username, email, hashedPassword],
        (error, results) => {
          if (error) {
            throw error;
          }
          res.status(201).json(results.rows[0]);
        }
      );
    });
  });
})


app.post('/login', passport.authenticate('local'), (req, res) => {
  res.status(200).json({ message: 'Login successful', user: req.user });
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});