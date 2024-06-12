const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
const moment = require('moment');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;



const productsRouter = require('./products');
const cartRouter = require('./cart');
const checkoutRouter = require('./checkout');

router.use('/products', productsRouter);
router.use('/cart', cartRouter);
router.use('/checkout', checkoutRouter);

// 미들웨어 설정
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));

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

router.use((req, res, next) => {
  res.locals.moment = moment;
  next();
});

// 로그인 필요 미들웨어
function requireLogin(req, res, next) {
  if (req.session && req.session.user) {
    next();
  } else {
    res.redirect('/login');
  }
}


// 라우터 설정
router.get('/join', function(req, res) {
  res.render('join');
});

router.get('/profile', function(req, res) {
  res.render('profile');
});

router.get('/contact1', async function(req, res) {
  try {
    const [inquiries] = await connection.query('SELECT * FROM inquiries');
    res.render('contact1', { inquiries: inquiries });
  } catch (error) {
    console.error('Error fetching inquiries:', error);
    res.status(500).send('목록 조회 중 오류가 발생했습니다.');
  }
});



router.get('/contact', async function(req, res) {
  try {
    const userId = req.session.user ? req.session.user.user_id : null;
    if (!userId) {
      res.status(401).send('로그인이 필요합니다.');
      return;
    }
    const [inquiries] = await connection.query('SELECT * FROM inquiries WHERE customer_id = ?', [userId]);
    res.render('contact', { inquiries });
  } catch (error) {
    console.error('Error fetching inquiries:', error);
    res.status(500).send('문의 내역을 불러오는 중 오류가 발생했습니다.');
  }
});

router.get('/', async function(req, res, next) {
  try {
    const [rows] = await connection.query('SELECT * FROM orders');
    res.render('index', { list: rows });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).send('주문 내역을 불러오는 중 오류가 발생했습니다.');
  }
});

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

// 로그인 처리 예시
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const [rows] = await connection.query('SELECT * FROM users WHERE username = ?', [username]);

    if (rows.length > 0) {
      const user = rows[0];
      const match = await bcrypt.compare(password, user.password_hash);

      if (match) {
        req.session.user = user; // 세션에 사용자 정보 설정 (여기에는 사용자 ID도 포함되어야 함)
        res.redirect('/'); // 로그인 성공 후 이동할 페이지
      } else {
        res.status(401).send('Invalid username or password');
      }
    } else {
      res.status(401).send('Invalid username or password');
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).send('Internal server error');
  }
});



router.get('/check-login-status', (req, res) => {
  if (req.session.user) {
    res.status(200).json({ loggedIn: true, username: req.session.user.username });
  } else {
    res.status(200).json({ loggedIn: false });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send('로그아웃 중 오류가 발생했습니다.');
    }
    res.status(200).send('로그아웃 되었습니다.');
  });
});

router.post('/contact', async (req, res) => {
  const { subject, message } = req.body;
  try {
    const user = req.session.user;
    if (!user) {
      res.status(401).send('로그인이 필요합니다.');
      return;
    }
    const customerId = user.customer_id;
    await connection.query(
      'INSERT INTO inquiries (user_id, subject, message) VALUES (?, ?, ?)',
      [customerId, subject, message]
    );
    res.status(200).send('문의가 성공적으로 제출되었습니다.');
  } catch (error) {
    console.error('Error submitting inquiry:', error);
    res.status(500).send('문의 제출 중 오류가 발생했습니다.');
  }
});

router.put('/contact/:id', async (req, res) => {
  const { id } = req.params;
  const { subject, message } = req.body;
  try {
    const customerId = req.session.user ? req.session.user.customer_id : null;
    if (!customerId) {
      res.status(401).send('로그인이 필요합니다.');
      return;
    }
    await connection.query(
      'UPDATE inquiries SET subject = ?, message = ? WHERE inquiry_id = ? AND customer_id = ?',
      [subject, message, id, customerId]
    );
    res.status(200).send('문의가 성공적으로 수정되었습니다.');
  } catch (error) {
    console.error('Error updating inquiry:', error);
    res.status(500).send('문의 수정 중 오류가 발생했습니다.');
  }
});

