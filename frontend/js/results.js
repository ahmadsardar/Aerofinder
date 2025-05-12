// results.js

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

function saveFlight(flightId) {
    let flights = [];
    try {
        flights = JSON.parse(localStorage.getItem('flightResults')) || [];
    } catch {
        flights = [];
    }
    const flight = flights.find(f => f.id === flightId);
    if (!flight) return;
    let bookmarks = [];
    try {
        bookmarks = JSON.parse(localStorage.getItem('bookmarkedFlights')) || [];
    } catch {
        bookmarks = [];
    }
    // Prevent duplicates
    if (!bookmarks.some(f => f.id === flightId)) {
        bookmarks.push(flight);
        localStorage.setItem('bookmarkedFlights', JSON.stringify(bookmarks));
    }
    // Update button UI
    const btn = document.querySelector(`button[data-save-id='${flightId}']`);
    if (btn) {
        btn.textContent = 'Saved';
        btn.disabled = true;
        btn.classList.add('btn-disabled');
    }
}

function createFlightCard(flight) {
    const offer = flight.itineraries[0];
    const segment = offer.segments[0];
    const price = flight.price.total;
    const currency = flight.price.currency;
    // Check if already bookmarked
    let isBookmarked = false;
    try {
        const bookmarks = JSON.parse(localStorage.getItem('bookmarkedFlights')) || [];
        isBookmarked = bookmarks.some(f => f.id === flight.id);
    } catch { }
    return `
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
                <button class="btn btn-primary" onclick="bookFlight('${segment.departure.iataCode}', '${segment.arrival.iataCode}', '${segment.departure.at}', '${segment.carrierCode} ${segment.number}')\">Book Now</button>
                <button class="btn btn-outline${isBookmarked ? ' btn-disabled' : ''}\" data-save-id='${flight.id}' onclick=\"saveFlight('${flight.id}')\" ${isBookmarked ? 'disabled' : ''}>${isBookmarked ? 'Saved' : 'Save'}</button>
            </div>
        </div>
    `;
}

function getDurationMinutes(isoDuration) {
    const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
    if (!match) return 0;
    const hours = match[1] ? parseInt(match[1]) : 0;
    const mins = match[2] ? parseInt(match[2]) : 0;
    return hours * 60 + mins;
}

function renderResults(flights) {
    const container = document.getElementById('flightResults');
    if (!flights || flights.length === 0) {
        container.innerHTML = '<div class="no-results">No flights found</div>';
        return;
    }
    container.innerHTML = flights.map(createFlightCard).join('');
}

function sortResults(flights, sortType) {
    const sorted = [...flights];
    switch (sortType) {
        case 'price-asc':
            sorted.sort((a, b) => parseFloat(a.price.total) - parseFloat(b.price.total));
            break;
        case 'price-desc':
            sorted.sort((a, b) => parseFloat(b.price.total) - parseFloat(a.price.total));
            break;
        case 'duration-asc':
            sorted.sort((a, b) => getDurationMinutes(a.itineraries[0].duration) - getDurationMinutes(b.itineraries[0].duration));
            break;
        case 'duration-desc':
            sorted.sort((a, b) => getDurationMinutes(b.itineraries[0].duration) - getDurationMinutes(a.itineraries[0].duration));
            break;
    }
    return sorted;
}

function getUniqueAirlines(flights) {
    const airlines = new Map();
    flights.forEach(flight => {
        const segment = flight.itineraries[0].segments[0];
        const code = segment.carrierCode;
        airlines.set(code, getAirlineName(code));
    });
    return Array.from(airlines.entries()); // [[code, name], ...]
}

