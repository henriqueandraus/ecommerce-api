# E-commerce API

A REST API for an e-commerce application, built with Express.js and PostgreSQL. This project allows users to register, log in, browse products, manage a shopping cart, and place orders.

## Features

- User registration and authentication (Passport.js + bcrypt)
- Full CRUD operations for products
- Full CRUD operations for user accounts
- Shopping cart management (one cart per user)
- Checkout flow with simulated payment processing
- Order history and order details
- Interactive API documentation with Swagger UI

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** PostgreSQL
- **Database driver:** node-postgres (`pg`)
- **Authentication:** Passport.js (Local Strategy), express-session, bcrypt
- **Documentation:** Swagger UI (OpenAPI 3.0)
- **Environment variables:** dotenv

## Project Structure

```
ecommerce-api/
├── app.js              # Main application file with all routes
├── db.js               # PostgreSQL connection pool setup
├── passportConfig.js   # Passport.js authentication strategy
├── openapi.yaml         # OpenAPI/Swagger documentation
├── .env                # Environment variables (not committed)
├── .gitignore
├── package.json
└── README.md
```

## Database Schema

The database consists of 6 tables:

- **users** — user accounts (id, username, email, password, created_at)
- **products** — items available for purchase (id, name, description, price, stock_quantity, category, created_at)
- **carts** — one cart per user (id, user_id, created_at)
- **cart_items** — items currently in a cart (id, cart_id, product_id, quantity)
- **orders** — completed orders (id, user_id, status, total_amount, created_at)
- **order_items** — items belonging to a completed order, with price frozen at time of purchase (id, order_id, product_id, quantity, price_at_purchase)

### Relationships

```
users (1) ── (1) carts
users (1) ── (N) orders
carts (1) ── (N) cart_items ── (N) products
orders (1) ── (N) order_items ── (N) products
```

## Getting Started

### Prerequisites

- Node.js installed
- PostgreSQL installed and running locally

### Installation

1. Clone the repository
```bash
git clone https://github.com/henriqueandraus/ecommerce-api.git
cd ecommerce-api
```

2. Install dependencies
```bash
npm install
```

3. Create a PostgreSQL database
```sql
CREATE DATABASE ecommerce_api;
```

4. Create the tables (see Database Schema section above, or run the SQL scripts in the `sql/` folder if included)

5. Create a `.env` file in the project root with the following variables:
```
DB_USER=postgres
DB_HOST=localhost
DB_NAME=ecommerce_api
DB_PASSWORD=your_postgres_password
DB_PORT=5432
SESSION_SECRET=your_session_secret
```

6. Start the server
```bash
node app.js
```

The server will run on `http://localhost:3000`.

## API Documentation

Once the server is running, interactive API documentation is available at:

```
http://localhost:3000/api-docs
```

This uses Swagger UI to let you explore and test every endpoint directly from the browser.

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/register` | Register a new user |
| POST | `/login` | Log in with username and password |

### Users

| Method | Endpoint | Description |
|---|---|---|
| GET | `/users` | Get all users |
| GET | `/users/:id` | Get a specific user |
| PUT | `/users/:id` | Update a user |
| DELETE | `/users/:id` | Delete a user |

### Products

| Method | Endpoint | Description |
|---|---|---|
| GET | `/products` | Get all products (optionally filtered by `?category=`) |
| GET | `/products/:id` | Get a specific product |
| POST | `/products` | Create a new product |
| PUT | `/products/:id` | Update a product |
| DELETE | `/products/:id` | Delete a product |

### Cart

| Method | Endpoint | Description |
|---|---|---|
| POST | `/cart` | Create a cart for a user |
| GET | `/cart/:cartId` | View items in a cart |
| POST | `/cart/:cartId` | Add an item to a cart |
| DELETE | `/cart/:cartId/items/:itemId` | Remove an item from a cart |
| POST | `/cart/:cartId/checkout` | Checkout a cart and place an order |

### Orders

| Method | Endpoint | Description |
|---|---|---|
| GET | `/orders?user_id=` | Get all orders for a user |
| GET | `/orders/:orderId` | Get the details of a specific order |

## Security Notes

- Passwords are hashed using bcrypt before being stored.
- All SQL queries use parameterized statements (`$1`, `$2`, ...) to prevent SQL injection.
- Sensitive configuration (database credentials, session secret) is stored in environment variables and excluded from version control via `.gitignore`.

## Future Improvements

- Add route-level authorization so users can only modify their own account, cart, and orders
- Add real payment processing integration
- Add `PUT`/`DELETE` support for orders
- Add automated tests

## Author

Henrique Andraus
