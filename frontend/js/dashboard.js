// dashboard.js

// Helper: Format duration from ISO 8601 to 'X hrs Y mins'
function formatDuration(isoDuration) {
    const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
    if (!match) return isoDuration;
    const hours = match[1] ? parseInt(match[1]) : 0;
    const mins = match[2] ? parseInt(match[2]) : 0;
    let result = '';
    if (hours > 0) result += `${hours} hr${hours > 1 ? 's' : ''}`;
    if (hours > 0 && mins > 0) result += ' ';
    if (mins > 0) result += `${mins} min${mins > 1 ? 's' : ''}`;
    return result || '0 mins';
}

// Helper: Format ISO datetime to 'HH:mm' (local time)
function formatTime(isoString) {
    if (!isoString) return '';
    const date = new Date(isoString);
    const hours = date.getHours().toString().padStart(2, '0');
    const mins = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${mins}`;
}

// Helper: Show notification
function showNotification(message) {
    // Create notification element if it doesn't exist
    let notification = document.getElementById('saveNotification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'saveNotification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background-color: #4CAF50;
            color: white;
            padding: 16px;
            border-radius: 4px;
            z-index: 1000;
            opacity: 0;
            transition: opacity 0.3s ease-in-out;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        `;
        document.body.appendChild(notification);
    }
    
    // Show notification
    notification.textContent = message;
    notification.style.opacity = '1';
    
    // Hide after 2 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
    }, 2000);
}

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
                const flight = doc.data();
                const offer = flight.itineraries[0];
                const segment = offer.segments[0];
                const price = flight.price.total;
                const currency = flight.price.currency;

                const bookmarkCard = `
                    <div class="flight-card">
                        <div class="flight-header">
                            <div>
                                <div class="flight-route">
                                    ${segment.departure.iataCode} → ${segment.arrival.iataCode}
                                </div>
                                <h3>${segment.carrierCode} ${segment.number}</h3>
                                <div class="flight-meta">
                                    <span>${segment.aircraft.code}</span>
                                    <span>•</span>
                                    <span>${flight.travelerPricings[0].fareDetailsBySegment[0].cabin}</span>
                                </div>
                            </div>
                            <div class="price-highlight">${currency} ${price}</div>
                        </div>
                        <div class="flight-details">
                            <div class="detail-item">
                                <span class="detail-label">Departure</span>
                                <span>${formatTime(segment.departure.at)} (${segment.departure.iataCode})</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Arrival</span>
                                <span>${formatTime(segment.arrival.at)} (${segment.arrival.iataCode})</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Duration</span>
                                <span>${formatDuration(offer.duration)}</span>
                            </div>
                        </div>
                        <div class="action-buttons">
                            <button class="btn btn-primary" onclick="bookFlight('${segment.departure.iataCode}', '${segment.arrival.iataCode}', '${segment.departure.at}', '${segment.carrierCode} ${segment.number}')">Book Now</button>
                            <button onclick="removeBookmark('${doc.id}')" class="btn btn-outline">Remove</button>
                        </div>
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
            showNotification('Flight removed successfully');
            // Reload bookmarks
            loadUserBookmarks(user);
        })
        .catch((error) => {
            console.error('Error removing bookmark:', error);
            showNotification('Error removing flight. Please try again.');
        });
}

// Book flight on Skyscanner with confirmation modal
let skyscannerUrlToBook = null;
function bookFlight(origin, destination, date, flightNumber) {
    // Format date as YYMMDD
    const d = new Date(date);
    const y = d.getFullYear().toString().slice(2);
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    const dateStr = `${y}${m}${day}`;
    const url = `https://www.skyscanner.net/transport/flights/${origin.toLowerCase()}/${destination.toLowerCase()}/${dateStr}/`;
    skyscannerUrlToBook = url;
    
    // Show modal
    const modal = document.getElementById('bookModal');
    const msg = document.getElementById('bookModalMsg');
    if (modal && msg) {
        msg.innerHTML = `You will be redirected to a flight booking website. Please select flight <b>${flightNumber}</b> on the next page.`;
        modal.style.display = 'flex';
    }
}

// Add modal event listeners
$(document).ready(function() {
    // Previous ready function content
    firebase.auth().onAuthStateChanged((user) => {
        if (!user) {
            window.location.href = 'login.html';
        } else {
            loadUserProfile(user);
            loadUserBookmarks(user);
        }
    });

    // Add modal button handlers
    const continueBtn = document.getElementById('continueToSkyscanner');
    const cancelBtn = document.getElementById('cancelBookModal');
    const modal = document.getElementById('bookModal');

    if (continueBtn) {
        continueBtn.onclick = function() {
            if (skyscannerUrlToBook) {
                window.open(skyscannerUrlToBook, '_blank');
            }
            if (modal) modal.style.display = 'none';
        };
    }

    if (cancelBtn) {
        cancelBtn.onclick = function() {
            if (modal) modal.style.display = 'none';
        };
    }
}); 