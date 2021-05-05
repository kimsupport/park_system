/* 헤더 부분 이벤트 */
$('.header h1').on('click', function() {
  location.href = '/';
}) 

$(".login").on('click', function() {
  location.href = 'login';
})

$(".logout").on('click', function() {
  location.href = 'logout';
})

$(".enroll_manager").on('click', function() {
  location.href = 'manager/enroll';
})

$(".manager_page").on('click', function() {
  location.href = 'manager'
})

/* 쿠폰 제시! 누르면 찍고 돌아와서 쿠폰 금액 업데이트 및 최종 결제금액 업데이트가 이뤄질 것이에오. */
let try_cou = false;

$('.coupon button').on('click', function() {
  const couCode = $('.cou_code').val();
  if (!(couCode) || try_cou) {
    alert('쿠폰 번호를 입력하세요! + 쿠폰 적용은 하나만 할 수 있습니다.');
  } else {
    $.ajax({
      url: 'pay_cou',
      type: 'GET',
      data: { 'cou_code' : couCode },
      success : function(data) {
        
        if (data.is_coupon === '쿠폰 있다.') {
          $('.cou_price').text(data.cou_price);
          if (Number($('.fee').text()) - Number($('.cou_price').text()) >= 0) {
            $('.end_price b').text(Number($('.fee').text()) - Number($('.cou_price').text()));
          } else {
            $('.end_price b').text(0);
          }

          $('.cou_code').attr('readonly', true);
          
          try_cou = true;
        } else {
          $('.cou_code').val('');
          $('.cou_price').text(' 없는 쿠폰입니다.');
        }
      }
    })
  }
})

/* 결제 받은 돈과 최종 결제 금액을 비교해서 크면 보내주고, 작으면 안보내줌 5번 이상 결제시도해서 실패하면 112 부름 
    넘어가면 사용된 쿠폰은 삭제하고 total_fee 업데이트 경찰차와서 터진 건  해주고 메인페이지로 이동하면 끗 */

$('.out_pay').on('click', function() {
  const endPrice = Number($('.end_price b').text());
  const submitPrice = Number($('.pay').val());
  console.log(endPrice, submitPrice);
  if (submitPrice >= endPrice) {
    alert(`결제완료! 거스름돈 : ${submitPrice - endPrice}원`);
    $.ajax({
      url: 'payment',
      type: 'get',
      data: { 
        'car_number' : $('.car_number').text(),
        'car_entrance' : $('.car_entrance').text(),
        'car_exit' : $('.car_exit').text(),
        'cou_code' : $('.cou_code').val(),
        'end_fee' : Number($('.end_price b').text()
      )},
      success: function(data) {
        console.log(data);
        location.href = '/';    
      }
    })
    
  } else {
    alert('부족합니다!');
  }
})

$('.out_car').on('click', function() {
  $.ajax({
    url: 'routine_payment',
    type: 'get',
    data: {
      'car_number': $('.routine_car_number').text(),
      'exit_time': $('.routine_car_exit_time').text()
    },
    success: function(data) {
      location.href = '/';
    }
  })
})

