import { Component } from '@angular/core';

@Component({
  selector: 'app-user-header',
  imports: [],
  templateUrl: './user-header.html',
  styleUrl: './user-header.css',
})
export class UserHeader {
  readonly greeting = 'Hello, Minh';
  readonly subtitle = 'How much have you spent today?';
  readonly initials = 'M';
}
