// Blog page functionality with carousel

let currentCategory = 'all';
let allBlogPosts = [];

async function loadBlogPosts(category = 'all') {
    try {
        const response = await fetch('/api/blog-posts');
        const posts = await response.json();
        allBlogPosts = posts;
        
        const container = document.getElementById('blog-posts');
        const carouselContainer = document.getElementById('category-carousels');
        
        if (!container || !carouselContainer) return;
        
        if (posts.length === 0) {
            container.innerHTML = '<p style="text-align: center; padding: 2rem;">No blog posts found.</p>';
            carouselContainer.style.display = 'none';
            return;
        }
        
        // Group posts by category
        const postsByCategory = {};
        posts.forEach(post => {
            if (!postsByCategory[post.category]) {
                postsByCategory[post.category] = [];
            }
            postsByCategory[post.category].push(post);
        });
        
        // Filter by selected category
        let categoriesToShow = [];
        if (category === 'all') {
            categoriesToShow = Object.keys(postsByCategory);
        } else {
            if (postsByCategory[category]) {
                categoriesToShow = [category];
            }
        }
        
        // Hide regular container, show carousel
        container.style.display = 'none';
        carouselContainer.style.display = 'block';
        carouselContainer.innerHTML = '';
        
        // Create carousel for each category
        categoriesToShow.forEach(cat => {
            const categoryPosts = postsByCategory[cat];
            if (categoryPosts.length > 0) {
                createCategoryCarousel(cat, categoryPosts, carouselContainer);
            }
        });
        
        // Initialize carousels after rendering
        setTimeout(() => {
            // Clear any existing intervals first
            Object.values(carouselIntervals).forEach(interval => clearInterval(interval));
            carouselIntervals = {};
            
            // Scroll to first slide in each carousel (centered)
            document.querySelectorAll('.carousel-container').forEach(container => {
                const firstSlide = container.querySelector('.carousel-slide.active');
                if (firstSlide) {
                    const containerRect = container.getBoundingClientRect();
                    const slideRect = firstSlide.getBoundingClientRect();
                    const scrollLeft = firstSlide.offsetLeft - (containerRect.width / 2) + (slideRect.width / 2);
                    
                    container.scrollTo({
                        left: scrollLeft,
                        behavior: 'auto'
                    });
                }
            });
            
            // Initialize carousels (this will set up auto-play)
            initializeCarousels();
        }, 200);
        
    } catch (error) {
        console.error('Error loading blog posts:', error);
        document.getElementById('blog-posts').innerHTML = 
            '<p style="text-align: center; padding: 2rem; color: var(--error-color);">Error loading blog posts. Please try again later.</p>';
    }
}

function createCategoryCarousel(categoryName, posts, container) {
    const categoryTitle = categoryName
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    
    const carouselSection = document.createElement('div');
    carouselSection.className = 'carousel-section';
    carouselSection.innerHTML = `
        <div class="carousel-header">
            <h2 class="carousel-category-title">
                ${categoryTitle}
                ${posts.length > 1 ? '<span class="carousel-auto-play-indicator" title="Auto-playing"><i class="fas fa-play-circle"></i></span>' : ''}
            </h2>
        </div>
        <div class="carousel-wrapper">
            <div class="carousel-container" data-category="${categoryName}" data-current="0">
                ${posts.map((post, index) => `
                    <div class="carousel-slide ${index === 0 ? 'active' : ''}" data-index="${index}">
                        <article class="blog-post">
                            ${post.image_url ? `<img src="${post.image_url}" alt="${escapeHtml(post.title)}">` : 
                                `<div class="blog-post-placeholder">
                                    <i class="fas fa-image"></i>
                                </div>`}
                            <span class="category">${escapeHtml(post.category)}</span>
                            <h2>${escapeHtml(post.title)}</h2>
                            <div class="meta">
                                ${post.author ? `<i class="fas fa-user"></i> ${escapeHtml(post.author)} • ` : ''}
                                <i class="fas fa-calendar"></i> ${formatDate(post.created_at)}
                            </div>
                            <p>${escapeHtml(post.content.substring(0, 600))}${post.content.length > 600 ? '...' : ''}</p>
                        </article>
                    </div>
                `).join('')}
            </div>
        </div>
        <div class="carousel-pagination" data-category="${categoryName}">
            ${posts.map((post, index) => `
                <button class="carousel-dot ${index === 0 ? 'active' : ''}" data-category="${categoryName}" data-index="${index}" aria-label="Go to slide ${index + 1}"></button>
            `).join('')}
        </div>
    `;
    
    container.appendChild(carouselSection);
}

