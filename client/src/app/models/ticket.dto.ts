export * from './support-ticket.model';

export {
  TicketCategoryEnum,
  TicketStatusEnum,
  TicketPriorityEnum,
} from '../user-page/user-features/support/models/support.models';

export type {
  CreateTicketRequest,
  SendTicketMessageRequest,
  AssignTicketRequest,
  UpdateTicketStatusRequest,
  UpdateTicketPriorityRequest,
  TicketQueryParams,
  AdminTicketQueryParams,
  SupportStatsDto,
} from '../user-page/user-features/support/models/support.models';

export interface TicketDto {
  id: number | string;
  title: string;
  subject?: string;
  description?: string;
  status: string | number;
  priority?: string | number;
  category?: string | number;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  messageCount?: number;
}

export interface CreateTicketDto {
  title?: string;
  subject?: string;
  description?: string;
  category?: number;
  priority?: string | number;
}

export interface UpdateTicketDto {
  title?: string;
  subject?: string;
  description?: string;
  status?: string | number;
  priority?: string | number;
}
