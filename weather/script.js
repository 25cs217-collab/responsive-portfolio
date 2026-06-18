document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide Icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // ==========================================================================
    // STATE VARIABLES
    // ==========================================================================
    let currentWeatherData = null;
    let tempUnit = 'C'; // Default to Celsius

    // ==========================================================================
    // DOM ELEMENTS
    // ==========================================================================
    const searchForm = document.getElementById('search-form');
    const cityInput = document.getElementById('city-input');
    const geolocationBtn = document.getElementById('geolocation-btn');
    
    const errorCard = document.getElementById('error-card');
    const errorMessage = document.getElementById('error-message');
    const closeErrorBtn = document.getElementById('close-error-btn');
    
    const loadingSkeleton = document.getElementById('loading-skeleton');
    const weatherDashboard = document.getElementById('weather-dashboard');
    
    const unitCBtn = document.getElementById('unit-c-btn');
    const unitFBtn = document.getElementById('unit-f-btn');
    
    // Weather detail fields
    const locationNameEl = document.getElementById('location-name');
    const localTimeEl = document.getElementById('local-time');
    const weatherLargeIcon = document.getElementById('weather-large-icon');
    const mainTemperatureEl = document.getElementById('main-temperature');
    const weatherDescriptionEl = document.getElementById('weather-description');
    
    const valFeelsLike = document.getElementById('val-feels-like');
    const valHumidity = document.getElementById('val-humidity');
    const valWind = document.getElementById('val-wind');
    const valPrecipitation = document.getElementById('val-precipitation');
    
    const forecastGrid = document.getElementById('forecast-grid');

    // ==========================================================================
    // WEATHER CODE MAPPER (WMO standard codes)
    // ==========================================================================
    function mapWeatherCode(code) {
        // Returns { icon: string, description: string, theme: string }
        if (code === 0) {
            return { icon: 'sun', description: 'clear sky', theme: 'clear' };
        } else if (code === 1 || code === 2) {
            return { icon: 'cloud-sun', description: 'partly cloudy', theme: 'cloudy' };
        } else if (code === 3) {
            return { icon: 'cloud', description: 'overcast', theme: 'cloudy' };
        } else if (code === 45 || code === 48) {
            return { icon: 'cloud-fog', description: 'foggy', theme: 'cloudy' };
        } else if (code >= 51 && code <= 57) {
            return { icon: 'cloud-drizzle', description: 'drizzle', theme: 'rain' };
        } else if (code >= 61 && code <= 67) {
            return { icon: 'cloud-rain', description: 'rainy', theme: 'rain' };
        } else if (code >= 71 && code <= 77) {
            return { icon: 'snowflake', description: 'snowy', theme: 'snow' };
        } else if (code >= 80 && code <= 82) {
            return { icon: 'cloud-rain-wind', description: 'rain showers', theme: 'rain' };
        } else if (code === 85 || code === 86) {
            return { icon: 'cloud-snow', description: 'snow showers', theme: 'snow' };
        } else if (code >= 95 && code <= 99) {
            return { icon: 'cloud-lightning', description: 'thunderstorm', theme: 'rain' };
        }
        return { icon: 'cloud', description: 'cloudy', theme: 'cloudy' };
    }

    // Temperature unit formatter helper
    function formatTemp(celsius) {
        if (tempUnit === 'F') {
            const fahrenheit = Math.round((celsius * 9) / 5 + 32);
            return `${fahrenheit}°F`;
        }
        return `${Math.round(celsius)}°C`;
    }

    // Format local time using coordinate timezone offset
    function formatLocalTime(timezoneName) {
        const options = { 
            weekday: 'long', 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true,
            timeZone: timezoneName
        };
        try {
            return new Intl.DateTimeFormat('en-US', options).format(new Date());
        } catch (e) {
            // Fallback to local browser timezone if name is invalid
            return new Intl.DateTimeFormat('en-US', { 
                weekday: 'long', 
                hour: 'numeric', 
                minute: '2-digit', 
                hour12: true 
            }).format(new Date());
        }
    }

    // ==========================================================================
    // ASYNCHRONOUS API CLIENTS
    // ==========================================================================
    
    // Core search trigger
    async function searchCity(cityName) {
        if (!cityName.trim()) return;
        showLoading(true);
        hideError();
        
        try {
            // Step 1: Geocoding Fetch (Resolve city coordinates)
            const geocodeUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json`;
            const geocodeResponse = await fetch(geocodeUrl);
            
            if (!geocodeResponse.ok) {
                throw new Error('Failed to resolve location coordinates. Server returned error.');
            }
            
            const geocodeData = await geocodeResponse.json();
            
            if (!geocodeData.results || geocodeData.results.length === 0) {
                throw new Error(`Location "${cityName}" not found. Please check spelling.`);
            }
            
            const location = geocodeData.results[0];
            const name = location.name;
            const country = location.country_code ? location.country_code.toUpperCase() : '';
            const state = location.admin1 ? location.admin1 : '';
            const displayName = state ? `${name}, ${state} (${country})` : `${name}, ${country}`;
            
            // Step 2: Forecast Fetch using Coordinates
            await fetchWeatherData(location.latitude, location.longitude, displayName, location.timezone);
            
        } catch (error) {
            showError(error.message);
            showLoading(false);
        }
    }

    // Fetch weather metadata using coordinates
    async function fetchWeatherData(lat, lon, displayName, timezone) {
        try {
            const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=${encodeURIComponent(timezone)}`;
            const response = await fetch(weatherUrl);
            
            if (!response.ok) {
                throw new Error('Weather forecast service unavailable. Please try again later.');
            }
            
            const weatherData = await response.json();
            
            // Cache state data
            currentWeatherData = {
                locationName: displayName,
                timezone: timezone,
                current: weatherData.current,
                daily: weatherData.daily
            };
            
            renderDashboard();
            showLoading(false);
            
        } catch (error) {
            showError(error.message);
            showLoading(false);
        }
    }

    // ==========================================================================
    // VIEW RENDERING LOGIC
    // ==========================================================================
    function renderDashboard() {
        if (!currentWeatherData) return;
        
        const current = currentWeatherData.current;
        const daily = currentWeatherData.daily;
        const timezone = currentWeatherData.timezone;
        
        // Map WMO Code to UI Assets
        const condition = mapWeatherCode(current.weather_code);
        
        // Set dynamic visual theme class on body
        document.body.className = ''; // Reset
        document.body.classList.add(`theme-${condition.theme}`);
        
        // Populate core elements
        locationNameEl.textContent = currentWeatherData.locationName;
        localTimeEl.textContent = formatLocalTime(timezone);
        mainTemperatureEl.textContent = formatTemp(current.temperature_2m);
        weatherDescriptionEl.textContent = condition.description;
        
        // Dynamic Icon inject
        weatherLargeIcon.innerHTML = `<i data-lucide="${condition.icon}" class="glowing-icon"></i>`;
        
        // Populate secondary card stats
        valFeelsLike.textContent = formatTemp(current.apparent_temperature);
        valHumidity.textContent = `${current.relative_humidity_2m}%`;
        valWind.textContent = `${current.wind_speed_10m} km/h`;
        valPrecipitation.textContent = `${current.precipitation.toFixed(1)} mm`;
        
        // Build 5-Day Forecast Grid
        forecastGrid.innerHTML = '';
        
        // Loop through 5 days starting tomorrow (index 1 to 5)
        for (let i = 1; i <= 5; i++) {
            if (!daily.time[i]) break;
            
            const date = new Date(daily.time[i]);
            // Format Day string (e.g. Mon, Tue)
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
            
            const dayCondition = mapWeatherCode(daily.weather_code[i]);
            const maxTemp = formatTemp(daily.temperature_2m_max[i]);
            const minTemp = formatTemp(daily.temperature_2m_min[i]);
            
            const forecastItem = document.createElement('div');
            forecastItem.className = 'forecast-item';
            
            forecastItem.innerHTML = `
                <span class="forecast-day">${dayName}</span>
                <div class="forecast-condition-wrapper">
                    <div class="forecast-icon">
                        <i data-lucide="${dayCondition.icon}"></i>
                    </div>
                    <span class="forecast-status">${dayCondition.description}</span>
                </div>
                <div class="forecast-temps">
                    <span class="temp-max">${maxTemp}</span>
                    <span class="temp-min">${minTemp}</span>
                </div>
            `;
            
            forecastGrid.appendChild(forecastItem);
        }
        
        // Refresh icons inside dashboard
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        
        // Reveal Dashboard
        weatherDashboard.classList.add('active');
    }

    // ==========================================================================
    // UI CONTROLS & UTILITIES
    // ==========================================================================
    
    // Toggle Loading state visual animations
    function showLoading(isLoading) {
        if (isLoading) {
            loadingSkeleton.classList.add('active');
            weatherDashboard.classList.remove('active');
        } else {
            loadingSkeleton.classList.remove('active');
        }
    }
    
    // Show Error alert
    function showError(message) {
        errorMessage.textContent = message;
        errorCard.classList.add('active');
        weatherDashboard.classList.remove('active');
    }
    
    // Close/Dismiss Error Card
    function hideError() {
        errorCard.classList.remove('active');
    }

    // Close Button on Error panel
    if (closeErrorBtn) {
        closeErrorBtn.addEventListener('click', hideError);
    }

    // Celsius/Fahrenheit toggle buttons click listener
    if (unitCBtn && unitFBtn) {
        unitCBtn.addEventListener('click', () => {
            if (tempUnit === 'C') return;
            tempUnit = 'C';
            unitCBtn.classList.add('active');
            unitFBtn.classList.remove('active');
            renderDashboard();
        });
        
        unitFBtn.addEventListener('click', () => {
            if (tempUnit === 'F') return;
            tempUnit = 'F';
            unitFBtn.classList.add('active');
            unitCBtn.classList.remove('active');
            renderDashboard();
        });
    }

    // Submit handler for Search Form
    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const query = cityInput.value.trim();
            if (query) {
                searchCity(query);
            }
        });
    }

    // ==========================================================================
    // BROWSER GEOLOCATION ACCESS
    // ==========================================================================
    if (geolocationBtn) {
        geolocationBtn.addEventListener('click', () => {
            if (!navigator.geolocation) {
                showError('Geolocation is not supported by your browser.');
                return;
            }
            
            showLoading(true);
            hideError();
            
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const lat = position.coords.latitude;
                    const lon = position.coords.longitude;
                    const displayName = `My Location (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)`;
                    
                    // Retrieve local system timezone name
                    const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
                    
                    // Fetch weather data directly using GPS coordinates
                    await fetchWeatherData(lat, lon, displayName, localTimezone);
                    
                    // Reset input search box
                    cityInput.value = '';
                },
                (error) => {
                    let msg = 'Unable to retrieve GPS coordinates.';
                    if (error.code === error.PERMISSION_DENIED) {
                        msg = 'Location access denied. Please enable location permissions.';
                    }
                    showError(msg);
                    showLoading(false);
                },
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
            );
        });
    }

    // Trigger initial search for default city (e.g. Chennai) on page load
    searchCity('Chennai');
});
