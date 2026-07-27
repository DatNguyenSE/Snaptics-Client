import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { CategorySummaryResponseDto, BarChartDto, SpendingComparisonResponseDto } from '../../models/dashboard.dto';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl + 'api/Dashboard';

  getCategorySummary(filterType: 'week' | 'month' | 'year' = 'month'): Observable<CategorySummaryResponseDto> {
    const params = new HttpParams().set('filterType', filterType).set('_t', Date.now().toString());
    return this.http.get<CategorySummaryResponseDto>(`${this.apiUrl}/category-summary`, { params });
  }

  getTrendSummary(filterType: 'week' | 'month' | 'year' = 'month'): Observable<BarChartDto[]> {
    const params = new HttpParams().set('filterType', filterType).set('_t', Date.now().toString());
    return this.http.get<BarChartDto[]>(`${this.apiUrl}/trend-summary`, { params });
  }

  getSpendingComparison(): Observable<SpendingComparisonResponseDto> {
    const params = new HttpParams().set('_t', Date.now().toString());
    return this.http.get<SpendingComparisonResponseDto>(`${this.apiUrl}/spending-comparison`, { params });
  }
}
