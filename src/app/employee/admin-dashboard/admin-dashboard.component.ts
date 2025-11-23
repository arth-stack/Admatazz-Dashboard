import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../backend/auth.service'; 
import { Observable } from 'rxjs';

@Component({
  selector: 'app-admin-dashboard',
  standalone: false,
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
  users$!: Observable<any[]>;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.users$ = this.authService.getAllUsers(); 
  }
}