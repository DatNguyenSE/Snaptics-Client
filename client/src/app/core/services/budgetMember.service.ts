import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { SharedBudgetDto, BudgetMemberDto, UserBudgetRole } from '../../models/shared-budget.dto';

export interface InviteMemberRequestDto {
  email?: string;
  emailOrUsername?: string;
  role: number | string;
}

export interface RespondInviteRequestDto {
  status: number;
}

export interface UpdateMemberRoleRequestDto {
  role: UserBudgetRole | number | string;
}

@Injectable({
  providedIn: 'root',
})
export class BudgetMemberService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl.endsWith('/')
    ? environment.apiUrl + 'api/budgets'
    : environment.apiUrl + '/api/budgets';

  inviteMember(budgetId: number, request: { email?: string; emailOrUsername?: string; role: any }): Observable<any> {
    const payload = {
      emailOrUsername: request.email || request.emailOrUsername,
      role: request.role
    };
    return this.http.post<any>(`${this.apiUrl}/${budgetId}/members/invite`, payload).pipe(
      catchError(err => throwError(() => err))
    );
  }

  respondToInvitation(invitationId: number, request: RespondInviteRequestDto): Observable<{ success: boolean }> {
    return this.http.put<{ success: boolean }>(`${this.apiUrl}/members/invitations/${invitationId}/respond`, request).pipe(
      catchError(err => throwError(() => err))
    );
  }

  getMembers(budgetId: number): Observable<BudgetMemberDto[]> {
    return this.http.get<BudgetMemberDto[]>(`${this.apiUrl}/${budgetId}/members`).pipe(
      catchError(err => throwError(() => err))
    );
  }

  getSharedWithMe(): Observable<SharedBudgetDto[]> {
    return this.http.get<SharedBudgetDto[]>(`${this.apiUrl}/shared-with-me`).pipe(
      catchError(err => throwError(() => err))
    );
  }

  getSharedBudgets(): Observable<SharedBudgetDto[]> {
    return this.getSharedWithMe();
  }

  updateMemberRole(budgetId: number, memberId: string, request: UpdateMemberRoleRequestDto | { role: any }): Observable<{ success: boolean }> {
    return this.http.put<{ success: boolean }>(`${this.apiUrl}/${budgetId}/members/${memberId}/role`, request).pipe(
      catchError(err => throwError(() => err))
    );
  }

  removeMember(budgetId: number, memberId: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.apiUrl}/${budgetId}/members/${memberId}`).pipe(
      catchError(err => throwError(() => err))
    );
  }
}
