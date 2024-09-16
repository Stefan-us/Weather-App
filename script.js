const userTab = document.querySelector("[data-userWeather]");
const searchTab = document.querySelector("[data-searchWeather]");
const userContainer = document.querySelector(".weather-container");
const grantAccessContainer = document.querySelector(".grant-location-container");
const searchForm = document.querySelector("[data-searchForm]");
const loadingScreen = document.querySelector(".loading-container");
const userInfoContainer = document.querySelector(".user-info-container");

let oldTab = userTab;
const API_KEY = "d1845658f92b31c64bd94f06f7188c9c";
oldTab.classList.add("current-tab");
getfromSessionStorage();

function switchTab(newTab) {
    if(newTab != oldTab) {
        oldTab.classList.remove("current-tab");
        oldTab = newTab;
        oldTab.classList.add("current-tab");

        if(!searchForm.classList.contains("active")) {
            userInfoContainer.classList.remove("active");
            grantAccessContainer.classList.remove("active");
            searchForm.classList.add("active");
        }
        else {
            searchForm.classList.remove("active");
            userInfoContainer.classList.remove("active");
            getfromSessionStorage();
        }
    }
}

userTab.addEventListener("click", () => {
    switchTab(userTab);
});

searchTab.addEventListener("click", () => {
    switchTab(searchTab);
});

function getfromSessionStorage() {
    const localCoordinates = sessionStorage.getItem("user-coordinates");
    if(!localCoordinates) {
        grantAccessContainer.classList.add("active");
    }
    else {
        const coordinates = JSON.parse(localCoordinates);
        fetchUserWeatherInfo(coordinates);
    }
}

async function fetchUserWeatherInfo(coordinates) {
    const {lat, lon} = coordinates;
    grantAccessContainer.classList.remove("active");
    loadingScreen.classList.add("active");

    try {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
        );
        const data = await response.json();

        loadingScreen.classList.remove("active");
        userInfoContainer.classList.add("active");
        renderWeatherInfo(data);
    }
    catch(err) {
        loadingScreen.classList.remove("active");
        // Handle errors here
    }
}

let currentWeatherInfo;

async function renderWeatherInfo(weatherInfo) {
    currentWeatherInfo = weatherInfo;
    const cityName = document.querySelector("[data-cityName]");
    const countryIcon = document.querySelector("[data-countryIcon]");
    const desc = document.querySelector("[data-weatherDesc]");
    const weatherIcon = document.querySelector("[data-weatherIcon]");
    const temp = document.querySelector("[data-temp]");
    const windspeed = document.querySelector("[data-windspeed]");
    const humidity = document.querySelector("[data-humidity]");
    const cloudiness = document.querySelector("[data-cloudiness]");

    cityName.innerText = weatherInfo?.name;
    countryIcon.src = `https://flagcdn.com/144x108/${weatherInfo?.sys?.country.toLowerCase()}.png`;
    desc.innerText = weatherInfo?.weather?.[0]?.description;
    weatherIcon.src = `http://openweathermap.org/img/w/${weatherInfo?.weather?.[0]?.icon}.png`;
    temp.innerText = `${weatherInfo?.main?.temp} °C`;
    windspeed.innerText = `${weatherInfo?.wind?.speed} m/s`;
    humidity.innerText = `${weatherInfo?.main?.humidity}%`;
    cloudiness.innerText = `${weatherInfo?.clouds?.all}%`;

    // Fetch and render hourly forecast
    const hourlyForecast = await fetchHourlyForecast(weatherInfo.coord.lat, weatherInfo.coord.lon);
    if (hourlyForecast) {
        renderHourlyForecast(hourlyForecast);
    }

    // Fetch advanced weather info and update sun info
    await fetchAdvancedWeatherInfo(weatherInfo.coord.lat, weatherInfo.coord.lon);
    updateSunInfo(weatherInfo.sys.sunrise, weatherInfo.sys.sunset);
}

