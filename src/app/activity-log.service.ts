import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ActivityLogItem } from './activity-log.types';

@Injectable({ providedIn: 'root' })
export class ActivityLogService {
  private http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:5108/api';

  getAllLogs(): Promise<ActivityLogItem[]> {
    return firstValueFrom(this.http.get<ActivityLogItem[]>(`${this.apiUrl}/activityLogs`));
  }

  getLogsByEntity(entityType: string, entityId: string): Promise<ActivityLogItem[]> {
    return firstValueFrom(
      this.http.get<ActivityLogItem[]>(`${this.apiUrl}/activityLogs/entity/${entityType}/${entityId}`)
    );
  }

  getLogsByUser(userId: string): Promise<ActivityLogItem[]> {
    return firstValueFrom(
      this.http.get<ActivityLogItem[]>(`${this.apiUrl}/activityLogs/user/${userId}`)
    );
  }
}
