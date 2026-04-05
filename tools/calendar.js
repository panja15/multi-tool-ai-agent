import { logger } from "../utils/logger.js";

export async function executeCalendar(args) {
  logger.info("Executing schedule_meeting");

  try {
    const { summary, startTime, endTime } = args;
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
          Authorization: `Bearer ${process.env.GOOGLE_API_ACCESS_TOKEN}`,
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
