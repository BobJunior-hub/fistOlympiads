// Contact form functionality

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('contact-form');
    
    if (form) {
        // Prevent HTML5 validation alerts - use custom validation instead
        form.setAttribute('novalidate', 'novalidate');
        
        // Custom validation function
        function validateForm() {
            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const phone = document.getElementById('phone').value.trim();
            const subject = document.getElementById('subject').value;
            const message = document.getElementById('message').value.trim();
            
            if (!name) {
                if (typeof showToast === 'function') {
                    showToast('Please enter your name', 'error', 4000);
                }
                document.getElementById('name').focus();
                return false;
            }
            
            if (!email) {
                if (typeof showToast === 'function') {
                    showToast('Please enter your email address', 'error', 4000);
                }
                document.getElementById('email').focus();
                return false;
            }
            
            // Basic email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                if (typeof showToast === 'function') {
                    showToast('Please enter a valid email address', 'error', 4000);
                }
                document.getElementById('email').focus();
                return false;
            }
            
            if (!phone) {
                if (typeof showToast === 'function') {
                    showToast('Please enter your phone number', 'error', 4000);
                }
                document.getElementById('phone').focus();
                return false;
            }
            
            if (!subject) {
                if (typeof showToast === 'function') {
                    showToast('Please select a subject', 'error', 4000);
                }
                document.getElementById('subject').focus();
                return false;
            }
            
            if (!message) {
                if (typeof showToast === 'function') {
                    showToast('Please enter your message', 'error', 4000);
                }
                document.getElementById('message').focus();
                return false;
            }
            
            return true;
        }
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Validate form
            if (!validateForm()) {
                return;
            }
            
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            
            const formData = {
                name: document.getElementById('name').value.trim(),
                email: document.getElementById('email').value.trim(),
                phone: document.getElementById('phone').value.trim(),
                subject: document.getElementById('subject').value,
                message: document.getElementById('message').value.trim()
            };
            
            try {
                const response = await fetch('/api/contact', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });
                
                const result = await response.json();
                
                if (result.success) {
                    showToast('Thank you for your message! We will get back to you soon.', 'success', 6000, 'send');
                    form.reset();
                } else {
                    showToast(result.error || 'There was an error sending your message. Please try again.', 'error', 5000, 'send');
                }
            } catch (error) {
                console.error('Error submitting form:', error);
                showToast('There was an error sending your message. Please try again.', 'error', 5000, 'send');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        });
    }
});

