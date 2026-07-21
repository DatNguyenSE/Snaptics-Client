import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ReadBillResponseDto } from '../../models/ai-bill.dto';

@Injectable({
  providedIn: 'root'
})
export class AiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  analyzeImage(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('image', file);
    return this.http.post<any>(`${this.apiUrl}ai/analyze-image`, formData);
  }

  readBill(file: File): Observable<ReadBillResponseDto> {
    const formData = new FormData();
    formData.append('billImage', file);
    return this.http.post<ReadBillResponseDto>(`${this.apiUrl}ai/read-bill`, formData);
  }

  ask(message: string): Observable<{ reply: string }> {
    return this.http.post<{ reply: string }>(`${this.apiUrl}AiAssistant/ask`, { message });
  }
}