let carouselIntervals = {};

function initializeCarousels() {
    // Clear any existing intervals
    Object.values(carouselIntervals).forEach(interval => clearInterval(interval));
    carouselIntervals = {};
    
    // Initialize navigation for each carousel
    document.querySelectorAll('.carousel-next').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const category = e.target.closest('.carousel-btn').dataset.category;
            navigateCarousel(category, 1);
            resetCarouselAutoPlay(category);
        });
    });
    
    document.querySelectorAll('.carousel-prev').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const category = e.target.closest('.carousel-btn').dataset.category;
            navigateCarousel(category, -1);
            resetCarouselAutoPlay(category);
        });
    });
    
    // Set up auto-play for each carousel
    document.querySelectorAll('.carousel-container').forEach(container => {
        const category = container.dataset.category;
        const slides = container.querySelectorAll('.carousel-slide');
        
        console.log(`Setting up carousel for category: ${category}, slides: ${slides.length}`);
        
        // Only auto-play if there are more than 1 slide
        if (slides.length > 1) {
            // Start auto-play immediately
            startCarouselAutoPlay(category);
            
            // Pause on hover
            container.addEventListener('mouseenter', () => {
                pauseCarouselAutoPlay(category);
            });
            
            container.addEventListener('mouseleave', () => {
                startCarouselAutoPlay(category);
            });
        } else {
            console.log(`Skipping auto-play for category ${category} - only ${slides.length} slide(s)`);
        }
    });
    
    // Set up pagination dots click handlers
    document.querySelectorAll('.carousel-dot').forEach(dot => {
        dot.addEventListener('click', (e) => {
            const category = dot.dataset.category;
            const targetIndex = parseInt(dot.dataset.index);
            const container = document.querySelector(`.carousel-container[data-category="${category}"]`);
            
            if (!container) return;
            
            const slides = container.querySelectorAll('.carousel-slide');
            const currentIndex = parseInt(container.dataset.current) || 0;
            
            if (targetIndex === currentIndex) return;
            
            // Update active slide
            slides.forEach((slide, index) => {
                slide.classList.remove('active');
                if (index === targetIndex) {
                    slide.classList.add('active');
                }
            });
            
            // Scroll to target slide
            const targetSlide = slides[targetIndex];
            const containerRect = container.getBoundingClientRect();
            const slideRect = targetSlide.getBoundingClientRect();
            const scrollLeft = targetSlide.offsetLeft - (containerRect.width / 2) + (slideRect.width / 2);
            
            container.scrollTo({
                left: scrollLeft,
                behavior: 'smooth'
            });
            
            // Update current index
            container.dataset.current = targetIndex;
            
            // Update pagination dots
            const dots = document.querySelectorAll(`.carousel-dot[data-category="${category}"]`);
            dots.forEach((d, index) => {
                if (index === targetIndex) {
                    d.classList.add('active');
                } else {
                    d.classList.remove('active');
                }
            });
            
            resetCarouselAutoPlay(category);
        });
    });
    
    // Set up touch/swipe support
    setupCarouselTouchSupport();
}

function startCarouselAutoPlay(category) {
    // Clear existing interval for this category
    if (carouselIntervals[category]) {
        clearInterval(carouselIntervals[category]);
        delete carouselIntervals[category];
    }
    
    const container = document.querySelector(`.carousel-container[data-category="${category}"]`);
    if (!container) {
        console.warn(`Carousel container not found for category: ${category}`);
        return;
    }
    
    const slides = container.querySelectorAll('.carousel-slide');
    if (slides.length <= 1) {
        return; // Don't auto-play if only one slide
    }
    
    // Start auto-play (change slide every 5 seconds - 5000ms)
    carouselIntervals[category] = setInterval(() => {
        navigateCarousel(category, 1);
    }, 5000);
    
    console.log(`Auto-play started for category: ${category} with ${slides.length} slides`);
}

