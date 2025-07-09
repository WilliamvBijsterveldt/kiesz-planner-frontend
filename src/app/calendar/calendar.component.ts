import {Component, OnInit} from '@angular/core';
import {Subject} from 'rxjs';
import {CalendarEvent, CalendarEventTimesChangedEvent, CalendarView} from 'angular-calendar';
import {getDay, isSameDay, isSameMonth, startOfDay} from 'date-fns';
import {MonthViewDay} from 'calendar-utils';
import {AppointmentService} from '../../services/appointment.service';
import {Provider} from '../../models/Provider/provider.model';
import {Appointment} from '../../models/appointment/appointment.model';
import {TimeSlot} from '../../models/TimeSlot/time-slot.model';

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

  providers: Provider[] = [];
  providerTimeSlots: TimeSlot[] = [];
  selectedTimeSlot: TimeSlot | null = null;
  events: CalendarEvent[] = [];
  selectedProviderTimes: string[] = [];
  activeDayIsOpen: boolean = false;

  constructor(private appointmentService: AppointmentService) { }

  ngOnInit(): void {
    // Initialize with some data
    this.appointmentService.getProviders().subscribe(data => {
      this.providers = data;
      console.log(data);
    });

      this.loadAppointments();
  }
  // Modal controls
  showModal: boolean = false;
  showDeleteConfirm: boolean = false;
  selectedDate: Date = new Date();
  eventToDelete: CalendarEvent | null = null;

  appointmentForm: Appointment = new Appointment();


  // Time slots function for live data
  /*getProviderTimeSlots(provNum: number, date: Date): void {
    this.appointmentService.getTimeSlots(provNum, date).subscribe((slots: TimeSlot[]) => {
      this.providerTimeSlots = slots;

      // Optional: also extract formatted times for display
      this.selectedProviderTimes = slots.map(slot =>
        new Date(slot.dateTimeStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      );
    });
  }*/

  // Providers currently have no time slots as they do not have schedules, for demo purposes the time slots are hardcoded.
  getProviderTimeSlots(provNum: number, date: Date): void {
    const startHour = 9; // 9 AM
    const endHour = 17;  // 5 PM
    const slotDurationMinutes = 30;

    const slots: TimeSlot[] = [];

    for (let hour = startHour; hour < endHour; hour++) {
      const start = new Date(date);
      start.setHours(hour, 0, 0, 0);

      const end = new Date(start);
      end.setMinutes(start.getMinutes() + slotDurationMinutes);

      slots.push({
        dateTimeStart: start,
        dateTimeEnd: end
      });
    }

    this.providerTimeSlots = slots;

    this.selectedProviderTimes = slots.map(slot =>
      new Date(slot.dateTimeStart).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      })
    );
  }

  /*getDurationInMinutes(duration: string): number {
    const [hours, minutes, seconds] = duration.split(':').map(Number);
    return hours * 60 + minutes + Math.floor(seconds / 60);
  }
*/

  loadAppointments(): void {
    this.appointmentService.getAppointments().subscribe((appointments: Appointment[]) => {
      this.events = appointments.map(apt => {
        const start = new Date(apt.aptDateTime);
        /*const durationInMinutes = this.getDurationInMinutes(apt.Duration);*/
        const end = new Date(start.getTime() + 30 * 60 * 1000);
        console.log(apt);

        return {
          id: apt.aptNum,
          start,
          end,
          title: `${apt.procDescript} with ${apt.provider}`,
          color: {
            primary: '#0ea5e9',
            secondary: '#e0f2fe',
            secondaryText: '#000000'
          },
          draggable: true,
          resizable: {
            beforeStart: false,
            afterEnd: false
          },
          meta: apt
        };
      });
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
    this.appointmentForm = new Appointment(); // or reset fields manually
    this.appointmentForm.aptDateTime = date;
    this.selectedTimeSlot = null;
    this.providerTimeSlots = [];
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  onProviderChange(provNum: number): void {
    if (!provNum || !this.selectedDate) return;

    /*this.appointmentService.getTimeSlots(providerId, this.selectedDate).subscribe((slots: TimeSlot[]) => {
      this.providerTimeSlots = slots;
    });*/

    this.getProviderTimeSlots(provNum, this.selectedDate);
  }


  createAppointment(): void {
    if (!this.appointmentForm.provNum|| !this.selectedTimeSlot) {
      alert('Please select a provider and time slot');
      return;
    }

    const provider = this.providers.find(p => p.provNum === this.appointmentForm.provNum);
    if (!provider) return;

    const appointment = new Appointment();
    appointment.aptDateTime = this.selectedTimeSlot.dateTimeStart;
    appointment.duration = 'XXXXXX';
    appointment.procDescript = this.appointmentForm.procDescript;
    appointment.provider = provider.lName;
    appointment.patNum = 22;
    appointment.op = 1;

    this.appointmentService.createAppointment(appointment).subscribe(() => {
      alert('Appointment created successfully!');
      this.loadAppointments(); // Refresh calendar events
      this.closeModal();
    });
  }

  // Handle event time changes (drag and drop)
  eventTimesChanged({
                      event,
                      newStart,
                      newEnd,
                    }: CalendarEventTimesChangedEvent): void {
    if (!this.isDateAvailable(newStart) || this.isWeekend(newStart)) {
      alert('Cannot schedule appointments in the past or on weekends');
      return;
    }

    const appointment = event.meta as Appointment;
    appointment.aptDateTime = new Date(newStart.getTime() - newStart.getTimezoneOffset() * 60000);
    appointment.duration = '30'; // or keep original if dynamic

    this.appointmentService.updateAppointment(appointment).subscribe(() => {
      alert('Appointment updated!');
      this.loadAppointments(); // Refresh from backend
      this.refresh.next();
    });
  }

  // Handle event click to show delete option
  // There is no actual delete functionality in the backend as Open Dental has no API for deleting appointments.
  handleEvent(action: string, event: CalendarEvent): void {
    console.log('event clicked:', event)
    if (action === 'Clicked') {
      this.eventToDelete = event;
      this.showDeleteConfirm = true;
      console.log('showDeleteConfirm set to:', this.showDeleteConfirm);
    }
  }

  // Confirm deletion
  confirmDelete(): void {
    if (!this.eventToDelete) return;

    const appointment = this.eventToDelete.meta as Appointment;

    this.appointmentService.deleteAppointment(appointment).subscribe(() => {
      alert('Appointment deleted successfully!');
      this.loadAppointments();
      this.showDeleteConfirm = false;
      this.eventToDelete = null;
    });
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
