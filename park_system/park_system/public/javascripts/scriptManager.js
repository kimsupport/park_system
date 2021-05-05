let flag_cou = false;
let flag_car = false;
let flag_log = false;

$('.header h1').on('click', function() {
  location.href = '/';
})

$('.main').on('click', function() {
  location.href = '/'
})

$('.logout').on('click', function() {
  location.href= 'logout'
})

$('.lookup_cou').on('click', function() {
  if (flag_cou) {
    flag_cou = false;
  } else {
    flag_cou = true
  }

  if (flag_cou) {
    $.ajax({
      url: '/lookup_cou',
      type: "GET",
      success: function(data) {
        $('.look_up_cou').append(
          `
          <table class="lookup_cou_list">
            <th> 쿠폰번호 </th>
            <th> 쿠폰할인금액 </th>
            <tr> 
              <td> </td>
              <td> </td>
            </tr>  
          <table>
          `
        )
        const cou_list = data.cou_list;
        $.each(cou_list, function(index, value) {
          $('.lookup_cou_list').append(
            `
            <tr>
              <td> ${value.coupon_code} </td>
              <td> ${value.coupon_price}</td>
            </tr>
            `
          )
        })
      }
    })
  } else {
    $('.lookup_cou_list').remove();
  }
})

$('.lookup_car').on('click', function() {
  if (flag_car) {
    flag_car = false;
  } else {
    flag_car = true
  }

  if (flag_car) {
    $.ajax({
      url: '/lookup_car',
      type: "GET",
      success: function(data) {
        console.log(data.car_list);
        $('.look_up_car').append(
          `
          <table class="lookup_car_list">
            <th> 차량번호 </th>
            <th> 정기차량 여부 </th>
            <th> 정기 기간 </th>
            <tr> 
              <td> </td>
              <td> </td>
              <td> </td>
            </tr>  
          <table>
          `
        )
        const car_list = data.car_list;
        $.each(car_list, function(index, value) {
          if(value.routine_car){
            value.routine_car = '정기차량'
          } else {
            value.routine_car = '비정기차량'
          }
          if(!(value.routine_term)){
            value.routine_term = '-미등록-'
          }
          $('.lookup_car_list').append(
            `
            <tr>
              <td> ${value.car_number} </td>
              <td> ${value.routine_car} </td>
              <td> ${value.routine_term} </td>
            </tr>
            `
          )
        })
      }
    })
  } else {
    $('.lookup_car_list').remove();
  }
})

$('.lookup_log').on('click', function() {
  if (flag_log) {
    flag_log = false;
  } else {
    flag_log = true
  }

  if (flag_log) {
    $.ajax({
      url: '/lookup_log',
      type: "GET",
      success: function(data) {
        console.log(data.log_list);
        $('.look_up_log').append(
          `
          <table class="lookup_log_list">
            <th> 차량번호 </th>
            <th> 입차시간 </th>
            <th> 출차시간 </th>
            <th> 주차비용 </th>
            <tr> 
              <td> </td>
              <td> </td>
              <td> </td>
              <td> </td>
            </tr>  
          <table>
          `
        )
        const log_list = data.log_list;
        $.each(log_list, function(index, value) {
          if (!(value.exit_time)) {
            value.exit_time = '아직 출차하지 않았습니다.'
          }

          if (value.total_fee === null) {
            value.total_fee = '-주차중-'
          }

          $('.lookup_log_list').append(
            `
            <tr>
              <td> ${value.car_number} </td>
              <td> ${value.entrance_time} </td>
              <td> ${value.exit_time} </td>
              <td> ${value.total_fee} </td>
            </tr>
            `
          )
        })
      }
    })
  } else {
    $('.lookup_log_list').remove();
  }
})


$('.coupon form button').on('click', function(e) {
  if(!$('.coupon form [name="coupon_code"]').val()) {
    e.preventDefault();
    alert("쿠폰 코드를 입력해주세요!");
    return
  }
})

$('.car_reg form button').on('click', function(e) {
  
  const re = /^[0-9]{2,3}[가-힣]{1}[\s][0-9]{4}$/gi;
  if (!(re.test($('.car_reg form [name="car_number"]').val()))) {
    e.preventDefault();
    alert('차량번호를 알맞게 입력하세요!');
    return;    
  }

  if(!($('.car_reg form [name="routine_term"]').val())) {
    e.preventDefault();
    alert('날짜를 입력하세요.');
    return;
  }
  
  let submit_date = $('.car_reg form [name="routine_term"]').val()
  const date = new Date();
  const submitYear = Number(submit_date.substring(0,4));
  const submitMonth = Number(submit_date.substring(5,7));
  const submitDate = Number(submit_date.substring(8,10));
  
  const todayYear = date.getFullYear();
  const todayMonth = date.getMonth()+1;
  const todayDate = date.getDate();
  if (submitYear < todayYear || submitMonth < todayMonth || submitDate <= todayDate) {
    e.preventDefault()
    alert('정기 기한은 오늘 이후부터, 즉 내일부터 지정할 수 있습니다.');
    return;
  }
  
  })

