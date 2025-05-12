const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const axios = require('axios');

// Search flights
router.get('/search', async (req, res) => {
    try {
        const { from, to, date, passengers, class: cabinClass } = req.query;

        // TODO: Implement actual flight search API integration
        // This is a mock response for demonstration
        const mockFlights = [
            {
                id: 'BA112',
                airline: 'British Airways',
                flightNumber: 'BA 112',
                from: from,
                to: to,
                departure: `${date}T10:00:00`,
                arrival: `${date}T21:45:00`,
                duration: '6h 45m',
                price: 450,
                cabinClass: cabinClass,
                aircraft: 'Boeing 787-9',
                stops: 0
            },
            // Add more mock flights as needed
        ];

        res.json(mockFlights);
    } catch (error) {
        res.status(500).json({ error: 'Error searching flights' });
    }
});

// Get flight details
router.get('/:flightId', async (req, res) => {
    try {
        const { flightId } = req.params;

        // TODO: Implement actual flight details API integration
        // This is a mock response for demonstration
        const mockFlightDetails = {
            id: flightId,
            airline: 'British Airways',
            flightNumber: 'BA 112',
            from: 'New York (JFK)',
            to: 'London (LHR)',
            departure: '2023-06-15T10:00:00',
            arrival: '2023-06-15T21:45:00',
            duration: '6h 45m',
            price: 450,
            cabinClass: 'Economy',
            aircraft: 'Boeing 787-9',
            stops: 0,
            baggage: {
                cabin: '1 × 7kg (max 45 × 36 × 20cm)',
                checked: '1 × 23kg included'
            },
            schedule: [
                { time: '10:00 AM', event: 'Departure from JFK' },
                { time: '10:30 AM', event: 'Meal service begins' },
                { time: '2:00 PM', event: 'Estimated cruising altitude' },
                { time: '9:45 PM', event: 'Arrival at LHR' }
            ]
        };

        res.json(mockFlightDetails);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching flight details' });
    }
});

module.exports = router; 