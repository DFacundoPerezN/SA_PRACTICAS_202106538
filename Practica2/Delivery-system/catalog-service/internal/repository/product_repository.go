package repository

import (
	"catalog-service/internal/domain"
	"database/sql"
)

type ProductRepository struct {
	db *sql.DB
}

func NewProductRepository(db *sql.DB) *ProductRepository {
	return &ProductRepository{db: db}
}

func (r *ProductRepository) GetByRestaurant(restaurantID int) ([]domain.Product, error) {

	rows, err := r.db.Query(`
		SELECT Id, Nombre, Descripcion, Precio, Disponible, RestauranteId, Categoria
		FROM Producto
		WHERE RestauranteId = @p1
	`, restaurantID)

	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var products []domain.Product

	for rows.Next() {
		var p domain.Product

		err := rows.Scan(
			&p.ID,
			&p.Nombre,
			&p.Descripcion,
			&p.Precio,
			&p.Disponible,
			&p.RestauranteID,
			&p.Categoria,
		)

		if err != nil {
			return nil, err
		}

		products = append(products, p)
	}

	return products, nil
}
