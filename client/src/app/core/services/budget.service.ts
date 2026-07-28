import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment.development';
import {
  SharedBudgetDto,
  BudgetMemberDto,
  CreateSharedBudgetRequest,
  AddMemberRequest,
  UpdateMemberRoleRequest,
  BudgetWalletType,
  UserBudgetRole,
} from '../../models/shared-budget.dto';

// ─── Existing types ─────────────────────────────────────────────────────────────

export interface CreateBudgetRequest {
  id?: number;
  name: string;
  amount: number;
  startDate: string;
  endDate: string;
  categoryId?: number | null;
  note?: string;
  type: number;
  isDefault?: boolean;
  isActive?: boolean;
  autoRenew?: boolean;
}

export interface BudgetDto {
  id: number;
  name: string;
  amount: number;
  currentAmount?: number;
  isDefault?: boolean;
  startDate: string;
  endDate: string;
  categoryId?: number | null;
  note?: string;
  userId?: string;
  type: number;
  autoRenew?: boolean;
  walletType?: BudgetWalletType;
  currentUserRole?: UserBudgetRole;
  memberCount?: number;
  members?: BudgetMemberDto[];
  isShared?: boolean;
  createdByUserId?: string;
  description?: string | null;
  currency?: string;
  icon?: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class BudgetService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl.endsWith('/')
    ? environment.apiUrl + 'Budget'
    : environment.apiUrl + '/Budget';

  // ─── Personal & Standard Budget Endpoints ────────────────────────────────────

  getUserBudgets(): Observable<BudgetDto[]> {
    return this.http.get<BudgetDto[]>(`${this.apiUrl}/user`).pipe(
      catchError((err: any) => throwError(() => err))
    );
  }

  getBudgets(): Observable<BudgetDto[]> {
    return this.getUserBudgets();
  }

  getBudgetById(id: number): Observable<SharedBudgetDto> {
    return this.http.get<SharedBudgetDto>(`${this.apiUrl}/${id}`).pipe(
      catchError((err: any) => throwError(() => err))
    );
  }

  createBudget(data: CreateBudgetRequest | BudgetDto): Observable<BudgetDto> {
    return this.http.post<BudgetDto>(this.apiUrl, data).pipe(
      catchError(err => throwError(() => err))
    );
  }

  updateBudget(id: number, data: CreateBudgetRequest | BudgetDto): Observable<BudgetDto> {
    return this.http.put<BudgetDto>(`${this.apiUrl}/${id}`, data).pipe(
      catchError(err => throwError(() => err))
    );
  }

  deleteBudget(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError(err => throwError(() => err))
    );
  }

  getBudgetHistory(budgetId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/history/${budgetId}`).pipe(
      catchError(err => throwError(() => err))
    );
  }

  getInactiveBudgetsHistory(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/history-budgets`).pipe(
      catchError(err => throwError(() => err))
    );
  }

  toggleAutoRenew(id: number): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/toggle-autorenew`, {}).pipe(
      catchError(err => throwError(() => err))
    );
  }

  triggerRollover(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/trigger-rollover`, {}).pipe(
      catchError(err => throwError(() => err))
    );
  }

  // ─── Shared Budget Compatibility Methods ─────────────────────────────────────

  createSharedBudget(data: CreateSharedBudgetRequest): Observable<SharedBudgetDto> {
    return this.http.post<SharedBudgetDto>(`${this.apiUrl}/shared`, data).pipe(
      catchError(err => throwError(() => err))
    );
  }

  getSharedBudgets(): Observable<SharedBudgetDto[]> {
    return this.http.get<SharedBudgetDto[]>(`${this.apiUrl}/shared`).pipe(
      catchError(err => throwError(() => err))
    );
  }

  updateSharedBudget(id: number, data: Partial<CreateSharedBudgetRequest>): Observable<SharedBudgetDto> {
    return this.http.patch<SharedBudgetDto>(`${this.apiUrl}/${id}`, data).pipe(
      catchError(err => throwError(() => err))
    );
  }

  getBudgetMembers(budgetId: number): Observable<BudgetMemberDto[]> {
    return this.http.get<BudgetMemberDto[]>(`${this.apiUrl}/${budgetId}/members`).pipe(
      catchError(err => throwError(() => err))
    );
  }

  addMember(budgetId: number, data: AddMemberRequest): Observable<BudgetMemberDto> {
    return this.http.post<BudgetMemberDto>(`${this.apiUrl}/${budgetId}/members`, data).pipe(
      catchError(err => throwError(() => err))
    );
  }

  removeMember(budgetId: number, userId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${budgetId}/members/${userId}`).pipe(
      catchError(err => throwError(() => err))
    );
  }

  updateMemberRole(budgetId: number, userId: string, data: UpdateMemberRoleRequest): Observable<BudgetMemberDto> {
    return this.http.patch<BudgetMemberDto>(`${this.apiUrl}/${budgetId}/members/${userId}/role`, data).pipe(
      catchError(err => throwError(() => err))
    );
  }

  leaveBudget(budgetId: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${budgetId}/leave`, {}).pipe(
      catchError(err => throwError(() => err))
    );
  }
}
