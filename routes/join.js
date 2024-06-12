const express = require('express');
const bcrypt = require('bcrypt');


const router = express.Router();

// 회원가입 처리
router.post('/join', async (req, res) => {
  const { username, password, email } = req.body;

  try {
    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 10);

    // MySQL에 사용자 정보 저장
    const [result] = await pool.query(
      'INSERT INTO users (username, password_hash, email) VALUES (?, ?, ?)',
      [username, hashedPassword, email]
    );

    res.status(200).send('회원가입이 완료되었습니다.');
  } catch (error) {
    console.error(error);
    res.status(500).send('회원가입에 실패했습니다.');
  }
});

// 로그인 처리
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // MySQL에서 사용자 정보 조회
    const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    const user = rows[0];

    // 사용자가 존재하는지 확인
    if (!user) {
      return res.status(400).send('존재하지 않는 사용자입니다.');
    }

    // 비밀번호 일치 여부 확인
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(400).send('비밀번호가 일치하지 않습니다.');
    }

    // 로그인 성공
    res.status(200).send('로그인 성공!');
  } catch (error) {
    console.error(error);
    res.status(500).send('로그인 중 오류가 발생했습니다.');
  }
});



module.exports = router;
