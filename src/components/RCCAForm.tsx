import React, { useState, useEffect } from 'react';
import { 
  Save, 
  Send, 
  Plus, 
  Minus,  
  Users, 
  ArrowLeft,
  FileText,
  AlertCircle
} from 'lucide-react';
import { rccaService, emailService, userService } from '../services/api';
import emailjs from 'emailjs-com';
import { ERROR_CATEGORIES } from '../types/errorCategories';

import { useParams, useNavigate, useLocation } from 'react-router-dom';
import EmployeeSelect from './EmployeeSelect';

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

interface RCCAFormProps {
  user: any;
  isAdmin: boolean;
  onBack: () => void;
  editingRCCA?: any;
  darkMode?: boolean;
}

const RCCAForm: React.FC<RCCAFormProps> = ({ user, isAdmin, onBack, editingRCCA, darkMode = false }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Normalize assignedMembers to always be array of objects
  function normalizeMembers(members: any[] = []) {
    return members.map(m =>
      typeof m === 'string'
        ? { id: m, name: employees.find(e => String(e.id).trim() === String(m).trim())?.name || m, department: '' }
        : { id: m.id, name: m.name || employees.find(e => String(e.id).trim() === String(m.id).trim())?.name || m.id, department: m.department || '' }
    );
  }

  const [formData, setFormData] = useState(() => {
    const initialMembers = editingRCCA?.assignedMembers || [];
    let initialErrorCategory = editingRCCA?.errorCategory || '';
    if (!initialErrorCategory) initialErrorCategory = 'Human Error';
    return {
      id: editingRCCA?.id || `RCCA-${Date.now()}`,
      title: editingRCCA?.title || '',
      description: editingRCCA?.description || '',
      department: editingRCCA?.department || '',
      priority: editingRCCA?.priority || '',
      status: editingRCCA?.status || 'Draft',
      createdBy: editingRCCA?.createdBy || user.id,
      createdAt: editingRCCA?.createdAt || new Date(),
      updatedAt: new Date(),
      assignedMembers: normalizeMembers(initialMembers),
      causesEffects: editingRCCA?.causesEffects || '',
      notificationNumber: editingRCCA?.notificationNumber || '',
      sapEquipment: editingRCCA?.sapEquipment || '',
      whereHappened: editingRCCA?.whereHappened || '',
      problemNoticedDate: editingRCCA?.problemNoticedDate || '',
      problemNoticedTime: editingRCCA?.problemNoticedTime || '',
      problemNoticedShift: editingRCCA?.problemNoticedShift || '',
      reportedDate: editingRCCA?.reportedDate || '',
      reportedTime: editingRCCA?.reportedTime || '',
      numberOfLots: editingRCCA?.numberOfLots || '',
      totalQuantity: editingRCCA?.totalQuantity || '',
      piecesAffected: editingRCCA?.piecesAffected || '',
      videoLink: editingRCCA?.videoLink || '',
      rccaChampion: editingRCCA?.rccaChampion || '',
      championEmail: editingRCCA?.championEmail || '',
      otherResources: editingRCCA?.otherResources || '',
      problemDescription: editingRCCA?.problemDescription || '',
      beforeImages: editingRCCA?.beforeImages || [],
      afterImages: editingRCCA?.afterImages || [],
      immediateActions: editingRCCA?.immediateActions || '',
      customerSorting: editingRCCA?.customerSorting || '',
      customerRework: editingRCCA?.customerRework || '',
      manufacturerSorting: editingRCCA?.manufacturerSorting || '',
      manufacturerRework: editingRCCA?.manufacturerRework || '',
      shipAudit: editingRCCA?.shipAudit || '',
      rootCauseAnalysis: editingRCCA?.rootCauseAnalysis || { failureModes: [] },
      correctiveActions: editingRCCA?.correctiveActions || '',
      preventiveActions: editingRCCA?.preventiveActions || '',
      verification: editingRCCA?.verification || '',
      validationActions: editingRCCA?.validationActions || [],
      followUp: editingRCCA?.followUp || '',
      mentionProblem: editingRCCA?.mentionProblem || '',
      customerName: editingRCCA?.customerName || '',
      factoryName: editingRCCA?.factoryName || user?.factory || 'DPL 1',
      errorCategory: initialErrorCategory,
      pictureAvail: editingRCCA?.pictureAvail ?? true,
      championDepartment: editingRCCA?.championDepartment || '',
      customerActions: editingRCCA?.customerActions || [],
      implementedBy: editingRCCA?.implementedBy || '',
      verifiedBy: editingRCCA?.verifiedBy || '',
      manufacturerActions: editingRCCA?.manufacturerActions || [],
      manufacturerImplementedBy: editingRCCA?.manufacturerImplementedBy || '',
      manufacturerVerifiedBy: editingRCCA?.manufacturerVerifiedBy || '',
      inTransitActions: editingRCCA?.inTransitActions || [],
      inTransitImplementedBy: editingRCCA?.inTransitImplementedBy || '',
      inTransitVerifiedBy: editingRCCA?.inTransitVerifiedBy || '',
      causeEffectDetails: editingRCCA?.causeEffectDetails || {
        'Man': [],
        'Machine': [],
        'Material': [],
        'Method': [],
        'Measure': []
      },
      permanentActions: editingRCCA?.permanentActions || [],
      lotConfirmations: editingRCCA?.lotConfirmations || [],
      similarProcesses: editingRCCA?.similarProcesses || [],
      managerQA: editingRCCA?.managerQA || '',
      headProduction: editingRCCA?.headProduction || '',
      headQuality: editingRCCA?.headQuality || '',
      // Permission system
      editingPermissions: editingRCCA?.editingPermissions || {
        creator: user.id,
        teamMembers: [],
        admins: [], // Will be populated with admin IDs
        lastUpdated: new Date()
      },
    };
  });

  const [activeSection, setActiveSection] = useState(0);
  const [showMemberSelector, setShowMemberSelector] = useState(false);
  const [availableMembers] = useState([
    { id: 'c92001', name: 'sohaib' },
    { id: 'c92003', name: 'zeeshan' },
    { id: '26120081', name: 'Aqsa Khan Jadoon' },
    { id: 'sohaibbaig29', name: 'sohaibbaig29' }
  ]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedTeamMember, setSelectedTeamMember] = useState('');
  const [selectedTeamMemberDept, setSelectedTeamMemberDept] = useState('');
  const [showOtherResources, setShowOtherResources] = useState(formData.otherResources ? true : false);
  const [showAddTeamMemberFields, setShowAddTeamMemberFields] = useState(false);
  // Email status state (commented out as not currently used)
  // const [emailError, setEmailError] = useState<string | null>(null);
  // const [emailSuccess, setEmailSuccess] = useState<string | null>(null);
  const [showCustomerSection, setShowCustomerSection] = useState(false);
  const [showManufacturerSection, setShowManufacturerSection] = useState(false);
  const [showInTransitSection, setShowInTransitSection] = useState(false);
  const [showHowManyAffected, setShowHowManyAffected] = useState(false);

  // Manual email status state
  const [manualEmailError, setManualEmailError] = useState<string | null>(null);
  const [manualEmailSuccess, setManualEmailSuccess] = useState<string | null>(null);

  // Add state for custom error category and department
  const [customErrorCategory, setCustomErrorCategory] = useState('');
  const [customDepartment, setCustomDepartment] = useState('');

  // Permission checking function
  const hasEditPermission = () => {
    if (!user) return false;
    
    // For draft status: Always allow editing
    if (formData.status === 'Draft') {
      return true;
    }
    
    const permissions = formData.editingPermissions;
    
    if (!permissions) {
      return true; // Fallback for old RCCAs
    }
    
    // Creator always has permission
    if (permissions.creator === user.id) {
      return true;
    }
    
    // Admins have permission
    if (isAdmin && permissions.admins.includes(user.id)) {
      return true;
    }
    
    // For submitted status: Only creator and admins can edit
    if (formData.status !== 'Draft') {
      return false; // Only creator and admins handled above
    }
    
    return false;
  };

  // Update permissions when team members change
  const updateEditingPermissions = () => {
    const teamMemberIds = formData.assignedMembers.map((member: any) => member.id);
    setFormData(prev => ({
      ...prev,
      editingPermissions: {
        ...prev.editingPermissions,
        teamMembers: teamMemberIds,
        lastUpdated: new Date()
      }
    }));
  };

  // Helper function to get disabled state for form inputs
  const getInputDisabledState = () => {
    return !hasEditPermission();
  };

  useEffect(() => {
    userService.getAllUsers().then(data => {
      setEmployees(data);
      console.log("Loaded employees:", data); // Debug log
    });
    
    // If editingRCCA is not provided, try to get it from localStorage or fetch by id
    if (!editingRCCA && id) {
      // First try to get from localStorage (for rejected RCCAs)
      const storedRCCA = localStorage.getItem('editingRCCA');
      if (storedRCCA) {
        try {
          const parsedRCCA = JSON.parse(storedRCCA);
          setFormData(parsedRCCA);
          // Clear localStorage after using it
          localStorage.removeItem('editingRCCA');
          return;
        } catch (error) {
          console.error('Error parsing stored RCCA:', error);
        }
      }
      
      // Fallback to fetching from API
      rccaService.getAllRCCAs().then((rccas: any[]) => {
        const found = rccas.find(r => String(r.id) === String(id));
        if (found) {
          setFormData(found);
        }
      });
    }
  }, [id, editingRCCA]);

  // Early return after all hooks are declared
  if (!user) {
    navigate('/login', { state: { redirectTo: location.pathname } });
    return null;
  }

  const sections = [
    { 
      title: 'Describe and Understand the Situation', 
      icon: AlertCircle,
              tooltip: 'Document the problem as reported with notification number, equipment, location, dates, and quantities affected. Include all relevant details to establish a clear understanding of the issue scope and impact.'
    },
    { 
      title: 'Form the Team', 
      icon: Users,
              tooltip: 'Assemble a cross-functional team with champion leader and members from relevant departments. The champion will coordinate the entire RCCA process while team members provide expertise from their respective areas.'
    },
    { 
      title: 'Immediate Corrective Actions', 
      icon: FileText,
              tooltip: 'Document immediate actions taken to contain the problem and prevent further issues. These are temporary measures to stop the problem from worsening while the root cause analysis is conducted.'
    },
    { 
      title: 'Causes & Effects Analysis', 
      icon: FileText,
              tooltip: 'Analyze potential causes using 5M framework (Man, Machine, Material, Method, Measure) and determine which are root causes. This systematic approach helps identify all possible contributing factors.'
    },
    { 
      title: 'Root Cause Analysis (5-Why Method)', 
      icon: FileText,
              tooltip: 'Use 5-Why method to drill down and find the fundamental root cause. Ask "why" repeatedly until you reach the underlying systemic cause that, when addressed, will prevent the problem from recurring.'
    },
    { 
      title: 'Actions Required for a Permanent Solution', 
      icon: FileText,
              tooltip: 'Develop corrective and preventive actions to permanently eliminate the root cause. Corrective actions address the immediate problem while preventive actions ensure the issue never happens again.'
    },
    { 
      title: 'Validation and Lot Confirmation', 
      icon: FileText,
              tooltip: 'Verify that implemented solutions are effective with lot confirmations and evidence. This step ensures the corrective actions are working as intended and the problem is truly resolved.'
    },
    { 
      title: 'Standardize Similar Processes and Closure', 
      icon: FileText,
              tooltip: 'Standardize solution across similar processes and document lessons learned for closure. Share knowledge across the organization to prevent similar issues in other areas.'
    },
    { 
      title: 'Team & Settings', 
      icon: Users,
              tooltip: 'Configure team settings and finalize RCCA with management approvals. Complete the process with proper documentation and stakeholder sign-offs.'
    }
  ];

  const handleImageUpload = (type: 'before' | 'after') => {
    if (formData.pictureAvail !== true) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || []);
      // In production, upload to cloud storage and get URLs
      const imageObjs = files.map(file => ({ url: URL.createObjectURL(file), description: '' }));
      setFormData(prev => ({
        ...prev,
        [`${type}Images`]: [...(prev[`${type}Images`] as any[]), ...imageObjs]
      }));
    };
    input.click();
  };

  const addTeamMember = () => {
    if (!selectedTeamMember) return;
    // Prevent duplicate team members
    if (formData.assignedMembers.some((m: any) => String(m.id) === String(selectedTeamMember))) return;
    const member = employees.find((e) => String(e.id).trim() === String(selectedTeamMember).trim());
    setFormData((prev) => ({
      ...prev,
      assignedMembers: [
        ...normalizeMembers(prev.assignedMembers),
        { id: selectedTeamMember, name: member?.name || selectedTeamMember, department: selectedTeamMemberDept }
      ]
    }));
    // Remove alert for failed email notification
    emailService.sendNotification([selectedTeamMember], formData.title, 'assigned').catch(() => {});
    setSelectedTeamMember('');
    setSelectedTeamMemberDept('');
    // Update editing permissions
    setTimeout(updateEditingPermissions, 100);
  };
  const removeTeamMember = (memberId: string) => {
    setFormData((prev) => ({
      ...prev,
      assignedMembers: normalizeMembers(prev.assignedMembers).filter((m: any) => m.id !== memberId)
    }));
    // Update editing permissions
    setTimeout(updateEditingPermissions, 100);
  };

  const isFormComplete = () => {
    return !!formData.mentionProblem && formData.mentionProblem.trim().length > 0;
  };

  const handleSave = () => {
    // Update permissions before saving
    updateEditingPermissions();
    
    const errorCategoryToSave = formData.errorCategory === 'Other' ? customErrorCategory : formData.errorCategory;
    const departmentToSave = formData.department === 'Other' ? customDepartment : formData.department;
    const updatedData = {
      ...formData,
      errorCategory: errorCategoryToSave,
      department: departmentToSave,
      status: 'Draft',
      updatedAt: new Date(),
      userId: user.id,
      isAdmin: isAdmin
    };
    const draftsJSON = localStorage.getItem('rccaDrafts') || '[]';
    const drafts = JSON.parse(draftsJSON);
    const existingIndex = drafts.findIndex((d: any) => d.id === updatedData.id);
    if (existingIndex !== -1) {
      drafts[existingIndex] = updatedData;
    } else {
      drafts.push(updatedData);
    }
    localStorage.setItem('rccaDrafts', JSON.stringify(drafts));
    
    // Also save to backend with user info
    rccaService.saveDraft(updatedData).catch((error: unknown) => {
      console.error('Failed to save draft to backend:', error);
      if (error instanceof Error && error.message.includes('permission')) {
        alert('Permission denied: You do not have permission to edit this RCCA.');
      }
    });
    
    alert('RCCA saved as draft');
    onBack();
  };

  const handleSubmit = async () => {
    if (!isFormComplete()) {
      alert('Please mention the problem or failure as reported before submitting');
      return;
    }
    
    // Update permissions before submitting
    updateEditingPermissions();
    
    // Sanitize formData: replace any null/undefined with ""
    const errorCategoryToSave = formData.errorCategory === 'Other' ? customErrorCategory : formData.errorCategory;
    const departmentToSave = formData.department === 'Other' ? customDepartment : formData.department;
    const sanitizedData = Object.fromEntries(
      Object.entries({ ...formData, errorCategory: errorCategoryToSave, department: departmentToSave }).map(([k, v]) => [k, v == null ? "" : v])
    );
    try {
      const updatedData = {
        ...sanitizedData,
        status: 'Submitted',
        updatedAt: new Date(),
        completedAt: new Date(),
        userId: user.id,
        isAdmin: isAdmin
      };
      console.log('Submitting RCCA:', updatedData); // Debug log
      // Check if this is a resubmission of a rejected RCCA
      if (editingRCCA && editingRCCA.status === 'Rejected') {
        console.log('Resubmitting rejected RCCA:', editingRCCA._id || editingRCCA.id);
        // Resubmit the rejected RCCA
        const result = await rccaService.resubmitRCCA(editingRCCA._id || editingRCCA.id, updatedData);
        console.log('Resubmit result:', result);
        alert('RCCA resubmitted successfully for approval');
        
        // Dispatch event to notify dashboard about resubmission
        const event = new CustomEvent('rcca-resubmitted', { 
          detail: { rccaId: editingRCCA._id || editingRCCA.id } 
        });
        console.log('Dispatching rcca-resubmitted event with rccaId:', editingRCCA._id || editingRCCA.id);
        window.dispatchEvent(event);
      } else {
        // Normal submission
        await rccaService.submitRCCA(updatedData);
        alert('RCCA submitted successfully');
      }
      
      // Send personalized notifications to assigned members
      if (formData.assignedMembers.length > 0) {
        formData.assignedMembers.forEach((m: any) => {
          const recipient = employees.find((e: any) => String(e.id).trim() === String(m.id).trim());
          if (!recipient || !recipient.email) return;
          const data = {
            employee_name: recipient.name || recipient.id || 'Team Member',
            problem_statement: formData.mentionProblem || formData.title || 'No problem statement provided',
            rcca_creator: user.name || user.id || 'RCCA Creator',
            date_created: formData.createdAt ? new Date(formData.createdAt).toLocaleDateString() : new Date().toLocaleDateString(),
            rcca_link: `http://localhost:3000/rcca/${formData.id}`,
            to_email: recipient.email
          };
          console.log("EmailJS data:", data); // Debug log
          emailjs.send(
            "service_yu8sh8m",
            "template_z1nvb8k",
            data,
            "4YdneagNSGe3a7zCX"
          ).then(
            () => console.log('Email sent successfully.'),
            () => console.error('Failed to send email notification.')
          );
        });
      }
      
      // Dispatch event to notify dashboard about new RCCA submission
      window.dispatchEvent(new CustomEvent('rcca-submitted'));
      
      onBack();
    } catch (error) {
      if (error instanceof Error && error.message.includes('permission')) {
        alert('Permission denied: You do not have permission to edit this RCCA.');
        return;
      }
      console.error('Error submitting RCCA:', error);
      alert('Failed to submit RCCA. Please try again.');
    }
  };

  const renderSection = () => {
    switch (activeSection) {
      case 0: // Describe and Understand the Situation
        return (
          <div className="space-y-6">
            {/* New: Mention the problem or failure as reported */}
            <div className="bg-yellow-100 border-l-4 border-yellow-400 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <label className="block text-sm font-bold text-yellow-800">
                  MENTION THE PROBLEM OR FAILURE AS REPORTED
                </label>
                                  <Tooltip content="Describe the problem as reported with all relevant details and context. Include what happened, when it was discovered, and the initial impact observed.">
                  <span className="text-gray-500 hover:text-gray-700 transition-colors">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                  </span>
                </Tooltip>
              </div>
              <textarea
                value={formData.mentionProblem}
                onChange={e => setFormData(prev => ({ ...prev, mentionProblem: e.target.value }))}
                rows={2}
                className="w-full px-4 py-3 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent bg-yellow-50 text-yellow-900"
                placeholder="Describe the problem or failure as reported..."
                disabled={getInputDisabledState()}
              />
            </div>
            {/* Existing fields: Notification Number, SAP Equipment, etc. */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Notification Number
                  </label>
                                                      <Tooltip content="Enter notification number to track and reference the issue in your system. This unique identifier helps link the RCCA to other related documents and systems.">
                  <span className="text-gray-500 hover:text-gray-700 transition-colors dark:text-gray-400 dark:hover:text-gray-200">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                  </span>
                </Tooltip>
                </div>
                <input
                  type="text"
                  value={formData.notificationNumber}
                  onChange={e => setFormData(prev => ({ ...prev, notificationNumber: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                  placeholder="Enter notification number..."
                />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    SAP Equipment
                  </label>
                                                      <Tooltip content="Enter SAP equipment code or identifier for the equipment involved in the problem. This helps identify the specific machinery or system that experienced the issue.">
                  <span className="text-gray-500 hover:text-gray-700 transition-colors dark:text-gray-400 dark:hover:text-gray-200">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                  </span>
                </Tooltip>
                </div>
                <input
                  type="text"
                  value={formData.sapEquipment}
                  onChange={e => setFormData(prev => ({ ...prev, sapEquipment: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                  placeholder="Enter SAP equipment..."
                />
              </div>
            </div>
            {/* ...keep all other existing fields and layout... */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Where Happened */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  Where Happened
                  <Tooltip content="Select where the problem was first observed: inside your facility or at the customer."><span className="text-gray-500 hover:text-gray-700 transition-colors"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg></span></Tooltip>
                </label>
                <select
                  value={formData.whereHappened}
                  onChange={e => setFormData(prev => ({ ...prev, whereHappened: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">Select location</option>
                  <option value="internal">Internal</option>
                  <option value="external">External</option>
                </select>
              </div>
              {/* Problem Noticed Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  Problem Noticed Date
                  <Tooltip content="Date when the problem was first noticed."><span className="text-gray-500 hover:text-gray-700 transition-colors"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg></span></Tooltip>
                </label>
                <input
                  type="date"
                  value={formData.problemNoticedDate}
                  onChange={e => setFormData(prev => ({ ...prev, problemNoticedDate: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              {/* Problem Noticed Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  Problem Noticed Time
                  <Tooltip content="Time when the problem was first noticed."><span className="text-gray-500 hover:text-gray-700 transition-colors"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg></span></Tooltip>
                </label>
                <input
                  type="time"
                  value={formData.problemNoticedTime}
                  onChange={e => setFormData(prev => ({ ...prev, problemNoticedTime: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Problem Noticed Shift */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  Problem Noticed Shift
                  <Tooltip content="Shift during which the problem was discovered."><span className="text-gray-500 hover:text-gray-700 transition-colors"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg></span></Tooltip>
                </label>
                <select
                  value={formData.problemNoticedShift}
                  onChange={e => setFormData(prev => ({ ...prev, problemNoticedShift: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="">Select shift</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                </select>
              </div>
              {/* Customer Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  Customer Name
                  <Tooltip content="Name of the customer affected by this issue."><span className="text-gray-500 hover:text-gray-700 transition-colors"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg></span></Tooltip>
                </label>
                <input
                  type="text"
                  value={formData.customerName}
                  onChange={e => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Enter customer name..."
                />
              </div>
              {/* Factory Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  Factory Name
                  <Tooltip content="Factory where the problem originated."><span className="text-gray-500 hover:text-gray-700 transition-colors"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg></span></Tooltip>
                </label>
                <select
                  value={formData.factoryName}
                  onChange={e => setFormData(prev => ({ ...prev, factoryName: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="">Select factory</option>
                  <option value="DPL 1">DPL 1</option>
                  <option value="DPL 2">DPL 2</option>
                  <option value="URIL">URIL</option>
                </select>
              </div>
            </div>
            {/* Error Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  Error Category
                  <Tooltip content="Select the category that best describes the type of error or failure that occurred."><span className="text-gray-500 hover:text-gray-700 transition-colors"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg></span></Tooltip>
                </label>
                <select
                  value={formData.errorCategory || ""}
                  onChange={e => {
                    setFormData(prev => ({ ...prev, errorCategory: e.target.value }));
                    if (e.target.value !== 'Other') setCustomErrorCategory('');
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  required
                >
                  <option value="">Select error category</option>
                  {ERROR_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="Other">Other</option>
                </select>
                {formData.errorCategory === 'Other' && (
                  <input
                    type="text"
                    className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Enter custom error category"
                    value={customErrorCategory}
                    onChange={e => setCustomErrorCategory(e.target.value)}
                  />
                )}
              </div>
            </div>
            {/* Department */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  Department
                  <Tooltip content="Select the department responsible for this RCCA."><span className="text-gray-500 hover:text-gray-700 transition-colors"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg></span></Tooltip>
                </label>
                <select
                  value={formData.department}
                  onChange={e => {
                    setFormData(prev => ({ ...prev, department: e.target.value }));
                    if (e.target.value !== 'Other') setCustomDepartment('');
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="">Select department</option>
                  <option value="Human Resources">Human Resources</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Finance">Finance</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Process Engineering">Process Engineering</option>
                  <option value="Packaging">Packaging</option>
                  <option value="Utility">Utility</option>
                  <option value="Procurement">Procurement</option>
                  <option value="Research & Development">Research & Development</option>
                  <option value="Production">Production</option>
                  <option value="Customer Service">Customer Service</option>
                  <option value="Supply Chain">Supply Chain</option>
                  <option value="Quality">Quality</option>
                  <option value="Other">Other</option>
                </select>
                {formData.department === 'Other' && (
                  <input
                    type="text"
                    className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Enter custom department"
                    value={customDepartment}
                    onChange={e => setCustomDepartment(e.target.value)}
                  />
                )}
              </div>
            </div>
            {/* Problem Reported Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Problem Reported Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  Problem Reported Date
                  <Tooltip content="Date when the problem was officially reported."><span className="text-gray-500 hover:text-gray-700 transition-colors"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg></span></Tooltip>
                </label>
                <input
                  type="date"
                  value={formData.reportedDate}
                  onChange={e => setFormData(prev => ({ ...prev, reportedDate: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              {/* Problem Reported Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  Problem Reported Time
                  <Tooltip content="Time when the problem was officially reported."><span className="text-gray-500 hover:text-gray-700 transition-colors"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg></span></Tooltip>
                </label>
                <input
                  type="time"
                  value={formData.reportedTime}
                  onChange={e => setFormData(prev => ({ ...prev, reportedTime: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>
            {/* How many affected? */}
            {!showHowManyAffected ? (
              <button
                type="button"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mt-4"
                onClick={() => setShowHowManyAffected(true)}
              >
                Add How many affected?
              </button>
            ) : (
              <div className="border border-gray-300 rounded-lg p-4 mt-4 relative">
                <button
                  type="button"
                  className="absolute top-2 right-2 text-blue-600 hover:text-blue-800 text-lg font-bold px-2"
                  title="Remove How many affected?"
                  onClick={() => setShowHowManyAffected(false)}
                >
                  ×
                </button>
              <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                How many affected?
                <Tooltip content="Specify the quantity and scope of items affected by this problem. This helps assess the impact and prioritize the response.">
                  <span className="text-gray-500 hover:text-gray-700 transition-colors">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                  </span>
                </Tooltip>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    Number of Lots
                    <Tooltip content="Enter the total number of production lots that were affected by this problem. A lot is a batch of products manufactured together.">
                      <span className="text-gray-500 hover:text-gray-700 transition-colors">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                        </svg>
                      </span>
                    </Tooltip>
                  </label>
                  <input
                    type="number"
                    value={formData.numberOfLots}
                    onChange={e => setFormData(prev => ({ ...prev, numberOfLots: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Enter number of lots..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    Total Quantity
                    <Tooltip content="Enter the total number of individual items or units affected by this problem across all lots.">
                      <span className="text-gray-500 hover:text-gray-700 transition-colors">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                        </svg>
                      </span>
                    </Tooltip>
                  </label>
                  <input
                    type="number"
                    value={formData.totalQuantity}
                    onChange={e => setFormData(prev => ({ ...prev, totalQuantity: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Enter total quantity..."
                  />
                </div>
              </div>
            </div>
            )}
            {/* ...keep all other existing fields and layout... */}
            {/* Picture Avail / Not Avail filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Picture Availability
              </label>
              <div className="flex gap-4">
                <button
                  type="button"
                  className={`px-4 py-2 rounded-lg border ${formData.pictureAvail === true ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-700'}`}
                  onClick={() => setFormData(prev => ({ ...prev, pictureAvail: true }))}
                >
                  Picture Avail
                </button>
                <button
                  type="button"
                  className={`px-4 py-2 rounded-lg border ${formData.pictureAvail === false ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'}`}
                  onClick={() => setFormData(prev => ({ ...prev, pictureAvail: false, beforeImages: [], afterImages: [] }))}
                >
                  Picture Not Avail
                </button>
              </div>
            </div>
            {/* Only show image upload if Picture Avail is selected */}
            {formData.pictureAvail === true && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Before Images</label>
                  <button
                    type="button"
                    onClick={() => handleImageUpload('before')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mb-2"
                  >
                    Add Before Images
                  </button>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.beforeImages.map((img: any, idx: number) => (
                      <div key={idx} className="relative inline-block mr-2 mb-2">
                        <a href={img.url} target="_blank" rel="noopener noreferrer">
                          <img src={img.url} alt="Before" className="w-20 h-20 object-cover rounded cursor-pointer" />
                        </a>
                        <textarea
                          value={img.description || ''}
                          onChange={e => {
                            const updated = [...formData.beforeImages];
                            updated[idx].description = e.target.value;
                            setFormData(prev => ({ ...prev, beforeImages: updated }));
                          }}
                          rows={2}
                          className="block w-40 h-16 mt-1 text-xs border border-gray-300 rounded px-2 py-1 resize-y"
                          placeholder="Description"
                        />
                        <button
                          type="button"
                          className="absolute top-0 right-0 bg-white bg-opacity-80 text-blue-600 rounded-full p-1 text-xs hover:bg-red-100"
                          title="Remove image"
                          onClick={() => {
                            const updated = [...formData.beforeImages];
                            updated.splice(idx, 1);
                            setFormData(prev => ({ ...prev, beforeImages: updated }));
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">After Images</label>
                  <button
                    type="button"
                    onClick={() => handleImageUpload('after')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mb-2"
                  >
                    Add After Images
                  </button>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.afterImages.map((img: any, idx: number) => (
                      <div key={idx} className="relative inline-block mr-2 mb-2">
                        <a href={img.url} target="_blank" rel="noopener noreferrer">
                          <img src={img.url} alt="After" className="w-20 h-20 object-cover rounded cursor-pointer" />
                        </a>
                        <textarea
                          value={img.description || ''}
                          onChange={e => {
                            const updated = [...formData.afterImages];
                            updated[idx].description = e.target.value;
                            setFormData(prev => ({ ...prev, afterImages: updated }));
                          }}
                          rows={2}
                          className="block w-40 h-16 mt-1 text-xs border border-gray-300 rounded px-2 py-1 resize-y"
                          placeholder="Description"
                        />
                        <button
                          type="button"
                          className="absolute top-0 right-0 bg-white bg-opacity-80 text-blue-600 rounded-full p-1 text-xs hover:bg-red-100"
                          title="Remove image"
                          onClick={() => {
                            const updated = [...formData.afterImages];
                            updated.splice(idx, 1);
                            setFormData(prev => ({ ...prev, afterImages: updated }));
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 1: // Form the Team
        return (
          <div className="space-y-6">
            {/* Permission Information */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                Editing Permissions
                <Tooltip content="Editing permissions change based on RCCA status. In draft mode, all team members can edit. After submission, only the creator can edit.">
                  <span className="text-blue-500 hover:text-blue-700 transition-colors">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                  </span>
                </Tooltip>
              </h4>
              <div className="text-sm text-blue-800">
                <div className="mb-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    formData.status === 'Draft' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    Status: {formData.status}
                  </span>
                </div>
                <p><strong>Creator:</strong> {employees.find(e => e.id === formData.editingPermissions?.creator)?.name || formData.editingPermissions?.creator || 'Unknown'}</p>
                <p><strong>Team Members with Edit Access:</strong></p>
                <ul className="list-disc list-inside ml-4 mt-1">
                  {formData.assignedMembers.map((member: any) => (
                    <li key={member.id}>{member.name} ({member.id})</li>
                  ))}
                </ul>
                {formData.assignedMembers.length === 0 && (
                  <p className="text-blue-600 italic">No team members assigned yet</p>
                )}
                <div className="mt-3 p-2 bg-blue-100 rounded">
                  <p className="text-xs text-blue-700">
                    <strong>Permission Rules:</strong><br/>
                    • <strong>Draft:</strong> Creator + Team Members can edit<br/>
                    • <strong>Submitted:</strong> Only Creator can edit
                  </p>
                </div>
              </div>
            </div>
            
            {/* Champion Name and Department */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label className="block text-sm font-medium text-gray-700">Champion Name</label>
                                      <Tooltip content="Select the person who will lead and coordinate the RCCA process. The champion is responsible for ensuring the investigation is completed thoroughly and on time.">
                      <span className="text-gray-500 hover:text-gray-700 transition-colors">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                        </svg>
                      </span>
                    </Tooltip>
                </div>
                <EmployeeSelect
                  employees={employees}
                  value={formData.rccaChampion}
                  onChange={val => setFormData(prev => ({ ...prev, rccaChampion: val }))}
                
                />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label className="block text-sm font-medium text-gray-700">Champion Department</label>
                                      <Tooltip content="Select the department of the RCCA champion for identification. This helps organize and track RCCAs by organizational units and ensures proper resource allocation.">
                      <span className="text-gray-500 hover:text-gray-700 transition-colors">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                        </svg>
                      </span>
                    </Tooltip>
                </div>
                <select
                  value={formData.championDepartment || ''}
                  onChange={e => setFormData(prev => ({ ...prev, championDepartment: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="">Select department</option>
                  <option value="Human Resources">Human Resources</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Finance">Finance</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Process Engineering">Process Engineering</option>
                  <option value="Packaging">Packaging</option>
                  <option value="Utility">Utility</option>
                  <option value="Procurement">Procurement</option>
                  <option value="Research & Development">Research & Development</option>
                  <option value="Production">Production</option>
                  <option value="Customer Service">Customer Service</option>
                  <option value="Supply Chain">Supply Chain</option>
                  <option value="Quality">Quality</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Add Team Member Button and Fields */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-medium text-gray-900">Add Team Members</h4>
                                  <Tooltip content="Add team members with relevant expertise from different departments. A diverse team ensures all aspects of the problem are considered from various perspectives.">
                    <span className="text-gray-500 hover:text-gray-700 transition-colors">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                        </svg>
                    </span>
                  </Tooltip>
              </div>
              {!showAddTeamMemberFields ? (
                <button
                  type="button"
                  onClick={() => setShowAddTeamMemberFields(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Add Team Member
                </button>
              ) : (
                <div className="flex flex-col md:flex-row gap-4 items-end mb-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Team Member Name</label>
                    <EmployeeSelect
                      employees={employees}
                      value={selectedTeamMember}
                      onChange={val => setSelectedTeamMember(val)}
                      label="Team Member"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                    <select
                      value={selectedTeamMemberDept}
                      onChange={e => setSelectedTeamMemberDept(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    >
                      <option value="">Select department</option>
                      <option value="Human Resources">Human Resources</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Finance">Finance</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Process Engineering">Process Engineering</option>
                      <option value="Packaging">Packaging</option>
                      <option value="Utility">Utility</option>
                      <option value="Procurement">Procurement</option>
                      <option value="Research & Development">Research & Development</option>
                      <option value="Production">Production</option>
                      <option value="Customer Service">Customer Service</option>
                      <option value="Supply Chain">Supply Chain</option>
                      <option value="Quality">Quality</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      addTeamMember();
                      setShowAddTeamMemberFields(false);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddTeamMemberFields(false);
                      setSelectedTeamMember('');
                      setSelectedTeamMemberDept('');
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
              {/* List of Team Members */}
              <div className="mt-4">
                <h4 className="font-medium text-gray-900 mb-2">Current Team Members</h4>
                <div className="space-y-2">
                  {formData.assignedMembers.map((member: any) => (
                    <div key={member.id} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-3">
                      <div>
                        <span className="font-medium">{member.name}</span>
                        {member.department && <span className="text-gray-500 ml-2">({member.department})</span>}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeTeamMember(member.id)}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <Minus className="w-4 h-4" /> Remove
                      </button>
                    </div>
                  ))}
                  {formData.assignedMembers.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No team members assigned</p>
                  )}
                </div>
                {formData.assignedMembers.length > 0 && (
                  <div className="mt-4 flex flex-col items-end gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        setManualEmailError(null);
                        setManualEmailSuccess(null);
                        formData.assignedMembers.forEach((m: any) => {
                          const recipient = employees.find((e: any) => String(e.id).trim() === String(m.id).trim());
                          if (!recipient || !recipient.email) return;
                          const data = {
                            employee_name: recipient.name || recipient.id || 'Team Member',
                            problem_statement: formData.mentionProblem || formData.title || 'No problem statement provided',
                            rcca_creator: user.name || user.id || 'RCCA Creator',
                            date_created: formData.createdAt ? new Date(formData.createdAt).toLocaleDateString() : new Date().toLocaleDateString(),
                            rcca_link: `http://localhost:3000/rcca/${formData.id}`,
                            to_email: recipient.email
                          };
                          console.log("EmailJS data (manual send):", data); // Debug log
                          emailjs.send(
                            "service_yu8sh8m",
                            "template_z1nvb8k",
                            data,
                            "4YdneagNSGe3a7zCX"
                          ).then(
                            () => setManualEmailSuccess('Email sent successfully.'),
                            () => setManualEmailError('Failed to send email notification.')
                          );
                        });
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Send Email Alerts to All Team Members
                    </button>
                    {manualEmailSuccess && (
                      <div className="text-green-600 text-sm mt-1">{manualEmailSuccess}</div>
                    )}
                    {manualEmailError && (
                      <div className="text-red-600 text-sm mt-1">{manualEmailError}</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Add Other Resources Option as Button */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Other Resources Required?</label>
              <div className="flex gap-4 mb-2">
                <button
                  type="button"
                  className={`px-4 py-2 rounded-lg border ${showOtherResources ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-700'}`}
                  onClick={() => setShowOtherResources(true)}
                >
                  Yes
                </button>
                <button
                  type="button"
                  className={`px-4 py-2 rounded-lg border ${!showOtherResources ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'}`}
                  onClick={() => setShowOtherResources(false)}
                >
                  No
                </button>
              </div>
              {showOtherResources && (
                <input
                  type="text"
                  value={formData.otherResources}
                  onChange={e => setFormData(prev => ({ ...prev, otherResources: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Describe other resources..."
                />
              )}
            </div>
          </div>
        );

      case 2: // Immediate Corrective Actions
        return (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Failure Mode Determined by DAW *
                </label>
                                  <Tooltip content="Describe immediate actions taken to contain the problem and prevent further issues. These are temporary containment measures implemented quickly to stop the problem from spreading or worsening.">
                    <span className="text-gray-500 hover:text-gray-700 transition-colors">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                        </svg>
                    </span>
                  </Tooltip>
              </div>
              <textarea
                value={formData.immediateActions}
                onChange={(e) => setFormData(prev => ({ ...prev, immediateActions: e.target.value }))}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Describe the immediate actions taken to address the problem"
              />
            </div>

            {formData.whereHappened === 'external' && (
              <div className="flex flex-wrap gap-4 mb-6">
                {!showCustomerSection && (
                  <button
                    type="button"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    onClick={() => setShowCustomerSection(true)}
                  >
                    Add Required at Customer
                  </button>
                )}
                {!showManufacturerSection && (
                  <button
                    type="button"
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    onClick={() => setShowManufacturerSection(true)}
                  >
                    Add Required at Manufacturer
                  </button>
                )}
                {!showInTransitSection && (
                  <button
                    type="button"
                    className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                    onClick={() => setShowInTransitSection(true)}
                  >
                    Add Required on parts In transit
                  </button>
                )}
              </div>
            )}

            {showCustomerSection && (
              <div className="bg-blue-50 rounded-lg p-6 relative">
                <button
                  type="button"
                  className="absolute top-2 right-2 text-blue-600 hover:text-blue-800 text-lg font-bold px-2"
                  title="Remove section"
                  onClick={() => setShowCustomerSection(false)}
                >
                  ×
                </button>
                  <h3 className="text-lg font-semibold text-blue-900 mb-4">Required at Customer</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full border border-blue-200 rounded-lg">
                    <thead>
                      <tr className="bg-blue-100">
                        <th className="px-4 py-2 text-left">Action</th>
                        <th className="px-4 py-2 text-left">Done on</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.customerActions.map((row: any, idx: number) => (
                        <tr key={row.action} className="border-t border-blue-200">
                          <td className="px-4 py-2 font-medium">{row.action}</td>
                          <td className="px-4 py-2">
                            <input
                              type="date"
                              value={row.doneOn}
                              onChange={e => {
                                const updated = [...formData.customerActions];
                                updated[idx].doneOn = e.target.value;
                                setFormData(prev => ({ ...prev, customerActions: updated }));
                              }}
                              className="border border-gray-300 rounded px-2 py-1"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                    </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Implemented by</label>
                    <EmployeeSelect
                      employees={employees}
                      value={formData.implementedBy}
                      onChange={val => setFormData(prev => ({ ...prev, implementedBy: val }))}
                      label="Implemented By"
                    />
                    </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Verified by</label>
                    <EmployeeSelect
                      employees={employees}
                      value={formData.verifiedBy}
                      onChange={val => setFormData(prev => ({ ...prev, verifiedBy: val }))}
                      label="Verified By"
                    />
                  </div>
                </div>
              </div>
            )}
            {showManufacturerSection && (
              <div className="bg-green-50 rounded-lg p-6 relative">
                <button
                  type="button"
                  className="absolute top-2 right-2 text-blue-600 hover:text-blue-800 text-lg font-bold px-2"
                  title="Remove section"
                  onClick={() => setShowManufacturerSection(false)}
                >
                  ×
                </button>
                  <h3 className="text-lg font-semibold text-green-900 mb-4">Required at Manufacturer</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full border border-green-200 rounded-lg">
                    <thead>
                      <tr className="bg-green-100">
                        <th className="px-4 py-2 text-left">Action</th>
                        <th className="px-4 py-2 text-left">Done on</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.manufacturerActions.map((row: any, idx: number) => (
                        <tr key={row.action} className="border-t border-green-200">
                          <td className="px-4 py-2 font-medium">{row.action}</td>
                          <td className="px-4 py-2">
                            <input
                              type="date"
                              value={row.doneOn}
                              onChange={e => {
                                const updated = [...formData.manufacturerActions];
                                updated[idx].doneOn = e.target.value;
                                setFormData(prev => ({ ...prev, manufacturerActions: updated }));
                              }}
                              className="border border-gray-300 rounded px-2 py-1"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                    </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Implemented by</label>
                    <EmployeeSelect
                      employees={employees}
                      value={formData.manufacturerImplementedBy}
                      onChange={val => setFormData(prev => ({ ...prev, manufacturerImplementedBy: val }))}
                      label="Implemented By"
                    />
                    </div>
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Verified by</label>
                    <EmployeeSelect
                      employees={employees}
                      value={formData.manufacturerVerifiedBy}
                      onChange={val => setFormData(prev => ({ ...prev, manufacturerVerifiedBy: val }))}
                      label="Verified By"
                    />
                  </div>
                </div>
              </div>
            )}
            {showInTransitSection && (
              <div className="bg-yellow-50 rounded-lg p-6 mt-6 relative">
                <button
                  type="button"
                  className="absolute top-2 right-2 text-blue-600 hover:text-blue-800 text-lg font-bold px-2"
                  title="Remove section"
                  onClick={() => setShowInTransitSection(false)}
                >
                  ×
                </button>
                <h3 className="text-lg font-semibold text-yellow-900 mb-4">Required on parts In transit</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full border border-yellow-200 rounded-lg">
                    <thead>
                      <tr className="bg-yellow-100">
                        <th className="px-4 py-2 text-left">Action</th>
                        <th className="px-4 py-2 text-left">Done on</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.inTransitActions.map((row: any, idx: number) => (
                        <tr key={row.action} className="border-t border-yellow-200">
                          <td className="px-4 py-2 font-medium">{row.action}</td>
                          <td className="px-4 py-2">
                            <input
                              type="date"
                              value={row.doneOn}
                              onChange={e => {
                                const updated = [...formData.inTransitActions];
                                updated[idx].doneOn = e.target.value;
                                setFormData(prev => ({ ...prev, inTransitActions: updated }));
                              }}
                              className="border border-gray-300 rounded px-2 py-1"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                    </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Implemented by</label>
                    <EmployeeSelect
                      employees={employees}
                      value={formData.inTransitImplementedBy}
                      onChange={val => setFormData(prev => ({ ...prev, inTransitImplementedBy: val }))}
                      label="Implemented By"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Verified by</label>
                    <EmployeeSelect
                      employees={employees}
                      value={formData.inTransitVerifiedBy}
                      onChange={val => setFormData(prev => ({ ...prev, inTransitVerifiedBy: val }))}
                      label="Verified By"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 3: // Causes & Effects Analysis
        const categories = ['Man', 'Machine', 'Material', 'Method', 'Measure'];
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {categories.map(category => (
                <div key={category} className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-gray-800">{category}</h4>
                                              <Tooltip content={`Analyze ${category.toLowerCase()} factors and determine if they are root causes. Consider how people, equipment, materials, processes, or measurements may have contributed to the problem.`}>
                          <span className="text-gray-500 hover:text-gray-700 transition-colors">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                            </svg>
                          </span>
                        </Tooltip>
                    </div>
                    <button
                      type="button"
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          causeEffectDetails: {
                            ...prev.causeEffectDetails,
                            [category]: [
                              ...(prev.causeEffectDetails[category] || []),
                              { reason: '', isCause: null, responsibility: '', impact: '' }
                            ]
                          }
                        }));
                      }}
                    >
                      Add Potential Reason
                    </button>
                  </div>
                  <div className="space-y-4">
                    {(formData.causeEffectDetails[category] || []).map((item: any, idx: number) => (
                      <div key={idx} className="bg-white border border-gray-300 rounded-lg p-3 relative">
                        <button
                          type="button"
                          className="absolute top-2 right-2 text-blue-600 hover:text-blue-800 text-lg font-bold px-2"
                          title="Remove reason"
                          onClick={() => {
                            const updated = [...(formData.causeEffectDetails[category] || [])];
                            updated.splice(idx, 1);
                            setFormData(prev => ({
                              ...prev,
                              causeEffectDetails: {
                                ...prev.causeEffectDetails,
                                [category]: updated
                              }
                            }));
                          }}
                        >
                          ×
                        </button>
                        <div className="mb-2">
                          <div className="flex items-center gap-2 mb-1">
                            <label className="block text-xs font-medium text-gray-600">Potential Reason</label>
                            <Tooltip content="Describe the potential reason, cause, or factor that may have contributed to the problem. Be specific about what happened or what condition existed that could have led to the issue.">
                              <span className="text-gray-500 hover:text-gray-700 transition-colors">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                                </svg>
                              </span>
                            </Tooltip>
                          </div>
                          <input
                            type="text"
                            value={item.reason}
                            onChange={e => {
                              const updated = [...(formData.causeEffectDetails[category] || [])];
                              updated[idx].reason = e.target.value;
                              setFormData(prev => ({
                                ...prev,
                                causeEffectDetails: {
                                  ...prev.causeEffectDetails,
                                  [category]: updated
                                }
                              }));
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded"
                            placeholder="Enter potential reason..."
                          />
                        </div>
                        <div className="flex items-center gap-4 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-600">Cause?</span>
                            <Tooltip content="Determine if this potential reason is actually a root cause of the problem. A root cause is the fundamental reason why the problem occurred. If yes, you'll need to provide responsibility and impact details.">
                              <span className="text-gray-500 hover:text-gray-700 transition-colors">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                                </svg>
                              </span>
                            </Tooltip>
                          </div>
                          <button
                            type="button"
                            className={`px-3 py-1 rounded ${item.isCause === true ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                            onClick={() => {
                              const updated = [...(formData.causeEffectDetails[category] || [])];
                              updated[idx].isCause = true;
                              setFormData(prev => ({
                                ...prev,
                                causeEffectDetails: {
                                  ...prev.causeEffectDetails,
                                  [category]: updated
                                }
                              }));
                            }}
                          >
                            Yes
                          </button>
                          <button
                            type="button"
                            className={`px-3 py-1 rounded ${item.isCause === false ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                            onClick={() => {
                              const updated = [...(formData.causeEffectDetails[category] || [])];
                              updated[idx].isCause = false;
                              setFormData(prev => ({
                                ...prev,
                                causeEffectDetails: {
                                  ...prev.causeEffectDetails,
                                  [category]: updated
                                }
                              }));
                            }}
                          >
                            No
                          </button>
                        </div>
                        {item.isCause === true && (
                          <>
                            <div className="mb-2">
                              <div className="flex items-center gap-2 mb-1">
                                <label className="block text-xs font-medium text-gray-600">Responsibility</label>
                                <Tooltip content="Identify who or which department is responsible for this root cause. This could be a person, team, department, or external party. Be specific about who has the authority or duty to address this cause.">
                                  <span className="text-gray-500 hover:text-gray-700 transition-colors">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                                    </svg>
                                  </span>
                                </Tooltip>
                              </div>
                              <input
                                type="text"
                                value={item.responsibility}
                                onChange={e => {
                                  const updated = [...(formData.causeEffectDetails[category] || [])];
                                  updated[idx].responsibility = e.target.value;
                                  setFormData(prev => ({
                                    ...prev,
                                    causeEffectDetails: {
                                      ...prev.causeEffectDetails,
                                      [category]: updated
                                    }
                                  }));
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded"
                                placeholder="Enter responsibility..."
                              />
                            </div>
          <div>
                              <div className="flex items-center gap-2 mb-1">
                                <label className="block text-xs font-medium text-gray-600">Impact Detail</label>
                                <Tooltip content="Describe the specific impact or consequence of this cause on the problem. Explain how this factor affected the outcome, quality, safety, or performance. Include measurable effects if possible.">
                                  <span className="text-gray-500 hover:text-gray-700 transition-colors">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                                    </svg>
                                  </span>
                                </Tooltip>
                              </div>
                              <input
                                type="text"
                                value={item.impact}
                                onChange={e => {
                                  const updated = [...(formData.causeEffectDetails[category] || [])];
                                  updated[idx].impact = e.target.value;
                                  setFormData(prev => ({
                                    ...prev,
                                    causeEffectDetails: {
                                      ...prev.causeEffectDetails,
                                      [category]: updated
                                    }
                                  }));
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded"
                                placeholder="Enter impact detail..."
                              />
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        );

      case 4: // Root Cause Analysis (5-Why Method)
        const failureModes = formData.rootCauseAnalysis.failureModes;
        return (
            <div className="space-y-8">
              {failureModes.map((fm: any, fmIdx: number) => (
                <div key={fmIdx} className="border border-gray-200 rounded-lg p-4 bg-gray-50 relative">
              <button
                type="button"
                    className="absolute top-2 right-2 text-blue-600 hover:text-blue-800 text-lg font-bold px-2"
                    title="Remove Failure Mode"
                    onClick={() => {
                      const updated = [...failureModes];
                      updated.splice(fmIdx, 1);
                      setFormData(prev => ({
                        ...prev,
                        rootCauseAnalysis: {
                          ...prev.rootCauseAnalysis,
                          failureModes: updated
                        }
                      }));
                    }}
                  >
                    ×
                  </button>
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <label className="block text-sm font-medium text-gray-700">Failure Mode</label>
                      <Tooltip content="Describe the specific failure mode as the starting point for 5-Why analysis. This is the exact problem or defect that occurred and will be the first 'why' in your investigation.">
                        <span className="text-gray-500 hover:text-gray-700 transition-colors">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                          </svg>
                        </span>
                      </Tooltip>
                    </div>
                    <input
                      type="text"
                      value={fm.failureMode}
                      onChange={e => {
                        const updated = [...failureModes];
                        updated[fmIdx].failureMode = e.target.value;
                        setFormData(prev => ({
                          ...prev,
                          rootCauseAnalysis: {
                            ...prev.rootCauseAnalysis,
                            failureModes: updated
                          }
                        }));
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded"
                      placeholder="Describe the failure mode..."
                    />
                  </div>
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-700">Why's</span>
                      {fm.whys.length < 5 && (
                        <button
                          type="button"
                          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                          onClick={() => {
                            const updated = [...failureModes];
                            updated[fmIdx].whys = [...updated[fmIdx].whys, ''];
                            setFormData(prev => ({
                              ...prev,
                              rootCauseAnalysis: {
                                ...prev.rootCauseAnalysis,
                                failureModes: updated
                              }
                            }));
                          }}
                        >
                Add Why
              </button>
                      )}
            </div>
                    <div className="space-y-2">
                      {fm.whys.map((why: string, whyIdx: number) => (
                        <div key={whyIdx} className="flex items-center gap-2">
                          <input
                            type="text"
                    value={why}
                            onChange={e => {
                              const updated = [...failureModes];
                              updated[fmIdx].whys[whyIdx] = e.target.value;
                              setFormData(prev => ({
                                ...prev,
                                rootCauseAnalysis: {
                                  ...prev.rootCauseAnalysis,
                                  failureModes: updated
                                }
                              }));
                            }}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded"
                            placeholder={`Why ${whyIdx + 1}`}
                          />
                  <button
                    type="button"
                            className="text-blue-600 hover:text-blue-800 text-lg font-bold px-2"
                            title="Remove Why"
                            onClick={() => {
                              const updated = [...failureModes];
                              updated[fmIdx].whys.splice(whyIdx, 1);
                              setFormData(prev => ({
                                ...prev,
                                rootCauseAnalysis: {
                                  ...prev.rootCauseAnalysis,
                                  failureModes: updated
                                }
                              }));
                            }}
                          >
                            ×
                  </button>
              </div>
            ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">How could this be avoided?</label>
                    <input
                      type="text"
                      value={fm.howAvoided}
                      onChange={e => {
                        const updated = [...failureModes];
                        updated[fmIdx].howAvoided = e.target.value;
                        setFormData(prev => ({
                          ...prev,
                          rootCauseAnalysis: {
                            ...prev.rootCauseAnalysis,
                            failureModes: updated
                          }
                        }));
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded"
                      placeholder="Describe how this could be avoided..."
                    />
                  </div>
                </div>
              ))}
              <button
                type="button"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                onClick={() => {
                  setFormData(prev => ({
                    ...prev,
                    rootCauseAnalysis: {
                      ...prev.rootCauseAnalysis,
                      failureModes: [
                        ...prev.rootCauseAnalysis.failureModes,
                        { failureMode: '', whys: [], howAvoided: '' }
                      ]
                    }
                  }));
                }}
              >
                Add Failure Mode
              </button>
          </div>
        );

      case 5: // Actions Required for a Permanent Solution
        return (
          <div className="space-y-6">
            <div className="mb-4">
              <h4 className="font-bold mb-2 flex items-center gap-2">
                Actions Required for a Permanent Solution
                <Tooltip content="Develop corrective and preventive actions to permanently eliminate the root cause. Actions can address multiple failure modes, and failure modes can have multiple actions.">
                  <span className="text-gray-500 hover:text-gray-700 transition-colors">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                  </span>
                </Tooltip>
              </h4>
            </div>

            {/* Failure Modes List */}
            <div className="mb-6">
              <h5 className="font-semibold text-lg text-gray-800 mb-3">Available Failure Modes</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {formData.rootCauseAnalysis.failureModes.map((fm: any, idx: number) => (
                  <div key={idx} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                    <h6 className="font-medium text-gray-800 mb-1">Failure Mode {idx + 1}</h6>
                    <p className="text-sm text-gray-700 mb-2">{fm.failureMode}</p>
                    <p className="text-xs text-gray-600">
                      <strong>How avoided:</strong> {fm.howAvoided}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions Management */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h5 className="font-semibold text-lg text-gray-800">Actions</h5>
                <button
                  type="button"
                  onClick={() => {
                    const newAction = {
                      id: `action-${Date.now()}`,
                      actionsToImplement: '',
                      dateImplemented: '',
                      isInProgress: false,
                      championName: '',
                      verifiedBy: '',
                      verificationMethod: '',
                      relatedFailureModes: []
                    };
                    setFormData(prev => ({
                      ...prev,
                      permanentActions: [...(prev.permanentActions || []), newAction]
                    }));
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add New Action
                </button>
              </div>

              {/* Actions List */}
              {(formData.permanentActions || []).map((action: any, actionIdx: number) => (
                <div key={action.id} className="border border-gray-300 rounded-lg p-6 bg-white shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h6 className="font-semibold text-lg text-gray-800">Action {actionIdx + 1}</h6>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = [...(formData.permanentActions || [])];
                        updated.splice(actionIdx, 1);
                        setFormData(prev => ({
                          ...prev,
                          permanentActions: updated
                        }));
                      }}
                      className="text-red-600 hover:text-red-800 text-lg font-bold px-2"
                      title="Remove Action"
                    >
                      ×
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Related Failure Modes */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <label className="block text-sm font-medium text-gray-700">Related Failure Modes</label>
                        <Tooltip content="Select which failure modes this action addresses. You can select multiple failure modes for one action.">
                          <span className="text-gray-500 hover:text-gray-700 transition-colors">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                            </svg>
                          </span>
                        </Tooltip>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {formData.rootCauseAnalysis.failureModes.map((fm: any, fmIdx: number) => (
                          <label key={fmIdx} className="flex items-center gap-2 p-2 border border-gray-200 rounded hover:bg-gray-50">
                            <input
                              type="checkbox"
                              checked={action.relatedFailureModes?.includes(fmIdx) || false}
                              onChange={(e) => {
                                const updated = [...(formData.permanentActions || [])];
                                if (!updated[actionIdx].relatedFailureModes) {
                                  updated[actionIdx].relatedFailureModes = [];
                                }
                                if (e.target.checked) {
                                  updated[actionIdx].relatedFailureModes.push(fmIdx);
                                } else {
                                  updated[actionIdx].relatedFailureModes = updated[actionIdx].relatedFailureModes.filter((idx: number) => idx !== fmIdx);
                                }
                                setFormData(prev => ({
                                  ...prev,
                                  permanentActions: updated
                                }));
                              }}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">Failure Mode {fmIdx + 1}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Actions to be implemented */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <label className="block text-sm font-medium text-gray-700">Actions to be implemented</label>
                        <Tooltip content="Describe the specific actions that will be taken to address the selected failure modes. Be detailed about what needs to be done, who will do it, and how it will prevent the problem from recurring.">
                          <span className="text-gray-500 hover:text-gray-700 transition-colors">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                            </svg>
                          </span>
                        </Tooltip>
                      </div>
                      <textarea
                        value={action.actionsToImplement || ''}
                        onChange={e => {
                          const updated = [...(formData.permanentActions || [])];
                          updated[actionIdx].actionsToImplement = e.target.value;
                          setFormData(prev => ({
                            ...prev,
                            permanentActions: updated
                          }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={3}
                        placeholder="Describe the actions to be implemented..."
                      />
                    </div>

                    {/* Date action was implemented */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <label className="block text-sm font-medium text-gray-700">Date action was implemented</label>
                        <Tooltip content="Select the date when this action was implemented. Choose 'In Progress' if the action is currently being worked on.">
                          <span className="text-gray-500 hover:text-gray-700 transition-colors">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                            </svg>
                          </span>
                        </Tooltip>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="date"
                          value={action.dateImplemented || ''}
                          onChange={e => {
                            const updated = [...(formData.permanentActions || [])];
                            updated[actionIdx].dateImplemented = e.target.value;
                            updated[actionIdx].isInProgress = false;
                            setFormData(prev => ({
                              ...prev,
                              permanentActions: updated
                            }));
                          }}
                          className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          disabled={action.isInProgress}
                        />
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={action.isInProgress || false}
                            onChange={e => {
                              const updated = [...(formData.permanentActions || [])];
                              updated[actionIdx].isInProgress = e.target.checked;
                              if (e.target.checked) {
                                updated[actionIdx].dateImplemented = '';
                              }
                              setFormData(prev => ({
                                ...prev,
                                permanentActions: updated
                              }));
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">In Progress</span>
                        </label>
                      </div>
                    </div>

                    {/* Champion Name */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <label className="block text-sm font-medium text-gray-700">Champion Name</label>
                        <Tooltip content="Select the person responsible for implementing and overseeing this action. The champion will be accountable for the successful completion of this action.">
                          <span className="text-gray-500 hover:text-gray-700 transition-colors">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                            </svg>
                          </span>
                        </Tooltip>
                      </div>
                      <EmployeeSelect
                        employees={employees}
                        value={action.championName || ''}
                        onChange={val => {
                          const updated = [...(formData.permanentActions || [])];
                          updated[actionIdx].championName = val;
                          setFormData(prev => ({
                            ...prev,
                            permanentActions: updated
                          }));
                        }}
                        label="Champion"
                      />
                    </div>

                    {/* Verified by */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <label className="block text-sm font-medium text-gray-700">Verified by</label>
                        <Tooltip content="Select the person who will verify that this action has been properly implemented and is effective. This should be someone independent of the implementation.">
                          <span className="text-gray-500 hover:text-gray-700 transition-colors">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                            </svg>
                          </span>
                        </Tooltip>
                      </div>
                      <EmployeeSelect
                        employees={employees}
                        value={action.verifiedBy || ''}
                        onChange={val => {
                          const updated = [...(formData.permanentActions || [])];
                          updated[actionIdx].verifiedBy = val;
                          setFormData(prev => ({
                            ...prev,
                            permanentActions: updated
                          }));
                        }}
                        label="Verifier"
                      />
                    </div>

                    {/* Verification Method */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <label className="block text-sm font-medium text-gray-700">Verification Method</label>
                        <Tooltip content="Describe how the verification will be conducted. This could include inspections, tests, audits, or other methods to confirm the action is working effectively.">
                          <span className="text-gray-500 hover:text-gray-700 transition-colors">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                            </svg>
                          </span>
                        </Tooltip>
                      </div>
                      <textarea
                        value={action.verificationMethod || ''}
                        onChange={e => {
                          const updated = [...(formData.permanentActions || [])];
                          updated[actionIdx].verificationMethod = e.target.value;
                          setFormData(prev => ({
                            ...prev,
                            permanentActions: updated
                          }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={2}
                        placeholder="Describe the verification method..."
                      />
                    </div>
                  </div>
                </div>
              ))}

              {(!formData.permanentActions || formData.permanentActions.length === 0) && (
                <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                  <p className="text-lg font-medium mb-2">No Actions Defined</p>
                  <p className="text-sm">Click "Add New Action" to start creating action plans for the failure modes.</p>
                </div>
              )}

              {formData.rootCauseAnalysis.failureModes.length === 0 && (
                <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                  <p className="text-lg font-medium mb-2">No Failure Modes Available</p>
                  <p className="text-sm">Please go to the "Root Cause Analysis (5-Why Method)" section to add failure modes first.</p>
                </div>
              )}
            </div>
          </div>
        );

      case 6: // Validation and Lot Confirmation
        return (() => {
          const validationActions = formData.validationActions || [];
        return (
            <div className="space-y-8">
              <div className="mb-4">
                <button
                  type="button"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      validationActions: [
                        ...validationActions,
                        { action: '' }
                      ]
                    }));
                  }}
                >
                  Add Action Taken
                </button>
              </div>
              {validationActions.map((va: any, idx: number) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-4 bg-gray-50 relative">
                  <button
                    type="button"
                    className="absolute top-2 right-2 text-blue-600 hover:text-blue-800 text-lg font-bold px-2"
                    title="Remove Action Taken"
                    onClick={() => {
                      const updated = [...validationActions];
                      updated.splice(idx, 1);
                      setFormData(prev => ({ ...prev, validationActions: updated }));
                    }}
                  >
                    ×
                  </button>
                  <div className="mb-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                      Action Taken
                      <Tooltip content="Describe the action taken to validate or correct the issue."><span className="text-gray-500 hover:text-gray-700 transition-colors">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                        </svg>
                      </span></Tooltip>
                    </label>
                    <input
                      type="text"
                      value={va.action}
                      onChange={e => {
                        const updated = [...validationActions];
                        updated[idx].action = e.target.value;
                        setFormData(prev => ({ ...prev, validationActions: updated }));
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded"
                      placeholder="Describe the action taken..."
                    />
                  </div>
                  {/* Buttons to add subfields */}
                  <div className="flex flex-wrap gap-2 mb-2">
                    {!('validationDate' in va) && (
                      <button type="button" className="px-2 py-1 bg-gray-200 rounded" onClick={() => {
                        const updated = [...validationActions];
                        updated[idx].validationDate = '';
                        setFormData(prev => ({ ...prev, validationActions: updated }));
                      }}>Add Validation Date</button>
                    )}
                    {!('validationProcedure' in va) && (
                      <button type="button" className="px-2 py-1 bg-gray-200 rounded" onClick={() => {
                        const updated = [...validationActions];
                        updated[idx].validationProcedure = '';
                        setFormData(prev => ({ ...prev, validationActions: updated }));
                      }}>Add Validation Procedure Used</button>
                    )}
                    {!('validationResults' in va) && (
                      <button type="button" className="px-2 py-1 bg-gray-200 rounded" onClick={() => {
                        const updated = [...validationActions];
                        updated[idx].validationResults = '';
                        setFormData(prev => ({ ...prev, validationActions: updated }));
                      }}>Add Validation Results</button>
                    )}
                    {!('validatedBy' in va) && (
                      <button type="button" className="px-2 py-1 bg-gray-200 rounded" onClick={() => {
                        const updated = [...validationActions];
                        updated[idx].validatedBy = '';
                        setFormData(prev => ({ ...prev, validationActions: updated }));
                      }}>Add Validated By</button>
                    )}
                    {!('comment' in va) && (
                      <button type="button" className="px-2 py-1 bg-gray-200 rounded" onClick={() => {
                        const updated = [...validationActions];
                        updated[idx].comment = '';
                        setFormData(prev => ({ ...prev, validationActions: updated }));
                      }}>Add Comment</button>
                    )}
                  </div>
                  {/* Subfield inputs */}
                  {'validationDate' in va && (
                    <div className="mb-2 flex items-center gap-2">
                      <label className="block text-xs font-medium text-gray-600 flex items-center gap-2">
                        Validation Date
                        <Tooltip content="Date when validation was performed."><span className="text-gray-500 hover:text-gray-700 transition-colors">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                          </svg>
                        </span></Tooltip>
                      </label>
                      <input
                        type="date"
                        value={va.validationDate}
                        onChange={e => {
                          const updated = [...validationActions];
                          updated[idx].validationDate = e.target.value;
                          setFormData(prev => ({ ...prev, validationActions: updated }));
                        }}
                        className="px-2 py-1 border border-gray-300 rounded"
                      />
                      <button type="button" className="text-blue-600 px-2" title="Remove" onClick={() => {
                        const updated = [...validationActions];
                        delete updated[idx].validationDate;
                        setFormData(prev => ({ ...prev, validationActions: updated }));
                      }}>×</button>
                    </div>
                  )}
                  {'validationProcedure' in va && (
                    <div className="mb-2 flex items-center gap-2">
                      <label className="block text-xs font-medium text-gray-600 flex items-center gap-2">
                        Validation Procedure Used
                        <Tooltip content="Describe the procedure used for validation."><span className="text-gray-500 hover:text-gray-700 transition-colors">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                          </svg>
                        </span></Tooltip>
                      </label>
                      <input
                        type="text"
                        value={va.validationProcedure}
                        onChange={e => {
                          const updated = [...validationActions];
                          updated[idx].validationProcedure = e.target.value;
                          setFormData(prev => ({ ...prev, validationActions: updated }));
                        }}
                        className="px-2 py-1 border border-gray-300 rounded"
                        placeholder="Describe procedure..."
                      />
                      <button type="button" className="text-blue-600 px-2" title="Remove" onClick={() => {
                        const updated = [...validationActions];
                        delete updated[idx].validationProcedure;
                        setFormData(prev => ({ ...prev, validationActions: updated }));
                      }}>×</button>
                    </div>
                  )}
                  {'validationResults' in va && (
                    <div className="mb-2 flex items-center gap-2">
                      <label className="block text-xs font-medium text-gray-600 flex items-center gap-2">
                        Validation Results
                        <Tooltip content="Outcome of the validation activity."><span className="text-gray-500 hover:text-gray-700 transition-colors">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                          </svg>
                        </span></Tooltip>
                      </label>
                      <input
                        type="text"
                        value={va.validationResults}
                        onChange={e => {
                          const updated = [...validationActions];
                          updated[idx].validationResults = e.target.value;
                          setFormData(prev => ({ ...prev, validationActions: updated }));
                        }}
                        className="px-2 py-1 border border-gray-300 rounded"
                        placeholder="Describe results..."
                      />
                      <button type="button" className="text-blue-600 px-2" title="Remove" onClick={() => {
                        const updated = [...validationActions];
                        delete updated[idx].validationResults;
                        setFormData(prev => ({ ...prev, validationActions: updated }));
                      }}>×</button>
                    </div>
                  )}
                  {'validatedBy' in va && (
                    <div className="mb-2 flex items-center gap-2">
                      <label className="block text-xs font-medium text-gray-600 flex items-center gap-2">
                        Validated By
                        <Tooltip content="Person who performed the validation."><span className="text-gray-500 hover:text-gray-700 transition-colors">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                          </svg>
                        </span></Tooltip>
                      </label>
                      <EmployeeSelect
                        employees={employees}
                        value={va.validatedBy}
                        onChange={val => {
                          const updated = [...validationActions];
                          updated[idx].validatedBy = val;
                          setFormData(prev => ({ ...prev, validationActions: updated }));
                        }}
                        label="Validated By"
                      />
                      <button type="button" className="text-blue-600 px-2" title="Remove" onClick={() => {
                        const updated = [...validationActions];
                        delete updated[idx].validatedBy;
                        setFormData(prev => ({ ...prev, validationActions: updated }));
                      }}>×</button>
                    </div>
                  )}
                  {'comment' in va && (
                    <div className="mb-2 flex items-center gap-2">
                      <label className="block text-xs font-medium text-gray-600 flex items-center gap-2">
                        Comment
                        <Tooltip content="Add any additional notes or comments."><span className="text-gray-500 hover:text-gray-700 transition-colors">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                          </svg>
                        </span></Tooltip>
                      </label>
                      <input
                        type="text"
                        value={va.comment}
                        onChange={e => {
                          const updated = [...validationActions];
                          updated[idx].comment = e.target.value;
                          setFormData(prev => ({ ...prev, validationActions: updated }));
                        }}
                        className="px-2 py-1 border border-gray-300 rounded"
                        placeholder="Add comment..."
                      />
                      <button type="button" className="text-blue-600 px-2" title="Remove" onClick={() => {
                        const updated = [...validationActions];
                        delete updated[idx].comment;
                        setFormData(prev => ({ ...prev, validationActions: updated }));
                      }}>×</button>
                    </div>
                  )}
                </div>
              ))}
              <div className="mt-8">
                <button
                  type="button"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors mb-4"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      lotConfirmations: [
                        ...(prev.lotConfirmations || []),
                        { date: '', lotSize: '', rejection: '', signal: '' }
                      ]
                    }));
                  }}
                >
                  Add Lot Confirmation
                </button>
                <div className="space-y-6">
                  {(formData.lotConfirmations || []).map((lot: any, idx: number) => (
                    <div key={idx} className="border border-gray-300 rounded-lg p-4 bg-white relative">
                      <button
                        type="button"
                        className="absolute top-2 right-2 text-blue-600 hover:text-blue-800 text-lg font-bold px-2"
                        title="Remove Lot Confirmation"
                        onClick={() => {
                          const updated = [...formData.lotConfirmations];
                          updated.splice(idx, 1);
                          setFormData(prev => ({ ...prev, lotConfirmations: updated }));
                        }}
                      >
                        ×
                      </button>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Lot Confirmation {idx + 1}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                            Lot Confirmation 1
                            <Tooltip content="First lot checked to confirm effectiveness of actions."><span className="text-gray-500 hover:text-gray-700 transition-colors">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg></span></Tooltip>
                          </label>
                          <input
                            type="date"
                            value={lot.date}
                            onChange={e => {
                              const updated = [...formData.lotConfirmations];
                              updated[idx].date = e.target.value;
                              setFormData(prev => ({ ...prev, lotConfirmations: updated }));
                            }}
                            className="w-full px-4 py-2 border border-gray-300 rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                            Lot Size
                            <Tooltip content="Number of items in the lot."><span className="text-gray-500 hover:text-gray-700 transition-colors">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg></span></Tooltip>
                          </label>
                          <input
                            type="number"
                            value={lot.lotSize}
                            onChange={e => {
                              const updated = [...formData.lotConfirmations];
                              updated[idx].lotSize = e.target.value;
                              setFormData(prev => ({ ...prev, lotConfirmations: updated }));
                            }}
                            className="w-full px-4 py-2 border border-gray-300 rounded"
                            placeholder="Enter lot size..."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                            Rejection
                            <Tooltip content="Number of items rejected in this lot."><span className="text-gray-500 hover:text-gray-700 transition-colors">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg></span></Tooltip>
                          </label>
                          <input
                            type="number"
                            value={lot.rejection}
                            onChange={e => {
                              const updated = [...formData.lotConfirmations];
                              updated[idx].rejection = e.target.value;
                              setFormData(prev => ({ ...prev, lotConfirmations: updated }));
                            }}
                            className="w-full px-4 py-2 border border-gray-300 rounded"
                            placeholder="Enter rejection count..."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                            Signal
                            <Tooltip content="Any signal or alert related to this lot."><span className="text-gray-500 hover:text-gray-700 transition-colors">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg></span></Tooltip>
                          </label>
                          <input
                            type="text"
                            value={lot.signal}
                            onChange={e => {
                              const updated = [...formData.lotConfirmations];
                              updated[idx].signal = e.target.value;
                              setFormData(prev => ({ ...prev, lotConfirmations: updated }));
                            }}
                            className="w-full px-4 py-2 border border-gray-300 rounded"
                            placeholder="Enter signal..."
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
          </div>
        );
        })();

      case 7: // Standardize Similar Processes and Closure
        return (
          <div className="space-y-8">
            <div className="mb-4">
              <button
                type="button"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                onClick={() => {
                  setFormData(prev => ({
                    ...prev,
                    similarProcesses: [
                      ...(prev.similarProcesses || []),
                      {
                        process: '',
                        chancesOfFailure: '',
                        fmeaReviewedOn: '',
                        documentsUpdatedOn: '',
                        verifiedBy: '',
                        validationDate: '',
                        remarks: ''
                      }
                    ]
                  }));
                }}
              >
                Add Similar Product/Process
              </button>
            </div>
            {(formData.similarProcesses || []).map((sp: any, idx: number) => (
              <div key={idx} className="border border-gray-200 rounded-lg p-4 bg-gray-50 relative mb-4">
                <button
                  type="button"
                  className="absolute top-2 right-2 text-blue-600 hover:text-blue-800 text-lg font-bold px-2"
                  title="Remove Similar Product/Process"
                  onClick={() => {
                    const updated = [...formData.similarProcesses];
                    updated.splice(idx, 1);
                    setFormData(prev => ({ ...prev, similarProcesses: updated }));
                  }}
                >
                  ×
                </button>
                <div className="mb-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Similar Product/Process</label>
                  <input
                    type="text"
                    value={sp.process}
                    onChange={e => {
                      const updated = [...formData.similarProcesses];
                      updated[idx].process = e.target.value;
                      setFormData(prev => ({ ...prev, similarProcesses: updated }));
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded"
                    placeholder="Enter product or process..."
                  />
                </div>
                <div className="mb-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Chances of Similar Failure</label>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      className={`px-4 py-2 rounded-lg border ${sp.chancesOfFailure === 'Yes' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-700'}`}
                      onClick={() => {
                        const updated = [...formData.similarProcesses];
                        updated[idx].chancesOfFailure = 'Yes';
                        setFormData(prev => ({ ...prev, similarProcesses: updated }));
                      }}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      className={`px-4 py-2 rounded-lg border ${sp.chancesOfFailure === 'No' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'}`}
                      onClick={() => {
                        const updated = [...formData.similarProcesses];
                        updated[idx].chancesOfFailure = 'No';
                        setFormData(prev => ({ ...prev, similarProcesses: updated }));
                      }}
                    >
                      No
                    </button>
                  </div>
                </div>
                <div className="mb-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">FMEA Reviewed On</label>
                  <input
                    type="date"
                    value={sp.fmeaReviewedOn}
                    onChange={e => {
                      const updated = [...formData.similarProcesses];
                      updated[idx].fmeaReviewedOn = e.target.value;
                      setFormData(prev => ({ ...prev, similarProcesses: updated }));
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded"
                  />
                </div>
                <div className="mb-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Documents Updated Date</label>
                  <input
                    type="date"
                    value={sp.documentsUpdatedOn}
                    onChange={e => {
                      const updated = [...formData.similarProcesses];
                      updated[idx].documentsUpdatedOn = e.target.value;
                      setFormData(prev => ({ ...prev, similarProcesses: updated }));
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded"
                  />
                </div>
                <div className="mb-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Verified By</label>
                  <EmployeeSelect
                    employees={employees}
                    value={sp.verifiedBy}
                    onChange={val => {
                      const updated = [...formData.similarProcesses];
                      updated[idx].verifiedBy = val;
                      setFormData(prev => ({ ...prev, similarProcesses: updated }));
                    }}
                    label="Verified By"
                  />
                </div>
                <div className="mb-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Validation Date</label>
                  <input
                    type="date"
                    value={sp.validationDate}
                    onChange={e => {
                      const updated = [...formData.similarProcesses];
                      updated[idx].validationDate = e.target.value;
                      setFormData(prev => ({ ...prev, similarProcesses: updated }));
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded"
                  />
                </div>
                <div className="mb-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                  <input
                    type="text"
                    value={sp.remarks}
                    onChange={e => {
                      const updated = [...formData.similarProcesses];
                      updated[idx].remarks = e.target.value;
                      setFormData(prev => ({ ...prev, similarProcesses: updated }));
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded"
                    placeholder="Add remarks..."
                  />
                </div>
              </div>
            ))}
            {/* RCCA Champion, Head of Production, Head of Quality */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">RCCA Champion</label>
                <EmployeeSelect
                  employees={employees}
                  value={formData.rccaChampion}
                  onChange={val => setFormData(prev => ({ ...prev, rccaChampion: val }))}
                  label="RCCA Champion"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Head of Production</label>
                <EmployeeSelect
                  employees={employees}
                  value={formData.headProduction || ''}
                  onChange={val => setFormData(prev => ({ ...prev, headProduction: val }))}
                  label="Head of Production"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Head of Quality</label>
                <EmployeeSelect
                  employees={employees}
                  value={formData.headQuality || ''}
                  onChange={val => setFormData(prev => ({ ...prev, headQuality: val }))}
                  label="Head of Quality"
                />
              </div>
            </div>
          </div>
        );

      case 8: // Team & Settings
        return (
          <div className="space-y-6">
            {/* RCCA Champion, Manager QA, Head of Production */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">RCCA Champion</label>
                <EmployeeSelect
                  employees={employees}
                  value={formData.rccaChampion}
                  onChange={val => setFormData(prev => ({ ...prev, rccaChampion: val }))}
                  label="RCCA Champion"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Manager Quality Assurance</label>
                <EmployeeSelect
                  employees={employees}
                  value={formData.managerQA || ''}
                  onChange={val => setFormData(prev => ({ ...prev, managerQA: val }))}
                  label="Manager QA"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Head of Production</label>
                <EmployeeSelect
                  employees={employees}
                  value={formData.headProduction || ''}
                  onChange={val => setFormData(prev => ({ ...prev, headProduction: val }))}
                  label="Head of Production"
                />
              </div>
            </div>
            {/* Admin Team Management */}
            {isAdmin && (
              <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">Admin: Manage Team Members</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Add/Remove Team Members</span>
                    <button
                      type="button"
                      onClick={() => setShowMemberSelector(!showMemberSelector)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Users className="w-4 h-4" />
                      {showMemberSelector ? 'Hide Members' : 'Manage Members'}
                    </button>
                  </div>

                  {showMemberSelector && (
                    <div className="bg-white rounded-lg p-4 border border-blue-200">
                      <h4 className="font-medium text-gray-900 mb-3">Available Members</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                        {availableMembers
                          .filter(member => !formData.assignedMembers.some((m: any) => String(m.id) === String(member.id)))
                          .map(member => (
                            <button
                              key={member.id}
                              type="button"
                              onClick={() => addTeamMember()}
                              className="text-left px-3 py-2 bg-green-50 border border-green-200 rounded hover:bg-green-100 transition-colors flex items-center justify-between"
                            >
                              <span>{member.name} ({member.id})</span>
                              <Plus className="w-4 h-4 text-green-600" />
                            </button>
                          ))}
                      </div>

                      <h4 className="font-medium text-gray-900 mb-3">Current Team Members</h4>
                      <div className="space-y-2">
                        {formData.assignedMembers.map((member: any) => (
                          <div key={member.id} className="flex items-center justify-between bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                            <div>
                              <span className="font-medium">{member.name}</span>
                              <span className="text-gray-500 ml-2">({member.id})</span>
                              <span className="text-xs text-gray-400 block">{member.id}@gmail.com</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeTeamMember(member.id)}
                              className="text-blue-600 hover:text-blue-800 transition-colors p-1 hover:bg-red-100 rounded"
                              title="Remove member"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        {formData.assignedMembers.length === 0 && (
                          <p className="text-gray-500 text-center py-4">No team members assigned</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="text-center py-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Review & Submit</h3>
              <p className="text-gray-600 mb-6">
                Please review all sections before submitting your RCCA.
              </p>
              <div className="flex justify-center gap-4">
                
     
                {/* <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <Save className="w-5 h-5" />
                  {isFormComplete() ? 'Save Complete RCCA' : 'Save Draft'}
                </button>
                */}
                {isFormComplete() && (
                  <button
                    onClick={handleSubmit}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Send className="w-5 h-5" />
                    {editingRCCA && editingRCCA.status === 'Rejected' ? 'Resubmit RCCA' : 'Submit RCCA'}
                  </button>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Inject Tooltip Styles */}
      
      {/* Permission Warning */}
      {!hasEditPermission() && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Read-only mode:</strong> You don't have permission to edit this RCCA. Only the creator and assigned team members can make changes.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => {
                  const updatedData = {
                    ...formData,
                    status: 'Draft',
                    updatedAt: new Date()
                  };
                  const draftsJSON = localStorage.getItem('rccaDrafts') || '[]';
                  const drafts = JSON.parse(draftsJSON);
                  let existingIndex = drafts.findIndex((d: any) => d.id === updatedData.id);
                  if (existingIndex !== -1) {
                    drafts[existingIndex] = updatedData;
                  } else {
                    drafts.push(updatedData);
                  }
                  localStorage.setItem('rccaDrafts', JSON.stringify(drafts));
                  onBack();
                }}
                className="mr-4 p-2 text-gray-400 hover:text-gray-600 transition-colors dark:text-gray-300 dark:hover:text-gray-100"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {editingRCCA && editingRCCA.status === 'Rejected' ? 'Edit Rejected RCCA' : editingRCCA ? 'Edit RCCA' : 'New RCCA'}
              </h1>
            </div>
            <div className="flex items-center space-x-4">

              {hasEditPermission() && (
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors dark:bg-gray-500 dark:hover:bg-gray-600"
                >
                  <Save className="w-4 h-4" />
                  Save Draft
                </button>
              )}
              {hasEditPermission() && (
                <button
                  onClick={handleSubmit}
                  disabled={!isFormComplete()}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-500 dark:hover:bg-blue-600"
                >
                  <Send className="w-4 h-4" />
                  {editingRCCA && editingRCCA.status === 'Rejected' ? 'Resubmit RCCA' : 'Submit RCCA'}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Section Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 p-4 sticky top-8 dark:bg-gray-800 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 mb-4 dark:text-white">RCCA Sections</h3>
              <nav className="space-y-2">
                {sections.map((section, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveSection(index)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-3 ${
                      activeSection === index
                        ? 'bg-red-50 text-blue-700 border border-red-200 dark:bg-red-900 dark:text-red-100 dark:border-red-700'
                        : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                  >
                    <section.icon className="w-4 h-4" />
                    <span className="text-sm">{section.title}</span>
                    <Tooltip content={section.tooltip}>
                      <span className="text-gray-500 hover:text-gray-700 transition-colors dark:text-gray-400 dark:hover:text-gray-200">
                        <svg className="w-4 h-4 ml-auto text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                        </svg>
                      </span>
                    </Tooltip>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Form Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl border border-gray-200 p-8 dark:bg-gray-800 dark:border-gray-700">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2 dark:text-white">
                  {sections[activeSection].title}
                </h2>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-red-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((activeSection + 1) / sections.length) * 100}%` }}
                  ></div>
                </div>
              </div>

              {renderSection()}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setActiveSection(Math.max(0, activeSection - 1))}
                  disabled={activeSection === 0}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                {activeSection < sections.length - 1 ? (
                  <button
                    onClick={() => setActiveSection(Math.min(sections.length - 1, activeSection + 1))}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Next
                  </button>
                ) : (
                  <div className="flex gap-3">
                    <button
                      onClick={handleSave}
                      className="flex items-center gap-2 px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      {isFormComplete() ? 'Save Complete' : 'Save Draft'}
                    </button>
                    {isFormComplete() && (
                      <button
                        onClick={handleSubmit}
                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Send className="w-4 h-4" />
                        {editingRCCA && editingRCCA.status === 'Rejected' ? 'Resubmit RCCA' : 'Submit RCCA'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RCCAForm;