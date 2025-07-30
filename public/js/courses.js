// Course management functionality
class CourseManager {
    constructor() {
        this.courses = [];
        this.categories = [];
        this.currentPage = 0;
        this.pageSize = 8;
    }

    async init() {
        await this.loadCourses();
        await this.loadCategories();
        this.renderCourses();
        this.setupEventListeners();
    }

    async loadCourses(category = '', search = '') {
        try {
            const params = new URLSearchParams({
                limit: this.pageSize,
                offset: this.currentPage * this.pageSize,
                ...(category && { category }),
                ...(search && { search })
            });

            const response = await fetch(`/api/courses?${params}`);
            const data = await response.json();

            if (data.success) {
                this.courses = data.courses;
                this.pagination = data.pagination;
            }
        } catch (error) {
            console.error('Failed to load courses:', error);
        }
    }

    async loadCategories() {
        try {
            const response = await fetch('/api/courses/meta/categories');
            const data = await response.json();

            if (data.success) {
                this.categories = data.categories;
            }
        } catch (error) {
            console.error('Failed to load categories:', error);
        }
    }

    renderCourses() {
        const coursesGrid = document.querySelector('.courses-grid');
        if (!coursesGrid) return;

        if (this.courses.length === 0) {
            coursesGrid.innerHTML = `
                <div class="no-courses">
                    <h3>No courses found</h3>
                    <p>Try adjusting your search or filter criteria.</p>
                </div>
            `;
            return;
        }

        coursesGrid.innerHTML = this.courses.map(course => `
            <div class="course-card" data-course-id="${course.id}">
                <div class="course-image">
                    <div class="course-category">${course.category}</div>
                    <div class="course-thumbnail" style="background: ${course.thumbnail};"></div>
                </div>
                <div class="course-content">
                    <h3 class="course-title">${course.title}</h3>
                    <p class="course-description">${course.description}</p>
                    <div class="course-meta">
                        <span class="course-duration">${course.duration}</span>
                        <span class="course-level">${course.level}</span>
                    </div>
                    <div class="course-stats">
                        <span class="course-students">👥 ${course.students} students</span>
                        <span class="course-rating">⭐ ${course.rating}</span>
                    </div>
                    <div class="course-footer">
                        <span class="course-price">$${course.price}</span>
                        <button class="enroll-btn" onclick="courseManager.enrollInCourse('${course.id}')">
                            Enroll Now
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        // Add animation to course cards
        this.animateCourseCards();
    }

    animateCourseCards() {
        const cards = document.querySelectorAll('.course-card');
        cards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';
            
            setTimeout(() => {
                card.style.transition = 'all 0.6s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }

    async enrollInCourse(courseId) {
        try {
            // Check if user is logged in
            const isAuthenticated = await authManager.checkAuth();
            if (!isAuthenticated) {
                this.showEnrollmentModal('Please log in to enroll in courses.');
                return;
            }

            const response = await authManager.apiRequest(`/api/courses/${courseId}/enroll`, {
                method: 'POST'
            });

            if (response && response.success) {
                this.showEnrollmentModal('Successfully enrolled! Redirecting to dashboard...', 'success');
                setTimeout(() => {
                    window.location.href = '/dashboard.html';
                }, 2000);
            } else {
                this.showEnrollmentModal(response?.message || 'Enrollment failed. Please try again.');
            }
        } catch (error) {
            console.error('Enrollment failed:', error);
            this.showEnrollmentModal('Network error. Please try again.');
        }
    }

    showEnrollmentModal(message, type = 'info') {
        // Create modal overlay
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;

        // Create modal content
        const modal = document.createElement('div');
        modal.className = 'enrollment-modal';
        modal.style.cssText = `
            background: white;
            padding: 2rem;
            border-radius: 20px;
            max-width: 400px;
            width: 90%;
            text-align: center;
            transform: scale(0.8);
            transition: transform 0.3s ease;
        `;

        const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
        modal.innerHTML = `
            <div style="font-size: 3rem; margin-bottom: 1rem;">${icon}</div>
            <h3 style="margin-bottom: 1rem; color: #2D3748;">${type === 'success' ? 'Success!' : 'Notice'}</h3>
            <p style="margin-bottom: 2rem; color: #718096;">${message}</p>
            ${type !== 'success' ? `
                <div style="display: flex; gap: 1rem; justify-content: center;">
                    <button onclick="this.closest('.modal-overlay').remove()" 
                            style="padding: 0.75rem 1.5rem; background: #E2E8F0; border: none; border-radius: 10px; cursor: pointer;">
                        Cancel
                    </button>
                    <a href="/login" 
                       style="padding: 0.75rem 1.5rem; background: #5A67D8; color: white; text-decoration: none; border-radius: 10px;">
                        Login
                    </a>
                </div>
            ` : ''}
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        // Animate in
        setTimeout(() => {
            overlay.style.opacity = '1';
            modal.style.transform = 'scale(1)';
        }, 10);

        // Auto-close for success messages
        if (type === 'success') {
            setTimeout(() => {
                overlay.style.opacity = '0';
                modal.style.transform = 'scale(0.8)';
                setTimeout(() => overlay.remove(), 300);
            }, 2000);
        }

        // Close on overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.style.opacity = '0';
                modal.style.transform = 'scale(0.8)';
                setTimeout(() => overlay.remove(), 300);
            }
        });
    }

    setupEventListeners() {
        // Search functionality
        const searchInput = document.querySelector('#course-search');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(async () => {
                    this.currentPage = 0;
                    await this.loadCourses('', e.target.value);
                    this.renderCourses();
                }, 500);
            });
        }

        // Category filter
        const categoryFilter = document.querySelector('#category-filter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', async (e) => {
                this.currentPage = 0;
                await this.loadCourses(e.target.value);
                this.renderCourses();
            });
        }

        // Load more button
        const loadMoreBtn = document.querySelector('#load-more');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', async () => {
                this.currentPage++;
                const oldCourses = [...this.courses];
                await this.loadCourses();
                this.courses = [...oldCourses, ...this.courses];
                this.renderCourses();
                
                if (!this.pagination.hasMore) {
                    loadMoreBtn.style.display = 'none';
                }
            });
        }
    }
}

// Initialize course manager
const courseManager = new CourseManager();

// Auto-initialize if on a page with courses
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.courses-grid')) {
        courseManager.init();
    }
});