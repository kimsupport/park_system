var express = require('express');
var moment = require('moment');
require('moment-timezone');
moment.tz.setDefault("Asia/Seoul")
var router = express.Router();

var mysql_dbc = require('../config/database')();
var connection = mysql_dbc.init();
mysql_dbc.test_open(connection);

/* 매니저 페이지 기본 설정 사항들 */
let park_space = 300;
let unit_time = 30;
let unit_fee = 5000;
let balance = 0;
let is_car = false;
let is_term = false;
let date = moment().format('YYYY-MM-DD');


/* GET home page. */
router.get('/', function(req, res, next) {
  let session = req.session;
  is_car = req.query.is_car;
  
  connection.query('select * from car', function(err, rows, field) {
    for(item of rows) {
      if (item.routine_term !== null) {
        if (date > item.routine_term) {
          connection.query(`update car set routine_car = 0 where car_number = '${item.car_number}'`,function(err, rows, field) {
            if (err) console.log(err);
            console.log(rows);
          })
          connection.query(`update car set routine_term = NULL where car_number = '${item.car_number}'`, function(err, rows, field) {
            if (err) console.log(err);
            console.log(rows);
          })
        }
      }
    }
  })

  connection.query('select * from car_log where exit_time IS NULL;', function(error, log_list, fields) {
    if (!error) {
      res.render('main', { 
        log_list : log_list, 
        session : session,
        park_space : park_space - log_list.length,
        is_car : is_car
      });
    } else {
      console.log('query error : ', error);
    }
  })
});

/* main ajax방식으로 주차장에 있는 거 뿌려주기용 */
router.get('/park', function(req, res, next) {
  connection.query('select * from car_log where exit_time IS NULL;', function(error, log_list, fields) {
    if (!error) {
      res.send({ 
        log_list : log_list,
        park_space : park_space
      });
    } else {
      console.log('query error : ', error);
    }
  })
})

/* 주차장에 차량이 들어왔을 때! */
router.get('/car_in', function(req, res, next) {
  console.log('왜 씹혀?');
  connection.query(`select car_number from car_log where car_number = '${req.query.car_number}' AND exit_time IS NULL`, function(err, row, field) {
    if (err) console.log(err);
    
    if(row[0] !== undefined && req.query.car_number === row[0].car_number){
      connection.query(`select * from car_log where exit_time IS NULL`, function(err, log_list, field) {
        if(err) console.log(err);
        res.send({
          log_list : log_list,
          park_space : park_space,
          carOverlap : 1
        })
      })
    } else {
      connection.query(`select car_number from car where car_number = '${req.query.car_number}'`, function(err, row, field) {
        if (err) console.log(err);
        if (row[0] !== undefined && row[0].car_number === req.query.car_number) {
          connection.query(`insert into car_log (car_number, entrance_time) value ('${req.query.car_number}', now());`, function(err, rows, fields){
            if (err) console.log(err);
            console.log(rows);
          });
          connection.query(`select * from car_log where exit_time IS NULL`, function(err, log_list, field) {
            if(err) console.log(err);
            res.send({
              log_list : log_list,
              park_space : park_space,
              carOverlap : 0
            })
          })
        } else {
          connection.query(`insert into car (car_number, routine_car) value ('${req.query.car_number}', 0);`, function(err, rows, fields){
            if (err) console.log(err);
            console.log(rows);
          });
          connection.query(`insert into car_log (car_number, entrance_time) value ('${req.query.car_number}', now());`, function(err, rows, fields){
            if (err) console.log(err);
            console.log(rows);
          });
          connection.query(`select * from car_log where exit_time IS NULL`, function(err, log_list, field) {
            if(err) console.log(err);
            res.send({
              log_list : log_list,
              park_space : park_space,
              carOverlap : 0
            })
          })
        }
      })
    } 
  })
})

