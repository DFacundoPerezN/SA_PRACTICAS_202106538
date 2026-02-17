package grpc

import (
	"context"

	"order-service/internal/service"

	orderpb "delivery-proto/orderpb"
)

type OrderGRPCServer struct {
	orderpb.UnimplementedOrderServiceServer
	service *service.OrderService
}

func NewOrderGRPCServer(s *service.OrderService) *OrderGRPCServer {
	return &OrderGRPCServer{service: s}
}

func (s *OrderGRPCServer) CreateOrder(
	ctx context.Context,
	req *orderpb.CreateOrderRequest,
) (*orderpb.CreateOrderResponse, error) {

	orderID, err := s.service.CreateOrder(ctx, req)
	if err != nil {
		return nil, err
	}

	return &orderpb.CreateOrderResponse{
		OrderId: int32(orderID),
		Estado:  "CREADA",
	}, nil
}

func (s *OrderGRPCServer) UpdateOrderStatus(
	ctx context.Context,
	req *orderpb.UpdateOrderStatusRequest,
) (*orderpb.UpdateOrderStatusResponse, error) {

	status, err := s.service.UpdateOrderStatus(ctx, int(req.OrderId), req.NewStatus)
	if err != nil {
		return nil, err
	}

	return &orderpb.UpdateOrderStatusResponse{
		OrderId: req.OrderId,
		Status:  status,
	}, nil
}

func (s *OrderGRPCServer) CancelOrder(ctx context.Context, req *orderpb.CancelOrderRequest) (*orderpb.CancelOrderResponse, error) {
	/*fmt.Printf("Received CancelOrder request: order_id=%d, reason=%s, user_id=%d\n", req.OrderId, req.Reason, req.UserId)
	userID, ok := ctx.Value("user_id").(int)
	fmt.Printf("Extracted user_id from context: %d (ok=%v)\n", userID, ok)
	if !ok {
		return nil, status.Error(codes.Unauthenticated, "user not authenticated")
	}*/

	_, err := s.service.CancelOrder(ctx, int(req.OrderId), int(req.UserId), req.Reason)
	if err != nil {
		return nil, err
	}

	return &orderpb.CancelOrderResponse{
		OrderId:   req.OrderId,
		NewStatus: "CANCELADA",
		//CancelledAt: timestamppb.New(cancelledAt),
	}, nil
}
