// src/services/googleCalendarService.ts
import { google } from 'googleapis';
import { getGoogleOAuthClient } from '@/lib/googleOAuth';

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  attendees?: Array<{ email: string; responseStatus?: string }>;
  htmlLink?: string;
  status?: string;
}

export interface CreateEventParams {
  summary: string;
  description?: string;
  startDateTime: string;
  endDateTime: string;
  attendees?: string[];
  location?: string;
  timeZone?: string;
}

export interface UpdateEventParams {
  summary?: string;
  description?: string;
  startDateTime?: string;
  endDateTime?: string;
  location?: string;
  attendees?: string[];
}

export interface SearchEventsParams {
  startDate: string;
  endDate: string;
  query?: string;
  maxResults?: number;
}

export interface AvailabilityParams {
  startDateTime: string;
  endDateTime: string;
  timeZone?: string;
}

export class GoogleCalendarService {
  /**
   * Create a new calendar event
   */
  static async createEvent(userId: string, params: CreateEventParams): Promise<CalendarEvent | null> {
    try {
      const auth = await getGoogleOAuthClient(userId);
      if (!auth) {
        throw new Error('No Google account connected. Please sign in with Google to use Calendar features.');
      }

      const calendar = google.calendar({ version: 'v3', auth });

      const event = {
        summary: params.summary,
        description: params.description,
        location: params.location,
        start: {
          dateTime: params.startDateTime,
          timeZone: params.timeZone || 'UTC',
        },
        end: {
          dateTime: params.endDateTime,
          timeZone: params.timeZone || 'UTC',
        },
        attendees: params.attendees?.map(email => ({ email })),
      };

      const response = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: event,
        sendUpdates: 'all', // Send email notifications to attendees
      });

      return response.data as CalendarEvent;
    } catch (error: any) {
      console.error('Error creating calendar event:', error);
      throw new Error(`Failed to create calendar event: ${error.message}`);
    }
  }

  /**
   * Search for calendar events
   */
  static async searchEvents(userId: string, params: SearchEventsParams): Promise<CalendarEvent[]> {
    try {
      const auth = await getGoogleOAuthClient(userId);
      if (!auth) {
        throw new Error('No Google account connected. Please sign in with Google to use Calendar features.');
      }

      const calendar = google.calendar({ version: 'v3', auth });

      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: params.startDate,
        timeMax: params.endDate,
        q: params.query,
        maxResults: Math.min(params.maxResults || 10, 50),
        singleEvents: true,
        orderBy: 'startTime',
      });

      return (response.data.items || []) as CalendarEvent[];
    } catch (error: any) {
      console.error('Error searching calendar events:', error);
      throw new Error(`Failed to search calendar events: ${error.message}`);
    }
  }

  /**
   * Update an existing calendar event
   */
  static async updateEvent(
    userId: string,
    eventId: string,
    updates: UpdateEventParams
  ): Promise<CalendarEvent | null> {
    try {
      const auth = await getGoogleOAuthClient(userId);
      if (!auth) {
        throw new Error('No Google account connected. Please sign in with Google to use Calendar features.');
      }

      const calendar = google.calendar({ version: 'v3', auth });

      // First, get the existing event
      const existingEvent = await calendar.events.get({
        calendarId: 'primary',
        eventId: eventId,
      });

      // Prepare the updated event
      const updatedEvent: any = {
        ...existingEvent.data,
      };

      if (updates.summary) updatedEvent.summary = updates.summary;
      if (updates.description !== undefined) updatedEvent.description = updates.description;
      if (updates.location !== undefined) updatedEvent.location = updates.location;

      if (updates.startDateTime) {
        updatedEvent.start = {
          dateTime: updates.startDateTime,
          timeZone: updatedEvent.start?.timeZone || 'UTC',
        };
      }

      if (updates.endDateTime) {
        updatedEvent.end = {
          dateTime: updates.endDateTime,
          timeZone: updatedEvent.end?.timeZone || 'UTC',
        };
      }

      if (updates.attendees) {
        updatedEvent.attendees = updates.attendees.map(email => ({ email }));
      }

      const response = await calendar.events.update({
        calendarId: 'primary',
        eventId: eventId,
        requestBody: updatedEvent,
        sendUpdates: 'all',
      });

      return response.data as CalendarEvent;
    } catch (error: any) {
      console.error('Error updating calendar event:', error);
      throw new Error(`Failed to update calendar event: ${error.message}`);
    }
  }

  /**
   * Get calendar availability (free/busy)
   */
  static async getAvailability(userId: string, params: AvailabilityParams) {
    try {
      const auth = await getGoogleOAuthClient(userId);
      if (!auth) {
        throw new Error('No Google account connected. Please sign in with Google to use Calendar features.');
      }

      const calendar = google.calendar({ version: 'v3', auth });

      const response = await calendar.freebusy.query({
        requestBody: {
          timeMin: params.startDateTime,
          timeMax: params.endDateTime,
          timeZone: params.timeZone || 'UTC',
          items: [{ id: 'primary' }],
        },
      });

      const busyTimes = response.data.calendars?.primary?.busy || [];

      // Calculate free times
      const freeTimes: Array<{ start: string; end: string }> = [];
      let currentTime = new Date(params.startDateTime);
      const endTime = new Date(params.endDateTime);

      for (const busy of busyTimes) {
        const busyStart = new Date(busy.start!);
        const busyEnd = new Date(busy.end!);

        if (currentTime < busyStart) {
          freeTimes.push({
            start: currentTime.toISOString(),
            end: busyStart.toISOString(),
          });
        }

        currentTime = busyEnd > currentTime ? busyEnd : currentTime;
      }

      // Add final free period if there's time left
      if (currentTime < endTime) {
        freeTimes.push({
          start: currentTime.toISOString(),
          end: endTime.toISOString(),
        });
      }

      return {
        busyTimes: busyTimes.map(bt => ({
          start: bt.start,
          end: bt.end,
        })),
        freeTimes,
      };
    } catch (error: any) {
      console.error('Error getting calendar availability:', error);
      throw new Error(`Failed to get calendar availability: ${error.message}`);
    }
  }

  /**
   * Delete a calendar event
   */
  static async deleteEvent(userId: string, eventId: string): Promise<boolean> {
    try {
      const auth = await getGoogleOAuthClient(userId);
      if (!auth) {
        throw new Error('No Google account connected. Please sign in with Google to use Calendar features.');
      }

      const calendar = google.calendar({ version: 'v3', auth });

      await calendar.events.delete({
        calendarId: 'primary',
        eventId: eventId,
        sendUpdates: 'all',
      });

      return true;
    } catch (error: any) {
      console.error('Error deleting calendar event:', error);
      throw new Error(`Failed to delete calendar event: ${error.message}`);
    }
  }
}
