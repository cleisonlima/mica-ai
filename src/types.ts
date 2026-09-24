export type Role = 'user' | 'assistant' | 'system';

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: string;
  image?: string;
  tools_used?: string[];
  tool_execution_details?: {
    tool_name: string;
    arguments: Record<string, any>;
    result: any;
    status: 'success' | 'warning' | 'error';
  }[];
}

export type PermissionLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface ActivityItem {
  id: string;
  time: string;
  text: string;
  type: 'info' | 'plan' | 'tool' | 'exec' | 'done' | 'warn' | 'security';
  toolName?: string;
}

export interface SecurityConfirmation {
  token: string;
  tool_name: string;
  arguments: Record<string, any>;
  description: string;
  permission_level: PermissionLevel;
  timestamp: number;
}

export interface MemoryItem {
  id: string;
  category: 'profile' | 'preference' | 'project' | 'important' | 'context';
  key: string;
  value: string;
  updated_at: string;
}

export interface SystemSettings {
  assistant_name: string;
  ai_model: string;
  voice_enabled: boolean;
  voice_speed: number;
  voice_pitch: number;
  personality: string;
  detail_level: 'concise' | 'balanced' | 'detailed';
  memory_enabled: boolean;
  computer_control_enabled: boolean;
  require_high_permission_confirmation: boolean;
  theme: string;
}

export interface ActiveToolLog {
  name: string;
  status: 'planning' | 'executing' | 'completed' | 'denied';
  detail: string;
  args?: Record<string, any>;
}

export interface SystemStatusInfo {
  status: 'online' | 'busy' | 'offline';
  cpuUsage: number;
  memoryUsage: number;
  activeWindow: string;
  activeApp: string;
  connectedTools: number;
  totalCommandsExecuted: number;
}