/* 주차장에서 차량이 나갈때 */
router.get('/car_out', function(req, res, next) {
  console.log('차빠진다');
  let dateTime = moment().format('YYYY-MM-DD HH:mm:ss');
  connection.query(`select * from car_log where car_number = '${req.query.car_number}' AND exit_time IS NULL`, function(err, row, field) {
    if (err) console.log(err);
    if (row[0] !== undefined) {
      connection.query(`select * from car where car_number = '${req.query.car_number}'`, function(err, rows, field) {
        if(err) console.log(err)
        res.send({
          is_car: '차있다!',
          car_log: row,
          exit_time: dateTime,
          total_fee: Math.floor((Math.floor(Date.parse(dateTime) - Date.parse(row[0].entrance_time)) / 1000 / 60) / unit_time) * unit_fee,
          routine_car: rows[0].routine_car,
          routine_term: rows[0].routine_term
        })
      })
    } else {
      console.log('밑이야?')
      res.send({
        is_car: '차없다!'
      });
    }
  })
})

/* 결제 페이지 */
router.get('/exit', function(req, res, next) {
  let session = req.session;
  res.render('exit', { 
    car_info : req.query,
    session : session,
  })
})

/* 결제시 쿠폰이 튀어나가는 라우터 */
router.get('/pay_cou', function(req, res, next) {
  const query = req.query;
  connection.query(`select * from coupon where coupon_code = '${query.cou_code}'`, function(err, row, field) {
    if (err) console.log(err);
    if (row[0] !== undefined) {
      console.log(row[0]);
      res.send({
        is_coupon: '쿠폰 있다.',
        cou_price: row[0].coupon_price
      })
    } else {
      res.send({
        is_coupon: '쿠폰 없다.'
      })
    }
  })
})

/* 실제 결제가 되고, 정산이 되는 라우터 */
router.get('/payment', function(req, res, next) {
  console.log('결제 진행!');
  const query = req.query;
  
  connection.query(`update car_log set exit_time = '${query.car_exit}', total_fee='${query.end_fee}' where car_number='${query.car_number}' AND total_fee IS NULL`, function(err, row, field) {
    if (err) console.log(err);
    console.log(row);
  })
  if (query.cou_code !== '') {
    connection.query(`delete from coupon where coupon_code = '${query.cou_code}'`,function(err, row, field) {
      if (err) console.log(err);
      console.log(row);
    })
    connection.query(`update car_log set total_fee = ${query.end_fee} where car_number = '${query.car_number}' AND entrance_time = '${query.car_entrance}'`, function(err, row, field) {
      if (err) console.log(err);
      console.log(row);
    })
  } else {
    connection.query(`update car_log set total_fee = ${query.end_fee} where car_number = '${query.car_number}' AND entrance_time = '${query.car_entrance}'`, function(err, row, field) {
      if (err) console.log(err);
      console.log(row);
    })
  }
  balance += Number(query.end_fee);
  res.send('a');
})

router.get('/routine_payment', function(req, res, next) {
  console.log('정기 결제 진행!');
  const query = req.query;

  connection.query(`update car_log set exit_time = '${query.exit_time}', total_fee= 0 where car_number='${query.car_number}' AND total_fee IS NULL`, function(err, row, field) {
    if (err) console.log(err);
    console.log(row);
  })
  res.send('a');
})

/* GET login page */
router.get('/login', function(req, res, next) {
  res.render('login', { pass : false });
})

/* post 실제 로그인 수행 */
router.post('/login', async function(req, res, next) {
  let body = req.body;
  let result = [];
  connection.query(`select * from management where employee_id='${req.body.id}';`, function(err, rows, field) {
    if (err) console.log(err);
    result = rows[0];
    if (result !== undefined){
      if (body.password === result.employee_password) {
        console.log('비밀번호 일치!');
        req.session.manager_id = body.id;
        res.redirect('/')
      } else {
        console.log('-비- 불일치!')
        res.render('login', { pass : true });
      }
    } else {
      res.render('login', { pass : true });
    }
  })
})

