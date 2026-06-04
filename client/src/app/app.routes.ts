import { Routes } from '@angular/router';
import { App } from './app';
import { UserPage } from './user-page/user-page';
import { authGuard } from './core/_guard/auth-guard';
import { Login } from './user-page/features/login/login';

export const routes: Routes = [
    {
        path: '',
        runGuardsAndResolvers: 'always',
        canActivate: [authGuard],
        children: [
            {   path: 'trang-chu', redirectTo: 'UserPage', pathMatch: 'full' },  
            { path: 'UserPage', component: UserPage   }
        ]
    },
    
    //public routerlink
    { path: 'dang-nhap', component: Login },
];
