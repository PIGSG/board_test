const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'itc801',
  database: 'pandaworld_goods_shop'
};

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.query('SELECT * FROM users WHERE username = ?', [username]);
    await connection.end();

    if (rows.length === 0) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    const user = rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    req.session.userId = user.user_id;
    res.json({ message: 'Login successful' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
