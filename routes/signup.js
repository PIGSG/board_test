var express = require('express');
var router = express.Router();
var bcrypt = require('bcrypt');
var crypto = require('crypto');
var { body, validationResult } = require('express-validator');

// 사용자 비밀번호 해싱 함수
async function hashPassword(password) {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
}

// 데이터 암호화 함수
function encrypt(text) {
    let cipher = crypto.createCipher('aes-256-cbc', 'your-encryption-key-here');
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
}

router.get('/', function(req, res, next) {
    res.render('signup'); // 회원가입 폼 렌더링
});

router.post('/',
    body('username').notEmpty(),
    body('email').isEmail(),
    body('password').isLength({ min: 6 }),
    body('card_number').isCreditCard(),
    async function(req, res, next) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { username, email, password, first_name, last_name, phone, address, card_number, cardholder_name, expiration_date, cvv } = req.body;

        try {
            // 비밀번호 해싱
            const passwordHash = await hashPassword(password);

            // 데이터 암호화
            const encryptedCardNumber = encrypt(card_number);
            const encryptedCvv = encrypt(cvv);

            // 데이터베이스 쿼리 실행
            const conn = global.connection;
            await conn.query("INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)", [username, email, passwordHash]);
            const [userResult] = await conn.query("SELECT LAST_INSERT_ID() AS user_id");
            const userId = userResult[0].user_id;

            await conn.query("INSERT INTO customers (user_id, first_name, last_name, phone, address) VALUES (?, ?, ?, ?, ?)", [userId, first_name, last_name, phone, address]);
            const [customerResult] = await conn.query("SELECT LAST_INSERT_ID() AS customer_id");
            const customerId = customerResult[0].customer_id;

            await conn.query("INSERT INTO payment_cards (customer_id, card_number, cardholder_name, expiration_date, cvv) VALUES (?, ?, ?, ?, ?)", [customerId, encryptedCardNumber, cardholder_name, expiration_date, encryptedCvv]);

            res.send("User and payment card created successfully!");
        } catch (err) {
            console.error(err);
            res.status(500).send("Error occurred during signup!");
        }
    }
);

module.exports = router;
