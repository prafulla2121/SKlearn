const express = require('express');
const database = require('../config/database.cjs');
const { authenticateToken } = require('../middleware/auth.cjs');
const router = express.Router();

// Get all courses
router.get('/', async (req, res) => {
  try {
    const { category, search, limit = 10, offset = 0 } = req.query;
    let courses = await database.getAllCourses();

    // Filter by category
    if (category) {
      courses = courses.filter(course => 
        course.category.toLowerCase() === category.toLowerCase()
      );
    }

    // Search functionality
    if (search) {
      const searchTerm = search.toLowerCase();
      courses = courses.filter(course =>
        course.title.toLowerCase().includes(searchTerm) ||
        course.description.toLowerCase().includes(searchTerm) ||
        course.instructor.toLowerCase().includes(searchTerm)
      );
    }

    // Pagination
    const total = courses.length;
    const paginatedCourses = courses.slice(
      parseInt(offset), 
      parseInt(offset) + parseInt(limit)
    );

    res.json({
      success: true,
      courses: paginatedCourses,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + parseInt(limit) < total
      }
    });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch courses'
    });
  }
});

// Get course by ID
router.get('/:id', async (req, res) => {
  try {
    const course = await database.getCourseById(req.params.id);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    res.json({
      success: true,
      course
    });
  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch course'
    });
  }
});

// Enroll in a course (requires authentication)
router.post('/:id/enroll', authenticateToken, async (req, res) => {
  try {
    const courseId = req.params.id;
    const userId = req.user.id;

    // Check if course exists
    const course = await database.getCourseById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if user is already enrolled
    const existingEnrollments = await database.getUserEnrollments(userId);
    const alreadyEnrolled = existingEnrollments.some(e => e.courseId === courseId);

    if (alreadyEnrolled) {
      return res.status(400).json({
        success: false,
        message: 'Already enrolled in this course'
      });
    }

    // Enroll user
    const enrollment = await database.enrollUser(userId, courseId);

    res.status(201).json({
      success: true,
      message: 'Successfully enrolled in course',
      enrollment: {
        ...enrollment,
        course
      }
    });
  } catch (error) {
    console.error('Enrollment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to enroll in course'
    });
  }
});

// Update course progress (requires authentication)
router.put('/:id/progress', authenticateToken, async (req, res) => {
  try {
    const courseId = req.params.id;
    const userId = req.user.id;
    const { progress } = req.body;

    // Validate progress
    if (typeof progress !== 'number' || progress < 0 || progress > 100) {
      return res.status(400).json({
        success: false,
        message: 'Progress must be a number between 0 and 100'
      });
    }

    // Update progress
    const updatedEnrollment = await database.updateProgress(userId, courseId, progress);

    if (!updatedEnrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    res.json({
      success: true,
      message: 'Progress updated successfully',
      enrollment: updatedEnrollment
    });
  } catch (error) {
    console.error('Progress update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update progress'
    });
  }
});

// Get course categories
router.get('/meta/categories', async (req, res) => {
  try {
    const courses = await database.getAllCourses();
    const categories = [...new Set(courses.map(course => course.category))];

    res.json({
      success: true,
      categories
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories'
    });
  }
});

module.exports = router;