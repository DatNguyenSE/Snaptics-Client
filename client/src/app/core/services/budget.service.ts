import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { BudgetDto } from '../../models/budget.dto';

@Injectable({
  providedIn: 'root'
})
export class BudgetService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl + 'Budget';

  getUserBudgets(): Observable<BudgetDto[]> {
    return this.http.get<BudgetDto[]>(`${this.apiUrl}/user`);
  }

  getBudgets(): Observable<BudgetDto[]> {
    return this.http.get<BudgetDto[]>(this.apiUrl);
  }

  createBudget(budget: Partial<BudgetDto>): Observable<BudgetDto> {
    return this.http.post<BudgetDto>(this.apiUrl, budget);
  }

  updateBudget(id: number, budget: BudgetDto): Observable<BudgetDto> {
    return this.http.put<BudgetDto>(`${this.apiUrl}/${id}`, budget);
  }
}
