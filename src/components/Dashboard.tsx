import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  Users, 
  FileText, 
  Plus, 
  Search, 
  X, 
  Eye, 
  Download, 
  AlertCircle, 
  CheckCircle, 
  BarChart3,
  PieChart,
  Sun,
  Moon,
  Edit as EditIcon,
  Clock,
  Bell,
  Menu,
  Filter as FilterIcon,
  Trash2
} from 'lucide-react';
import { rccaService, userService, getNotifications, approveRCCA, rejectRCCA, markNotificationRead } from '../services/api';
import ExcelUpload from './ExcelUpload';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip as ChartTooltip,
  Legend
} from 'chart.js';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ChartDataLabels from 'chartjs-plugin-datalabels';
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, ChartTooltip, Legend, ChartDataLabels);

// Tooltip Component with new design
const Tooltip: React.FC<{ content: string; children: React.ReactNode }> = ({ content, children }) => {
  return (
    <div className="tooltip-container" style={{ 
      display: 'inline-block', 
      position: 'relative',
      cursor: 'help'
    }}>
      {children}
      <div className="tooltip" style={{
        position: 'absolute',
        bottom: '100%',
        left: '50%',
        transform: 'translateX(-50%)',
        marginBottom: '8px',
        padding: '8px 12px',
        background: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        borderRadius: '6px',
        fontSize: '12px',
        lineHeight: '1.4',
        opacity: 0,
        visibility: 'hidden',
        transition: 'opacity 0.2s, visibility 0.2s',
        zIndex: 1000,
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        width: '280px',
        textAlign: 'left',
        wordWrap: 'break-word',
        whiteSpace: 'normal'
      }}>
        {content}
        <div style={{
          position: 'absolute',
          top: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          border: '4px solid transparent',
          borderTopColor: 'rgba(0, 0, 0, 0.8)'
        }}></div>
      </div>
      <style>{`
        .tooltip-container:hover .tooltip {
          opacity: 1 !important;
          visibility: visible !important;
        }
      `}</style>
    </div>
  );
};

