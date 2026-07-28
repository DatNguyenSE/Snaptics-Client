import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { SystemStatusService, SystemStatus } from '../../core/services/system-status.service';
import { ToastService } from '../../core/services/toast-service';
import { AccountService } from '../../core/services/account-service';

@Component({
  selector: 'app-maintenance',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './maintenance.component.html',
  styleUrl: './maintenance.component.css',
})
export class MaintenanceComponent implements OnInit {
  private readonly statusService = inject(SystemStatusService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly accountService = inject(AccountService);

  readonly status = this.statusService.status;
  readonly isChecking = this.statusService.isChecking;

  ngOnInit(): void {
    // Check status on load
    this.refreshStatus(false);
  }

  refreshStatus(showToastOnStillMaintenance = true): void {
    this.statusService.checkStatus().subscribe((currentStatus: SystemStatus) => {
      if (!currentStatus.maintenanceMode) {
        this.toast.success('Hệ thống đã hoạt động bình thường!');
        this.navigateHome();
      } else if (showToastOnStillMaintenance) {
        this.toast.info('Hệ thống vẫn đang trong quá trình bảo trì. Vui lòng thử lại sau.');
      }
    });
  }

  private navigateHome(): void {
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
