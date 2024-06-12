const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');
const session = require('express-session');

router.use(bodyParser.json());

// MySQL 연결
let connection;
async function connectToDatabase() {
  connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'itc801',
    database: 'pandaworld_goods_shop'
  });
}
connectToDatabase();

// 세션 설정
router.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true
}));

// 메인 페이지 (주문 내역)
router.get('/', async function(req, res, next) {
  try {
    const [rows] = await connection.query('SELECT * FROM orders');
    res.render('index', { list: rows });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).send('주문 내역을 불러오는 중 오류가 발생했습니다.');
  }
});

// 회원가입 엔드포인트
router.post('/join', async (req, res) => {
  const { username, password, email } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await connection.query(
      'INSERT INTO users (username, password_hash, email) VALUES (?, ?, ?)',
      [username, hashedPassword, email]
    );
    res.status(200).send('회원가입이 완료되었습니다.');
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).send('회원가입 중 오류가 발생했습니다.');
  }
});

// 로그인 엔드포인트
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    console.log('Received login request with username:', username);

    const [rows] = await connection.query('SELECT * FROM users WHERE username = ?', [username]);

    if (rows.length === 0) {
      console.log('No user found with username:', username);
      return res.status(404).json({ error: '존재하지 않는 사용자입니다.' });
    }

    const user = rows[0];
    console.log('Found user:', user);

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      console.log('Invalid password for user:', username);
      return res.status(400).json({ error: '비밀번호가 일치하지 않습니다.' });
    }

    // 로그인 성공 시 사용자 정보를 세션에 저장
    req.session.user = { username: user.username, email: user.email };

    console.log('Login successful');
    res.status(200).json({ loggedIn: true, username: user.username });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: '로그인 중 오류가 발생했습니다.' });
  }
});

// 로그인 상태 확인 엔드포인트
router.get('/check-login-status', (req, res) => {
  if (req.session.user) {
    res.status(200).json({ loggedIn: true, username: req.session.user.username });
  } else {
    res.status(200).json({ loggedIn: false });
  }
});

// 로그아웃 엔드포인트
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send('로그아웃 중 오류가 발생했습니다.');
    }
    res.status(200).send('로그아웃 되었습니다.');
  });
});

module.exports = router;
