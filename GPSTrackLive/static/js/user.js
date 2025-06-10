// User location sharing functionality
class LocationTracker {
    constructor() {
        this.isTracking = false;
        this.trackingInterval = null;
        this.watchId = null;
        this.map = null;
        this.userMarker = null;
        this.accuracyCircle = null;
        this.userId = this.generateUserId();
        this.isRegistered = false;
        this.studentName = '';
        this.studentPhone = '';
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.checkLocationSupport();
    }
    
    generateUserId() {
        // Generate a simple user ID based on session
        return 'user_' + Math.random().toString(36).substr(2, 9);
    }
    
    initializeMap() {
        // Initialize Leaflet map
        this.map = L.map('user-map').setView([40.7128, -74.0060], 13);
        
        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);
        
        // Add attribution for the demo
        this.map.attributionControl.addAttribution('GPS Tracker Demo');
    }
    
    bindEvents() {
        // Registration form
        document.getElementById('registration-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegistration();
        });
        
        // Location tracking buttons
        const startBtn = document.getElementById('start-tracking');
        const stopBtn = document.getElementById('stop-tracking');
        const refreshBtn = document.getElementById('refresh-location');
        
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                this.startTracking();
            });
        }
        
        if (stopBtn) {
            stopBtn.addEventListener('click', () => {
                this.stopTracking();
            });
        }
        
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.getCurrentLocation();
            });
        }
    }
    
    async handleRegistration() {
        const name = document.getElementById('student-name').value.trim();
        const phone = document.getElementById('student-phone').value.trim();
        
        if (!name || !phone) {
            alert('Please enter both name and phone number.');
            return;
        }
        
        try {
            const response = await fetch('/api/register_user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: this.userId,
                    name: name,
                    phone: phone
                })
            });
            
            const data = await response.json();
            
            if (data.status === 'success') {
                this.isRegistered = true;
                this.studentName = name;
                this.studentPhone = phone;
                
                // Hide registration form and show tracking interface
                document.getElementById('registration-section').style.display = 'none';
                document.getElementById('status-section').style.display = 'block';
                document.getElementById('map-section').style.display = 'block';
                
                // Show student info
                document.getElementById('display-name').textContent = name;
                document.getElementById('display-phone').textContent = phone;
                document.getElementById('student-info').style.display = 'block';
                
                // Initialize map after showing the section
                this.initializeMap();
                
                this.showStatus('success', `Welcome ${name}! You can now start location tracking.`);
            } else {
                alert(data.error || 'Registration failed');
            }
            
        } catch (error) {
            console.error('Registration error:', error);
            alert('Network error: Could not register user');
        }
    }
    
    checkLocationSupport() {
        if (!navigator.geolocation) {
            this.showStatus('error', 'Geolocation is not supported by this browser.');
            return false;
        }
        
        if (!this.isRegistered) {
            return false;
        }
        
        this.showStatus('info', 'Location services are available. Click "Start Tracking" to begin.');
        return true;
    }
    
    startTracking() {
        if (!this.checkLocationSupport()) return;
        
        this.isTracking = true;
        this.updateUI();
        
        // Use watchPosition for continuous high-accuracy tracking
        const watchOptions = {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 1000
        };
        
        this.watchId = navigator.geolocation.watchPosition(
            (position) => this.onLocationSuccess(position),
            (error) => this.onLocationError(error),
            watchOptions
        );
        
        // Also get initial location immediately
        this.getCurrentLocation();
        
        // Backup interval tracking every 3 seconds for reliability
        this.trackingInterval = setInterval(() => {
            this.getCurrentLocation();
        }, 3000);
        
        this.showStatus('success', 'High-accuracy location tracking started. Continuous updates with GPS.');
    }
    
    stopTracking() {
        this.isTracking = false;
        this.updateUI();
        
        if (this.trackingInterval) {
            clearInterval(this.trackingInterval);
            this.trackingInterval = null;
        }
        
        if (this.watchId) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
        }
        
        this.showStatus('secondary', 'Location tracking stopped.');
    }
    
    getCurrentLocation() {
        if (!navigator.geolocation) return;
        
        const options = {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0
        };
        
        // Try to get the most accurate position possible
        navigator.geolocation.getCurrentPosition(
            (position) => this.onLocationSuccess(position),
            (error) => {
                // If high accuracy fails, try again with less strict settings
                const fallbackOptions = {
                    enableHighAccuracy: false,
                    timeout: 10000,
                    maximumAge: 30000
                };
                
                navigator.geolocation.getCurrentPosition(
                    (position) => this.onLocationSuccess(position),
                    (error) => this.onLocationError(error),
                    fallbackOptions
                );
            },
            options
        );
    }
    
    onLocationSuccess(position) {
        const { latitude, longitude, accuracy, altitude, altitudeAccuracy, heading, speed } = position.coords;
        
        console.log('Location obtained:', latitude, longitude, 'Accuracy:', accuracy);
        
        // Only use high-accuracy readings (less than 50 meters) if possible
        if (accuracy > 100 && this.lastKnownAccuracy && this.lastKnownAccuracy < accuracy) {
            console.log('Ignoring low accuracy reading:', accuracy, 'Previous:', this.lastKnownAccuracy);
            return;
        }
        
        this.lastKnownAccuracy = accuracy;
        
        // Update UI with current location
        this.updateLocationDisplay(latitude, longitude, accuracy, altitude, heading, speed);
        
        // Update map
        this.updateMap(latitude, longitude, accuracy);
        
        // Send to server with additional data
        this.sendLocationToServer(latitude, longitude, accuracy, altitude, heading, speed);
    }
    
    onLocationError(error) {
        let message = 'Failed to get location: ';
        
        switch (error.code) {
            case error.PERMISSION_DENIED:
                message += 'Location access denied by user.';
                break;
            case error.POSITION_UNAVAILABLE:
                message += 'Location information unavailable.';
                break;
            case error.TIMEOUT:
                message += 'Location request timed out.';
                break;
            default:
                message += 'Unknown error occurred.';
                break;
        }
        
        this.showStatus('error', message);
        console.error('Location error:', error);
    }
    
    updateLocationDisplay(lat, lng, accuracy, altitude, heading, speed) {
        document.getElementById('current-lat').textContent = lat.toFixed(6);
        document.getElementById('current-lng').textContent = lng.toFixed(6);
        
        // Color-code accuracy indicator
        const accuracyElement = document.getElementById('current-accuracy');
        accuracyElement.textContent = Math.round(accuracy);
        
        // Remove existing accuracy classes
        accuracyElement.classList.remove('text-success', 'text-warning', 'text-danger');
        
        // Add color based on accuracy level
        if (accuracy <= 10) {
            accuracyElement.classList.add('text-success');
            accuracyElement.title = 'Excellent accuracy';
        } else if (accuracy <= 50) {
            accuracyElement.classList.add('text-warning');
            accuracyElement.title = 'Good accuracy';
        } else {
            accuracyElement.classList.add('text-danger');
            accuracyElement.title = 'Poor accuracy';
        }
        
        document.getElementById('last-update').textContent = new Date().toLocaleTimeString();
        
        // Show location details
        document.getElementById('location-details').style.display = 'block';
    }
    
    updateMap(lat, lng, accuracy) {
        const position = [lat, lng];
        
        // Determine zoom level based on accuracy
        let zoomLevel = 18; // High accuracy default
        if (accuracy > 50) zoomLevel = 16;
        if (accuracy > 100) zoomLevel = 15;
        if (accuracy > 500) zoomLevel = 14;
        
        // Center map on new position
        this.map.setView(position, zoomLevel);
        
        // Remove existing marker and circle
        if (this.userMarker) {
            this.map.removeLayer(this.userMarker);
        }
        if (this.accuracyCircle) {
            this.map.removeLayer(this.accuracyCircle);
        }
        
        // Create accuracy-based marker icon
        let markerColor = '#28a745'; // Green for good accuracy
        if (accuracy > 10) markerColor = '#ffc107'; // Yellow for moderate
        if (accuracy > 50) markerColor = '#dc3545'; // Red for poor
        
        // Add new marker with custom icon
        const customIcon = L.divIcon({
            className: 'custom-location-marker',
            html: `
                <div style="
                    background-color: ${markerColor};
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    border: 3px solid white;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                "></div>
            `,
            iconSize: [22, 22],
            iconAnchor: [11, 11]
        });
        
        this.userMarker = L.marker(position, {
            icon: customIcon,
            title: 'Your Location'
        }).addTo(this.map);
        
        // Add accuracy circle with color coding
        this.accuracyCircle = L.circle(position, {
            radius: accuracy,
            color: markerColor,
            fillColor: markerColor,
            fillOpacity: 0.1,
            weight: 2
        }).addTo(this.map);
        
        // Add popup with enhanced details
        const accuracyStatus = accuracy <= 10 ? 'Excellent' : 
                             accuracy <= 50 ? 'Good' : 'Poor';
        
        const popupContent = `
            <strong>Your Location</strong><br>
            <hr style="margin: 5px 0;">
            <strong>Coordinates:</strong><br>
            Lat: ${lat.toFixed(6)}<br>
            Lng: ${lng.toFixed(6)}<br>
            <strong>Accuracy:</strong> ±${Math.round(accuracy)}m (${accuracyStatus})<br>
            <strong>Time:</strong> ${new Date().toLocaleTimeString()}
        `;
        
        this.userMarker.bindPopup(popupContent).openPopup();
    }
    
    async sendLocationToServer(lat, lng, accuracy, altitude, heading, speed) {
        try {
            const response = await fetch('/api/update_location', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: this.userId,
                    latitude: lat,
                    longitude: lng,
                    accuracy: accuracy,
                    altitude: altitude || null,
                    heading: heading || null,
                    speed: speed || null
                })
            });
            
            const data = await response.json();
            
            if (data.status === 'success') {
                console.log('Location sent successfully:', data);
                this.showStatus('success', `Location updated successfully. User ID: ${data.user_id}`);
            } else {
                console.error('Server error:', data);
                this.showStatus('error', data.error || 'Failed to update location on server');
            }
            
        } catch (error) {
            console.error('Network error:', error);
            this.showStatus('error', 'Network error: Could not send location to server');
        }
    }
    
    showStatus(type, message) {
        const statusContainer = document.getElementById('status-message');
        const iconMap = {
            'success': 'check-circle',
            'error': 'alert-circle',
            'warning': 'alert-triangle',
            'info': 'info',
            'secondary': 'clock'
        };
        
        const alertClass = type === 'error' ? 'alert-danger' : 
                          type === 'success' ? 'alert-success' : 
                          type === 'warning' ? 'alert-warning' : 
                          type === 'info' ? 'alert-info' : 'alert-secondary';
        
        statusContainer.className = `alert ${alertClass}`;
        statusContainer.innerHTML = `
            <i data-feather="${iconMap[type] || 'info'}" class="me-2"></i>
            ${message}
        `;
        
        // Re-initialize feather icons
        feather.replace();
    }
    
    updateUI() {
        const startBtn = document.getElementById('start-tracking');
        const stopBtn = document.getElementById('stop-tracking');
        const refreshBtn = document.getElementById('refresh-location');
        
        if (this.isTracking) {
            startBtn.style.display = 'none';
            stopBtn.style.display = 'inline-block';
            refreshBtn.disabled = true;
        } else {
            startBtn.style.display = 'inline-block';
            stopBtn.style.display = 'none';
            refreshBtn.disabled = false;
        }
    }
}

// Initialize the location tracker when the page loads
document.addEventListener('DOMContentLoaded', function() {
    new LocationTracker();
});
