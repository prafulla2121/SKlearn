// Authentication utilities
class AuthManager {
    constructor() {
        this.user = null;
        this.token = null;
    }

    // Check if user is authenticated
    async checkAuth() {
        try {
            const response = await fetch('/api/auth/me', {
                credentials: 'include'
            });
            const data = await response.json();
            
            if (data.success) {
                this.user = data.user;
                return true;
            }
            return false;
        } catch (error) {
            console.error('Auth check failed:', error);
            return false;
        }
    }

    // Login with email and password
    async login(email, password) {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
                credentials: 'include'
            });

            const data = await response.json();
            
            if (data.success) {
                this.user = data.user;
                this.token = data.token;
                return { success: true, user: data.user };
            }
            
            return { success: false, message: data.message };
        } catch (error) {
            console.error('Login failed:', error);
            return { success: false, message: 'Network error' };
        }
    }

    // Register new user
    async register(userData) {
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData),
                credentials: 'include'
            });

            const data = await response.json();
            
            if (data.success) {
                this.user = data.user;
                this.token = data.token;
                return { success: true, user: data.user };
            }
            
            return { success: false, message: data.message };
        } catch (error) {
            console.error('Registration failed:', error);
            return { success: false, message: 'Network error' };
        }
    }

    // Logout
    async logout() {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include'
            });
            
            this.user = null;
            this.token = null;
            window.location.href = '/';
        } catch (error) {
            console.error('Logout failed:', error);
            // Force logout on client side
            this.user = null;
            this.token = null;
            window.location.href = '/';
        }
    }

    // Get current user
    getCurrentUser() {
        return this.user;
    }

    // Check if user is logged in
    isLoggedIn() {
        return this.user !== null;
    }

    // Redirect to login if not authenticated
    requireAuth() {
        if (!this.isLoggedIn()) {
            window.location.href = '/login';
            return false;
        }
        return true;
    }

    // Make authenticated API requests
    async apiRequest(url, options = {}) {
        const defaultOptions = {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        };

        if (this.token) {
            defaultOptions.headers.Authorization = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, { ...defaultOptions, ...options });
            const data = await response.json();

            if (response.status === 401) {
                // Token expired or invalid
                this.user = null;
                this.token = null;
                window.location.href = '/login';
                return null;
            }

            return data;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }
}

// Create global auth manager instance
const authManager = new AuthManager();

// Initialize authentication on page load
document.addEventListener('DOMContentLoaded', async () => {
    await authManager.checkAuth();
    
    // Update UI based on auth status
    updateAuthUI();
});

// Update UI elements based on authentication status
function updateAuthUI() {
    const loginLinks = document.querySelectorAll('.login-btn, .nav-link[href*="login"]');
    const userElements = document.querySelectorAll('.user-info, .user-profile');
    
    if (authManager.isLoggedIn()) {
        const user = authManager.getCurrentUser();
        
        // Update login buttons to show user info or dashboard link
        loginLinks.forEach(link => {
            if (link.textContent.includes('Login') || link.textContent.includes('Dashboard')) {
                link.textContent = 'Dashboard';
                link.href = '/dashboard.html';
            }
        });

        // Update user profile elements
        userElements.forEach(element => {
            if (element.querySelector('.user-name')) {
                element.querySelector('.user-name').textContent = user.name;
            }
            if (element.querySelector('.user-email')) {
                element.querySelector('.user-email').textContent = user.email;
            }
        });
    }
}

// Utility function to format dates
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Utility function to format time ago
function timeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    
    return formatDate(dateString);
}