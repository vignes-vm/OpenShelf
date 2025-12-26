# OpenShelf Library Management System
## Complete Project Documentation

---

## 📚 Project Overview

**OpenShelf** is a modern, frictionless library management system designed for educational institutions. The system provides a seamless experience for students to discover and reserve books through a public-facing kiosk, while offering comprehensive management tools for library staff and administrators.

### Key Highlights

- **Student-Friendly Kiosk**: Public-facing interface for book discovery and 24-hour hold placement
- **Role-Based Access**: Separate dashboards for Librarians and Principals with appropriate permissions
- **Real-Time Updates**: Live book availability status and hold management
- **Automated Workflows**: Automatic hold expiration after 24 hours
- **Modern UI**: Clean, responsive design with dark/light theme support

---

## 🎯 System Features

### For Students
- 📖 Browse complete book catalog
- 🔍 Search by title, author, or ISBN
- 📝 Place 24-hour holds on available books
- 🎫 Receive digital hold confirmation tickets
- ⏰ View hold expiration times

### For Librarians
- 📊 View and manage active holds
- ✅ Issue books to students
- 📤 Process book returns
- 📚 Manage book inventory (add/delete books)
- 👥 Search student records and transaction history

### For Principals
- 📈 View comprehensive library statistics dashboard
- 📊 Monitor total books, available books, holds, and borrowed books
- 👨‍🎓 Access student database overview
- 📋 View all holds and borrowed books (read-only)
- 🎯 Complete administrative oversight

---

## 🏗️ Technical Architecture

### Technology Stack

**Frontend:**
- React 19.2.3
- React Router DOM 7.11.0
- Axios for API communication
- CSS3 with custom styling
- Context API for theme management

**Backend:**
- Node.js with Express 5.2.1
- PostgreSQL database
- Express Session for authentication
- bcryptjs for password hashing
- node-cron for scheduled tasks (hold expiration)
- CORS enabled for cross-origin requests

### Project Structure

```
OpenShelf/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   │   ├── LandingPage.js
│   │   │   ├── StudentKiosk.js
│   │   │   ├── AdminLogin.js
│   │   │   ├── AdminDashboard.js
│   │   │   └── ThemeToggle.js
│   │   ├── contexts/      # React contexts
│   │   │   └── ThemeContext.js
│   │   ├── App.js         # Main app component
│   │   └── App.css        # Global styles
│   └── package.json
│
└── server/                # Node.js backend
    ├── index.js           # Express server & API routes
    ├── db.js              # PostgreSQL connection
    ├── schema.sql         # Database schema
    └── package.json
```

---

## 🚀 Setup & Installation

### Prerequisites
- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn package manager

### Backend Setup

1. **Navigate to server directory:**
   ```bash
   cd server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   Create a `.env` file in the server directory:
   ```env
   DB_USER=your_db_user
   DB_HOST=localhost
   DB_NAME=openshelf
   DB_PASSWORD=your_db_password
   DB_PORT=5432
   SESSION_SECRET=your_session_secret
   ```

4. **Initialize database:**
   The database schema will be automatically initialized when you start the server.
   Alternatively, you can manually run:
   ```bash
   psql -U your_db_user -d openshelf -f schema.sql
   ```

5. **Start the server:**
   ```bash
   node index.js
   ```
   Server will run on `http://localhost:5000`

### Frontend Setup

1. **Navigate to client directory:**
   ```bash
   cd client
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm start
   ```
   Application will open on `http://localhost:3000`

---

## 🔐 Default Credentials

### Librarian Access
- **Username**: `librarian`
- **Password**: `lib123`
- **Permissions**: Manage holds, issue books, process returns, manage inventory

### Principal Access
- **Username**: `principal`
- **Password**: `prin123`
- **Permissions**: View dashboard, monitor all activities, read-only access

---

## 📸 Application Pages

### 1. Landing Page
The main entry point with three access cards for Students, Librarians, and Principals. Includes library hours and quick help information.

### 2. Student Kiosk
Public-facing interface for browsing books, searching by title/author/ISBN, and placing 24-hour holds. Features real-time availability status.

### 3. Hold Placement Modal
Modal dialog for entering student roll number when placing a hold. Validates student information and creates hold with expiration time.

### 4. Librarian Login
Secure authentication page for library staff with username/password fields and role-specific branding.

### 5. Principal Login
Administrative login page with principal-specific branding and highest-level access credentials.

### 6. Librarian Dashboard - Holds Tab
Default view showing all active holds with student information, expiration times, and "Issue Book" actions.

### 7. Librarian Dashboard - Inventory Tab
Book management interface with "Add New Book" form and current inventory table with delete functionality.

### 8. Principal Dashboard
Comprehensive overview with statistics cards for Total Books, Available, On Hold, Borrowed, and Students. Each card is clickable for detailed views.

---

## 🔄 Key Workflows

