// Toast notification system

class Toast {
    constructor(message, type = 'success', duration = 5000, action = null) {
        this.message = message;
        this.type = type;
        this.duration = duration;
        this.action = action; // 'delete', 'send', 'add', 'remove', etc.
        this.create();
    }

    create() {
        // Create toast container if it doesn't exist
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.style.cssText = `
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                z-index: 10000;
                display: flex;
                flex-direction: column;
                gap: 1rem;
                pointer-events: none;
                align-items: center;
            `;
            document.body.appendChild(container);
        }

        // Determine background color based on type
        let bgColor;
        if (this.type === 'success') {
            bgColor = 'linear-gradient(135deg, #10b981, #059669)';
        } else if (this.type === 'error') {
            bgColor = 'linear-gradient(135deg, #ef4444, #dc2626)';
        } else if (this.type === 'info') {
            bgColor = 'linear-gradient(135deg, #3b82f6, #2563eb)';
        } else if (this.type === 'warning') {
            bgColor = 'linear-gradient(135deg, #f59e0b, #d97706)';
        } else {
            bgColor = 'linear-gradient(135deg, #10b981, #059669)';
        }

        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast toast-${this.type}`;
        toast.style.cssText = `
            background: ${bgColor};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
            display: flex;
            align-items: center;
            gap: 0.75rem;
            min-width: 300px;
            max-width: 500px;
            animation: slideInDown 0.3s ease, fadeOut 0.3s ease ${this.duration}ms forwards;
            pointer-events: auto;
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        `;

        // Determine icon based on action or type
        let iconClass;
        if (this.action === 'delete') {
            iconClass = 'fas fa-trash';
        } else if (this.action === 'send') {
            iconClass = 'fas fa-paper-plane';
        } else if (this.action === 'add') {
            iconClass = 'fas fa-plus-circle';
        } else if (this.action === 'remove') {
            iconClass = 'fas fa-minus-circle';
        } else if (this.type === 'success') {
            iconClass = 'fas fa-check-circle';
        } else if (this.type === 'error') {
            iconClass = 'fas fa-exclamation-circle';
        } else if (this.type === 'info') {
            iconClass = 'fas fa-info-circle';
        } else if (this.type === 'warning') {
            iconClass = 'fas fa-exclamation-triangle';
        } else {
            iconClass = 'fas fa-check-circle';
        }

        // Icon
        const icon = document.createElement('i');
        icon.className = iconClass;
        icon.style.fontSize = '1.25rem';

        // Message
        const messageEl = document.createElement('span');
        messageEl.textContent = this.message;
        messageEl.style.flex = '1';

        // Close button
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '<i class="fas fa-times"></i>';
        closeBtn.style.cssText = `
            background: rgba(255, 255, 255, 0.2);
            border: none;
            color: white;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.2s;
        `;
        closeBtn.onmouseover = () => closeBtn.style.background = 'rgba(255, 255, 255, 0.3)';
        closeBtn.onmouseout = () => closeBtn.style.background = 'rgba(255, 255, 255, 0.2)';
        closeBtn.onclick = () => this.remove(toast);

        toast.appendChild(icon);
        toast.appendChild(messageEl);
        toast.appendChild(closeBtn);

        container.appendChild(toast);

        // Auto remove after duration
        setTimeout(() => {
            this.remove(toast);
        }, this.duration);
    }

    remove(toast) {
        toast.style.animation = 'slideOutUp 0.3s ease forwards';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInDown {
        from {
            transform: translateY(-100%);
            opacity: 0;
        }
        to {
            transform: translateY(0);
            opacity: 1;
        }
    }

    @keyframes slideOutUp {
        from {
            transform: translateY(0);
            opacity: 1;
        }
        to {
            transform: translateY(-100%);
            opacity: 0;
        }
    }

    @keyframes fadeOut {
        from {
            opacity: 1;
        }
        to {
            opacity: 0.9;
        }
    }
`;
document.head.appendChild(style);

// Global function to show toast
function showToast(message, type = 'success', duration = 5000, action = null) {
    new Toast(message, type, duration, action);
}

// Override browser alert() to use toast instead
const originalAlert = window.alert;
window.alert = function(message) {
    console.warn('Browser alert() was called. Using toast instead.');
    // Use toast notification instead of alert
    if (typeof showToast === 'function') {
        showToast(message, 'info', 5000);
    } else {
        // Fallback if toast not loaded yet
        console.log('Alert:', message);
    }
};

// Make Toast and showToast available globally
window.Toast = Toast;
window.showToast = showToast;

