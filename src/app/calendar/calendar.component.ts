import { Component, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { CalendarEvent, CalendarView, CalendarEventTimesChangedEvent } from 'angular-calendar';
import {
  startOfDay, endOfDay, subDays, addDays, endOfMonth,
  isSameDay, isSameMonth, addHours, setHours, setMinutes,
  getDay
} from 'date-fns';
import { MonthViewDay } from 'calendar-utils';

interface Provider {
  id: number;
  name: string;
  specialty: string;
  availableTimes: string[];
}

interface AppointmentFormData {
  providerId: number;
  date: Date;
  time: string;
  reason: string;
  notes: string;
}

@Component({
  selector: 'app-calendar',
  standalone: false,
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.css',
  styles: [`
    .day-cell:hover .add-button {
      opacity: 1;
    }
    .past-day {
      opacity: 0.6;
    }
    .cal-event-title {
      color: #1f2937 !important;
    }
    .cal-event {
      cursor: move;
    }
    .cal-event:hover .delete-button {
      opacity: 1;
    }
    .delete-button {
      opacity: 0;
      transition: opacity 0.2s;
    }
  `]
})
export class CalendarComponent implements OnInit {
  view: CalendarView = CalendarView.Month;
  CalendarView = CalendarView;
  viewDate: Date = new Date();
  refresh = new Subject<void>();
  today = startOfDay(new Date());

  // Modal controls
  showModal: boolean = false;
  showDeleteConfirm: boolean = false;
  selectedDate: Date = new Date();
  eventToDelete: CalendarEvent | null = null;

  // Form data
  appointmentForm: AppointmentFormData = {
    providerId: 0,
    date: new Date(),
    time: '09:00',
    reason: '',
    notes: ''
  };

  // Available times (typically would come from API based on provider availability)
  availableTimes: string[] = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
  ];

  // Mock providers data (would typically come from API)
  providers: Provider[] = [
    {
      id: 1,
      name: 'Dr. Sarah Johnson',
      specialty: 'Endodontist',
      availableTimes: ['09:00', '10:30', '13:00', '15:30']
    },
    {
      id: 2,
      name: 'Dr. Michael Chen',
      specialty: 'Dentist',
      availableTimes: ['08:30', '11:00', '14:00', '16:00']
    },
    {
      id: 3,
      name: 'Dr. Emily Rodriguez',
      specialty: 'Dentist',
      availableTimes: ['08:00', '09:30', '13:30', '15:00']
    }
  ];

  // Mock appointments data (would typically come from API)
  events: CalendarEvent[] = [
    {
      id: 1,
      start: setHours(setMinutes(startOfDay(new Date()), 30), 9),
      end: setHours(setMinutes(startOfDay(new Date()), 0), 10),
      title: 'Annual Check-up with Dr. Johnson',
      color: {
        primary: '#0ea5e9',
        secondary: '#e0f2fe',
        secondaryText: '#000000'
      },
      draggable: true,
      resizable: {
        beforeStart: false,
        afterEnd: false
      }
    },
    {
      id: 2,
      start: setHours(setMinutes(addDays(startOfDay(new Date()), 1), 0), 14),
      end: setHours(setMinutes(addDays(startOfDay(new Date()), 1), 30), 14),
      title: 'Endo with Dr. Chen',
      color: {
        primary: '#8b5cf6',
        secondary: '#ede9fe',
        secondaryText: '#000000'
      },
      draggable: true,
      resizable: {
        beforeStart: false,
        afterEnd: false
      }
    },
    {
      id: 3,
      start: setHours(setMinutes(addDays(startOfDay(new Date()), 5), 30), 10),
      end: setHours(setMinutes(addDays(startOfDay(new Date()), 5), 0), 11),
      title: 'Follow-up with Dr. Rodriguez',
      color: {
        primary: '#10b981',
        secondary: '#d1fae5',
        secondaryText: '#000000'
      },
      draggable: true,
      resizable: {
        beforeStart: false,
        afterEnd: false
      }
    }
  ];

  activeDayIsOpen: boolean = false;

  // Track selected provider's available times
  selectedProviderTimes: string[] = [];

  constructor() { }

  ngOnInit(): void {
    // Initialize with some data
    this.loadAppointments();
  }

  loadAppointments(): void {
    // In a real app, this would fetch data from an API
    // The mock data is already loaded in the events array
  }

  dayClicked({ day, sourceEvent }: { day: MonthViewDay; sourceEvent: MouseEvent | KeyboardEvent }): void {
    if (isSameMonth(day.date, this.viewDate)) {
      this.activeDayIsOpen = !((isSameDay(this.viewDate, day.date) && this.activeDayIsOpen) ||
        day.events.length === 0);
      this.viewDate = day.date;

      // Store selected date for appointment creation
      this.selectedDate = day.date;
    }
  }

  setView(view: CalendarView): void {
    this.view = view;
  }

  closeOpenMonthViewDay(): void {
    this.activeDayIsOpen = false;
  }

  // Method to check if a date is today or in the future
  isDateAvailable(date: Date): boolean {
    return startOfDay(date) >= this.today;
  }

  // Method to check if a date is a weekend (Saturday = 6, Sunday = 0)
  isWeekend(date: Date): boolean {
    const day = getDay(date);
    return day === 0 || day === 6;
  }

  // New method to check if a day is currently expanded
  isDayExpanded(date: Date): boolean {
    return this.activeDayIsOpen && isSameDay(date, this.viewDate);
  }

  openAppointmentModal(date: Date): void {
    this.selectedDate = date;
    this.appointmentForm.date = date;
    this.appointmentForm.providerId = 0; // Reset provider selection
    this.appointmentForm.time = '';      // Reset time selection
    this.appointmentForm.reason = '';    // Reset reason
    this.appointmentForm.notes = '';     // Reset notes
    this.selectedProviderTimes = [];     // Reset available times
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  onProviderChange(providerId: number): void {
    const selectedProvider = this.providers.find(p => p.id === +providerId);
    if (selectedProvider) {
      this.selectedProviderTimes = [...selectedProvider.availableTimes];

      // Remove times that are already booked for this provider on this day
      this.filterBookedTimes(selectedProvider.id);

      // Default to first available time if any are left
      this.appointmentForm.time = this.selectedProviderTimes.length > 0 ?
        this.selectedProviderTimes[0] : '';
    } else {
      this.selectedProviderTimes = [];
      this.appointmentForm.time = '';
    }
  }

  filterBookedTimes(providerId: number): void {
    // Get the date for comparison (ignoring time)
    const selectedDateStart = startOfDay(this.selectedDate);
    const selectedDateEnd = endOfDay(this.selectedDate);

    // Find events for this provider on the selected date
    const bookedAppointments = this.events.filter(event => {
      return event.start >= selectedDateStart &&
        event.start <= selectedDateEnd &&
        event.title.includes(this.providers.find(p => p.id === providerId)?.name || '');
    });

    // Remove booked times from available times
    bookedAppointments.forEach(appointment => {
      const bookedHour = appointment.start.getHours().toString().padStart(2, '0');
      const bookedMinute = appointment.start.getMinutes().toString().padStart(2, '0');
      const bookedTime = `${bookedHour}:${bookedMinute}`;

      const index = this.selectedProviderTimes.indexOf(bookedTime);
      if (index !== -1) {
        this.selectedProviderTimes.splice(index, 1);
      }
    });
  }

  createAppointment(): void {
    if (!this.appointmentForm.providerId || !this.appointmentForm.time) {
      alert('Please select a provider and time');
      return;
    }

    // Find the selected provider
    const provider = this.providers.find(p => p.id === this.appointmentForm.providerId);
    if (!provider) return;

    // Parse the time string
    const [hours, minutes] = this.appointmentForm.time.split(':').map(Number);

    // Create the appointment date by combining selected date with selected time
    const appointmentDate = new Date(this.selectedDate);
    appointmentDate.setHours(hours, minutes, 0);

    // Create end time (30-minute appointments)
    const endTime = new Date(appointmentDate);
    endTime.setMinutes(endTime.getMinutes() + 30);

    // Choose a color based on provider
    let colorScheme = {
      primary: '#0ea5e9',
      secondary: '#e0f2fe',
      secondaryText: '#000000'
    };

    // Assign different colors based on provider
    if (provider.id === 1) {
      colorScheme = {
        primary: '#0ea5e9', // blue
        secondary: '#e0f2fe',
        secondaryText: '#000000'
      };
    } else if (provider.id === 2) {
      colorScheme = {
        primary: '#8b5cf6', // purple
        secondary: '#ede9fe',
        secondaryText: '#000000'
      };
    } else if (provider.id === 3) {
      colorScheme = {
        primary: '#10b981', // green
        secondary: '#d1fae5',
        secondaryText: '#000000'
      };
    }

    // Generate unique ID for the new appointment
    const newId = Math.max(...this.events.map(e => Number(e.id) || 0)) + 1;

    // Create the new appointment event
    const newAppointment: CalendarEvent = {
      id: newId,
      start: appointmentDate,
      end: endTime,
      title: `${this.appointmentForm.reason || 'Appointment'} with ${provider.name}`,
      color: colorScheme,
      draggable: true,
      resizable: {
        beforeStart: false,
        afterEnd: false
      }
    };

    // Add to events array
    this.events = [...this.events, newAppointment];

    // Force refresh the calendar view
    this.refresh.next();

    // Show confirmation
    alert('Appointment created successfully!');

    // Close the modal
    this.closeModal();

    // Reset form
    this.appointmentForm = {
      providerId: 0,
      date: new Date(),
      time: '09:00',
      reason: '',
      notes: ''
    };
  }

  // Handle event time changes (drag and drop)
  eventTimesChanged({
                      event,
                      newStart,
                      newEnd,
                    }: CalendarEventTimesChangedEvent): void {
    // Check if the new date is valid (not in the past, not on weekend)
    if (!this.isDateAvailable(newStart) || this.isWeekend(newStart)) {
      alert('Cannot schedule appointments in the past or on weekends');
      return;
    }

    // Check if the new time slot is available
    if (!this.isTimeSlotAvailable(newStart, event.id)) {
      alert('This time slot is not available');
      return;
    }

    // Update the event
    const updatedEvents = this.events.map(e => {
      if (e.id === event.id) {
        return {
          ...e,
          start: newStart,
          end: newEnd || new Date(newStart.getTime() + 30 * 60000) // 30 minutes default
        };
      }
      return e;
    });

    this.events = updatedEvents;
    this.refresh.next();
  }

  // Check if a time slot is available (no conflicting appointments)
  isTimeSlotAvailable(newStart: Date, eventId?: string | number): boolean {
    const newEnd = new Date(newStart.getTime() + 30 * 60000); // 30 minutes

    return !this.events.some(event => {
      // Skip the event being moved
      if (event.id === eventId) return false;

      // Check for overlap
      // @ts-ignore
      return (newStart < event.end && newEnd > event.start);
    });
  }

  // Handle event click to show delete option
  handleEvent(action: string, event: CalendarEvent): void {
    if (action === 'Clicked') {
      this.eventToDelete = event;
      this.showDeleteConfirm = true;
    }
  }

  // Confirm deletion
  confirmDelete(): void {
    if (this.eventToDelete) {
      this.events = this.events.filter(event => event.id !== this.eventToDelete!.id);
      this.refresh.next();
      this.showDeleteConfirm = false;
      this.eventToDelete = null;
      alert('Appointment deleted successfully!');
    }
  }

  // Cancel deletion
  cancelDelete(): void {
    this.showDeleteConfirm = false;
    this.eventToDelete = null;
  }

  // Quick delete method for delete button on events
  deleteEvent(event: CalendarEvent, $event: Event): void {
    $event.stopPropagation();
    this.eventToDelete = event;
    this.showDeleteConfirm = true;
  }
}
