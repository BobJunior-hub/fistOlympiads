// Custom confirmation dialog system

class ConfirmDialog {
    constructor(message, onConfirm, onCancel = null) {
        if (!message) {
            console.error('ConfirmDialog: message is required');
            return;
        }
        if (typeof onConfirm !== 'function') {
            console.error('ConfirmDialog: onConfirm must be a function');
            return;
        }
        this.message = message;
        this.onConfirm = onConfirm;
        this.onCancel = onCancel;
        this.create();
    }

    create() {
        // Remove any existing dialog first
        const existing = document.getElementById('confirm-dialog-overlay');
        if (existing) {
            existing.remove();
        }
        
        // Ensure document.body exists
        if (!document.body) {
            console.error('Cannot create dialog: document.body not available');
            return;
        }
        
        // Create overlay
        const overlay = document.createElement('div');
        overlay.id = 'confirm-dialog-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 99999;
            backdrop-filter: blur(5px);
            -webkit-backdrop-filter: blur(5px);
            animation: fadeIn 0.2s ease;
        `;

        // Create dialog
        const dialog = document.createElement('div');
        dialog.style.cssText = `
            background: var(--bg-card);
            border: 2px solid var(--border-color);
            border-radius: 24px;
            padding: 2.5rem;
            max-width: 500px;
            width: 90%;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
            animation: slideInDown 0.3s ease;
            text-align: center;
        `;

        // Icon
        const icon = document.createElement('div');
        icon.style.cssText = `
            width: 64px;
            height: 64px;
            border-radius: 50%;
            background: linear-gradient(135deg, #ef4444, #dc2626);
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 1.5rem;
            font-size: 2rem;
            color: white;
        `;
        icon.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';

        // Message
        const messageEl = document.createElement('p');
        messageEl.textContent = this.message;
        messageEl.style.cssText = `
            color: var(--text-color);
            font-size: 1.1rem;
            line-height: 1.6;
            margin-bottom: 2rem;
        `;

        // Buttons container
        const buttonsContainer = document.createElement('div');
        buttonsContainer.style.cssText = `
            display: flex;
            gap: 1rem;
            justify-content: center;
        `;

        // Cancel button
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancel';
        cancelBtn.className = 'btn btn-secondary';
        cancelBtn.style.cssText = `
            padding: 0.75rem 2rem;
            font-size: 1rem;
            min-width: 120px;
        `;
        cancelBtn.onclick = () => {
            this.remove();
            if (this.onCancel) {
                this.onCancel();
            }
        };

        // Confirm button
        const confirmBtn = document.createElement('button');
        confirmBtn.textContent = 'Confirm';
        confirmBtn.className = 'btn btn-danger';
        confirmBtn.style.cssText = `
            padding: 0.75rem 2rem;
            font-size: 1rem;
            min-width: 120px;
            background: linear-gradient(135deg, #ef4444, #dc2626);
        `;
        confirmBtn.onclick = () => {
            this.remove();
            if (this.onConfirm) {
                this.onConfirm();
            }
        };

        buttonsContainer.appendChild(cancelBtn);
        buttonsContainer.appendChild(confirmBtn);

        dialog.appendChild(icon);
        dialog.appendChild(messageEl);
        dialog.appendChild(buttonsContainer);

        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
        
        // Ensure dialog is visible
        overlay.style.display = 'flex';
        dialog.style.display = 'block';

        // Close on overlay click
        overlay.onclick = (e) => {
            if (e.target === overlay) {
                this.remove();
                if (this.onCancel) {
                    this.onCancel();
                }
            }
        };

        // Close on Escape key
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                this.remove();
                if (this.onCancel) {
                    this.onCancel();
                }
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);

        // Focus on cancel button
        cancelBtn.focus();
    }

    remove() {
        const overlay = document.getElementById('confirm-dialog-overlay');
        if (overlay) {
            overlay.style.animation = 'fadeOut 0.2s ease forwards';
            setTimeout(() => {
                if (overlay.parentNode) {
                    overlay.parentNode.removeChild(overlay);
                }
            }, 200);
        }
    }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }

    @keyframes fadeOut {
        from {
            opacity: 1;
        }
        to {
            opacity: 0;
        }
    }

    @keyframes slideInDown {
        from {
            transform: translateY(-50px);
            opacity: 0;
        }
        to {
            transform: translateY(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);

// Global function to show confirmation dialog
// This replaces browser confirm() completely
function showConfirm(message, onConfirm, onCancel = null) {
    // Always use custom dialog - never use browser confirm
    if (!message) {
        console.error('showConfirm: message is required');
        return null;
    }
    if (typeof onConfirm !== 'function') {
        console.error('showConfirm: onConfirm callback is required');
        return null;
    }
    try {
        return new ConfirmDialog(message, onConfirm, onCancel);
    } catch (error) {
        console.error('Error creating confirm dialog:', error);
        // Fallback: execute confirm immediately if dialog creation fails
        if (onConfirm) onConfirm();
        return null;
    }
}

// Override browser confirm() to use our custom dialog
// Note: Original confirm() is synchronous, but we use async callbacks
// For compatibility, we'll show the dialog and return false immediately
// Code should use showConfirm() directly for proper async handling
const originalConfirm = window.confirm;
window.confirm = function(message) {
    console.warn('Browser confirm() was called. Using custom dialog instead.');
    console.warn('Note: For proper async handling, use showConfirm() instead of confirm()');
    
    // Show the dialog but return false immediately (can't make it truly synchronous)
    // This prevents the default action but doesn't wait for user response
    showConfirm(message, 
        () => {
            // User confirmed - but we can't return true synchronously
            console.log('User confirmed');
        },
        () => {
            // User cancelled
            console.log('User cancelled');
        }
    );
    
    // Return false to prevent default actions
    return false;
};

// Make ConfirmDialog and showConfirm available globally
window.ConfirmDialog = ConfirmDialog;
window.showConfirm = showConfirm;

