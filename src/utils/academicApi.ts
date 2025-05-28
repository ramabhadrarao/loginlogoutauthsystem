// src/utils/academicApi.ts - Fixed version without double /api
import { fetchWithAuth } from './api';

// Academic Year interfaces
export interface AcademicYear {
  _id: string;
  name: string;
  code: string;
  startYear: number;
  endYear: number;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  description?: string;
  status: 'upcoming' | 'active' | 'completed' | 'archived';
  dateCreated: string;
  dateUpdated: string;
}

// Program interfaces
export interface Program {
  _id: string;
  name: string;
  code: string;
  departmentId: string;
  coordinatorId?: string;
  duration?: string;
  degreeType: "Bachelor's" | "Master's" | "Doctoral" | "Diploma" | "Certificate";
  description?: string;
  status: 'active' | 'inactive' | 'archived';
  dateCreated: string;
  dateUpdated: string;
  
  // Populated fields
  departmentName?: string;
  departmentCode?: string;
  coordinatorName?: string;
  coordinatorEmail?: string;
}

// Branch interfaces
export interface Branch {
  _id: string;
  name: string;
  code: string;
  programId: string;
  coordinatorId?: string;
  description?: string;
  status: 'active' | 'inactive' | 'archived';
  dateCreated: string;
  dateUpdated: string;
  
  // Populated fields
  programName?: string;
  programCode?: string;
  departmentName?: string;
  coordinatorName?: string;
  coordinatorEmail?: string;
}

// Regulation interfaces
export interface Regulation {
  _id: string;
  name: string;
  code: string;
  programId: string;
  branchId?: string;
  effectiveFromYear: number;
  effectiveToYear?: number;
  description?: string;
  status: 'active' | 'inactive' | 'archived';
  dateCreated: string;
  dateUpdated: string;
  
  // Populated fields
  programName?: string;
  programCode?: string;
  departmentName?: string;
  branchName?: string;
  branchCode?: string;
  
  // Virtual fields
  isCurrentlyEffective?: boolean;
}

// Batch interfaces
export interface Batch {
  _id: string;
  name: string;
  programId: string;
  branchId?: string;
  startYear: number;
  endYear: number;
  mentorId?: string;
  maxStudents: number;
  currentStudents: number;
  description?: string;
  status: 'planned' | 'active' | 'graduated' | 'archived';
  dateCreated: string;
  dateUpdated: string;
  
  // Populated fields
  programName?: string;
  programCode?: string;
  departmentName?: string;
  branchName?: string;
  branchCode?: string;
  mentorName?: string;
  mentorEmail?: string;
  
  // Virtual fields
  duration?: number;
  currentAcademicYear?: number;
  isActive?: boolean;
  availableSeats?: number;
}

// Semester interfaces
export interface Semester {
  _id: string;
  name: string;
  academicYearId: string;
  regulationId: string;
  semesterNumber: number;
  startDate: string;
  endDate: string;
  registrationStartDate?: string;
  registrationEndDate?: string;
  examStartDate?: string;
  examEndDate?: string;
  resultPublishDate?: string;
  status: 'upcoming' | 'registration_open' | 'ongoing' | 'exam_period' | 'completed' | 'archived';
  dateCreated: string;
  dateUpdated: string;
  
  // Populated fields
  academicYearName?: string;
  regulationName?: string;
  programName?: string;
  branchName?: string;
  
  // Virtual fields
  isActive?: boolean;
}

// Academic Years API
export const academicYearsApi = {
  getAll: (): Promise<AcademicYear[]> => 
    fetchWithAuth('/academic-years'),

  getCurrent: (): Promise<AcademicYear> => 
    fetchWithAuth('/academic-years/current'),

  getById: (id: string): Promise<AcademicYear> => 
    fetchWithAuth(`/academic-years/${id}`),

  create: (data: Partial<AcademicYear>): Promise<AcademicYear> => 
    fetchWithAuth('/academic-years', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<AcademicYear>): Promise<AcademicYear> => 
    fetchWithAuth(`/academic-years/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  setCurrent: (id: string): Promise<AcademicYear> => 
    fetchWithAuth(`/academic-years/${id}/set-current`, {
      method: 'PUT',
    }),

  delete: (id: string): Promise<{ message: string }> => 
    fetchWithAuth(`/academic-years/${id}`, { method: 'DELETE' }),

  getStats: (): Promise<any> => 
    fetchWithAuth('/academic-years/stats/overview'),
};

// Programs API
export const programsApi = {
  getAll: (params?: { department?: string; degreeType?: string; status?: string }): Promise<Program[]> => {
    const searchParams = new URLSearchParams();
    if (params?.department) searchParams.append('department', params.department);
    if (params?.degreeType) searchParams.append('degreeType', params.degreeType);
    if (params?.status) searchParams.append('status', params.status);
    
    const queryString = searchParams.toString();
    return fetchWithAuth(`/programs${queryString ? `?${queryString}` : ''}`);
  },

  getById: (id: string): Promise<Program> => 
    fetchWithAuth(`/programs/${id}`),

  create: (data: Partial<Program>): Promise<Program> => 
    fetchWithAuth('/programs', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<Program>): Promise<Program> => 
    fetchWithAuth(`/programs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string): Promise<{ message: string }> => 
    fetchWithAuth(`/programs/${id}`, { method: 'DELETE' }),

  getByDepartment: (departmentId: string): Promise<Program[]> => 
    fetchWithAuth(`/programs/department/${departmentId}`),

  getDegreeTypes: (): Promise<string[]> => 
    fetchWithAuth('/programs/meta/degree-types'),
};

