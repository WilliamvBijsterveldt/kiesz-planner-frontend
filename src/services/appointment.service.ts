import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {Appointment} from '../models/appointment/appointment.model';

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  baseurl = "https://localhost:44325/api";

  constructor(private httpClient: HttpClient) {}

  getAppointments(): Observable<Appointment[]> {
    return this.httpClient.get<Appointment[]>(`${this.baseurl}/appointments`);
  }

  createAppointment(appointment: Appointment): Observable<any> {
    return this.httpClient.post(`${this.baseurl}/appointments`, appointment);
  }

  updateAppointment(appointment: Appointment): Observable<any> {
    return this.httpClient.put(`${this.baseurl}/appointments`, appointment);
  }

  deleteAppointment(appointment: Appointment): Observable<any> {
    return this.httpClient.delete(`${this.baseurl}/appointments`, { body: appointment });
  }
}
