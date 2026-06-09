import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Nav } from './user-layout/nav/nav';

@Component({
  selector: 'app-user-page',
  standalone: true,
  imports: [Nav, RouterOutlet],
  templateUrl: './user-page.html',
  styleUrl: './user-page.css',
})
export class UserPage {}
