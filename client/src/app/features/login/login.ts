import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AccountService } from '../../core/services/account-service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private accountService = inject(AccountService);
  private router = inject(Router);
  
  protected Title = 'Snaptics AI';
  model: any = {};
  isLoading = false;
  errorMessage = '';

  login() {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.accountService.login(this.model).subscribe({
      next: (res) => {
        console.log('Login successful:', res,this.model);
        this.isLoading = false;
        this.router.navigate(['/trang-chu']); // Redirect to dashboard or homepage
      },
      error: (error) => {
        console.error('Login failed:', error, this.model);
        this.isLoading = false;
        if (error.error && typeof error.error === 'string') {
          this.errorMessage = error.error;
        } else {
          this.errorMessage = 'Failed to login. Please check your credentials and try again.';
        }
      }
    });
  }
}
