export type Performance = 'low' | 'medium' | 'high';
export type Potential = 'low' | 'medium' | 'high';

export interface Department {
  id: string;
  name: string;
  color?: string | null;
}

export interface Employee {
  id: string; // employee_id
  name: string;
  email?: string | null;
  department_id?: string | null;
  manager_name?: string | null;
  manager_id?: string | null;
  title?: string | null;
  location?: string | null;
}

export interface BoxDefinition {
  key: string; // e.g., 'high_high'
  label: string;
  description?: string | null;
  action_hint?: string | null;
  color?: string | null;
  grid_x: 1 | 2 | 3;
  grid_y: 1 | 2 | 3;
}

export interface Assessment {
  id: string;
  employee_id: string;
  performance: Performance;
  potential: Potential;
  box_key: string;
  note?: string | null;
  assessed_by?: string | null;
  assessed_at: string; // ISO
}
