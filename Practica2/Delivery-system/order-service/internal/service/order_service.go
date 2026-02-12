package service

import (
	"errors"
	"order-service/internal/grpcclient"
)

type OrderService struct {
	catalogClient *grpcclient.CatalogClient
}

func NewOrderService(catalogClient *grpcclient.CatalogClient) *OrderService {
	return &OrderService{catalogClient: catalogClient}
}

func (s *OrderService) ValidateProducts(items map[int32]int32) (float64, int32, error) {

	// obtener ids
	var ids []int32
	for id := range items {
		ids = append(ids, id)
	}

	products, err := s.catalogClient.GetProductsByIDs(ids)
	if err != nil {
		return 0, 0, err
	}

	if len(products) != len(ids) {
		return 0, 0, errors.New("uno o más productos no existen")
	}

	var restaurantID int32 = -1
	var total float64

	for _, p := range products {

		if !p.Disponible {
			return 0, 0, errors.New("producto no disponible")
		}

		if restaurantID == -1 {
			restaurantID = p.RestauranteId
		} else if restaurantID != p.RestauranteId {
			return 0, 0, errors.New("todos los productos deben ser del mismo restaurante")
		}

		cantidad := items[p.Id]
		total += p.Precio * float64(cantidad)
	}

	return total, restaurantID, nil
}
