// Google Calendar API Handling
const CLIENT_ID = '951115827710-dno0jc4euv9oje1ktckug8psi3intid4.apps.googleusercontent.com';
const API_KEY = 'AIzaSyBElyKLtaZZIFHpBQa7QuzAjBQZ057Zg2A';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/calendar.events';

let tokenClient;
let gapiInited = false;
let gisInited = false;

document.getElementById('authorize_button').style.visibility = 'hidden';
document.getElementById('signout_button').style.visibility = 'hidden';

//Callback after api.js is loaded.
 
function gapiLoaded() {
    gapi.load('client', initializeGapiClient);
}

// Callback after the API client is loaded. Loads the discovery doc to initialize the API.
 
async function initializeGapiClient() {
    await gapi.client.init({
        apiKey: API_KEY,
        discoveryDocs: [DISCOVERY_DOC],
    });
    gapiInited = true;
    maybeEnableButtons();
}

// Callback after Google Identity Services are loaded.
 
function gisLoaded() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: '', // defined later
    });
    gisInited = true;
    maybeEnableButtons();
}

// Enables user interaction after all libraries are loaded.

function maybeEnableButtons() {
    if (gapiInited && gisInited) {
        document.getElementById('authorize_button').style.visibility = 'visible';
    }
}

// Sign in the user upon button click.
 
function handleAuthClick() {
    tokenClient.callback = async (resp) => {
        if (resp.error !== undefined) {
            throw resp;
        }
        document.getElementById('signout_button').style.visibility = 'visible';
        document.getElementById('authorize_button').innerText = 'Refresh';
        await listUpcomingEvents();
    };

    if (gapi.client.getToken() === null) {
        tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
        tokenClient.requestAccessToken({ prompt: '' });
    }
}

// Sign out the user upon button click.
function handleSignoutClick() {
    const token = gapi.client.getToken();
    if (token !== null) {
        google.accounts.oauth2.revoke(token.access_token);
        gapi.client.setToken('');
        document.getElementById('content').innerText = '';
        document.getElementById('authorize_button').innerText = 'Authorize';
        document.getElementById('signout_button').style.visibility = 'hidden';
    }
}

// Print the summary and start datetime/date of the next ten events in the authorized user's calendar.

async function listUpcomingEvents() {
    let response;
    try {
        const request = {
            calendarId: 'primary',
            timeMin: new Date().toISOString(),
            showDeleted: false,
            singleEvents: true,
            maxResults: 10,
            orderBy: 'startTime',
        };
        response = await gapi.client.calendar.events.list(request);
    } catch (err) {
        document.getElementById('content').innerText = err.message;
        return;
    }

    const events = response.result.items;
    if (!events || events.length == 0) {
        document.getElementById('content').innerText = 'No events found.';
        return;
    }

    const output = events.reduce((str, event) => {
        const dateTime = event.start.dateTime || event.start.date;
        const localTime = new Date(dateTime).toLocaleString();
        return `${str}${event.summary} (${localTime})\n`;
    }, 'Events:\n');
    document.getElementById('content').innerText = output;
}

//Populate the dates for the current week in the calendar boxes.
 
function populateWeekDates() {
    const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = new Date();
    const todayDayOfWeek = today.getDay();

    for (let i = 0; i < 7; i++) {
        const currentDate = new Date();
        currentDate.setDate(today.getDate() - todayDayOfWeek + i);

        const options = { month: 'long', day: 'numeric' };
        const formattedDate = currentDate.toLocaleDateString('en-US', options);

        document.getElementById(daysOfWeek[i]).innerHTML = `
            <h1>${daysOfWeek[i].charAt(0).toUpperCase() + daysOfWeek[i].slice(1)}</h1>
            <p>${formattedDate}</p>
        `;
    }
}

// Run the function after the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    populateWeekDates();
});