// Branches API
export const branchesApi = {
  getAll: (params?: { program?: string; status?: string }): Promise<Branch[]> => {
    const searchParams = new URLSearchParams();
    if (params?.program) searchParams.append('program', params.program);
    if (params?.status) searchParams.append('status', params.status);
    
    const queryString = searchParams.toString();
    return fetchWithAuth(`/branches${queryString ? `?${queryString}` : ''}`);
  },

  getById: (id: string): Promise<Branch> => 
    fetchWithAuth(`/branches/${id}`),

  create: (data: Partial<Branch>): Promise<Branch> => 
    fetchWithAuth('/branches', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<Branch>): Promise<Branch> => 
    fetchWithAuth(`/branches/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string): Promise<{ message: string }> => 
    fetchWithAuth(`/branches/${id}`, { method: 'DELETE' }),

  getByProgram: (programId: string): Promise<Branch[]> => 
    fetchWithAuth(`/branches/program/${programId}`),
};

// Regulations API
export const regulationsApi = {
  getAll: (params?: { program?: string; branch?: string; year?: number }): Promise<Regulation[]> => {
    const searchParams = new URLSearchParams();
    if (params?.program) searchParams.append('program', params.program);
    if (params?.branch) searchParams.append('branch', params.branch);
    if (params?.year) searchParams.append('year', params.year.toString());
    
    const queryString = searchParams.toString();
    return fetchWithAuth(`/regulations${queryString ? `?${queryString}` : ''}`);
  },

  getById: (id: string): Promise<Regulation> => 
    fetchWithAuth(`/regulations/${id}`),

  create: (data: Partial<Regulation>): Promise<Regulation> => 
    fetchWithAuth('/regulations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<Regulation>): Promise<Regulation> => 
    fetchWithAuth(`/regulations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string): Promise<{ message: string }> => 
    fetchWithAuth(`/regulations/${id}`, { method: 'DELETE' }),

  getByProgram: (programId: string): Promise<Regulation[]> => 
    fetchWithAuth(`/regulations/program/${programId}`),

  getCurrentlyEffective: (): Promise<Regulation[]> => 
    fetchWithAuth('/regulations/effective/current'),
};

// Batches API
export const batchesApi = {
  getAll: (params?: { program?: string; branch?: string; year?: number; status?: string }): Promise<Batch[]> => {
    const searchParams = new URLSearchParams();
    if (params?.program) searchParams.append('program', params.program);
    if (params?.branch) searchParams.append('branch', params.branch);
    if (params?.year) searchParams.append('year', params.year.toString());
    if (params?.status) searchParams.append('status', params.status);
    
    const queryString = searchParams.toString();
    return fetchWithAuth(`/batches${queryString ? `?${queryString}` : ''}`);
  },

  getActive: (): Promise<Batch[]> => 
    fetchWithAuth('/batches/active'),

  getById: (id: string): Promise<Batch> => 
    fetchWithAuth(`/batches/${id}`),

  create: (data: Partial<Batch>): Promise<Batch> => 
    fetchWithAuth('/batches', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<Batch>): Promise<Batch> => 
    fetchWithAuth(`/batches/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string): Promise<{ message: string }> => 
    fetchWithAuth(`/batches/${id}`, { method: 'DELETE' }),

  getByProgram: (programId: string): Promise<Batch[]> => 
    fetchWithAuth(`/batches/program/${programId}`),

  updateStudentCount: (id: string, count: number): Promise<Batch> => 
    fetchWithAuth(`/batches/${id}/student-count`, {
      method: 'PUT',
      body: JSON.stringify({ currentStudents: count }),
    }),

  getStats: (): Promise<any> => 
    fetchWithAuth('/batches/stats/overview'),
};

// Semesters API
export const semestersApi = {
  getAll: (params?: { academicYear?: string; regulation?: string; number?: number }): Promise<Semester[]> => {
    const searchParams = new URLSearchParams();
    if (params?.academicYear) searchParams.append('academicYear', params.academicYear);
    if (params?.regulation) searchParams.append('regulation', params.regulation);
    if (params?.number) searchParams.append('number', params.number.toString());
    
    const queryString = searchParams.toString();
    return fetchWithAuth(`/semesters${queryString ? `?${queryString}` : ''}`);
  },

  getCurrent: (): Promise<Semester[]> => 
    fetchWithAuth('/semesters/current'),

  getById: (id: string): Promise<Semester> => 
    fetchWithAuth(`/semesters/${id}`),

  create: (data: Partial<Semester>): Promise<Semester> => 
    fetchWithAuth('/semesters', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<Semester>): Promise<Semester> => 
    fetchWithAuth(`/semesters/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string): Promise<{ message: string }> => 
    fetchWithAuth(`/semesters/${id}`, { method: 'DELETE' }),

  getByAcademicYear: (academicYearId: string): Promise<Semester[]> => 
    fetchWithAuth(`/semesters/academic-year/${academicYearId}`),

  getByRegulation: (regulationId: string): Promise<Semester[]> => 
    fetchWithAuth(`/semesters/regulation/${regulationId}`),

  updateStatus: (id: string, status: string): Promise<Semester> => 
    fetchWithAuth(`/semesters/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
};