import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, Users, AlertCircle, CheckCircle, X, ChevronDown, ChevronUp } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useNavigate } from 'react-router-dom';

interface ExcelUploadProps {
  isAdmin: boolean;
  onUsersUploaded: (users: any[]) => void;
  onClose?: () => void;
}

interface UserData {
  id: string;
  name: string;
  email: string;
  factory: string;
}

const ExcelUpload: React.FC<ExcelUploadProps> = ({ isAdmin, onUsersUploaded, onClose }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parsedUsers, setParsedUsers] = useState<UserData[]>([]);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showParsedUsers, setShowParsedUsers] = useState(false);
  const navigate = useNavigate();
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);

  // Only show for admins
  if (!isAdmin) {
    return null;
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    setUploadStatus('processing');
    setErrorMessage('');
    setSuccessMessage('');

    // Validate file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv', // .csv
      'application/csv'
    ];

    if (!validTypes.includes(file.type)) {
      setErrorMessage('Please upload a valid Excel file (.xlsx, .xls) or CSV file (.csv)');
      setUploadStatus('error');
      return;
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      // Get the first sheet
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (jsonData.length < 2) {
        setErrorMessage('File must contain at least a header row and one data row');
        setUploadStatus('error');
        return;
      }

      // Parse the data
      const users = parseUserData(jsonData);
      
      if (users.length === 0) {
        setErrorMessage('No valid user data found. Please ensure the file contains columns for ID, Name, Email, and Factory');
        setUploadStatus('error');
        return;
      }

      setUploadedFile(file);
      setParsedUsers(users);
      setUploadStatus('success');
      setSuccessMessage(`Successfully parsed ${users.length} users from ${file.name}`);
      
    } catch (error) {
      console.error('Error parsing file:', error);
      setErrorMessage('Error parsing file. Please ensure it\'s a valid Excel or CSV file');
      setUploadStatus('error');
    }
  };

  const parseUserData = (jsonData: any[]): UserData[] => {
    const users: any[] = [];
    const headers = jsonData[0] as string[];
    // Find column indices
    const idIndex = headers.findIndex(h => h.toLowerCase().includes('id') || h.toLowerCase().includes('employee'));
    const nameIndex = headers.findIndex(h => h.toLowerCase().includes('name') || h.toLowerCase().includes('full'));
    const emailIndex = headers.findIndex(h => h.toLowerCase().includes('email') || h.toLowerCase().includes('mail'));
    const passwordIndex = headers.findIndex(h => h.toLowerCase().includes('password'));
    const factoryIndex = headers.findIndex(h => h.toLowerCase().includes('factory'));
    
    if (idIndex === -1 || nameIndex === -1) {
      throw new Error('Required columns not found. Please ensure the file contains ID and Name columns');
    }
    
    // Factory name normalization function
    const normalizeFactoryName = (factory: string): string => {
      const normalized = factory.toLowerCase().trim();
      
      // Handle various formats
      if (normalized === 'dpl1' || normalized === 'dpl 1' || normalized === 'dpl-1') {
        return 'DPL 1';
      }
      if (normalized === 'dpl2' || normalized === 'dpl 2' || normalized === 'dpl-2') {
        return 'DPL 2';
      }
      if (normalized === 'uril') {
        return 'URIL';
      }
      
      // Default fallback
      return 'DPL 1';
    };
    
    // Process data rows
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i] as any[];
      if (row.length > 0) {
        const id = String(row[idIndex] || '').trim();
        const name = String(row[nameIndex] || '').trim();
        const email = emailIndex !== -1 ? String(row[emailIndex] || '').trim() : `${id}@gmail.com`;
        const password = passwordIndex !== -1 ? String(row[passwordIndex] || '').trim() : '123';
        const rawFactory = factoryIndex !== -1 ? String(row[factoryIndex] || '').trim() : 'DPL 1';
        const factory = normalizeFactoryName(rawFactory);
        
        if (id && name) {
          users.push({ id, name, email, password, role: 'employee', factory });
        }
      }
    }
    return users;
  };

  const handleSaveUsers = async () => {
    try {
      setUploadStatus('processing');
      
      // Call the actual API to upload users to backend
      const response = await fetch('http://localhost:5000/users/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ users: parsedUsers }),
      });

      if (!response.ok) {
        throw new Error('Failed to upload users to backend');
      }

      const result = await response.json();
      
      if (result.success) {
        setShowSuccessScreen(true);
        setSuccessMessage(`Successfully uploaded ${result.count} users to the database!`);
        if (onUsersUploaded) {
          onUsersUploaded(parsedUsers);
        }
      } else {
        throw new Error('Backend rejected user upload');
      }
    } catch (error) {
      console.error('Error uploading users:', error);
      setErrorMessage('Failed to upload users to the system');
      setUploadStatus('error');
    }
  };

  const handleCloseSuccess = () => {
    setShowSuccessScreen(false);
    setUploadStatus('idle');
    setUploadedFile(null);
    setParsedUsers([]);
    setSuccessMessage('');
    if (onClose) onClose();
  };

  const handleClear = () => {
    setUploadedFile(null);
    setParsedUsers([]);
    setUploadStatus('idle');
    setErrorMessage('');
    setSuccessMessage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 max-w-md mx-auto shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <FileSpreadsheet className="w-5 h-5 text-blue-600" />
        <h3 className="text-base font-semibold text-gray-900">Upload User Data (Admin Only)</h3>
      </div>

      {showSuccessScreen ? (
        <div className="flex flex-col items-center justify-center min-h-[200px]">
          <CheckCircle className="w-12 h-12 text-green-600 mb-4" />
          <p className="text-lg font-semibold text-green-700">{successMessage}</p>
          <button
            onClick={handleCloseSuccess}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-semibold"
          >
            Close
          </button>
        </div>
      ) : (
        // Upload Area
        <div
          className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors min-h-[120px] flex flex-col justify-center items-center ${
            isDragOver 
              ? 'border-blue-400 bg-blue-50' 
              : uploadStatus === 'success'
              ? 'border-green-400 bg-green-50'
              : uploadStatus === 'error'
              ? 'border-red-400 bg-red-50'
              : 'border-gray-300 bg-gray-50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{ minHeight: 120 }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileSelect}
            className="hidden"
          />

          {uploadStatus === 'idle' && (
            <div>
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-base font-medium text-gray-700 mb-1">
                Drag & drop Excel file
              </p>
              <p className="text-gray-500 mb-2 text-xs">
                or <span className="underline cursor-pointer text-blue-600" onClick={handleUploadClick}>browse files</span>
              </p>
              <div className="mt-2 text-xs text-gray-500">
                <p>Supported: .xlsx, .xls, .csv</p>
                <p>Columns: ID, Name, Email (optional), Factory (optional)</p>
              </div>
            </div>
          )}

          {uploadStatus === 'processing' && (
            <div>
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-base font-medium text-gray-700">Processing...</p>
            </div>
          )}

          {uploadStatus === 'success' && (
            <div>
              <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-base font-medium text-green-700 mb-1">File Parsed Successfully!</p>
              <p className="text-green-600 mb-2 text-xs">{successMessage}</p>
              <div className="flex gap-2 justify-center">
                <button
                  onClick={handleSaveUsers}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-semibold mt-2"
                >
                  Save Users
                </button>
                <button
                  onClick={handleClear}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm font-semibold mt-2"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {uploadStatus === 'error' && (
            <div>
              <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
              <p className="text-base font-medium text-red-700 mb-1">Upload Failed</p>
              <p className="text-red-600 mb-2 text-xs">{errorMessage}</p>
              <button
                onClick={handleClear}
                className="px-4 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 text-xs"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      )}

      {/* Parsed Users Preview with Dropdown */}
      {parsedUsers.length > 0 && !showSuccessScreen && (
        <div className="mt-4">
          <button
            className="flex items-center gap-2 mb-2 focus:outline-none w-full text-left"
            onClick={() => setShowParsedUsers(v => !v)}
            aria-expanded={showParsedUsers}
          >
            <Users className="w-4 h-4 text-gray-600" />
            <span className="font-medium text-gray-900 text-sm">Parsed Users ({parsedUsers.length})</span>
            {showParsedUsers ? (
              <ChevronUp className="w-4 h-4 text-gray-500 ml-auto" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500 ml-auto" />
            )}
          </button>
          {showParsedUsers && (
            <div className="bg-gray-50 rounded-lg p-2 max-h-40 overflow-y-auto border border-gray-200">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-1 font-medium text-gray-700">ID</th>
                    <th className="text-left py-1 font-medium text-gray-700">Name</th>
                    <th className="text-left py-1 font-medium text-gray-700">Email</th>
                    <th className="text-left py-1 font-medium text-gray-700">Factory</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedUsers.map((user, index) => (
                    <tr key={index} className="border-b border-gray-50">
                      <td className="py-1 text-gray-900">{user.id}</td>
                      <td className="py-1 text-gray-900">{user.name}</td>
                      <td className="py-1 text-gray-900">{user.email}</td>
                      <td className="py-1 text-gray-900">{user.factory}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ExcelUpload; 