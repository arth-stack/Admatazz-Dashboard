import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService, AppUser } from './auth.service';
import { map, tap } from 'rxjs/operators';
import { of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private auth: AuthService, private router: Router) {}

  canActivate() {
    return this.auth.user$.pipe(
      map(user => {
        if (!user) return false;

        const storedUser: AppUser | null = this.auth.getStoredUser();

        if (storedUser?.blocked) {
          return false;
        }

        return true;
      }),
      tap(isAllowed => {
        if (!isAllowed) {
          const storedUser = this.auth.getStoredUser();
          if (storedUser?.blocked) {
            alert('Account Suspended. Contact Admin.');
          }
          this.auth.signOut();
          this.router.navigate(['/login']);
        }
      })
    );
  }
}