import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  BehaviorSubject,
  Observable,
  catchError,
  combineLatest,
  finalize,
  map,
  of,
  shareReplay,
  switchMap,
  take,
  tap,
  throwError,
} from 'rxjs';
import { TransactionDto, UpdateItemPriceDto, MissingPriceItemDto } from '../../models/transaction.dto';
import { environment } from '../../environments/environment.development';
import { CreateTransactionFromBillDto } from '../../models/ai-bill.dto';
import { CreateTransactionEntryDto } from '../../models/transaction-entry.dto';
import { AccountService } from './account-service';

@Injectable({
  providedIn: 'root',
})
export class TransactionService {
  private readonly http = inject(HttpClient);
  private readonly accountService = inject(AccountService);
  private readonly baseUrl = environment.apiUrl.endsWith('/')
    ? environment.apiUrl
    : environment.apiUrl + '/';
  private readonly apiUrl = `${this.baseUrl}Transaction`;
  private readonly detailApiUrl = `${this.baseUrl}TransactionDetail`;

  private readonly remoteTransactionsSubject = new BehaviorSubject<TransactionDto[]>([]);
  private readonly localTransactionsSubject = new BehaviorSubject<TransactionDto[]>([]);
  private readonly transactions$ = combineLatest([
    this.remoteTransactionsSubject,
    this.localTransactionsSubject,
  ]).pipe(
    map(([remoteTransactions, localTransactions]) =>
      this.sortTransactions(this.mergeTransactions(remoteTransactions, localTransactions)),
    ),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  private hasLoadedRemoteTransactions = false;
  private isLoadingRemoteTransactions = false;

  getUserTransactions(): Observable<TransactionDto[]> {
    return this.http.get<TransactionDto[]>(`${this.apiUrl}/user`).pipe(
      map(transactions => transactions.map(t => this.sanitizeTransaction(t))),
      catchError(err => throwError(() => err))
    );
  }

  getTransactions(): Observable<TransactionDto[]> {
    this.ensureTransactionsLoaded();
    return this.transactions$;
  }

  refreshTransactions(): void {
    this.hasLoadedRemoteTransactions = false;
    this.ensureTransactionsLoaded();
  }

  getTransaction(id: number): Observable<TransactionDto> {
    this.ensureTransactionsLoaded();

    return this.transactions$.pipe(
      take(1),
      map((transactions) => transactions.find((transaction) => transaction.id === id) ?? null),
      switchMap((transaction) =>
        transaction
          ? of(transaction)
          : this.http.get<TransactionDto>(`${this.apiUrl}/${id}`).pipe(
              map((t) => this.sanitizeTransaction(t)),
              catchError((err) => throwError(() => err))
            ),
      ),
    );
  }

  getTransactionById(id: number): Observable<TransactionDto> {
    return this.http.get<TransactionDto>(`${this.apiUrl}/${id}`).pipe(
      map((t) => this.sanitizeTransaction(t)),
      catchError((err) => throwError(() => err))
    );
  }

  createTransaction(data: CreateTransactionEntryDto | TransactionDto, file?: File | null): Observable<TransactionDto> {
    if (file) {
      const entry = data as CreateTransactionEntryDto;
      const billData: CreateTransactionFromBillDto = {
        merchantName: entry.title || (data as TransactionDto).name || '',
        totalAmount: entry.amount || (data as TransactionDto).totalAmount || 0,
        transactionDate: entry.transactionDate || (data as TransactionDto).transactionDate,
        isExpense: entry.isExpense ?? (data as TransactionDto).isExpense,
        note: entry.note ?? (data as TransactionDto).note,
        budgetId: entry.budgetId ?? (data as TransactionDto).budgetId,
        items: [
          {
            itemName: entry.title || (data as TransactionDto).name || '',
            category: entry.category || null,
            price: entry.amount || (data as TransactionDto).totalAmount || 0,
            quantity: 1,
            unit: 'cái',
          },
        ],
      };
      return this.createFromBill(billData, file);
    }

    return this.http.post<TransactionDto>(this.apiUrl, data).pipe(
      tap((resTransaction) => {
        this.upsertRemoteTransaction(resTransaction);
      }),
      catchError((err) => throwError(() => err))
    );
  }

  createFromBill(data: CreateTransactionFromBillDto, file: File | null): Observable<TransactionDto> {
    const formData = new FormData();
    if (data.merchantName) formData.append('MerchantName', data.merchantName);
    formData.append('TotalAmount', data.totalAmount.toString());
    if (data.transactionDate) formData.append('TransactionDate', data.transactionDate);

    if (data.items && data.items.length > 0) {
      formData.append('Items', JSON.stringify(data.items));
    }

    formData.append('IsExpense', data.isExpense !== undefined ? String(data.isExpense) : 'true');
    if (data.note) formData.append('Note', data.note);
    if (data.budgetId !== undefined && data.budgetId !== null) formData.append('BudgetId', data.budgetId.toString());

    if (file) {
      formData.append('image', file);
    }

    formData.append('billDto', JSON.stringify(data));

    return this.http.post<TransactionDto>(`${this.apiUrl}/from-bill`, formData).pipe(
      tap((transaction) => {
        this.upsertRemoteTransaction(transaction);
      }),
      catchError((err) => throwError(() => err))
    );
  }

  createFromAnalyze(
    data: {
      itemName: string;
      estimatedPriceVND: number;
      quantity?: number;
      category?: string | null;
      unit?: string | null;
      isExpense?: boolean;
      note?: string | null;
      budgetId?: number | null;
      transactionDate?: string | null;
    },
    file: File | null
  ): Observable<TransactionDto> {
    const formData = new FormData();
    formData.append('ItemName', data.itemName);
    formData.append('EstimatedPriceVND', data.estimatedPriceVND.toString());
    formData.append('Quantity', (data.quantity || 1).toString());
    formData.append('EstimatedCalories', '0');

    if (data.category) formData.append('Category', data.category);
    if (data.unit) formData.append('Unit', data.unit);
    if (data.transactionDate) formData.append('TransactionDate', data.transactionDate);

    formData.append('IsExpense', data.isExpense !== undefined ? String(data.isExpense) : 'true');
    if (data.note) formData.append('Note', data.note);

    if (data.budgetId !== undefined && data.budgetId !== null) {
      formData.append('BudgetId', data.budgetId.toString());
    } else {
      formData.append('BudgetId', '0');
    }

    if (file) {
      formData.append('image', file);
    }

    formData.append('data', JSON.stringify(data));

    return this.http.post<TransactionDto>(`${this.apiUrl}/from-analyze`, formData).pipe(
      tap((transaction) => {
        this.upsertRemoteTransaction(transaction);
      }),
      catchError((err) => throwError(() => err))
    );
  }

  updateTransaction(id: number, data: CreateTransactionEntryDto | TransactionDto): Observable<TransactionDto> {
    return this.http.put<TransactionDto>(`${this.apiUrl}/${id}`, data).pipe(
      tap((updatedTransaction) => {
        this.upsertRemoteTransaction(updatedTransaction);
      }),
      catchError((err) => throwError(() => err))
    );
  }

  deleteTransaction(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        const nextRemote = this.remoteTransactionsSubject.value.filter((t) => t.id !== id);
        this.remoteTransactionsSubject.next(nextRemote);

        const nextLocal = this.localTransactionsSubject.value.filter((t) => t.id !== id);
        this.localTransactionsSubject.next(nextLocal);
      }),
      catchError((err) => throwError(() => err))
    );
  }

  confirmItemPrices(transactionId: number, items: UpdateItemPriceDto[]): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${transactionId}/confirm-prices`, items).pipe(
      catchError((err) => throwError(() => err))
    );
  }

  getMissingPriceItems(transactionId: number): Observable<MissingPriceItemDto[]> {
    return this.http.get<MissingPriceItemDto[]>(`${this.detailApiUrl}/transaction/${transactionId}/missing-prices`).pipe(
      catchError((err) => throwError(() => err))
    );
  }

  createTransactionEntry(data: CreateTransactionEntryDto): Observable<TransactionDto> {
    const transaction = this.buildLocalTransaction(data);
    const nextTransactions = this.sortTransactions([
      transaction,
      ...this.localTransactionsSubject.value.filter(
        (existingTransaction) => existingTransaction.id !== transaction.id,
      ),
    ]);

    this.localTransactionsSubject.next(nextTransactions);
    return of(transaction);
  }

  getBudgetTransactions(budgetId: number): Observable<TransactionDto[]> {
    return this.http.get<TransactionDto[]>(`${this.baseUrl}Budget/history/${budgetId}`).pipe(
      map((transactions) => (transactions || []).map((t) => this.sanitizeTransaction(t))),
      catchError(() => of([]))
    );
  }

  private ensureTransactionsLoaded(): void {
    if (this.hasLoadedRemoteTransactions || this.isLoadingRemoteTransactions) {
      return;
    }

    this.isLoadingRemoteTransactions = true;

    this.http
      .get<TransactionDto[]>(`${this.apiUrl}/user`)
      .pipe(
        catchError(() => of([])),
        finalize(() => {
          this.isLoadingRemoteTransactions = false;
          this.hasLoadedRemoteTransactions = true;
        }),
      )
      .subscribe((transactions) => {
        const sanitized = transactions.map((t) => this.sanitizeTransaction(t));
        this.remoteTransactionsSubject.next(this.sortTransactions(sanitized));
      });
  }

  private sanitizeTransaction(t: TransactionDto): TransactionDto {
    const copy = { ...t };
    if (copy.name && copy.name.toLowerCase() === 'ai assistant') {
      if (copy.transactionDetails && copy.transactionDetails.length > 0) {
        copy.name = copy.transactionDetails[0].itemName || copy.name;
      }
    }
    return copy;
  }

  private upsertRemoteTransaction(transaction: TransactionDto): void {
    const sanitized = this.sanitizeTransaction(transaction);
    const nextTransactions = this.sortTransactions([
      sanitized,
      ...this.remoteTransactionsSubject.value.filter(
        (existingTransaction) => existingTransaction.id !== sanitized.id,
      ),
    ]);

    this.remoteTransactionsSubject.next(nextTransactions);
  }

  private buildLocalTransaction(data: CreateTransactionEntryDto): TransactionDto {
    const timestamp = Date.now();
    const user = this.accountService.currentUser();
    const transactionId = -timestamp;

    const transaction: TransactionDto = {
      id: transactionId,
      name: data.title.trim(),
      userId: user?.id || user?.email || 'local-user',
      imageKey: null,
      imagePreviewUrl: data.imagePreviewUrl ?? null,
      totalAmount: data.amount,
      transactionDate: new Date(
        data.transactionDate.includes('T') ? data.transactionDate : `${data.transactionDate}T12:00:00`
      ).toISOString(),
      status: 1,
      isAiEstimated: data.isAiEstimated ?? false,
      createdAt: new Date().toISOString(),
      note: data.note?.trim() || null,
      isExpense: data.isExpense,
      paymentMethod: data.paymentMethod?.trim() || null,
      source: data.source,
      transactionDetails: [
        {
          id: transactionId * 10,
          transactionId,
          categoryId: 0,
          categoryName: data.category?.trim() || null,
          itemName: data.title.trim(),
          price: data.amount,
          quantity: 1,
          unit: null,
          estimatedCalories: null,
        },
      ],
    };

    return this.sanitizeTransaction(transaction);
  }

  private mergeTransactions(
    remoteTransactions: TransactionDto[],
    localTransactions: TransactionDto[],
  ): TransactionDto[] {
    const transactionsById = new Map<number, TransactionDto>();

    for (const transaction of [...localTransactions, ...remoteTransactions]) {
      transactionsById.set(transaction.id, transaction);
    }

    return Array.from(transactionsById.values());
  }

  private sortTransactions(transactions: TransactionDto[]): TransactionDto[] {
    return [...transactions].sort(
      (left, right) =>
        new Date(right.transactionDate).getTime() - new Date(left.transactionDate).getTime(),
    );
  }
}
