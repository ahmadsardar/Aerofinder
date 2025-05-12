from flask import Flask, request, jsonify
from flask_cors import CORS
from amadeus_api import search_flights, get_airport_autocomplete
import os
from dotenv import load_dotenv
import requests

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

@app.route('/api/auth/token', methods=['POST'])
def get_token():
    """
    Endpoint for getting Amadeus API access token
    """
    try:
        # Get credentials from environment variables
        client_id = os.getenv('AMADEUS_API_KEY')
        client_secret = os.getenv('AMADEUS_API_SECRET')

        if not client_id or not client_secret:
            return jsonify({
                'status': 'error',
                'message': 'API credentials not configured'
            }), 500

        # Make request to Amadeus token endpoint
        response = requests.post(
            'https://test.api.amadeus.com/v1/security/oauth2/token',
            headers={'Content-Type': 'application/x-www-form-urlencoded'},
            data={
                'grant_type': 'client_credentials',
                'client_id': client_id,
                'client_secret': client_secret
            }
        )

        if response.status_code != 200:
            return jsonify({
                'status': 'error',
                'message': 'Failed to get access token from Amadeus'
            }), 500

        data = response.json()
        return jsonify({
            'status': 'success',
            'access_token': data['access_token'],
            'expires_in': data['expires_in']
        })

    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/flights/search', methods=['POST'])
def search_flights_route():
    """
    Endpoint for searching flights
    """
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['originLocationCode', 'destinationLocationCode', 'departureDate']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'status': 'error',
                    'message': f'Missing required field: {field}'
                }), 400
        
        # Get optional fields
        return_date = data.get('returnDate')
        adults = int(data.get('adults', 1))
        travel_class = data.get('travelClass', 'ECONOMY')
        filters = data.get('filters')
        
        # Search flights
        result = search_flights(
            origin=data['originLocationCode'],
            destination=data['destinationLocationCode'],
            departure_date=data['departureDate'],
            return_date=return_date,
            adults=adults,
            travel_class=travel_class,
            filters=filters
        )
        
        return jsonify(result)
    
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/airports/search', methods=['GET'])
def search_airports_route():
    """
    Endpoint for searching airports
    """
    try:
        keyword = request.args.get('keyword')
        if not keyword:
            return jsonify({
                'status': 'error',
                'message': 'Missing required parameter: keyword'
            }), 400
        
        result = get_airport_autocomplete(keyword)
        return jsonify(result)
    
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True) 