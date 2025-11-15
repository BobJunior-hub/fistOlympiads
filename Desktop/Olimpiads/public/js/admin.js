// Admin dashboard functionality

// Helper functions (if not already defined)
if (typeof escapeHtml === 'undefined') {
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

if (typeof formatDate === 'undefined') {
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

// Ensure showToast and showConfirm are available
if (typeof showToast === 'undefined') {
    console.error('showToast is not defined. Make sure toast.js is loaded before admin.js');
    window.showToast = function(message, type, duration, action) {
        console.log(`Toast [${type}]: ${message}`);
    };
}

if (typeof showConfirm === 'undefined') {
    console.error('showConfirm is not defined. Make sure confirm-dialog.js is loaded before admin.js');
    // Create a simple fallback that shows a message and executes callback
    window.showConfirm = function(message, onConfirm, onCancel) {
        console.warn('showConfirm fallback used:', message);
        // Use browser confirm - just click OK to confirm
        if (window.confirm(message)) {
            if (onConfirm) onConfirm();
        } else {
            if (onCancel) onCancel();
        }
    };
}

// Tab switching
document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        const tabName = tab.dataset.tab;
        
        // Update tabs
        document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // Update content
        document.querySelectorAll('.admin-content').forEach(c => c.classList.remove('active'));
        document.getElementById(`${tabName}-content`).classList.add('active');
        
        // Load data for active tab
        loadTabData(tabName);
    });
});

// Load data for specific tab
function loadTabData(tab) {
    switch(tab) {
        case 'blog':
            loadBlogPosts();
            break;
        case 'events':
            loadEvents();
            break;
        case 'resources':
            loadResources();
            break;
        case 'dates':
            loadOlympiadDates();
            break;
        case 'contacts':
            // Force reload contact submissions when tab is clicked
            loadContactSubmissions();
            break;
    }
}

// Blog Posts Management
function showBlogForm() {
    document.getElementById('blog-form-container').style.display = 'block';
    document.getElementById('blog-form').reset();
}

function hideBlogForm() {
    document.getElementById('blog-form-container').style.display = 'none';
}

async function loadBlogPosts() {
    try {
        const response = await fetch('/api/blog-posts');
        const posts = await response.json();
        
        const container = document.getElementById('blog-list');
        if (posts.length === 0) {
            container.innerHTML = '<p>No blog posts yet.</p>';
            return;
        }
        
        container.innerHTML = `
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>Category</th>
                        <th>Author</th>
                        <th>Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${posts.map(post => `
                        <tr>
                            <td>${escapeHtml(post.title)}</td>
                            <td>${escapeHtml(post.category)}</td>
                            <td>${escapeHtml(post.author || 'N/A')}</td>
                            <td>${formatDate(post.created_at)}</td>
                            <td>
                                <button class="btn btn-danger" onclick="deleteBlogPost(${post.id})">Delete</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        console.error('Error loading blog posts:', error);
    }
}

document.getElementById('blog-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    
    try {
        const response = await fetch('/api/blog-posts', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast('Blog post created successfully!', 'success', 5000, 'add');
            hideBlogForm();
            loadBlogPosts();
            e.target.reset();
        }
    } catch (error) {
        showToast('Error creating blog post', 'error', 5000, 'add');
    }
});

async function deleteBlogPost(id) {
    if (typeof showConfirm === 'function') {
        showConfirm('Are you sure you want to delete this blog post?', () => {
            performDeleteBlogPost(id);
        });
    } else {
        console.error('showConfirm is not available');
        // Fallback: show toast and proceed (not ideal but better than nothing)
        showToast('Please wait, deleting blog post...', 'info', 3000);
        setTimeout(() => performDeleteBlogPost(id), 500);
    }
}

// Make delete functions globally available
window.deleteBlogPost = deleteBlogPost;