router.delete('/contact/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const customerId = req.session.user ? req.session.user.customer_id : null;
    if (!customerId) {
      res.status(401).send('로그인이 필요합니다.');
      return;
    }
    await connection.query(
      'DELETE FROM inquiries WHERE inquiry_id = ? AND customer_id = ?',
      [id, customerId]
    );
    res.status(200).send('문의가 성공적으로 삭제되었습니다.');
  } catch (error) {
    console.error('Error deleting inquiry:', error);
    res.status(500).send('문의 삭제 중 오류가 발생했습니다.');
  }
});

router.get('/writer', function(req, res) {
  res.render('writer');
});

router.post('/orders/writer', async (req, res) => {
  const { subject, message } = req.body;
  const user = req.session.user; // 세션에서 로그인한 사용자 정보를 가져옴

  if (!user) {
      res.status(401).send('User not logged in');
      return;
  }

  try {
      await connection.query(
          'INSERT INTO inquiries (subject, message) VALUES (?, ?)',
          [ subject, message] // 세션에서 직접 사용자 ID를 가져와 작성자로 사용
      );

      res.redirect('/contact1');
  } catch (error) {
      console.error('Error writing inquiry:', error);
      res.status(500).send('Error writing inquiry');
  }
});




passport.use(new LocalStrategy(
  function(username, password, done) {
    User.findOne({ username: username }, function (err, user) {
      if (err) { return done(err); }
      if (!user) { return done(null, false); }
      if (!user.verifyPassword(password)) { return done(null, false); }
      return done(null, user);
    });
  }
));

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});




router.get('/orders', async function(req, res) {
  try {
    const [inquiries] = await connection.query('SELECT * FROM inquiries');
    res.render('orders', { inquiries: inquiries });
  } catch (error) {
    console.error('Error fetching inquiries:', error);
    res.status(500).send('목록 조회 중 오류가 발생했습니다.');
  }
});




router.get('/orders/:id', async function(req, res,next) {
  try {
    const [rows] = await connection.query('SELECT * FROM inquiries WHERE inquiry_id = ?', [req.params.id]);
    const inquiry = rows[0];
    if (!inquiry) {
      res.status(404).send('요청하신 페이지를 찾을 수 없습니다.');
      return;
    }
    res.render('orders', { inquiry: rows[0] });
  } catch (error) {
    console.error('Error fetching and rendering inquiry:', error);
    res.status(500).send('문의 조회 중 오류가 발생했습니다.');
  }
});

router.get('/orders/modify/:id', async function(req, res,next) {
  try {
    const [rows] = await connection.query('SELECT * FROM inquiries WHERE inquiry_id = ?', [req.params.id]);
    const inquiry = rows[0];
    if (!inquiry) {
      res.status(404).send('요청하신 페이지를 찾을 수 없습니다.');
      return;
    }
    res.render('modify', { inquiry: rows[0] });
  } catch (error) {
    console.error('Error fetching inquiry data:', error);
    res.status(500).send('문의 조회 중 오류가 발생했습니다.');
  }
});



router.post('/orders/modify', async (req, res, next) => {
  try {
    const { inquiry_id, subject, message } = req.body;

    console.log('Received data:', req.body); // 요청 데이터 로그
    console.log('Query to execute: UPDATE inquiries SET subject = ?, message = ? WHERE inquiry_id = ?', [subject, message, inquiry_id]);

    await connection.query('UPDATE inquiries SET subject = ?, message = ? WHERE inquiry_id = ?', [subject, message, inquiry_id]);
    
    console.log('Update successful');
    res.redirect('/contact1/');
  } catch (error) {
    console.error('Error updating board data:', error);
    res.status(500).send('글 수정 중 오류가 발생했습니다.');
  }
});




