const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'itc801',
  database: 'pandaworld_goods_shop'
};

// 제품 목록 가져오기
router.get('/', async (req, res) => {
  const connection = await mysql.createConnection(dbConfig);
  const [rows] = await connection.query('SELECT * FROM products');
  res.json(rows);
  await connection.end();
});



module.exports = router;
