import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TransactionDto } from '../../models/transaction.dto';
import { environment } from '../../environments/environment.development';
import { CreateTransactionFromBillDto } from '../../models/ai-bill.dto';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl + 'Transaction';

  getTransactions(): Observable<TransactionDto[]> {
    return this.http.get<TransactionDto[]>(this.apiUrl);
  }

  getTransaction(id: number): Observable<TransactionDto> {
    return this.http.get<TransactionDto>(`${this.apiUrl}/${id}`);
  }

  createFromBill(data: CreateTransactionFromBillDto, file: File | null): Observable<TransactionDto> {
    const formData = new FormData();
    formData.append('data', JSON.stringify(data));
    if (file) {
      formData.append('image', file);
    }
    return this.http.post<TransactionDto>(`${this.apiUrl}/from-bill`, formData);
  }
}
