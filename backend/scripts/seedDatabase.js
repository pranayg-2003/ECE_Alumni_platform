// scripts/seedDatabase.js
// Generate dummy data for testing the mentorship platform

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const MentorshipRequest = require("../models/MentorshipRequest");
require("dotenv").config();

// Dummy data
const alumniData = [
  {
    name: "Jatin Kumar",
    email: "jatin@alumni.com",
    password: "password123",
    role: "alumni",
    company: "Google",
    jobTitle: "Senior Software Engineer",
    graduationYear: 2020,
    bio: "Passionate about web development and cloud technologies. Helping students transition into tech careers.",
    skills: ["React", "Node.js", "Python", "AWS"],
    profilePicture: "",
    isActive: true,
  },
  {
    name: "Harshit Singh",
    email: "harshit@alumni.com",
    password: "password123",
    role: "alumni",
    company: "Microsoft",
    jobTitle: "Full Stack Developer",
    graduationYear: 2021,
    bio: "Expert in JavaScript, React, and backend systems. Always happy to mentor!",
    skills: ["JavaScript", "TypeScript", "MongoDB", "Express.js"],
    profilePicture: "",
    isActive: true,
  },
  {
    name: "Priya Sharma",
    email: "priya@alumni.com",
    password: "password123",
    role: "alumni",
    company: "Amazon",
    jobTitle: "Product Manager",
    graduationYear: 2019,
    bio: "Transitioned from engineering to product. Can help with career guidance and tech interviews.",
    skills: ["System Design", "Java", "AWS", "Problem Solving"],
    profilePicture: "",
    isActive: true,
  },
  {
    name: "Rajesh Patel",
    email: "rajesh@alumni.com",
    password: "password123",
    role: "alumni",
    company: "Meta",
    jobTitle: "Backend Engineer",
    graduationYear: 2020,
    bio: "Specialized in scalable backend systems. Passionate about databases and microservices.",
    skills: ["Java", "Kotlin", "PostgreSQL", "Docker"],
    profilePicture: "",
    isActive: true,
  },
  {
    name: "Isha Verma",
    email: "isha@alumni.com",
    password: "password123",
    role: "alumni",
    company: "Apple",
    jobTitle: "iOS Developer",
    graduationYear: 2022,
    bio: "Mobile development expert. Specialized in Swift and iOS architecture.",
    skills: ["Swift", "iOS", "Objective-C", "UIKit"],
    profilePicture: "",
    isActive: true,
  },
  {
    name: "Amit Desai",
    email: "amit@alumni.com",
    password: "password123",
    role: "alumni",
    company: "Tesla",
    jobTitle: "Data Scientist",
    graduationYear: 2021,
    bio: "Machine learning and AI enthusiast. Love working with large datasets and neural networks.",
    skills: ["Python", "TensorFlow", "PyTorch", "SQL"],
    profilePicture: "",
    isActive: true,
  },
  {
    name: "Sophia Chen",
    email: "sophia@alumni.com",
    password: "password123",
    role: "alumni",
    company: "Spotify",
    jobTitle: "DevOps Engineer",
    graduationYear: 2020,
    bio: "Infrastructure and deployment automation expert.",
    skills: ["Kubernetes", "Docker", "CI/CD", "Linux"],
    profilePicture: "",
    isActive: true,
  },
  {
    name: "Marco Rodriguez",
    email: "marco@alumni.com",
    password: "password123",
    role: "alumni",
    company: "Netflix",
    jobTitle: "Solutions Architect",
    graduationYear: 2019,
    bio: "Experience building large-scale distributed systems.",
    skills: ["System Architecture", "Go", "gRPC", "Microservices"],
    profilePicture: "",
    isActive: true,
  },
];

const studentData = [
  {
    name: "Aditya Kumar",
    email: "aditya@student.com",
    password: "password123",
    role: "student",
    branch: "Computer Science",
    year: 3,
    bio: "Interested in web development",
    skills: ["HTML", "CSS", "JavaScript"],
    interests: ["Web Development", "Startups"],
    isActive: true,
  },
  {
    name: "Neha Singh",
    email: "neha@student.com",
    password: "password123",
    role: "student",
    branch: "Information Technology",
    year: 2,
    bio: "Learning full stack development",
    skills: ["React", "Node.js"],
    interests: ["Full Stack", "AI/ML"],
    isActive: true,
  },
  {
    name: "Rahul Gupta",
    email: "rahul@student.com",
    password: "password123",
    role: "student",
    branch: "Computer Science",
    year: 4,
    bio: "Preparing for placement interviews",
    skills: ["Java", "DSA", "SQL"],
    interests: ["Backend", "Problem Solving"],
    isActive: true,
  },
  {
    name: "Ananya Patel",
    email: "ananya@student.com",
    password: "password123",
    role: "student",
    branch: "Information Technology",
    year: 1,
    bio: "Just started my college journey",
    skills: ["Python", "Basics"],
    interests: ["Data Science", "AI"],
    isActive: true,
  },
  {
    name: "Vikram Nair",
    email: "vikram@student.com",
    password: "password123",
    role: "student",
    branch: "Computer Science",
    year: 3,
    bio: "Mobile app developer",
    skills: ["Swift", "React Native"],
    interests: ["Mobile Development", "iOS"],
    isActive: true,
  },
];

