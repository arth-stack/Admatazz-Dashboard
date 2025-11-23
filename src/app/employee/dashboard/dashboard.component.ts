import { Component } from '@angular/core';
import { AuthService } from '../../backend/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent {
  user: any = null;

  constructor(
    private authService: AuthService,
  ) {
    this.user = this.authService.getStoredUser();
  }

  async login() {
    try {
      this.user = await this.authService.googleSignIn();
      alert(`Logged in as ${this.user.email}`);
    } catch (err) {
      alert('Login failed: ' + err);
    }
  }
}