// Add this function to fetch hourly forecast data
async function fetchHourlyForecast(lat, lon) {
    try {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&cnt=8`
        );
        const data = await response.json();
        return data.list;
    } catch (err) {
        console.error("Error fetching hourly forecast:", err);
        return null;
    }
}

// Add this function to render the hourly forecast
function renderHourlyForecast(hourlyData) {
    const hourlyForecastSlider = document.querySelector(".hourly-forecast-slider");
    hourlyForecastSlider.innerHTML = ""; // Clear existing content

    hourlyData.forEach((item) => {
        const dateTime = new Date(item.dt * 1000);
        const hour = dateTime.getHours();
        const temp = Math.round(item.main.temp);
        const icon = item.weather[0].icon;

        const hourlyItem = document.createElement("div");
        hourlyItem.classList.add("hourly-forecast-item");
        hourlyItem.innerHTML = `
            <p>${hour}:00</p>
            <img src="http://openweathermap.org/img/w/${icon}.png" alt="weather icon">
            <p>${temp}°C</p>
        `;
        hourlyForecastSlider.appendChild(hourlyItem);
    });
}

function getLocation() {
    if(navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition);
    }
    else {
        // Show an alert for no geolocation support available
    }
}

function showPosition(position) {
    const userCoordinates = {
        lat: position.coords.latitude,
        lon: position.coords.longitude,
    }

    sessionStorage.setItem("user-coordinates", JSON.stringify(userCoordinates));
    fetchUserWeatherInfo(userCoordinates);
}

const grantAccessButton = document.querySelector("[data-grantAccess]");
grantAccessButton.addEventListener("click", getLocation);

const searchInput = document.querySelector("[data-searchInput]");

searchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    let cityName = searchInput.value;

    if(cityName === "")
        return;
    else 
        fetchSearchWeatherInfo(cityName);
})

async function fetchSearchWeatherInfo(city) {
    loadingScreen.classList.add("active");
    userInfoContainer.classList.remove("active");
    grantAccessContainer.classList.remove("active");

    try {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`
        );
        const data = await response.json();
        
        loadingScreen.classList.remove("active");
        
        if (data.cod === "404") {
            showError(`${city} not found. Please enter a valid city name.`);
        } else {
            userInfoContainer.classList.add("active");
            renderWeatherInfo(data);
        }
    }
    catch(err) {
        loadingScreen.classList.remove("active");
        showError("An error occurred while fetching the weather data. Please try again.");
    }
}

function showError(message) {
    // Remove any existing error message
    const existingError = document.querySelector(".error-message");
    if (existingError) {
        existingError.remove();
    }

    // Create and display the error message
    const errorDiv = document.createElement("div");
    errorDiv.classList.add("error-message");
    errorDiv.textContent = message;
    errorDiv.style.color = "red";
    errorDiv.style.marginTop = "20px";
    errorDiv.style.textAlign = "center";

    userInfoContainer.classList.remove("active");
    searchForm.insertAdjacentElement("afterend", errorDiv);

    // Remove the error message after 3 seconds
    setTimeout(() => {
        errorDiv.remove();
    }, 3000);
}

const advancedInfoBtn = document.getElementById('advancedInfoBtn');
const advancedInfoContainer = document.getElementById('advancedInfoContainer');

advancedInfoBtn.addEventListener('click', () => {
    advancedInfoContainer.style.display = advancedInfoContainer.style.display === 'none' ? 'block' : 'none';
    advancedInfoBtn.textContent = advancedInfoContainer.style.display === 'none' ? 'Show Advanced Info' : 'Hide Advanced Info';
});

async function fetchAdvancedWeatherInfo(lat, lon) {
    try {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`
        );
        const data = await response.json();
        updateAdvancedInfo(data);
    } catch (err) {
        console.error("Error fetching advanced weather info:", err);
    }
}

function updateAdvancedInfo(data) {
    document.getElementById('pollenLevel').textContent = 'N/A'; // OpenWeatherMap doesn't provide pollen data
    document.getElementById('dustLevel').textContent = `${data.list[0].components.pm10} μg/m³`;
    document.getElementById('pollutionLevel').textContent = `${data.list[0].main.aqi}/5`;
    document.getElementById('realFeelTemp').textContent = `${currentWeatherInfo.main.feels_like}°C`;
}

const sunInfoBtn = document.getElementById('sunInfoBtn');
const sunInfoContainer = document.getElementById('sunInfoContainer');

sunInfoBtn.addEventListener('click', () => {
    sunInfoContainer.style.display = sunInfoContainer.style.display === 'none' ? 'block' : 'none';
    sunInfoBtn.textContent = sunInfoContainer.style.display === 'none' ? 'Show Sun Info' : 'Hide Sun Info';
});

function updateSunInfo(sunrise, sunset) {
    document.getElementById('sunriseTime').textContent = new Date(sunrise * 1000).toLocaleTimeString();
    document.getElementById('sunsetTime').textContent = new Date(sunset * 1000).toLocaleTimeString();
}

const themeSwitcher = document.getElementById('themeSwitcher');
const root = document.documentElement;

themeSwitcher.addEventListener('click', () => {
    root.classList.toggle('light-mode');
});