async function performDeleteBlogPost(id) {
    try {
        const response = await fetch(`/api/blog-posts/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            showToast('Blog post deleted successfully!', 'success', 5000, 'delete');
            loadBlogPosts();
        } else {
            showToast(result.error || 'Error deleting blog post', 'error', 5000, 'delete');
        }
    } catch (error) {
        console.error('Error deleting blog post:', error);
        showToast('Error deleting blog post: ' + error.message, 'error', 5000, 'delete');
    }
}

// Events Management
function showEventForm() {
    document.getElementById('event-form-container').style.display = 'block';
    document.getElementById('event-form').reset();
}

function hideEventForm() {
    document.getElementById('event-form-container').style.display = 'none';
}

async function loadEvents() {
    try {
        const response = await fetch('/api/events');
        const events = await response.json();
        
        const container = document.getElementById('events-list');
        if (events.length === 0) {
            container.innerHTML = '<p>No events yet.</p>';
            return;
        }
        
        container.innerHTML = `
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>Type</th>
                        <th>Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${events.map(event => `
                        <tr>
                            <td>${escapeHtml(event.title)}</td>
                            <td>${escapeHtml(event.event_type)}</td>
                            <td>${formatDate(event.event_date)}</td>
                            <td>
                                <button class="btn btn-danger" onclick="deleteEvent(${event.id})">Delete</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        console.error('Error loading events:', error);
    }
}

document.getElementById('event-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    
    try {
        const response = await fetch('/api/events', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast('Event created successfully!', 'success', 5000, 'add');
            hideEventForm();
            loadEvents();
            e.target.reset();
        }
    } catch (error) {
        showToast('Error creating event', 'error', 5000, 'add');
    }
});

async function deleteEvent(id) {
    if (typeof showConfirm === 'function') {
        showConfirm('Are you sure you want to delete this event?', () => {
            performDeleteEvent(id);
        });
    } else {
        console.error('showConfirm is not available');
        showToast('Please wait, deleting event...', 'info', 3000);
        setTimeout(() => performDeleteEvent(id), 500);
    }
}

// Make delete functions globally available
window.deleteEvent = deleteEvent;

async function performDeleteEvent(id) {
    try {
        const response = await fetch(`/api/events/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            showToast('Event deleted successfully!', 'success', 5000, 'delete');
            loadEvents();
        } else {
            showToast(result.error || 'Error deleting event', 'error', 5000, 'delete');
        }
    } catch (error) {
        console.error('Error deleting event:', error);
        showToast('Error deleting event: ' + error.message, 'error', 5000, 'delete');
    }
}

// Resources Management
function showResourceForm() {
    document.getElementById('resource-form-container').style.display = 'block';
    document.getElementById('resource-form').reset();
}

function hideResourceForm() {
    document.getElementById('resource-form-container').style.display = 'none';
}

async function loadResources() {
    try {
        const response = await fetch('/api/resources');
        const resources = await response.json();
        
        const container = document.getElementById('resources-list');
        if (resources.length === 0) {
            container.innerHTML = '<p>No resources yet.</p>';
            return;
        }
        
        container.innerHTML = `
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>Type</th>
                        <th>Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${resources.map(resource => `
                        <tr>
                            <td>${escapeHtml(resource.title)}</td>
                            <td>${escapeHtml(resource.resource_type)}</td>
                            <td>${formatDate(resource.created_at)}</td>
                            <td>
                                <button class="btn btn-danger" onclick="deleteResource(${resource.id})">Delete</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        console.error('Error loading resources:', error);
    }
}

document.getElementById('resource-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    
    try {
        const response = await fetch('/api/resources', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast('Resource created successfully!', 'success', 5000, 'add');
            hideResourceForm();
            loadResources();
            e.target.reset();
        }
    } catch (error) {
        showToast('Error creating resource', 'error', 5000, 'add');
    }
});

async function deleteResource(id) {
    if (typeof showConfirm === 'function') {
        showConfirm('Are you sure you want to delete this resource?', () => {
            performDeleteResource(id);
        });
    } else {
        console.error('showConfirm is not available');
        showToast('Please wait, deleting resource...', 'info', 3000);
        setTimeout(() => performDeleteResource(id), 500);
    }
}

// Make delete functions globally available
window.deleteResource = deleteResource;

async function performDeleteResource(id) {
    try {
        const response = await fetch(`/api/resources/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            showToast('Resource deleted successfully!', 'success', 5000, 'delete');
            loadResources();
        } else {
            showToast(result.error || 'Error deleting resource', 'error', 5000, 'delete');
        }
    } catch (error) {
        console.error('Error deleting resource:', error);
        showToast('Error deleting resource: ' + error.message, 'error', 5000, 'delete');
    }
}

// Olympiad Dates Management
function showDateForm() {
    document.getElementById('date-form-container').style.display = 'block';
    document.getElementById('date-form').reset();
}

function hideDateForm() {
    document.getElementById('date-form-container').style.display = 'none';
}

async function loadOlympiadDates() {
    try {
        const response = await fetch('/api/all-olympiad-dates');
        const dates = await response.json();
        
        const container = document.getElementById('dates-list');
        if (dates.length === 0) {
            container.innerHTML = '<p>No Olympiad dates yet.</p>';
            return;
        }
        
        container.innerHTML = `
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>Date</th>
                        <th>Registration Deadline</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${dates.map(date => `
                        <tr>
                            <td>${escapeHtml(date.title)}</td>
                            <td>${formatDate(date.date)}</td>
                            <td>${date.registration_deadline ? formatDate(date.registration_deadline) : 'N/A'}</td>
                            <td>
                                <button class="btn btn-danger" onclick="deleteOlympiadDate(${date.id})">Delete</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        console.error('Error loading Olympiad dates:', error);
    }
}

document.getElementById('date-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        title: e.target.title.value,
        date: e.target.date.value,
        description: e.target.description.value,
        registration_deadline: e.target.registration_deadline.value || null
    };
    
    try {
        const response = await fetch('/api/olympiad-dates', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast('Olympiad date created successfully!', 'success', 5000, 'add');
            hideDateForm();
            loadOlympiadDates();
            e.target.reset();
        }
    } catch (error) {
        showToast('Error creating Olympiad date', 'error', 5000, 'add');
    }
});

async function deleteOlympiadDate(id) {
    if (typeof showConfirm === 'function') {
        showConfirm('Are you sure you want to delete this Olympiad date?', () => {
            performDeleteOlympiadDate(id);
        });
    } else {
        console.error('showConfirm is not available');
        showToast('Please wait, deleting Olympiad date...', 'info', 3000);
        setTimeout(() => performDeleteOlympiadDate(id), 500);
    }
}

// Make delete functions globally available
window.deleteOlympiadDate = deleteOlympiadDate;

async function performDeleteOlympiadDate(id) {
    try {
        const response = await fetch(`/api/olympiad-dates/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            showToast('Olympiad date deleted successfully!', 'success', 5000, 'delete');
            loadOlympiadDates();
        } else {
            showToast(result.error || 'Error deleting Olympiad date', 'error', 5000, 'delete');
        }
    } catch (error) {
        console.error('Error deleting Olympiad date:', error);
        showToast('Error deleting Olympiad date: ' + error.message, 'error', 5000, 'delete');
    }
}

// Logout
document.getElementById('logout-btn').addEventListener('click', async () => {
    try {
        await fetch('/api/logout', { method: 'POST' });
        window.location.href = '/admin';
    } catch (error) {
        console.error('Error logging out:', error);
    }
});

// Load initial data
document.addEventListener('DOMContentLoaded', () => {
    // Initialize theme if main.js functions are available
    if (typeof initTheme === 'function') {
        initTheme();
    } else {
        // Fallback theme initialization
        const savedTheme = localStorage.getItem('theme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
        // Update toggle icon
        const themeToggle = document.querySelector('.theme-toggle');
        if (themeToggle) {
            const icon = themeToggle.querySelector('.theme-toggle-icon');
            if (icon) {
                icon.innerHTML = savedTheme === 'dark' ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
            }
        }
    }
    
    // Add click handler to theme toggle
    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            if (typeof toggleTheme === 'function') {
                toggleTheme();
            } else {
                // Fallback theme toggle
                const currentTheme = document.documentElement.getAttribute('data-theme');
                const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
                document.documentElement.setAttribute('data-theme', newTheme);
                localStorage.setItem('theme', newTheme);
                // Update toggle icon
                const icon = themeToggle.querySelector('.theme-toggle-icon');
                if (icon) {
                    icon.innerHTML = newTheme === 'dark' ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
                }
            }
        });
    }
    
    loadBlogPosts();
    loadContactSubmissions(); // Load to get unread count
    
    // Set up periodic check for new submissions (every 30 seconds)
    submissionCheckInterval = setInterval(() => {
        const contactsContent = document.getElementById('contacts-content');
        const contactsTab = document.querySelector('.admin-tab[data-tab="contacts"]');
        
        if (contactsContent && contactsContent.classList.contains('active')) {
            loadContactSubmissions();
        } else if (contactsTab && contactsTab.classList.contains('active')) {
            loadContactSubmissions();
        }
    }, 30000);
});

// Contact Submissions Management
let lastSubmissionCount = 0;
let submissionCheckInterval = null;
let allSubmissions = [];
let currentSubjectFilter = 'all';

async function loadContactSubmissions() {
    const container = document.getElementById('contacts-list');
    if (!container) {
        console.error('contacts-list container not found');
        return;
    }
    
    // Show loading state
    container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    
    try {
        console.log('Fetching contact submissions from /api/contact-submissions');
        const response = await fetch('/api/contact-submissions', {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        
        console.log('Response status:', response.status, response.statusText);
        
        if (!response.ok) {
            if (response.status === 401) {
                container.innerHTML = 
                    '<p style="color: var(--error-color); text-align: center; padding: 2rem;">Unauthorized. Please log in again.</p>';
                return;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const submissions = await response.json();
        
        console.log('Loaded submissions:', submissions); // Debug log
        
        // Store all submissions for filtering
        allSubmissions = submissions;
        
        // Populate subject filter dropdown
        populateSubjectFilter(submissions);
        
        // Filter submissions by selected subject
        const filteredSubmissions = filterSubmissionsBySubject(submissions);
        
        // Update unread count (from all submissions, not filtered)
        const unreadCount = submissions.filter(s => !s.read).length;
        const unreadBadge = document.getElementById('unread-count');
        if (unreadBadge) {
            if (unreadCount > 0) {
                unreadBadge.textContent = unreadCount;
                unreadBadge.style.display = 'inline-block';
            } else {
                unreadBadge.style.display = 'none';
            }
        }
        
        // Check for new submissions and notify
        if (submissions.length > lastSubmissionCount && lastSubmissionCount > 0) {
            const newCount = submissions.length - lastSubmissionCount;
            const unreadNew = submissions.filter(s => !s.read).length;
            
            showToast(`You have ${newCount} new contact submission${newCount > 1 ? 's' : ''}! (${unreadNew} unread)`, 'info', 6000, 'add');
            
            // Play notification sound
            try {
                // Create a simple beep sound using Web Audio API
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.value = 800;
                oscillator.type = 'sine';
                
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
                
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.3);
            } catch (e) {
                console.log('Audio notification not supported:', e);
            }
        }
        lastSubmissionCount = submissions.length;
        
        // Render the submissions table
        renderContactSubmissions(submissions);
    } catch (error) {
        console.error('Error loading contact submissions:', error);
        const container = document.getElementById('contacts-list');
        if (container) {
            container.innerHTML = `
                <div style="padding: 2rem; text-align: center;">
                    <p style="color: var(--error-color); margin-bottom: 1rem;">
                        <i class="fas fa-exclamation-triangle"></i> Error loading contact submissions.
                    </p>
                    <p style="color: var(--text-light); margin-bottom: 1rem;">${error.message || 'Please try again later.'}</p>
                    <button class="btn" onclick="loadContactSubmissions()">
                        <i class="fas fa-redo"></i> Retry
                    </button>
                </div>
            `;
        }
    }
}

async function viewContactSubmission(id) {
    try {
        const response = await fetch('/api/contact-submissions');
        const submissions = await response.json();
        const submission = submissions.find(s => s.id === id);
        
        if (!submission) return;
        
        // Create modal
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            backdrop-filter: blur(5px);
        `;
        
        modal.innerHTML = `
            <div style="background: var(--bg-card); border-radius: 20px; padding: 2.5rem; max-width: 700px; width: 90%; max-height: 90vh; overflow-y: auto; box-shadow: var(--shadow-xl); border: 2px solid var(--border-color);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 2px solid var(--border-color);">
                    <h2 style="margin: 0; background: var(--gradient-primary); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
                        <i class="fas fa-user-circle"></i> Contact Submission Details
                    </h2>
                    <button onclick="this.closest('div[style*=\"position: fixed\"]').remove()" style="background: none; border: none; color: var(--text-color); font-size: 1.5rem; cursor: pointer; padding: 0.5rem; border-radius: 50%; transition: background 0.3s;" onmouseover="this.style.background='var(--bg-secondary)'" onmouseout="this.style.background='none'">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div style="display: grid; gap: 1.5rem;">
                    <div style="padding: 1.5rem; background: var(--bg-secondary); border-radius: 12px; border-left: 4px solid var(--primary-color);">
                        <strong style="color: var(--text-light); display: block; margin-bottom: 0.5rem; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px;">
                            <i class="fas fa-user"></i> Full Name
                        </strong>
                        <p style="margin: 0; font-size: 1.2rem; font-weight: 600;">${escapeHtml(submission.name || 'Not provided')}</p>
                    </div>
                    <div style="padding: 1.5rem; background: var(--bg-secondary); border-radius: 12px; border-left: 4px solid var(--primary-color);">
                        <strong style="color: var(--text-light); display: block; margin-bottom: 0.5rem; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px;">
                            <i class="fas fa-envelope"></i> Email Address
                        </strong>
                        <p style="margin: 0;">
                            <a href="mailto:${escapeHtml(submission.email || '')}" style="color: var(--primary-color); text-decoration: none; font-size: 1.1rem;">
                                ${escapeHtml(submission.email || 'Not provided')}
                            </a>
                        </p>
                    </div>
                    <div style="padding: 1.5rem; background: var(--bg-secondary); border-radius: 12px; border-left: 4px solid var(--primary-color);">
                        <strong style="color: var(--text-light); display: block; margin-bottom: 0.5rem; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px;">
                            <i class="fas fa-phone"></i> Phone Number
                        </strong>
                        <p style="margin: 0;">
                            <a href="tel:${escapeHtml(submission.phone || '')}" style="color: var(--primary-color); text-decoration: none; font-size: 1.1rem;">
                                ${escapeHtml(submission.phone || 'Not provided')}
                            </a>
                        </p>
                    </div>
                    <div style="padding: 1.5rem; background: var(--bg-secondary); border-radius: 12px; border-left: 4px solid var(--primary-color);">
                        <strong style="color: var(--text-light); display: block; margin-bottom: 0.5rem; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px;">
                            <i class="fas fa-tag"></i> Subject
                        </strong>
                        <p style="margin: 0; font-size: 1.1rem; font-weight: 600;">${escapeHtml(submission.subject || 'Not provided')}</p>
                    </div>
                    <div style="padding: 1.5rem; background: var(--bg-secondary); border-radius: 12px; border-left: 4px solid var(--primary-color);">
                        <strong style="color: var(--text-light); display: block; margin-bottom: 0.5rem; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px;">
                            <i class="fas fa-comment-alt"></i> Message
                        </strong>
                        <p style="margin: 0; line-height: 1.8; white-space: pre-wrap; color: var(--text-color);">${escapeHtml(submission.message || 'Not provided')}</p>
                    </div>
                    <div style="padding: 1.5rem; background: var(--bg-secondary); border-radius: 12px; border-left: 4px solid var(--primary-color);">
                        <strong style="color: var(--text-light); display: block; margin-bottom: 0.5rem; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px;">
                            <i class="fas fa-calendar"></i> Submitted Date & Time
                        </strong>
                        <p style="margin: 0; font-size: 1.1rem;">${formatDate(submission.created_at)}</p>
                    </div>
                </div>
                <div style="margin-top: 2rem; display: flex; gap: 1rem; padding-top: 1.5rem; border-top: 2px solid var(--border-color);">
                    ${!submission.read ? 
                        `<button class="btn btn-secondary" onclick="markAsRead(${submission.id}); this.closest('div[style*=\"position: fixed\"]').remove();">
                            <i class="fas fa-check"></i> Mark as Read
                        </button>` : 
                        ''}
                    <button class="btn" style="flex: 1;" onclick="this.closest('div[style*=\"position: fixed\"]').remove()">
                        <i class="fas fa-times"></i> Close
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };
        
        // Mark as read when viewing
        if (!submission.read) {
            // Update in allSubmissions array
            const submissionInArray = allSubmissions.find(s => s.id === id);
            if (submissionInArray) {
                submissionInArray.read = 1;
            }
            // Mark as read on server
            markAsRead(id);
        }
    } catch (error) {
        console.error('Error viewing submission:', error);
        showToast('Error loading submission details', 'error');
    }
}

async function markAsRead(id) {
    try {
        const response = await fetch(`/api/contact-submissions/${id}/read`, {
            method: 'PUT'
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast('Marked as read', 'success');
            // Update the submission in allSubmissions array
            const submission = allSubmissions.find(s => s.id === id);
            if (submission) {
                submission.read = 1;
            }
            // Re-render with current filter
            renderContactSubmissions(allSubmissions);
        }
    } catch (error) {
        console.error('Error marking as read:', error);
        showToast('Error updating status', 'error');
    }
}

async function deleteContactSubmission(id) {
    if (typeof showConfirm === 'function') {
        showConfirm('Are you sure you want to delete this contact submission?', () => {
            performDeleteContactSubmission(id);
        });
    } else {
        console.error('showConfirm is not available');
        showToast('Please wait, deleting contact submission...', 'info', 3000);
        setTimeout(() => performDeleteContactSubmission(id), 500);
    }
}

// Make delete functions globally available
window.deleteContactSubmission = deleteContactSubmission;

async function performDeleteContactSubmission(id) {
    try {
        const response = await fetch(`/api/contact-submissions/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            showToast('Contact submission deleted successfully!', 'success', 5000, 'delete');
            // Remove from allSubmissions array
            allSubmissions = allSubmissions.filter(s => s.id !== id);
            // Re-render with current filter
            renderContactSubmissions(allSubmissions);
        } else {
            showToast(result.error || 'Error deleting submission', 'error', 5000, 'delete');
        }
    } catch (error) {
        console.error('Error deleting submission:', error);
        showToast('Error deleting submission: ' + error.message, 'error', 5000, 'delete');
    }
}

// Subject Filter Functions
function populateSubjectFilter(submissions) {
    const filterSelect = document.getElementById('subject-filter');
    if (!filterSelect) return;
    
    // Get unique subjects from submissions
    const subjects = [...new Set(submissions.map(s => s.subject).filter(s => s && s.trim()))].sort();
    
    // Clear existing options except "All Subjects"
    filterSelect.innerHTML = '<option value="all">All Subjects</option>';
    
    // Add subject options
    subjects.forEach(subject => {
        const option = document.createElement('option');
        option.value = subject;
        option.textContent = subject;
        filterSelect.appendChild(option);
    });
    
    // Set current filter value
    filterSelect.value = currentSubjectFilter;
    
    // Add change event listener
    filterSelect.removeEventListener('change', handleSubjectFilterChange);
    filterSelect.addEventListener('change', handleSubjectFilterChange);
}

function handleSubjectFilterChange(e) {
    currentSubjectFilter = e.target.value;
    const clearBtn = document.getElementById('clear-filter-btn');
    
    if (currentSubjectFilter !== 'all') {
        clearBtn.style.display = 'inline-block';
    } else {
        clearBtn.style.display = 'none';
    }
    
    // Re-render the table with filtered data
    renderContactSubmissions(allSubmissions);
}

function filterSubmissionsBySubject(submissions) {
    if (currentSubjectFilter === 'all') {
        return submissions;
    }
    
    return submissions.filter(submission => 
        submission.subject && 
        submission.subject.toLowerCase().trim() === currentSubjectFilter.toLowerCase().trim()
    );
}

function clearSubjectFilter() {
    const filterSelect = document.getElementById('subject-filter');
    if (filterSelect) {
        filterSelect.value = 'all';
        currentSubjectFilter = 'all';
        document.getElementById('clear-filter-btn').style.display = 'none';
        renderContactSubmissions(allSubmissions);
    }
}

function renderContactSubmissions(submissions) {
    const container = document.getElementById('contacts-list');
    if (!container) return;
    
    // Filter submissions by selected subject
    const filteredSubmissions = filterSubmissionsBySubject(submissions);
    
    // Update unread count (from all submissions, not filtered)
    const unreadCount = submissions.filter(s => !s.read).length;
    const unreadBadge = document.getElementById('unread-count');
    if (unreadBadge) {
        if (unreadCount > 0) {
            unreadBadge.textContent = unreadCount;
            unreadBadge.style.display = 'inline-block';
        } else {
            unreadBadge.style.display = 'none';
        }
    }
    
    if (filteredSubmissions.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 3rem;">
                <i class="fas fa-inbox" style="font-size: 3rem; color: var(--text-light); margin-bottom: 1rem; opacity: 0.5;"></i>
                <p style="color: var(--text-light); font-size: 1.1rem;">
                    ${submissions.length === 0 
                        ? 'No contact submissions yet.' 
                        : `No submissions found for the selected subject filter.`}
                </p>
                ${currentSubjectFilter !== 'all' ? 
                    '<button class="btn" onclick="clearSubjectFilter()" style="margin-top: 1rem;">Clear Filter</button>' : 
                    ''}
            </div>
        `;
        return;
    }
    
    // Build table rows with filtered submission data
    const tableRows = filteredSubmissions.map(submission => {
        const name = escapeHtml(submission.name || 'Not provided');
        const email = escapeHtml(submission.email || 'Not provided');
        const phone = escapeHtml(submission.phone || 'Not provided');
        const subject = escapeHtml(submission.subject || 'Not provided');
        const message = escapeHtml(submission.message || 'Not provided');
        const messagePreview = message.length > 50 ? message.substring(0, 50) + '...' : message;
        const date = formatDate(submission.created_at || new Date().toISOString());
        const isRead = submission.read === 1 || submission.read === true;
        const rowStyle = !isRead ? 'background: rgba(99, 102, 241, 0.15); font-weight: 600; border-left: 3px solid var(--accent-color);' : '';
        
        return `
            <tr style="${rowStyle}">
                <td><strong>${name}</strong></td>
                <td><a href="mailto:${email}" style="color: var(--primary-color); text-decoration: none; word-break: break-all;">${email}</a></td>
                <td><a href="tel:${phone}" style="color: var(--primary-color); text-decoration: none;">${phone}</a></td>
                <td><strong style="color: var(--primary-color);">${subject}</strong></td>
                <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${message}">
                    ${messagePreview}
                </td>
                <td>${date}</td>
                <td>
                    ${isRead ? 
                        '<span style="color: var(--text-light);"><i class="fas fa-check-circle"></i> Read</span>' : 
                        '<span style="color: var(--accent-color); font-weight: 600;"><i class="fas fa-circle"></i> New</span>'}
                </td>
                <td style="white-space: nowrap;">
                    <button class="btn" style="padding: 0.5rem 1rem; font-size: 0.9rem; margin-right: 0.5rem;" onclick="viewContactSubmission(${submission.id})">
                        <i class="fas fa-eye"></i> View
                    </button>
                    ${!isRead ? 
                        `<button class="btn btn-secondary" style="padding: 0.5rem 1rem; font-size: 0.9rem; margin-right: 0.5rem;" onclick="markAsRead(${submission.id})">
                            <i class="fas fa-check"></i> Mark Read
                        </button>` : 
                        ''}
                    <button class="btn btn-danger" style="padding: 0.5rem 1rem; font-size: 0.9rem;" onclick="deleteContactSubmission(${submission.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </td>
            </tr>
        `;
    }).join('');
    
    container.innerHTML = `
        <div style="margin-bottom: 1rem; padding: 1rem; background: var(--bg-secondary); border-radius: 12px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
            <div>
                <strong style="color: var(--text-color);">Total Submissions:</strong> <span style="color: var(--primary-color); font-weight: 600;">${submissions.length}</span>
                ${currentSubjectFilter !== 'all' ? 
                    `<span style="color: var(--text-light); margin-left: 1rem;">
                        <i class="fas fa-filter"></i> Filtered: <strong>${filteredSubmissions.length}</strong>
                    </span>` : 
                    ''}
            </div>
            <div>
                <strong style="color: var(--text-color);">Unread:</strong> <span style="color: var(--accent-color); font-weight: 600;">${unreadCount}</span>
            </div>
        </div>
        <div style="overflow-x: auto; border-radius: 12px; border: 1px solid var(--border-color);">
            <table class="admin-table" style="width: 100%; min-width: 1000px;">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Subject</th>
                        <th>Message Preview</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>
        </div>
    `;
}

