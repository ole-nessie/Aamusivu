// Configuration
const LOCATIONS = [
    { name: 'Itä-Pasila', lat: 60.2055, lon: 25.0823 },
    { name: 'Hyvinkää', lat: 60.6295, lon: 25.1088 },
    { name: 'Lammi', lat: 61.0347, lon: 25.0422 }
];

const COMICS = {
    0: ['lassi-ja-leevi', 'keskenkasvuisia'],
    1: ['fingerpori', 'fok_it', 'harald-hirmuinen', 'lassi-ja-leevi'],
    2: ['fingerpori', 'fok_it', 'harald-hirmuinen', 'lassi-ja-leevi'],
    3: ['fingerpori', 'fok_it', 'harald-hirmuinen', 'lassi-ja-leevi'],
    4: ['fingerpori', 'fok_it', 'harald-hirmuinen', 'lassi-ja-leevi'],
    5: ['fingerpori', 'fok_it', 'harald-hirmuinen', 'lassi-ja-leevi'],
    6: ['fingerpori', 'fok_it', 'harald-hirmuinen', 'lassi-ja-leevi']
};

const COMIC_DISPLAY_NAMES = {
    'fingerpori': 'Fingerpori',
    'fok_it': 'Fok_It',
    'harald-hirmuinen': 'Harald Hirmuinen',
    'lassi-ja-leevi': 'Lassi ja Leevi',
    'keskenkasvuisia': 'Keskenkasvuisia'
};

// Mapping from internal comic IDs to HS.fi URL paths
const COMIC_URL_PATHS = {
    'fingerpori': 'fingerpori',
    'fok_it': 'fokit',
    'harald-hirmuinen': 'haraldhirmuinen',
    'lassi-ja-leevi': 'lassijaleevi',
    'keskenkasvuisia': 'keskenkasvuisia'
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadWeather();
    loadNameday();
    loadComics();
    loadNews();
    loadHSNews();
    loadKulttuuriNews();
    loadHSVisioNews();
    loadHelsinkiNews();
});

// Weather
async function loadWeather() {
    try {
        const weatherContent = document.getElementById('weatherContent');
        weatherContent.innerHTML = '';

        for (const location of LOCATIONS) {
            const data = await fetchWeatherForecast(location);
            if (data) {
                const card = createWeatherLocation(location.name, data);
                weatherContent.appendChild(card);
            }
        }
    } catch (error) {
        console.error('Weather error:', error);
        document.getElementById('weatherContent').innerHTML = '<div class="error">Virhe säätiedoissa</div>';
    }
}

