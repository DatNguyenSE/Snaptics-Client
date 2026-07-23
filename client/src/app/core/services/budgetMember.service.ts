import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { SharedBudgetDto, BudgetMemberDto, UserBudgetRole } from '../../models/shared-budget.dto';

export interface InviteMemberRequestDto {
  email: string;
}

export interface RespondInviteRequestDto {
  accept: boolean;
}

export interface UpdateMemberRoleRequestDto {
  role: UserBudgetRole;
}

@Injectable({
  providedIn: 'root',
})
export class BudgetMemberService {
  private readonly http = inject(HttpClient);
  // Do proxy cấu hình xóa mất /api, mà route backend là api/budgets nên ta phải thêm một chữ api/ nữa
  private readonly apiUrl = environment.apiUrl + 'budgets'; 

  inviteMember(budgetId: number, request: InviteMemberRequestDto): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${budgetId}/members/invite`, request);
  }

  respondToInvitation(invitationId: number, request: RespondInviteRequestDto): Observable<{ success: boolean }> {
    return this.http.put<{ success: boolean }>(`${this.apiUrl}/members/invitations/${invitationId}/respond`, request);
  }

  getMembers(budgetId: number): Observable<BudgetMemberDto[]> {
    return this.http.get<BudgetMemberDto[]>(`${this.apiUrl}/${budgetId}/members`);
  }

  getSharedBudgets(): Observable<SharedBudgetDto[]> {
    return this.http.get<SharedBudgetDto[]>(`${this.apiUrl}/shared-with-me`);
  }

  updateMemberRole(budgetId: number, memberId: string, request: UpdateMemberRoleRequestDto): Observable<{ success: boolean }> {
    return this.http.put<{ success: boolean }>(`${this.apiUrl}/${budgetId}/members/${memberId}/role`, request);
  }

  removeMember(budgetId: number, memberId: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.apiUrl}/${budgetId}/members/${memberId}`);
  }
}
