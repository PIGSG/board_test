const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'itc801',
  database: 'pandaworld_goods_shop'
};

// 장바구니에 상품 추가
router.post('/', async (req, res) => {
  const { productId } = req.body;
  const sessionId = req.session.sessionId;

  if (!sessionId) {
    console.error('Session ID is not set in session');
    console.log('Current session:', req.session);
    return res.status(400).json({ message: 'Session ID is not set in session' });
  }

  try {
    const connection = await mysql.createConnection(dbConfig);
    await connection.query(
      'INSERT INTO cart (session_id, product_id, quantity) VALUES (?, ?, 1) ON DUPLICATE KEY UPDATE quantity = quantity + 1',
      [sessionId, productId]
    );
    res.sendStatus(200);
    await connection.end();
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ message: 'Failed to add product to cart. Please try again later.' });
  }
});

// 장바구니 항목 가져오기
router.get('/', async (req, res) => {
  const sessionId = req.session.sessionId;

  if (!sessionId) {
    console.error('Session ID is not set in session');
    console.log('Current session:', req.session);
    return res.status(400).json({ message: 'Session ID is not set in session' });
  }

  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.query(
      'SELECT c.product_id, p.name, p.price, c.quantity FROM cart c JOIN products p ON c.product_id = p.product_id WHERE c.session_id = ?',
      [sessionId]
    );
    res.json(rows);
    await connection.end();
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ message: 'Failed to retrieve cart items. Please try again later.' });
  }
});

// 장바구니 항목 수량 업데이트
router.put('/:productId', async (req, res) => {
  const { productId } = req.params;
  const { quantity } = req.body;
  const sessionId = req.session.sessionId;

  if (!sessionId) {
    console.error('Session ID is not set in session');
    console.log('Current session:', req.session);
    return res.status(400).json({ message: 'Session ID is not set in session' });
  }

  try {
    const connection = await mysql.createConnection(dbConfig);
    await connection.query(
      'UPDATE cart SET quantity = ? WHERE product_id = ? AND session_id = ?',
      [quantity, productId, sessionId]
    );
    res.sendStatus(200);
    await connection.end();
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ message: 'Failed to update cart item. Please try again later.' });
  }
});



// 장바구니에 상품 추가
router.post('/', async (req, res) => {
    const { productId } = req.body;
  
    if (!req.session.user || !req.session.user.user_id) {
      return res.status(400).json({ message: 'Session ID is not set in session' });
    }
  
    const userId = req.session.user.user_id;
  
    try {
      const connection = await mysql.createConnection(dbConfig);
      await connection.query('INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, 1) ON DUPLICATE KEY UPDATE quantity = quantity + 1', [userId, productId]);
      await connection.end();
      res.sendStatus(200);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to add product to cart. Please try again later.' });
    }
  });







module.exports = router;
