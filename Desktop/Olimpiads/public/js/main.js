// Common JavaScript functions

// Fetch upcoming Olympiad dates
async function loadUpcomingDates() {
    try {
        const response = await fetch('/api/olympiad-dates');
        const dates = await response.json();
        
        const container = document.getElementById('upcoming-dates');
        if (!container) return;
        
        if (dates.length === 0) {
            container.innerHTML = '<p>No upcoming Olympiad dates scheduled.</p>';
            return;
        }
        
        container.innerHTML = dates.map(date => `
            <div class="date-item">
                <h4>${escapeHtml(date.title)}</h4>
                <p class="date">Date: ${formatDate(date.date)}</p>
                ${date.registration_deadline ? `<p class="date">Registration Deadline: ${formatDate(date.registration_deadline)}</p>` : ''}
                ${date.description ? `<p>${escapeHtml(date.description)}</p>` : ''}
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading upcoming dates:', error);
    }
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Show alert message (deprecated - use showToast instead)
// This function is kept for backward compatibility but uses toast if available
function showAlert(message, type = 'success') {
    // Use toast notification if available, otherwise fall back to old method
    if (typeof showToast === 'function') {
        showToast(message, type, 5000);
    } else {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.textContent = message;
        
        const container = document.querySelector('main') || document.body;
        container.insertBefore(alertDiv, container.firstChild);
        
        setTimeout(() => {
            alertDiv.remove();
        }, 5000);
    }
}

// Theme Management
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeToggle(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeToggle(newTheme);
}

function updateThemeToggle(theme) {
    const toggle = document.querySelector('.theme-toggle');
    if (toggle) {
        const icon = toggle.querySelector('.theme-toggle-icon');
        if (icon) {
            icon.innerHTML = theme === 'dark' ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
        }
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    loadUpcomingDates();
    
    // Add click handler to theme toggle
    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
});

