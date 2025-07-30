// Dashboard functionality
class Dashboard {
    constructor() {
        this.user = null;
        this.stats = null;
        this.enrollments = [];
        this.recentActivity = [];
    }

    async init() {
        // Check authentication
        const isAuthenticated = await authManager.checkAuth();
        if (!isAuthenticated) {
            window.location.href = '/login';
            return;
        }

        this.user = authManager.getCurrentUser();
        await this.loadDashboardData();
        this.renderDashboard();
        this.setupEventListeners();
    }

    async loadDashboardData() {
        try {
            const data = await authManager.apiRequest('/api/user/dashboard');
            if (data && data.success) {
                this.stats = data.dashboard.stats;
                this.enrollments = data.dashboard.recentEnrollments;
                this.recentActivity = data.dashboard.recentActivity;
            }
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        }
    }

    renderDashboard() {
        this.renderUserInfo();
        this.renderStats();
        this.renderEnrollments();
        this.renderRecentActivity();
    }

    renderUserInfo() {
        const userNameElements = document.querySelectorAll('.user-name');
        const welcomeTitle = document.querySelector('.welcome-title');
        
        if (this.user) {
            userNameElements.forEach(el => {
                el.textContent = this.user.name || 'User';
            });
            
            if (welcomeTitle) {
                welcomeTitle.textContent = `Welcome back, ${this.user.name || 'User'}! 👋`;
            }
        }
    }

    renderStats() {
        if (!this.stats) return;

        const statElements = {
            totalCourses: document.querySelector('[data-stat="total-courses"] .stat-number'),
            completedCourses: document.querySelector('[data-stat="completed"] .stat-number'),
            learningTime: document.querySelector('[data-stat="learning-time"] .stat-number'),
            certificates: document.querySelector('[data-stat="certificates"] .stat-number')
        };

        // Update stat numbers with animation
        if (statElements.totalCourses) {
            this.animateNumber(statElements.totalCourses, this.stats.totalCourses);
        }
        if (statElements.completedCourses) {
            this.animateNumber(statElements.completedCourses, this.stats.completedCourses);
        }
        if (statElements.learningTime) {
            this.animateNumber(statElements.learningTime, this.stats.totalLearningTime, 'h');
        }
        if (statElements.certificates) {
            this.animateNumber(statElements.certificates, this.stats.certificates);
        }
    }

    renderEnrollments() {
        const coursesGrid = document.querySelector('.dashboard-courses-grid');
        if (!coursesGrid || !this.enrollments.length) return;

        coursesGrid.innerHTML = this.enrollments.map(enrollment => `
            <div class="dashboard-course-card">
                <div class="course-header">
                    <div class="course-thumbnail" style="background: ${enrollment.course.thumbnail};"></div>
                    <div class="course-info">
                        <h3 class="course-title">${enrollment.course.title}</h3>
                        <p class="course-instructor">by ${enrollment.course.instructor}</p>
                    </div>
                </div>
                <div class="progress-section">
                    <div class="progress-info">
                        <span class="progress-text">Progress</span>
                        <span class="progress-percentage">${enrollment.progress}%</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${enrollment.progress}%;"></div>
                    </div>
                </div>
                <div class="course-actions">
                    <button class="continue-btn" onclick="dashboard.continueCourse('${enrollment.courseId}')">
                        Continue Learning
                    </button>
                    <span class="last-accessed">Last accessed ${timeAgo(enrollment.enrolledAt)}</span>
                </div>
            </div>
        `).join('');
    }

    renderRecentActivity() {
        const activityList = document.querySelector('.activity-list');
        if (!activityList || !this.recentActivity.length) return;

        activityList.innerHTML = this.recentActivity.map(activity => `
            <div class="activity-item">
                <div class="activity-icon">${activity.icon}</div>
                <div class="activity-content">
                    <h4 class="activity-title">${activity.title}</h4>
                    <p class="activity-description">${activity.description}</p>
                    <span class="activity-time">${activity.time}</span>
                </div>
            </div>
        `).join('');
    }

    animateNumber(element, targetNumber, suffix = '') {
        const startNumber = 0;
        const duration = 1000;
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const currentNumber = Math.floor(startNumber + (targetNumber - startNumber) * progress);
            element.textContent = currentNumber + suffix;

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    async continueCourse(courseId) {
        try {
            // Simulate continuing course (in a real app, this would navigate to the course)
            const response = await authManager.apiRequest(`/api/courses/${courseId}/progress`, {
                method: 'PUT',
                body: JSON.stringify({ progress: Math.min(100, Math.random() * 100) })
            });

            if (response && response.success) {
                // Reload dashboard data to reflect changes
                await this.loadDashboardData();
                this.renderEnrollments();
                this.showNotification('Progress updated!', 'success');
            }
        } catch (error) {
            console.error('Failed to continue course:', error);
            this.showNotification('Failed to update progress', 'error');
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Style the notification
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '1rem 1.5rem',
            borderRadius: '10px',
            color: 'white',
            fontWeight: '500',
            zIndex: '9999',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease'
        });

        // Set background color based on type
        const colors = {
            success: '#38A169',
            error: '#E53E3E',
            info: '#5A67D8'
        };
        notification.style.backgroundColor = colors[type] || colors.info;

        // Add to DOM
        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    setupEventListeners() {
        // Logout functionality
        const logoutBtn = document.querySelector('.logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                authManager.logout();
            });
        }

        // Notification buttons
        const notificationBtn = document.querySelector('.action-btn');
        if (notificationBtn) {
            notificationBtn.addEventListener('click', () => {
                this.showNotification('No new notifications', 'info');
            });
        }
    }
}

// Initialize dashboard when DOM is loaded
const dashboard = new Dashboard();
document.addEventListener('DOMContentLoaded', () => {
    dashboard.init();
});