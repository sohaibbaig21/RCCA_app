const API_BASE_URL = 'http://localhost:5000';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface LoginResult {
  isValid: boolean;
  user?: User;
  message?: string;
}

export const authService = {
  async validateUser(id: string, password: string): Promise<LoginResult> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, password }),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      return {
        isValid: data.success,
        user: data.user,
        message: data.message
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        isValid: false,
        message: 'Login failed. Please try again.'
      };
    }
  },

  async forgotPassword(userId: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error('Forgot password request failed');
      }

      const data = await response.json();
      return {
        success: data.success,
        message: data.message
      };
    } catch (error) {
      console.error('Forgot password error:', error);
      return {
        success: false,
        message: 'Failed to process forgot password request. Please try again.'
      };
    }
  },

  async getUsers(): Promise<User[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/users`);
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  }
};

export const rccaService = {
  async getAllRCCAs(): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/rcca`);
      if (!response.ok) {
        throw new Error('Failed to fetch RCCAs');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching RCCAs:', error);
      return [];
    }
  },

  async createRCCA(rccaData: any): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/rcca`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(rccaData),
      });

      if (!response.ok) {
        throw new Error('Failed to create RCCA');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating RCCA:', error);
      throw error;
    }
  },

  async updateRCCA(id: string, rccaData: any, user?: any): Promise<any> {
    try {
      const requestBody = {
        ...rccaData,
        userId: user?.id,
        isAdmin: user?.role === 'admin'
      };
      
      const response = await fetch(`${API_BASE_URL}/rcca/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update RCCA');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating RCCA:', error);
      throw error;
    }
  },

  async deleteRCCA(id: string, reason?: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/rcca/delete/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: reason || 'Deleted by admin' }),
      });

      return response.ok;
    } catch (error) {
      console.error('Error deleting RCCA:', error);
      return false;
    }
  },

  async getDrafts(): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/rcca/list/draft`);
      if (!response.ok) {
        throw new Error('Failed to fetch drafts');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching drafts:', error);
      return [];
    }
  },

  async getSubmittedRCCAs(): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/rcca/list/submitted`);
      if (!response.ok) {
        throw new Error('Failed to fetch submitted RCCAs');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching submitted RCCAs:', error);
      return [];
    }
  },

  async getPendingRCCAs(): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/rcca/list/submitted`);
      if (!response.ok) {
        throw new Error('Failed to fetch pending RCCAs');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching pending RCCAs:', error);
      return [];
    }
  },

  async getRCCAs(): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/rcca/list?includeRejected=true`);
      if (!response.ok) {
        throw new Error('Failed to fetch RCCAs');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching RCCAs:', error);
      return [];
    }
  },

  async getDashboardStats(): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/rcca/stats`);
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard stats');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return {
        totalRCCAs: 0,
        openInProgress: 0,
        overdue: 0,
        completed: 0,
        averageResolutionTime: 0,
        weeklyTrend: [0, 0, 0, 0, 0, 0, 0]
      };
    }
  },

  async approveRCCA(rccaData: any, approvedByUser?: any): Promise<any> {
    try {
      const requestBody = {
        ...rccaData,
        approvedBy: approvedByUser?.id || approvedByUser // Include who is approving
      };
      
      const response = await fetch(`${API_BASE_URL}/api/rcca/approve/${rccaData._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      if (!response.ok) {
        throw new Error('Failed to approve RCCA');
      }
      return await response.json();
    } catch (error) {
      console.error('Error approving RCCA:', error);
      throw error;
    }
  },

  async saveDraft(rccaData: any): Promise<any> {
    // Save draft to backend using the new draft endpoint
    try {
      const response = await fetch(`${API_BASE_URL}/api/rcca/draft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(rccaData),
      });
      if (!response.ok) {
        throw new Error('Failed to save draft');
      }
      return await response.json();
    } catch (error) {
      console.error('Error saving draft:', error);
      throw error;
    }
  },

  async submitRCCA(rccaData: any): Promise<any> {
    // Submit RCCA to backend (adjust endpoint as needed)
    try {
      const response = await fetch(`${API_BASE_URL}/api/rcca/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(rccaData),
      });
      if (!response.ok) {
        throw new Error('Failed to submit RCCA');
      }
      return await response.json();
    } catch (error) {
      console.error('Error submitting RCCA:', error);
      throw error;
    }
  },

  async rejectRCCA(id: string, reason: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/rcca/reject/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });
      if (!response.ok) {
        throw new Error('Failed to reject RCCA');
      }
      return await response.json();
    } catch (error) {
      console.error('Error rejecting RCCA:', error);
      throw error;
    }
  },

  async resubmitRCCA(id: string, rccaData: any): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/rcca/resubmit/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(rccaData),
      });

      if (!response.ok) {
        throw new Error('Failed to resubmit RCCA');
      }

      return await response.json();
    } catch (error) {
      console.error('Error resubmitting RCCA:', error);
      throw error;
    }
  },

  getDraftsFromLocal: () => {
    const draftsJSON = localStorage.getItem('rccaDrafts') || '[]';
    const drafts = JSON.parse(draftsJSON);
    return drafts.filter((d: any) => d.status === 'Draft');
  }
};

