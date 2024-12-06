async function addEvent() {
    const summary = document.getElementById('eventSummary').value;
    const date = document.getElementById('eventDate').value;
    const time = document.getElementById('eventTime').value;

    const eventDateTime = new Date(`${date}T${time}`).toISOString();

    const event = {
        summary: summary,
        start: {
            dateTime: eventDateTime,
            timeZone: 'America/Los_Angeles', // Update based on your timezone
        },
        end: {
            dateTime: new Date(new Date(eventDateTime).getTime() + 60 * 60 * 1000).toISOString(), // 1-hour duration
            timeZone: 'America/Los_Angeles',
        },
    };

    try {
        const response = await gapi.client.calendar.events.insert({
            calendarId: 'primary',
            resource: event,
        });

        document.getElementById('addEventResult').innerText =
            `Event created: ${response.result.htmlLink}`;
    } catch (err) {
        document.getElementById('addEventResult').innerText =
            `Error creating event: ${err.message}`;
    }
}
