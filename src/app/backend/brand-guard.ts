import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class BrandGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    const user = this.authService.getStoredUser();

    if (!user) {
      // If user is not logged in, redirect to login
      this.router.navigate(['/login']);
      return false;
    }

    if (user.selectedBrand) {
      // If user has already selected a brand, redirect to dashboard
      this.router.navigate(['/dashboard']);
      return false;
    }

    // Otherwise, allow access
    return true;
  }
}