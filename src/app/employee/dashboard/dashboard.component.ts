import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../backend/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent {
  user: any = null;
  uploading = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    this.user = this.authService.getStoredUser();
  }

  async logout() {
    try {
      await this.authService.signOut();
      this.user = null;
      this.router.navigate(['/login']);
    } catch (err) {
      console.error('Logout failed', err);
      alert('Logout failed');
    }
  }
}