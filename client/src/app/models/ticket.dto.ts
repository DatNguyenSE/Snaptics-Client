export interface TicketDto {
  id: number;
  title: string;
  description?: string;
  status: 'Open' | 'InProgress' | 'Resolved' | 'Closed' | string;
  priority?: 'Low' | 'Medium' | 'High' | 'Urgent' | string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}

export interface CreateTicketDto {
  title: string;
  description?: string;
  priority?: string;
}

export interface UpdateTicketDto {
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
}
