// Events page functionality

let allEvents = [];

async function loadEvents() {
    try {
        const response = await fetch('/api/events');
        const events = await response.json();
        allEvents = events;
        
        filterEvents('all');
    } catch (error) {
        console.error('Error loading events:', error);
        document.getElementById('events-container').innerHTML = 
            '<p style="text-align: center; padding: 2rem; color: var(--error-color);">Error loading events. Please try again later.</p>';
    }
}

function filterEvents(filterType) {
    const container = document.getElementById('events-container');
    if (!container) return;
    
    let filteredEvents = allEvents;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (filterType === 'upcoming') {
        filteredEvents = allEvents.filter(event => {
            const eventDate = new Date(event.event_date);
            eventDate.setHours(0, 0, 0, 0);
            return eventDate >= today;
        });
    } else if (filterType === 'past') {
        filteredEvents = allEvents.filter(event => {
            const eventDate = new Date(event.event_date);
            eventDate.setHours(0, 0, 0, 0);
            return eventDate < today;
        });
    } else if (filterType !== 'all') {
        filteredEvents = allEvents.filter(event => event.event_type === filterType);
    }
    
    if (filteredEvents.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 2rem;">No events found.</p>';
        return;
    }
    
    container.innerHTML = `
        <div class="card-grid">
            ${filteredEvents.map(event => {
                const eventDate = new Date(event.event_date);
                const isUpcoming = eventDate >= today;
                
                return `
                    <div class="event-card">
                        ${event.image_url ? `<img src="${event.image_url}" alt="${escapeHtml(event.title)}">` : 
                            '<div style="height: 250px; background: linear-gradient(135deg, var(--primary-color), var(--secondary-color)); display: flex; align-items: center; justify-content: center; color: white; font-size: 3rem;"><i class="fas fa-calendar-alt"></i></div>'}
                        <div class="event-card-content">
                            <span class="event-type">${escapeHtml(event.event_type || 'Event')}</span>
                            ${isUpcoming ? '<span class="event-type" style="background: var(--success-color); margin-left: 0.5rem;">Upcoming</span>' : ''}
                            <h3>${escapeHtml(event.title)}</h3>
                            <p class="date">${formatDate(event.event_date)}</p>
                            ${event.description ? `<p>${escapeHtml(event.description)}</p>` : ''}
                            ${event.certificate_url ? `<a href="${event.certificate_url}" class="btn" style="margin-top: 1rem;" download>Download Certificate</a>` : ''}
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

document.addEventListener('DOMContentLoaded', () => {
    const filter = document.getElementById('event-filter');
    if (filter) {
        filter.addEventListener('change', (e) => {
            filterEvents(e.target.value);
        });
    }
    
    loadEvents();
});

