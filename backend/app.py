from flask import Flask, request, jsonify
from flask_cors import CORS
from amadeus_api import search_flights, get_airport_autocomplete
import os
from dotenv import load_dotenv
import requests
import json

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# System prompt for flight-specific context
SYSTEM_PROMPT = """You are AeroBot, an AI assistant specialized in helping people with flight and air travel related questions. You are knowledgeable about:
- Flight bookings and reservations
- Airlines and their policies
- Airports and routes
- Travel requirements (visas, passports)
- Baggage policies
- Flight prices and trends
- Travel tips for flying

Keep responses concise and helpful. If a question is not about flights or air travel, politely explain you can only help with flight-related queries."""

def create_prompt(user_message):
    """Create a properly formatted prompt for TinyLlama"""
    return f"""<|system|>{SYSTEM_PROMPT}</|system|>
<|user|>{user_message}</|user|>
<|assistant|>"""

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

@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        user_message = data.get('message', '')
        
        # Create the properly formatted prompt
        prompt = create_prompt(user_message)
        
        # Call HuggingFace API
        API_URL = "https://api-inference.huggingface.co/models/TinyLlama/TinyLlama-1.1B-Chat-v1.0"
        headers = {
            "Authorization": f"Bearer {os.getenv('HUGGINGFACE_API_KEY')}",
            "Content-Type": "application/json"
        }
        
        response = requests.post(
            API_URL,
            headers=headers,
            json={
                "inputs": prompt,
                "parameters": {
                    "max_new_tokens": 150,
                    "temperature": 0.7,
                    "top_p": 0.9,
                    "do_sample": True,
                    "return_full_text": False
                }
            }
        )
        
        # Handle API response
        if response.status_code == 200:
            response_data = response.json()
            if isinstance(response_data, list) and len(response_data) > 0:
                bot_response = response_data[0].get('generated_text', '').strip()
                # Clean up response markers if present
                bot_response = bot_response.replace('<|assistant|>', '').replace('<|user|>', '').strip()
                return jsonify({"response": bot_response})
            elif isinstance(response_data, dict):
                bot_response = response_data.get('generated_text', '').strip()
                bot_response = bot_response.replace('<|assistant|>', '').replace('<|user|>', '').strip()
                return jsonify({"response": bot_response})
            
        # If we get here, something went wrong with the API response
        print(f"API Error: {response.status_code}")
        print(f"Response: {response.text}")
        return jsonify({
            "error": "Sorry, I'm having trouble generating a response right now. Please try again."
        }), 500
            
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({
            "error": "An error occurred while processing your request"
        }), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000) 