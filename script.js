async function addEvent() {
    const summary = document.getElementById('eventSummary').value;
    const date = document.getElementById('eventDate').value;  
    const time = document.getElementById('eventTime').value;
    
    if (!date || !time) {
        alert('Please enter a valid time and date for the event.');
        return;
    }

    const eventDateTime = new Date(`${date}T${time}`).toISOString();

    const event = {
        summary: summary,
        start: {
            dateTime: eventDateTime,
            timeZone: 'America/Los_Angeles', 
        },
        end: {
            dateTime: new Date(new Date(eventDateTime).getTime() + 60 * 60 * 1000).toISOString(), 
            timeZone: 'America/Los_Angeles',
        },
    };

    try {
        const response = await gapi.client.calendar.events.insert({
            calendarId: 'primary',
            resource: event,
        });

        // Shorten the display text for the event link
        const link = response.result.htmlLink;
        document.getElementById('addEventResult').innerHTML =
            `<a href="${link}" target="_blank">View Event</a>`;
    } catch (err) {
        document.getElementById('addEventResult').innerText =
            `Error creating event: ${err.message}`;
    }

    listUpcomingEvents();
}

async function addEventModal() {
    // Get the event description and time from the modal
    const description = document.getElementById('eventDescription').value;
    const date = document.getElementById('eventDateModal').value;  
    const time = document.getElementById('eventTimeModal').value;  
    const isPriority = document.getElementById('priorityCheckbox').checked;  

    if (!description || !time || !date) {
        alert('Please enter a valid description, date, and time for the event.');
        return;
    }

    const eventDateTime = new Date(`${date}T${time}`).toISOString();

    // Create event object for Google Calendar API
    const event = {
        summary: description,
        start: {
            dateTime: eventDateTime,
            timeZone: 'America/Los_Angeles', 
        },
        end: {
            dateTime: new Date(new Date(eventDateTime).getTime() + 60 * 60 * 1000).toISOString(),
            timeZone: 'America/Los_Angeles',
        },
    };

    try {
        // Use Google Calendar API to add event
        const response = await gapi.client.calendar.events.insert({
            calendarId: 'primary',
            resource: event,
        });

        // On success, display the link to the event
        const link = response.result.htmlLink;
        document.getElementById('addEventResult').innerHTML =
            `<a href="${link}" target="_blank">View Event</a>`;

        if (isPriority) {
            addEventToPriorityBox(event);
            savePriorityEvent(event);
        }

        // Close the modal after adding the event
        document.getElementById('eventModal').style.display = 'none';
    } catch (err) {
        // Handle errors and display error message
        document.getElementById('addEventResult').innerText =
            `Error creating event: ${err.message}`;
    }

    listUpcomingEvents();
}


function addEventToPriorityBox(event) {
    const priorityBox = document.querySelector('.priority-box');
    const eventItem = document.createElement('div');
    eventItem.classList.add('priority-event-item', 'event-bubble');
    
    const eventDate = new Date(event.start.dateTime);
    const eventDateFormatted = eventDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
    const eventTimeFormatted = eventDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    });

    const eventContent = document.createElement('div');
    eventContent.textContent = `${event.summary} on ${eventDateFormatted} at ${eventTimeFormatted}`;
    
    // Create the delete icon
    const deleteIcon = document.createElement('span');
    deleteIcon.classList.add('delete-icon');
    deleteIcon.textContent = 'x';

    deleteIcon.addEventListener('click', function() {
        eventItem.remove();
        removeEventFromLocalStorage(event);
    });

    eventItem.appendChild(eventContent);
    eventItem.appendChild(deleteIcon);

    priorityBox.appendChild(eventItem);
}


function savePriorityEvent(event) {
    // Get existing priority events from localStorage
    let priorityEvents = JSON.parse(localStorage.getItem('priorityEvents')) || [];
    
    // Add the event to the array
    priorityEvents.push(event);
    
    // Save updated priority events array back to localStorage
    localStorage.setItem('priorityEvents', JSON.stringify(priorityEvents));
}


