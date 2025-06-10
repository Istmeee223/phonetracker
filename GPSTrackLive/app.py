import os
import logging
from datetime import datetime
from flask import Flask, render_template, request, jsonify

# Configure logging for debugging
logging.basicConfig(level=logging.DEBUG)

# Create Flask app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "dev-secret-key-for-demo")

# In-memory storage for locations and user info (no database needed)
user_locations = {}
user_contacts = {}  # Store user contact information

@app.route('/')
def index():
    """User view - for sharing location"""
    return render_template('index.html')

@app.route('/tracker')
def tracker():
    """Admin view - for tracking all users"""
    return render_template('tracker.html')

@app.route('/api/register_user', methods=['POST'])
def register_user():
    """API endpoint to register user contact info"""
    try:
        data = request.get_json()
        
        if not data or 'name' not in data or 'phone' not in data:
            return jsonify({'error': 'Missing name or phone number'}), 400
        
        user_id = data.get('user_id', request.remote_addr)
        
        # Store user contact information
        user_contacts[user_id] = {
            'name': data['name'].strip(),
            'phone': data['phone'].strip(),
            'registered_at': datetime.now().isoformat()
        }
        
        app.logger.info(f"User registered: {data['name']} ({data['phone']})")
        
        return jsonify({
            'status': 'success',
            'message': 'User registered successfully',
            'user_id': user_id
        })
        
    except Exception as e:
        app.logger.error(f"Error registering user: {str(e)}")
        return jsonify({'error': 'Failed to register user'}), 500

@app.route('/api/update_location', methods=['POST'])
def update_location():
    """API endpoint to receive location updates from users"""
    try:
        data = request.get_json()
        
        if not data or 'latitude' not in data or 'longitude' not in data:
            return jsonify({'error': 'Missing latitude or longitude'}), 400
        
        # Get user identifier (use session ID or IP as fallback)
        user_id = data.get('user_id', request.remote_addr)
        
        # Store location data with enhanced GPS information
        user_locations[user_id] = {
            'latitude': float(data['latitude']),
            'longitude': float(data['longitude']),
            'accuracy': data.get('accuracy', 'unknown'),
            'altitude': data.get('altitude'),
            'heading': data.get('heading'),
            'speed': data.get('speed'),
            'timestamp': datetime.now().isoformat(),
            'user_agent': request.headers.get('User-Agent', 'unknown')
        }
        
        app.logger.info(f"Location updated for user {user_id}: {data['latitude']}, {data['longitude']}")
        
        return jsonify({
            'status': 'success',
            'message': 'Location updated successfully',
            'user_id': user_id
        })
        
    except Exception as e:
        app.logger.error(f"Error updating location: {str(e)}")
        return jsonify({'error': 'Failed to update location'}), 500

@app.route('/api/get_locations')
def get_locations():
    """API endpoint to retrieve all current locations for the tracker view"""
    try:
        # Combine location data with contact info
        enhanced_locations = {}
        for user_id, location in user_locations.items():
            enhanced_location = location.copy()
            if user_id in user_contacts:
                enhanced_location['contact'] = user_contacts[user_id]
            enhanced_locations[user_id] = enhanced_location
            
        return jsonify({
            'status': 'success',
            'locations': enhanced_locations,
            'count': len(enhanced_locations)
        })
    except Exception as e:
        app.logger.error(f"Error retrieving locations: {str(e)}")
        return jsonify({'error': 'Failed to retrieve locations'}), 500

@app.route('/api/get_my_location')
def get_my_location():
    """API endpoint to retrieve current user's location"""
    try:
        user_id = request.args.get('user_id', request.remote_addr)
        location = user_locations.get(user_id)
        
        if location:
            return jsonify({
                'status': 'success',
                'location': location
            })
        else:
            return jsonify({
                'status': 'not_found',
                'message': 'No location data found for this user'
            })
            
    except Exception as e:
        app.logger.error(f"Error retrieving user location: {str(e)}")
        return jsonify({'error': 'Failed to retrieve location'}), 500

@app.route('/api/export_contacts')
def export_contacts():
    """API endpoint to export all student contact information"""
    try:
        contacts_list = []
        for user_id, contact in user_contacts.items():
            location_data = user_locations.get(user_id, {})
            contacts_list.append({
                'name': contact['name'],
                'phone': contact['phone'],
                'registered_at': contact['registered_at'],
                'has_location': user_id in user_locations,
                'last_location_update': location_data.get('timestamp', 'Never')
            })
        
        return jsonify({
            'status': 'success',
            'contacts': contacts_list,
            'total_registered': len(contacts_list)
        })
        
    except Exception as e:
        app.logger.error(f"Error exporting contacts: {str(e)}")
        return jsonify({'error': 'Failed to export contacts'}), 500

@app.errorhandler(404)
def not_found(error):
    return render_template('index.html'), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
