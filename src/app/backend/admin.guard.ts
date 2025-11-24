import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { map, tap } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class AdminGuard implements CanActivate {

    constructor(private auth: AuthService, private router: Router) { }

    canActivate() {
        return this.auth.user$.pipe(
            map(user => {
                const storedUser = this.auth.getStoredUser();

                // If no user or not admin → block
                if (!user || storedUser?.role !== 'admin') {
                    return false;
                }
                return true;
            }),
            tap(isAllowed => {
                if (!isAllowed) {
                    alert('Access denied. Admins only.');
                    this.router.navigate(['/dashboard']);
                }
            })
        );
    }
}