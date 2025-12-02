import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../backend/auth.service';
import { GoogleDriveService } from '../../backend/google-drive.service';

@Component({
  selector: 'app-upload-deck',
  standalone: false,
  templateUrl: './upload-deck.component.html',
  styleUrls: ['./upload-deck.component.css'],
})
export class UploadDeckComponent {

  user: any = null;
  selectedFile: File | null = null;
  uploading = false;

  email: string = '';
  selectedBrand: string = '';
  userName: string = '';
  industry: string = '';
  brandCategory: string = '';
  deckType: string = '';

  isUploading: boolean = false;
  successMessage: string = '';
  errorMessage: string = '';

  constructor(
    private authService: AuthService,
    private driveService: GoogleDriveService,
    private router: Router
  ) {
    this.user = this.authService.getStoredUser();
    if (this.user) {
      this.userName = this.user.displayName;
      this.email = this.user.email;
      this.selectedBrand = this.user.selectedBrand;
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files?.[0] || null;
    this.selectedFile = file;
    this.successMessage = ''; // clear success message when a new file is selected
    this.errorMessage = '';
  }

  uploadFile() {
    if (!this.selectedFile) {
      this.errorMessage = "Please select a file.";
      return;
    }

    if (!this.industry || !this.brandCategory || !this.deckType) {
      this.errorMessage = "Please fill all form details before uploading.";
      return;
    }

    const formData = new FormData();
    formData.append('file', this.selectedFile);
    formData.append('industry', this.industry);
    formData.append('deckCategory', this.brandCategory);
    formData.append('deckType', this.deckType);
    formData.append('uploadedBy', this.userName);      
    formData.append('uploadedByEmail', this.email);    

    this.isUploading = true;
    this.successMessage = '';
    this.errorMessage = '';

    this.driveService.uploadFile(formData).subscribe({
      next: () => {
        this.isUploading = false;
        this.successMessage = "File uploaded successfully!";
        this.clearForm();
      },
      error: (err) => {
        this.isUploading = false;
        this.errorMessage = "Upload failed: " + err.message;
      }
    });
  }

  clearForm() {
    this.selectedFile = null;
    this.industry = '';
    this.brandCategory = '';
    this.deckType = '';
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