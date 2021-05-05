$('.login').on('click', function(e) {
  if (!($('form [name="id"]').val()) || !($('form [name="password"]').val())) {
    e.preventDefault();
    alert("ID와 PASSWORD 모두 입력해주세요!");
    return;
  }
})