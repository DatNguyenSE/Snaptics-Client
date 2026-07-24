import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';
import {
  SharedBudgetDto,
  BudgetMemberDto,
  CreateSharedBudgetRequest,
  AddMemberRequest,
  UpdateMemberRoleRequest,
} from '../../models/shared-budget.dto';

// ─── Existing types (kept for backward compat) ─────────────────────────────────

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
  // New shared wallet fields (populated when backend returns them)
  walletType?: 'PERSONAL' | 'SHARED';
  currentUserRole?: 'OWNER' | 'MEMBER';
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
  private readonly apiUrl = environment.apiUrl + 'Budget';

  // ─── Personal Budget (existing endpoints) ──────────────────────────────────

  createBudget(data: CreateBudgetRequest): Observable<BudgetDto> {
    return this.http.post<BudgetDto>(this.apiUrl, data);
  }

  getBudgets(): Observable<BudgetDto[]> {
    return this.http.get<BudgetDto[]>(this.apiUrl + '/user');
  }

  updateBudget(id: number, data: CreateBudgetRequest): Observable<BudgetDto> {
    return this.http.put<BudgetDto>(`${this.apiUrl}/${id}`, data);
  }

  deleteBudget(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // ─── Shared Budget ─────────────────────────────────────────────────────────

  createSharedBudget(data: CreateSharedBudgetRequest): Observable<SharedBudgetDto> {
    return this.http.post<SharedBudgetDto>(`${this.apiUrl}/shared`, data);
  }

  getSharedBudgets(): Observable<SharedBudgetDto[]> {
    return this.http.get<SharedBudgetDto[]>(`${this.apiUrl}/shared`);
  }

  getBudgetById(id: number): Observable<SharedBudgetDto> {
    return this.http.get<SharedBudgetDto>(`${this.apiUrl}/${id}`);
  }

  getBudgetHistory(id: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/history/${id}`);
  }

  updateSharedBudget(id: number, data: Partial<CreateSharedBudgetRequest>): Observable<SharedBudgetDto> {
    return this.http.patch<SharedBudgetDto>(`${this.apiUrl}/${id}`, data);
  }

  // ─── Member Management ─────────────────────────────────────────────────────

  getBudgetMembers(budgetId: number): Observable<BudgetMemberDto[]> {
    return this.http.get<BudgetMemberDto[]>(`${this.apiUrl}/${budgetId}/members`);
  }

  addMember(budgetId: number, data: AddMemberRequest): Observable<BudgetMemberDto> {
    return this.http.post<BudgetMemberDto>(`${this.apiUrl}/${budgetId}/members`, data);
  }

  removeMember(budgetId: number, userId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${budgetId}/members/${userId}`);
  }

  updateMemberRole(budgetId: number, userId: string, data: UpdateMemberRoleRequest): Observable<BudgetMemberDto> {
    return this.http.patch<BudgetMemberDto>(`${this.apiUrl}/${budgetId}/members/${userId}/role`, data);
  }

  leaveBudget(budgetId: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${budgetId}/leave`, {});
  }
}
