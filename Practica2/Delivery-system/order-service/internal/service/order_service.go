package service

import (
	"context"
	orderpb "delivery-proto/orderpb"
	"order-service/internal/domain"
	catalogclient "order-service/internal/grpc"
	"order-service/internal/repository"
)

type OrderService struct {
	repo          *repository.OrderRepository
	catalogClient *catalogclient.CatalogClient
}

func NewOrderService(r *repository.OrderRepository, catalogClient *catalogclient.CatalogClient) *OrderService {
	return &OrderService{repo: r, catalogClient: catalogClient}
}

func (s *OrderService) CreateOrder(ctx context.Context, req *orderpb.CreateOrderRequest) (int, error) {

	order := &domain.Order{
		ClienteId:        int32(req.ClientId),
		ClienteNombre:    req.ClientName,
		ClienteTelefono:  req.ClientPhone,
		DireccionEntrega: req.Address,
		LatitudEntrega:   req.Lat,
		LongitudEntrega:  req.Lng,
		CostoTotal:       0, // luego lo calcularemos con catalog-service
	}

	for _, item := range req.Items {
		order.Items = append(order.Items, domain.OrderItem{
			ProductoId:  int32(item.ProductId),
			Cantidad:    int32(item.Quantity),
			Comentarios: item.Comments,
		})
	}

	return s.repo.CreateOrder(ctx, order)
}
