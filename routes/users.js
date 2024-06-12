const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');

// MySQL connection
async function connectToDatabase() {
    try {
        global.pool = await mysql.createPool({
            host: 'localhost',
            user: 'root',
            password: 'itc801',
            database: 'pandaworld_goods_shop',
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });
    } catch (error) {
        console.error('Error connecting to database:', error);
    }
}
connectToDatabase();

// 사용자 목록 조회 예시
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM users');
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).send('사용자 목록 조회 중 오류가 발생했습니다.');
    }
});

module.exports = router;
