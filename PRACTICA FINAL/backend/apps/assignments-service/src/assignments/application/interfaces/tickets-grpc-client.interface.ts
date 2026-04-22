// Abstraction that lets assignments-service update the assigned_to field
// on a ticket without depending on a concrete gRPC client (DIP).
//
// The implementation injects the real gRPC client; tests inject a mock.

export interface ITicketsGrpcClient {
  assignTicket(data: {
    ticketId:     string;
    technicianId: string;
    assignedBy:   string;
  }): Promise<void>;
}

export const TICKETS_GRPC_CLIENT_TOKEN = Symbol('ITicketsGrpcClient');
