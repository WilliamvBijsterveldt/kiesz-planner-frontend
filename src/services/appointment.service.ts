import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {Appointment} from '../models/appointment/appointment.model';
import {TimeSlot} from '../models/TimeSlot/time-slot.model';
import {Provider} from '../models/Provider/provider.model';

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  baseurl = "https://localhost:44325/api";

  constructor(private httpClient: HttpClient) {}

  getAppointments(): Observable<Appointment[]> {
    return this.httpClient.get<Appointment[]>(`${this.baseurl}/Appointment`);
  }

  getTimeSlots(provNum: number, currentDateTime: Date): Observable<TimeSlot[]> {
    return this.httpClient.get<TimeSlot[]>(`${this.baseurl}/Appointment/TimeSlots`);
  }

  getProviders(): Observable<Provider[]> {
    return this.httpClient.get<Provider[]>(`${this.baseurl}/Appointment/Providers`);
  }

  createAppointment(appointment: Appointment): Observable<any> {
    return this.httpClient.post(`${this.baseurl}/Appointment/Create`, appointment);
  }

  updateAppointment(appointment: Appointment): Observable<any> {
    return this.httpClient.put(`${this.baseurl}/Appointment/Update/${appointment.aptNum}`, {aptDateTime: appointment.aptDateTime});
  }

  deleteAppointment(appointment: Appointment): Observable<any> {
    return this.httpClient.delete(`${this.baseurl}/Appointment/Delete`, { body: appointment });
  }
}
