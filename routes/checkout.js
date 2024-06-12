const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'itc801',
  database: 'pandaworld_goods_shop'
};

// 결제 처리
router.post('/', async (req, res) => {
  const { address, phone, cardNumber, cardholderName, expirationDate, cvv } = req.body;
  const connection = await mysql.createConnection(dbConfig);
  
  // Assuming you have a user ID from session or authentication, here using a hardcoded example
  const userId = 1;
  
  // Create customer
  const [result] = await connection.query('INSERT INTO customers (user_id, address, phone) VALUES (?, ?, ?)', [userId, address, phone]);
  const customerId = result.insertId;
  
  // Create order
  const [orderResult] = await connection.query('INSERT INTO orders (customer_id, order_date, total_amount) SELECT ?, NOW(), SUM(p.price * c.quantity) FROM cart c JOIN products p ON c.product_id = p.product_id', [customerId]);
  const orderId = orderResult.insertId;

  // Create order details
  await connection.query('INSERT INTO order_details (order_id, product_id, quantity, price) SELECT ?, c.product_id, c.quantity, p.price FROM cart c JOIN products p ON c.product_id = p.product_id', [orderId]);

  // Clear cart
  await connection.query('DELETE FROM cart WHERE user_id = ?', [userId]);

  res.sendStatus(200);
  await connection.end();
});

module.exports = router;
