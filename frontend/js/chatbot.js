// Firebase and Amadeus integration for chatbot

// 1. Firebase Setup
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
const db = firebase.firestore();

// 2. Handle question submission
$(document).ready(function () {
    $(".chatbot-form-card form").on("submit", function (e) {
        e.preventDefault();
        const question = $("#question").val().trim();
        if (!question) return;
        // Save to Firestore
        db.collection("queries").add({
            question: question,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            // Optionally show a confirmation or clear the form
            $("#question").val("");
            // Show the custom response
            showResponse('custom');
        }).catch((error) => {
            alert("Error saving your question. Please try again.");
            console.error(error);
        });
    });
});

// 3. Amadeus API integration will be added here (OAuth2, search, etc.)
// ... 