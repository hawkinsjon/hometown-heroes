# 🇺🇸 Hometown Heroes Banner Management System

> A modern web application for managing Hometown Heroes banner submissions, built and donated to Berkeley Heights Township, New Jersey.

[![License: Proprietary](https://img.shields.io/badge/License-Proprietary-red.svg)](LICENSE)
[![Built with React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)

---

## About This Project

The **Hometown Heroes Banner Management System** is a full-stack web application that streamlines the process of submitting, reviewing, and managing Hometown Heroes banners for Berkeley Heights Township. This software was developed pro bono and donated to the Berkeley Heights Veterans Affairs Committee to honor local veterans and their families.

The application replaces manual, paper-based processes with a modern digital workflow that includes photo management, automated email notifications, PDF contract generation, and an administrative review system.

## Key Features

### 🎯 For Residents
- **Intuitive Multi-Step Form** - Guided submission process with real-time validation
- **Photo Upload & Management** - Support for multiple photo formats (JPG, PNG, PDF, EPS, TIFF, PSD, AI)
- **Digital Signature Capture** - Electronic contract signing with legal validity
- **Email Verification** - Automated confirmation and status updates
- **Mobile-Responsive Design** - Works seamlessly on phones, tablets, and desktops

### 👥 For Administrators
- **Review Dashboard** - One-click approval or request clarifications
- **Email Workflows** - Automated notifications to admins, town clerk, and applicants
- **PDF Contract Generation** - Automatic generation of submission agreements with embedded photos
- **Secure File Storage** - Integration with DigitalOcean Spaces for reliable asset management
- **Action Link Security** - Cryptographically signed URLs prevent unauthorized access

### 🏗️ Technical Architecture
- **Frontend**: React 18 with TypeScript, Tailwind CSS, and Framer Motion animations
- **Backend**: Express.js with formidable for multipart form handling
- **PDF Generation**: pdf-lib for contract document creation
- **Email Service**: Resend API for transactional emails
- **Storage**: AWS S3-compatible DigitalOcean Spaces
- **Security**: HMAC-SHA256 signed action links, input validation, CORS protection
- **Deployment**: DigitalOcean App Platform with automated CI/CD

## Development

### Prerequisites

- Node.js 18 or higher
- npm or yarn package manager

### Installation

```bash
# Clone the repository
git clone https://github.com/hawkinsjon/hometown-heroes.git
cd hometown-heroes

# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### Running Locally

```bash
# Terminal 1 - Frontend development server
npm run dev

# Terminal 2 - Backend server
cd server
node index.mjs
```

The frontend will be available at `http://localhost:5173` and the backend at `http://localhost:8080`.

### Environment Variables

For the backend server, create a `.env` file with the following variables:

```bash
DO_SPACES_ACCESS_KEY=your_do_spaces_access_key
DO_SPACES_SECRET_KEY=your_do_spaces_secret_key  
DO_SPACES_BUCKET_NAME=your_do_spaces_bucket_name
DO_SPACES_ENDPOINT=your_do_spaces_endpoint
DO_SPACES_REGION=your_do_spaces_region
RESEND_API_KEY=your_resend_api_key
ACTION_LINK_SECRET=your_action_link_secret
ADMIN_EMAIL_RECIPIENTS=admin@example.com
TOWN_EMAIL_RECIPIENTS=town@example.com
```

## Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript, Vite |
| **Styling** | Tailwind CSS, Framer Motion |
| **Backend** | Node.js, Express.js |
| **File Processing** | formidable, pdf-lib |
| **Storage** | DigitalOcean Spaces (S3-compatible) |
| **Email** | Resend API |
| **Deployment** | DigitalOcean App Platform |
| **Security** | HMAC-SHA256, CORS, Content validation |

## Deployment

This application is deployed on DigitalOcean App Platform with automated deployments from the `main` branch:

1. Push changes to the main branch
2. DigitalOcean automatically builds and deploys both frontend and backend
3. Environment variables are configured in the App Platform dashboard
4. SSL certificates are automatically managed

## Project Context

This application was developed and donated by a member of the Berkeley Heights Veterans Affairs Committee to modernize the banner submission process. The software is made publicly available for transparency and to ensure the township has continued access to the codebase, but it remains proprietary software.

### Why Open but Proprietary?

While the code is visible on GitHub, it is **not open source**. This approach serves several purposes:

- **Transparency**: The township can review and audit the code
- **Accessibility**: The township always has access to the source code
- **Protection**: Prevents unauthorized use or redistribution
- **Quality**: Demonstrates professional software development practices

## License

**Copyright (c) 2025. All Rights Reserved.**

This is proprietary software developed for Berkeley Heights Township, NJ. While the code is publicly visible, it may not be used, copied, modified, or distributed without explicit written permission from the copyright holder.

See the [LICENSE](LICENSE) file for complete terms and conditions.

---

**Built with ❤️ for the veterans of Berkeley Heights, New Jersey**
