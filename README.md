# AeroFinder - Flight Search and Booking Platform

AeroFinder is a modern web application for searching and booking flights. It provides users with a seamless experience for finding the best flight deals, managing bookings, and accessing travel information.

## Features

- Flight search with advanced filtering options
- User authentication and account management
- Flight bookmarking and favorites
- Interactive AI chatbot for travel assistance
- Responsive design for all devices
- Real-time flight information

## Project Structure

```
AeroFinder/
├── frontend/              # Frontend application
│   ├── css/              # CSS files
│   │   ├── main.css      # Shared styles
│   │   ├── home.css      # Home page styles
│   │   ├── search.css    # Search and filter pages styles
│   │   ├── content.css   # About, Contact, FAQ, Privacy pages styles
│   │   ├── auth.css      # Login and Register pages styles
│   │   ├── dashboard.css # User dashboard styles
│   │   └── chatbot.css   # AI chatbot interface styles
│   ├── js/               # JavaScript files
│   │   ├── auth.js       # Authentication logic
│   │   ├── main.js       # Shared functionality
│   │   ├── search.js     # Search functionality
│   │   ├── filter.js     # Filter functionality
│   │   ├── details.js    # Flight details page
│   │   ├── dashboard.js  # User dashboard functionality
│   │   ├── chatbot.js    # AI chatbot functionality
│   │   ├── login.js      # Login page functionality
│   │   └── register.js   # Registration page functionality
│   ├── images/           # Image assets
│   ├── index.html        # Home page
│   ├── search.html       # Flight search page
│   ├── filter.html       # Flight filter page
│   ├── details.html      # Flight details page
│   ├── about.html        # About page
│   ├── contact.html      # Contact page
│   ├── faq.html         # FAQ page
│   ├── privacy.html     # Privacy policy page
│   ├── chatbot.html     # AI chatbot page
│   ├── login.html       # Login page
│   ├── register.html    # Registration page
│   └── dashboard.html   # User dashboard page
├── backend/              # Backend server
│   ├── routes/          # API routes
│   │   ├── auth.js      # Authentication routes
│   │   ├── flights.js   # Flight search and details routes
│   │   └── bookmarks.js # User bookmarks routes
│   ├── server.js        # Main server file
│   ├── package.json     # Node.js dependencies
│   └── .env            # Environment variables
└── README.md           # Project documentation
```

## Setup

### Frontend Setup
1. Open `frontend/index.html` in your browser or set up a local server

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Update the values with your Firebase and API credentials
4. Start the server:
   ```bash
   npm run dev
   ```

## Technologies Used

### Frontend
- HTML5
- CSS3
- JavaScript
- jQuery
- Firebase (Authentication & Firestore)
- Font Awesome Icons

### Backend
- Node.js
- Express.js
- Firebase Admin SDK
- CORS
- dotenv

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 