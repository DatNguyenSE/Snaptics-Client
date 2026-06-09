import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AccountService } from '../../../core/services/account-service';

//
@Component({
  selector: 'app-reset-password',
  imports: [CommonModule, FormsModule],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css',
})
export class ForgotPassword implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private accountService = inject(AccountService);

  email = '';
  token = '';
  newPassword = '';
  confirmPassword = '';
  isLoading = false;

  ngOnInit() {
    this.email = this.route.snapshot.queryParamMap.get('email') || '';
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
  }

  onSubmit() {
    if (this.newPassword !== this.confirmPassword) {
      alert('Password confirmation does not match.');
      return;
    }

    this.isLoading = true;

    this.accountService
      .resetPassword(this.email, this.token, this.newPassword)
      .subscribe({
        next: () => {
          alert('Password has been reset successfully.');
          this.router.navigate(['/login']);
        },
        error: (err) => {
          console.error(err);
          alert('Cannot reset password.');
          this.isLoading = false;
        },
      });
  }
}