export type UserRole = 'owner' | 'collaborator';

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface TripMember {
  userId: string;
  displayName: string;
  email: string;
  avatarUrl?: string;
  role: UserRole;
  joinedAt: string;
}

export interface TripDestination {
  name: string;
  timezone: string;
  startDate: string;
  endDate: string;
}

export interface Trip {
  id: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  destinations: TripDestination[];
  ownerId: string;
  members: TripMember[];
  createdAt: string;
  updatedAt: string;
}

export type OrderType = 'flight' | 'accommodation' | 'activity';
export type OrderStatus = 'confirmed' | 'cancelled' | 'pending';

export interface Order {
  id: string;
  tripId: string | null;
  createdBy: string;
  createdByName: string;
  lastModifiedBy?: string;
  lastModifiedAt?: string;
  type: OrderType;
  vendor: string;
  bookingRef: string;
  startDatetime: string;
  endDatetime: string;
  price: number;
  currency: string;
  status: OrderStatus;
  rawEmailId?: string;
  bookingDate?: string | null;
  flaggedForReview: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TimelineSlot {
  id: string;
  tripId: string;
  orderId: string;
  order?: Order;
  day: string;
  position: number;
  placedBy: string;
  placedByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmailConnection {
  id: string;
  userId: string;
  provider: 'gmail' | 'outlook';
  email: string;
  connectedAt: string;
}

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
