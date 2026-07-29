import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment.development';
import {
  CategorySummaryResponseDto,
  BarChartDto,
  SpendingComparisonResponseDto,
  DashboardSummaryDto,
  ActiveHourDto
} from '../../models/dashboard.dto';

export type DashboardFilterType = 'day' | 'week' | 'month' | 'year';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl.endsWith('/')
    ? environment.apiUrl + 'api/Dashboard'
    : environment.apiUrl + '/api/Dashboard';

  getSummary(
    filterType: DashboardFilterType = 'month',
    day?: number,
    month?: number,
    year?: number
  ): Observable<DashboardSummaryDto> {
    let params = new HttpParams().set('filterType', filterType).set('_t', Date.now().toString());
    if (day !== undefined && day !== null) params = params.set('day', day.toString());
    if (month !== undefined && month !== null) params = params.set('month', month.toString());
    if (year !== undefined && year !== null) params = params.set('year', year.toString());

    return this.http.get<DashboardSummaryDto>(`${this.apiUrl}/summary`, { params }).pipe(
      catchError(err => throwError(() => err))
    );
  }

  getCategorySummary(
    filterType: DashboardFilterType = 'month',
    day?: number,
    month?: number,
    year?: number
  ): Observable<CategorySummaryResponseDto> {
    let params = new HttpParams().set('filterType', filterType).set('_t', Date.now().toString());
    if (day !== undefined && day !== null) params = params.set('day', day.toString());
    if (month !== undefined && month !== null) params = params.set('month', month.toString());
    if (year !== undefined && year !== null) params = params.set('year', year.toString());

    return this.http.get<CategorySummaryResponseDto>(`${this.apiUrl}/category-summary`, { params }).pipe(
      catchError(err => throwError(() => err))
    );
  }

  getTrendSummary(
    filterType: DashboardFilterType = 'month',
    day?: number,
    month?: number,
    year?: number
  ): Observable<BarChartDto[]> {
    let params = new HttpParams().set('filterType', filterType).set('_t', Date.now().toString());
    if (day !== undefined && day !== null) params = params.set('day', day.toString());
    if (month !== undefined && month !== null) params = params.set('month', month.toString());
    if (year !== undefined && year !== null) params = params.set('year', year.toString());

    return this.http.get<BarChartDto[]>(`${this.apiUrl}/trend-summary`, { params }).pipe(
      catchError(err => throwError(() => err))
    );
  }

  getSpendingComparison(): Observable<SpendingComparisonResponseDto> {
    const params = new HttpParams().set('_t', Date.now().toString());
    return this.http.get<SpendingComparisonResponseDto>(`${this.apiUrl}/spending-comparison`, { params }).pipe(
      catchError(err => throwError(() => err))
    );
  }

  getActiveHours(month?: number, year?: number): Observable<ActiveHourDto[]> {
    let params = new HttpParams().set('_t', Date.now().toString());
    if (month !== undefined) params = params.set('month', month.toString());
    if (year !== undefined) params = params.set('year', year.toString());

    return this.http.get<ActiveHourDto[]>(`${this.apiUrl}/active-hours`, { params }).pipe(
      catchError(err => throwError(() => err))
    );
  }
}
