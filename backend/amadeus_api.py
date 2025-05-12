import os
from amadeus import Client, ResponseError
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Amadeus client
amadeus = Client(
    client_id=os.getenv('AMADEUS_API_KEY'),
    client_secret=os.getenv('AMADEUS_API_SECRET')
)

def search_flights(origin, destination, departure_date, return_date=None, adults=1, travel_class='ECONOMY', filters=None):
    """
    Search for flights using Amadeus API
    
    Args:
        origin (str): Origin airport/city code
        destination (str): Destination airport/city code
        departure_date (str): Departure date in YYYY-MM-DD format
        return_date (str, optional): Return date in YYYY-MM-DD format
        adults (int, optional): Number of adult passengers. Defaults to 1.
        travel_class (str, optional): Travel class (ECONOMY, PREMIUM_ECONOMY, BUSINESS, FIRST). Defaults to ECONOMY.
        filters (dict, optional): Additional filters for the search. Defaults to None.
    
    Returns:
        dict: Flight search results
    """
    try:
        # Prepare search parameters
        search_params = {
            'originLocationCode': origin,
            'destinationLocationCode': destination,
            'departureDate': departure_date,
            'adults': adults,
            'travelClass': travel_class,
            'max': 10  # Maximum number of results
        }
        
        # Add return date if provided
        if return_date:
            search_params['returnDate'] = return_date
        
        # Make API call
        response = amadeus.shopping.flight_offers_search.get(**search_params)
        
        # Apply filters if provided
        if filters:
            filtered_data = response.data
            
            # Filter by price range
            if 'priceRange' in filters:
                min_price = filters['priceRange'].get('min', 0)
                max_price = filters['priceRange'].get('max', float('inf'))
                filtered_data = [
                    flight for flight in filtered_data
                    if min_price <= float(flight['price']['total']) <= max_price
                ]
            
            # Filter by number of stops
            if 'stops' in filters and filters['stops'] != 'all':
                max_stops = int(filters['stops'])
                filtered_data = [
                    flight for flight in filtered_data
                    if len(flight['itineraries'][0]['segments']) - 1 <= max_stops
                ]
            
            # Filter by airline
            if 'airline' in filters and filters['airline'] != 'all':
                airline_code = filters['airline'].upper()
                filtered_data = [
                    flight for flight in filtered_data
                    if flight['itineraries'][0]['segments'][0]['carrierCode'] == airline_code
                ]
            
            return {
                'status': 'success',
                'data': filtered_data
            }
        
        return {
            'status': 'success',
            'data': response.data
        }
    
    except ResponseError as error:
        return {
            'status': 'error',
            'message': str(error)
        }

def get_airport_autocomplete(keyword):
    """
    Get airport suggestions based on keyword
    
    Args:
        keyword (str): Search keyword for airport/city
    
    Returns:
        dict: Airport suggestions
    """
    try:
        response = amadeus.reference_data.locations.get(
            keyword=keyword,
            subType='AIRPORT,CITY'
        )
        
        return {
            'status': 'success',
            'data': response.data
        }
    
    except ResponseError as error:
        return {
            'status': 'error',
            'message': str(error)
        } 