async function fetchWeatherForecast(location) {
    try {
        // Open-Meteo API - get 10 days of hourly forecast to ensure we have future times
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lon}&current=temperature_2m,weather_code&hourly=temperature_2m,weather_code&timezone=Europe/Helsinki&forecast_days=10`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.current && data.hourly) {
            const current = {
                temp: Math.round(data.current.temperature_2m),
                code: data.current.weather_code
            };

            // Times we want to show: 09:00, 14:00, 20:00
            const targetTimes = [9, 14, 20];
            const now = new Date();
            const currentHour = now.getHours();

            const times = data.hourly.time;
            const hourly = data.hourly.temperature_2m;
            const codes = data.hourly.weather_code;

            // Find the next three occurrences of our target times
            const forecasts = [];
            for (const targetHour of targetTimes) {
                // Find the next occurrence of this hour
                let found = false;
                
                for (let i = 0; i < times.length; i++) {
                    const timeStr = times[i];
                    const hour = parseInt(timeStr.split('T')[1]);
                    
                    // If it's today and time has passed, skip to tomorrow
                    // If it's today and time hasn't passed, use it
                    // If it's tomorrow or later, use it
                    const timeDate = new Date(timeStr);
                    if (timeDate > now) {
                        // Check if this is the target hour
                        if (hour === targetHour) {
                            forecasts.push({
                                temp: Math.round(hourly[i]),
                                code: codes[i],
                                time: `${String(targetHour).padStart(2, '0')}:00`
                            });
                            found = true;
                            break;
                        }
                    }
                }
                
                if (!found) {
                    console.warn(`Could not find forecast for ${targetHour}:00`);
                }
            }

            // Ensure we have 3 forecasts
            while (forecasts.length < 3) {
                forecasts.push({ temp: 0, code: 0, time: '--:--' });
            }

            return { 
                current, 
                slot1: forecasts[0],
                slot2: forecasts[1],
                slot3: forecasts[2]
            };
        }
    } catch (error) {
        console.error(`Weather fetch error for ${location.name}:`, error);
    }
    return null;
}

function getWeatherIcon(code) {
    // WMO Weather interpretation codes
    if (code === 0) return '☀️'; // Clear sky
    if (code === 1 || code === 2) return '🌤️'; // Mainly clear, partly cloudy
    if (code === 3) return '☁️'; // Overcast
    if (code === 45 || code === 48) return '🌫️'; // Foggy
    if (code >= 51 && code <= 67) return '🌧️'; // Drizzle
    if (code >= 71 && code <= 77 || code === 85 || code === 86) return '❄️'; // Snow
    if (code >= 80 && code <= 82) return '🌧️'; // Rain showers
    if (code === 85 || code === 86) return '🌨️'; // Snow showers
    if (code >= 90 && code <= 99) return '⛈️'; // Thunderstorm
    return '🌤️';
}

function createWeatherLocation(name, data) {
    const container = document.createElement('div');
    container.className = 'weather-location';
    
    const title = document.createElement('div');
    title.className = 'location-name';
    title.textContent = name;
    container.appendChild(title);

    const grid = document.createElement('div');
    grid.className = 'weather-grid';

    // Current
    const currentCard = document.createElement('div');
    currentCard.className = 'weather-card';
    currentCard.innerHTML = `
        <div class="weather-time">Nyt</div>
        <div class="weather-icon">${getWeatherIcon(data.current.code)}</div>
        <div class="temp">${data.current.temp}°</div>
    `;
    grid.appendChild(currentCard);

    // Slot 1
    const slot1Card = document.createElement('div');
    slot1Card.className = 'weather-card';
    slot1Card.innerHTML = `
        <div class="weather-time">${data.slot1.time}</div>
        <div class="weather-icon">${getWeatherIcon(data.slot1.code)}</div>
        <div class="temp">${data.slot1.temp}°</div>
    `;
    grid.appendChild(slot1Card);

    // Slot 2
    const slot2Card = document.createElement('div');
    slot2Card.className = 'weather-card';
    slot2Card.innerHTML = `
        <div class="weather-time">${data.slot2.time}</div>
        <div class="weather-icon">${getWeatherIcon(data.slot2.code)}</div>
        <div class="temp">${data.slot2.temp}°</div>
    `;
    grid.appendChild(slot2Card);

    // Slot 3
    const slot3Card = document.createElement('div');
    slot3Card.className = 'weather-card';
    slot3Card.innerHTML = `
        <div class="weather-time">${data.slot3.time}</div>
        <div class="weather-icon">${getWeatherIcon(data.slot3.code)}</div>
        <div class="temp">${data.slot3.temp}°</div>
    `;
    grid.appendChild(slot3Card);

    container.appendChild(grid);
    return container;
}

// Nameday - fetch from external JSON source (GitHub Gist)
const NAMEDAY_API_URL = 'https://gist.githubusercontent.com/zokier/1951412/raw/gistfile1.json';

async function loadNameday() {
    try {
        const today = new Date();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const dateKey = `${month}-${day}`;

        const response = await fetch(NAMEDAY_API_URL);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const namedays = await response.json();
        // The JSON has keys like "2013-01-01", find matching date
        const fullDateKey = Object.keys(namedays).find(key => key.endsWith(`-${dateKey}`));
        
        let names = 'Ei nimipäivää';
        if (fullDateKey) {
            const dayNames = namedays[fullDateKey];
            names = dayNames.length > 0 ? dayNames.join(', ') : 'Ei nimipäivää';
        }

        document.getElementById('namedayContent').innerHTML = `<strong>${today.toLocaleDateString('fi-FI', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong><br>${names}`;
    } catch (error) {
        console.error('Nameday error:', error);
        document.getElementById('namedayContent').innerHTML = '<div class="error">Virhe nimipäivässä</div>';
    }
}

// Comics section - display actual comic images
async function loadComics() {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const comicsForDay = COMICS[dayOfWeek] || [];

    const comicsContent = document.getElementById('comicsContent');
    comicsContent.innerHTML = '<div class="loading">Ladataan sarjakuvia...</div>';

    if (comicsForDay.length === 0) {
        comicsContent.innerHTML = '<div class="loading">Ei sarjakuvia tänään</div>';
        return;
    }

    for (const comicId of comicsForDay) {
        try {
            // Get the URL path for this comic ID
            const urlPath = COMIC_URL_PATHS[comicId] || comicId;
            
            // Step 1: Fetch the comic list page
            const listUrl = `https://r.jina.ai/https://www.hs.fi/sarjakuvat/${urlPath}/`;
            const listResponse = await fetch(listUrl);
            const listText = await listResponse.text();
            
            // Step 2: Extract the latest car- ID
            const carMatch = listText.match(/car-([0-9]+)\.html/);
            
            if (carMatch) {
                const carId = carMatch[0]; // e.g., "car-2000012083210.html"
                
                // Step 3: Fetch the specific comic page
                const comicUrl = `https://r.jina.ai/https://www.hs.fi/sarjakuvat/${urlPath}/${carId}`;
                const comicResponse = await fetch(comicUrl);
                const comicText = await comicResponse.text();
                
                // Step 4: Extract the image hash
                const hashMatch = comicText.match(/https:\/\/images\.sanoma-sndp\.fi\/([a-f0-9]+)\/normal\/978\.jpg/);
                
                if (hashMatch) {
                    const hash = hashMatch[1];
                    const imgUrl = `https://images.sanoma-sndp.fi/${hash}/normal/978.jpg`;
                    
                    // Create comic container
                    const comicDiv = document.createElement('div');
                    comicDiv.className = 'comic';
                    
                    const title = document.createElement('div');
                    title.className = 'comic-title';
                    title.textContent = COMIC_DISPLAY_NAMES[comicId];
                    comicDiv.appendChild(title);
                    
                    const img = document.createElement('img');
                    img.src = imgUrl;
                    img.alt = COMIC_DISPLAY_NAMES[comicId] || comicId;
                    img.className = 'comic-image';
                    img.onerror = function() {
                        this.parentNode.innerHTML = '<div class="loading">Sarjakuvaa ei saatavilla</div>';
                    };
                    
                    comicDiv.appendChild(img);
                    comicsContent.appendChild(comicDiv);
                    continue;
                }
            }
            
            // Fallback: show link
            throw new Error('Image not found');
        } catch (error) {
            console.error('Error loading comic:', comicId, error);
            // Show fallback link
            const comicDiv = document.createElement('div');
            comicDiv.className = 'comic';
            
            const title = document.createElement('div');
            title.className = 'comic-title';
            title.textContent = COMIC_DISPLAY_NAMES[comicId];
            comicDiv.appendChild(title);
            
            const urlPath = COMIC_URL_PATHS[comicId] || comicId;
            const link = document.createElement('a');
            link.href = `https://www.hs.fi/sarjakuvat/${urlPath}/`;
            link.className = 'comic-link';
            link.target = '_blank';
            link.textContent = 'Avaa sarjakuva';
            comicDiv.appendChild(link);
            
            comicsContent.appendChild(comicDiv);
        }
    }
}

