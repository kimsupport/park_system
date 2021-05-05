
$(document).ready(function() {
  $.ajax({
    url: "/park",
    type: "GET",
    success: function(data){
      $('.empty_space').append(Number(data.park_space) - data.log_list.length)
      $.each(data.log_list, function(index, item) {
        $('.car_storage').append(
          `<tr>
              <td> ${item.car_number} </td>
              <td> ${item.entrance_time} </td>
            </tr>`
        )
      })
      
    }
  })
  
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
  
  $(".in_car").on('click', function(e) {
    let space = Number($('.empty_space').text())
    if (space <= 0) {
      alert('주차장이 가득 찼습니다.');
      $(".input_carNumber").val('')
      e.preventDefault();
      return;
    } else {
      const re = /^[0-9]{2,3}[가-힣]{1}[\s][0-9]{4}$/gi;
      if (!(re.test($(".input_carNumber").val()))) {
        alert("차량 번호형식을 맞춰주세요!");
        return;
      } else {
        
        const xhr = $.ajax({
          url:"/car_in",
          type:'GET',
          data: { 'car_number' : $(".input_carNumber").val()},
          success: function(data) {
            const space =  Number(Number(data.park_space) - data.log_list.length)
            if (space <= 0) {
              alert('주차공간이 없습니다.');
              xhr.abort();
              return;
            }
            $('.input_carNumber').text('');
            $('.empty_space').text(Number(data.park_space) - data.log_list.length)
            
            if(data.carOverlap) {
              alert('이미 주차장에 있는 차량입니다.');
              e.preventDefault();
            } else {
              $('.car_storage').remove();
              $('.park_list table').append(
                `
                <tbody class="car_storage">
                  <tr>
                    <td> </td>
                    <td> </td>
                  </tr>
                </tbody>
                `
              )
              $.each(data.log_list, function(index, value) {
                $('.car_storage').append(
                  `<tr>
                      <td> ${value.car_number} </td>
                      <td> ${value.entrance_time} </td>
                  </tr>`
                )
              })
            }
          }
        });
      }
    }
  })
  
  $(".out_car").on('click', function(e) {
    e.preventDefault();
    const re = /^[0-9]{2,3}[가-힣]{1}[\s][0-9]{4}$/gi;
    if (!(re.test($(".output_carNumber").val()))) {
      alert("주차되어있는 차량번호를 입력하세요!");
      return;
    } else {
      $.ajax({
        url:"/car_out",
        type:"GET",
        data: { 'car_number' : $(".output_carNumber").val()},
        success: function(data) {
          console.log(data.is_car);
          if (data.is_car === '차있다!') {
            location.href = `exit?car_number=${data.car_log[0].car_number}&entrance_time=${data.car_log[0].entrance_time}&exit_time=${data.exit_time}&total_fee=${data.total_fee}&routine=${data.routine_car}&routine_term=${data.routine_term}`;
          } else {
            location.href = `?is_car=true`;
          }
        }
      })
    }
  })
})

