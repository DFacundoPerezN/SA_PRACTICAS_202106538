package grpc

import (
	"context"
	"time"

	orderpb "delivery-proto/orderpb"

	"google.golang.org/grpc"
)

type OrderClient struct {
	client orderpb.OrderServiceClient
}

func NewOrderClient(address string) (*OrderClient, error) {

	conn, err := grpc.Dial(address, grpc.WithInsecure())
	if err != nil {
		return nil, err
	}

	client := orderpb.NewOrderServiceClient(conn)

	return &OrderClient{client: client}, nil
}

func (o *OrderClient) CreateOrder(req *orderpb.CreateOrderRequest) (*orderpb.CreateOrderResponse, error) {

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	return o.client.CreateOrder(ctx, req)
}

func (c *OrderClient) UpdateOrderStatus(orderID int32, status string) (*orderpb.UpdateOrderStatusResponse, error) {
	return c.client.UpdateOrderStatus(
		context.Background(),
		&orderpb.UpdateOrderStatusRequest{
			OrderId:   orderID,
			NewStatus: status,
		},
	)
}

func (c *OrderClient) CancelOrder(
	ctx context.Context,
	orderID int32,
	userID int32,
	motivo string,
) (*orderpb.CancelOrderResponse, error) {

	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	return c.client.CancelOrder(ctx, &orderpb.CancelOrderRequest{
		OrderId: orderID,
		UserId:  userID,
		Reason:  motivo,
	})
}