router.get("/orders/delete/:id",async function(req,res,next){
  await connection.query("delete from inquiries where inquiry_id=?",[req.params.id])
  res.redirect("/")
})







router.get("/orders/modify/:id",async function(req,res,next){
  var[rows]=await connection.query("SELECT * FROM inquiries WHERE inquiry_id = ?",[req.params.id])
  res.render("modify",{inquiry:rows[0]})
  
})



router.get('/index1', function(req, res) {
  res.render('index1');
});

router.get('/products', function(req, res) {
  res.render('products');
});

router.get('/products', async (req, res) => {
  const connection = await mysql.createConnection(dbConfig);
  const [rows] = await connection.query('SELECT * FROM products');
  res.json(rows);
  await connection.end();
});

// 이 코드는 기존 코드에 추가되어야 합니다.

router.post('/products', (req, res) => {
  const { name, description, price, categoryId, stockQuantity } = req.body;
  const query = 'INSERT INTO products (name, description, price, category_id, stock_quantity) VALUES (?, ?, ?, ?, ?)';
  connection.query(query, [name, description, price, categoryId, stockQuantity], (error, results) => {
    if (error) {
      console.error('Error adding product:', error);
      res.status(500).send('Error adding product');
    } else {
      res.sendStatus(200);
    }
  });
});


router.post('/', async (req, res) => {
  const { productId } = req.body;

  try {
    // 장바구니에 상품 추가. user_id는 세션에 저장되어 있으므로 사용하지 않음.
    const [rows] = await db.query(
      'INSERT INTO cart (product_id, quantity) VALUES (?, 1) ON DUPLICATE KEY UPDATE quantity = quantity + 1',
      [productId]
    );
    res.status(200).json({ message: 'Product added to cart' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Database error' });
  }
});
router.get('/products', (req, res) => {
  res.json(products);
});

router.get('/getUserId', (req, res) => {
  if (req.session.user) {
    res.json({ userId: req.session.user.user_id });
  } else {
    res.status(401).json({ userId: null });
  }
});

router.use('/cart', cartRouter);

router.get('/cart', async (req, res) => {
  const connection = await mysql.createConnection(dbConfig);
  const [rows] = await connection.query('SELECT c.product_id, p.name, p.price, c.quantity FROM cart c JOIN products p ON c.product_id = p.product_id');
  res.json(rows);
  await connection.end();
});

router.put('/cart/:productId', async (req, res) => {
  const { productId } = req.params;
  const { quantity } = req.body;
  const connection = await mysql.createConnection(dbConfig);
  await connection.query('UPDATE cart SET quantity = ? WHERE product_id = ?', [quantity, productId]);
  res.sendStatus(200);
  await connection.end();
});

router.post('/checkout', async (req, res) => {
  const { address, phone, cardNumber, cardholderName, expirationDate, cvv } = req.body;
  const connection = await mysql.createConnection(dbConfig);
  
  // Assuming you have a user ID from session or authentication, here using a hardcoded example
  const userId = 1;
  
  // Create customer
  const [result] = await connection.query('INSERT INTO customers (user_id, address, phone) VALUES (?, ?, ?)', [userId, address, phone]);
  const customerId = result.insertId;
  
  // Create order
  const [cartItems] = await connection.query('SELECT product_id, quantity, price FROM cart JOIN products USING(product_id)');
  const totalAmount = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const [orderResult] = await connection.query('INSERT INTO orders (customer_id, order_date, total_amount) VALUES (?, NOW(), ?)', [customerId, totalAmount]);
  const orderId = orderResult.insertId;
  
  // Insert order items
  for (const item of cartItems) {
    await connection.query('INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)', [orderId, item.product_id, item.quantity, item.price]);
  }

  // Clear cart
  await connection.query('DELETE FROM cart');

  res.sendStatus(200);
  await connection.end();
});









module.exports = router;
