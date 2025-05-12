// Flight search functionality
class FlightSearch {
    constructor() {
        this.searchForm = document.getElementById('searchForm');
        this.fromInput = document.getElementById('from');
        this.toInput = document.getElementById('to');
        this.departureInput = document.getElementById('departure');
        this.returnInput = document.getElementById('return');
        this.passengersInput = document.getElementById('passengers');
        this.classInput = document.getElementById('class');
        this.priceMinInput = document.getElementById('priceMin');
        this.priceMaxInput = document.getElementById('priceMax');
        this.stopsInput = document.getElementById('stops');
        this.resultsContainer = document.getElementById('flightResults');
        this.accessToken = null;
        this.tokenExpiry = null;
        this.tripType = 'round-trip'; // Default to round-trip

        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Handle form submission
        this.searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.searchFlights();
        });

        // Add autocomplete to airport inputs
        this.setupAirportAutocomplete(this.fromInput);
        this.setupAirportAutocomplete(this.toInput);

        // Set minimum date for departure and return inputs
        const today = new Date().toISOString().split('T')[0];
        this.departureInput.min = today;
        this.returnInput.min = today;

        // Update return date minimum when departure date changes
        this.departureInput.addEventListener('change', () => {
            this.returnInput.min = this.departureInput.value;
            if (this.returnInput.value && this.returnInput.value < this.departureInput.value) {
                this.returnInput.value = this.departureInput.value;
            }
        });

        // Handle trip type toggle
        const tripTypeToggle = document.getElementById('tripType');
        if (tripTypeToggle) {
            tripTypeToggle.addEventListener('change', (e) => {
                this.tripType = e.target.value;
                this.updateReturnDateVisibility();
            });
        }
    }

    updateReturnDateVisibility() {
        const returnDateGroup = document.querySelector('.return-date-group');
        if (returnDateGroup) {
            returnDateGroup.style.display = this.tripType === 'round-trip' ? 'block' : 'none';
            if (this.tripType === 'one-way') {
                this.returnInput.value = ''; // Clear return date for one-way flights
            }
        }
    }

    async getAccessToken() {
        // Check if we have a valid token
        if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
            return this.accessToken;
        }

        try {
            const response = await fetch('http://localhost:5000/api/auth/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            if (data.status === 'success') {
                this.accessToken = data.access_token;
                // Set token expiry (subtract 5 minutes for safety)
                this.tokenExpiry = Date.now() + (data.expires_in - 300) * 1000;
                return this.accessToken;
            } else {
                throw new Error(data.message || 'Failed to get access token');
            }
        } catch (error) {
            console.error('Error getting access token:', error);
            throw error;
        }
    }

    async searchFlights() {
        try {
            // Show modal loading popup
            const modal = document.getElementById('searchModal');
            if (modal) modal.style.display = 'flex';

            // Get access token
            const token = await this.getAccessToken();

            // Prepare search data
            const searchData = {
                originLocationCode: this.fromInput.value,
                destinationLocationCode: this.toInput.value,
                departureDate: this.departureInput.value,
                adults: this.passengersInput.value,
                travelClass: this.classInput.value.toUpperCase(),
                tripType: this.tripType,
                filters: {
                    priceRange: {
                        min: parseInt(this.priceMinInput.value),
                        max: parseInt(this.priceMaxInput.value)
                    },
                    stops: this.stopsInput.value,
                }
            };

            // Add return date only for round-trip flights
            if (this.tripType === 'round-trip' && this.returnInput.value) {
                searchData.returnDate = this.returnInput.value;
            }

            // Make API request
            const response = await fetch('http://localhost:5000/api/flights/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(searchData)
            });

            const result = await response.json();

            if (result.status === 'error') {
                throw new Error(result.message);
            }

            // Save results and search params to localStorage and redirect to results.html
            localStorage.setItem('flightResults', JSON.stringify(result.data));
            localStorage.setItem('flightSearchParams', JSON.stringify(searchData));
            if (modal) modal.style.display = 'none';
            window.location.href = 'results.html';

        } catch (error) {
            const modal = document.getElementById('searchModal');
            if (modal) modal.style.display = 'none';
            this.resultsContainer.innerHTML = `
                <div class="error">
                    Error searching flights: ${error.message}
                </div>
            `;
        }
    }

    async setupAirportAutocomplete(input) {
        let timeout;
        let suggestionsList = null;

        input.addEventListener('input', async (e) => {
            clearTimeout(timeout);

            const keyword = e.target.value;
            if (keyword.length < 2) {
                if (suggestionsList) {
                    suggestionsList.remove();
                    suggestionsList = null;
                }
                return;
            }

            // Debounce API calls
            timeout = setTimeout(async () => {
                try {
                    const token = await this.getAccessToken();
                    const response = await fetch(`http://localhost:5000/api/airports/search?keyword=${encodeURIComponent(keyword)}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    const result = await response.json();

                    if (result.status === 'success') {
                        if (suggestionsList) {
                            suggestionsList.remove();
                            suggestionsList = null;
                        }
                        suggestionsList = this.showAirportSuggestions(input, result.data, suggestionsList, (clear) => {
                            if (clear && suggestionsList) {
                                suggestionsList.remove();
                                suggestionsList = null;
                            }
                        });
                    } else {
                        console.error('Error in airport search response:', result.message);
                    }
                } catch (error) {
                    console.error('Error fetching airport suggestions:', error);
                    if (suggestionsList) {
                        suggestionsList.remove();
                        suggestionsList = null;
                    }
                }
            }, 300);
        });

        // Close suggestions when clicking outside
        document.addEventListener('click', (e) => {
            if (suggestionsList && !input.contains(e.target) && !suggestionsList.contains(e.target)) {
                suggestionsList.remove();
                suggestionsList = null;
            }
        });
    }

    showAirportSuggestions(input, suggestions, existingList, onClear) {
        // Remove existing suggestions for this input
        if (existingList) {
            existingList.remove();
        }

        // Create suggestions list
        const list = document.createElement('ul');
        list.className = 'airport-suggestions';
        list.style.position = 'absolute';
        list.style.zIndex = '1000';
        list.style.width = '100%';
        list.style.maxHeight = '200px';
        list.style.overflowY = 'auto';
        list.style.backgroundColor = 'white';
        list.style.border = '1px solid #ddd';
        list.style.borderRadius = '4px';
        list.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
        list.style.margin = '0';
        list.style.padding = '0';
        list.style.listStyle = 'none';

        if (suggestions.length === 0) {
            const li = document.createElement('li');
            li.textContent = 'No airports found';
            li.style.padding = '8px 12px';
            li.style.color = '#666';
            list.appendChild(li);
        } else {
            suggestions.forEach(suggestion => {
                const li = document.createElement('li');
                li.textContent = `${suggestion.name} (${suggestion.iataCode})`;
                li.style.padding = '8px 12px';
                li.style.cursor = 'pointer';
                li.style.transition = 'background-color 0.2s';
                li.addEventListener('mouseover', () => {
                    li.style.backgroundColor = '#f5f5f5';
                });
                li.addEventListener('mouseout', () => {
                    li.style.backgroundColor = '';
                });
                li.addEventListener('click', () => {
                    input.value = suggestion.iataCode;
                    list.remove();
                    if (onClear) onClear(true);
                });
                list.appendChild(li);
            });
        }

        // Position the list below the input
        const inputRect = input.getBoundingClientRect();
        list.style.top = `${inputRect.bottom + window.scrollY}px`;
        list.style.left = `${inputRect.left + window.scrollX}px`;
        list.style.width = `${inputRect.width}px`;

        // Add list to document body
        document.body.appendChild(list);
        return list;
    }

    displayResults(flights) {
        if (!flights || flights.length === 0) {
            this.resultsContainer.innerHTML = '<div class="no-results">No flights found</div>';
            return;
        }

        const html = flights.map(flight => this.createFlightCard(flight)).join('');
        this.resultsContainer.innerHTML = html;
    }

    createFlightCard(flight) {
        const offer = flight.itineraries[0];
        const segment = offer.segments[0];
        const price = flight.price.total;
        const currency = flight.price.currency;

        // Format duration from ISO 8601 to 'X hrs Y mins'
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

        // Format ISO datetime to 'HH:mm' (local time)
        function formatTime(isoString) {
            if (!isoString) return '';
            const date = new Date(isoString);
            // Pad hours and minutes
            const hours = date.getHours().toString().padStart(2, '0');
            const mins = date.getMinutes().toString().padStart(2, '0');
            return `${hours}:${mins}`;
        }

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
                    <button class="btn btn-primary" onclick="bookFlight('${flight.id}')">Book Now</button>
                    <button class="btn btn-outline" onclick="saveFlight('${flight.id}')">Save</button>
                </div>
            </div>
        `;
    }
}

// Initialize flight search when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new FlightSearch();
}); 