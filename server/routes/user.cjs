const express = require('express');
const database = require('../config/database.cjs');
const { authenticateToken } = require('../middleware/auth.cjs');
const router = express.Router();

// Get user profile (requires authentication)
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const { password, ...userProfile } = req.user;
    res.json({
      success: true,
      user: userProfile
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile'
    });
  }
});

// Update user profile (requires authentication)
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, firstName, lastName, bio, phone } = req.body;

    const updatedUser = await database.updateUser(userId, {
      name,
      firstName,
      lastName,
      bio,
      phone
    });

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const { password, ...userResponse } = updatedUser;
    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: userResponse
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
});

// Get user enrollments (requires authentication)
router.get('/enrollments', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const enrollments = await database.getUserEnrollments(userId);

    res.json({
      success: true,
      enrollments
    });
  } catch (error) {
    console.error('Get enrollments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch enrollments'
    });
  }
});

// Get user statistics (requires authentication)
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const stats = await database.getUserStats(userId);

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics'
    });
  }
});

// Get user dashboard data (requires authentication)
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user stats
    const stats = await database.getUserStats(userId);
    
    // Get recent enrollments
    const enrollments = await database.getUserEnrollments(userId);
    const recentEnrollments = enrollments
      .sort((a, b) => new Date(b.enrolledAt) - new Date(a.enrolledAt))
      .slice(0, 3);

    // Generate recent activity (simulated)
    const recentActivity = [
      {
        id: '1',
        type: 'course_completed',
        title: 'Course Completed!',
        description: 'You\'ve successfully completed "Advanced JavaScript Concepts"',
        time: '2 hours ago',
        icon: '🎉'
      },
      {
        id: '2',
        type: 'assignment_submitted',
        title: 'Assignment Submitted',
        description: 'Project submission for "Full Stack Web Development"',
        time: '1 day ago',
        icon: '📝'
      },
      {
        id: '3',
        type: 'certificate_earned',
        title: 'Certificate Earned',
        description: 'Received certificate for "UI/UX Design Fundamentals"',
        time: '3 days ago',
        icon: '🏆'
      }
    ];

    res.json({
      success: true,
      dashboard: {
        user: req.user,
        stats,
        recentEnrollments,
        recentActivity
      }
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data'
    });
  }
});

module.exports = router;