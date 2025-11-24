import firebase from 'firebase/compat/app';

export interface AuthUser {
    uid?: string;
    email?: string | null;
    displayName?: string | null;
    token?: string;
    role: 'user' | 'admin';
    selectedBrand?: string; 
    lastLogin?: firebase.firestore.Timestamp;
    blocked?: boolean; 
}