import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Dashboard } from './dashboard';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';
import { LanguageService } from '../../../core/services/language-service';
import { TransactionService } from '../../../core/services/transaction.service';
import { BudgetService } from '../../../core/services/budget.service';
import { CategoryService } from '../../../core/services/category.service';
import { ToastService } from '../../../core/services/toast-service';
import { AccountService } from '../../../core/services/account-service';

describe('Dashboard', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;
  let mockLanguageService: any;
  let mockTransactionService: any;
  let mockBudgetService: any;
  let mockCategoryService: any;
  let mockToastService: any;
  let mockAccountService: any;

  beforeEach(async () => {
    mockLanguageService = {
      t: jasmine.createSpy('t').and.callFake((key: string) => key),
      locale: jasmine.createSpy('locale').and.returnValue('vi'),
      currentLang: jasmine.createSpy('currentLang').and.returnValue('vi'),
    };
    mockTransactionService = {
      getTransactions: jasmine.createSpy('getTransactions').and.returnValue(of([])),
    };
    mockBudgetService = {
      getBudgets: jasmine.createSpy('getBudgets').and.returnValue(of([
        { id: 1, name: 'Active Budget', amount: 8000000, startDate: '2026-07-01', endDate: '2026-07-31', period: 'MONTHLY' }
      ])),
    };
    mockCategoryService = {
      getCategories: jasmine.createSpy('getCategories').and.returnValue(of([])),
    };
    mockToastService = {
      success: jasmine.createSpy('success'),
      error: jasmine.createSpy('error'),
    };
    mockAccountService = {
      currentUser: jasmine.createSpy('currentUser').and.returnValue({ id: 1, name: 'Test User', email: 'test@example.com' }),
    };

    await TestBed.configureTestingModule({
      imports: [RouterTestingModule, Dashboard],
      providers: [
        provideHttpClient(),
        { provide: LanguageService, useValue: mockLanguageService },
        { provide: TransactionService, useValue: mockTransactionService },
        { provide: BudgetService, useValue: mockBudgetService },
        { provide: CategoryService, useValue: mockCategoryService },
        { provide: ToastService, useValue: mockToastService },
        { provide: AccountService, useValue: mockAccountService },
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the dashboard', () => {
    expect(component).toBeTruthy();
  });

  it('should load active budget from backend and update totalBudget', () => {
    expect(mockBudgetService.getBudgets).toHaveBeenCalled();
    expect(component.totalBudget).toBe(8000000);
  });

  it('should render 4 quick action cards', () => {
    const quickActionElements = fixture.nativeElement.querySelectorAll('.quick-action');
    expect(quickActionElements.length).toBe(4);
  });

  it('should open CreateBudgetModal when clicking budget card', () => {
    expect(component.isCreateBudgetOpen).toBeFalse();
    
    // Simulate clicking the card
    const createBudgetAction = component.quickActions.find(a => a.id === 'create-budget');
    expect(createBudgetAction).toBeTruthy();
    
    component.onQuickActionClick(createBudgetAction!);
    fixture.detectChanges();
    
    expect(component.isCreateBudgetOpen).toBeTrue();
    const modalElement = fixture.nativeElement.querySelector('app-create-budget-modal');
    expect(modalElement).toBeTruthy();
  });

  it('should close CreateBudgetModal on close event', () => {
    component.isCreateBudgetOpen = true;
    fixture.detectChanges();
    
    component.closeCreateBudgetModal();
    fixture.detectChanges();
    
    expect(component.isCreateBudgetOpen).toBeFalse();
    const modalElement = fixture.nativeElement.querySelector('app-create-budget-modal');
    expect(modalElement).toBeNull();
  });

  it('should reload budgets on budgetCreated event', () => {
    mockBudgetService.getBudgets.calls.reset();
    component.onBudgetCreated();
    expect(mockBudgetService.getBudgets).toHaveBeenCalled();
  });
});