// News - Use Yle's public RSS feed via CORS proxy
async function loadNews() {
    const newsContent = document.getElementById('newsContent');
    newsContent.innerHTML = '<div class="loading">Ladataan...</div>';
    
    try {
        // Use r.jina.ai CORS proxy to fetch Yle RSS feed
        const proxyUrl = 'https://r.jina.ai/https://yle.fi/rss/uutiset/tuoreimmat';
        const response = await fetch(proxyUrl);
        const text = await response.text();

        // Parse the markdown format returned by r.jina.ai
        // Format: ### [title](url)\ndescription
        const lines = text.split('\n');
        const items = [];
        let currentItem = null;
        
        for (const line of lines) {
            const match = line.match(/^### \[(.+?)\]\((.+?)\)/);
            if (match) {
                if (currentItem) items.push(currentItem);
                currentItem = {
                    title: match[1],
                    link: match[2],
                    description: ''
                };
            } else if (currentItem && line && !line.startsWith('[') && 
                      !line.startsWith('Title:') && !line.startsWith('URL Source:') &&
                      !line.startsWith('Markdown') && !line.startsWith('#') && 
                      !line.match(/^https?:/) && line.trim() !== '') {
                if (currentItem.description) {
                    currentItem.description += ' ' + line.trim();
                } else {
                    currentItem.description = line.trim();
                }
            }
        }
        if (currentItem) items.push(currentItem);

        newsContent.innerHTML = '';

        if (items.length > 0) {
            // Take first 10 items
            const itemsToShow = Math.min(items.length, 10);
            for (let i = 0; i < itemsToShow; i++) {
                const item = items[i];
                const newsItem = document.createElement('div');
                newsItem.className = 'news-item';
                
                const titleEl = document.createElement('div');
                titleEl.className = 'news-title';
                titleEl.textContent = item.title || 'Ei otsikkoa';
                newsItem.appendChild(titleEl);
                
                const summaryEl = document.createElement('div');
                summaryEl.className = 'news-summary';
                summaryEl.textContent = item.description || item.title || '';
                newsItem.appendChild(summaryEl);
                
                const linkEl = document.createElement('a');
                linkEl.href = item.link || '#';
                linkEl.className = 'news-link';
                linkEl.target = '_blank';
                linkEl.textContent = 'Lue lisää →';
                newsItem.appendChild(linkEl);
                
                newsContent.appendChild(newsItem);
            }
        } else {
            newsContent.innerHTML = '<div class="error">Uutisia ei saatavilla</div>';
        }
    } catch (error) {
        console.error('News error:', error);
        document.getElementById('newsContent').innerHTML = '<div class="error">Virhe uutisissa</div>';
    }
}

// HS.fi Most Read News
async function loadHSNews() {
    const hsNewsContent = document.getElementById('hsNewsContent');
    hsNewsContent.innerHTML = '<div class="loading">Ladataan...</div>';
    
    try {
        // Use r.jina.ai CORS proxy to fetch HS most read page
        const proxyUrl = 'https://r.jina.ai/https://www.hs.fi/luetuimmat/';
        const response = await fetch(proxyUrl);
        const text = await response.text();
        
        // Parse markdown to extract article titles and URLs
        // Format: "## [Title](url)" or "## Title](url)"
        const items = [];
        const titleRegex = /##\s*\[?([^\]\)\n]+)\]?\((https:\/\/www\.hs\.fi\/[^\)]+)\)/g;
        let match;
        
        while ((match = titleRegex.exec(text)) !== null) {
            const title = match[1].trim();
            let url = match[2];
            
            // Clean up URL - remove trailing characters if any
            url = url.replace(/[)\]\s]*$/, '');
            
            if (title && url) {
                items.push({ title, url });
            }
        }
        
        hsNewsContent.innerHTML = '';
        
        if (items.length > 0) {
            // Take first 10 items
            const itemsToShow = Math.min(items.length, 10);
            
            for (let i = 0; i < itemsToShow; i++) {
                const item = items[i];
                
                const newsItem = document.createElement('div');
                newsItem.className = 'news-item';
                
                const titleEl = document.createElement('div');
                titleEl.className = 'news-title';
                titleEl.textContent = item.title;
                newsItem.appendChild(titleEl);
                
                const linkEl = document.createElement('a');
                linkEl.href = item.url;
                linkEl.className = 'news-link';
                linkEl.target = '_blank';
                linkEl.textContent = 'Lue lisää →';
                newsItem.appendChild(linkEl);
                
                hsNewsContent.appendChild(newsItem);
            }
        } else {
            hsNewsContent.innerHTML = '<div class="error">Luetuimpia uutisia ei saatavilla</div>';
        }
    } catch (error) {
        console.error('HS News error:', error);
        document.getElementById('hsNewsContent').innerHTML = '<div class="error">Virhe luetuimpien uutisten latauksessa</div>';
    }
}

// Kulttuuri News
async function loadKulttuuriNews() {
    const newsContent = document.getElementById('kulttuuriNewsContent');
    newsContent.innerHTML = '<div class="loading">Ladataan...</div>';
    
    try {
        const proxyUrl = 'https://r.jina.ai/https://www.hs.fi/kulttuuri/';
        const response = await fetch(proxyUrl);
        const text = await response.text();
        
        // Parse markdown to extract article titles and URLs
        const items = [];
        const titleRegex = /##\s*\[?([^\]\n\)]+)\]?\((https:\/\/www\.hs\.fi\/kulttuuri\/art-[0-9]+\.html)\)/g;
        let match;
        
        while ((match = titleRegex.exec(text)) !== null) {
            const title = match[1].trim();
            let url = match[2].replace(/[)\]\s]*$/, '');
            
            if (title && url) {
                items.push({ title, url });
            }
        }
        
        newsContent.innerHTML = '';
        
        if (items.length > 0) {
            const itemsToShow = Math.min(items.length, 5);
            
            for (let i = 0; i < itemsToShow; i++) {
                const item = items[i];
                
                const newsItem = document.createElement('div');
                newsItem.className = 'news-item';
                
                const titleEl = document.createElement('div');
                titleEl.className = 'news-title';
                titleEl.textContent = item.title;
                newsItem.appendChild(titleEl);
                
                const linkEl = document.createElement('a');
                linkEl.href = item.url;
                linkEl.className = 'news-link';
                linkEl.target = '_blank';
                linkEl.textContent = 'Lue lisää →';
                newsItem.appendChild(linkEl);
                
                newsContent.appendChild(newsItem);
            }
        } else {
            newsContent.innerHTML = '<div class="error">Kulttuuri-uutisia ei saatavilla</div>';
        }
    } catch (error) {
        console.error('Kulttuuri News error:', error);
        document.getElementById('kulttuuriNewsContent').innerHTML = '<div class="error">Virhe kulttuiruutisten latauksessa</div>';
    }
}

// HS Visio News
async function loadHSVisioNews() {
    const newsContent = document.getElementById('visioNewsContent');
    newsContent.innerHTML = '<div class="loading">Ladataan...</div>';
    
    try {
        const proxyUrl = 'https://r.jina.ai/https://www.hs.fi/visio/';
        const response = await fetch(proxyUrl);
        const text = await response.text();
        
        // Parse markdown to extract article titles and URLs
        const items = [];
        const titleRegex = /##\s*\[?([^\]\n\)]+)\]?\((https:\/\/www\.hs\.fi\/visio\/art-[0-9]+\.html)\)/g;
        let match;
        
        while ((match = titleRegex.exec(text)) !== null) {
            const title = match[1].trim();
            let url = match[2].replace(/[)\]\s]*$/, '');
            
            if (title && url) {
                items.push({ title, url });
            }
        }
        
        newsContent.innerHTML = '';
        
        if (items.length > 0) {
            const itemsToShow = Math.min(items.length, 5);
            
            for (let i = 0; i < itemsToShow; i++) {
                const item = items[i];
                
                const newsItem = document.createElement('div');
                newsItem.className = 'news-item';
                
                const titleEl = document.createElement('div');
                titleEl.className = 'news-title';
                titleEl.textContent = item.title;
                newsItem.appendChild(titleEl);
                
                const linkEl = document.createElement('a');
                linkEl.href = item.url;
                linkEl.className = 'news-link';
                linkEl.target = '_blank';
                linkEl.textContent = 'Lue lisää →';
                newsItem.appendChild(linkEl);
                
                newsContent.appendChild(newsItem);
            }
        } else {
            newsContent.innerHTML = '<div class="error">Visio-uutisia ei saatavilla</div>';
        }
    } catch (error) {
        console.error('Visio News error:', error);
        document.getElementById('visioNewsContent').innerHTML = '<div class="error">Virhe Visio-uutisten latauksessa</div>';
    }
}

// Helsinki News
async function loadHelsinkiNews() {
    const newsContent = document.getElementById('helsinkiNewsContent');
    newsContent.innerHTML = '<div class="loading">Ladataan...</div>';
    
    try {
        const proxyUrl = 'https://r.jina.ai/https://www.hs.fi/helsinki/';
        const response = await fetch(proxyUrl);
        const text = await response.text();
        
        // Parse markdown to extract article titles and URLs
        const items = [];
        const titleRegex = /##\s*\[?([^\]\n\)]+)\]?\((https:\/\/www\.hs\.fi\/helsinki\/art-[0-9]+\.html)\)/g;
        let match;
        
        while ((match = titleRegex.exec(text)) !== null) {
            const title = match[1].trim();
            let url = match[2].replace(/[)\]\s]*$/, '');
            
            if (title && url) {
                items.push({ title, url });
            }
        }
        
        newsContent.innerHTML = '';
        
        if (items.length > 0) {
            const itemsToShow = Math.min(items.length, 5);
            
            for (let i = 0; i < itemsToShow; i++) {
                const item = items[i];
                
                const newsItem = document.createElement('div');
                newsItem.className = 'news-item';
                
                const titleEl = document.createElement('div');
                titleEl.className = 'news-title';
                titleEl.textContent = item.title;
                newsItem.appendChild(titleEl);
                
                const linkEl = document.createElement('a');
                linkEl.href = item.url;
                linkEl.className = 'news-link';
                linkEl.target = '_blank';
                linkEl.textContent = 'Lue lisää →';
                newsItem.appendChild(linkEl);
                
                newsContent.appendChild(newsItem);
            }
        } else {
            newsContent.innerHTML = '<div class="error">Helsinki-uutisia ei saatavilla</div>';
        }
    } catch (error) {
        console.error('Helsinki News error:', error);
        document.getElementById('helsinkiNewsContent').innerHTML = '<div class="error">Virhe Helsinki-uutisten latauksessa</div>';
    }
}
