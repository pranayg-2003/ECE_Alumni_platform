# Database Seeding Guide

This guide explains how to generate dummy data for testing the mentorship platform.

## What Gets Created

The seed script generates:
- **8 Alumni** with realistic profiles (Google, Microsoft, Amazon, Meta, Apple, Tesla, Spotify, Netflix)
- **5 Students** with different branches and years
- **5 Mentorship Requests** in different statuses (pending, accepted, rejected)

## How to Run

### Option 1: Using npm script (Recommended)

```bash
cd backend
npm run seed
```

### Option 2: Direct node command

```bash
cd backend
node scripts/seedDatabase.js
```

## What Happens

The script will:
1. ✅ Connect to your MongoDB database
2. ✅ Clear existing users and mentorship requests
3. ✅ Create 8 alumni accounts
4. ✅ Create 5 student accounts
5. ✅ Create 5 sample mentorship requests
6. ✅ Print credentials and testing tips

## Test Credentials

### Alumni Accounts
```
1. Jatin Kumar
   Email: jatin@alumni.com
   Password: password123
   Company: Google
   Skills: React, Node.js, Python, AWS

2. Harshit Singh
   Email: harshit@alumni.com
   Password: password123
   Company: Microsoft
   Skills: JavaScript, TypeScript, MongoDB, Express.js

3. Priya Sharma
   Email: priya@alumni.com
   Password: password123
   Company: Amazon
   Skills: System Design, Java, AWS, Problem Solving

4. Rajesh Patel
   Email: rajesh@alumni.com
   Password: password123
   Company: Meta
   Skills: Java, Kotlin, PostgreSQL, Docker

5. Isha Verma
   Email: isha@alumni.com
   Password: password123
   Company: Apple
   Skills: Swift, iOS, Objective-C, UIKit

6. Amit Desai
   Email: amit@alumni.com
   Password: password123
   Company: Tesla
   Skills: Python, TensorFlow, PyTorch, SQL

7. Sophia Chen
   Email: sophia@alumni.com
   Password: password123
   Company: Spotify
   Skills: Kubernetes, Docker, CI/CD, Linux

8. Marco Rodriguez
   Email: marco@alumni.com
   Password: password123
   Company: Netflix
   Skills: System Architecture, Go, gRPC, Microservices
```

### Student Accounts
```
1. Aditya Kumar
   Email: aditya@student.com
   Password: password123
   Year: 3rd
   Branch: Computer Science

2. Neha Singh
   Email: neha@student.com
   Password: password123
   Year: 2nd
   Branch: Information Technology

3. Rahul Gupta
   Email: rahul@student.com
   Password: password123
   Year: 4th
   Branch: Computer Science

4. Ananya Patel
   Email: ananya@student.com
   Password: password123
   Year: 1st
   Branch: Information Technology

5. Vikram Nair
   Email: vikram@student.com
   Password: password123
   Year: 3rd
   Branch: Computer Science
```

## Testing Scenarios

### Test 1: Search Alumni
1. Login as **Aditya Kumar** (aditya@student.com)
2. Click "Search Alumni" in navbar
3. Type "jatin" → Should find Jatin Kumar from Google
4. Type "harshit" → Should find Harshit Singh from Microsoft
5. Type "react" → Should find alumni with React skill
6. Type "python" → Should find alumni with Python skill

### Test 2: Send Mentorship Request
1. Login as a student (e.g., aditya@student.com)
2. Search for an alumni (e.g., "priya")
3. Click "Send Request" button
4. Check the button changes to "Request Sent ✓"

### Test 3: View Different Request Statuses
- Student: aditya@student.com → has request to Jatin (pending)
- Student: neha@student.com → has request to Harshit (accepted)
- Student: rahul@student.com → has request to Rajesh (pending)

## If You Want to Reset Data

To clear all data and start fresh, just run the seed script again:

```bash
npm run seed
```

It will automatically delete old data and create new dummy data.

## Modifying Seed Data

To add more alumni or students, edit `scripts/seedDatabase.js`:

1. Add new objects to `alumniData` array or `studentData` array
2. Run `npm run seed` again

Example:
```javascript
{
  name: "Your Name",
  email: "yourname@alumni.com",
  password: "password123",
  role: "alumni",
  company: "Your Company",
  jobTitle: "Your Job Title",
  graduationYear: 2023,
  bio: "Your bio here",
  skills: ["Skill1", "Skill2", "Skill3"],
  isActive: true,
}
```

## Troubleshooting

### MongoDB Connection Error
**Problem**: `Error: connect ECONNREFUSED 127.0.0.1:27017`

**Solution**: Make sure MongoDB is running
```bash
# On Windows (if using MongoDB as service)
net start MongoDB

# On Mac
brew services start mongodb-community

# On Linux
sudo systemctl start mongod
```

### Script Hangs
**Problem**: Script seems to hang after connecting

**Solution**: 
1. Check your `.env` file has correct `MONGODB_URI`
2. Make sure MongoDB port 27017 is accessible
3. Kill the script (Ctrl+C) and try again

### Permission Issues
**Problem**: `EACCES: permission denied`

**Solution**:
```bash
sudo npm run seed
```

## Next Steps

After seeding:
1. ✅ Start your backend: `npm run dev`
2. ✅ Start your frontend: `npm start`  
3. ✅ Login with test credentials
4. ✅ Test the search and mentorship features

---

For more details, see the main README and documentation in the project root.
