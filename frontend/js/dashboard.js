// dashboard.js
$(document).ready(function () {
    // Check if user is logged in
    firebase.auth().onAuthStateChanged((user) => {
        if (!user) {
            // If not logged in, redirect to login page
            window.location.href = 'login.html';
        } else {
            // User is logged in, load dashboard data
            loadUserProfile(user);
            loadUserBookmarks(user);
        }
    });
});

function loadUserProfile(user) {
    // Update profile information
    $('.profile-info h2').text(user.displayName || 'User');
    $('.profile-info p').text(user.email);
}

function loadUserBookmarks(user) {
    const db = firebase.firestore();
    db.collection('users').doc(user.uid).collection('bookmarks')
        .orderBy('timestamp', 'desc')
        .get()
        .then((querySnapshot) => {
            const bookmarksList = $('.bookmarks-list');
            bookmarksList.empty();

            if (querySnapshot.empty) {
                bookmarksList.html('<p class="no-bookmarks">No bookmarked flights yet.</p>');
                return;
            }

            querySnapshot.forEach((doc) => {
                const bookmark = doc.data();
                // Create bookmark card
                const bookmarkCard = `
                    <div class="bookmark-card">
                        <h4>${bookmark.flightNumber || 'Flight'}</h4>
                        <p>From: ${bookmark.from || 'N/A'}</p>
                        <p>To: ${bookmark.to || 'N/A'}</p>
                        <p>Date: ${bookmark.date || 'N/A'}</p>
                        <button onclick="removeBookmark('${doc.id}')" class="remove-bookmark-btn">
                            Remove Bookmark
                        </button>
                    </div>
                `;
                bookmarksList.append(bookmarkCard);
            });
        })
        .catch((error) => {
            console.error('Error loading bookmarks:', error);
            $('.bookmarks-list').html('<p class="error">Error loading bookmarks.</p>');
        });
}

function removeBookmark(bookmarkId) {
    const user = firebase.auth().currentUser;
    if (!user) return;

    const db = firebase.firestore();
    db.collection('users').doc(user.uid).collection('bookmarks').doc(bookmarkId)
        .delete()
        .then(() => {
            console.log('Bookmark removed successfully');
            // Reload bookmarks
            loadUserBookmarks(user);
        })
        .catch((error) => {
            console.error('Error removing bookmark:', error);
            alert('Error removing bookmark. Please try again.');
        });
} 