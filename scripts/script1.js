// Handle signup
const signupForm = document.getElementById('signupForm');
if (signupForm) {
	signupForm.addEventListener('submit', function (e) {
		e.preventDefault();

		const username = document.getElementById('signupUsername').value;
		const password = document.getElementById('signupPassword').value;

		if (localStorage.getItem(username)) {
			alert('Username already exists! Please choose another one.');
		} else {
			localStorage.setItem(username, password);
			alert('Signup successful! You can now log in.');
			window.location.href = 'login.html'; // Redirect to login after successful signup
		}
	});
}

// Handle login
const loginForm = document.getElementById('loginForm');
if (loginForm) {
	loginForm.addEventListener('submit', function (e) {
		e.preventDefault();

		const username = document.getElementById('loginUsername').value;
		const password = document.getElementById('loginPassword').value;

		const storedPassword = localStorage.getItem(username);

		if (storedPassword && storedPassword === password) {
			localStorage.setItem('loggedInUser', username);
			alert('Login successful!');
			window.location.href = 'index.html'; // Redirect to index page after successful login
		} else {
			alert('Invalid credentials. Please try again.');
		}
	});
}