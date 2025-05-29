# Frontend Requirements from Backend - Departments Feature

## 1. API Endpoints Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Header
```
Authorization: Bearer <jwt_token>
```

### Department API Endpoints

| Method | Endpoint | Description | Permissions Required |
|--------|----------|-------------|---------------------|
| GET | `/departments` | Get all departments with search/filter | `departments.read` |
| GET | `/departments/:id` | Get department by ID | `departments.read` |
| POST | `/departments` | Create new department | `departments.create` |
| PUT | `/departments/:id` | Update department | `departments.update` |
| DELETE | `/departments/:id` | Delete department | `departments.delete` |
| GET | `/departments/college/:collegeId` | Get departments by college | `departments.read` |

### Query Parameters for GET /departments
- `search` (string): Search in name, code, email
- `status` (string): Filter by status ('active' or 'inactive')
- `collegeId` (string): Filter by college ID

## 2. Data Models/Types

### Department Interface
```typescript
interface Department {
  _id: string;
  name: string;
  code: string;
  collegeId: string;
  hodId?: string;
  logo?: string;
  description?: string;
  email?: string;
  phone?: string;
  establishedDate?: string;
  status: 'active' | 'inactive';
  dateCreated: string;
  dateUpdated: string;
  
  // Populated fields (when populated)
  collegeName?: string;
  collegeCode?: string;
  hodName?: string;
  hodEmail?: string;
}
```

### College Interface (for dropdowns)
```typescript
interface College {
  _id: string;
  name: string;
  code: string;
  // ... other fields
}
```

### User Interface (for HOD selection)
```typescript
interface User {
  _id: string;
  username: string;
  email: string;
  // ... other fields
}
```

## 3. Request/Response Examples

### GET /departments Response
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Computer Science and Engineering",
    "code": "CSE",
    "collegeId": "507f1f77bcf86cd799439012",
    "hodId": "507f1f77bcf86cd799439013",
    "logo": "https://example.com/logo.jpg",
    "description": "Department of Computer Science...",
    "email": "cse@college.edu",
    "phone": "(123) 456-7890",
    "establishedDate": "1965-09-15T00:00:00.000Z",
    "status": "active",
    "dateCreated": "2024-01-01T00:00:00.000Z",
    "dateUpdated": "2024-01-01T00:00:00.000Z",
    "collegeName": "MIT",
    "collegeCode": "MIT",
    "hodName": "Dr. Smith",
    "hodEmail": "smith@college.edu"
  }
]
```

### POST /departments Request Body
```json
{
  "name": "Computer Science and Engineering",
  "code": "CSE",
  "collegeId": "507f1f77bcf86cd799439012",
  "hodId": "507f1f77bcf86cd799439013",
  "logo": "https://example.com/logo.jpg",
  "description": "Department description...",
  "email": "cse@college.edu",
  "phone": "(123) 456-7890",
  "establishedDate": "1965-09-15",
  "status": "active"
}
```

## 4. Validation Rules

### Required Fields
- `name`: Minimum 2 characters
- `code`: Minimum 2 characters, uppercase letters and numbers only
- `collegeId`: Valid MongoDB ObjectId

### Optional Fields with Validation
- `email`: Valid email format
- `phone`: Valid phone format (regex: `/^[\+]?[\d\s\-\(\)]+$/`)
- `establishedDate`: Valid ISO8601 date format
- `hodId`: Valid MongoDB ObjectId (if provided)

## 5. Error Responses

### Validation Errors (400)
```json
{
  "errors": [
    {
      "field": "name",
      "message": "Department name must be at least 2 characters"
    }
  ]
}
```

### Not Found (404)
```json
{
  "message": "Department not found"
}
```

### Server Error (500)
```json
{
  "message": "Server error"
}
```

### Duplicate Code Error (400)
```json
{
  "message": "Department with this code already exists"
}
```

## 6. Dependent API Endpoints

### For Form Dropdowns
```javascript
// Get all colleges for college selection
GET /colleges
Response: College[]

// Get all users for HOD selection  
GET /users
Response: User[]
```

## 7. Authentication & Permissions

### JWT Token Structure
The frontend needs to handle JWT tokens that contain user permissions:

```javascript
// Token payload contains:
{
  "userId": "string",
  "permissions": [
    "departments.read",
    "departments.create", 
    "departments.update",
    "departments.delete"
  ]
}
```

### Permission Checks
Frontend should check permissions before showing:
- Add Department button (`departments.create`)
- Edit buttons (`departments.update`) 
- Delete buttons (`departments.delete`)

## 8. Image/File Upload Requirements

### Image Picker Integration
If using image picker for logos:
- Supported formats: JPG, PNG, GIF
- Maximum file size: 5MB
- Storage: Backend should return image URL after upload

## 9. Environment Configuration

### Required Environment Variables
```javascript
// .env file
REACT_APP_API_BASE_URL=http://localhost:5000/api
REACT_APP_UPLOAD_URL=http://localhost:5000/uploads
```

## 10. Utility Functions Needed

### API Client Setup
```javascript
const fetchWithAuth = async (url, options = {}) => {
  const token = localStorage.getItem('authToken');
  return fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });
};
```

### Department API Service
```javascript
export const departmentsApi = {
  getAll: (params) => fetchWithAuth(`/departments?${new URLSearchParams(params)}`),
  getById: (id) => fetchWithAuth(`/departments/${id}`),
  create: (data) => fetchWithAuth('/departments', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => fetchWithAuth(`/departments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => fetchWithAuth(`/departments/${id}`, { method: 'DELETE' }),
  getByCollege: (collegeId) => fetchWithAuth(`/departments/college/${collegeId}`)
};
```

## 11. State Management Requirements

### Component State Structure
```javascript
const [departments, setDepartments] = useState([]);
const [colleges, setColleges] = useState([]);
const [users, setUsers] = useState([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);
const [searchTerm, setSearchTerm] = useState('');
const [selectedCollege, setSelectedCollege] = useState('');
```

## 12. UI/UX Requirements

### Loading States
- Skeleton loading for cards
- Button loading states during form submission
- Spinner for data fetching

### Error Handling
- Display validation errors inline
- Show toast notifications for success/error
- Graceful error boundaries

### Responsive Design
- Grid layout that adapts to screen size
- Mobile-friendly forms and modals
- Touch-friendly interaction elements

## 13. Testing Requirements

### Mock Data for Development
```javascript
const mockDepartments = [
  {
    _id: '1',
    name: 'Computer Science',
    code: 'CS',
    collegeName: 'Engineering College',
    status: 'active',
    // ... other fields
  }
];
```

### API Mocking
- Mock successful responses
- Mock error scenarios (404, 500, validation errors)
- Mock slow network conditions

This comprehensive list provides everything a frontend developer needs to build a standalone Departments management interface that properly integrates with your backend API.