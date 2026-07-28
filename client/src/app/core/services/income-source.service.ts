import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { IncomeSourceDto, BudgetIncomeSourceDto } from '../../models/income-source.dto';

@Injectable({
  providedIn: 'root'
})
export class IncomeSourceService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl.endsWith('/')
    ? environment.apiUrl
    : environment.apiUrl + '/';
  
  private readonly apiUrl = `${this.baseUrl}IncomeSource`;
  private readonly budgetIncomeSourceApiUrl = `${this.baseUrl}api/BudgetIncomeSource`;

  getIncomeSources(): Observable<IncomeSourceDto[]> {
    return this.getUserIncomeSources();
  }

  getUserIncomeSources(): Observable<IncomeSourceDto[]> {
    return this.http.get<IncomeSourceDto[]>(`${this.apiUrl}/user`).pipe(
      catchError(err => throwError(() => err))
    );
  }

  getIncomeSource(id: number): Observable<IncomeSourceDto> {
    return this.http.get<IncomeSourceDto>(`${this.apiUrl}/${id}`).pipe(
      catchError(err => throwError(() => err))
    );
  }

  createIncomeSource(dto: Partial<IncomeSourceDto>): Observable<IncomeSourceDto> {
    return this.http.post<IncomeSourceDto>(this.apiUrl, dto).pipe(
      catchError(err => throwError(() => err))
    );
  }

  updateIncomeSource(id: number, dto: Partial<IncomeSourceDto>): Observable<IncomeSourceDto> {
    return this.http.put<IncomeSourceDto>(`${this.apiUrl}/${id}`, dto).pipe(
      catchError(err => throwError(() => err))
    );
  }

  deleteIncomeSource(id: number): Observable<IncomeSourceDto> {
    return this.http.delete<IncomeSourceDto>(`${this.apiUrl}/${id}`).pipe(
      catchError(err => throwError(() => err))
    );
  }

  // ─── BudgetIncomeSource Linking Endpoints ────────────────────────────────────

  linkIncomeSourceToBudget(dto: BudgetIncomeSourceDto): Observable<BudgetIncomeSourceDto> {
    return this.http.post<BudgetIncomeSourceDto>(this.budgetIncomeSourceApiUrl, dto).pipe(
      catchError(err => throwError(() => err))
    );
  }

  getBudgetIncomeSources(budgetId: number): Observable<BudgetIncomeSourceDto[]> {
    return this.http.get<BudgetIncomeSourceDto[]>(`${this.budgetIncomeSourceApiUrl}/budget/${budgetId}`).pipe(
      catchError(err => throwError(() => err))
    );
  }

  unlinkIncomeSource(id: number): Observable<void> {
    return this.http.delete<void>(`${this.budgetIncomeSourceApiUrl}/${id}`).pipe(
      catchError(err => throwError(() => err))
    );
  }
}
