import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from '../../backend/auth.service';
import { AuthUser } from '../../backend/auth-user.model';


@Component({
  selector: 'app-admin-dashboard',
  standalone: false,
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
  users$!: Observable<AuthUser[]>;

  constructor(private authService: AuthService) { }

  ngOnInit(): void {
    this.users$ = this.authService.getAllUsers();
  }

  /**
   * Toggle the selected brand between "TATA AIA" and "Aditya Birla Life Insurance"
   */
  async toggleBrand(user: AuthUser) {
    if (!user.uid) return;

    const newBrand =
      user.selectedBrand === 'TATA AIA'
        ? 'Aditya Birla Life Insurance'
        : 'TATA AIA';

    try {
      await this.authService.saveSelectedBrand(user.uid, newBrand);

      // Update UI immediately
      user.selectedBrand = newBrand;
    } catch (error) {
      console.error('Failed to update brand:', error);
    }
  }

  async toggleBlockUser(user: AuthUser) {
    if (!user.uid) return;

    const newBlockedStatus = !user.blocked;

    try {
      await this.authService.setUserBlockedStatus(user.uid, newBlockedStatus);
      user.blocked = newBlockedStatus; // update UI immediately
    } catch (error) {
      console.error('Failed to update block status:', error);
    }
  }
}