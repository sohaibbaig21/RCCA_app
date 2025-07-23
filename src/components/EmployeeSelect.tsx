import React, { useState, useRef, useEffect } from 'react';

interface Employee {
  id: string;
  name: string;
  factory?: string;
}

interface EmployeeSelectProps {
  employees: Employee[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
}

const EmployeeSelect: React.FC<EmployeeSelectProps> = ({ employees, value, onChange, label, placeholder }) => {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const normalized = (str: string) => str.toLowerCase().replace(/\s+/g, '');
  const filtered = employees.filter(emp =>
    normalized(emp.name).includes(normalized(search)) ||
    normalized(emp.id).includes(normalized(search))
  );

  const selectedEmployee = employees.find(emp => emp.id === value);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectClick = () => {
    setIsOpen(!isOpen);
    setIsFocused(true);
    if (!isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleEmployeeSelect = (employeeId: string) => {
    onChange(employeeId);
    setIsOpen(false);
    setIsFocused(false);
    setSearch('');
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    if (!isOpen) {
      setIsOpen(true);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      
      {/* Main select button */}
      <div
        onClick={handleSelectClick}
        className={`w-full px-4 py-2 border border-gray-300 rounded cursor-pointer bg-white flex justify-between items-center ${
          isFocused ? 'border-blue-500 ring-1 ring-blue-500' : 'hover:border-gray-400'
        }`}
      >
        <span className={selectedEmployee ? 'text-gray-900' : 'text-gray-500'}>
          {selectedEmployee 
            ? `${selectedEmployee.name} (${selectedEmployee.id})${selectedEmployee.factory ? ` - ${selectedEmployee.factory}` : ''}` 
            : placeholder || 'Select employee'
          }
        </span>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${
            isOpen ? 'transform rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b border-gray-200">
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={handleSearchChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              placeholder="Search by name or ID..."
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          
          {/* Options list */}
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-4 py-2 text-gray-500 text-sm">
                No employees found
              </div>
            ) : (
              filtered.map(emp => (
                <div
                  key={emp.id}
                  onClick={() => handleEmployeeSelect(emp.id)}
                  className={`px-4 py-2 cursor-pointer hover:bg-blue-50 ${
                    emp.id === value ? 'bg-blue-100 text-blue-900' : 'text-gray-900'
                  }`}
                >
                  <div className="font-medium">{emp.name}</div>
                  <div className="text-sm text-gray-500">
                    ID: {emp.id}{emp.factory ? ` • ${emp.factory}` : ''}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeSelect;