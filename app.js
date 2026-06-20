// Configuration
const LOCATIONS = [
    { name: 'Itä-Pasila', lat: 60.2055, lon: 25.0823 },
    { name: 'Hyvinkää', lat: 60.6295, lon: 25.1088 },
    { name: 'Lammi', lat: 61.0347, lon: 25.0422 }
];

const COMICS = {
    0: ['lassi-ja-leevi', 'keskenkasvuisia'], // Sunday
    1: ['fingerpori', 'fok_it', 'harald-hirmuinen'],
    2: ['fingerpori', 'fok_it', 'harald-hirmuinen'],
    3: ['fingerpori', 'fok_it', 'harald-hirmuinen'],
    4: ['fingerpori', 'fok_it', 'harald-hirmuinen'],
    5: ['fingerpori', 'fok_it', 'harald-hirmuinen'],
    6: ['fingerpori', 'fok_it', 'harald-hirmuinen']
};

const COMIC_DISPLAY_NAMES = {
    'fingerpori': 'Fingerpori',
    'fok_it': 'Fok_It',
    'harald-hirmuinen': 'Harald Hirmuinen',
    'lassi-ja-leevi': 'Lassi ja Leevi',
    'keskenkasvuisia': 'Keskenkasvuisia'
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadWeather();
    loadNameday();
    loadComics();
    loadNews();
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

// Nameday - using hardcoded Finnish nameday data
async function loadNameday() {
    try {
        const today = new Date();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');

        const namedays = getFinnishNamedays();
        const key = `${month}-${day}`;
        const names = namedays[key] || 'Ei nimipäivää';

        document.getElementById('namedayContent').innerHTML = `<strong>${today.toLocaleDateString('fi-FI', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong><br>${names}`;
    } catch (error) {
        console.error('Nameday error:', error);
        document.getElementById('namedayContent').innerHTML = '<div class="error">Virhe nimipäivässä</div>';
    }
}

function getFinnishNamedays() {
    // Finnish namedays for each day of the year
    // Format: 'MM-DD': 'Name'
    return {
        '01-01': 'Usko',
        '01-02': 'Matti',
        '01-03': 'Osmo',
        '01-04': 'Sirkka',
        '01-05': 'Hannele',
        '01-06': 'Jarkko',
        '01-07': 'Herra',
        '01-08': 'Veli',
        '01-09': 'Vertti',
        '01-10': 'Leila',
        '01-11': 'Joona',
        '01-12': 'Toini',
        '01-13': 'Nuutti',
        '01-14': 'Säde',
        '01-15': 'Loviisa',
        '01-16': 'Nils',
        '01-17': 'Anton',
        '01-18': 'Päivi',
        '01-19': 'Valdo',
        '01-20': 'Fabian',
        '01-21': 'Aino',
        '01-22': 'Petri',
        '01-23': 'Vieno',
        '01-24': 'Senja',
        '01-25': 'Pauli',
        '01-26': 'Kerttu',
        '01-27': 'Santtu',
        '01-28': 'Marjatta',
        '01-29': 'Martti',
        '01-30': 'Sisko',
        '01-31': 'Tuula',
        '02-01': 'Liisa',
        '02-02': 'Pekka',
        '02-03': 'Anssi',
        '02-04': 'Ruut',
        '02-05': 'Olli',
        '02-06': 'Dorotea',
        '02-07': 'Ristina',
        '02-08': 'Natalia',
        '02-09': 'Aapeli',
        '02-10': 'Jaakko',
        '02-11': 'Riitta',
        '02-12': 'Irja',
        '02-13': 'Virve',
        '02-14': 'Valentin',
        '02-15': 'Auli',
        '02-16': 'Maarit',
        '02-17': 'Väinö',
        '02-18': 'Reetta',
        '02-19': 'Riitta',
        '02-20': 'Armi',
        '02-21': 'Eija',
        '02-22': 'Elina',
        '02-23': 'Tellervo',
        '02-24': 'Miina',
        '02-25': 'Tapio',
        '02-26': 'Liina',
        '02-27': 'Kaarina',
        '02-28': 'Onni',
        '02-29': 'Alina',
        '03-01': 'Alma',
        '03-02': 'Vilma',
        '03-03': 'Gunnar',
        '03-04': 'Adrian',
        '03-05': 'Hemmo',
        '03-06': 'Oiva',
        '03-07': 'Ilkka',
        '03-08': 'Seija',
        '03-09': 'Esko',
        '03-10': 'Irina',
        '03-11': 'Veikko',
        '03-12': 'Viivi',
        '03-13': 'Rasimus',
        '03-14': 'Matilda',
        '03-15': 'Kristian',
        '03-16': 'Heidi',
        '03-17': 'Gertraudi',
        '03-18': 'Edvard',
        '03-19': 'Jouko',
        '03-20': 'Tarja',
        '03-21': 'Pentti',
        '03-22': 'Lea',
        '03-23': 'Arvo',
        '03-24': 'Terho',
        '03-25': 'Märta',
        '03-26': 'Emanuel',
        '03-27': 'Vanamo',
        '03-28': 'Saila',
        '03-29': 'Samuli',
        '03-30': 'Irma',
        '03-31': 'Kaarle',
        '04-01': 'Seppo',
        '04-02': 'Arkadiusz',
        '04-03': 'Taito',
        '04-04': 'Kukka',
        '04-05': 'Ulla',
        '04-06': 'Hannu',
        '04-07': 'Ilmari',
        '04-08': 'Panu',
        '04-09': 'Inari',
        '04-10': 'Detlef',
        '04-11': 'Ingrid',
        '04-12': 'Tuomo',
        '04-13': 'Oskar',
        '04-14': 'Teresia',
        '04-15': 'Kerttu',
        '04-16': 'Sulo',
        '04-17': 'Aladár',
        '04-18': 'Eeva',
        '04-19': 'Arto',
        '04-20': 'Yrjö',
        '04-21': 'Otso',
        '04-22': 'Jukka',
        '04-23': 'Olivia',
        '04-24': 'Anja',
        '04-25': 'Märkus',
        '04-26': 'Marjana',
        '04-27': 'Mikael',
        '04-28': 'Piia',
        '04-29': 'Liisa',
        '04-30': 'Pekka',
        '05-01': 'Maija',
        '05-02': 'Otava',
        '05-03': 'Aleksis',
        '05-04': 'Soila',
        '05-05': 'Anselmius',
        '05-06': 'Kersti',
        '05-07': 'Helka',
        '05-08': 'Iiris',
        '05-09': 'Sakari',
        '05-10': 'Päivikki',
        '05-11': 'Mamerto',
        '05-12': 'Paupiina',
        '05-13': 'Sointu',
        '05-14': 'Pontiaan',
        '05-15': 'Saarikki',
        '05-16': 'Kaija',
        '05-17': 'Sakari',
        '05-18': 'Urmas',
        '05-19': 'Kerttu',
        '05-20': 'Erkki',
        '05-21': 'Jalo',
        '05-22': 'Reima',
        '05-23': 'Sampo',
        '05-24': 'Anneli',
        '05-25': 'Iivari',
        '05-26': 'Raija',
        '05-27': 'Liisa',
        '05-28': 'Emil',
        '05-29': 'Manu',
        '05-30': 'Riikka',
        '05-31': 'Rauni',
        '06-01': 'Tuula',
        '06-02': 'Pirkko',
        '06-03': 'Antti',
        '06-04': 'Kari',
        '06-05': 'Kaisu',
        '06-06': 'Sauli',
        '06-07': 'Irene',
        '06-08': 'Sakari',
        '06-09': 'Veera',
        '06-10': 'Aatos',
        '06-11': 'Eija',
        '06-12': 'Onerva',
        '06-13': 'Aini',
        '06-14': 'Nesto',
        '06-15': 'Niilo',
        '06-16': 'Annukka',
        '06-17': 'Niilas',
        '06-18': 'Tapio',
        '06-19': 'Iini',
        '06-20': 'Retu',
        '06-21': 'Panu',
        '06-22': 'Aino',
        '06-23': 'Aki',
        '06-24': 'Juha',
        '06-25': 'Jaakko',
        '06-26': 'Niina',
        '06-27': 'Unto',
        '06-28': 'Lempi',
        '06-29': 'Pekka',
        '06-30': 'Eila',
        '07-01': 'Aapo',
        '07-02': 'Pirkko',
        '07-03': 'Auli',
        '07-04': 'Ulla',
        '07-05': 'Unto',
        '07-06': 'Mainio',
        '07-07': 'Tellervo',
        '07-08': 'Juho',
        '07-09': 'Touko',
        '07-10': 'Irja',
        '07-11': 'Elias',
        '07-12': 'Jouni',
        '07-13': 'Matilda',
        '07-14': 'Liisa',
        '07-15': 'Reino',
        '07-16': 'Vieno',
        '07-17': 'Helle',
        '07-18': 'Hellen',
        '07-19': 'Marina',
        '07-20': 'Kaarina',
        '07-21': 'Turo',
        '07-22': 'Magdalena',
        '07-23': 'Liina',
        '07-24': 'Kyllikki',
        '07-25': 'Jaakko',
        '07-26': 'Pinja',
        '07-27': 'Silta',
        '07-28': 'Pirkko',
        '07-29': 'Iiris',
        '07-30': 'Aino',
        '07-31': 'Leena',
        '08-01': 'Yrjö',
        '08-02': 'Elma',
        '08-03': 'Lyyli',
        '08-04': 'Sanna',
        '08-05': 'Eskil',
        '08-06': 'Elsa',
        '08-07': 'Lahja',
        '08-08': 'Tarja',
        '08-09': 'Kerttu',
        '08-10': 'Sylvi',
        '08-11': 'Aini',
        '08-12': 'Klara',
        '08-13': 'Valpuri',
        '08-14': 'Liisa',
        '08-15': 'Marja',
        '08-16': 'Arkku',
        '08-17': 'Saila',
        '08-18': 'Leila',
        '08-19': 'Tyyne',
        '08-20': 'Markus',
        '08-21': 'Sini',
        '08-22': 'Riikka',
        '08-23': 'Ilo',
        '08-24': 'Bartolomaeus',
        '08-25': 'Urho',
        '08-26': 'Tuva',
        '08-27': 'Iiris',
        '08-28': 'Anja',
        '08-29': 'Irene',
        '08-30': 'Jussi',
        '08-31': 'Arvi',
        '09-01': 'Gideon',
        '09-02': 'Ulla',
        '09-03': 'Aune',
        '09-04': 'Sointu',
        '09-05': 'Lumi',
        '09-06': 'Alpo',
        '09-07': 'Riitta',
        '09-08': 'Raimo',
        '09-09': 'Hilda',
        '09-10': 'Aune',
        '09-11': 'Tiina',
        '09-12': 'Kuisma',
        '09-13': 'Risto',
        '09-14': 'Sirkka',
        '09-15': 'Aino',
        '09-16': 'Helka',
        '09-17': 'Vilja',
        '09-18': 'Sulo',
        '09-19': 'Stella',
        '09-20': 'Saulis',
        '09-21': 'Antti',
        '09-22': 'Mauri',
        '09-23': 'Kille',
        '09-24': 'Seppo',
        '09-25': 'Aurinkö',
        '09-26': 'Palle',
        '09-27': 'Aino',
        '09-28': 'Vamppu',
        '09-29': 'Mikko',
        '09-30': 'Liisa',
        '10-01': 'Pirkko',
        '10-02': 'Jouko',
        '10-03': 'Pentti',
        '10-04': 'Hilkka',
        '10-05': 'Tuula',
        '10-06': 'Osmo',
        '10-07': 'Eira',
        '10-08': 'Riitta',
        '10-09': 'Tapio',
        '10-10': 'Maija',
        '10-11': 'Kerttu',
        '10-12': 'Harri',
        '10-13': 'Edith',
        '10-14': 'Minna',
        '10-15': 'Hedelmä',
        '10-16': 'Marjatta',
        '10-17': 'Aune',
        '10-18': 'Ruudikki',
        '10-19': 'Joel',
        '10-20': 'Auli',
        '10-21': 'Ursula',
        '10-22': 'Kerttu',
        '10-23': 'Severi',
        '10-24': 'Eeva',
        '10-25': 'Jouni',
        '10-26': 'Kerttu',
        '10-27': 'Ilkka',
        '10-28': 'Naimi',
        '10-29': 'Onni',
        '10-30': 'Kari',
        '10-31': 'Jouni',
        '11-01': 'Pyhä',
        '11-02': 'Siimu',
        '11-03': 'Matti',
        '11-04': 'Esko',
        '11-05': 'Ruut',
        '11-06': 'Runo',
        '11-07': 'Kaarina',
        '11-08': 'Miina',
        '11-09': 'Pekka',
        '11-10': 'Markus',
        '11-11': 'Martti',
        '11-12': 'Sääksi',
        '11-13': 'Kari',
        '11-14': 'Tuure',
        '11-15': 'Liisa',
        '11-16': 'Saarni',
        '11-17': 'Elise',
        '11-18': 'Seppo',
        '11-19': 'Elisabet',
        '11-20': 'Uljas',
        '11-21': 'Serafina',
        '11-22': 'Seija',
        '11-23': 'Klemens',
        '11-24': 'Aino',
        '11-25': 'Katri',
        '11-26': 'Noora',
        '11-27': 'Arvo',
        '11-28': 'Tapani',
        '11-29': 'Esko',
        '11-30': 'Antti',
        '12-01': 'Kylliki',
        '12-02': 'Karla',
        '12-03': 'Outi',
        '12-04': 'Otso',
        '12-05': 'Sirkka',
        '12-06': 'Nikolaus',
        '12-07': 'Lassi',
        '12-08': 'Tellervo',
        '12-09': 'Linnea',
        '12-10': 'Olga',
        '12-11': 'Tähti',
        '12-12': 'Lumikki',
        '12-13': 'Pirkko',
        '12-14': 'Tuulia',
        '12-15': 'Paavo',
        '12-16': 'Aino',
        '12-17': 'Maarit',
        '12-18': 'Priidik',
        '12-19': 'Vieno',
        '12-20': 'Ulla',
        '12-21': 'Tuomo',
        '12-22': 'Tiina',
        '12-23': 'Tapio',
        '12-24': 'Aatto',
        '12-25': 'Pekka',
        '12-26': 'Reeti',
        '12-27': 'Johannes',
        '12-28': 'Kielo',
        '12-29': 'Aino',
        '12-30': 'Markku',
        '12-31': 'Silvo'
    };
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
            // Fetch the comic page via CORS proxy
            const proxyUrl = `https://r.jina.ai/https://www.hs.fi/sarjakuvat/${comicId}/`;
            const response = await fetch(proxyUrl);
            const text = await response.text();
            
            // Extract image hash from the page
            const hashMatch = text.match(/https:\/\/images\.sanoma-sndp\.fi\/([a-f0-9]+)\/some\/hs-cartoons\.jpg/);
            
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
            } else {
                // Fallback: just show the link
                const comicDiv = document.createElement('div');
                comicDiv.className = 'comic';
                
                const title = document.createElement('div');
                title.className = 'comic-title';
                title.textContent = COMIC_DISPLAY_NAMES[comicId];
                comicDiv.appendChild(title);
                
                const link = document.createElement('a');
                link.href = `https://www.hs.fi/sarjakuvat/${comicId}/`;
                link.className = 'comic-link';
                link.target = '_blank';
                link.textContent = 'Avaa sarjakuva →';
                comicDiv.appendChild(link);
                
                comicsContent.appendChild(comicDiv);
            }
        } catch (error) {
            console.error('Error loading comic:', comicId, error);
            // Show fallback link
            const comicDiv = document.createElement('div');
            comicDiv.className = 'comic';
            
            const title = document.createElement('div');
            title.className = 'comic-title';
            title.textContent = COMIC_DISPLAY_NAMES[comicId];
            comicDiv.appendChild(title);
            
            const link = document.createElement('a');
            link.href = `https://www.hs.fi/sarjakuvat/${comicId}/`;
            link.className = 'comic-link';
            link.target = '_blank';
            link.textContent = 'Avaa sarjakuva →';
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
            // Take first 5 items
            const itemsToShow = Math.min(items.length, 5);
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
