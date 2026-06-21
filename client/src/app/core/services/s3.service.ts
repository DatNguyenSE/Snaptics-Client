import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';

export interface S3ViewResponse {
  url: string;
}

@Injectable({
  providedIn: 'root'
})
export class S3Service {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl + 's3';

  viewImage(key: string): Observable<S3ViewResponse> {
    const params = new HttpParams().set('key', key);
    return this.http.get<S3ViewResponse>(`${this.apiUrl}/view`, { params });
  }
}
