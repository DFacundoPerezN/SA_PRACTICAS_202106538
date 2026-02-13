package handlers

import (
	"net/http"

	"api-gateway/internal/grpc"
	orderpb "delivery-proto/orderpb"

	"github.com/gin-gonic/gin"
)

type OrderHandler struct {
	orderClient *grpc.OrderClient
}

func NewOrderHandler(c *grpc.OrderClient) *OrderHandler {
	return &OrderHandler{orderClient: c}
}

type CreateOrderItem struct {
	ProductoId  int32  `json:"producto_id"`
	Cantidad    int32  `json:"cantidad"`
	Comentarios string `json:"comentarios"`
}

type CreateOrderBody struct {
	RestauranteId    int32             `json:"restaurante_id"`
	DireccionEntrega string            `json:"direccion_entrega"`
	Latitud          float64           `json:"latitud"`
	Longitud         float64           `json:"longitud"`
	Items            []CreateOrderItem `json:"items"`
}

func (h *OrderHandler) CreateOrder(c *gin.Context) {

	var body CreateOrderBody

	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID := c.GetInt("user_id")
	userName := c.GetString("nombre")
	userPhone := c.GetString("telefono")

	var items []*orderpb.OrderItem

	for _, i := range body.Items {
		items = append(items, &orderpb.OrderItem{
			ProductId: i.ProductoId,
			Quantity:  i.Cantidad,
			Comments:  i.Comentarios,
		})
	}

	req := &orderpb.CreateOrderRequest{
		ClientId:    int32(userID),
		ClientName:  userName,
		ClientPhone: userPhone,
		//RestaurantId: body.RestauranteId,
		Address: body.DireccionEntrega,
		Lat:     body.Latitud,
		Lng:     body.Longitud,
		Items:   items,
	}

	resp, err := h.orderClient.CreateOrder(req)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, resp)
}
