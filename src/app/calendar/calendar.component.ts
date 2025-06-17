import {Component, OnInit} from '@angular/core';
import { Subject } from 'rxjs';
import { CalendarEvent, CalendarView, CalendarEventTimesChangedEvent } from 'angular-calendar';
import {
  startOfDay, endOfDay, subDays, addDays, endOfMonth,
  isSameDay, isSameMonth, addHours, setHours, setMinutes,
  getDay
} from 'date-fns';
import { MonthViewDay } from 'calendar-utils';
import {AppointmentService} from '../../services/appointment.service';
import {Appointment} from '../../models/appointment/appointment.model';
import {TimeSlot} from '../../models/TimeSlot/time-slot.model';
import {Provider} from '../../models/Provider/provider.model';

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
  `]
})
export class CalendarComponent implements OnInit {
  view: CalendarView = CalendarView.Month;
  CalendarView = CalendarView;
  viewDate: Date = new Date();
  refresh = new Subject<void>();
  today = startOfDay(new Date());

  // Calendar events
  events: CalendarEvent[] = [];

  // Data from backend
  appointments: Appointment[] = [];
  providers: Provider[] = [];
  timeSlots: TimeSlot[] = [];

  // Modal controls
  showModal: boolean = false;
  selectedDate: Date = new Date();

  // Form data
  appointmentForm: AppointmentFormData = {
    providerId: 0,
    date: new Date(),
    time: '09:00',
    reason: '',
    notes: ''
  };

  activeDayIsOpen: boolean = false;

  // Track selected provider's available times
  selectedProviderTimes: string[] = [];

  isLoading: boolean = false;

  constructor(private appointmentService: AppointmentService) { }

  ngOnInit(): void {
    // Initialize with some data
    this.loadInitialData();
  }

  loadInitialData(): void {
    this.isLoading = true;

    // Load both appointments and providers
    Promise.all([
      this.appointmentService.getAppointments().toPromise(),
      this.appointmentService.getProviders().toPromise()
    ]).then(([appointments, providers]) => {
      this.appointments = appointments || [];
      this.providers = providers || [];
      this.transformAppointmentsToEvents();
      this.isLoading = false;
      this.refresh.next();
    }).catch(error => {
      console.error('Error loading initial data:', error);
      this.isLoading = false;
    });
  }

  private formatAppointmentTitle(appointment: Appointment): string {
    const time = new Date(appointment.AptDateTime).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    return `${time} - ${appointment.Provider}${appointment.ProcDescript ? ': ' + appointment.ProcDescript : ''}`;
  }

  private transformAppointmentsToEvents(): void {
    this.events = this.appointments.map(appointment => {
      const startDate = new Date(appointment.AptDateTime);
      let endDate: Date;

      // Calculate end date based on Duration
      if (appointment.Duration) {
        const duration = new Date(appointment.Duration);
        // Assuming Duration is stored as a time value (e.g., "01:30:00" for 1.5 hours)
        const durationMs = duration.getHours() * 60 * 60 * 1000 +
          duration.getMinutes() * 60 * 1000 +
          duration.getSeconds() * 1000;
        endDate = new Date(startDate.getTime() + durationMs);
      } else {
        // Default to 1 hour if no duration specified
        endDate = addHours(startDate, 1);
      }

      return {
        id: appointment.AptNum,
        title: this.formatAppointmentTitle(appointment),
        start: startDate,
        end: endDate,
        color: this.getAppointmentColor(appointment),
        meta: {
          appointment: appointment,
          type: 'appointment'
        },
        draggable: false,
        resizable: {
          beforeStart: false,
          afterEnd: false
        }
      } as CalendarEvent;
    });
  }

  private getAppointmentColor(appointment: Appointment): any {
    // You can customize colors based on appointment properties
    if (appointment.IsNewPatient === 'Y') {
      return { primary: '#3b82f6', secondary: '#dbeafe' }; // Blue for new patients
    }

    switch (appointment.Priority?.toLowerCase()) {
      case 'high':
        return { primary: '#ef4444', secondary: '#fecaca' }; // Red for high priority
      case 'medium':
        return { primary: '#f59e0b', secondary: '#fef3c7' }; // Yellow for medium priority
      default:
        return { primary: '#10b981', secondary: '#d1fae5' }; // Green for normal
    }
  }

  loadAppointments(): void {
    this.appointmentService.getAppointments().subscribe({
      next: (appointments: Appointment[]) => {
        this.appointments = appointments;
        this.transformAppointmentsToEvents();
        this.refresh.next();
      },
      error: (error) => {
        console.error('Error loading appointments:', error);
      }
    });
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
    const selectedProvider = this.providers.find(p => p.ProvNum === +providerId);
    if (selectedProvider) {
      // Load available time slots for this provider
      this.loadProviderTimeSlots(selectedProvider.ProvNum);
    } else {
      this.selectedProviderTimes = [];
      this.appointmentForm.time = '';
    }
  }

  private loadProviderTimeSlots(providerNum: number): void {
    // Load time slots from backend
    this.appointmentService.getTimeSlots(providerNum, this.selectedDate).subscribe({
      next: (timeSlots: TimeSlot[]) => {
        // Convert time slots to time strings
        this.selectedProviderTimes = timeSlots.map(slot => {
          const startTime = new Date(slot.DateTimeStart);
          const hours = startTime.getHours().toString().padStart(2, '0');
          const minutes = startTime.getMinutes().toString().padStart(2, '0');
          return `${hours}:${minutes}`;
        });

        // Filter out booked times
        this.filterBookedTimes(providerNum);

        // Default to first available time if any are left
        this.appointmentForm.time = this.selectedProviderTimes.length > 0 ?
          this.selectedProviderTimes[0] : '';
      },
      error: (error: any) => {
        console.error('Error loading time slots:', error);
        // Fallback to default times
        this.selectedProviderTimes = [
          '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
          '11:00', '11:30', '13:00', '13:30', '14:00', '14:30',
          '15:00', '15:30', '16:00', '16:30', '17:00'
        ];
        this.filterBookedTimes(providerNum);
        this.appointmentForm.time = this.selectedProviderTimes.length > 0 ?
          this.selectedProviderTimes[0] : '';
      }
    });
  }

  filterBookedTimes(providerId: number): void {
    // Get the date for comparison (ignoring time)
    const selectedDateStart = startOfDay(this.selectedDate);
    const selectedDateEnd = endOfDay(this.selectedDate);

    // Find events for this provider on the selected date
    const bookedAppointments = this.events.filter(event => {
      return event.start >= selectedDateStart &&
        event.start <= selectedDateEnd &&
        event.title.includes(this.providers.find(p => p.ProvNum === providerId)?.FName || '');
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

  handleEventClick(event: CalendarEvent): void {
    if (event.meta?.appointment) {
      const appointment = event.meta.appointment as Appointment;
      console.log('Appointment clicked:', appointment);
      // You can open a detail modal or navigate to appointment details
      // this.openAppointmentDetails(appointment);
    }
  }

  refreshAppointments(): void {
    this.loadAppointments();
  }
}
