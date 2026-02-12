package dto

type CreateOrderRequest struct {
	ClienteId       int32  `json:"cliente_id"`
	ClienteNombre   string `json:"cliente_nombre"`
	ClienteTelefono string `json:"cliente_telefono"`

	DireccionEntrega string  `json:"direccion_entrega"`
	LatitudEntrega   float64 `json:"latitud"`
	LongitudEntrega  float64 `json:"longitud"`

	Items []ItemRequest `json:"items"`
}

type ItemRequest struct {
	ProductoId  int32  `json:"producto_id"`
	Cantidad    int32  `json:"cantidad"`
	Comentarios string `json:"comentarios"`
}
