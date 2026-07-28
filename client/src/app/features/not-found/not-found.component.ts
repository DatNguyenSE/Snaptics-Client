import { Component, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AccountService } from '../../core/services/account-service';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './not-found.component.html',
  styleUrl: './not-found.component.css',
})
export class NotFoundComponent {
  private readonly location = inject(Location);
  private readonly router = inject(Router);
  private readonly accountService = inject(AccountService);

  goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.goHome();
    }
  }

  goHome(): void {
    const user = this.accountService.currentUser();
    if (user) {
      const roles = user.roles ?? [];
      if (roles.includes('ADMIN')) {
        this.router.navigate(['/admin/overview']);
        return;
      }
      this.router.navigate(['/user/dashboard']);
      return;
    }
    this.router.navigate(['/landing']);
  }
}
