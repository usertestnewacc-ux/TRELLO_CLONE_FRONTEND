import { Routes } from '@angular/router';
import { LandingComponent } from './landing.component';
import { LoginComponent } from './login.component';
import { RegisterComponent } from './register.component';
import { DashboardComponent } from './dashboard.component';
import { AdminComponent } from './admin.component';
import { WorkspacesComponent } from './workspaces.component';
import { BoardsComponent } from './boards.component';
import { ListsComponent } from './lists.component';
import { CardsComponent } from './cards.component';
import { CommentsComponent } from './comments.component';
import { AttachmentsComponent } from './attachments.component';
import { ActivityLogsComponent } from './activity-logs.component';
import { ReportsComponent } from './reports.component';
import { authGuard } from './auth.guard';
import { adminGuard } from './admin.guard';

export const routes: Routes = [
  { path: '', component: LandingComponent, pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard]
  },
  {
    path: 'workspaces',
    component: WorkspacesComponent,
    canActivate: [authGuard]
  },
  {
    path: 'boards',
    component: BoardsComponent,
    canActivate: [authGuard]
  },
  {
    path: 'lists',
    component: ListsComponent,
    canActivate: [authGuard]
  },
  {
    path: 'cards',
    component: CardsComponent,
    canActivate: [authGuard]
  },
  {
    path: 'cards/:cardId/comments',
    component: CommentsComponent,
    canActivate: [authGuard]
  },
  {
    path: 'cards/:cardId/attachments',
    component: AttachmentsComponent,
    canActivate: [authGuard]
  },
  {
    path: 'reports',
    component: ReportsComponent,
    canActivate: [adminGuard]
  },
  {
    path: 'activity-logs',
    component: ActivityLogsComponent,
    canActivate: [authGuard]
  },
  {
    path: 'admin',
    component: AdminComponent,
    canActivate: [adminGuard]
  },
  { path: '**', redirectTo: 'dashboard' }
];
