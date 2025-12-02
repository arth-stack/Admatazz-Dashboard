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
  selectedFiles: File[] = [];
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

  onFilesSelected(event: any) {
    const files = event.target.files;
    if (files) {
      this.selectedFiles = Array.from(files);
      this.successMessage = '';
      this.errorMessage = '';
    }
  }

  uploadFiles() {
    if (this.selectedFiles.length === 0) {
      this.errorMessage = "Please select at least one file.";
      return;
    }

    if (!this.industry || !this.brandCategory || !this.deckType) {
      this.errorMessage = "Please fill all form details before uploading.";
      return;
    }

    const formData = new FormData();
    this.selectedFiles.forEach(file => formData.append('files', file));
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
        this.successMessage = "Files uploaded successfully!";
        this.clearForm();
      },
      error: (err) => {
        this.isUploading = false;
        this.errorMessage = "Upload failed: " + err.message;
      }
    });
  }

  clearForm() {
    this.selectedFiles = [];
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