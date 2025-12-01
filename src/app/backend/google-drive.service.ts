import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class GoogleDriveService {

  //private API_URL = 'http://localhost:3000/api/upload';
  private API_URL = 'https://admatazz-dashboard.onrender.com/api/upload';

  constructor(private http: HttpClient) { }

  uploadFile(formData: FormData) {
    return this.http.post(this.API_URL, formData);
  }
}