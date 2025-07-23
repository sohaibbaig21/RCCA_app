import React, { useState, useEffect } from 'react';
import { Search, Filter, Eye, FileText, Download, Edit as EditIcon, Trash as TrashIcon, CheckCircle, XCircle } from 'lucide-react';
import { rccaService } from '../services/api';
import * as XLSX from 'xlsx';
import { useLocation } from 'react-router-dom';
import { ERROR_CATEGORIES } from '../types/errorCategories';

interface RCCA {
  _id?: string; // MongoDB document id
  id: string;
  title: string;
  description: string;
  department?: string;
  priority?: string;
  status?: string;
  createdBy?: string;
  createdAt?: string | Date;
  problemStatement?: string;
  immediateActions?: string;
  rootCauseAnalysis?: string;
  correctiveActions?: string;
  preventiveActions?: string;
  verification?: string;
  effectiveness?: string;
  lessons?: string;
  attachments?: string[];
  assignedTo?: string;
  dueDate?: string;
  completedDate?: string;
  reviewedBy?: string;
  approvedBy?: string;
  cost?: number;
  impact?: string;
  riskLevel?: string;
  notificationNumber?: string; // Added for new table
  sapEquipment?: string; // Added for new table
  problemDescription?: string; // Added for new table
  mentionProblem?: string; // Added for new table
  factoryName?: string;
  assignedMembers?: any[]; // Team members who can edit this RCCA
  rejectionReason?: string; // Added for rejected RCCAs
  errorCategory?: string; // Added for new table
  editingPermissions?: {
    creator: string;
    teamMembers: string[];
    admins: string[];
    lastUpdated: Date;
  };
}

interface RCCAListProps {
  onEdit: (rcca: RCCA) => void;
  isAdmin?: boolean;
  onBack?: () => void;
  user?: any;
  overdueOnly?: boolean;
  darkMode?: boolean;
}

interface Filters {
  search: string;
  department: string;
  priority: string;
  status: string;
  dateRange: string;
  createdBy: string;
  factory: string;
  errorCategory?: string;
}

function renderFieldValue(value: any): React.ReactNode {
  if (value === null || value === undefined) return <span className="text-gray-400">N/A</span>;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return <span>{String(value)}</span>;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-gray-400">Empty</span>;
    return (
      <ul className="list-disc pl-5 space-y-1">
        {value.map((item, idx) => (
          <li key={typeof item === 'object' && item !== null && 'id' in item ? item.id : idx}>{renderFieldValue(item)}</li>
        ))}
      </ul>
    );
  }
  if (typeof value === 'object') {
    return (
      <div className="ml-2 border-l-2 border-gray-100 pl-3">
        {Object.entries(value).map(([k, v]) => (
          <div key={k} className="mb-1">
            <span className="font-semibold text-gray-700">{k}:</span> {renderFieldValue(v)}
          </div>
        ))}
      </div>
    );
  }
  return <span>{String(value)}</span>;
}

