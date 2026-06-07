import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { DashboardReport } from './report.types';

@Injectable({ providedIn: 'root' })
export class ReportService {
  private http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:5108/api';

  getDashboardReport(): Promise<DashboardReport> {
    return firstValueFrom(this.http.get<DashboardReport>(`${this.apiUrl}/reports/dashboard`));
  }
}
