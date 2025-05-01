import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  baseurl = "https://localhost:44325/api"

  constructor(private httpClient: HttpClient) {}


}