function pauseCarouselAutoPlay(category) {
    if (carouselIntervals[category]) {
        clearInterval(carouselIntervals[category]);
        delete carouselIntervals[category];
    }
}

function resetCarouselAutoPlay(category) {
    pauseCarouselAutoPlay(category);
    startCarouselAutoPlay(category);
}

// Touch/swipe support
function setupCarouselTouchSupport() {
    document.querySelectorAll('.carousel-container').forEach(container => {
        let startX = 0;
        let scrollLeft = 0;
        let isDown = false;
        
        container.addEventListener('mousedown', (e) => {
            isDown = true;
            startX = e.pageX - container.offsetLeft;
            scrollLeft = container.scrollLeft;
            pauseCarouselAutoPlay(container.dataset.category);
        });
        
        container.addEventListener('mouseleave', () => {
            isDown = false;
        });
        
        container.addEventListener('mouseup', () => {
            isDown = false;
            const category = container.dataset.category;
            const slides = container.querySelectorAll('.carousel-slide');
            if (slides.length > 1) {
                startCarouselAutoPlay(category);
            }
        });
        
        container.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - container.offsetLeft;
            const walk = (x - startX) * 2;
            container.scrollLeft = scrollLeft - walk;
        });
        
        // Touch events
        let touchStartX = 0;
        container.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            pauseCarouselAutoPlay(container.dataset.category);
        });
        
        container.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            const diff = touchStartX - touchEndX;
            const category = container.dataset.category;
            
            if (Math.abs(diff) > 50) {
                if (diff > 0) {
                    navigateCarousel(category, 1);
                } else {
                    navigateCarousel(category, -1);
                }
                resetCarouselAutoPlay(category);
            } else {
                const slides = container.querySelectorAll('.carousel-slide');
                if (slides.length > 1) {
                    startCarouselAutoPlay(category);
                }
            }
        });
    });
}

function navigateCarousel(category, direction) {
    const container = document.querySelector(`.carousel-container[data-category="${category}"]`);
    const indicator = document.querySelector(`.carousel-indicator[data-category="${category}"]`);
    
    if (!container) return;
    
    const slides = container.querySelectorAll('.carousel-slide');
    const currentIndex = parseInt(container.dataset.current) || 0;
    let newIndex = currentIndex + direction;
    
    // Wrap around
    if (newIndex < 0) {
        newIndex = slides.length - 1;
    } else if (newIndex >= slides.length) {
        newIndex = 0;
    }
    
    // Update active slide
    slides.forEach((slide, index) => {
        slide.classList.remove('active');
        if (index === newIndex) {
            slide.classList.add('active');
        }
    });
    
    // Scroll to active slide (centered)
    const activeSlide = slides[newIndex];
    const containerRect = container.getBoundingClientRect();
    const slideRect = activeSlide.getBoundingClientRect();
    const scrollLeft = activeSlide.offsetLeft - (container.offsetWidth / 2) + (slideRect.width / 2);
    
    container.scrollTo({
        left: scrollLeft,
        behavior: 'smooth'
    });
    
    // Update indicator
    container.dataset.current = newIndex;
    if (indicator) {
        indicator.textContent = `${newIndex + 1} / ${slides.length}`;
    }
    
    // Update pagination dots
    const dots = document.querySelectorAll(`.carousel-dot[data-category="${category}"]`);
    dots.forEach((dot, index) => {
        if (index === newIndex) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
    });
}

// Get category from URL parameter
const urlParams = new URLSearchParams(window.location.search);
const categoryParam = urlParams.get('category') || 'all';
currentCategory = categoryParam;

// Set filter dropdown
document.addEventListener('DOMContentLoaded', () => {
    const filter = document.getElementById('category-filter');
    if (filter) {
        filter.value = currentCategory;
        filter.addEventListener('change', (e) => {
            // Clear all carousel intervals before changing category
            Object.values(carouselIntervals).forEach(interval => {
                if (interval) clearInterval(interval);
            });
            carouselIntervals = {};
            
            currentCategory = e.target.value;
            loadBlogPosts(currentCategory);
            // Update URL without reload
            const newUrl = currentCategory === 'all' 
                ? '/blog' 
                : `/blog?category=${currentCategory}`;
            window.history.pushState({}, '', newUrl);
        });
    }
    
    loadBlogPosts(currentCategory);
});
