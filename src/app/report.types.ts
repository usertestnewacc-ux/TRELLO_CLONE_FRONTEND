export interface ChartSegment {
  label: string;
  value: number;
}

export interface DashboardReport {
  totalWorkspaces: number;
  totalBoards: number;
  totalLists: number;
  totalCards: number;
  averageCardsPerList: number;
  completedTasks: number;
  inProgressTasks: number;
  toDoTasks: number;
  overdueTasks: number;
  highPriorityTasks: number;
  mediumPriorityTasks: number;
  lowPriorityTasks: number;
  statusBreakdown: ChartSegment[];
  priorityBreakdown: ChartSegment[];
  assigneeBreakdown: ChartSegment[];
}
