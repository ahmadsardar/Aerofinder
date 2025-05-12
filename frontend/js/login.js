// login.js
$(document).ready(function () {
    // Check if user is already logged in
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            // User is already logged in, redirect to dashboard
            window.location.href = 'dashboard.html';
        }
    });

    // Handle login form submission
    $('#login-form').submit(function (event) {
        event.preventDefault();

        const email = $('#email').val();
        const password = $('#password').val();

        if (!email || !password) {
            alert('Please enter both email and password.');
            return;
        }

        // Show loading state
        const submitButton = $(this).find('button[type="submit"]');
        const originalText = submitButton.text();
        submitButton.prop('disabled', true).text('Logging in...');

        // Sign in with Firebase
        firebase.auth().signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                // Login successful
                const user = userCredential.user;
                console.log('Login successful:', user);
                window.location.href = 'dashboard.html';
            })
            .catch((error) => {
                // Handle login errors
                console.error('Login failed:', error);
                alert('Login failed: ' + error.message);
            })
            .finally(() => {
                // Reset button state
                submitButton.prop('disabled', false).text(originalText);
            });
    });
}); 