// Function to seed database
const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/mentorship-platform", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB\n");

    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log("🗑️  Clearing existing data...");
    await User.deleteMany({});
    await MentorshipRequest.deleteMany({});
    console.log("✅ Database cleared\n");

    // Hash passwords before inserting (insertMany bypasses Mongoose middleware)
    console.log("🔐 Hashing passwords...");
    const hashPassword = async (password) => {
      const salt = await bcrypt.genSalt(10);
      return await bcrypt.hash(password, salt);
    };

    // Create copies of data and hash passwords
    const alumniWithHashedPasswords = await Promise.all(
      alumniData.map(async (alumni) => ({
        ...alumni,
        password: await hashPassword(alumni.password),
      }))
    );

    const studentWithHashedPasswords = await Promise.all(
      studentData.map(async (student) => ({
        ...student,
        password: await hashPassword(student.password),
      }))
    );
    console.log("✅ Passwords hashed\n");

    // Insert alumni
    console.log("📚 Creating alumni...");
    const createdAlumni = await User.insertMany(alumniWithHashedPasswords);
    console.log(`✅ Created ${createdAlumni.length} alumni\n`);

    // Insert students
    console.log("👨‍🎓 Creating students...");
    const createdStudents = await User.insertMany(studentWithHashedPasswords);
    console.log(`✅ Created ${createdStudents.length} students\n`);

    // Create sample mentorship requests
    console.log("🤝 Creating sample mentorship requests...");
    const requests = [
      {
        studentId: createdStudents[0]._id,
        alumniId: createdAlumni[0]._id, // Aditya -> Jatin
        status: "pending",
        message: "Hi Jatin, I'm interested in learning web development from you!",
      },
      {
        studentId: createdStudents[1]._id,
        alumniId: createdAlumni[1]._id, // Neha -> Harshit
        status: "accepted",
        message: "Hi Harshit, can you help me with full stack?",
        respondedAt: new Date(),
        responseMessage: "Sure! Let's start with React fundamentals.",
      },
      {
        studentId: createdStudents[2]._id,
        alumniId: createdAlumni[3]._id, // Rahul -> Rajesh
        status: "pending",
        message: "Hi Rajesh, interested in backend development",
      },
      {
        studentId: createdStudents[0]._id,
        alumniId: createdAlumni[2]._id, // Aditya -> Priya
        status: "rejected",
        message: "Can you mentor me on career transition?",
        respondedAt: new Date(),
        responseMessage: "You need more experience first!",
      },
      {
        studentId: createdStudents[4]._id,
        alumniId: createdAlumni[4]._id, // Vikram -> Isha
        status: "pending",
        message: "Hi Isha, I want to become iOS developer like you!",
      },
    ];

    const createdRequests = await MentorshipRequest.insertMany(requests);
    console.log(`✅ Created ${createdRequests.length} mentorship requests\n`);

    // Print summary
    console.log("=" * 50);
    console.log("✅ DATABASE SEEDING COMPLETED SUCCESSFULLY!");
    console.log("=" * 50);
    console.log(`
📊 Summary:
   ✓ Alumni created: ${createdAlumni.length}
   ✓ Students created: ${createdStudents.length}
   ✓ Mentorship requests created: ${createdRequests.length}

🔑 Test Credentials:

📚 Alumni Accounts:
   1. Jatin Kumar - jatin@alumni.com / password123
   2. Harshit Singh - harshit@alumni.com / password123
   3. Priya Sharma - priya@alumni.com / password123
   4. Rajesh Patel - rajesh@alumni.com / password123
   5. Isha Verma - isha@alumni.com / password123

👨‍🎓 Student Accounts:
   1. Aditya Kumar - aditya@student.com / password123
   2. Neha Singh - neha@student.com / password123
   3. Rahul Gupta - rahul@student.com / password123
   4. Ananya Patel - ananya@student.com / password123
   5. Vikram Nair - vikram@student.com / password123

🧪 Testing Tips:
   • Search for alumni like "jatin", "harshit", "priya"
   • Try sending connection requests from student accounts
   • Check different request statuses (pending, accepted, rejected)

    `);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
};

// Run the seed function
seedDatabase();
