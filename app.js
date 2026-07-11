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

app.get('/test-db', (req, res) => {
  pool.query('SELECT NOW()', (error, results) => {
    if (error) {
      return res.status(500).send(error.message);
    }
    res.send(results.rows)
  })
})

app.post('/register', (req, res) => {
  const { username, email, password } = req.body;

  pool.query('SELECT * FROM users WHERE username = $1 OR email = $2', [username, email], (error, results) => {
    if (error) {
      return res.status(500).send(error.message);
    }
    if (results.rows.length > 0) {
      return res.status(409).send('User already exists');
    }

    bcrypt.hash(password, 10, (err, hashedPassword) => {
      if (err) {
        return res.status(500).send(err.message);
      }

      pool.query(
        'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email, created_at',
        [username, email, hashedPassword],
        (error, results) => {
          if (error) {
            return res.status(500).send(error.message);
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
        return res.status(500).send(error.message);
      }
      res.status(200).json(results.rows);
    });
  } else {
    pool.query('SELECT * FROM products', (error, results) => {
      if (error) {
        return res.status(500).send(error.message);
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
        return res.status(500).send(error.message);
      }
      res.status(201).json(results.rows[0]);
    }
  );
})

app.get('/products/:id', (req, res) => {
  const { id } = req.params;

  pool.query('SELECT * FROM products WHERE id = $1', [id], (error, results) => {
    if (error) {
      return res.status(500).send(error.message);
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
        return res.status(500).send(error.message);
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
      return res.status(500).send(error.message);
    }
    if (results.rows.length === 0) {
      return res.status(404).send('Product not found');
    }
    res.status(200).send('Product deleted successfully');
  });
})

app.get('/users', (req, res) => {
  pool.query('SELECT id, username, email, created_at FROM users', (error, results) => {
    if (error) {
      return res.status(500).send(error.message);
    }
    res.status(200).json(results.rows);
  });
})

app.get('/users/:id', (req, res) => {
  const { id } = req.params;

  pool.query('SELECT id, username, email, created_at FROM users WHERE id = $1', [id], (error, results) => {
    if (error) {
      return res.status(500).send(error.message);
    }
    if (results.rows.length === 0) {
      return res.status(404).send('User not found');
    }
    res.status(200).json(results.rows[0]);
  });
})

app.put('/users/:id', (req, res) => {
  const { id } = req.params;
  const { username, email } = req.body;

  pool.query(
    'UPDATE users SET username = $1, email = $2 WHERE id = $3 RETURNING id, username, email, created_at',
    [username, email, id],
    (error, results) => {
      if (error) {
        return res.status(500).send(error.message);
      }
      if (results.rows.length === 0) {
        return res.status(404).send('User not found');
      }
      res.status(200).json(results.rows[0]);
    }
  );
})

app.delete('/users/:id', (req, res) => {
  const { id } = req.params;

  pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id], (error, results) => {
    if (error) {
      return res.status(500).send(error.message);
    }
    if (results.rows.length === 0) {
      return res.status(404).send('User not found');
    }
    res.status(200).send('User deleted successfully');
  });
})

app.post('/cart', (req, res) => {
  const { user_id } = req.body;

  pool.query(
    'INSERT INTO carts (user_id) VALUES ($1) RETURNING *',
    [user_id],
    (error, results) => {
      if (error) {
        if (error.code === '23505') {
          return res.status(409).send('User already has a cart');
        }
        if (error.code === '23503') {
          return res.status(400).send('User does not exist');
        }
        return res.status(500).send(error.message);
      }
      res.status(201).json(results.rows[0]);
    }
  );
})

app.get('/cart/:cartId', (req, res) => {
  const { cartId } = req.params;

  pool.query(
    `SELECT cart_items.id, cart_items.quantity, products.name, products.price, products.id AS product_id
     FROM cart_items
     JOIN products ON cart_items.product_id = products.id
     WHERE cart_items.cart_id = $1`,
    [cartId],
    (error, results) => {
      if (error) {
        return res.status(500).send(error.message);
      }
      res.status(200).json(results.rows);
    }
  );
})

app.post('/cart/:cartId', (req, res) => {
  const { cartId } = req.params;
  const { product_id, quantity } = req.body;

  pool.query(
    'INSERT INTO cart_items (cart_id, product_id, quantity) VALUES ($1, $2, $3) RETURNING *',
    [cartId, product_id, quantity],
    (error, results) => {
      if (error) {
        if (error.code === '23503') {
          return res.status(400).send('Cart or product does not exist');
        }
        return res.status(500).send(error.message);
      }
      res.status(201).json(results.rows[0]);
    }
  );
})

app.post('/orders', (req, res) => {
  const { user_id, cart_id } = req.body;

  pool.query(
    `SELECT cart_items.product_id, cart_items.quantity, products.price
     FROM cart_items
     JOIN products ON cart_items.product_id = products.id
     WHERE cart_items.cart_id = $1`,
    [cart_id],
    (error, cartResults) => {
      if (error) {
        return res.status(500).send(error.message);
      }
      if (cartResults.rows.length === 0) {
        return res.status(400).send('Cart is empty');
      }

      const totalAmount = cartResults.rows.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      pool.query(
        'INSERT INTO orders (user_id, status, total_amount) VALUES ($1, $2, $3) RETURNING *',
        [user_id, 'pending', totalAmount],
        (error, orderResults) => {
          if (error) {
            return res.status(500).send(error.message);
          }

          const order = orderResults.rows[0];

          const insertPromises = cartResults.rows.map((item) => {
            return pool.query(
              'INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES ($1, $2, $3, $4)',
              [order.id, item.product_id, item.quantity, item.price]
            );
          });

          Promise.all(insertPromises)
            .then(() => {
              pool.query('DELETE FROM cart_items WHERE cart_id = $1', [cart_id], (error) => {
                if (error) {
                  return res.status(500).send(error.message);
                }
                res.status(201).json(order);
              });
            })
            .catch((error) => {
              res.status(500).send(error.message);
            });
        }
      );
    }
  );
})

app.get('/orders', (req, res) => {
  const { user_id } = req.query;

  pool.query('SELECT * FROM orders WHERE user_id = $1', [user_id], (error, results) => {
    if (error) {
      return res.status(500).send(error.message);
    }
    res.status(200).json(results.rows);
  });
})

app.get('/orders/:orderId', (req, res) => {
  const { orderId } = req.params;

  pool.query(
    `SELECT order_items.id, order_items.quantity, order_items.price_at_purchase, products.name
     FROM order_items
     JOIN products ON order_items.product_id = products.id
     WHERE order_items.order_id = $1`,
    [orderId],
    (error, results) => {
      if (error) {
        return res.status(500).send(error.message);
      }
      res.status(200).json(results.rows);
    }
  );
})

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});