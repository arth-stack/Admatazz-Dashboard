import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../backend/auth.service';

@Component({
  selector: 'app-choose-brand',
  standalone: false,
  templateUrl: './choose-brand.component.html',
  styleUrl: './choose-brand.component.css'
})
export class ChooseBrandComponent {
  user: any = null;

  constructor(
    private authService: AuthService,
    private router: Router
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

  async chooseBrand(brand: string) {
    if (!this.user) {
      alert('Please login first');
      return;
    }

    // Save brand in Firestore
    await this.authService.saveSelectedBrand(this.user.uid, brand);

    // Also store locally
    const updatedUser = { ...this.user, selectedBrand: brand };
    localStorage.setItem('authUser', JSON.stringify(updatedUser));

    // Navigate to dashboard
    this.router.navigate(['/dashboard']);
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