interface DashboardProps {
  user: any;
  isAdmin: boolean;
  onLogout: () => void;
  onNewRCCA: () => void;
  onViewRCCAs: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

const factoryOptions = ['DPL 1', 'DPL 2', 'URIL'];
const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const factoryColors: Record<string, string> = {
  'DPL 1': 'rgba(255, 99, 132, 1)',
  'DPL 2': 'rgba(54, 162, 235, 1)',
  'URIL': 'rgba(255, 206, 86, 1)'
};

const Dashboard: React.FC<DashboardProps> = ({ user, isAdmin, onLogout, onNewRCCA, onViewRCCAs, darkMode, onToggleDarkMode }) => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rccas, setRccas] = useState<any[]>([]);
  const [pendingRCCAs, setPendingRCCAs] = useState<any[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedFactory, setSelectedFactory] = useState<string>('All');
  const [selectedDepartmentFactory, setSelectedDepartmentFactory] = useState<string>('All');
  const [selectedEmployeeFactory, setSelectedEmployeeFactory] = useState<string>('All');
  const [showExcelUpload, setShowExcelUpload] = useState(false);
  const [showHamburgerMenu, setShowHamburgerMenu] = useState(false);
  const [showGroupedBarChart, setShowGroupedBarChart] = useState(false);
  const [showTotalRCCAsSection, setShowTotalRCCAsSection] = useState(false);
  const [showPendingApprovalSection, setShowPendingApprovalSection] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [viewingRCCA, setViewingRCCA] = useState<any>(null);
  const [showDrafts, setShowDrafts] = useState(false);
  const [showApprovedSection, setShowApprovedSection] = useState(false);
  const [showDraftsSection, setShowDraftsSection] = useState(false);
  const [showRejectedSection, setShowRejectedSection] = useState(false);
  const navigate = useNavigate();
  const [trendPeriod, setTrendPeriod] = useState<'Custom' | 'All Time'>('Custom');
  const [customRange, setCustomRange] = useState<{ from: Date; to: Date } | null>(() => {
    // Default to last 7 days
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - 6);
    from.setHours(0, 0, 0, 0);
    to.setHours(23, 59, 59, 999);
    return { from, to };
  });
  const [showDepartmentPieFullscreen, setShowDepartmentPieFullscreen] = useState(false);
  const [selectedParetoFactory, setSelectedParetoFactory] = useState<string>('All');
  const [showTrendChartFullscreen, setShowTrendChartFullscreen] = useState(false);
  // Animation modal states (move here)
  const errorCategoryOptions = [
    'Human Error',
    'Equipment Failure',
    'Process Deviation',
    'Material Defect',
    'External Factors',
    'Design Flaw',
    'Maintenance Lapse',
    'Measurement Error',
    'Training Gap',
    'Communication Failure',
    'Documentation Error',
    'Software/Control Error',
    'Environmental Condition',
    'Logistics/Handling Issue',
    'Time Constraint',
    'Unknown'
  ];
  const paretoData = useMemo(() => {
    let filtered = rccas;
    if (selectedParetoFactory !== 'All') {
      filtered = filtered.filter(r => r.factoryName === selectedParetoFactory);
    }
    // Debug log
    console.log('Pareto RCCAs:', filtered.map(r => ({ errorCategory: r.errorCategory, factoryName: r.factoryName, status: r.status, id: r._id || r.id })));
    const counts: Record<string, number> = {};
    for (const cat of errorCategoryOptions) counts[cat] = 0;
    for (const r of filtered) {
      if (r.errorCategory && errorCategoryOptions.includes(r.errorCategory)) {
        counts[r.errorCategory]++;
      }
    }
    const sorted = Object.entries(counts)
      .filter(([cat, count]) => count > 0)
      .sort((a, b) => b[1] - a[1]);
    const labels = sorted.map(([cat]) => cat);
    const data = sorted.map(([, count]) => count);
    const total = data.reduce((a, b) => a + b, 0);
    let cumSum = 0;
    const cumulative = data.map(v => {
      cumSum += v;
      return Math.round((cumSum / total) * 100);
    });
    // Improved color palette: shocking pink and more
    const barColors = [
      '#FF69B4', // shocking pink
      '#FF1493', // deep pink
      '#FF6F91', // light shocking pink
      '#FF8DA1', // pastel pink
      '#FFB3DE', // light pink
      '#C71585', // medium violet red
      '#FF85A1', // another pink
      '#FFB6C1', // light pink
      '#FF5C8A', // vibrant pink
      '#FF3E96', // hot pink
      '#FF69B4', // shocking pink again if more needed
      '#FF1493',
      '#FF6F91',
      '#FF8DA1',
      '#FFB3DE'
    ];
    return {
      labels,
      datasets: [
        {
          type: 'bar' as const,
          label: 'RCCAs',
          data,
          backgroundColor: '#FF69B4', // shocking pink
          borderColor: '#FF69B4',
          borderWidth: 2,
          yAxisID: 'y',
          barPercentage: 0.6,
          categoryPercentage: 0.6,
          order: 1,
        },
        {
          type: 'line' as const,
          label: 'Cumulative %',
          data: cumulative,
          borderColor: 'rgba(54, 162, 235, 1)',
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          yAxisID: 'y1',
          fill: false,
          tension: 0.3,
          pointRadius: 3,
          order: 99,
        },
      ],
    };
  }, [rccas, selectedParetoFactory]);
  const paretoOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const },
      title: {
        display: true,
        text: 'Pareto Chart: Error Categories',
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            if (context.dataset.type === 'line') {
              return `Cumulative: ${context.parsed.y}%`;
            }
            // Show count as whole number, starting from 1
            return `Count: ${context.parsed.y}`;
          },
        },
      },
      datalabels: {
        display: false
      } as any,
    },
    layout: {
      padding: { top: 30, bottom: 10 }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: 'RCCA Count' },
        ticks: {
          stepSize: 1,
          callback: function(value: any) {
            if (value >= 0) return value;
            return '';
          },
        },
        min: 0, // Set to 0 for a natural baseline
      },
      y1: {
        beginAtZero: true,
        position: 'right' as const,
        grid: { drawOnChartArea: false },
        title: { display: true, text: 'Cumulative %' },
        min: 0,
        max: 100,
        ticks: { stepSize: 20 },
      },
    },
  };

  // Fetch dashboard stats and initial data
  useEffect(() => {
    const loadStats = async () => {
      try {
        const dashboardStats = await rccaService.getDashboardStats();
        setStats(dashboardStats);
      } catch (error) {
        console.error('Error loading stats:', error);
      }
    };

    const fetchRCCAs = async () => {
      try {
        const data = await rccaService.getRCCAs();
        setRccas(data);
      } catch (error) {
        console.error('Error fetching RCCAs:', error);
      }
    };

    const fetchPendingRCCAs = async () => {
      console.log('Initial fetchPendingRCCAs called, isAdmin:', isAdmin, 'user:', user);
      try {
        if (isAdmin) {
          const submittedRCCAs = await rccaService.getSubmittedRCCAs();
          console.log('Initial Admin - submittedRCCAs:', submittedRCCAs);
          setPendingRCCAs(submittedRCCAs);
        } else if (user) {
          const submittedRCCAs = await rccaService.getSubmittedRCCAs();
          console.log('Initial Employee - all submittedRCCAs:', submittedRCCAs);
          const userPendingRCCAs = submittedRCCAs.filter(r => {
            const rccaCreatedBy = String(r.createdBy || '').trim();
            const currentUserId = String(user.id || '').trim();
            console.log('Initial Comparing:', rccaCreatedBy, 'with:', currentUserId);
            return rccaCreatedBy === currentUserId;
          });
          console.log('Initial Employee - filtered userPendingRCCAs:', userPendingRCCAs);
          setPendingRCCAs(userPendingRCCAs);
        }
      } catch (error) {
        console.error('Error fetching pending RCCAs:', error);
      }
    };

    const loadAllData = async () => {
      try {
        await Promise.all([loadStats(), fetchRCCAs(), fetchPendingRCCAs()]);
        setLoading(false);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setLoading(false);
      }
    };

    loadAllData();
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, [isAdmin, user]);

  // Fetch all users
  useEffect(() => { 
    userService.getAllUsers().then(users => {
      console.log('Loaded users:', users); // Debug log
      // Log all users with their factories
      users.forEach(user => {
        console.log(`User: ${user.name}, ID: ${user.id}, Factory: ${user.factory}`);
      });
      setUsers(users);
    }); 
  }, []);

  // Fetch notifications
  useEffect(() => {
    if (user && user.id) getNotifications(user.id).then(setNotifications);
  }, [user]);

  // Debug: Log pendingRCCAs changes
  useEffect(() => {
    console.log('pendingRCCAs state changed:', pendingRCCAs);
    console.log('pendingRCCAs.length:', pendingRCCAs.length);
    console.log('showPendingApprovalSection:', showPendingApprovalSection);
  }, [pendingRCCAs, showPendingApprovalSection]);

  // Listen for RCCA submission events and refresh data
  useEffect(() => {
    const handleRCCASubmitted = () => {
      refreshDashboardData();
    };

    const handleRCCAResubmitted = (event: any) => {
      const rccaId = event.detail?.rccaId;
      console.log('RCCA resubmitted event received:', rccaId);
      if (rccaId) {
        console.log('Before resubmission - Rejected count:', rccas.filter(r => r.status === 'Rejected').length);
        console.log('Before resubmission - Pending count:', pendingRCCAs.length);
        
        // Immediately update the RCCA status to Resubmitted in local state
        setRccas(prev => {
          const updated = prev.map(r => 
            (r._id || r.id) === rccaId 
              ? { ...r, status: 'Resubmitted' }
              : r
          );
          console.log('After resubmission - Rejected count:', updated.filter(r => r.status === 'Rejected').length, 'rejected RCCAs');
          return updated;
        });
        
        // Immediately refresh pending RCCAs to show the new submission
        console.log('Immediately refreshing pending RCCAs...');
        refreshPendingRCCAs();
        
        // Force refresh all data to ensure proper state from backend
        setTimeout(() => {
          console.log('Refreshing dashboard data after 500ms...');
          refreshDashboardData();
          refreshPendingRCCAs();
        }, 500);
        
        // Additional refresh after 1 second to ensure backend changes are reflected
        setTimeout(() => {
          console.log('Final refresh after 1 second...');
          refreshDashboardData();
          refreshPendingRCCAs();
          
          // Log the final counts for debugging
          console.log('Final counts after resubmission:');
          console.log('- Rejected count:', rccas.filter(r => r.status === 'Rejected').length);
          console.log('- Pending count:', pendingRCCAs.length);
          
          // Show success notification to user
          addNotification({ 
            type: 'success', 
            message: 'RCCA resubmitted successfully. The rejected count has decreased and the RCCA is now pending approval.' 
          });
        }, 1000);
      }
    };

    // Listen for custom events when RCCA is submitted or resubmitted
    window.addEventListener('rcca-submitted', handleRCCASubmitted);
    window.addEventListener('rcca-resubmitted', handleRCCAResubmitted);
    
    // Periodic refresh for pending RCCAs (every 30 seconds)
    const interval = setInterval(() => {
      refreshPendingRCCAs();
    }, 30000);

    return () => {
      window.removeEventListener('rcca-submitted', handleRCCASubmitted);
      window.removeEventListener('rcca-resubmitted', handleRCCAResubmitted);
      clearInterval(interval);
    };
  }, [user, isAdmin]);

  // Refresh pending RCCAs function
  const refreshPendingRCCAs = async () => {
    console.log('refreshPendingRCCAs called, isAdmin:', isAdmin, 'user:', user);
    try {
      if (isAdmin) {
        const submittedRCCAs = await rccaService.getSubmittedRCCAs();
        console.log('Admin - submittedRCCAs:', submittedRCCAs);
        console.log('Admin - submittedRCCAs count:', submittedRCCAs.length);
        setPendingRCCAs(submittedRCCAs);
      } else if (user) {
        const submittedRCCAs = await rccaService.getSubmittedRCCAs();
        console.log('Employee - all submittedRCCAs:', submittedRCCAs);
        console.log('Employee - all submittedRCCAs count:', submittedRCCAs.length);
        const userPendingRCCAs = submittedRCCAs.filter(r => {
          const rccaCreatedBy = String(r.createdBy || '').trim();
          const currentUserId = String(user.id || '').trim();
          console.log('Comparing:', rccaCreatedBy, 'with:', currentUserId);
          return rccaCreatedBy === currentUserId;
        });
        console.log('Employee - filtered userPendingRCCAs:', userPendingRCCAs);
        console.log('Employee - filtered userPendingRCCAs count:', userPendingRCCAs.length);
        setPendingRCCAs(userPendingRCCAs);
      }
    } catch (error) {
      console.error('Error in refreshPendingRCCAs:', error);
    }
  };

  // Refresh all data when needed
  const refreshDashboardData = async () => {
    try {
      // Refresh RCCAs - include rejected ones for chart purposes
      const data = await rccaService.getRCCAs();
      setRccas(data);
      
      // Refresh pending RCCAs
      await refreshPendingRCCAs();
      
      // Refresh stats
      const dashboardStats = await rccaService.getDashboardStats();
      setStats(dashboardStats);
    } catch (error) {
      console.error('Error refreshing dashboard data:', error);
    }
  };

  // Helper: userId to name
  const userIdToName = (id: string) => {
    const u = users.find(u => String(u.id).trim() === String(id).trim());
    // Debug log for specific employee
    if (id && u?.name === 'farjad') {
      console.log('userIdToName debug for farjad:', { id, user: u });
    }
    return u ? u.name : id;
  };

  // Helper: userId to name with factory
  const userIdToNameWithFactory = (id: string) => {
    const u = users.find(u => String(u.id).trim() === String(id).trim());
    if (!u) return id;
    return `${u.name} (${u.factory || 'DPL 1'})`;
  };

  // Helper: can user edit RCCA
  const canUserEditRCCA = (rcca: any): boolean => {
    if (!user) return false;
    
    // For draft status: Always allow editing
    if (rcca.status === 'Draft') {
      return true;
    }
    
    // Check if RCCA has the new permission system
    if (rcca.editingPermissions) {
      const permissions = rcca.editingPermissions;
      
      // Creator always has permission
      if (permissions.creator === user.id) {
        return true;
      }
      
      // Admins have permission
      if (isAdmin && permissions.admins.includes(user.id)) {
        return true;
      }
      
      // For submitted status: Only creator and admins can edit
      if (rcca.status !== 'Draft') {
        return false; // Only creator and admins handled above
      }
      
      return false;
    }
    
    // Fallback for old RCCAs without permission system
    if (isAdmin) {
      // If approved, only allow editing within 7 days of approval
      if (rcca.status === 'Approved') {
        // Try to get the approval date
        const approvedDate = rcca.approvedAt || rcca.updatedAt || rcca.completedAt || rcca.createdAt;
        if (!approvedDate) return false;
        const approvedTime = new Date(approvedDate).getTime();
        const now = Date.now();
        const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
        if (now - approvedTime > sevenDaysMs) {
          return false;
        }
      }
      return true;
    }
    if (String(rcca.createdBy).trim() === String(user.id).trim()) return true;
    if (rcca.assignedMembers && Array.isArray(rcca.assignedMembers)) {
      return rcca.assignedMembers.some((member: any) => {
        const memberId = typeof member === 'string' ? member : member.id;
        return String(memberId).trim() === String(user.id).trim();
      });
    }
    return false;
  };
  
  // Trend chart data functions
  function getStartOfWeek(date: Date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function getStartOfMonth(date: Date) {
    const d = new Date(date);
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function getTrendLine(rccas: Array<any>, factory?: string, period: 'Custom' | 'All Time' = 'Custom', customRange?: { from: Date; to: Date } | null) {
    let start: Date;
    let dataPoints: number;
    let timeWindow: number;
    
    if (period === 'All Time') {
      // For all time, we'll group by months to show a reasonable trend
      const allRccas = rccas.filter(r => r.createdAt);
      if (allRccas.length === 0) return Array(12).fill(0);
      
      const dates = allRccas.map(r => new Date(r.createdAt)).sort((a, b) => a.getTime() - b.getTime());
      const earliest = dates[0];
      const latest = dates[dates.length - 1];
      
      // Calculate months between earliest and latest
      const monthsDiff = (latest.getFullYear() - earliest.getFullYear()) * 12 + (latest.getMonth() - earliest.getMonth()) + 1;
      dataPoints = Math.max(12, Math.min(monthsDiff, 24)); // Between 12 and 24 months
      
      start = new Date(earliest.getFullYear(), earliest.getMonth(), 1);
      timeWindow = dataPoints * 30 * 24 * 60 * 60 * 1000; // Approximate
    } else if (period === 'Custom' && customRange) {
      start = new Date(customRange.from);
      dataPoints = Math.max(1, Math.floor((customRange.to.getTime() - customRange.from.getTime()) / (24 * 60 * 60 * 1000)) + 1);
      timeWindow = (customRange.to.getTime() - customRange.from.getTime()) + 24 * 60 * 60 * 1000;
    } else {
      // Default to custom range
      start = customRange ? new Date(customRange.from) : new Date();
      dataPoints = 7;
      timeWindow = 7 * 24 * 60 * 60 * 1000;
    }
    
    const trend = Array(dataPoints).fill(0);
    rccas.forEach((rcca: any) => {
      if (!rcca.createdAt) return;
      const rccaFactory = (rcca.factoryName || '').trim().toLowerCase();
      const filterFactory = (factory || '').trim().toLowerCase();
      if (factory && rccaFactory !== filterFactory) return;
      const created = new Date(rcca.createdAt);
      
      if (period === 'All Time') {
        // For all time, group by month
        const monthIndex = (created.getFullYear() - start.getFullYear()) * 12 + (created.getMonth() - start.getMonth());
        if (monthIndex >= 0 && monthIndex < dataPoints) {
          trend[monthIndex]++;
        }
      } else if (created >= start && created < new Date(start.getTime() + timeWindow)) {
        // For custom range, group by day
        const index = Math.floor((created.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
        if (index >= 0 && index < dataPoints) {
          trend[index]++;
        }
      }
    });
    return trend;
  }

  // Department chart data
  const departmentChartData = useMemo(() => {
    // Filter RCCAs based on selected factory and exclude those without departments
    const filteredRccas = selectedDepartmentFactory === 'All' 
      ? rccas.filter(r => r.department && r.department.trim() !== '')
      : rccas.filter(r => r.factoryName === selectedDepartmentFactory && r.department && r.department.trim() !== '');

    // Count RCCAs by department
    const departmentCounts: { [key: string]: number } = {};
    filteredRccas.forEach(rcca => {
      const dept = rcca.department.trim();
      departmentCounts[dept] = (departmentCounts[dept] || 0) + 1;
    });

    // Convert to chart data format
    const departments = Object.keys(departmentCounts);
    const counts = Object.values(departmentCounts);
    
    // Generate vibrant colors for departments
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
      '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2'
    ];

    return {
      labels: departments,
      datasets: [{
        data: counts,
        backgroundColor: departments.map((_, index) => colors[index % colors.length]),
        borderColor: '#ffffff',
        borderWidth: 3,
        hoverBorderColor: '#ffffff',
        hoverBorderWidth: 4,
      }]
    };
  }, [rccas, selectedDepartmentFactory]);

  // Get the appropriate department chart data
  const currentDepartmentChartData = useMemo(() => {
    return departmentChartData;
  }, [departmentChartData]);

  const departmentChartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12
          }
        }
      },
      title: { 
        display: false 
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#ffffff',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: (context: any) => {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    },
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 1000
    },
    elements: {
      arc: {
        borderWidth: 3,
        borderColor: '#ffffff'
      }
    }
  }), []);

  const chartData = useMemo(() => {
    let labels: string[] = [];
    let dataPoints = 7;
    
    if (trendPeriod === 'All Time') {
      // For all time, group by months
      const allRccas = rccas.filter(r => r.createdAt);
      if (allRccas.length === 0) {
        dataPoints = 12;
        labels = Array.from({ length: 12 }, (_, i) => {
          const d = new Date();
          d.setMonth(d.getMonth() - 11 + i);
          return d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
        });
      } else {
        const dates = allRccas.map(r => new Date(r.createdAt)).sort((a, b) => a.getTime() - b.getTime());
        const earliest = dates[0];
        const latest = dates[dates.length - 1];
        const monthsDiff = (latest.getFullYear() - earliest.getFullYear()) * 12 + (latest.getMonth() - earliest.getMonth()) + 1;
        dataPoints = Math.max(12, Math.min(monthsDiff, 24));
        
        labels = Array.from({ length: dataPoints }, (_, i) => {
          const d = new Date(earliest.getFullYear(), earliest.getMonth() + i, 1);
          return d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
        });
      }
    } else if (trendPeriod === 'Custom' && customRange) {
      // For custom range, group by days
      const from = customRange.from;
      const to = customRange.to;
      dataPoints = Math.max(1, Math.floor((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000)) + 1);
      labels = Array.from({ length: dataPoints }, (_, i) => {
        const d = new Date(from);
        d.setDate(from.getDate() + i);
        return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      });
    } else {
      // Default fallback
      dataPoints = 7;
      labels = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - 6 + i);
        return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
      });
    }
    
    if (selectedFactory === 'All') {
      return {
        labels,
        datasets: factoryOptions.map(fac => ({
          label: fac,
          data: getTrendLine(rccas, fac, trendPeriod, customRange),
          borderColor: factoryColors[fac],
          backgroundColor: factoryColors[fac],
          tension: 0.3,
          fill: false,
          pointRadius: 5,
          pointHoverRadius: 7,
          borderWidth: 3
        }))
      };
    } else {
      return {
        labels,
        datasets: [
          {
            label: selectedFactory,
            data: getTrendLine(rccas, selectedFactory, trendPeriod, customRange),
            borderColor: factoryColors[selectedFactory],
            backgroundColor: factoryColors[selectedFactory],
            tension: 0.3,
            fill: false,
            pointRadius: 5,
            pointHoverRadius: 7,
            borderWidth: 3
          }
        ]
      };
    }
  }, [rccas, selectedFactory, trendPeriod, customRange]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: false }
    },
    indexAxis: 'y' as const,
    scales: {
      x: {
        beginAtZero: true,
        ticks: { stepSize: 1 }
      },
      y: {
        ticks: {
          maxRotation: trendPeriod === 'All Time' ? 45 : 0,
          minRotation: 0
        }
      }
    }
  }), [trendPeriod]);

  // Employee RCCA Statistics - Grouped Bar Chart data
  const [topN, setTopN] = useState<number>(10);
  const [currentEmployeePage, setCurrentEmployeePage] = useState<number>(1);
  const employeeRCCAChartData = useMemo(() => {
    // Get all unique employees who have created RCCAs
    const employeeStats: { [key: string]: { approved: number; rejected: number; pending: number; total: number; factory: string } } = {};
    

    
    // Process main RCCAs (approved, rejected, etc.)
    rccas.forEach(rcca => {
      const employeeId = rcca.createdBy;
      const employeeName = userIdToName(employeeId);
      // Find user by ID first, then by name as fallback
      let user = users.find(u => String(u.id).trim() === String(employeeId).trim());
      if (!user) {
        // Try by name as fallback
        user = users.find(u => u.name.toLowerCase() === employeeName.toLowerCase());
      }
      const employeeFactory = user?.factory || 'DPL 1';
      
      // Debug log for specific employee
      if (employeeName === 'farjad') {
        console.log('Farjad debug:', { employeeId, employeeName, user, employeeFactory });
      }
      
      // Debug log for all RCCAs to see the data structure
      if (rcca.createdBy) {
        console.log(`RCCA createdBy: ${rcca.createdBy}, Employee Name: ${employeeName}, Factory: ${employeeFactory}`);
      }
      
      // Apply factory filter
      if (selectedEmployeeFactory !== 'All' && employeeFactory !== selectedEmployeeFactory) {
        return;
      }
      
      if (!employeeStats[employeeName]) {
        employeeStats[employeeName] = { approved: 0, rejected: 0, pending: 0, total: 0, factory: employeeFactory };
      }
      
      employeeStats[employeeName].total++;
      
      switch (rcca.status) {
        case 'Approved':
          employeeStats[employeeName].approved++;
          break;
        case 'Rejected':
          // Check if this rejected RCCA has been resubmitted
          const hasPendingResubmission = pendingRCCAs.some(pending => 
            pending.originalRCCAId === (rcca._id || rcca.id) || 
            pending.notificationNumber === rcca.notificationNumber
          );
          // Only count as rejected if it hasn't been resubmitted
          if (!hasPendingResubmission) {
            employeeStats[employeeName].rejected++;
          }
          break;
        case 'Resubmitted':
          // Don't count resubmitted RCCAs in any category as they're now in pending
          break;
        // Don't count 'Submitted' from main collection as pending - only count from pendingRCCAs
        case 'Draft':
        case 'In Progress':
          employeeStats[employeeName].pending++;
          break;
      }
    });

    // Process pending RCCAs (those still awaiting approval)
    pendingRCCAs.forEach(rcca => {
      const employeeId = rcca.createdBy;
      const employeeName = userIdToName(employeeId);
      // Find user by ID first, then by name as fallback
      let user = users.find(u => String(u.id).trim() === String(employeeId).trim());
      if (!user) {
        // Try by name as fallback
        user = users.find(u => u.name.toLowerCase() === employeeName.toLowerCase());
      }
      const employeeFactory = user?.factory || 'DPL 1';
      
      // Apply factory filter
      if (selectedEmployeeFactory !== 'All' && employeeFactory !== selectedEmployeeFactory) {
        return;
      }
      
      if (!employeeStats[employeeName]) {
        employeeStats[employeeName] = { approved: 0, rejected: 0, pending: 0, total: 0, factory: employeeFactory };
      }
      
      // Only count as pending if it's still in submitted status
      if (rcca.status === 'Submitted') {
        employeeStats[employeeName].pending++;
        employeeStats[employeeName].total++;
      }
    });

    // Convert to chart data format
    let employees = Object.keys(employeeStats);
    // Sort employees by total RCCAs (descending)
    employees.sort((a, b) => employeeStats[b].total - employeeStats[a].total);
    // Pagination logic
    let paginatedEmployees = employees;
    let totalPages = 1;
    if (topN !== -1) { // -1 means 'All'
      totalPages = Math.ceil(employees.length / topN);
      const startIdx = (currentEmployeePage - 1) * topN;
      paginatedEmployees = employees.slice(startIdx, startIdx + topN);
    }
    const approvedData = paginatedEmployees.map(emp => employeeStats[emp].approved);
    const rejectedData = paginatedEmployees.map(emp => employeeStats[emp].rejected);
    const pendingData = paginatedEmployees.map(emp => employeeStats[emp].pending);
    const employeeLabels = paginatedEmployees.map(emp => {
      const employeeFactory = employeeStats[emp].factory;
      return `${emp} (${employeeFactory})`;
    });
    return {
      labels: employeeLabels,
      datasets: [
        {
          label: 'Approved',
          data: approvedData,
          backgroundColor: '#10B981',
          borderColor: '#10B981',
          borderWidth: 1,
        },
        {
          label: 'Rejected',
          data: rejectedData,
          backgroundColor: '#EF4444',
          borderColor: '#EF4444',
          borderWidth: 1,
        },
        {
          label: 'Pending',
          data: pendingData,
          backgroundColor: '#F59E0B',
          borderColor: '#F59E0B',
          borderWidth: 1,
        }
      ],
      totalPages,
      totalEmployees: employees.length
    };
  }, [rccas, pendingRCCAs, users, selectedEmployeeFactory, topN, currentEmployeePage]);

  // Drafts count
  function getLocalDrafts() {
    try {
      const draftsJSON = localStorage.getItem('rccaDrafts') || '[]';
      const drafts = JSON.parse(draftsJSON);
      if (!user) return [];
      return drafts.filter((d: any) => {
        // Check if user is creator
        if (d.createdBy === user.id) return true;
        
        // Check if user is a team member (for new permission system)
        if (d.editingPermissions && d.editingPermissions.teamMembers.includes(user.id)) return true;
        
        // Check if user is a team member (for old system)
        if (d.assignedMembers && Array.isArray(d.assignedMembers)) {
          return d.assignedMembers.some((member: any) => {
            const memberId = typeof member === 'string' ? member : member.id;
            return String(memberId).trim() === String(user.id).trim();
          });
        }
        
        return false;
      });
    } catch { return []; }
  }
  let draftCount = 0;
  if (isAdmin) {
    // Count drafts from both rccas and pendingRCCAs
    const rccasDrafts = rccas.filter(r => r.status === 'Draft').length;
    const pendingDrafts = pendingRCCAs.filter(r => r.status === 'Draft').length;
    draftCount = rccasDrafts + pendingDrafts;
  } else {
    // For non-admin users, count their drafts from both sources
    const backendDrafts = rccas.filter(r => r.status === 'Draft' && canUserEditRCCA(r));
    const pendingDrafts = pendingRCCAs.filter(r => r.status === 'Draft' && canUserEditRCCA(r));
    const localDrafts = getLocalDrafts();
    const allDraftsMap = new Map();
    for (const d of [...backendDrafts, ...pendingDrafts, ...localDrafts]) allDraftsMap.set(d.id, d);
    draftCount = allDraftsMap.size;
  }

  // Stat cards - use useMemo to recalculate when rccas or pendingRCCAs change
  const statCards = useMemo(() => {
    // Exclude resubmitted RCCAs from rejected count - they should not be counted as rejected anymore
    const rejectedCount = isAdmin 
      ? rccas.filter(r => {
        // Check if there's a corresponding pending RCCA (which means it was resubmitted)
        const hasPendingResubmission = pendingRCCAs.some(pending => 
          pending.originalRCCAId === (r._id || r.id) || 
          pending.notificationNumber === r.notificationNumber
        );
        return r.status === 'Rejected' && !hasPendingResubmission;
      }).length 
      : rccas.filter(r => {
        // Check if there's a corresponding pending RCCA (which means it was resubmitted)
        const hasPendingResubmission = pendingRCCAs.some(pending => 
          pending.originalRCCAId === (r._id || r.id) || 
          pending.notificationNumber === r.notificationNumber
        );
        return r.status === 'Rejected' && r.createdBy === user?.id && !hasPendingResubmission;
      }).length;
    const pendingCount = pendingRCCAs.length;
    console.log('Stat cards calculation - Rejected count:', rejectedCount, 'Pending count:', pendingCount, 'for user:', user?.id);
    
    return [
      { title: 'Total Approved RCCAs', value: rccas.length, icon: BarChart3, color: 'bg-green-500', textColor: 'text-green-600', bgColor: 'bg-green-50', clickable: true, onClick: () => setShowTotalRCCAsSection(true) },
      { title: 'Drafts (In Progress)', value: draftCount, icon: BarChart3, color: 'bg-orange-500', textColor: 'text-orange-600', bgColor: 'bg-orange-50', clickable: true, onClick: () => setShowDraftsSection(true) },
      { title: 'Approved', value: isAdmin ? rccas.filter(r => r.status === 'Approved').length : rccas.filter(r => r.status === 'Approved' && (r.approvedBy === user?.id || r.createdBy === user?.id)).length, icon: CheckCircle, color: 'bg-purple-500', textColor: 'text-purple-600', bgColor: 'bg-purple-50', clickable: true, onClick: () => setShowApprovedSection(true) },
      { title: 'Pending Approval RCCAs', value: pendingCount, icon: AlertCircle, color: 'bg-yellow-500', textColor: 'text-yellow-700', bgColor: 'bg-yellow-50', clickable: true, onClick: () => setShowPendingApprovalSection(true) },
      { title: 'Rejected RCCAs', value: rejectedCount, icon: AlertCircle, color: 'bg-red-500', textColor: 'text-red-600', bgColor: 'bg-red-50', clickable: true, onClick: () => setShowRejectedSection(true) }
    ];
  }, [rccas, pendingRCCAs, draftCount, isAdmin, user?.id]);

  // Notification helper
  const addNotification = (notif: { type: string; message: string; reason?: string }) => {
    setNotifications(prev => [notif, ...prev]);
    toast(notif.message + (notif.reason ? ` (Reason: ${notif.reason})` : ''));
  };

  // Download handlers
  const handleDownloadSingleExcel = (rcca: any) => {
    try {
      const data = [{
        'RCCA ID': rcca.id || '', 'Title': rcca.title || '', 'Description': rcca.description || '', 'Department': rcca.department || '', 'Priority': rcca.priority || '', 'Status': rcca.status || '', 'Created By': rcca.createdBy || '', 'Created Date': rcca.createdAt ? new Date(rcca.createdAt).toLocaleDateString() : '', 'Problem Statement': rcca.problemStatement || '', 'Immediate Actions': rcca.immediateActions || '', 'Root Cause Analysis': rcca.rootCauseAnalysis || '', 'Corrective Actions': rcca.correctiveActions || '', 'Preventive Actions': rcca.preventiveActions || '', 'Verification': rcca.verification || '', 'Effectiveness': rcca.effectiveness || '', 'Lessons Learned': rcca.lessons || '', 'Assigned To': rcca.assignedTo || '', 'Due Date': rcca.dueDate || '', 'Completed Date': rcca.completedDate || '', 'Reviewed By': rcca.reviewedBy || '', 'Approved By': rcca.approvedBy || '', 'Cost': rcca.cost || '', 'Impact': rcca.impact || '', 'Risk Level': rcca.riskLevel || '', 'Attachments': rcca.attachments?.join(', ') || ''
      }];
      const ws = XLSX.utils.json_to_sheet(data);
      const colWidths = Object.keys(data[0]).map(key => ({ wch: Math.max(key.length, String(data[0][key as keyof typeof data[0]]).length) + 2 }));
      ws['!cols'] = colWidths;
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'RCCA Report');
      XLSX.writeFile(wb, `RCCA_${rcca.id}_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch { alert('Failed to generate Excel file'); }
  };
  const handleDownloadSinglePDF = (rcca: any) => {
    try {
      const htmlContent = `<!DOCTYPE html><html><head><title>RCCA Report - ${rcca.id}</title><style>body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.4; } .header { background-color: #dc2626; color: white; padding: 15px; text-align: center; margin-bottom: 20px; } .section { margin-bottom: 20px; } .section-title { background-color: #f3f4f6; padding: 8px; font-weight: bold; border-left: 4px solid #dc2626; } .field { margin: 8px 0; } .field-label { font-weight: bold; display: inline-block; width: 150px; } .field-value { display: inline-block; } table { width: 100%; border-collapse: collapse; margin: 10px 0; } th, td { border: 1px solid #ddd; padding: 8px; text-align: left; } th { background-color: #dc2626; color: white; } .long-text { white-space: pre-wrap; }</style></head><body><div class='header'><h1>Root Cause Corrective Action Report</h1><h2>${rcca.title}</h2><p>RCCA ID: ${rcca.id}</p></div><div class='section'><div class='section-title'>Basic Information</div><table><tr><th>Field</th><th>Value</th></tr><tr><td>Department</td><td>${rcca.department || 'N/A'}</td></tr><tr><td>Priority</td><td>${rcca.priority || 'N/A'}</td></tr><tr><td>Status</td><td>${rcca.status || 'N/A'}</td></tr><tr><td>Created By</td><td>${rcca.createdBy || 'N/A'}</td></tr><tr><td>Created Date</td><td>${rcca.createdAt ? new Date(rcca.createdAt).toLocaleDateString() : 'N/A'}</td></tr><tr><td>Assigned To</td><td>${rcca.assignedTo || 'N/A'}</td></tr><tr><td>Due Date</td><td>${rcca.dueDate || 'N/A'}</td></tr></table></div><div class='section'><div class='section-title'>Problem Analysis</div><table><tr><th>Field</th><th>Description</th></tr><tr><td>Problem Statement</td><td class='long-text'>${rcca.problemStatement || 'N/A'}</td></tr><tr><td>Immediate Actions</td><td class='long-text'>${rcca.immediateActions || 'N/A'}</td></tr><tr><td>Root Cause Analysis</td><td class='long-text'>${rcca.rootCauseAnalysis || 'N/A'}</td></tr></table></div><div class='section'><div class='section-title'>Actions & Verification</div><table><tr><th>Field</th><th>Description</th></tr><tr><td>Corrective Actions</td><td class='long-text'>${rcca.correctiveActions || 'N/A'}</td></tr><tr><td>Preventive Actions</td><td class='long-text'>${rcca.preventiveActions || 'N/A'}</td></tr><tr><td>Verification</td><td class='long-text'>${rcca.verification || 'N/A'}</td></tr><tr><td>Effectiveness</td><td class='long-text'>${rcca.effectiveness || 'N/A'}</td></tr><tr><td>Lessons Learned</td><td class='long-text'>${rcca.lessons || 'N/A'}</td></tr></table></div><div class='section'><div class='section-title'>Additional Information</div><table><tr><th>Field</th><th>Value</th></tr><tr><td>Completed Date</td><td>${rcca.completedDate || 'N/A'}</td></tr><tr><td>Reviewed By</td><td>${rcca.reviewedBy || 'N/A'}</td></tr><tr><td>Approved By</td><td>${rcca.approvedBy || 'N/A'}</td></tr><tr><td>Cost</td><td>${rcca.cost ? `$${rcca.cost.toLocaleString()}` : 'N/A'}</td></tr><tr><td>Impact</td><td>${rcca.impact || 'N/A'}</td></tr><tr><td>Risk Level</td><td>${rcca.riskLevel || 'N/A'}</td></tr><tr><td>Attachments</td><td>${rcca.attachments?.join(', ') || 'None'}</td></tr></table></div><div style='margin-top: 30px; text-align: center; color: #666; font-size: 12px;'>Generated on ${new Date().toLocaleString()}</div></body></html>`;
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.onload = () => { setTimeout(() => { printWindow.print(); }, 500); };
      }
    } catch { alert('Failed to generate PDF'); }
  };

  const handleDeleteDraft = async (rcca: any) => {
    if (window.confirm(`Are you sure you want to delete the draft "${rcca.notificationNumber || rcca.id}"? This action cannot be undone.`)) {
      try {
        // If it's a local draft, remove from localStorage
        if (!rcca._id) {
          const draftsJSON = localStorage.getItem('rccaDrafts') || '[]';
          const drafts = JSON.parse(draftsJSON);
          const updatedDrafts = drafts.filter((d: any) => d.id !== rcca.id);
          localStorage.setItem('rccaDrafts', JSON.stringify(updatedDrafts));
          addNotification({ type: 'success', message: 'Draft deleted successfully.' });
          // Refresh the dashboard data
          await refreshDashboardData();
        } else {
          // If it's a server draft, you might want to call an API to delete it
          // For now, we'll just show a message
          addNotification({ type: 'info', message: 'Server drafts cannot be deleted from this interface. Please contact an administrator.' });
        }
      } catch (error) {
        addNotification({ type: 'error', message: 'Failed to delete draft.' });
      }
    }
  };

  const handleDeleteRCCA = async (rcca: any, type: string = 'RCCA') => {
    const itemName = rcca.notificationNumber || rcca.id;
    if (window.confirm(`Are you sure you want to delete this ${type.toLowerCase()} "${itemName}"? This action cannot be undone.`)) {
      try {
        // For now, we'll show a message that deletion is not available for server RCCAs
        addNotification({ type: 'info', message: `${type} deletion is not available in this interface. Please contact an administrator.` });
      } catch (error) {
        addNotification({ type: 'error', message: `Failed to delete ${type.toLowerCase()}.` });
      }
    }
  };

  // Helper to check for unread notifications
  const hasUnreadNotifications = notifications.some((n: any) => !n.read);

  // When notifications modal is opened, mark all as read
  useEffect(() => {
    if (showNotifications && hasUnreadNotifications) {
      notifications.filter((n: any) => !n.read).forEach((notif: any) => {
        if (notif._id) {
          markNotificationRead(notif._id).then(() => {
            setNotifications((prev: any[]) => prev.map(n => 
              n._id === notif._id ? { ...n, read: true } : n
            ));
          });
        }
      });
    }
  }, [showNotifications]);

  const [pieModalVisible, setPieModalVisible] = useState(false);
  const [trendModalVisible, setTrendModalVisible] = useState(false);

  // UI rendering
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading dashboard...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-600">{error}</div>;

  // Add at the top with other useState hooks
  // const [pieModalVisible, setPieModalVisible] = useState(false);
  // const [trendModalVisible, setTrendModalVisible] = useState(false);

  // Update open/close handlers for pie modal
  const openPieModal = () => {
    setShowDepartmentPieFullscreen(true);
    setTimeout(() => setPieModalVisible(true), 10);
  };
  const closePieModal = () => {
    setPieModalVisible(false);
    setTimeout(() => setShowDepartmentPieFullscreen(false), 300);
  };

  // Update open/close handlers for trend modal
  const openTrendModal = () => {
    setShowTrendChartFullscreen(true);
    setTimeout(() => setTrendModalVisible(true), 10);
  };
  const closeTrendModal = () => {
    setTrendModalVisible(false);
    setTimeout(() => setShowTrendChartFullscreen(false), 300);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button onClick={() => setShowHamburgerMenu(!showHamburgerMenu)} className="mr-4 p-2 rounded-lg hover:bg-gray-100 relative" aria-label="Toggle menu">
                <Menu className={`w-6 h-6 ${hasUnreadNotifications && !isAdmin ? 'text-red-600' : 'text-gray-700'}`} />
              </button>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">RCCA Dashboard</h1>
              {isAdmin && <button onClick={() => setShowExcelUpload(true)} className="ml-6 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 shadow dark:bg-blue-500 dark:hover:bg-blue-600">Upload User Data</button>}
            </div>
            <div className="flex items-center space-x-4">
              {user && <span className="text-gray-700 dark:text-gray-300">Welcome, {user.name}</span>}
              <button onClick={onToggleDarkMode} className="p-2 text-gray-700 hover:text-red-600 dark:text-gray-300 dark:hover:text-red-400">
                {darkMode ? '☀️' : '🌙'}
              </button>
              <button onClick={() => setShowNotifications(true)} className="relative p-2 text-gray-700 hover:text-red-600 dark:text-gray-300 dark:hover:text-red-400">
                <Bell className={`w-5 h-5 ${hasUnreadNotifications && !isAdmin ? 'text-red-600' : 'text-gray-700 dark:text-gray-300'}`} />
                {hasUnreadNotifications && !isAdmin && <span className="absolute -top-1 -right-1 block w-3 h-3 bg-red-600 rounded-full"></span>}
              </button>
              <button onClick={onLogout} className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-red-600 dark:text-gray-300 dark:hover:text-red-400"><X className="w-4 h-4" />Logout</button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Hamburger Menu */}
      {showHamburgerMenu && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setShowHamburgerMenu(false)}>
          <div className="absolute top-16 left-4 bg-white rounded-lg shadow-lg border border-gray-200 min-w-48 z-50 dark:bg-gray-800 dark:border-gray-700" onClick={e => e.stopPropagation()}>
            <div className="py-2">
              <button onClick={() => { onNewRCCA(); setShowHamburgerMenu(false); }} className="w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 flex items-center"><Plus className="w-5 h-5 mr-3" />Create New RCCA</button>
              <button onClick={() => { onViewRCCAs(); setShowHamburgerMenu(false); }} className="w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 flex items-center"><Search className="w-5 h-5 mr-3" />View & Filter RCCAs</button>
              <div className="border-t border-gray-200 dark:border-gray-600 my-2"></div>
              <button onClick={() => { setShowTotalRCCAsSection(true); setShowHamburgerMenu(false); }} className="w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 flex items-center"><BarChart3 className="w-5 h-5 mr-3" />Total Approved RCCAs</button>
              <button onClick={() => { setShowPendingApprovalSection(true); setShowHamburgerMenu(false); }} className="w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 flex items-center"><AlertCircle className="w-5 h-5 mr-3" />Pending Approval RCCAs</button>
              <button onClick={() => { setShowApprovedSection(true); setShowHamburgerMenu(false); }} className="w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 flex items-center"><CheckCircle className="w-5 h-5 mr-3" />Approved RCCAs</button>
              <button onClick={() => { setShowDraftsSection(true); setShowHamburgerMenu(false); }} className="w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 flex items-center"><BarChart3 className="w-5 h-5 mr-3" />Drafts (In Progress)</button>
              <button onClick={() => { setShowRejectedSection(true); setShowHamburgerMenu(false); }} className="w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 flex items-center"><AlertCircle className="w-5 h-5 mr-3" />Rejected RCCAs</button>
            </div>
          </div>
        </div>
      )}
      
      {/* Stat Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {successMessage && <div className="bg-green-100 text-green-800 px-4 py-2 text-center font-semibold mb-4 rounded-lg">{successMessage}</div>}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {statCards.map((stat, idx) => (
            <div key={idx} className={`${stat.bgColor} rounded-xl p-6 border border-gray-200 hover:shadow-lg dark:border-gray-700${stat.clickable ? ' cursor-pointer' : ''}`} onClick={stat.clickable ? stat.onClick : undefined}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1 dark:text-gray-400">{stat.title}</p>
                  <p className={`text-3xl font-bold ${stat.textColor}`}>{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}><stat.icon className="w-6 h-6 text-white" /></div>
              </div>
            </div>
          ))}
        </div>

        {/* Pie Chart and Trend Chart Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Pie Chart (Department) */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg relative dark:bg-gray-800 dark:border-gray-700" style={{ minHeight: 400, height: 400 }} onClick={openPieModal}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">RCCAs by Department</h3>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500">Filter:</label>
                <select
                  value={selectedDepartmentFactory}
                  onChange={e => setSelectedDepartmentFactory(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                  onClick={e => e.stopPropagation()} // Prevent modal open when clicking filter
                >
                  <option value="All">All Factories</option>
                  <option value="DPL 1">DPL 1</option>
                  <option value="DPL 2">DPL 2</option>
                  <option value="URIL">URIL</option>
                </select>
                <PieChart className="w-5 h-5 text-gray-400" />
              </div>
            </div>
            <div style={{ minHeight: 300, height: 300 }}>
              {currentDepartmentChartData ? (
                <Pie 
                  data={currentDepartmentChartData} 
                  options={{ ...departmentChartOptions, maintainAspectRatio: false }}
                />
              ) : (
                <div className="text-center py-12">
                  <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Department Data Available</h3>
                  <p className="text-gray-500">
                    {selectedDepartmentFactory === 'All' 
                      ? 'No RCCAs with department information found across all factories.' 
                      : `No RCCAs with department information found for ${selectedDepartmentFactory}.`}
                  </p>
                  <p className="text-sm text-gray-400 mt-2">RCCAs without department information are excluded from this chart.</p>
                </div>
              )}
            </div>
          </div>
          {/* Trend Chart (Horizontal Bar) */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg relative dark:bg-gray-800 dark:border-gray-700" style={{ minHeight: 400, height: 400 }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  <select
                    value={trendPeriod}
                    onChange={e => {
                      const period = e.target.value as 'Custom' | 'All Time';
                      setTrendPeriod(period);
                      if (period === 'Custom') {
                        // Default custom range: last 7 days
                        const to = new Date();
                        const from = new Date();
                        from.setDate(to.getDate() - 6);
                        from.setHours(0, 0, 0, 0);
                        to.setHours(23, 59, 59, 999);
                        setCustomRange({ from, to });
                      } else {
                        // All Time - no custom range needed
                        setCustomRange(null);
                      }
                    }}
                    className="text-lg font-semibold text-gray-900 bg-transparent border-none focus:ring-0 focus:outline-none cursor-pointer"
                    onClick={e => e.stopPropagation()}
                  >
                    <option value="Custom">Custom Range</option>
                    <option value="All Time">All Time</option>
                  </select>
                                      <span className="text-lg font-semibold text-gray-900 dark:text-white">RCCA Trend</span>
                </h3>
                <Tooltip content="This line graph shows which factory has produced how many RCCAs.">
                  <span className="ml-1 cursor-pointer inline-block align-middle text-gray-500 hover:text-gray-700 transition-colors" style={{ verticalAlign: 'middle' }}>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                  </span>
                </Tooltip>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="p-2 rounded-full hover:bg-gray-100"
                  style={{ zIndex: 10 }}
                  onClick={e => { e.stopPropagation(); /* Optionally open a filter modal if needed */ }}
                  title="Filter"
                >
                  <FilterIcon className="w-5 h-5 text-gray-500" />
                </button>
                <TrendingUp className="w-5 h-5 text-gray-400" />
              </div>
            </div>
            <div style={{ minHeight: 400, height: 400 }}>
              {/* Filter controls above the chart */}
              <div className="mb-4 flex flex-col sm:flex-row sm:items-end gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Factory Filter</label>
                  <select
                    value={selectedFactory}
                    onChange={e => setSelectedFactory(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    style={{ maxWidth: 200 }}
                  >
                    <option value="All">All</option>
                    {factoryOptions.map(fac => (
                      <option key={fac} value={fac}>{fac}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {trendPeriod === 'Custom' ? 'Date Range' : 'All Time'}
                  </label>
                  {trendPeriod === 'Custom' ? (
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={customRange ? customRange.from.toISOString().slice(0, 10) : ''}
                        onChange={e => {
                          if (!customRange) return;
                          const from = new Date(e.target.value);
                          from.setHours(0, 0, 0, 0);
                          setCustomRange({ ...customRange, from });
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        style={{ maxWidth: 120 }}
                      />
                      <span className="self-center">to</span>
                      <input
                        type="date"
                        value={customRange ? customRange.to.toISOString().slice(0, 10) : ''}
                        onChange={e => {
                          if (!customRange) return;
                          const to = new Date(e.target.value);
                          to.setHours(23, 59, 59, 999);
                          setCustomRange({ ...customRange, to });
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        style={{ maxWidth: 120 }}
                      />
                    </div>
                  ) : (
                    <div className="px-3 py-2 text-gray-500 bg-gray-100 rounded-lg">
                      Showing all trends from beginning
                    </div>
                  )}
                </div>
              </div>
              {/* Chart area, only this is clickable for fullscreen */}
              <div style={{ cursor: 'pointer', height: 240 }} onClick={openTrendModal}>
                <Bar data={chartData} options={chartOptions} />
              </div>
            </div>
          </div>
        </div>

        {/* Employee RCCA Statistics - Grouped Bar Chart */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg mb-8 dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Employee RCCA Statistics</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500 dark:text-gray-400">Filter by Factory:</label>
                <select
                  value={selectedEmployeeFactory}
                  onChange={e => { setSelectedEmployeeFactory(e.target.value); setCurrentEmployeePage(1); }}
                  className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="All">All Factories</option>
                  <option value="DPL 1">DPL 1</option>
                  <option value="DPL 2">DPL 2</option>
                  <option value="URIL">URIL</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500 dark:text-gray-400">Show:</label>
                <select
                  value={topN}
                  onChange={e => { setTopN(Number(e.target.value)); setCurrentEmployeePage(1); }}
                  className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value={10}>Top 10</option>
                  <option value={20}>Top 20</option>
                  <option value={50}>Top 50</option>
                  <option value={-1}>All</option>
                </select>
              </div>
              {/* Pagination controls */}
              {topN !== -1 && employeeRCCAChartData.totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentEmployeePage(p => Math.max(1, p - 1))}
                    disabled={currentEmployeePage === 1}
                    className="px-2 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50 dark:bg-gray-600 dark:text-gray-300"
                  >
                    Prev
                  </button>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Page {currentEmployeePage} of {employeeRCCAChartData.totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentEmployeePage(p => Math.min(employeeRCCAChartData.totalPages, p + 1))}
                    disabled={currentEmployeePage === employeeRCCAChartData.totalPages}
                    className="px-2 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50 dark:bg-gray-600 dark:text-gray-300"
                  >
                    Next
                  </button>
                </div>
              )}
              <BarChart3 className="w-5 h-5 text-gray-400 dark:text-gray-500" />
            </div>
          </div>
          <div style={{ minHeight: 300 }}>
            <Bar 
              data={employeeRCCAChartData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { 
                    position: 'top' as const,
                    labels: {
                      usePointStyle: true,
                      padding: 20,
                      font: { size: 12 }
                    }
                  },
                  title: { display: false },
                  tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    borderColor: '#ffffff',
                    borderWidth: 1,
                    cornerRadius: 8,
                    displayColors: true,
                    callbacks: {
                      title: (context: any) => {
                        const employeeName = context[0].label.split(' (')[0];
                        const factory = context[0].label.match(/\((.*?)\)/)?.[1] || 'DPL 1';
                        return `${employeeName} - ${factory}`;
                      },
                      label: (context: any) => {
                        const label = context.dataset.label || '';
                        const value = context.parsed.y;
                        return `${label}: ${value}`;
                      }
                    }
                  }
                },
                scales: {
                  x: {
                    stacked: false,
                    ticks: {
                      maxRotation: 45,
                      minRotation: 0
                    }
                  },
                  y: {
                    stacked: false,
                    beginAtZero: true,
                    ticks: { stepSize: 1 }
                  }
                }
              }} 
            />
          </div>
        </div>

        {/* Pareto Chart for Error Categories */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg mb-8 dark:bg-gray-800 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white"> Error Categories</h3>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500 dark:text-gray-400">Filter by Factory:</label>
                <select
                  value={selectedParetoFactory}
                  onChange={e => setSelectedParetoFactory(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="All">All Factories</option>
                  <option value="DPL 1">DPL 1</option>
                  <option value="DPL 2">DPL 2</option>
                  <option value="URIL">URIL</option>
                </select>
              </div>
            </div>
            <div style={{ minHeight: 300 }}>
              {paretoData.labels.length > 0 ? (
              <Bar data={paretoData as any} options={paretoOptions} plugins={[ChartDataLabels]} />
              ) : (
                <div className="text-gray-400 text-center py-12">No data for selected factory.</div>
              )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <button onClick={onNewRCCA} className="flex items-center justify-center gap-3 bg-red-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-red-700 shadow-lg dark:bg-red-500 dark:hover:bg-red-600"><Plus className="w-5 h-5" />Create New RCCA</button>
          <button onClick={onViewRCCAs} className="flex items-center justify-center gap-3 bg-white text-gray-700 px-8 py-4 rounded-xl font-semibold hover:bg-gray-50 border border-gray-200 shadow-lg dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700"><Search className="w-5 h-5" />View & Filter RCCAs</button>
        </div>
      </div>

      {/* Excel Upload Modal (Admin) */}
      {isAdmin && showExcelUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4 shadow-lg relative">
            <button onClick={() => setShowExcelUpload(false)} className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl font-bold" aria-label="Close">×</button>
            <ExcelUpload isAdmin={isAdmin} onUsersUploaded={() => {}} onClose={() => setShowExcelUpload(false)} />
          </div>
        </div>
      )}

      {/* Pending Approval RCCAs Section */}
      {showPendingApprovalSection && (
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center"><button onClick={() => setShowPendingApprovalSection(false)} className="mr-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><X className="w-6 h-6 text-gray-700 dark:text-gray-300" /></button><h1 className="text-3xl font-bold text-gray-900 dark:text-white">Pending Approval RCCAs</h1></div>
            </div>
            <div className="bg-white rounded-lg shadow overflow-hidden dark:bg-gray-800 dark:border-gray-700">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 sticky top-0 z-10 dark:bg-gray-700">
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Notification #</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Equipment</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Description</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Status</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Created At</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Employee</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                    {pendingRCCAs.map((rcca) => (
                      <tr key={rcca._id || rcca.id} className="dark:bg-gray-800">
                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">{rcca.notificationNumber}</td>
                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">{rcca.sapEquipment}</td>
                        <td className="px-3 py-3 text-sm text-gray-900 max-w-xs truncate dark:text-gray-300" title={rcca.problemStatement || rcca.mentionProblem || rcca.description}>{rcca.problemStatement || rcca.mentionProblem || rcca.description}</td>
                        <td className="px-3 py-3 whitespace-nowrap"><span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Submitted</span></td>
                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">{rcca.createdAt ? new Date(rcca.createdAt).toLocaleDateString() : 'N/A'}</td>
                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">{userIdToNameWithFactory(rcca.createdBy)}</td>
                        <td className="px-3 py-3 whitespace-nowrap text-sm font-medium space-x-1">
                          <button onClick={() => setViewingRCCA(rcca)} title="View" className="inline-flex items-center p-1 text-blue-600 hover:bg-blue-100 rounded dark:hover:bg-blue-900"><Eye className="w-4 h-4" /></button>
                          <button onClick={() => handleDownloadSinglePDF(rcca)} title="Download PDF" className="inline-flex items-center p-1 text-gray-700 hover:bg-gray-200 rounded dark:text-gray-300 dark:hover:bg-gray-700"><FileText className="w-4 h-4" /></button>
                          <button onClick={() => handleDownloadSingleExcel(rcca)} title="Download Excel" className="inline-flex items-center p-1 text-green-600 hover:bg-green-100 rounded dark:hover:bg-green-900"><Download className="w-4 h-4" /></button>
                          {isAdmin && (<>
                            <button
                              onClick={async () => {
                                try {
                                  const result = await approveRCCA(rcca._id || rcca.id, user?.id);
                                  if (result.error) {
                                    addNotification({ type: 'error', message: `Failed to approve RCCA: ${result.error}` });
                                  } else {
                                    addNotification({ type: 'success', message: `RCCA ${rcca.notificationNumber || rcca.id} approved.` });
                                    setSuccessMessage('RCCA has been approved');
                                    setTimeout(() => setSuccessMessage(null), 2000);
                                    // Remove from pendingRCCAs immediately and refresh the list
                                    setPendingRCCAs(prev => prev.filter(item => (item._id || item.id) !== (rcca._id || rcca.id)));
                                    // Refresh the main RCCAs list to include the newly approved RCCA
                                    rccaService.getRCCAs().then(setRccas);
                                  }
                                } catch (error) {
                                  console.error('Error approving RCCA:', error);
                                  addNotification({ type: 'error', message: 'Failed to approve RCCA. Please try again.' });
                                }
                              }}
                              className="px-3 py-1 bg-green-600 text-white rounded mr-2 hover:bg-green-700"
                            >
                              Approve
                            </button>
                            <button
                              onClick={async () => {
                                const reason = prompt('Please provide a reason for rejection:');
                                if (!reason) return;
                                try {
                                  const result = await rejectRCCA(rcca._id || rcca.id, reason, user?.id);
                                  if (result.error) {
                                    addNotification({ type: 'error', message: `Failed to reject RCCA: ${result.error}` });
                                  } else {
                                    addNotification({ type: 'error', message: `RCCA ${rcca.notificationNumber || rcca.id} rejected.`, reason });
                                    // Remove from pendingRCCAs immediately
                                    setPendingRCCAs(prev => prev.filter(item => (item._id || item.id) !== (rcca._id || rcca.id)));
                                    // Refresh the main RCCAs list to include the newly rejected RCCA
                                    rccaService.getRCCAs().then(setRccas);
                                  }
                                } catch (error) {
                                  console.error('Error rejecting RCCA:', error);
                                  addNotification({ type: 'error', message: 'Failed to reject RCCA. Please try again.' });
                                }
                              }}
                              className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                            >
                              Reject
                            </button>
                          </>)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {pendingRCCAs.length === 0 && (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4 dark:text-gray-500" />
                <h3 className="text-lg font-medium text-gray-900 mb-2 dark:text-white">No Pending Approval RCCAs</h3>
                <p className="text-gray-500 dark:text-gray-400">All submitted RCCAs have been reviewed.</p>
                <p className="text-xs text-gray-400 mt-2">Debug: pendingRCCAs.length = {pendingRCCAs.length}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Approved RCCAs Section */}
      {showApprovedSection && (
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center"><button onClick={() => setShowApprovedSection(false)} className="mr-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><X className="w-6 h-6 text-gray-700 dark:text-gray-300" /></button><h1 className="text-3xl font-bold text-gray-900 dark:text-white">Approved RCCAs</h1></div>
              <div className="text-sm text-gray-500 dark:text-gray-400">{isAdmin ? 'All approved RCCAs in the system' : 'Your approved RCCAs'}</div>
            </div>
            <div className="bg-white rounded-lg shadow overflow-hidden dark:bg-gray-800 dark:border-gray-700">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 sticky top-0 z-10 dark:bg-gray-700">
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Notification #</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Equipment</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Description</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Status</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Created At</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Employee</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                    {(isAdmin
                      ? rccas.filter(r => r.status === 'Approved')
                      : rccas.filter(r => r.status === 'Approved' && (r.approvedBy === user?.id || r.createdBy === user?.id))
                    ).map((rcca) => (
                      <tr key={rcca._id || rcca.id} className="dark:bg-gray-800">
                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">{rcca.notificationNumber}</td>
                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">{rcca.sapEquipment}</td>
                        <td className="px-3 py-3 text-sm text-gray-900 max-w-xs truncate dark:text-gray-300" title={rcca.problemStatement || rcca.mentionProblem || rcca.description}>{rcca.problemStatement || rcca.mentionProblem || rcca.description}</td>
                        <td className="px-3 py-3 whitespace-nowrap"><span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Approved</span></td>
                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">{rcca.createdAt ? new Date(rcca.createdAt).toLocaleDateString() : 'N/A'}</td>
                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">{userIdToNameWithFactory(rcca.createdBy)}</td>
                        <td className="px-3 py-3 whitespace-nowrap text-sm font-medium space-x-1">
                          <button onClick={() => setViewingRCCA(rcca)} title="View" className="inline-flex items-center p-1 text-blue-600 hover:bg-blue-100 rounded dark:hover:bg-blue-900"><Eye className="w-4 h-4" /></button>
                          <button onClick={() => handleDownloadSinglePDF(rcca)} title="Download PDF" className="inline-flex items-center p-1 text-gray-700 hover:bg-gray-200 rounded dark:text-gray-300 dark:hover:bg-gray-700"><FileText className="w-4 h-4" /></button>
                          <button onClick={() => handleDownloadSingleExcel(rcca)} title="Download Excel" className="inline-flex items-center p-1 text-green-600 hover:bg-green-100 rounded dark:hover:bg-green-900"><Download className="w-4 h-4" /></button>
                          <button onClick={() => handleDeleteRCCA(rcca, 'Approved RCCA')} title="Delete" className="inline-flex items-center p-1 text-red-600 hover:bg-red-100 rounded dark:hover:bg-red-900"><Trash2 className="w-4 h-4" /></button>
                          {isAdmin && (() => {
                            let canEdit = true;
                            if (rcca.status === 'Approved') {
                              const approvedDate = rcca.approvedAt || rcca.updatedAt || rcca.completedAt || rcca.createdAt;
                              if (approvedDate) {
                                const approvedTime = new Date(approvedDate).getTime();
                                const now = Date.now();
                                const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
                                if (now - approvedTime > sevenDaysMs) {
                                  canEdit = false;
                                }
                              } else {
                                canEdit = false;
                              }
                            }
                            return (
                              <button
                                onClick={() => {
                                  if (canEdit) navigate(`/rcca/${rcca._id || rcca.id}/edit`);
                                }}
                                title={canEdit ? 'Edit' : 'Editing disabled after 7 days of approval'}
                                className={`inline-flex items-center p-1 ${canEdit ? 'text-yellow-600 hover:bg-yellow-100 dark:hover:bg-yellow-900' : 'text-gray-400 cursor-not-allowed'} rounded`}
                                disabled={!canEdit}
                                style={canEdit ? {} : { pointerEvents: 'auto' }}
                              >
                                <EditIcon className="w-4 h-4" />
                              </button>
                            );
                          })()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {((isAdmin ? rccas.filter(r => r.status === 'Approved') : rccas.filter(r => r.status === 'Approved' && (r.approvedBy === user?.id || r.createdBy === user?.id))).length === 0) && (
              <div className="text-center py-12"><CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4 dark:text-gray-500" /><h3 className="text-lg font-medium text-gray-900 mb-2 dark:text-white">No Approved RCCAs</h3><p className="text-gray-500 dark:text-gray-400">No RCCAs have been approved yet.</p></div>
            )}
          </div>
        </div>
      )}

      {/* Drafts Section */}
      {showDraftsSection && (
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center"><button onClick={() => setShowDraftsSection(false)} className="mr-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><X className="w-6 h-6 text-gray-700 dark:text-gray-300" /></button><h1 className="text-3xl font-bold text-gray-900 dark:text-white">Drafts (In Progress)</h1></div>
              <div className="text-sm text-gray-500 dark:text-gray-400">{isAdmin ? 'All drafts in the system' : 'Your drafts'}</div>
            </div>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notification #</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Equipment</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(isAdmin
                      ? pendingRCCAs.filter(r => r.status === 'Draft')
                      : (() => {
                          const pendingDrafts = pendingRCCAs.filter(r => r.status === 'Draft' && canUserEditRCCA(r));
                          const localDrafts = getLocalDrafts();
                          const allDraftsMap = new Map();
                          for (const d of [...pendingDrafts, ...localDrafts]) allDraftsMap.set(d.id, d);
                          return Array.from(allDraftsMap.values());
                        })()
                    ).map((rcca) => (
                      <tr key={rcca._id || rcca.id} className="dark:bg-gray-800">
                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">{rcca.notificationNumber || 'N/A'}</td>
                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">{rcca.sapEquipment || 'N/A'}</td>
                        <td className="px-3 py-3 text-sm text-gray-900 max-w-xs truncate dark:text-gray-300" title={rcca.problemDescription || rcca.mentionProblem || rcca.description}>{rcca.problemDescription || rcca.mentionProblem || rcca.description || 'N/A'}</td>
                        <td className="px-3 py-3 whitespace-nowrap text-orange-600 font-bold dark:text-orange-400">Draft</td>
                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">{rcca.createdAt ? new Date(rcca.createdAt).toLocaleDateString() : 'N/A'}</td>
                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">{userIdToNameWithFactory(rcca.createdBy)}</td>
                        <td className="px-3 py-3 whitespace-nowrap text-sm font-medium space-x-1">
                          <button onClick={() => setViewingRCCA(rcca)} title="View" className="inline-flex items-center p-1 text-blue-600 hover:bg-blue-100 rounded dark:hover:bg-blue-900"><Eye className="w-4 h-4" /></button>
                          {canUserEditRCCA(rcca) && (
                            <button 
                              onClick={() => {
                                // Store the RCCA data in localStorage so it can be accessed by the form
                                localStorage.setItem('editingRCCA', JSON.stringify(rcca));
                                navigate(`/rcca/${rcca._id || rcca.id}/edit`);
                              }} 
                              title="Edit" 
                              className="inline-flex items-center p-1 text-yellow-600 hover:bg-yellow-100 rounded dark:hover:bg-yellow-900"
                            >
                              <EditIcon className="w-4 h-4" />
                            </button>
                          )}

                          <button onClick={() => handleDownloadSinglePDF(rcca)} title="Download PDF" className="inline-flex items-center p-1 text-gray-700 hover:bg-gray-200 rounded dark:text-gray-300 dark:hover:bg-gray-700"><FileText className="w-4 h-4" /></button>
                          <button onClick={() => handleDownloadSingleExcel(rcca)} title="Download Excel" className="inline-flex items-center p-1 text-green-600 hover:bg-green-100 rounded dark:hover:bg-green-900"><Download className="w-4 h-4" /></button>
                          <button onClick={() => handleDeleteDraft(rcca)} title="Delete Draft" className="inline-flex items-center p-1 text-red-600 hover:bg-red-100 rounded dark:hover:bg-red-900"><Trash2 className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
            </div>
            {((isAdmin ? pendingRCCAs.filter(r => r.status === 'Draft') : (() => { const pendingDrafts = pendingRCCAs.filter(r => r.status === 'Draft' && canUserEditRCCA(r)); const localDrafts = getLocalDrafts(); const allDraftsMap = new Map(); for (const d of [...pendingDrafts, ...localDrafts]) allDraftsMap.set(d.id, d); return Array.from(allDraftsMap.values()); })()).length === 0) && (
              <div className="text-center py-12"><BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4 dark:text-gray-500" /><h3 className="text-lg font-medium text-gray-900 mb-2 dark:text-white">No Drafts</h3><p className="text-gray-500 dark:text-gray-400">No RCCAs are in draft status.</p></div>
            )}
          </div>
        </div>
      )}
{/* Rejected RCCAs Section */}
{showRejectedSection && (
  <div className="fixed inset-0 bg-white z-50 overflow-y-auto dark:bg-gray-900">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center">
          <button onClick={() => setShowRejectedSection(false)} className="mr-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
            <X className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Rejected RCCAs</h1>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">{isAdmin ? 'All rejected RCCAs in the system' : 'Your rejected RCCAs - Click Edit to resubmit'}</div>
      </div>
              <div className="bg-white rounded-lg shadow overflow-hidden dark:bg-gray-800 dark:border-gray-700">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 sticky top-0 z-10 dark:bg-gray-700">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Notification #</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Equipment</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Description</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Status</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Created At</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Employee</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Rejection Reason</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
              {(isAdmin
                ? rccas.filter(r => {
                  // Only show rejected RCCAs that haven't been resubmitted
                  // Check if there's a corresponding pending RCCA (which means it was resubmitted)
                  const hasPendingResubmission = pendingRCCAs.some(pending => 
                    pending.originalRCCAId === (r._id || r.id) || 
                    pending.notificationNumber === r.notificationNumber
                  );
                  return r.status === 'Rejected' && !hasPendingResubmission;
                })
                : rccas.filter(r => {
                  // Only show user's rejected RCCAs that haven't been resubmitted
                  const hasPendingResubmission = pendingRCCAs.some(pending => 
                    pending.originalRCCAId === (r._id || r.id) || 
                    pending.notificationNumber === r.notificationNumber
                  );
                  return r.status === 'Rejected' && r.createdBy === user?.id && !hasPendingResubmission;
                })
              ).map((rcca) => (
                <tr key={rcca._id || rcca.id} className="dark:bg-gray-800">
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">{rcca.notificationNumber || 'N/A'}</td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">{rcca.sapEquipment || 'N/A'}</td>
                  <td className="px-3 py-3 text-sm text-gray-900 max-w-xs truncate dark:text-gray-300" title={rcca.problemStatement || rcca.mentionProblem || rcca.description}>
                    {rcca.problemStatement || rcca.mentionProblem || rcca.description || 'N/A'}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Rejected</span>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                    {rcca.createdAt ? new Date(rcca.createdAt).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">{userIdToNameWithFactory(rcca.createdBy)}</td>
                  <td className="px-3 py-3 text-sm text-gray-900 max-w-xs truncate dark:text-gray-300" title={rcca.rejectionReason}>
                    {rcca.rejectionReason || 'N/A'}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm font-medium space-x-1">
                    <button onClick={() => setViewingRCCA(rcca)} title="View" className="inline-flex items-center p-1 text-blue-600 hover:bg-blue-100 rounded"><Eye className="w-4 h-4" /></button>
                    <button onClick={() => handleDownloadSinglePDF(rcca)} title="Download PDF" className="inline-flex items-center p-1 text-gray-700 hover:bg-gray-200 rounded dark:text-gray-300 dark:hover:bg-gray-700"><FileText className="w-4 h-4" /></button>
                    <button onClick={() => handleDownloadSingleExcel(rcca)} title="Download Excel" className="inline-flex items-center p-1 text-green-600 hover:bg-green-100 rounded dark:hover:bg-green-900"><Download className="w-4 h-4" /></button>
                    <button onClick={() => handleDeleteRCCA(rcca, 'Rejected RCCA')} title="Delete" className="inline-flex items-center p-1 text-red-600 hover:bg-red-100 rounded dark:hover:bg-red-900"><Trash2 className="w-4 h-4" /></button>
                    {!isAdmin && canUserEditRCCA(rcca) && (
                      <button 
                        onClick={() => {
                          // Store the RCCA data in localStorage so it can be accessed by the form
                          localStorage.setItem('editingRCCA', JSON.stringify(rcca));
                          navigate(`/rcca/${rcca._id || rcca.id}/edit`);
                        }} 
                        title="Edit and Resubmit" 
                        className="inline-flex items-center p-1 text-yellow-600 hover:bg-yellow-100 rounded dark:hover:bg-yellow-900"
                      >
                        <EditIcon className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {((isAdmin 
        ? rccas.filter(r => {
          const hasPendingResubmission = pendingRCCAs.some(pending => 
            pending.originalRCCAId === (r._id || r.id) || 
            pending.notificationNumber === r.notificationNumber
          );
          return r.status === 'Rejected' && !hasPendingResubmission;
        })
        : rccas.filter(r => {
          const hasPendingResubmission = pendingRCCAs.some(pending => 
            pending.originalRCCAId === (r._id || r.id) || 
            pending.notificationNumber === r.notificationNumber
          );
          return r.status === 'Rejected' && r.createdBy === user?.id && !hasPendingResubmission;
        })
      ).length === 0) && (
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4 dark:text-gray-500" />
          <h3 className="text-lg font-medium text-gray-900 mb-2 dark:text-white">No Rejected RCCAs</h3>
          <p className="text-gray-500 dark:text-gray-400">No RCCAs have been rejected yet.</p>
        </div>
      )}
    </div>
  </div>
)}

{showTotalRCCAsSection && (
  <div className="fixed inset-0 bg-white z-50 overflow-y-auto dark:bg-gray-900">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center">
          <button onClick={() => setShowTotalRCCAsSection(false)} className="mr-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
            <X className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Total Approved RCCAs</h1>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">Showing all approved RCCAs in the system</div>
      </div>
      <div className="bg-white rounded-lg shadow overflow-hidden dark:bg-gray-800 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 sticky top-0 z-10 dark:bg-gray-700">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Notification #</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Equipment</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Description</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Status</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Created At</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Employee</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
              {rccas.map((rcca) => (
                <tr key={rcca._id || rcca.id} className="dark:bg-gray-800">
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">{rcca.notificationNumber || 'N/A'}</td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">{rcca.sapEquipment || 'N/A'}</td>
                  <td className="px-3 py-3 text-sm text-gray-900 max-w-xs truncate dark:text-gray-300" title={rcca.problemStatement || rcca.mentionProblem || rcca.description}>
                    {rcca.problemStatement || rcca.mentionProblem || rcca.description || 'N/A'}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      rcca.status === 'Approved' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      rcca.status === 'Submitted' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                      rcca.status === 'Draft' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {rcca.status || 'Draft'}
                    </span>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                    {rcca.createdAt ? new Date(rcca.createdAt).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">{userIdToNameWithFactory(rcca.createdBy)}</td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm font-medium space-x-1">
                    <button onClick={() => setViewingRCCA(rcca)} title="View" className="inline-flex items-center p-1 text-blue-600 hover:bg-blue-100 rounded dark:hover:bg-blue-900"><Eye className="w-4 h-4" /></button>
                    <button onClick={() => handleDownloadSinglePDF(rcca)} title="Download PDF" className="inline-flex items-center p-1 text-gray-700 hover:bg-gray-200 rounded dark:text-gray-300 dark:hover:bg-gray-700"><FileText className="w-4 h-4" /></button>
                    <button onClick={() => handleDownloadSingleExcel(rcca)} title="Download Excel" className="inline-flex items-center p-1 text-green-600 hover:bg-green-100 rounded dark:hover:bg-green-900"><Download className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {rccas.length === 0 && (
        <div className="text-center py-12">
          <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4 dark:text-gray-500" />
          <h3 className="text-lg font-medium text-gray-900 mb-2 dark:text-white">No RCCAs Found</h3>
          <p className="text-gray-500 dark:text-gray-400">There are no RCCAs in the system yet.</p>
        </div>
      )}
    </div>
  </div>
)}
      {/* Notifications Modal */}
      {showNotifications && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-lg relative">
            <button onClick={() => setShowNotifications(false)} className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl font-bold" aria-label="Close">×</button>
            <h2 className="text-xl font-bold mb-4 flex items-center"><Bell className="w-5 h-5 mr-2 text-blue-500" />Notifications</h2>
            {notifications.length === 0 ? (<div className="text-gray-500 text-center">No notifications yet.</div>) : (
              <ul className="space-y-3 max-h-72 overflow-y-auto">
                {notifications.map((notif, idx) => (
                  <li key={notif._id || idx} className={`p-3 rounded-lg border ${notif.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="font-semibold">{notif.message}</div>
                    {notif.reason && <div className="text-xs text-gray-500">Reason: {notif.reason}</div>}
                    {notif.createdAt && (
                      <div className="text-xs text-gray-400 mt-1">
                        {new Date(notif.createdAt).toLocaleString()}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* View RCCA Modal */}
      {viewingRCCA && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-semibold text-gray-900">View RCCA: {viewingRCCA.title}</h3><button onClick={() => setViewingRCCA(null)} className="text-gray-400 hover:text-gray-600 text-2xl font-bold">×</button></div>
            <div className="space-y-4">
              {Object.entries(viewingRCCA).map(([key, value]) => (
                <div key={key}><label className="block text-sm font-medium text-gray-700 mb-1">{key}</label><div className="text-sm text-gray-900">{String(value)}</div></div>
              ))}
              <div className="flex justify-end pt-4 border-t border-gray-200"><button onClick={() => setViewingRCCA(null)} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">Close</button></div>
            </div>
          </div>
        </div>
      )}

      <ToastContainer aria-label="Notification Toasts" position="top-right" autoClose={4000} hideProgressBar={false} newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover />

      {/* Fullscreen Department Pie Chart Modal */}
      {showDepartmentPieFullscreen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 transition-opacity duration-300">
          <div
            className={`bg-white rounded-xl p-8 max-w-4xl w-full mx-4 shadow-lg relative flex flex-col transform transition-all duration-300 ${pieModalVisible ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}`}
            style={{ minHeight: 500 }}
          >
            <button onClick={closePieModal} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold" aria-label="Close">×</button>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-semibold text-gray-900">RCCAs by Department</h3>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500">Filter:</label>
                <select
                  value={selectedDepartmentFactory}
                  onChange={e => setSelectedDepartmentFactory(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                >
                  <option value="All">All Factories</option>
                  <option value="DPL 1">DPL 1</option>
                  <option value="DPL 2">DPL 2</option>
                  <option value="URIL">URIL</option>
                </select>
              </div>
            </div>
            <div className="flex-1 flex items-center justify-center" style={{ minHeight: 500 }}>
              {currentDepartmentChartData ? (
                <Pie 
                  data={currentDepartmentChartData} 
                  options={{ ...departmentChartOptions, maintainAspectRatio: false }}
                />
              ) : (
                <div className="text-center py-12">
                  <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Department Data Available</h3>
                  <p className="text-gray-500">
                    {selectedDepartmentFactory === 'All' 
                      ? 'No RCCAs with department information found across all factories.' 
                      : `No RCCAs with department information found for ${selectedDepartmentFactory}.`}
                  </p>
                  <p className="text-sm text-gray-400 mt-2">RCCAs without department information are excluded from this chart.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showTrendChartFullscreen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 transition-opacity duration-300">
          <div
            className={`bg-white rounded-xl p-8 max-w-4xl w-full mx-4 shadow-lg relative flex flex-col transform transition-all duration-300 ${trendModalVisible ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}`}
            style={{ minHeight: 600, height: 600, width: 1000, maxWidth: '100%' }}
          >
            <button onClick={closeTrendModal} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold" aria-label="Close">×</button>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-semibold text-gray-900">RCCA Trend ({trendPeriod})</h3>
              <div className="flex items-center gap-2">
                <button
                  className="p-2 rounded-full hover:bg-gray-100"
                  style={{ zIndex: 10 }}
                  onClick={e => { e.stopPropagation(); /* Optionally open a filter modal if needed */ }}
                  title="Filter"
                >
                  <FilterIcon className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            <div className="mb-4 flex flex-col sm:flex-row sm:items-end gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Factory Filter</label>
                <select
                  value={selectedFactory}
                  onChange={e => setSelectedFactory(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  style={{ maxWidth: 200 }}
                >
                  <option value="All">All</option>
                  {factoryOptions.map(fac => (
                    <option key={fac} value={fac}>{fac}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {trendPeriod === 'Custom' ? 'Date Range' : 'All Time'}
                </label>
                {trendPeriod === 'Custom' ? (
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={customRange ? customRange.from.toISOString().slice(0, 10) : ''}
                      onChange={e => {
                        if (!customRange) return;
                        const from = new Date(e.target.value);
                        from.setHours(0, 0, 0, 0);
                        setCustomRange({ ...customRange, from });
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      style={{ maxWidth: 120 }}
                    />
                    <span className="self-center">to</span>
                    <input
                      type="date"
                      value={customRange ? customRange.to.toISOString().slice(0, 10) : ''}
                      onChange={e => {
                        if (!customRange) return;
                        const to = new Date(e.target.value);
                        to.setHours(23, 59, 59, 999);
                        setCustomRange({ ...customRange, to });
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      style={{ maxWidth: 120 }}
                    />
                  </div>
                ) : (
                  <div className="px-3 py-2 text-gray-500 bg-gray-100 rounded-lg">
                    Showing all trends from beginning
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
                <select
                  value={trendPeriod}
                  onChange={e => {
                    const period = e.target.value as 'Custom' | 'All Time';
                    setTrendPeriod(period);
                    if (period === 'Custom') {
                      // Default custom range: last 7 days
                      const to = new Date();
                      const from = new Date();
                      from.setDate(to.getDate() - 6);
                      from.setHours(0, 0, 0, 0);
                      to.setHours(23, 59, 59, 999);
                      setCustomRange({ from, to });
                    } else {
                      // All Time - no custom range needed
                      setCustomRange(null);
                    }
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  style={{ maxWidth: 200 }}
                >
                  <option value="Custom">Custom Range</option>
                  <option value="All Time">All Time</option>
                </select>
              </div>
            </div>
            <div className="flex-1 flex items-center justify-center" style={{ height: '100%', width: '100%' }}>
              <Bar data={chartData} options={chartOptions} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