export const approveRCCA = async (id: string, approvedBy: string) => {
  const res = await fetch(`${API_BASE_URL}/api/rcca/approve/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ approvedBy })
  });
  return res.json();
};

export const rejectRCCA = async (id: string, reason: string, rejectedBy: string) => {
  const res = await fetch(`${API_BASE_URL}/api/rcca/reject/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason, rejectedBy })
  });
  return res.json();
};

export const getNotifications = async (userId: string) => {
  const res = await fetch(`${API_BASE_URL}/api/rcca/notifications/${userId}`);
  return res.json();
};

export const markNotificationRead = async (notificationId: string) => {
  const res = await fetch(`${API_BASE_URL}/api/rcca/notifications/${notificationId}/read`, {
    method: 'POST',
  });
  return res.json();
};

// Minimal stub for emailService to avoid import error
export const emailService = {
  async sendNotification(userIds: string[], rccaTitle: string, action: string): Promise<void> {
    // Implement actual email sending logic or integrate with emailjs as needed
    console.log('Email notification would be sent to:', userIds, 'for RCCA:', rccaTitle, 'action:', action);
    return;
  }
};

// User management service for Excel uploads
export const userService = {
  async uploadUsers(users: any[]): Promise<boolean> {
    try {
      // Send users to backend
      const response = await fetch(`${API_BASE_URL}/users/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ users }),
      });

      if (!response.ok) {
        throw new Error('Failed to upload users to backend');
      }

      const result = await response.json();
      
      if (result.success) {
        // Also store in localStorage as backup
        const existingUsers = JSON.parse(localStorage.getItem('uploadedUsers') || '[]');
        const updatedUsers = [...existingUsers, ...users];
        localStorage.setItem('uploadedUsers', JSON.stringify(updatedUsers));
        localStorage.setItem('usersUploaded', 'true');
        
        console.log(`Successfully uploaded ${users.length} users to the system`);
        return true;
      } else {
        throw new Error('Backend rejected user upload');
      }
    } catch (error) {
      console.error('Error uploading users:', error);
      return false;
    }
  },

  async getUploadedUsers(): Promise<any[]> {
    try {
      const users = JSON.parse(localStorage.getItem('uploadedUsers') || '[]');
      return users;
    } catch (error) {
      console.error('Error getting uploaded users:', error);
      return [];
    }
  },

  async hasUploadedUsers(): Promise<boolean> {
    try {
      // Check backend first
      const response = await fetch(`${API_BASE_URL}/users`);
      if (response.ok) {
        const backendUsers = await response.json();
        if (backendUsers.length > 0) {
          return true;
        }
      }
      
      // Fallback to localStorage check
      const uploaded = localStorage.getItem('usersUploaded');
      const users = await this.getUploadedUsers();
      return uploaded === 'true' && users.length > 0;
    } catch (error) {
      console.error('Error checking uploaded users:', error);
      // Fallback to localStorage only
      const uploaded = localStorage.getItem('usersUploaded');
      const users = await this.getUploadedUsers();
      return uploaded === 'true' && users.length > 0;
    }
  },

  async getAllUsers(): Promise<any[]> {
    try {
      // Fetch users from backend
      const response = await fetch(`${API_BASE_URL}/users`);
      if (!response.ok) {
        throw new Error('Failed to fetch users from backend');
      }
      
      const backendUsers = await response.json();
      
      // Also get any additional users from localStorage as backup
      const localStorageUsers = JSON.parse(localStorage.getItem('uploadedUsers') || '[]');
      
      // Merge users, preferring backend users if there are duplicates
      const userMap = new Map();
      
      // Add backend users first
      backendUsers.forEach((user: any) => {
        userMap.set(user.id, user);
      });
      
      // Add localStorage users (will override if duplicate ID)
      localStorageUsers.forEach((user: any) => {
        userMap.set(user.id, user);
      });
      
      return Array.from(userMap.values());
    } catch (error) {
      console.error('Error getting all users:', error);
      // Fallback to localStorage only
      try {
        return JSON.parse(localStorage.getItem('uploadedUsers') || '[]');
      } catch {
        return [];
      }
    }
  }
}; 

export async function queryRCCAs(intent: string, filters: any, groupByDate?: boolean) {
  const res = await fetch('http://localhost:5000/api/rcca/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ intent, filters, groupByDate })
  });
  return res.json();
} 