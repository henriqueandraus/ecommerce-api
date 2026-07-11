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

app.get('/products', (req, res) => {
  const { category } = req.query;

  if (category) {
    pool.query('SELECT * FROM products WHERE category = $1', [category], (error, results) => {
      if (error) {
        throw error;
      }
      res.status(200).json(results.rows);
    });
  } else {
    pool.query('SELECT * FROM products', (error, results) => {
      if (error) {
        throw error;
      }
      res.status(200).json(results.rows);
    });
  }
})

app.post('/products', (req, res) => {
  const { name, description, price, stock_quantity, category } = req.body;

  pool.query(
    'INSERT INTO products (name, description, price, stock_quantity, category) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [name, description, price, stock_quantity, category],
    (error, results) => {
      if (error) {
        throw error;
      }
      res.status(201).json(results.rows[0]);
    }
  );
})

app.get('/products/:id', (req, res) => {
  const { id } = req.params;

  pool.query('SELECT * FROM products WHERE id = $1', [id], (error, results) => {
    if (error) {
      throw error;
    }
    if (results.rows.length === 0) {
      return res.status(404).send('Product not found');
    }
    res.status(200).json(results.rows[0]);
  });
})

app.put('/products/:id', (req, res) => {
  const { id } = req.params;
  const { name, description, price, stock_quantity, category } = req.body;

  pool.query(
    'UPDATE products SET name = $1, description = $2, price = $3, stock_quantity = $4, category = $5 WHERE id = $6 RETURNING *',
    [name, description, price, stock_quantity, category, id],
    (error, results) => {
      if (error) {
        throw error;
      }
      if (results.rows.length === 0) {
        return res.status(404).send('Product not found');
      }
      res.status(200).json(results.rows[0]);
    }
  );
})

app.delete('/products/:id', (req, res) => {
  const { id } = req.params;

  pool.query('DELETE FROM products WHERE id = $1 RETURNING *', [id], (error, results) => {
    if (error) {
      throw error;
    }
    if (results.rows.length === 0) {
      return res.status(404).send('Product not found');
    }
    res.status(200).send('Product deleted successfully');
  });
})

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});