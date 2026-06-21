import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { ReadBillResponseDto } from '../../models/ai-bill.dto';

@Injectable({
  providedIn: 'root'
})
export class AiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl + 'ai';

  analyzeImage(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any>(`${this.apiUrl}/analyze-image`, formData);
  }

  readBill(file: File): Observable<ReadBillResponseDto> {
    const formData = new FormData();
    formData.append('billImage', file);
    return this.http.post<ReadBillResponseDto>(`${this.apiUrl}/read-bill`, formData);
  }
}
