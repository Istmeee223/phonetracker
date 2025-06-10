# Setup Instructions

## Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/Istmeee223/phonetracker.git
   cd phonetracker
   cd GPSTrackLive 
   ```

2. **Install Python dependencies**
   ```bash
   pip install -r requirements-github.txt
   ```

4. **Run the application**
   ```bash
   python main.py
   ```

5. **Access the application**
   - Student view: http://localhost:5000/
   - Admin dashboard: http://localhost:5000/tracker

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SESSION_SECRET` | Yes | Secret key for Flask sessions |
| `TWILIO_ACCOUNT_SID` | No | Twilio account SID (for SMS features) |
| `TWILIO_AUTH_TOKEN` | No | Twilio auth token (for SMS features) |
| `TWILIO_PHONE_NUMBER` | No | Twilio phone number (for SMS features) |

## Deployment Options

### Local Development
```bash
python main.py
```

### Production with Gunicorn
```bash
gunicorn --bind 0.0.0.0:5000 --reuse-port --reload main:app
```

### Docker (Optional)
Create a `Dockerfile`:
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements-github.txt .
RUN pip install -r requirements-github.txt
COPY . .
ENV SESSION_SECRET=your-secret-key
EXPOSE 5000
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "main:app"]
```

## Browser Requirements

- Modern browser with geolocation API support
- HTTPS required for GPS on production (localhost works with HTTP)
- JavaScript enabled
- Location permissions granted

## Troubleshooting

### Common Issues

1. **"Location not supported"**
   - Ensure browser supports geolocation
   - Use HTTPS in production
   - Check browser permissions

2. **Poor GPS accuracy**
   - Go outside for better satellite reception
   - Wait for GPS to stabilize
   - Check device location settings

3. **Students can't register**
   - Verify Flask app is running
   - Check browser console for errors
   - Ensure JavaScript is enabled

### Debug Mode

Enable debug logging:
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

### Network Issues

If running on different devices:
- Replace `localhost` with server IP
- Ensure firewall allows port 5000
- Use HTTPS for production GPS access