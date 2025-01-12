document.addEventListener('DOMContentLoaded', function() {
    const togglePassword = document.querySelector('#togglePassword1');
    const password = document.querySelector('#yourPassword');
  
    togglePassword.addEventListener('click', function() {
      // Toggle the type attribute
      const type = password.getAttribute('type') === 'password' ? 'text' : 'password';
      password.setAttribute('type', type);
  
      // Toggle the eye icon
      this.querySelector('i').classList.toggle('fa-eye');
      this.querySelector('i').classList.toggle('fa-eye-slash');
    });
});