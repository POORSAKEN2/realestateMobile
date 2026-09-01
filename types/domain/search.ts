export interface GlobalSearchResults {
  query: string;
  properties: Array<{
    id: string;
    title: string;
    location?: string;
    status?: string;
    type?: string;
  }>;
  leases: Array<{
    id: string;
    client_id?: string;
    room_number?: string;
    status?: string;
    client?: { id: string; name: string; contact_email?: string };
  }>;
  clients: Array<{
    id: string;
    name: string;
    contact_email?: string;
    phone?: string;
  }>;
  expenses: Array<{
    id: string;
    description?: string;
    category?: string;
    reference_no?: string;
    amount?: number;
  }>;
  documents: Array<{
    id: string;
    name: string;
    category?: string;
    type?: string;
  }>;
  bookings: Array<{
    id: string;
    client_id?: string;
    property_id?: string;
    room_number?: string;
    status?: string;
    client?: { id: string; name: string };
  }>;
}
