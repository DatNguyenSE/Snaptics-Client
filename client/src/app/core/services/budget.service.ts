import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';

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
}

@Injectable({
  providedIn: 'root',
})
export class BudgetService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl + 'Budget';

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
}
