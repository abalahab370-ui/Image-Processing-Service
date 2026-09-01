# DevSpace // Image Processing Pipeline

DevSpace is a full-stack MERN application for uploading, transforming, and managing image assets efficiently. Built with secure JWT authentication, Cloudinary CDN integrations, and dynamic DOM manipulation, DevSpace allows developers and creators to optimize images on the fly while tracking storage consumption.

This project is built based on the project idea from [roadmap.sh Image Processing Service](https://roadmap.sh/projects/image-processing-service).

---

## Key Features

* Secure Authentication: JWT access tokens coupled with HttpOnly refresh cookies and auto-retry session refresh middleware.
* Dynamic Transformations: Real-time image rotation, format conversion (WEBP, PNG, JPEG, AVIF), quality compression adjustment, resizing, and filters (Grayscale/Sepia).
* Managed Cloud Storage: Direct integration with Cloudinary for asset optimization and metadata tracking via MongoDB.
* Storage Analytics: Native JavaScript calculations tracking total storage consumption across user accounts.
* Asset Gallery: Paginated image gallery featuring instant previews, direct downloads, and asset deletion sync.

---

## Tech Stack

* Frontend: Vanilla JavaScript (ES6+), HTML5, Tailwind CSS v4
* Backend: Node.js, Express.js
* Database: MongoDB (Mongoose ODM)
* Storage & CDN: Cloudinary Node SDK, Multer
* Auth: JSON Web Tokens (jsonwebtoken), cookie-parser

---

## Getting Started

### Prerequisites

* Node.js (v18+ recommended)
* MongoDB connection string (Local or MongoDB Atlas)
* Cloudinary API Credentials

### 1. Environment Setup

Create a .env file in the root directory and add the following:

PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_access_secret
REFRESH_TOKEN_SECRET=your_jwt_refresh_secret

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

### 2. Installation

Clone the repository and install dependencies:

git clone https://github.com/your-username/devspace.git
cd devspace
npm install

### 3. Running the Application

Start the development server:

npm run dev

Open index.html in your web browser to access the workspace.

---

## API Endpoints

### Authentication
* POST /api/register - Register new user account
* POST /api/login - Authenticate user & issue tokens
* GET /api/refresh - Issue new Access Token via HttpOnly cookie
* DELETE /api/logout - Clear session cookies

### Image Operations
* GET /api/images - Fetch user image assets (supports ?page= & ?limit=)
* POST /api/images - Upload raw image asset (Multer -> Cloudinary)
* POST /api/images/:id/transform - Apply dynamic transformations & fetch target URL
* DELETE /api/images/:id - Remove asset from Cloudinary & MongoDB
