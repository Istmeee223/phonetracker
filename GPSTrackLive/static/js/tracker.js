// Admin tracker functionality
class LocationTrackerAdmin {
    constructor() {
        this.map = null;
        this.markers = {};
        this.autoRefresh = false;
        this.refreshInterval = null;
        this.userColors = ['red', 'blue', 'green', 'yellow', 'purple'];
        this.colorIndex = 0;
        
        this.init();
    }
    
    init() {
        this.initializeMap();
        this.bindEvents();
        this.loadInitialData();
    }
    
    initializeMap() {
        // Initialize Leaflet map centered on New York
        this.map = L.map('tracker-map').setView([40.7128, -74.0060], 10);
        
        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);
        
        // Add attribution for the demo
        this.map.attributionControl.addAttribution('GPS Tracker Admin Dashboard');
    }
    
    bindEvents() {
        document.getElementById('refresh-data').addEventListener('click', () => {
            this.loadLocationData();
        });
        
        document.getElementById('auto-refresh-toggle').addEventListener('click', () => {
            this.toggleAutoRefresh();
        });
        
        document.getElementById('admin-add-student').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addStudent();
        });
        
        document.getElementById('export-contacts').addEventListener('click', () => {
            this.exportContacts();
        });
    }
    
    toggleAutoRefresh() {
        const button = document.getElementById('auto-refresh-toggle');
        const icon = button.querySelector('i');
        const statusElement = document.getElementById('refresh-status');
        
        if (this.autoRefresh) {
            // Stop auto refresh
            this.autoRefresh = false;
            clearInterval(this.refreshInterval);
            
            button.classList.remove('btn-outline-danger');
            button.classList.add('btn-outline-success');
            button.innerHTML = '<i data-feather="play" class="me-1"></i>Auto Refresh';
            statusElement.textContent = 'Manual';
            icon.classList.remove('auto-refresh-active');
            
        } else {
            // Start auto refresh
            this.autoRefresh = true;
            this.refreshInterval = setInterval(() => {
                this.loadLocationData();
            }, 3000); // Refresh every 3 seconds
            
            button.classList.remove('btn-outline-success');
            button.classList.add('btn-outline-danger');
            button.innerHTML = '<i data-feather="pause" class="me-1"></i>Stop Auto';
            statusElement.textContent = 'Auto (3s)';
            icon.classList.add('auto-refresh-active');
        }
        
        // Re-initialize feather icons
        feather.replace();
    }
    
    loadInitialData() {
        this.loadLocationData();
        this.loadContactsList();
    }
    
    async loadLocationData() {
        try {
            // Add loading state
            const refreshBtn = document.getElementById('refresh-data');
            const originalContent = refreshBtn.innerHTML;
            refreshBtn.innerHTML = '<i data-feather="loader" class="me-1 auto-refresh-active"></i>Loading...';
            refreshBtn.disabled = true;
            
            const response = await fetch('/api/get_locations');
            const data = await response.json();
            
            if (data.status === 'success') {
                this.updateMap(data.locations);
                this.updateUsersList(data.locations);
                this.updateStatistics(data.locations, data.count);
            } else {
                console.error('Error loading locations:', data);
                this.showNoData('Error loading location data');
            }
            
        } catch (error) {
            console.error('Network error:', error);
            this.showNoData('Network error - could not load data');
        } finally {
            // Reset loading state
            const refreshBtn = document.getElementById('refresh-data');
            refreshBtn.innerHTML = originalContent;
            refreshBtn.disabled = false;
            feather.replace();
        }
    }
    
    updateMap(locations) {
        // Clear existing markers
        Object.values(this.markers).forEach(marker => {
            this.map.removeLayer(marker.marker);
            if (marker.circle) {
                this.map.removeLayer(marker.circle);
            }
        });
        this.markers = {};
        
        const locationArray = Object.entries(locations);
        
        if (locationArray.length === 0) {
            return;
        }
        
        // Add markers for each user
        locationArray.forEach(([userId, location], index) => {
            this.addUserMarker(userId, location, index);
        });
        
        // Fit map to show all markers
        if (locationArray.length > 0) {
            const group = new L.featureGroup(Object.values(this.markers).map(m => m.marker));
            this.map.fitBounds(group.getBounds().pad(0.1));
        }
    }
    
    addUserMarker(userId, location, index) {
        const { latitude, longitude, accuracy, timestamp } = location;
        const position = [latitude, longitude];
        
        // Get color for this user
        const color = this.userColors[index % this.userColors.length];
        
        // Create custom icon
        const icon = L.divIcon({
            className: 'custom-marker',
            html: `
                <div style="
                    background-color: ${this.getColorValue(color)};
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    border: 3px solid white;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 10px;
                    font-weight: bold;
                ">
                    ${index + 1}
                </div>
            `,
            iconSize: [26, 26],
            iconAnchor: [13, 13]
        });
        
        // Create marker
        const marker = L.marker(position, { icon }).addTo(this.map);
        
        // Create accuracy circle
        const circle = L.circle(position, {
            radius: accuracy || 100,
            color: this.getColorValue(color),
            fillColor: this.getColorValue(color),
            fillOpacity: 0.1,
            weight: 2
        }).addTo(this.map);
        
        // Create popup content with contact info if available
        let popupContent = `
            <div style="min-width: 200px;">
                <strong>User: ${userId}</strong><br>
        `;
        
        if (location.contact) {
            popupContent += `
                <strong>Name:</strong> ${location.contact.name}<br>
                <strong>Phone:</strong> ${location.contact.phone}<br>
                <hr style="margin: 8px 0;">
            `;
        }
        
        popupContent += `
                <strong>Position:</strong><br>
                Latitude: ${latitude.toFixed(6)}<br>
                Longitude: ${longitude.toFixed(6)}<br>
                <strong>Accuracy:</strong> ±${accuracy ? Math.round(accuracy) : 'unknown'}m<br>
                ${location.altitude ? `<strong>Altitude:</strong> ${Math.round(location.altitude)}m<br>` : ''}
                ${location.speed !== null && location.speed !== undefined ? `<strong>Speed:</strong> ${Math.round(location.speed * 3.6)} km/h<br>` : ''}
                ${location.heading !== null && location.heading !== undefined ? `<strong>Heading:</strong> ${Math.round(location.heading)}°<br>` : ''}
                <strong>Last Update:</strong><br>
                ${new Date(timestamp).toLocaleString()}
            </div>
        `;
        
        marker.bindPopup(popupContent);
        
        // Store marker reference
        this.markers[userId] = {
            marker: marker,
            circle: circle,
            color: color,
            index: index
        };
    }
    
    getColorValue(colorName) {
        const colors = {
            'red': '#dc3545',
            'blue': '#0d6efd',
            'green': '#198754',
            'yellow': '#ffc107',
            'purple': '#6f42c1'
        };
        return colors[colorName] || '#6c757d';
    }
    
    updateUsersList(locations) {
        const usersList = document.getElementById('users-list');
        const noUsers = document.getElementById('no-users');
        
        const locationArray = Object.entries(locations);
        
        if (locationArray.length === 0) {
            usersList.innerHTML = '';
            noUsers.style.display = 'block';
            return;
        }
        
        noUsers.style.display = 'none';
        
        const usersHTML = locationArray.map(([userId, location], index) => {
            const color = this.userColors[index % this.userColors.length];
            const timeDiff = this.getTimeDifference(location.timestamp);
            
            // Use student name if available, otherwise use user ID
            const displayName = location.contact ? location.contact.name : userId;
            const phoneNumber = location.contact ? location.contact.phone : '';
            
            return `
                <div class="card user-card mb-2" data-user-id="${userId}" style="cursor: pointer;">
                    <div class="card-body p-3">
                        <div class="d-flex align-items-center">
                            <div class="status-indicator" style="background-color: ${this.getColorValue(color)};"></div>
                            <div class="flex-grow-1">
                                <h6 class="mb-1">${displayName}</h6>
                                ${phoneNumber ? `<small class="text-info mb-1 d-block">${phoneNumber}</small>` : ''}
                                <small class="text-muted">
                                    ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}
                                </small>
                                <br>
                                <small class="text-muted">
                                    Updated ${timeDiff}
                                </small>
                            </div>
                            <div class="text-end">
                                <span class="badge bg-secondary">#${index + 1}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        usersList.innerHTML = usersHTML;
        
        // Add click handlers to user cards
        usersList.querySelectorAll('.user-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const userId = e.currentTarget.dataset.userId;
                this.focusOnUser(userId);
            });
        });
    }
    
    focusOnUser(userId) {
        const markerData = this.markers[userId];
        if (markerData) {
            const marker = markerData.marker;
            this.map.setView(marker.getLatLng(), 16);
            marker.openPopup();
        }
    }
    
    getTimeDifference(timestamp) {
        const now = new Date();
        const then = new Date(timestamp);
        const diffMs = now - then;
        const diffSeconds = Math.floor(diffMs / 1000);
        const diffMinutes = Math.floor(diffSeconds / 60);
        
        if (diffSeconds < 60) {
            return `${diffSeconds}s ago`;
        } else if (diffMinutes < 60) {
            return `${diffMinutes}m ago`;
        } else {
            const diffHours = Math.floor(diffMinutes / 60);
            return `${diffHours}h ago`;
        }
    }
    
    updateStatistics(locations, count) {
        document.getElementById('total-users').textContent = count;
        document.getElementById('active-sessions').textContent = count;
        document.getElementById('user-count').textContent = `${count} Users`;
        
        // Update last update time
        const timestamps = Object.values(locations).map(loc => new Date(loc.timestamp));
        if (timestamps.length > 0) {
            const latest = new Date(Math.max(...timestamps));
            document.getElementById('last-update-time').textContent = latest.toLocaleTimeString();
        } else {
            document.getElementById('last-update-time').textContent = '-';
        }
    }
    
    async addStudent() {
        const name = document.getElementById('admin-student-name').value.trim();
        const phone = document.getElementById('admin-student-phone').value.trim();
        
        if (!name || !phone) {
            alert('Please enter both name and phone number.');
            return;
        }
        
        try {
            // Generate a unique user ID for this student
            const userId = 'admin_' + Math.random().toString(36).substr(2, 9);
            
            const response = await fetch('/api/register_user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: userId,
                    name: name,
                    phone: phone
                })
            });
            
            const data = await response.json();
            
            if (data.status === 'success') {
                // Clear form
                document.getElementById('admin-student-name').value = '';
                document.getElementById('admin-student-phone').value = '';
                
                // Close the form
                const collapseElement = document.getElementById('add-student-form');
                const bsCollapse = new bootstrap.Collapse(collapseElement, {toggle: false});
                bsCollapse.hide();
                
                // Refresh contact list
                this.loadContactsList();
                
                alert(`Student ${name} added successfully! They can now join using any device.`);
            } else {
                alert(data.error || 'Failed to add student');
            }
            
        } catch (error) {
            console.error('Error adding student:', error);
            alert('Network error: Could not add student');
        }
    }
    
    async loadContactsList() {
        try {
            const response = await fetch('/api/export_contacts');
            const data = await response.json();
            
            if (data.status === 'success') {
                this.updateContactsList(data.contacts);
            }
        } catch (error) {
            console.error('Error loading contacts:', error);
        }
    }
    
    updateContactsList(contacts) {
        const contactsList = document.getElementById('student-contacts-list');
        
        if (contacts.length === 0) {
            contactsList.innerHTML = '<p class="text-muted text-center">No students added yet</p>';
            return;
        }
        
        const contactsHTML = contacts.map(contact => {
            const statusClass = contact.has_location ? 'text-success' : 'text-muted';
            const statusIcon = contact.has_location ? 'check-circle' : 'user';
            
            return `
                <div class="d-flex justify-content-between align-items-center mb-2 p-2 bg-secondary rounded">
                    <div>
                        <strong>${contact.name}</strong><br>
                        <small class="text-info">${contact.phone}</small>
                    </div>
                    <i data-feather="${statusIcon}" class="${statusClass}"></i>
                </div>
            `;
        }).join('');
        
        contactsList.innerHTML = contactsHTML;
        feather.replace();
    }
    
    async exportContacts() {
        try {
            const response = await fetch('/api/export_contacts');
            const data = await response.json();
            
            if (data.status === 'success') {
                // Create downloadable text file
                let exportText = 'Student Contact List - GPS Tracker Demo\n';
                exportText += '=' .repeat(40) + '\n\n';
                
                data.contacts.forEach((contact, index) => {
                    exportText += `${index + 1}. ${contact.name}\n`;
                    exportText += `   Phone: ${contact.phone}\n`;
                    exportText += `   Status: ${contact.has_location ? 'Active' : 'Not tracking'}\n`;
                    exportText += `   Registered: ${new Date(contact.registered_at).toLocaleString()}\n\n`;
                });
                
                // Download file
                const blob = new Blob([exportText], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `student_contacts_${new Date().toISOString().slice(0,10)}.txt`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }
        } catch (error) {
            console.error('Export error:', error);
            alert('Failed to export contacts');
        }
    }
    
    showNoData(message) {
        const noUsers = document.getElementById('no-users');
        const usersList = document.getElementById('users-list');
        
        usersList.innerHTML = '';
        noUsers.style.display = 'block';
        noUsers.querySelector('p').textContent = message || 'No active users found';
        
        this.updateStatistics({}, 0);
    }
}

// Initialize the admin tracker when the page loads
document.addEventListener('DOMContentLoaded', function() {
    new LocationTrackerAdmin();
});
