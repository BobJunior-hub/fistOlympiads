// Resources page functionality

let allResources = [];

async function loadResources() {
    try {
        const response = await fetch('/api/resources');
        const resources = await response.json();
        allResources = resources;
        
        filterResources('all');
    } catch (error) {
        console.error('Error loading resources:', error);
        document.getElementById('resources-container').innerHTML = 
            '<p style="text-align: center; padding: 2rem; color: var(--error-color);">Error loading resources. Please try again later.</p>';
    }
}

function filterResources(filterType) {
    const container = document.getElementById('resources-container');
    if (!container) return;
    
    let filteredResources = allResources;
    
    if (filterType !== 'all') {
        filteredResources = allResources.filter(resource => resource.resource_type === filterType);
    }
    
    if (filteredResources.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 2rem;">No resources found.</p>';
        return;
    }
    
    container.innerHTML = filteredResources.map(resource => `
        <div class="resource-item">
            <div class="resource-item-info">
                <h3>${escapeHtml(resource.title)}</h3>
                <p>${escapeHtml(resource.description || '')}</p>
                <p style="margin-top: 0.5rem;">
                    <span style="background: var(--primary-color); color: white; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.85rem;">
                        ${escapeHtml(resource.resource_type || 'Resource')}
                    </span>
                </p>
            </div>
            ${resource.file_url ? 
                `<a href="${resource.file_url}" class="btn" download>Download</a>` : 
                '<span style="color: var(--text-light);">No file available</span>'}
        </div>
    `).join('');
}

document.addEventListener('DOMContentLoaded', () => {
    const filter = document.getElementById('resource-filter');
    if (filter) {
        filter.addEventListener('change', (e) => {
            filterResources(e.target.value);
        });
    }
    
    loadResources();
});

