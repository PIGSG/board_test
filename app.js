var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
var FileStore = require('session-file-store')(session);
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var session = require('express-session');

var bodyParser = require('body-parser');

var { v4: uuidv4 } = require('uuid');
var app = express();

var mysql = require("mysql2/promise");

async function conn() {
    try {
        var pool = await mysql.createPool({
            host: 'localhost',
            user: 'root',
            password: 'itc801',
            database: 'pandaworld_goods_shop',
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });
        global.pool = pool;
    } catch (error) {
        console.error("Error connecting to database:", error);
    }
}

conn();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: 'your-secret-key', // 비밀 키 설정
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // HTTPS를 사용하는 경우 true로 설정
  }));

app.use('/', indexRouter);
app.use('/users', usersRouter);

app.use(function(req, res, next) {
    next(createError(404));
});

app.use(function(err, req, res, next) {
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    res.status(err.status || 500);
    res.render('error');
});


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Remove the redundant server start here
// const port = 3002;
// app.listen(port, () => {
//     console.log(`서버가 http://localhost:${port} 에서 실행 중입니다.`);
// });

app.use(express.json()); // JSON 데이터를 해석하기 위한 미들웨어
app.use(express.urlencoded({ extended: true })); // URL 인코딩된 데이터를 해석하기 위한 미들웨어

app.use((req, res, next) => {
    req.pool = pool;
    next();
  });

  
  app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true,
  }));

// 세션에 데이터 저장
app.get('/setSession', (req, res) => {
    req.session.username = 'user123';
    res.send('Session data set successfully');
  });
  
  // 세션에서 데이터 읽기
  app.get('/getSession', (req, res) => {
    const username = req.session.username;
    res.send(`Username: ${username}`);
  });
  


  //tset

  

// 세션에 sessionId 설정
app.use((req, res, next) => {
    if (!req.session.sessionId) {
      req.session.sessionId = uuidv4();
      console.log('New session ID generated:', req.session.sessionId);
    } else {
      console.log('Existing session ID:', req.session.sessionId);
    }
    next();
  });


  app.get('/cart', (req, res) => {
    if (req.session.user) {
      res.json({ userId: req.session.user.user_id });
    } else {
      res.status(401).json({ userId: null });
    }
  });


  app.get('/products', (req, res) => {
    res.json(products);
  });
  
  app.post('/login', (req, res) => {
    req.session.user = { user_id: 1 }; // 임의로 user_id 1을 세션에 저장
    res.json({ message: 'User logged in' });
  });
  

  app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    // 여기서 사용자를 인증하는 코드를 추가합니다.
    const userId = 123; // 예시로 사용자의 ID를 123으로 설정합니다.
  
    req.session.userId = userId;
    res.json({ message: 'Login successful' });
  });
  



  // Import routes
 
  const productsRouter = require('./routes/products');
  const cartRouter = require('./routes/cart');
  const checkoutRouter = require('./routes/checkout');
  
  // Use routes
  app.use('/products', productsRouter);
  app.use('/cart', cartRouter);
  app.use('/checkout', checkoutRouter);

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));












module.exports = app;
