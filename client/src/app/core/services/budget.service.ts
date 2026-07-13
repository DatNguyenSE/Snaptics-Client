import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';

export interface CreateBudgetRequest {
  name: string;
  amount: number;
  period: 'WEEKLY' | 'MONTHLY' | 'CUSTOM';
  startDate: string;
  endDate: string;
  categoryId?: number | null;
  note?: string;
}

export interface BudgetDto {
  id: number;
  name: string;
  amount: number;
  period: string;
  startDate: string;
  endDate: string;
  categoryId?: number | null;
  note?: string;
  userId?: string;
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
}
