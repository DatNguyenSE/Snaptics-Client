import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { BudgetService } from '../../../../core/services/budget.service';
import { BudgetMemberService } from '../../../../core/services/budgetMember.service';
import { TransactionService } from '../../../../core/services/transaction.service';
import { ToastService } from '../../../../core/services/toast-service';
import { LanguageService } from '../../../../core/services/language-service';
import { AccountService } from '../../../../core/services/account-service';
import { SharedBudgetDto, BudgetMemberDto } from '../../../../models/shared-budget.dto';
import { TransactionDto } from '../../../../models/transaction.dto';
import { BudgetMemberModal } from '../budget-member-modal/budget-member-modal';
import { UserHeader } from '../../../user-layout/user-header/user-header';

@Component({
  selector: 'app-shared-budget-detail',
  standalone: true,
  imports: [CommonModule, DatePipe, BudgetMemberModal, UserHeader],
  templateUrl: './shared-budget-detail.html',
  styleUrl: './shared-budget-detail.css',
})
export class SharedBudgetDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly budgetService = inject(BudgetService);
  private readonly budgetMemberService = inject(BudgetMemberService);
  private readonly transactionService = inject(TransactionService);
  private readonly toast = inject(ToastService);
  protected readonly language = inject(LanguageService);
  private readonly accountService = inject(AccountService);

  budget: SharedBudgetDto | null = null;
  transactions: TransactionDto[] = [];
  isLoading = true;
  isLoadingTransactions = true;
  hasError = false;
  hasTransactionError = false;

  isMemberModalOpen = false;
  isDeleteConfirmOpen = false;
  isDeleting = false;

  private budgetId!: number;

  get currentUserId(): string {
    return this.accountService.currentUser()?.id ?? '';
  }

  get isOwner(): boolean {
    return this.budget?.currentUserRole === 'OWNER';
  }

  get spentAmount(): number {
    if (!this.budget) return 0;
    const current = this.budget.currentAmount ?? this.budget.amount;
    return Math.max(0, this.budget.amount - current);
  }

  get remainingAmount(): number {
    return Math.max(0, (this.budget?.currentAmount ?? 0));
  }

  get spentPercent(): number {
    if (!this.budget || this.budget.amount <= 0) return 0;
    return Math.min(100, Math.round((this.spentAmount / this.budget.amount) * 100));
  }

  get isOverBudget(): boolean {
    return this.spentPercent >= 100;
  }

  get isNearLimit(): boolean {
    return this.spentPercent >= 85 && !this.isOverBudget;
  }

  get displayedMembers(): BudgetMemberDto[] {
    return (this.budget?.members ?? []).filter((m) => Number(m.status) === 1).slice(0, 4);
  }

  getMemberName(member: BudgetMemberDto): string {
    return member.memberName || member.displayName || member.memberEmail || member.email || 'Thành viên';
  }

  getInitials(name: string): string {
    const parts = (name || '').trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    return parts
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('');
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('budgetId');
    if (!idParam || isNaN(Number(idParam))) {
      this.router.navigateByUrl('/user/budget');
      return;
    }
    this.budgetId = Number(idParam);
    this.loadBudget();
  }

  loadBudget(): void {
    this.isLoading = true;
    this.hasError = false;

    forkJoin({
      budget: this.budgetService.getBudgetById(this.budgetId),
      members: this.budgetMemberService.getMembers(this.budgetId).pipe(
        catchError(() => of([]))
      )
    }).subscribe({
      next: ({ budget, members }) => {
        const memberList = members && members.length > 0 ? members : (budget.members || []);
        const currentMember = memberList.find(
          (m) => (m.memberId || m.userId) === this.currentUserId
        );

        let userRole: 'OWNER' | 'MEMBER' = budget.currentUserRole || 'MEMBER';
        
        // Ví gọi từ /Budget/user thường sẽ có isShared = false, hoặc ta xét dựa trên API members.
        // Đối với ví chia sẻ, bắt buộc phân biệt qua API members.
        if (currentMember) {
          if (currentMember.isOwner === true || currentMember.role === 0 || currentMember.role === 'OWNER') {
            userRole = 'OWNER';
          } else {
            userRole = 'MEMBER';
          }
        } else if (!budget.isShared) {
          // Nếu không có thành viên (hoặc chưa kịp tải) mà là ví cá nhân thì mặc định là Chủ ví
          userRole = 'OWNER';
        }

        this.budget = {
          ...budget,
          currentUserRole: userRole,
          members: memberList
        };
        this.isLoading = false;
        this.loadTransactions();
      },
      error: (err) => {
        if (err?.status === 403 || err?.status === 401) {
          this.toast.error('Bạn không có quyền truy cập ví này');
          this.router.navigateByUrl('/user/budget');
        } else if (err?.status === 404) {
          this.toast.error('Ví không tồn tại');
          this.router.navigateByUrl('/user/budget');
        } else {
          this.hasError = true;
        }
        this.isLoading = false;
      },
    });
  }

  private loadTransactions(): void {
    this.isLoadingTransactions = true;
    this.hasTransactionError = false;

    this.transactionService.getBudgetTransactions(this.budgetId).subscribe({
      next: (transactions) => {
        this.transactions = transactions;
        this.isLoadingTransactions = false;
      },
      error: () => {
        this.hasTransactionError = true;
        this.isLoadingTransactions = false;
      },
    });
  }

  openMemberModal(): void {
    this.isMemberModalOpen = true;
  }

  closeMemberModal(): void {
    this.isMemberModalOpen = false;
  }

  onMembersChanged(): void {
    this.loadBudget();
  }

  openDeleteConfirm(): void {
    this.isDeleteConfirmOpen = true;
  }

  closeDeleteConfirm(): void {
    this.isDeleteConfirmOpen = false;
  }

  confirmDelete(): void {
    if (!this.budget) return;
    this.isDeleting = true;

    this.budgetService.deleteBudget(this.budget.id).subscribe({
      next: () => {
        this.toast.success(`Đã xóa ví "${this.budget!.name}"`);
        this.router.navigateByUrl('/user/budget');
      },
      error: (err) => {
        this.toast.error(err?.error?.message || 'Không thể xóa ví');
        this.isDeleting = false;
      },
    });
  }

  goBack(): void {
    this.router.navigateByUrl('/user/budget');
  }

  formatCurrency(value: number | undefined): string {
    if (value === null || value === undefined || isNaN(value)) return '0đ';
    return `${new Intl.NumberFormat(this.language.locale()).format(value)}đ`;
  }

  getTransactionIcon(t: TransactionDto): string {
    if (t.source === 'manual') return 'edit_square';
    if (t.source === 'snap') return 'photo_camera';
    if ((t.transactionDetails?.length ?? 0) > 1) return 'receipt_long';
    return 'receipt_long';
  }

  getCategoryLabel(t: TransactionDto): string {
    const detail = t.transactionDetails?.[0];
    const name = detail?.categoryName || detail?.itemName || t.name;
    if (!name) return 'Khác';
    const normalized = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
    const key = `dashboard.category.${normalized}`;
    const translated = this.language.t(key);
    return translated === key ? name : translated;
  }

  getCreatorDisplay(t: TransactionDto): string {
    if (t.createdByUser?.displayName) return t.createdByUser.displayName;
    const creatorId = t.createdByUserId || t.userId;
    const member = this.budget?.members?.find(
      (m) => (m.memberId || m.userId) === creatorId
    );
    return member?.memberName || member?.displayName || member?.memberEmail || member?.email || 'Thành viên';
  }

  getCreatorInitials(t: TransactionDto): string {
    return this.getInitials(this.getCreatorDisplay(t));
  }

  getCreatorImageUrl(t: TransactionDto): string | null {
    if (t.createdByUser?.imageUrl) return t.createdByUser.imageUrl;
    const creatorId = t.createdByUserId || t.userId;
    const member = this.budget?.members?.find(
      (m) => (m.memberId || m.userId) === creatorId
    );
    return member?.imageUrl ?? null;
  }
}
