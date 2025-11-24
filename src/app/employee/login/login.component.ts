import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../backend/auth.service';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {

  errorMsg: string | null = null;
  currentUser: any = null;

  constructor(public auth: AuthService, private router: Router) { }

  ngOnInit() {
    this.auth.user$.subscribe(user => {
      this.currentUser = user;
    });
  }

  async login() {
    try {
      this.errorMsg = null;

      const user = await this.auth.googleSignIn();

      // Check if the user is blocked
      if (user.blocked) {
        this.errorMsg = 'Account Suspended. Contact Admin.';
        await this.auth.signOut();
        return; // stop further navigation
      }

      this.redirectUser(user);

    } catch (err: any) {
      // Show specific error if provided
      this.errorMsg = err?.message || 'Login failed. Please try again.';
      console.error('Backend error:', err);
    }
  }

  goToDashboard() {
    if (!this.currentUser) return;

    this.redirectUser(this.currentUser);
  }

  redirectUser(user: any) {
    if (user.role === 'admin') {
      this.router.navigate(['/admin-dashboard']);
    } else if (user.selectedBrand) {
      this.router.navigate(['/dashboard']);
    } else {
      this.router.navigate(['/choose-brand']);
    }
  }

  async logout() {
    await this.auth.signOut();
    this.router.navigate(['/login']);
  }
}