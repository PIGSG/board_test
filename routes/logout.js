// routes/index.js 또는 적절한 라우터 파일에 추가합니다.
const express = require('express');
const router = express.Router();

// 미들웨어 설정
router.use(express.json());
router.use(express.urlencoded({ extended: false }));

// 로그아웃 라우트
router.post('/logout', (req, res) => {
    // 세션 파기
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            res.status(500).send('로그아웃 중 오류가 발생했습니다.');
        } else {
            console.log('Logout successful');
            res.status(200).send('로그아웃 성공!');
        }
    });
});

module.exports = router;
