document.getElementById("login-form").addEventListener("submit", function(event) {
  event.preventDefault();
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  const savedUsername = localStorage.getItem("username");
  const savedPassword = localStorage.getItem("password");

  if (username === savedUsername && password === savedPassword) {
      window.location.href = "dashboard.html";
  } else {
      alert("Invalid username or password. Please try again.");
  }
});
