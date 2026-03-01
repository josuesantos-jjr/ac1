'use client';

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import { CRMContact } from '../../backend/service/crmDataService';

interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  status: string;
  attendees?: Array<{ email: string; displayName?: string }>;
  location?: string;
  htmlLink?: string;
  crmContact?: CRMContact;
}

interface CrmCalendarViewProps {
  contacts: CRMContact[];
  onUpdateContact?: (contact: CRMContact) => void;
}

const CrmCalendarView: React.FC<CrmCalendarViewProps> = ({ contacts, onUpdateContact }) => {
  const [calendars, setCalendars] = useState<any[]>([]);
  const [selectedCalendar, setSelectedCalendar] = useState<string>('');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [calendarMode, setCalendarMode] = useState<'crm' | 'google'>('crm');

  const [currentDate, setCurrentDate] = useState(new Date());
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [googleAuth, setGoogleAuth] = useState({ authenticated: false });
  const calendarRef = useRef<any>(null);

  // Carregar calendários e verificar autenticação
  useEffect(() => {
    checkGoogleAuth();
  }, []);

  useEffect(() => {
    if (googleAuth.authenticated) {
      loadCalendars();
    }
  }, [googleAuth]);

  useEffect(() => {
    if (selectedCalendar) {
      loadEvents();
    }
  }, [selectedCalendar]);

  const checkGoogleAuth = async () => {
    try {
      const response = await axios.get('/api/auth/google');
      setGoogleAuth({ authenticated: response.data.authenticated });
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
    }
  };

  const loadCalendars = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/google/calendar?action=list');
      setCalendars(response.data.calendars || []);

      // Selecionar calendário primário automaticamente
      const primaryCalendar = response.data.calendars?.find((cal: any) => cal.primary);
      if (primaryCalendar) {
        setSelectedCalendar(primaryCalendar.id);
      }
    } catch (error) {
      console.error('Erro ao carregar calendários:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEvents = async (startDate?: Date, endDate?: Date) => {
    if (!selectedCalendar) return;

    setLoading(true);
    try {
      let start = startDate || new Date(currentDate);
      let end = endDate || new Date(currentDate);

      if (!startDate) {
        start = new Date(currentDate);
        start.setDate(1);
        end = new Date(currentDate);
        end.setMonth(end.getMonth() + 1);
      }

      const response = await axios.get(
        `/api/google/calendar?action=events&calendarId=${selectedCalendar}&timeMin=${start.toISOString()}&timeMax=${end.toISOString()}`
      );

      // Enriquecer eventos com dados do CRM
      const enrichedEvents = response.data.events?.map((event: any) => {
        const crmContact = findContactByEvent(event);
        return { ...event, crmContact };
      }) || [];

      setEvents(enrichedEvents);
    } catch (error) {
      console.error('Erro ao carregar eventos:', error);
    } finally {
      setLoading(false);
    }
  };

  const findContactByEvent = (event: any): CRMContact | undefined => {
    // Tentar encontrar contato baseado no título do evento ou participantes
    const eventTitle = event.summary?.toLowerCase() || '';
    const attendees = event.attendees || [];

    return contacts.find(contact => {
      const contactName = (contact.nome_identificado || contact.nome || '').toLowerCase();
      const contactEmail = contact.email?.toLowerCase() || '';

      // Verificar se nome do contato está no título
      if (eventTitle.includes(contactName)) return true;

      // Verificar se email do contato está nos participantes
      if (attendees.some((attendee: any) => attendee.email?.toLowerCase() === contactEmail)) return true;

      return false;
    });
  };

  const createEventFromAppointment = async (contact: CRMContact, appointment: any) => {
    if (!selectedCalendar) {
      alert('Selecione um calendário primeiro');
      return;
    }

    try {
      const eventData = {
        summary: `${appointment.tipo_agendamento} - ${contact.nome_identificado || contact.nome || 'Cliente'}`,
        description: `Agendamento identificado automaticamente\nTelefone: ${contact.telefone}\nTipo: ${appointment.tipo_agendamento}\nChat ID: ${contact.chatId}`,
        start: {
          dateTime: appointment.data_hora_agendamento.replace(' ', 'T'),
          timeZone: 'America/Sao_Paulo'
        },
        end: {
          dateTime: new Date(new Date(appointment.data_hora_agendamento.replace(' ', 'T')).getTime() + 60 * 60 * 1000).toISOString(),
          timeZone: 'America/Sao_Paulo'
        },
        location: 'A confirmar',
        attendees: contact.email ? [{ email: contact.email }] : [],
        reminders: {
          useDefault: true
        }
      };

      const response = await axios.post('/api/google/calendar', {
        action: 'create_event',
        calendarId: selectedCalendar,
        eventData
      });

      alert('Evento criado com sucesso no Google Calendar!');
      loadEvents(); // Recarregar eventos

    } catch (error) {
      console.error('Erro ao criar evento:', error);
      alert('Erro ao criar evento no Google Calendar');
    }
  };



  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleDatesSet = (info: any) => {
    setCurrentDate(info.view.currentStart);
    loadEvents(info.view.currentStart, info.view.currentEnd);
  };



  return (
    <div style={{ padding: '20px' }}>
      <h3>📅 Calendário - Google Calendar</h3>

      {!googleAuth.authenticated ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>Conecte-se ao Google para visualizar o calendário</p>
          <p style={{ color: '#666', fontSize: '14px' }}>
            O calendário permitirá visualizar e criar eventos sincronizados com seus contatos do CRM
          </p>
        </div>
      ) : (
        <>
          {/* Modo de visualização: Calendário Próprio vs Google Calendar */}
          <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              onClick={() => setCalendarMode('crm')}
              style={{
                padding: '10px 20px',
                border: '2px solid #007bff',
                background: calendarMode === 'crm' ? '#007bff' : 'white',
                color: calendarMode === 'crm' ? 'white' : '#007bff',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              📅 Calendário CRM
            </button>
            <button
              onClick={() => setCalendarMode('google')}
              style={{
                padding: '10px 20px',
                border: '2px solid #34a853',
                background: calendarMode === 'google' ? '#34a853' : 'white',
                color: calendarMode === 'google' ? 'white' : '#34a853',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              🌐 Google Calendar
            </button>
          </div>

          {calendarMode === 'crm' ? (
            <>
              {/* Controles do calendário CRM */}
              <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <select
                  value={selectedCalendar}
                  onChange={(e) => setSelectedCalendar(e.target.value)}
                  style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                >
                  <option value="">Selecione um calendário</option>
                  {calendars.map(calendar => (
                    <option key={calendar.id} value={calendar.id}>
                      {calendar.name} {calendar.primary ? '(Principal)' : ''}
                    </option>
                  ))}
                </select>


              </div>

              {/* Lista de agendamentos pendentes para sincronização */}
              <div style={{ marginBottom: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '6px' }}>
                <h4>📋 Agendamentos Pendentes de Sincronização</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {contacts.filter(contact =>
                    contact.detalhes_agendamento &&
                    Array.isArray(contact.detalhes_agendamento) &&
                    contact.detalhes_agendamento.some((agendamento: any) => agendamento.status_agendamento === 'pendente')
                  ).map(contact => (
                    <div key={contact.id} style={{ padding: '10px', background: 'white', borderRadius: '4px', border: '1px solid #ddd' }}>
                      <strong>{contact.nome_identificado || contact.nome}</strong>
                      {contact.detalhes_agendamento.map((agendamento: any, index: number) => (
                        agendamento.status_agendamento === 'pendente' && (
                          <div key={index} style={{ marginTop: '5px' }}>
                            <small>{agendamento.tipo_agendamento} - {new Date(agendamento.data_hora_agendamento).toLocaleString('pt-BR')}</small>
                            <button
                              onClick={() => createEventFromAppointment(contact, agendamento)}
                              style={{
                                marginLeft: '10px',
                                padding: '2px 8px',
                                background: '#28a745',
                                color: 'white',
                                border: 'none',
                                borderRadius: '3px',
                                cursor: 'pointer',
                                fontSize: '12px'
                              }}
                            >
                              📅 Criar Evento
                            </button>
                          </div>
                        )
                      ))}
                    </div>
                  ))}
                </div>
                {contacts.filter(contact =>
                  contact.detalhes_agendamento &&
                  Array.isArray(contact.detalhes_agendamento) &&
                  contact.detalhes_agendamento.some((agendamento: any) => agendamento.status_agendamento === 'pendente')
                ).length === 0 && (
                  <p style={{ color: '#666', fontStyle: 'italic' }}>Nenhum agendamento pendente para sincronização</p>
                )}
              </div>

              {/* Visualização do calendário CRM */}
              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>Carregando...</div>
              ) : (
                <FullCalendar
                  plugins={[dayGridPlugin, timeGridPlugin, listPlugin]}
                  headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' }}
                  events={events.map(e => ({
                    id: e.id,
                    title: e.summary,
                    start: e.start.dateTime || e.start.date,
                    end: e.end.dateTime || e.end.date,
                    extendedProps: { crmContact: e.crmContact, ...e }
                  }))}
                  eventClick={(info) => {
                    setSelectedEvent(info.event.extendedProps as CalendarEvent);
                    setShowEventModal(true);
                  }}
                  datesSet={handleDatesSet}
                  locale="pt-br"
                  ref={calendarRef}
                  initialView="dayGridMonth"
                  height="auto"
                  eventClassNames={(arg) => arg.event.extendedProps.crmContact ? ['crm-event'] : []}
                />
              )}
            </>
          ) : (
            /* Google Calendar Embed */
            <div style={{ width: '100%', height: '600px', border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
              <iframe
                src="https://calendar.google.com/calendar/embed?height=600&wkst=1&bgcolor=%23ffffff&ctz=America%2FSao_Paulo&showTitle=1&showNav=1&showDate=1&showPrint=0&showTabs=1&showCalendars=0"
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  borderRadius: '8px'
                }}
                title="Google Calendar"
              ></iframe>
              <div style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: 'rgba(255,255,255,0.9)',
                padding: '8px 12px',
                borderRadius: '4px',
                fontSize: '12px',
                color: '#666'
              }}>
                🔗 Visualização do Google Calendar
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal de detalhes do evento */}
      {showEventModal && selectedEvent && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '8px',
            padding: '20px',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h3>{selectedEvent.summary}</h3>
            {selectedEvent.description && (
              <p style={{ marginBottom: '10px', whiteSpace: 'pre-wrap' }}>{selectedEvent.description}</p>
            )}
            <p><strong>Início:</strong> {selectedEvent.start.dateTime ? new Date(selectedEvent.start.dateTime).toLocaleString('pt-BR') : selectedEvent.start.date}</p>
            <p><strong>Fim:</strong> {selectedEvent.end.dateTime ? new Date(selectedEvent.end.dateTime).toLocaleString('pt-BR') : selectedEvent.end.date}</p>
            {selectedEvent.location && <p><strong>Local:</strong> {selectedEvent.location}</p>}
            {selectedEvent.crmContact && (
              <div style={{ marginTop: '15px', padding: '10px', background: '#e3f2fd', borderRadius: '4px' }}>
                <strong>Contato do CRM:</strong> {selectedEvent.crmContact.nome_identificado || selectedEvent.crmContact.nome}
                <br />
                <strong>Telefone:</strong> {selectedEvent.crmContact.telefone}
              </div>
            )}
            {selectedEvent.htmlLink && (
              <a href={selectedEvent.htmlLink} target="_blank" rel="noopener noreferrer" style={{ color: '#007bff' }}>
                Abrir no Google Calendar
              </a>
            )}
            <button
              onClick={() => setShowEventModal(false)}
              style={{
                marginTop: '15px',
                padding: '8px 16px',
                background: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .calendar-grid {
          border: 1px solid #ddd;
          border-radius: 8px;
          overflow: hidden;
        }

        .calendar-header {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          background: #f8f9fa;
          border-bottom: 1px solid #ddd;
        }

        .calendar-day-header {
          padding: 10px;
          text-align: center;
          font-weight: bold;
          color: #666;
        }

        .calendar-week {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
        }

        .calendar-day {
          min-height: 120px;
          padding: 5px;
          border-right: 1px solid #eee;
          border-bottom: 1px solid #eee;
          position: relative;
        }

        .calendar-day.other-month {
          background: #f8f9fa;
          color: #ccc;
        }

        .calendar-day.today {
          background: #fff3cd;
        }

        .day-number {
          font-weight: bold;
          margin-bottom: 5px;
        }

        .day-events {
          font-size: 12px;
        }

        .event-item {
          background: #007bff;
          color: white;
          padding: 2px 4px;
          margin-bottom: 2px;
          border-radius: 2px;
          cursor: pointer;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .event-item.crm-event {
          background: #28a745;
        }

        .event-item:hover {
          opacity: 0.8;
        }

        .more-events {
          font-size: 10px;
          color: #666;
          margin-top: 2px;
        }

        .crm-event {
          background-color: #28a745 !important;
          color: white !important;
        }
      `}</style>
    </div>
  );
};

export default CrmCalendarView;