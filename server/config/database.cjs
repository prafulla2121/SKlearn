// In-memory database simulation for demo purposes
// In production, replace with actual database (PostgreSQL, MongoDB, etc.)

class Database {
  constructor() {
    this.users = new Map();
    this.courses = new Map();
    this.enrollments = new Map();
    this.progress = new Map();
    this.certificates = new Map();
    
    // Initialize with sample data
    this.initializeSampleData();
  }

  initializeSampleData() {
    // Sample courses
    const sampleCourses = [
      {
        id: '1',
        title: 'Full Stack Web Development',
        description: 'Master modern web development with React, Node.js, and MongoDB. Build real-world applications from scratch.',
        instructor: 'Sarah Chen',
        category: 'Development',
        duration: '12 weeks',
        level: 'Intermediate',
        price: 89,
        thumbnail: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        lessons: 45,
        students: 1250,
        rating: 4.8,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15')
      },
      {
        id: '2',
        title: 'UI/UX Design Masterclass',
        description: 'Learn design thinking, prototyping, and user research. Create stunning interfaces that users love.',
        instructor: 'Michael Rodriguez',
        category: 'Design',
        duration: '8 weeks',
        level: 'Beginner',
        price: 69,
        thumbnail: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        lessons: 32,
        students: 890,
        rating: 4.9,
        createdAt: new Date('2024-01-20'),
        updatedAt: new Date('2024-01-20')
      },
      {
        id: '3',
        title: 'Python for Data Science',
        description: 'Dive into data analysis, visualization, and machine learning with Python, pandas, and scikit-learn.',
        instructor: 'Dr. Emily Watson',
        category: 'Data Science',
        duration: '10 weeks',
        level: 'Intermediate',
        price: 99,
        thumbnail: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        lessons: 38,
        students: 2100,
        rating: 4.7,
        createdAt: new Date('2024-01-25'),
        updatedAt: new Date('2024-01-25')
      },
      {
        id: '4',
        title: 'Digital Marketing Strategy',
        description: 'Master SEO, social media marketing, and content strategy to grow your business online.',
        instructor: 'James Wilson',
        category: 'Business',
        duration: '6 weeks',
        level: 'Beginner',
        price: 59,
        thumbnail: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        lessons: 24,
        students: 750,
        rating: 4.6,
        createdAt: new Date('2024-02-01'),
        updatedAt: new Date('2024-02-01')
      }
    ];

    sampleCourses.forEach(course => {
      this.courses.set(course.id, course);
    });
  }

  // User operations
  async createUser(userData) {
    const id = Date.now().toString();
    const user = {
      id,
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async findUserById(id) {
    return this.users.get(id) || null;
  }

  async findUserByEmail(email) {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }

  async findUserByGoogleId(googleId) {
    for (const user of this.users.values()) {
      if (user.googleId === googleId) {
        return user;
      }
    }
    return null;
  }

  async updateUser(id, updates) {
    const user = this.users.get(id);
    if (user) {
      const updatedUser = { ...user, ...updates, updatedAt: new Date() };
      this.users.set(id, updatedUser);
      return updatedUser;
    }
    return null;
  }

  // Course operations
  async getAllCourses() {
    return Array.from(this.courses.values());
  }

  async getCourseById(id) {
    return this.courses.get(id) || null;
  }

  async getCoursesByCategory(category) {
    return Array.from(this.courses.values()).filter(course => 
      course.category.toLowerCase() === category.toLowerCase()
    );
  }

  // Enrollment operations
  async enrollUser(userId, courseId) {
    const enrollmentId = `${userId}-${courseId}`;
    const enrollment = {
      id: enrollmentId,
      userId,
      courseId,
      enrolledAt: new Date(),
      progress: 0,
      completed: false
    };
    this.enrollments.set(enrollmentId, enrollment);
    return enrollment;
  }

  async getUserEnrollments(userId) {
    const userEnrollments = [];
    for (const enrollment of this.enrollments.values()) {
      if (enrollment.userId === userId) {
        const course = await this.getCourseById(enrollment.courseId);
        userEnrollments.push({
          ...enrollment,
          course
        });
      }
    }
    return userEnrollments;
  }

  async updateProgress(userId, courseId, progress) {
    const enrollmentId = `${userId}-${courseId}`;
    const enrollment = this.enrollments.get(enrollmentId);
    if (enrollment) {
      enrollment.progress = progress;
      enrollment.completed = progress >= 100;
      enrollment.updatedAt = new Date();
      this.enrollments.set(enrollmentId, enrollment);
      return enrollment;
    }
    return null;
  }

  // Statistics
  async getUserStats(userId) {
    const enrollments = await this.getUserEnrollments(userId);
    const totalCourses = enrollments.length;
    const completedCourses = enrollments.filter(e => e.completed).length;
    const inProgressCourses = enrollments.filter(e => !e.completed && e.progress > 0).length;
    const totalLearningTime = totalCourses * 15; // Simulated learning time

    return {
      totalCourses,
      completedCourses,
      inProgressCourses,
      totalLearningTime,
      certificates: completedCourses
    };
  }
}

module.exports = new Database();