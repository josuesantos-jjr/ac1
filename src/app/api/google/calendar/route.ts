import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { googleSheetsAuth } from '../../../../backend/service/googleSheetsAuth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const calendarId = searchParams.get('calendarId');
    const timeMin = searchParams.get('timeMin');
    const timeMax = searchParams.get('timeMax');

    if (!googleSheetsAuth.isAuthenticated()) {
      return NextResponse.json({
        error: 'Usuário não autenticado',
        authenticated: false
      }, { status: 401 });
    }

    const calendar = await googleSheetsAuth.getCalendarClient();

    if (action === 'list') {
      // Listar calendários do usuário
      const response = await calendar.calendarList.list();
      const calendars = response.data.items?.map(cal => ({
        id: cal.id,
        name: cal.summary,
        primary: cal.primary || false,
        backgroundColor: cal.backgroundColor,
        accessRole: cal.accessRole
      })) || [];

      return NextResponse.json({
        calendars,
        authenticated: true
      });
    }

    if (action === 'events' && calendarId) {
      // Listar eventos de um calendário
      const params: any = {
        calendarId,
        singleEvents: true,
        orderBy: 'startTime'
      };

      if (timeMin) params.timeMin = timeMin;
      if (timeMax) params.timeMax = timeMax;

      const response = await calendar.events.list(params);
      const events = response.data.items?.map(event => ({
        id: event.id,
        summary: event.summary,
        description: event.description,
        start: event.start,
        end: event.end,
        status: event.status,
        attendees: event.attendees,
        location: event.location,
        created: event.created,
        updated: event.updated
      })) || [];

      return NextResponse.json({
        events,
        authenticated: true
      });
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });

  } catch (error) {
    console.error('Erro na API do Google Calendar:', error);
    return NextResponse.json({
      error: 'Erro na API do Google Calendar',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, calendarId, eventData } = await request.json();

    if (!googleSheetsAuth.isAuthenticated()) {
      return NextResponse.json({
        error: 'Usuário não autenticado',
        authenticated: false
      }, { status: 401 });
    }

    const calendar = await googleSheetsAuth.getCalendarClient();

    if (action === 'create_event') {
      if (!eventData || !calendarId) {
        return NextResponse.json({
          error: 'Dados do evento e ID do calendário são obrigatórios'
        }, { status: 400 });
      }

      // Criar evento no Google Calendar
      const event = {
        summary: eventData.summary,
        description: eventData.description,
        start: eventData.start,
        end: eventData.end,
        location: eventData.location,
        attendees: eventData.attendees,
        reminders: eventData.reminders || {
          useDefault: true
        }
      };

      const response = await calendar.events.insert({
        calendarId,
        requestBody: event
      });

      return NextResponse.json({
        event: {
          id: response.data.id,
          summary: response.data.summary,
          start: response.data.start,
          end: response.data.end,
          htmlLink: response.data.htmlLink,
          status: response.data.status
        },
        authenticated: true
      });
    }

    if (action === 'update_event') {
      if (!eventData || !eventData.id || !calendarId) {
        return NextResponse.json({
          error: 'ID do evento, dados do evento e ID do calendário são obrigatórios'
        }, { status: 400 });
      }

      const response = await calendar.events.update({
        calendarId,
        eventId: eventData.id,
        requestBody: eventData
      });

      return NextResponse.json({
        event: {
          id: response.data.id,
          summary: response.data.summary,
          start: response.data.start,
          end: response.data.end,
          htmlLink: response.data.htmlLink,
          status: response.data.status
        },
        authenticated: true
      });
    }

    if (action === 'delete_event') {
      const eventId = await request.json().then(data => data.eventId);

      if (!eventId || !calendarId) {
        return NextResponse.json({
          error: 'ID do evento e ID do calendário são obrigatórios'
        }, { status: 400 });
      }

      await calendar.events.delete({
        calendarId,
        eventId
      });

      return NextResponse.json({
        success: true,
        message: 'Evento excluído com sucesso',
        authenticated: true
      });
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });

  } catch (error) {
    console.error('Erro na API do Google Calendar (POST):', error);
    return NextResponse.json({
      error: 'Erro na API do Google Calendar',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}