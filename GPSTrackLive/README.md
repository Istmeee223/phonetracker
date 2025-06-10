# GPS Tracker Demo - Educational Location Tracking App

A Flask-based GPS tracking demo application with real-time location updates, interactive maps, and student management features designed for educational purposes.

## Features

### Core Functionality
- **Real-time GPS tracking** with high-accuracy positioning
- **Interactive maps** using Leaflet.js and OpenStreetMap
- **Dual interface**: Student view and Admin dashboard
- **Continuous location updates** every 3 seconds
- **Smart accuracy filtering** with color-coded indicators

### Student Management
- **Student registration** with name and phone number
- **Admin interface** to pre-register students
- **Contact list management** with tracking status
- **Export functionality** for student contact lists

### Enhanced GPS Features
- **High-accuracy positioning** using watchPosition API
- **Fallback positioning system** for reliability
- **Dynamic zoom levels** based on GPS accuracy
- **Enhanced location data**: altitude, heading, speed
- **Visual accuracy indicators**: Green (≤10m), Yellow (≤50m), Red (>50m)

## Screenshots

### Student View
- Registration form for name and phone number
- Real-time location tracking with accuracy indicators
- Interactive map with custom markers
- GPS accuracy tips and instructions

### Admin Dashboard
- Live map showing all student locations
- Student contact list with status indicators
- Add student functionality
- Auto-refresh controls
- Statistics dashboard
- Contact export feature

## Tech Stack

- **Backend**: Python Flask
- **Frontend**: HTML, CSS, Bootstrap, JavaScript
- **Maps**: Leaflet.js with OpenStreetMap
- **Icons**: Feather Icons
- **Styling**: Bootstrap with Replit dark theme

## Installation

### Prerequisites
- Python 3.11 or higher
- pip package manager

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/gps-tracker-demo.git
   cd gps-tracker-demo
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set environment variables**
   ```bash
   export SESSION_SECRET="your-secret-key-here"
   ```

4. **Run the application**
   ```bash
   python main.py
   ```

5. **Access the application**
   - Student view: `http://localhost:5000/`
   - Admin dashboard: `http://localhost:5000/tracker`

## Usage

### For Students
1. Open the student view at `/`
2. Enter your name and phone number to register
3. Click "Start Tracking" to begin location sharing
4. Follow the accuracy tips for best GPS performance
5. Keep the browser tab open while tracking

### For Educators/Admins
1. Open the admin dashboard at `/tracker`
2. Pre-register students using "Add Student" button
3. Monitor live locations on the interactive map
4. Use auto-refresh for continuous updates
5. Export student contact lists when needed

## GPS Accuracy Tips

For best location accuracy, students should:
- **Go outside** - GPS works best with clear sky view
- **Allow location permission** when prompted by browser
- **Wait a moment** - accuracy improves after initial GPS connection
- **Keep phone still** for a few seconds when starting tracking
- **Check accuracy indicator** - aim for green (≤10m) readings

## API Endpoints

### Student Registration
- `POST /api/register_user` - Register student with name and phone
- `GET /api/get_my_location` - Get current user's location

### Location Tracking
- `POST /api/update_location` - Update user's GPS location
- `GET /api/get_locations` - Get all active user locations

### Admin Functions
- `GET /api/export_contacts` - Export student contact list

## File Structure

```
gps-tracker-demo/
├── app.py                 # Main Flask application
├── main.py               # Application entry point
├── requirements.txt      # Python dependencies
├── static/
│   ├── css/
│   │   └── style.css    # Custom styles
│   └── js/
│       ├── user.js      # Student interface logic
│       └── tracker.js   # Admin dashboard logic
├── templates/
│   ├── index.html       # Student view template
│   └── tracker.html     # Admin dashboard template
└── README.md           # Project documentation
```

## Educational Use Cases

This application is designed for educational demonstrations of:
- **GPS and location technologies**
- **Real-time web applications**
- **Geolocation APIs**
- **Interactive mapping**
- **Student tracking systems**
- **Privacy and location sharing concepts**

## Privacy and Security

⚠️ **Educational Use Only**: This application is designed for classroom demonstrations and should not be used for actual student tracking without proper consent and privacy considerations.

- Location data is stored in memory only (not persistent)
- No external services are contacted (except map tiles)
- Data is cleared when application restarts
- Students can stop tracking at any time

## Browser Compatibility

- **Chrome/Chromium**: Full support
- **Firefox**: Full support
- **Safari**: Full support (iOS location permissions required)
- **Edge**: Full support

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Support

For issues or questions:
1. Check the GitHub Issues page
2. Create a new issue with detailed description
3. Include browser and device information

---

**Note**: This is an educational demonstration tool. Always follow your institution's privacy policies and obtain necessary permissions before using location tracking in educational settings.