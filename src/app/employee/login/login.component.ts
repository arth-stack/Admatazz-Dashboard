import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../backend/auth.service';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {

  errorMsg: string | null = null;

  constructor(public auth: AuthService, private router: Router) { }

  async login() {
    try {
      this.errorMsg = null;
      const user = await this.auth.googleSignIn();

      if (user.role === 'admin') {
        this.router.navigate(['/admin-dashboard']);
      } else {
        if (user.selectedBrand) {
          this.router.navigate(['/dashboard']); 
        } else {
          this.router.navigate(['/choose-brand']); 
        }
      }

    } catch (err: any) {
      this.errorMsg = 'Login failed. Please try again.';
      console.error('Backend error:', err);
    }
  }

  async logout() {
    await this.auth.signOut();
    this.router.navigate(['/login']);
  }
}