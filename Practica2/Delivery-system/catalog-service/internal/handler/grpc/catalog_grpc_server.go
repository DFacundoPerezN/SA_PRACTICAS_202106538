package grpc

import (
	"catalog-service/internal/service"
	"context"

	catalogpb "delivery-proto/catalogpb"
)

type CatalogGRPCServer struct {
	catalogpb.UnimplementedCatalogServiceServer
	service *service.ProductService
}

func NewCatalogGRPCServer(s *service.ProductService) *CatalogGRPCServer {
	return &CatalogGRPCServer{service: s}
}

func (s *CatalogGRPCServer) GetCatalogByRestaurant(
	ctx context.Context,
	req *catalogpb.GetCatalogRequest,
) (*catalogpb.GetCatalogResponse, error) {

	products, err := s.service.GetCatalog(int(req.RestaurantId))
	if err != nil {
		return nil, err
	}

	var response catalogpb.GetCatalogResponse

	for _, p := range products {
		response.Products = append(response.Products, &catalogpb.Product{
			Id:           int32(p.ID),
			RestaurantId: int32(p.RestauranteID),
			Nombre:       p.Nombre,
			Descripcion:  p.Descripcion,
			Precio:       p.Precio,
			Disponible:   p.Disponible,
			Categoria:    p.Categoria,
		})
	}

	return &response, nil
}
