$('.enroll').on('click', function(e) {
  const id = $('form [name="id"]').val();
  const password = $('form [name="password"]').val();
  if (!(id) || !(password)) {
    e.preventDefault();
    alert('ID와 PASSWORD를 입력해주세요!');
    return
  }
})