# app.py
from flask import Flask, request, jsonify
import firebase_admin
from firebase_admin import credentials
from firebase_admin import auth
import os
import json
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

firebase_admin_config_json = os.environ.get('PRIV_KEY')

if firebase_admin_config_json:
    try:
        firebase_admin_config = json.loads(firebase_admin_config_json)
        cred = credentials.Certificate(firebase_admin_config)
        firebase_admin.initialize_app(cred)
        print("Firebase Admin SDK initialized successfully using environment variable.")
    except json.JSONDecodeError:
        print("Error: Could not decode JSON from PRIV_KEY environment variable.")
        print("Please ensure the content of PRIV_KEY is valid JSON.")
    except Exception as e:
        print(f"Error initializing Firebase Admin SDK: {e}")
else:
    print("Error: PRIV_KEY environment variable not set.")
    print("Please set the PRIV_KEY environment variable in your .env file with the contents of your service account key JSON file.")


@app.route('/')
def index():
    return "Welcome to AeroFinder Backend!"

@app.route('/register', methods=['POST'])
def register():
    """Handles user registration."""
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'message': 'Email and password are required'}), 400

    try:
        # Create the user in Firebase Authentication
        user = auth.create_user(
            email=email,
            password=password
        )
        return jsonify({'message': 'User created successfully', 'uid': user.uid}), 201
    except Exception as e:
        return jsonify({'message': 'Error creating user', 'error': str(e)}), 400

if __name__ == '__main__':
    # In a production environment, you would not run with debug=True
    # app.run(debug=True)
    pass