function getAirlineName(code) {
    // Add more airlines as needed
    const names = {
        'DL': 'Delta',
        'UA': 'United',
        'AA': 'American',
        'BA': 'British Airways',
        'LH': 'Lufthansa',
        'SK': 'SAS',
        'AF': 'Air France',
        'KL': 'KLM',
        'IB': 'Iberia',
        'AZ': 'ITA Airways',
        'TK': 'Turkish Airlines',
        'EK': 'Emirates',
        'QR': 'Qatar Airways',
        'SQ': 'Singapore Airlines',
        'QF': 'Qantas',
        'AC': 'Air Canada',
        'NH': 'ANA',
        'JL': 'JAL',
        'CX': 'Cathay Pacific',
        'ET': 'Ethiopian',
        'AI': 'Air India',
        'VS': 'Virgin Atlantic',
        'WN': 'Southwest',
        'FR': 'Ryanair',
        'U2': 'easyJet',
        'VY': 'Vueling',
        'LX': 'SWISS',
        'OS': 'Austrian',
        'SN': 'Brussels Airlines',
        'AY': 'Finnair',
        'SU': 'Aeroflot',
        'LO': 'LOT',
        'TP': 'TAP',
        'IB': 'Iberia',
        'A3': 'Aegean',
        'EI': 'Aer Lingus',
        'S7': 'S7 Airlines',
        'PS': 'Ukraine Intl',
        'RO': 'TAROM',
        'OK': 'Czech Airlines',
        'BT': 'airBaltic',
        'RO': 'TAROM',
        'OA': 'Olympic Air',
        'JU': 'Air Serbia',
        'FB': 'Bulgaria Air',
        'HV': 'Transavia',
        'PC': 'Pegasus',
        'X3': 'TUIfly',
        'DE': 'Condor',
        'EW': 'Eurowings',
        'EN': 'Air Dolomiti',
        'LG': 'Luxair',
        'OU': 'Croatia Airlines',
        'YM': 'Montenegro Airlines',
        'JP': 'Adria Airways',
        'BT': 'airBaltic',
        'HV': 'Transavia',
        'U2': 'easyJet',
        'VY': 'Vueling',
        'FR': 'Ryanair',
        'W6': 'Wizz Air',
        'D8': 'Norwegian',
        'DY': 'Norwegian',
        'FI': 'Icelandair',
        'WW': 'WOW air',
        'LS': 'Jet2',
        'MT': 'Thomas Cook',
        'BY': 'TUI Airways',
        'TCX': 'Thomas Cook',
        'BAW': 'British Airways',
        'SWR': 'SWISS',
        'DLH': 'Lufthansa',
        'KLM': 'KLM',
        'AFR': 'Air France',
        'IBE': 'Iberia',
        'UAE': 'Emirates',
        'QTR': 'Qatar Airways',
        'SAS': 'SAS',
        'TAP': 'TAP',
        'AAL': 'American',
        'UAL': 'United',
        'DAL': 'Delta',
        'ACA': 'Air Canada',
        'ANA': 'ANA',
        'JAL': 'JAL',
        'CPA': 'Cathay Pacific',
        'SIA': 'Singapore Airlines',
        'QFA': 'Qantas',
        'ETD': 'Etihad',
        'THY': 'Turkish Airlines',
        'EZY': 'easyJet',
        'RYR': 'Ryanair',
        'VLG': 'Vueling',
        'WZZ': 'Wizz Air',
    };
    return names[code] || code;
}

function renderAirlineFilter(flights) {
    const airlineFilter = document.getElementById('airlineFilter');
    if (!airlineFilter) return;
    const airlines = getUniqueAirlines(flights);
    airlineFilter.innerHTML = '<option value="all">All Airlines</option>' +
        airlines.map(([code, name]) => `<option value="${code}">${name}</option>`).join('');
}

function filterByAirline(flights, airlineCode) {
    if (!airlineCode || airlineCode === 'all') return flights;
    return flights.filter(flight => flight.itineraries[0].segments[0].carrierCode === airlineCode);
}

function renderBookmarkedFlights() {
    const container = document.getElementById('bookmarkedFlights');
    let bookmarks = [];
    try {
        bookmarks = JSON.parse(localStorage.getItem('bookmarkedFlights')) || [];
    } catch {
        bookmarks = [];
    }
    if (!container) return;
    if (!bookmarks.length) {
        container.innerHTML = '<div class="no-results">No bookmarked flights yet.</div>';
        return;
    }
    container.innerHTML = bookmarks.map(createFlightCard).join('');
}

// Main
window.addEventListener('DOMContentLoaded', () => {
    let flights = [];
    try {
        flights = JSON.parse(localStorage.getItem('flightResults')) || [];
    } catch {
        flights = [];
    }
    renderAirlineFilter(flights);
    renderResults(flights);
    renderBookmarkedFlights();

    const sortSelect = document.getElementById('sortSelect');
    const airlineFilter = document.getElementById('airlineFilter');
    let currentSort = sortSelect.value;
    let currentAirline = airlineFilter.value;

    function updateResults() {
        let filtered = filterByAirline(flights, currentAirline);
        let sorted = sortResults(filtered, currentSort);
        renderResults(sorted);
    }

    sortSelect.addEventListener('change', () => {
        currentSort = sortSelect.value;
        updateResults();
    });
    airlineFilter.addEventListener('change', () => {
        currentAirline = airlineFilter.value;
        updateResults();
    });

    const continueBtn = document.getElementById('continueToSkyscanner');
    const cancelBtn = document.getElementById('cancelBookModal');
    const modal = document.getElementById('bookModal');
    if (continueBtn) {
        continueBtn.textContent = 'Continue to Booking';
        continueBtn.onclick = function () {
            if (skyscannerUrlToBook) {
                window.open(skyscannerUrlToBook, '_blank');
            }
            if (modal) modal.style.display = 'none';
        };
    }
    if (cancelBtn) {
        cancelBtn.onclick = function () {
            if (modal) modal.style.display = 'none';
        };
    }
}); 