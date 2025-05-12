// auth.js

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDW2bIfUGjKSWFmsazAxgbEv8kJwvmOPkI",
    authDomain: "aerofinder-d6590.firebaseapp.com",
    projectId: "aerofinder-d6590",
    storageBucket: "aerofinder-d6590.firebasestorage.app",
    messagingSenderId: "504288222048",
    appId: "1:504288222048:web:921c78ca22b5f054d85c05",
    measurementId: "G-G49F97JRVY"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Set persistence to LOCAL (persists even after browser restart)
firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
    .catch((error) => {
        console.error("Auth persistence error:", error);
    });

// Function to update UI based on auth state
function updateAuthUI(user) {
    const authButtons = document.querySelector('.auth-buttons');
    if (!authButtons) return;

    if (user) {
        // User is signed in
        console.log('User is signed in:', user);
        authButtons.innerHTML = `
            <a href="dashboard.html" class="btn btn-outline">My Account</a>
            <button onclick="signOut()" class="btn btn-primary">Sign Out</button>
        `;
    } else {
        // User is signed out
        console.log('User is signed out');
        authButtons.innerHTML = `
            <a href="register.html" class="btn btn-outline">Register</a>
            <a href="login.html" class="btn btn-primary">Login</a>
        `;
    }
}

// Listen for auth state changes
firebase.auth().onAuthStateChanged((user) => {
    updateAuthUI(user);
});

$(document).ready(function () {
    // Handle the registration form submission
    $('#registration-form').submit(function (event) {
        event.preventDefault();

        const email = $('#email').val();
        const password = $('#password').val();
        const confirmPassword = $('#confirm-password').val();
        const name = $('#name').val();

        // Basic validation
        if (!email || !password) {
            alert('Please enter both email and password.');
            return;
        }

        if (password !== confirmPassword) {
            alert('Passwords do not match!');
            return;
        }

        // Create user with Firebase
        firebase.auth().createUserWithEmailAndPassword(email, password)
            .then((userCredential) => {
                // Registration successful
                const user = userCredential.user;
                // Update user profile with name
                return user.updateProfile({
                    displayName: name
                }).then(() => {
                    console.log('Registration successful:', user);
                    alert('Registration successful!');
                    window.location.href = 'dashboard.html';
                });
            })
            .catch((error) => {
                // Handle registration errors
                console.error('Registration failed:', error);
                alert('Registration failed: ' + error.message);
            });
    });
});

// Sign out function
function signOut() {
    firebase.auth().signOut()
        .then(() => {
            console.log('User signed out');
            window.location.href = 'index.html';
        })
        .catch((error) => {
            console.error('Sign out error:', error);
        });
}

// Function to bookmark a flight
function bookmarkFlight(flightId) {
    const user = firebase.auth().currentUser;
    if (!user) {
        alert('Please log in to bookmark flights');
        return;
    }

    const db = firebase.firestore();
    db.collection('users').doc(user.uid).collection('bookmarks').doc(flightId).set({
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    })
        .then(() => {
            console.log('Flight bookmarked successfully');
        })
        .catch((error) => {
            console.error('Error bookmarking flight:', error);
        });
}
