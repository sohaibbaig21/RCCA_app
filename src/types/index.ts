// Database interfaces - easily adaptable to MongoDB
export interface User {
  id: string;
  name: string;
  email?: string; // Derived from id + @gmail.com
}

export interface RCCA {
  id: string;
  title: string;
  description: string;
  department: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'Draft' | 'Submitted' | 'In Progress' | 'Completed';
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
  completedAt?: Date;
  assignedMembers: string[]; // User IDs
  
  // RCCA Form sections
  problemDescription: string;
  beforeImages: string[];
  afterImages: string[];
  immediateActions: string;
  rootCauseAnalysis: {
    whys: string[]; // Dynamic number of whys
  };
  correctiveActions: string;
  preventiveActions: string;
  verification: string;
  followUp: string;
}

export interface DashboardStats {
  totalRCCAs: number;
  openInProgress: number;
  overdue: number;
  completed: number;
  averageResolutionTime: number; // in days
  weeklyTrend: number[];
  monthlyTrend: number[];
}

export interface FilterOptions {
  search: string;
  department: string;
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  priority: string;
  status: string;
  createdBy: string;
}