/* logout 수행 */
router.get('/logout', function(req, res, next) {
  req.session.destroy();
  res.clearCookie('sid');
  res.redirect('/')
})

/* 관리자 메인 페이지 */
router.get('/manager', function(req, res, next) {
  let session = req.session;

  res.render('manager', { 
    unit_fee : unit_fee,
    unit_time : unit_time,
    park_space : park_space,
    balance : balance,
    session : session,
    is_term : is_term
  });
})

/* 관리자 등록 페이지 */
router.get('/manager/enroll', function(req, res, next) {
  res.render('enroll', { try_id : false });
})

/* post 관리자 등록 기능 */
router.post('/manager/enroll', function(req, res, next) {
  const body = req.body
  connection.query(`select employee_id from management where employee_id = '${body.id}'`, function(err, row, field) {
    if (err) console.log(err);
    if(row[0] !== undefined && row[0].employee_id === body.id) {
      res.render('enroll', { try_id : true })
    } else {
      connection.query(`insert into management (employee_id, employee_password) value ('${body.id}', '${body.password}');`, function(err, rows, field) {
        if (err) console.log(err);
        console.log(rows);
        res.redirect('/');
      })
    }
  })
  
})

/* 기본 설정용 라우터 */
router.get('/update', function(req, res, next) {
  console.log('update눌렸다.')
  let body = req.query;
  park_space = body.park_space ? body.park_space : 300;
  unit_time = body.unit_time ? body.unit_time : 30;
  unit_fee = body.unit_fee ? body.unit_fee : 5000;
  balance = body.balance ? body.balance : 0;
  
  res.redirect('/manager');
})

/* 쿠폰 등록용 라우터 */
router.get('/cou_reg', function(req, res, next) {
  
  let query = req.query;
  query.coupon_price = query.coupon_price ? query.coupon_price : 5000;
  connection.query(`insert into coupon (coupon_code, coupon_price) value ('${query.coupon_code}', ${query.coupon_price});`, function(err, row, field) {
    if (err) console.log(err);
    console.log(row);
  })

  res.redirect('/manager');
})

/* 정기차량 등록용 라우터 */
router.get('/car_reg', function(req, res, next) {
  connection.query(`select * from car where car_number = '${req.query.car_number}'`, function(err, row, field) {
    if (err) console.log(err);
    if (row[0] === undefined) {
      connection.query(`insert into car (car_number, routine_car, routine_term) value ('${req.query.car_number}', 1, '${req.query.routine_term}');`,function(err, row, field) {
        if (err) console.log(err);
        console.log(row);
        res.redirect('/manager');
      })
    } else {
      connection.query(`update car set routine_car = 1 where car_number='${row[0].car_number}'`, function(err, row, field) {
        if (err) console.log(err);
        console.log(row);
      });
      connection.query(`update car set routine_term = '${req.query.routine_term}' where car_number='${row[0].car_number}'`, function(err, row, field) {
        if (err) console.log(err);
        console.log(row);
        res.redirect('/manager');
      })
    }
  })
})


/* 쿠폰 조회용 라우터 */
router.get('/lookup_cou', function(req, res, next) {
  connection.query(`select * from coupon;`,function(err, rows, field) {
    if (err) console.log(err);
    res.send({
      cou_list : rows
    })
  })
  
})

/* 차량 조회용 라우터 */
router.get('/lookup_car', function(req, res, next) {
  connection.query(`select * from car;`,function(err, rows, field) {
    if (err) console.log(err);
    res.send({
      car_list : rows
    })
  })
  
})

/* 주차장 이용내역 조회용 라우터 */
router.get('/lookup_log', function(req, res, next) {
  connection.query(`select * from car_log;`,function(err, rows, field) {
    if (err) console.log(err);
    res.send({
      log_list : rows
    })
  })  
})

router.get('/check', function(req, res, next) {
  res.render('index');
})

module.exports = router;