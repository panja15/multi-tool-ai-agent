import { logger } from "../utils/logger.js";
import { getAccessToken } from "../middleware/auth.js";

export async function executeCalendar(args) {
  logger.info("Executing schedule_meeting");

  try {
    const { summary, startTime, endTime } = args;

    const token = await getAccessToken();

    const eventPayload = {
      summary: summary,
      start: { dateTime: startTime, timeZone: "Asia/Kolkata" },
      end: { dateTime: endTime, timeZone: "Asia/Kolkata" },
    };

    const calendarResponse = await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventPayload),
      },
    );

    const calendarData = await calendarResponse.json();

    if (!calendarResponse.ok) {
      throw new Error(`Calendar API Error: ${calendarData.error.message}`);
    }

    return {
      status: "Success",
      agent: "Calendar MCP",
      action: "Meeting Scheduled on LIVE Calendar",
      calendar_link: calendarData.htmlLink,
    };
  } catch (error) {
    logger.error("Failed to execute Calendar Tool", error);
    return {
      error: "Failed to execute Calendar Tool",
      details: error.message,
    };
  }
}

export async function fetchUpcomingEvents(args) {
  logger.info("Executing fetch_upcoming_events");

  try {
    const token = await getAccessToken();
    const maxResults = args.maxResults || 10;
    const timeMin = new Date().toISOString();

    const params = new URLSearchParams({
      timeMin: timeMin,
      maxResults: maxResults.toString(),
      singleEvents: "true",
      orderBy: "startTime",
    });

    const calendarResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    const calendarData = await calendarResponse.json();

    if (!calendarResponse.ok) {
      throw new Error(
        `Calendar API Error: ${calendarData.error?.message || calendarResponse.statusText}`,
      );
    }

    const events = (calendarData.items || []).map((event) => ({
      id: event.id,
      summary: event.summary,
      start: event.start?.dateTime || event.start?.date,
      end: event.end?.dateTime || event.end?.date,
      link: event.htmlLink,
    }));

    return {
      status: "Success",
      events: events,
    };
  } catch (error) {
    logger.error("Failed to execute fetchUpcomingEvents Tool", error);
    return {
      error: "Failed to fetch upcoming events",
      details: error.message,
    };
  }
}
