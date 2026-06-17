import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TransactionDto } from '../../models/transaction.dto';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:5144/Transaction';

  getTransactions(): Observable<TransactionDto[]> {
    return this.http.get<TransactionDto[]>(this.apiUrl);
  }

  getTransaction(id: number): Observable<TransactionDto> {
    return this.http.get<TransactionDto>(`${this.apiUrl}/${id}`);
  }
}
