import { Component } from '@angular/core';
import { Nav } from "./user-layout/nav/nav";
import { UserHeader } from './user-layout/user-header/user-header';


@Component({
  selector: 'app-user-page',
  imports: [UserHeader, Nav],
  templateUrl: './user-page.html',
  styleUrl: './user-page.css',
})
export class UserPage {
  showWarningBanner = true;
  showInsightBanner = true;
}