const RCCAList: React.FC<RCCAListProps> = ({ isAdmin = false, onBack, user, overdueOnly, onEdit, darkMode = false }) => {
  const location = useLocation();
  const [rccas, setRccas] = useState<RCCA[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [deletingRCCA, setDeletingRCCA] = useState<RCCA | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleting, setDeleting] = useState(false);
  // const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [viewingRCCA, setViewingRCCA] = useState<RCCA | null>(null);
  const [approving, setApproving] = useState(false);
  const [rejectingRCCA, setRejectingRCCA] = useState<RCCA | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  
  const [filters, setFilters] = useState<Filters>({
    search: '',
    department: '',
    priority: '',
    status: '',
    dateRange: 'all',
    createdBy: '',
    factory: '',
    errorCategory: '',
  });

  // Parse status from query string and update filters.status
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const status = params.get('status') || '';
    setFilters(prev => ({ ...prev, status }));
  }, [location.search]);

  // Load RCCAs on component mount
  useEffect(() => {
    loadRCCAs();
  }, []);

  // User-friendly message if no RCCAs are loaded at all
  const noRCCAsLoaded = !loading && rccas.length === 0;

  const loadRCCAs = async () => {
    try {
      setLoading(true);
      setError(null);
      // Get both approved RCCAs and drafts from backend
      const [backendRCCAs, backendDrafts] = await Promise.all([
        rccaService.getRCCAs(),
        rccaService.getDrafts()
      ]);
      // Merge backend RCCAs and drafts
      const allRCCAs = [...backendRCCAs, ...backendDrafts];
      setRccas(allRCCAs);
    } catch (err) {
      setError('Failed to load RCCAs');
      console.error('Error loading RCCAs:', err);
    } finally {
      setLoading(false);
    }
  };

  // Helper to get local drafts for the current user
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
    } catch {
      return [];
    }
  }

  // Helper function to check if current user can edit a specific RCCA
  const canUserEditRCCA = (rcca: RCCA): boolean => {
    if (!user) return false;
    
    // Check if RCCA has the new permission system
    if (rcca.editingPermissions) {
      const permissions = rcca.editingPermissions;
      
      // Creator always has permission
      if (permissions.creator === user.id) return true;
      
      // Admins have permission
      if (isAdmin && permissions.admins.includes(user.id)) return true;
      
      // For draft status: Team members have permission
      if (rcca.status === 'Draft' && permissions.teamMembers.includes(user.id)) {
        return true;
      }
      
      // For submitted status: Only creator and admins can edit
      if (rcca.status !== 'Draft') {
        return false; // Only creator and admins handled above
      }
      
      return false;
    }
    
    // Fallback for old RCCAs without permission system
    // Admins can edit any RCCA
    if (isAdmin) return true;
    
    // Creator can always edit their own RCCA
    if (String(rcca.createdBy).trim() === String(user.id).trim()) return true;
    
    // Check if user is a team member
    if (rcca.assignedMembers && Array.isArray(rcca.assignedMembers)) {
      return rcca.assignedMembers.some((member: any) => {
        // Handle both string and object formats
        const memberId = typeof member === 'string' ? member : member.id;
        return String(memberId).trim() === String(user.id).trim();
      });
    }
    
    return false;
  };

  // Filter RCCAs based on current filters and user role
  let filteredRCCAs: RCCA[];
  if (filters.status === 'Draft') {
    // Get drafts from the loaded RCCAs (which now includes backend drafts)
    const backendDrafts = rccas.filter(rcca => rcca.status === 'Draft');
    const localDrafts = getLocalDrafts();
    const allDraftsMap = new Map();
    for (const d of [...backendDrafts, ...localDrafts]) {
      allDraftsMap.set(d.id, d);
    }
    filteredRCCAs = Array.from(allDraftsMap.values());
    
    // Filter by permissions for non-admins
    if (!isAdmin) {
      filteredRCCAs = filteredRCCAs.filter(rcca => canUserEditRCCA(rcca));
    }
  } else if (filters.status === 'Approved') {
    // For approved RCCAs, show all for admins, but only those approved by current user for employees
    filteredRCCAs = rccas.filter(rcca => {
      if (isAdmin) {
        return rcca.status === 'Approved';
      } else {
        return rcca.status === 'Approved' && String(rcca.approvedBy).trim() === String(user?.id).trim();
      }
    });
  } else {
    filteredRCCAs = rccas.filter(rcca => {
      if (isAdmin) {
        // Admin can see all RCCAs with any filter
        const matchesSearch = !filters.search || 
          rcca.title?.toLowerCase().includes(filters.search.toLowerCase()) ||
          rcca.id?.toLowerCase().includes(filters.search.toLowerCase()) ||
          rcca.description?.toLowerCase().includes(filters.search.toLowerCase()) ||
          rcca.notificationNumber?.toLowerCase().includes(filters.search.toLowerCase()) ||
          rcca.sapEquipment?.toLowerCase().includes(filters.search.toLowerCase()) ||
          rcca.mentionProblem?.toLowerCase().includes(filters.search.toLowerCase()) ||
          rcca.problemDescription?.toLowerCase().includes(filters.search.toLowerCase());
        const matchesDepartment = !filters.department || rcca.department === filters.department;
        const matchesPriority = !filters.priority || rcca.priority === filters.priority;
        const matchesStatus = !filters.status || 
          (filters.status === 'Submitted' ? rcca.status === 'Submitted' : rcca.status === filters.status);
        const matchesCreatedBy = !filters.createdBy || rcca.createdBy?.includes(filters.createdBy);
        const matchesFactory = !filters.factory || rcca.factoryName === filters.factory;
        const matchesErrorCategory = !filters.errorCategory || rcca.errorCategory === filters.errorCategory;
        let matchesDateRange = true;
        if (filters.dateRange !== 'all' && rcca.createdAt) {
          const createdDate = new Date(rcca.createdAt);
          const now = new Date();
          const daysAgo = parseInt(filters.dateRange);
          const cutoffDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
          matchesDateRange = createdDate >= cutoffDate;
        }
        return matchesSearch && matchesDepartment && matchesPriority && matchesStatus && matchesCreatedBy && matchesFactory && matchesDateRange && matchesErrorCategory;
      } else {
        // For employees: show all RCCAs when no specific status filter is applied (Total RCCAs view)
        // but restrict to their own RCCAs for specific status filters
        const isSpecificStatusFilter = filters.status && filters.status !== '';
        const isOwnRCCA = String(rcca.createdBy).trim() === String(user?.id).trim();
        
        // If there's a specific status filter, only show employee's own RCCAs
        if (isSpecificStatusFilter && !isOwnRCCA) {
          return false;
        }
        
        const matchesSearch = !filters.search || 
          rcca.title?.toLowerCase().includes(filters.search.toLowerCase()) ||
          rcca.id?.toLowerCase().includes(filters.search.toLowerCase()) ||
          rcca.description?.toLowerCase().includes(filters.search.toLowerCase()) ||
          rcca.notificationNumber?.toLowerCase().includes(filters.search.toLowerCase()) ||
          rcca.sapEquipment?.toLowerCase().includes(filters.search.toLowerCase()) ||
          rcca.mentionProblem?.toLowerCase().includes(filters.search.toLowerCase()) ||
          rcca.problemDescription?.toLowerCase().includes(filters.search.toLowerCase());
        const matchesDepartment = !filters.department || rcca.department === filters.department;
        const matchesPriority = !filters.priority || rcca.priority === filters.priority;
        const matchesStatus = !filters.status || 
          (filters.status === 'Submitted' ? rcca.status === 'Submitted' : rcca.status === filters.status);
        const matchesCreatedBy = !filters.createdBy || rcca.createdBy?.includes(filters.createdBy);
        const matchesFactory = !filters.factory || rcca.factoryName === filters.factory;
        const matchesErrorCategory = !filters.errorCategory || rcca.errorCategory === filters.errorCategory;
        let matchesDateRange = true;
        if (filters.dateRange !== 'all' && rcca.createdAt) {
          const createdDate = new Date(rcca.createdAt);
          const now = new Date();
          const daysAgo = parseInt(filters.dateRange);
          const cutoffDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
          matchesDateRange = createdDate >= cutoffDate;
        }
        return matchesSearch && matchesDepartment && matchesPriority && matchesStatus && matchesCreatedBy && matchesFactory && matchesDateRange && matchesErrorCategory;
      }
    });
  }

  let tableRCCAs = filteredRCCAs;
  if (overdueOnly) {
    const now = new Date();
    tableRCCAs = filteredRCCAs.filter(rcca => {
      if (!rcca.createdAt) return false;
      const createdDate = new Date(rcca.createdAt);
      const daysDiff = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
      return (
        rcca.status === 'Submitted' &&
        !rcca.approvedBy &&
        daysDiff > 10
      );
    });
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft': return 'bg-gray-100 text-gray-800';
      case 'Submitted': return 'bg-blue-100 text-blue-800';
      case 'In Progress': return 'bg-yellow-100 text-yellow-800';
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Approved': return 'bg-green-100 text-green-800';
      case 'Rejected': return 'bg-red-100 text-red-800';
      case 'Deleted': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'bg-red-100 text-red-800';
      case 'High': return 'bg-orange-100 text-orange-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleView = (rcca: RCCA) => {
    setViewingRCCA(rcca);
  };

  const handleDelete = (rcca: RCCA) => {
    setDeletingRCCA(rcca);
    setDeleteReason('');
  };

  // Update confirmDelete to handle localStorage drafts
  const confirmDelete = async () => {
    if (!deletingRCCA || !deleteReason.trim()) return;
    try {
      setDeleting(true);
      setError(null);
      // If local draft (no _id, only id)
      if (!deletingRCCA._id) {
        // Remove from localStorage
        const draftsJSON = localStorage.getItem('rccaDrafts') || '[]';
        let drafts = JSON.parse(draftsJSON);
        drafts = drafts.filter((d: any) => d.id !== deletingRCCA.id);
        localStorage.setItem('rccaDrafts', JSON.stringify(drafts));
        // Remove from UI
        setRccas(prev => prev.filter(rcca => (rcca._id || rcca.id) !== (deletingRCCA._id || deletingRCCA.id)));
      } else {
        // Backend draft
        await rccaService.deleteRCCA(deletingRCCA._id || deletingRCCA.id, deleteReason.trim());
        setRccas(prev => prev.filter(rcca => (rcca._id || rcca.id) !== (deletingRCCA._id || deletingRCCA.id)));
      }
      setDeletingRCCA(null);
      setDeleteReason('');
    } catch (err) {
      setError(`Failed to delete RCCA: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setDeleting(false);
    }
  };

  const handleDownloadSingleExcel = (rcca: RCCA) => {
    try {
      const data = [{
        'RCCA ID': rcca.id || '',
        'Title': rcca.title || '',
        'Description': rcca.description || '',
        'Department': rcca.department || '',
        'Priority': rcca.priority || '',
        'Status': rcca.status || '',
        'Created By': rcca.createdBy || '',
        'Created Date': rcca.createdAt ? new Date(rcca.createdAt).toLocaleDateString() : '',
        'Problem Statement': rcca.problemStatement || '',
        'Immediate Actions': rcca.immediateActions || '',
        'Root Cause Analysis': rcca.rootCauseAnalysis || '',
        'Corrective Actions': rcca.correctiveActions || '',
        'Preventive Actions': rcca.preventiveActions || '',
        'Verification': rcca.verification || '',
        'Effectiveness': rcca.effectiveness || '',
        'Lessons Learned': rcca.lessons || '',
        'Assigned To': rcca.assignedTo || '',
        'Due Date': rcca.dueDate || '',
        'Completed Date': rcca.completedDate || '',
        'Reviewed By': rcca.reviewedBy || '',
        'Approved By': rcca.approvedBy || '',
        'Cost': rcca.cost || '',
        'Impact': rcca.impact || '',
        'Risk Level': rcca.riskLevel || '',
        'Attachments': rcca.attachments?.join(', ') || ''
      }];

      const ws = XLSX.utils.json_to_sheet(data);
      
      // Auto-size columns
      const colWidths = Object.keys(data[0]).map(key => ({
        wch: Math.max(key.length, String(data[0][key as keyof typeof data[0]]).length) + 2
      }));
      ws['!cols'] = colWidths;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'RCCA Report');
      
      XLSX.writeFile(wb, `RCCA_${rcca.id}_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (err) {
      console.error('Error generating Excel:', err);
      setError('Failed to generate Excel file');
    }
  };

  const handleDownloadSinglePDF = (rcca: RCCA) => {
    try {
      // Create a comprehensive HTML content for PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>RCCA Report - ${rcca.id}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.4; }
            .header { background-color: #dc2626; color: white; padding: 15px; text-align: center; margin-bottom: 20px; }
            .section { margin-bottom: 20px; }
            .section-title { background-color: #f3f4f6; padding: 8px; font-weight: bold; border-left: 4px solid #dc2626; }
            .field { margin: 8px 0; }
            .field-label { font-weight: bold; display: inline-block; width: 150px; }
            .field-value { display: inline-block; }
            table { width: 100%; border-collapse: collapse; margin: 10px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #dc2626; color: white; }
            .long-text { white-space: pre-wrap; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Root Cause Corrective Action Report</h1>
            <h2>${rcca.title}</h2>
            <p>RCCA ID: ${rcca.id}</p>
          </div>

          <div class="section">
            <div class="section-title">Basic Information</div>
            <table>
              <tr><th>Field</th><th>Value</th></tr>
              <tr><td>Department</td><td>${rcca.department || 'N/A'}</td></tr>
              <tr><td>Priority</td><td>${rcca.priority || 'N/A'}</td></tr>
              <tr><td>Status</td><td>${rcca.status || 'N/A'}</td></tr>
              <tr><td>Created By</td><td>${rcca.createdBy || 'N/A'}</td></tr>
              <tr><td>Created Date</td><td>${rcca.createdAt ? new Date(rcca.createdAt).toLocaleDateString() : 'N/A'}</td></tr>
              <tr><td>Assigned To</td><td>${rcca.assignedTo || 'N/A'}</td></tr>
              <tr><td>Due Date</td><td>${rcca.dueDate || 'N/A'}</td></tr>
            </table>
          </div>

          <div class="section">
            <div class="section-title">Problem Analysis</div>
            <table>
              <tr><th>Field</th><th>Description</th></tr>
              <tr><td>Problem Statement</td><td class="long-text">${rcca.problemStatement || 'N/A'}</td></tr>
              <tr><td>Immediate Actions</td><td class="long-text">${rcca.immediateActions || 'N/A'}</td></tr>
              <tr><td>Root Cause Analysis</td><td class="long-text">${rcca.rootCauseAnalysis || 'N/A'}</td></tr>
            </table>
          </div>

          <div class="section">
            <div class="section-title">Actions & Verification</div>
            <table>
              <tr><th>Field</th><th>Description</th></tr>
              <tr><td>Corrective Actions</td><td class="long-text">${rcca.correctiveActions || 'N/A'}</td></tr>
              <tr><td>Preventive Actions</td><td class="long-text">${rcca.preventiveActions || 'N/A'}</td></tr>
              <tr><td>Verification</td><td class="long-text">${rcca.verification || 'N/A'}</td></tr>
              <tr><td>Effectiveness</td><td class="long-text">${rcca.effectiveness || 'N/A'}</td></tr>
              <tr><td>Lessons Learned</td><td class="long-text">${rcca.lessons || 'N/A'}</td></tr>
            </table>
          </div>

          <div class="section">
            <div class="section-title">Additional Information</div>
            <table>
              <tr><th>Field</th><th>Value</th></tr>
              <tr><td>Completed Date</td><td>${rcca.completedDate || 'N/A'}</td></tr>
              <tr><td>Reviewed By</td><td>${rcca.reviewedBy || 'N/A'}</td></tr>
              <tr><td>Approved By</td><td>${rcca.approvedBy || 'N/A'}</td></tr>
              <tr><td>Cost</td><td>${rcca.cost ? `$${rcca.cost.toLocaleString()}` : 'N/A'}</td></tr>
              <tr><td>Impact</td><td>${rcca.impact || 'N/A'}</td></tr>
              <tr><td>Risk Level</td><td>${rcca.riskLevel || 'N/A'}</td></tr>
              <tr><td>Attachments</td><td>${rcca.attachments?.join(', ') || 'None'}</td></tr>
            </table>
          </div>

          <div style="margin-top: 30px; text-align: center; color: #666; font-size: 12px;">
            Generated on ${new Date().toLocaleString()}
          </div>
        </body>
        </html>
      `;

      // Create a new window and print
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        
        // Wait for content to load then print
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print();
          }, 500);
        };
      }
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError('Failed to generate PDF');
    }
  };

  // Approve handler
  const handleApprove = async (rcca: RCCA) => {
    setApproving(true);
    try {
      await rccaService.approveRCCA(rcca._id || rcca.id, user?.id);
      setRccas(prev => prev.map(item => (item._id === rcca._id ? { ...item, status: 'Approved', approvedBy: user?.id } : item)));
    } catch (err) {
      setError('Failed to approve RCCA');
    } finally {
      setApproving(false);
    }
  };

  // Reject handler
  const handleReject = (rcca: RCCA) => {
    setRejectingRCCA(rcca);
    setRejectReason('');
  };

  const confirmReject = async () => {
    if (!rejectingRCCA || !rejectReason.trim()) return;
    setApproving(true);
    try {
      await rccaService.rejectRCCA(rejectingRCCA._id || rejectingRCCA.id, rejectReason.trim());
      setRccas(prev => prev.map(item => (item._id === rejectingRCCA._id ? { ...item, status: 'Rejected', rejectionReason: rejectReason.trim() } : item)));
      setRejectingRCCA(null);
      setRejectReason('');
    } catch (err) {
      setError('Failed to reject RCCA');
    } finally {
      setApproving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <span className="text-gray-500">Loading RCCAs...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">RCCA Management</h2>
          <p className="text-gray-600 dark:text-gray-400">Manage Root Cause Corrective Actions</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
              showFilters ? 'bg-red-600 text-white dark:bg-red-500' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </button>
          {onBack && (
            <button
              onClick={onBack}
              className="ml-2 px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 font-semibold dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              Back
            </button>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* No RCCAs loaded at all (API/network issue) */}
      {noRCCAsLoaded && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
          <p>No RCCAs could be loaded from the server.</p>
          <p className="text-sm mt-1">Possible reasons: Backend/API is down, network issue, or no RCCAs exist in the system yet.</p>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 dark:bg-gray-800 dark:border-gray-700">
        <div className="flex flex-col lg:flex-row gap-4 mb-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                placeholder="Search by notification number, machine name, problem description, or any other field..."
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
              />
            </div>
          </div>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 pt-4 border-t border-gray-200 dark:border-gray-600">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">Department</label>
              <select
                value={filters.department}
                onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">Select department</option>
                <option value="Human Resources">Human Resources</option>
                <option value="Marketing">Marketing</option>
                <option value="Director">Director</option>
                <option value="Operations">Operations</option>
                <option value="Research and Development">Research and Development</option>
                <option value="Production">Production</option>
                <option value="Customer Service">Customer Service</option>
                <option value="Supply Chain">Supply Chain</option>
                <option value="Quality">Quality</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">Factory</label>
              <select
                value={filters.factory}
                onChange={(e) => setFilters(prev => ({ ...prev, factory: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">All</option>
                <option value="DPL 1">DPL 1</option>
                <option value="DPL 2">DPL 2</option>
                <option value="URIL">URIL</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
              <select
                value={filters.dateRange}
                onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="all">All Time</option>
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Error Category</label>
              <select
                value={filters.errorCategory}
                onChange={e => setFilters(prev => ({ ...prev, errorCategory: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="">All</option>
                {ERROR_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="">All Statuses</option>
                <option value="Approved">Approved</option>
                <option value="Submitted">Pending</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Created By</label>
              <input
                type="text"
                value={filters.createdBy}
                onChange={(e) => setFilters(prev => ({ ...prev, createdBy: e.target.value }))}
                placeholder="User ID"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
          </div>
        )}
      </div>

      {/* Main RCCA Records Table/List */}
      {!overdueOnly && (
        <div className="bg-white rounded-lg shadow p-4 mt-4 overflow-y-auto" style={{ maxHeight: '320px' }}>
          <table className="min-w-full border border-gray-200 rounded-lg">
            <thead className="sticky top-0 bg-gray-100 z-10">
              <tr className="bg-gray-100">
                <th className="px-4 py-2 text-left">Notification #</th>
                <th className="px-4 py-2 text-left">Equipment</th>
                <th className="px-4 py-2 text-left">Description</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Created At</th>
                <th className="px-4 py-2 text-left">Created By</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tableRCCAs.length === 0 && !noRCCAsLoaded ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500">
                    {filters.status === 'Draft' ? (
                      <>
                        <p className="text-gray-500">No draft RCCAs found.</p>
                        <p className="text-sm text-gray-400 mt-2">
                          Create a new RCCA to see it listed here.
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-gray-500">No RCCAs found matching your criteria.</p>
                        <p className="text-sm text-gray-400 mt-2">
                          Try adjusting your filters.
                        </p>
                      </>
                    )}
                  </td>
                </tr>
              ) : (
                tableRCCAs.map((rcca) => (
                  <tr key={rcca.id} className="border-t border-gray-200 hover:bg-gray-50">
                    <td className="px-4 py-2 whitespace-nowrap">
                      {rcca.notificationNumber || 'N/A'}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {rcca.sapEquipment || 'N/A'}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {rcca.problemDescription || rcca.mentionProblem || rcca.description || 'N/A'}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {rcca.status || 'Draft'}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {rcca.createdAt ? new Date(rcca.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-4 py-2">{rcca.createdBy}</td>
                    <td className="px-4 py-2 space-x-2">
                      {/* View Button */}
                      <button 
                        onClick={() => setViewingRCCA(rcca)} 
                        title="View" 
                        className="inline-flex items-center p-1 text-blue-600 hover:bg-blue-100 rounded"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      {/* Edit Button */}
                      {canUserEditRCCA(rcca) && (
                        <>
                          <button 
                            onClick={() => onEdit(rcca)} 
                            title="Edit" 
                            className="inline-flex items-center p-1 text-yellow-600 hover:bg-yellow-100 rounded"
                          >
                            <EditIcon className="w-5 h-5" />
                          </button>
                          {/* Delete Button for Draft RCCAs - only for creator */}
                          {rcca.status === 'Draft' && String(rcca.createdBy).trim() === String(user?.id).trim() && (
                            <button
                              onClick={() => handleDelete(rcca)}
                              title="Delete Draft"
                              className="inline-flex items-center p-1 text-red-600 hover:bg-red-100 rounded ml-1"
                            >
                              <TrashIcon className="w-5 h-5" />
                            </button>
                          )}
                        </>
                      )}
                      {/* Download PDF */}
                      <button 
                        onClick={() => handleDownloadSinglePDF(rcca)} 
                        title="Download PDF" 
                        className="inline-flex items-center p-1 text-gray-700 hover:bg-gray-200 rounded"
                      >
                        <FileText className="w-5 h-5" />
                      </button>
                      {/* Download Excel */}
                      <button 
                        onClick={() => handleDownloadSingleExcel(rcca)} 
                        title="Download Excel" 
                        className="inline-flex items-center p-1 text-green-600 hover:bg-green-100 rounded"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                      {/* Approve/Reject for Admins, Submitted only */}
                      {isAdmin && rcca.status === 'Submitted' && (
                        <>
                          <button
                            onClick={() => handleApprove(rcca)}
                            title="Approve RCCA"
                            className="inline-flex items-center p-1 text-green-600 hover:bg-green-100 rounded ml-1"
                            disabled={approving}
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleReject(rcca)}
                            title="Reject RCCA"
                            className="inline-flex items-center p-1 text-red-600 hover:bg-red-100 rounded ml-1"
                            disabled={approving}
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        </>
                      )}
                    </td>
                </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        )}


      {/* Delete Confirmation Modal */}
      {deletingRCCA && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete RCCA</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete "{deletingRCCA.title}"? This action cannot be undone.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for deletion *
              </label>
              <textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Please provide a reason for deleting this RCCA"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setDeletingRCCA(null);
                  setDeleteReason('');
                }}
                disabled={deleting}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={!deleteReason.trim() || deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View RCCA Modal */}
      {viewingRCCA && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">View RCCA: {viewingRCCA.title}</h3>
              <button
                onClick={() => setViewingRCCA(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              {Object.entries(viewingRCCA).map(([key, value]) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{key}</label>
                  <div className="text-sm text-gray-900">{renderFieldValue(value)}</div>
                </div>
              ))}
              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button
                  onClick={() => setViewingRCCA(null)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectingRCCA && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reject RCCA</h3>
            <p className="text-gray-600 mb-4">
              Please provide a reason for rejecting "{rejectingRCCA.title}".
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for rejection *
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Please provide a reason for rejecting this RCCA"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setRejectingRCCA(null);
                  setRejectReason('');
                }}
                disabled={approving}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmReject}
                disabled={!rejectReason.trim() || approving}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {approving ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};



export default RCCAList;