function removeEventFromLocalStorage(event) {
    // Get the existing priority events from localStorage
    let priorityEvents = JSON.parse(localStorage.getItem('priorityEvents')) || [];
    
    // Remove the event from the array
    priorityEvents = priorityEvents.filter(storedEvent => storedEvent.start.dateTime !== event.start.dateTime);
    
    // Save the updated array back to localStorage
    localStorage.setItem('priorityEvents', JSON.stringify(priorityEvents));
}

function loadPriorityEvents() {
    // Get the saved priority events from localStorage
    let priorityEvents = JSON.parse(localStorage.getItem('priorityEvents')) || [];

    // For each saved priority event, add it to the priority box
    priorityEvents.forEach(event => {
        addEventToPriorityBox(event);
    });
}



function getCurrentWeekDates() {
    const today = new Date();
    const startOfWeek = today.getDate() - today.getDay(); 
    const weekDates = [];

    for (let i = 0; i < 7; i++) {
        const day = new Date(today.setDate(startOfWeek + i));
        weekDates.push(day); 
    }
    return weekDates;
}


function updateCalendar() {
    const weekDates = getCurrentWeekDates();
    const boxes = document.querySelectorAll('.rectangle-box');

    boxes.forEach((box, index) => {
        const dayDate = weekDates[index];
        const dayName = dayDate.toLocaleString('en-US', { weekday: 'long' });
        const monthName = dayDate.toLocaleString('en-US', { month: 'long' });
        const dateString = `${monthName} ${dayDate.getDate()}`;

        // Clear the box content before adding new elements
        box.innerHTML = `<h1>${dateString}</h1><div class="day-name">${dayName}</div>`;

        // Add the Add Event button
        const addButton = document.createElement('button');
        addButton.classList.add('add-event-button');
        addButton.innerText = 'Add Event';
        box.appendChild(addButton);

        addButton.addEventListener('click', () => {
            openModal(index);
        });
    });
}

let selectedDayIndex = null;

document.querySelectorAll('.add-event-button').forEach((button, index) => {
    button.addEventListener('click', () => {
        openModal(index);
    });
});

// Open modal and set date dynamically based on the clicked day
function openModal(dayIndex) {
    selectedDayIndex = dayIndex;
    const modal = document.getElementById('eventModal');
    const closeButton = document.getElementById('closeModalButton');
    const eventDescriptionInput = document.getElementById('eventDescription');
    const eventDateModal = document.getElementById('eventDateModal');
    const eventTimeInput = document.getElementById('eventTimeModal');
    const priorityCheckbox = document.getElementById('priorityCheckbox');
    
    const weekDates = getCurrentWeekDates();
    const selectedDate = weekDates[dayIndex];

    // Format the selected date as MM/DD/YYYY
    const formattedDate = `${selectedDate.getFullYear()}-${(selectedDate.getMonth() + 1).toString().padStart(2, '0')}-${selectedDate.getDate().toString().padStart(2, '0')}`;

    eventDateModal.value = formattedDate; 
    eventDateModal.disabled = true;

    // Reset input fields
    eventDescriptionInput.value = '';
    eventTimeInput.value = '';
    priorityCheckbox.checked = false;

    modal.style.display = 'block';

    // Close modal when "Close" button is clicked
    closeButton.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // Close modal if clicked outside the modal content
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Remove any previously attached event listeners before adding a new one
    const submitButton = document.getElementById('submitEventButton');
    const newSubmitButton = submitButton.cloneNode(true);
    submitButton.parentNode.replaceChild(newSubmitButton, submitButton);

    // Attach the submit event handler for adding the event
    newSubmitButton.addEventListener('click', function() {
        addEventModal(); 
    });
}

window.onload = function() {
    updateCalendar(); 
    if (gapi.client.getToken() !== null) {
        listUpcomingEvents(); 
    }
};