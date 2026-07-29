import { Component, OnInit, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { UserHeader } from '../../user-layout/user-header/user-header';
import { BudgetService, BudgetDto, CreateBudgetRequest } from '../../../core/services/budget.service';
import { BudgetMemberService } from '../../../core/services/budgetMember.service';
import { LanguageService } from '../../../core/services/language-service';
import { ToastService } from '../../../core/services/toast-service';
import { AccountService } from '../../../core/services/account-service';
import { SharedBudgetDto, BudgetMemberDto } from '../../../models/shared-budget.dto';
import { CreateSharedBudgetModal } from './create-shared-budget-modal/create-shared-budget-modal';

@Component({
  selector: 'app-budget',
  standalone: true,
  imports: [CommonModule, UserHeader, ReactiveFormsModule, CreateSharedBudgetModal],
  templateUrl: './budget.html',
  styleUrl: './budget.css',
})
export class Budget implements OnInit {
  private readonly budgetService = inject(BudgetService);
  private readonly budgetMemberService = inject(BudgetMemberService);
  protected readonly language = inject(LanguageService);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly accountService = inject(AccountService);

  // ─── Personal budgets ──────────────────────────────────────────────────────
  budgets: BudgetDto[] = [];
  isLoading = true;
  hasError = false;

  // ─── Shared budgets ────────────────────────────────────────────────────────
  sharedBudgets: SharedBudgetDto[] = [];
  ownedSharedBudgets: SharedBudgetDto[] = [];
  isLoadingShared = true;
  hasErrorShared = false;

  get allSharedBudgets(): SharedBudgetDto[] {
    const combined = [...this.sharedBudgets, ...this.ownedSharedBudgets];
    const unique = new Map<number, SharedBudgetDto>();
    combined.forEach(b => unique.set(b.id, b));
    return Array.from(unique.values()).sort((a, b) => {
      return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
    });
  }

  // ─── Tab ───────────────────────────────────────────────────────────────────
  activeTab: 'personal' | 'shared' = 'personal';

  // ─── Personal Budget Modal ─────────────────────────────────────────────────
  isModalOpen = false;
  isSubmitting = false;
  modalMode: 'ADD' | 'EDIT' = 'ADD';
  editingBudgetId: number | null = null;
  editingBudget: BudgetDto | null = null;
  budgetForm!: FormGroup;

  // ─── Shared Budget Modal ───────────────────────────────────────────────────
  isSharedModalOpen = false;

  // ─── Confirm Modal ─────────────────────────────────────────────────────────
  isConfirmModalOpen = false;
  confirmModalTitle = '';
  confirmModalMessage = '';
  confirmAction: (() => void) | null = null;
  confirmBtnClass = 'btn-primary-modal';
  confirmBtnText = 'Xác nhận';

  // ─── Dropdown State ────────────────────────────────────────────────────────
  activeDropdownId: number | null = null;

  ngOnInit(): void {
    this.initForm();
    this.loadBudgets();
    this.loadSharedBudgets();
  }

  setTab(tab: 'personal' | 'shared'): void {
    this.activeTab = tab;
  }

  // ─── Personal Budget ───────────────────────────────────────────────────────

  private initForm(): void {
    const today = new Date().toISOString().split('T')[0];
    this.budgetForm = this.fb.group({
      name: ['', Validators.required],
      amount: [0, [Validators.required, Validators.min(1)]],
      type: [0, Validators.required],
      startDate: [today, Validators.required],
      endDate: [''],
      isDefault: [false],
      isAutoRenew: [false],
    });
  }

  get displayAmount(): string {
    const val = this.budgetForm.get('amount')?.value;
    if (!val) return '';
    return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  onAmountChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    let rawValue = input.value.replace(/\./g, '');
    let isNegative = rawValue.startsWith('-');
    if (isNegative) rawValue = rawValue.substring(1);
    let numericValue = parseInt(rawValue, 10);
    if (isNaN(numericValue)) numericValue = 0;
    let finalValue = isNegative ? -numericValue : numericValue;
    this.budgetForm.patchValue({ amount: finalValue });
    let display =
      numericValue === 0 && rawValue === ''
        ? ''
        : numericValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    if (isNegative)
      display = '-' + (numericValue === 0 && input.value === '-' ? '' : display);
    input.value = display;
  }

  currentCycle: number = 0;

  onCycleChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.currentCycle = parseInt(select.value, 10);
    this.updateEndDate();
  }

  onStartDateChange(): void {
    this.updateEndDate();
  }

  onEndDateChange(): void {
    // If user manually changes end date, set cycle to custom (0)
    this.currentCycle = 0;
  }

  private updateEndDate(): void {
    const endDateControl = this.budgetForm.get('endDate');
    if (this.currentCycle === 36500) {
      this.budgetForm.patchValue({ endDate: '' });
      endDateControl?.clearValidators();
      endDateControl?.disable();
    } else {
      endDateControl?.enable();
      endDateControl?.clearValidators();
      if (this.currentCycle > 0) {
        const start = this.budgetForm.get('startDate')?.value;
        if (start) {
          const date = new Date(start);
          date.setDate(date.getDate() + this.currentCycle);
          this.budgetForm.patchValue({
            endDate: date.toISOString().split('T')[0]
          });
        }
      }
    }
    endDateControl?.updateValueAndValidity();
  }

  loadBudgets(): void {
    this.isLoading = true;
    this.hasError = false;
    this.budgetService.getBudgets().subscribe({
      next: (data) => {
        const sortedBudgets = data
          .filter((b) => !b.isShared && b.walletType !== 'SHARED')
          .sort((a, b) => {
            const aDefault = a.isDefault ? 1 : 0;
            const bDefault = b.isDefault ? 1 : 0;
            if (aDefault !== bDefault) return bDefault - aDefault;
            return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
          });

        if (sortedBudgets.length === 0) {
          this.budgets = [];
          this.isLoading = false;
          return;
        }

        const requests$ = sortedBudgets.map((b) => {
          return this.budgetMemberService.getMembers(b.id).pipe(
            map((members) => ({ ...b, members })),
            catchError(() => of({ ...b, members: [] }))
          );
        });

        forkJoin(requests$).subscribe({
          next: (budgetsWithMembers) => {
            const purelyPersonal: BudgetDto[] = [];
            const ownedShared: SharedBudgetDto[] = [];
            const currentUserId = this.accountService.currentUser()?.id;

            budgetsWithMembers.forEach(b => {
              const hasOtherMembers = b.members?.some(m => (m.memberId || m.userId) !== currentUserId);
              if (hasOtherMembers) {
                ownedShared.push({
                  ...b,
                  walletType: 'SHARED',
                  isShared: true,
                  currentUserRole: 'OWNER'
                } as unknown as SharedBudgetDto);
              } else {
                purelyPersonal.push(b);
              }
            });

            this.budgets = purelyPersonal;
            this.ownedSharedBudgets = ownedShared;
            this.isLoading = false;
          },
          error: () => {
            this.budgets = sortedBudgets;
            this.isLoading = false;
          },
        });
      },
      error: () => {
        this.hasError = true;
        this.isLoading = false;
      },
    });
  }

  loadSharedBudgets(): void {
    this.isLoadingShared = true;
    this.hasErrorShared = false;
    this.budgetMemberService.getSharedBudgets().subscribe({
      next: (data: any[]) => {
        if (!data || !Array.isArray(data) || data.length === 0) {
          this.sharedBudgets = [];
          this.isLoadingShared = false;
          return;
        }

        const currentUser = this.accountService.currentUser();

        // 1. Filter active memberships (status === 1) or items with active members
        const activeItems = data.filter((item: any) => {
          if (item.status !== undefined && item.status !== null) {
            return Number(item.status) === 1;
          }
          const members = item.members ?? [];
          const currentMember = members.find(
            (member: any) =>
              member.userId === currentUser?.id ||
              member.email?.toLowerCase() === currentUser?.email?.toLowerCase()
          );
          return currentMember
            ? Number(currentMember.status) === 1
            : members.some((member: any) => Number(member.status) === 1);
        });

        if (activeItems.length === 0) {
          this.sharedBudgets = [];
          this.isLoadingShared = false;
          return;
        }

        // 2. Fetch full budget details & members for each shared budget using forkJoin
        const requests$ = activeItems.map((item: any) => {
          const budgetId = item.budgetId || item.id;

          return forkJoin({
            budget: this.budgetService.getBudgetById(budgetId).pipe(
              catchError(() => of(null))
            ),
            members: this.budgetMemberService.getMembers(budgetId).pipe(
              catchError(() => of([]))
            ),
          }).pipe(
            map(({ budget, members }) => {
              const currentMember = members.find(
                (m) => (m.memberId || m.userId) === currentUser?.id
              );

              let userRole: 'OWNER' | 'MEMBER' = 'MEMBER';
              if (currentMember) {
                if (currentMember.isOwner === true || currentMember.role === 0 || currentMember.role === 'OWNER') {
                  userRole = 'OWNER';
                }
              } else if (item.isOwner === true || item.role === 0 || item.role === 'OWNER') {
                userRole = 'OWNER';
              }

              if (budget) {
                return {
                  ...budget,
                  currentUserRole: userRole,
                  members: members && members.length > 0 ? members : (budget.members || []),
                };
              }

              const fallbackBudget: SharedBudgetDto = {
                id: budgetId,
                name: item.budgetName || item.name || 'Ví dùng chung',
                amount: item.amount || 0,
                currentAmount: item.currentAmount || 0,
                startDate: item.startDate || item.createdAt || new Date().toISOString(),
                endDate: item.endDate || '',
                type: item.type || 0,
                walletType: 'SHARED',
                currentUserRole: userRole,
                members: members || [],
                isShared: true,
              };
              return fallbackBudget;
            })
          );
        });

        forkJoin(requests$).subscribe({
          next: (budgets) => {
            this.sharedBudgets = budgets;
            this.isLoadingShared = false;
          },
          error: () => {
            this.hasErrorShared = true;
            this.isLoadingShared = false;
          },
        });
      },
      error: () => {
        this.hasErrorShared = true;
        this.isLoadingShared = false;
      },
    });
  }

  openModal(budget?: BudgetDto): void {
    this.isModalOpen = true;
    this.isSubmitting = false;
    this.currentCycle = 0;
    
    // Reset control states before patching
    this.budgetForm.get('endDate')?.enable();
    this.budgetForm.get('endDate')?.clearValidators();
    this.budgetForm.get('endDate')?.updateValueAndValidity();

    if (budget) {
      this.modalMode = 'EDIT';
      this.editingBudgetId = budget.id;
      this.editingBudget = budget;
      let start = '';
      if (budget.startDate) {
        const d = new Date(budget.startDate);
        if (!isNaN(d.getTime())) start = d.toISOString().split('T')[0];
      }
      let end = '';
      if (budget.endDate) {
        const d = new Date(budget.endDate);
        if (!isNaN(d.getTime())) end = d.toISOString().split('T')[0];
      } else {
        // If no end date, it is forever
        this.currentCycle = 36500;
        this.budgetForm.get('endDate')?.clearValidators();
        this.budgetForm.get('endDate')?.disable();
        this.budgetForm.get('endDate')?.updateValueAndValidity();
      }
      this.budgetForm.patchValue({
        name: budget.name,
        amount: budget.amount,
        type: budget.type !== undefined ? budget.type : 0,
        startDate: start,
        endDate: end,
        isDefault: budget.isDefault || false,
        isAutoRenew: budget.isAutoRenew ?? budget.autoRenew ?? false,
      });
    } else {
      this.modalMode = 'ADD';
      this.editingBudgetId = null;
      this.editingBudget = null;
      this.budgetForm.reset({
        name: '',
        amount: 0,
        type: 0,
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        isDefault: false,
        isAutoRenew: false,
      });
    }
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.editingBudgetId = null;
    this.editingBudget = null;
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: Event): void {
    if (this.isModalOpen && !this.isSubmitting) {
      this.closeModal();
    }
    if (this.isSharedModalOpen) {
      this.closeSharedModal();
    }
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.activeDropdownId = null;
  }

  toggleDropdown(event: Event, budgetId: number): void {
    event.stopPropagation();
    this.activeDropdownId = this.activeDropdownId === budgetId ? null : budgetId;
  }

  stopPropagation(event: Event): void {
    event.stopPropagation();
  }

  closeConfirmModal(): void {
    this.isConfirmModalOpen = false;
    this.confirmAction = null;
  }

  executeConfirmAction(): void {
    if (this.confirmAction) {
      this.confirmAction();
    }
  }

  onSubmit(): void {
    if (this.budgetForm.invalid) {
      this.budgetForm.markAllAsTouched();
      return;
    }
    this.isSubmitting = true;
    const formVal = this.budgetForm.getRawValue();
    let payload: any = {
      name: formVal.name,
      amount: formVal.amount,
      type: Number(formVal.type),
      startDate: formVal.startDate
        ? new Date(formVal.startDate).toISOString()
        : new Date().toISOString(),
      endDate: (this.currentCycle === 36500 || !formVal.endDate)
        ? null
        : new Date(formVal.endDate).toISOString(),
      categoryId: null,
      note: '',
      isDefault: formVal.isDefault || false,
      isAutoRenew: formVal.isAutoRenew || false,
      isActive: true,
    };

    if (this.modalMode === 'EDIT' && this.editingBudget) {
      const difference = formVal.amount - this.editingBudget.amount;
      const originalCurrentAmount = this.editingBudget.currentAmount !== undefined ? this.editingBudget.currentAmount : this.editingBudget.amount;
      payload = {
        ...this.editingBudget,
        ...payload,
        id: this.editingBudget.id,
        currentAmount: originalCurrentAmount + difference
      };
    } else {
      payload.id = 0;
    }

    if (this.modalMode === 'ADD') {
      this.budgetService.createBudget(payload).subscribe({
        next: () => {
          this.toast.success('Thêm ngân sách thành công');
          this.closeModal();
          this.loadBudgets();
        },
        error: (err) => {
          this.toast.error(err.error?.message || 'Có lỗi xảy ra khi thêm');
          this.isSubmitting = false;
        },
      });
    } else if (this.modalMode === 'EDIT' && this.editingBudgetId) {
      this.budgetService.updateBudget(this.editingBudgetId, payload).subscribe({
        next: () => {
          this.toast.success('Cập nhật ngân sách thành công');
          this.closeModal();
          this.loadBudgets();
        },
        error: (err) => {
          this.toast.error(err.error?.message || 'Có lỗi xảy ra khi cập nhật');
          this.isSubmitting = false;
        },
      });
    }
  }

  deleteBudget(id: number): void {
    this.confirmModalTitle = 'Xác nhận xóa';
    this.confirmModalMessage = 'Bạn có chắc chắn muốn xóa ngân sách này không? Hành động này không thể hoàn tác.';
    this.confirmBtnClass = 'btn-primary-modal';
    this.confirmBtnText = 'Xóa';
    this.confirmAction = () => {
      this.budgetService.deleteBudget(id).subscribe({
        next: () => {
          this.toast.success('Xóa ngân sách thành công');
          this.loadBudgets();
          this.closeConfirmModal();
        },
        error: (err: any) => {
          this.toast.error(err.error?.message || 'Không thể xóa ngân sách');
          this.closeConfirmModal();
        },
      });
    };
    this.isConfirmModalOpen = true;
  }

  setDefaultBudget(budget: BudgetDto): void {
    if (budget.isDefault) return;
    this.confirmModalTitle = 'Đặt làm ví mặc định';
    this.confirmModalMessage = `Bạn có chắc chắn muốn đặt "${budget.name}" làm ví mặc định không?\n- Ví này sẽ trừ tiền khi thực hiện giao dịch mới.`;
    this.confirmBtnClass = 'btn-primary-modal';
    this.confirmBtnText = 'Đồng ý';
    this.confirmAction = () => {
      const payload = {
        ...budget,
        isDefault: true
      };

      this.budgetService.updateBudget(budget.id, payload as any).subscribe({
        next: () => {
          this.toast.success(`Đã đặt "${budget.name}" làm ví mặc định`);
          this.loadBudgets();
          this.closeConfirmModal();
        },
        error: (err: any) => {
          this.toast.error(err.error?.message || 'Có lỗi xảy ra khi cập nhật ví mặc định');
          this.closeConfirmModal();
        }
      });
    };
    this.isConfirmModalOpen = true;
  }

  // ─── Shared Budget ─────────────────────────────────────────────────────────

  openSharedModal(): void {
    this.isSharedModalOpen = true;
  }

  closeSharedModal(): void {
    this.isSharedModalOpen = false;
  }

  onMemberInvited(): void {
    this.closeSharedModal();
    this.loadSharedBudgets();
  }

  navigateToBudget(budget: BudgetDto | SharedBudgetDto): void {
    this.router.navigate(['/user/budget', budget.id]);
  }

  navigateToSharedBudget(budget: SharedBudgetDto): void {
    this.router.navigate(['/user/budget', budget.id]);
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  formatCurrency(value: number | undefined): string {
    if (value === null || value === undefined || isNaN(value)) return '0đ';
    return `${new Intl.NumberFormat(this.language.locale()).format(value)}đ`;
  }

  getBudgetSpentPercent(budget: BudgetDto): number {
    if (budget.currentAmount !== undefined) {
      const spent = budget.amount - budget.currentAmount;
      return Math.min(100, Math.max(0, Math.round((spent / budget.amount) * 100)));
    }
    return 0;
  }

  getSpentAmount(budget: BudgetDto): number {
    if (budget.currentAmount !== undefined) {
      return budget.amount - budget.currentAmount;
    }
    return 0;
  }

  getSharedSpentPercent(budget: SharedBudgetDto): number {
    if (budget.currentAmount !== undefined) {
      const spent = budget.amount - budget.currentAmount;
      return Math.min(100, Math.max(0, Math.round((spent / budget.amount) * 100)));
    }
    return 0;
  }

  getSharedSpentAmount(budget: SharedBudgetDto): number {
    if (budget.currentAmount !== undefined) return budget.amount - budget.currentAmount;
    return 0;
  }

  getDisplayedMembers(budget: BudgetDto | SharedBudgetDto): BudgetMemberDto[] {
    return (budget.members ?? [])
      .filter((member) => Number(member.status) === 1)
      .slice(0, 3);
  }

  getAcceptedMemberCount(budget: BudgetDto | SharedBudgetDto): number {
    return (budget.members ?? []).filter((member) => Number(member.status) === 1).length;
  }

  getInitials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    return parts
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('');
  }
}
