import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { CategoryDto } from '../../models/category.dto';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl.endsWith('/')
    ? environment.apiUrl + 'Category'
    : environment.apiUrl + '/Category';

  getCategories(): Observable<CategoryDto[]> {
    return this.http.get<CategoryDto[]>(this.apiUrl).pipe(
      catchError(err => throwError(() => err))
    );
  }

  getCategoryById(id: number): Observable<CategoryDto> {
    return this.http.get<CategoryDto>(`${this.apiUrl}/${id}`).pipe(
      catchError(err => throwError(() => err))
    );
  }

  createCategory(category: Partial<CategoryDto>): Observable<CategoryDto> {
    return this.http.post<CategoryDto>(this.apiUrl, category).pipe(
      catchError(err => throwError(() => err))
    );
  }

  createCategoryByName(name: string): Observable<CategoryDto> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<CategoryDto>(`${this.apiUrl}/CreateByName`, JSON.stringify(name), { headers }).pipe(
      catchError(err => throwError(() => err))
    );
  }

  updateCategory(id: number, category: Partial<CategoryDto>): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, category).pipe(
      catchError(err => throwError(() => err))
    );
  }

  deleteCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError(err => throwError(() => err))
    );
  }
}
