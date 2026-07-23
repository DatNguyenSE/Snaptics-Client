import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { IncomeSourceDto } from '../../models/income-source.dto';

@Injectable({
  providedIn: 'root'
})
export class IncomeSourceService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl + 'IncomeSource';

  getIncomeSources(): Observable<IncomeSourceDto[]> {
    return this.http.get<IncomeSourceDto[]>(this.apiUrl);
  }

  getUserIncomeSources(): Observable<IncomeSourceDto[]> {
    return this.http.get<IncomeSourceDto[]>(`${this.apiUrl}/user`);
  }

  getIncomeSource(id: number): Observable<IncomeSourceDto> {
    return this.http.get<IncomeSourceDto>(`${this.apiUrl}/${id}`);
  }

  createIncomeSource(dto: Partial<IncomeSourceDto>): Observable<IncomeSourceDto> {
    return this.http.post<IncomeSourceDto>(this.apiUrl, dto);
  }

  updateIncomeSource(id: number, dto: Partial<IncomeSourceDto>): Observable<IncomeSourceDto> {
    return this.http.put<IncomeSourceDto>(`${this.apiUrl}/${id}`, dto);
  }

  deleteIncomeSource(id: number): Observable<IncomeSourceDto> {
    return this.http.delete<IncomeSourceDto>(`${this.apiUrl}/${id}`);
  }
}
