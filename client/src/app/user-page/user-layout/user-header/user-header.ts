import { Component, inject } from '@angular/core';
import { LanguageService } from '../../../core/services/language-service';

@Component({
  selector: 'app-user-header',
  imports: [],
  templateUrl: './user-header.html',
  styleUrl: './user-header.css',
})
export class UserHeader {
  protected readonly language = inject(LanguageService);
  readonly userName = 'Minh';
  readonly initials = 'M';
}