### Student Hold Workflow
1. Student visits kiosk and searches for book
2. Clicks "Place Hold" on available book
3. Enters roll number in modal
4. Receives digital confirmation ticket
5. Hold expires after 24 hours if not collected

### Librarian Book Issuance
1. Librarian views active holds
2. Student arrives to collect book
3. Librarian verifies student ID
4. Clicks "Issue Book" button
5. Book status changes to "borrowed"

### Book Return Process
1. Student returns book to librarian
2. Librarian searches by roll number
3. Views active borrowed books
4. Clicks "Mark Returned"
5. Book becomes available immediately

---

## 🗄️ Database Schema

### Tables

**books**
- `id` (Primary Key)
- `title`, `author`, `isbn`
- `quantity`, `status`
- `created_at`

**students**
- `roll_no` (Primary Key)
- `name`, `dept`
- `created_at`

**transactions**
- `id` (Primary Key)
- `book_id`, `roll_no`
- `action_type`, `status`
- `created_at`, `expires_at`

**admins**
- `id` (Primary Key)
- `username`, `password_hash`, `role`
- `created_at`

---

## 🔧 Automated Features

### Hold Expiration
- Cron job runs every hour
- Automatically expires holds after 24 hours
- Updates book status back to "available"
- Marks transaction as "expired"

### Real-Time Updates
- Book availability updates immediately after actions
- Hold list refreshes after issuance
- Inventory syncs across all views

---

## 🎨 Theme Support

- **Dark/Light Mode**: Toggle button in top-right corner
- **Persistent**: Theme preference saved in localStorage
- **Smooth Transitions**: CSS transitions for theme switching
- **Global State**: React Context API for theme management

---

## 📊 API Endpoints

### Public Endpoints
- `GET /api/books` - Get all books (with optional search)
- `POST /api/hold` - Place a hold on a book

### Protected Endpoints (Authentication Required)
- `POST /api/admin/login` - Admin authentication
- `POST /api/admin/logout` - End session
- `GET /api/admin/me` - Get current user info
- `GET /api/admin/holds` - Get all active holds
- `POST /api/admin/issue` - Issue book to student
- `POST /api/admin/return` - Process book return
- `GET /api/admin/issued-books` - Get all borrowed books
- `POST /api/admin/books` - Add new book
- `DELETE /api/admin/books/:id` - Delete book
- `GET /api/admin/students` - Get all students
- `POST /api/admin/students` - Add new student
- `GET /api/admin/student/:rollNo` - Get student transactions

---

## 📝 Business Rules

### Hold Management
- **Duration**: 24 hours from placement
- **Limit**: One active hold per student per book
- **Expiration**: Automatic after 24 hours
- **Notification**: Digital ticket with expiration time

### Book Issuance
- **Prerequisite**: Active hold must exist
- **Verification**: Student ID verification required
- **Status Change**: Book status changes from "on_hold" to "borrowed"

### Returns
- **Process**: Librarian marks book as returned
- **Status Update**: Book becomes "available" immediately
- **Availability**: Book can be held by other students

### Inventory Management
- **Add Books**: Librarians can add new books with quantity
- **Delete Books**: Only available books can be deleted
- **Duplicate ISBN**: Increases quantity of existing book

---

## 🔍 Search Functionality

### Student Kiosk
- Real-time filtering as user types
- Searches title, author, and ISBN
- Case-insensitive partial matching

### Admin Student Lookup
- Search by exact roll number
- Returns all active transactions
- Quick return functionality

---

## 🎯 Future Enhancements

### Potential Features
- 📧 Email notifications for hold confirmations
- 📱 Mobile app for students
- 📊 Advanced analytics and reporting
- 🔔 Push notifications for due dates
- 📖 Book recommendations
- 🏷️ Category and genre tagging
- ⭐ Book ratings and reviews
- 💳 Fine management for overdue books

### Technical Improvements
- 🔒 Two-factor authentication
- 🌐 Multi-language support
- 📱 Progressive Web App (PWA)
- 🔄 Real-time updates with WebSockets
- 🧪 Comprehensive test coverage
- 🐳 Docker containerization

---

## 🐛 Troubleshooting

### Common Issues

**Database Connection Error**
- Verify PostgreSQL is running
- Check `.env` file credentials
- Ensure database exists

**Frontend Not Loading**
- Check if backend is running on port 5000
- Verify CORS settings in server
- Clear browser cache

**Login Issues**
- Verify credentials match database
- Check session configuration
- Ensure cookies are enabled

---

## 📞 Support

For issues or questions:
1. Check the source code documentation
2. Review database schema in `server/schema.sql`
3. Examine API routes in `server/index.js`
4. Review React components in `client/src/components/`

---

**Project**: OpenShelf Library Management System  
**Version**: 1.0  
**Last Updated**: December 26, 2025  
**Status**: Production-Ready
