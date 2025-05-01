import { Component, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { CalendarEvent, CalendarView } from 'angular-calendar';
import { startOfDay, endOfDay, subDays, addDays, endOfMonth, isSameDay, isSameMonth, addHours } from 'date-fns';
import { MonthViewDay } from 'calendar-utils';

@Component({
  selector: 'app-calendar',
  standalone: false,
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.css'
})

export class CalendarComponent implements OnInit {
  view: CalendarView = CalendarView.Month;
  CalendarView = CalendarView;
  viewDate: Date = new Date();
  refresh = new Subject<void>();

  events: CalendarEvent[] = [
    {
      start: startOfDay(new Date()),
      title: 'Sample Event',
      color: {
        primary: '#ad2121',
        secondary: '#FAE3E3'
      }
    }
  ];

  activeDayIsOpen: boolean = false;

  constructor() { }

  ngOnInit(): void {
        throw new Error('Method not implemented.');
    }

  dayClicked({ day, sourceEvent }: { day: MonthViewDay; sourceEvent: MouseEvent | KeyboardEvent }): void {
    if (isSameMonth(day.date, this.viewDate)) {
      this.activeDayIsOpen = !((isSameDay(this.viewDate, day.date) && this.activeDayIsOpen) ||
        day.events.length === 0);
      this.viewDate = day.date;
    }
  }

  setView(view: CalendarView): void {
    this.view = view;
  }

  closeOpenMonthViewDay(): void {
    this.activeDayIsOpen = false;
  }
}
