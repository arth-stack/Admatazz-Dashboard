import { Injectable, EnvironmentInjector, runInInjectionContext } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { GoogleAuthProvider } from '@angular/fire/auth';
import { finalize, Observable } from 'rxjs';

export interface AppUser {
    uid?: string;
    email?: string | null;
    displayName?: string | null;
    token?: string;
    role: 'admin' | 'user';
    selectedBrand?: string | null;
    blocked?: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {

    private adminUsers = ['', '']; // Add admin emails here

    constructor(
        private auth: AngularFireAuth,
        private firestore: AngularFirestore,
        private injector: EnvironmentInjector // Inject EnvironmentInjector here
    ) { }

    async googleSignIn(): Promise<AppUser> {
        const provider = new GoogleAuthProvider();
        provider.addScope('email');
        provider.addScope('profile');

        try {
            const result = await this.auth.signInWithPopup(provider);
            const email = result.user?.email ?? '';
            const allowedDomain = 'admatazz.com';

            if (!email.endsWith(`@${allowedDomain}`)) {
                await this.auth.signOut();
                localStorage.removeItem('authUser');
                throw new Error('Only @admatazz.com accounts are allowed.');
            }

            let selectedBrand: string | null = null; 
            let blocked = false;

            if (result.user?.uid) {
                const doc = await runInInjectionContext(this.injector, async () => {
                    return this.firestore
                        .collection<{ selectedBrand?: string; blocked?: boolean }>('users')
                        .doc(result.user!.uid)
                        .get()
                        .toPromise();
                });

                if (doc?.exists) {
                    const userData = doc.data(); 
                    selectedBrand = userData?.selectedBrand ?? null;
                    blocked = userData?.blocked ?? false;
                }

                if (blocked) {
                    await this.auth.signOut();
                    throw new Error('Account Suspended. Contact Admin.');
                }
            }

            const token = await result.user?.getIdToken();
            const isAdmin = this.isAdminUser(email);
            const role: 'admin' | 'user' = isAdmin ? 'admin' : 'user';

            const userData: AppUser = {
                uid: result.user?.uid,
                email: result.user?.email,
                displayName: result.user?.displayName,
                token,
                role,
                selectedBrand,
                blocked
            };

            localStorage.setItem('authUser', JSON.stringify(userData));

            // Save/update user in Firestore
            if (userData.uid) {
                await runInInjectionContext(this.injector, async () => {
                    await this.firestore.collection('users').doc(userData.uid).set(
                        {
                            email: userData.email,
                            displayName: userData.displayName,
                            lastLogin: new Date(),
                            role
                        },
                        { merge: true }
                    );
                });
            }

            return userData;

        } catch (error) {
            throw error;
        }
    }

    async saveSelectedBrand(uid: string, brand: string) {
        return runInInjectionContext(this.injector, async () => {
            await this.firestore.collection('users')
                .doc(uid)
                .set({ selectedBrand: brand }, { merge: true });
        });
    }

    getAllUsers(): Observable<any[]> {
        return runInInjectionContext(this.injector, () => {
            return this.firestore.collection('users').valueChanges({ idField: 'uid' });
        });
    }

    private isAdminUser(email: string): boolean {
        return this.adminUsers.includes(email.toLowerCase());
    }

    async signOut() {
        localStorage.removeItem('authUser');
        return this.auth.signOut();
    }

    get user$() {
        return this.auth.authState;
    }

    getStoredUser(): AppUser | null {
        const data = localStorage.getItem('authUser');
        return data ? JSON.parse(data) : null;
    }

    async setUserBlockedStatus(uid: string, blocked: boolean) {
        return runInInjectionContext(this.injector, async () => {
            await this.firestore.collection('users')
                .doc(uid)
                .set({ blocked }, { merge: true });
        });
    }
}