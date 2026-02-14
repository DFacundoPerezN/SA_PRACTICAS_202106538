import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { authService } from '../services/api'
import api from '../services/api'
import '../styles/Dashboard.css'

const RestaurantMenu = () => {
  const { restaurantId } = useParams()
  const navigate = useNavigate()
  const user = authService.getCurrentUser()

  const [restaurant, setRestaurant] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadRestaurantData()
    fetchProducts()
  }, [restaurantId])

  const loadRestaurantData = () => {
    // Cargar info del restaurante desde localStorage
    const savedRestaurant = localStorage.getItem('currentRestaurant')
    if (savedRestaurant) {
      setRestaurant(JSON.parse(savedRestaurant))
    }
  }

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/api/restaurants/${restaurantId}/products`)
      setProducts(response.data.products || [])
      setError('')
    } catch (err) {
      console.error('Error fetching products:', err)
      setError('Error al cargar el menú')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    authService.logout()
    navigate('/login')
  }

  const handleBack = () => {
    navigate('/cliente/dashboard')
  }

  // Agrupar productos por categoría
  const productsByCategory = products.reduce((acc, product) => {
    const category = product.categoria || 'Sin categoría'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(product)
    return acc
  }, {})

  return (
    <div className="dashboard-container">
      <nav className="dashboard-nav">
        <div className="nav-brand">
          <div className="logo-icon">🚀</div>
          <div className="logo-text">DeliveryApp</div>
        </div>
        <div className="nav-user">
          <div className="user-info">
            <span className="user-name">{user?.nombre_completo}</span>
            <span className="user-role">Cliente</span>
          </div>
          <button onClick={handleLogout} className="btn-logout">
            Cerrar Sesión
          </button>
        </div>
      </nav>

      <div className="dashboard-content">
        <button onClick={handleBack} className="btn-back">
          ← Volver a Restaurantes
        </button>

        {restaurant && (
          <div className="restaurant-header">
            <div className="restaurant-header-info">
              <h1>{restaurant.nombre}</h1>
              <div className="restaurant-meta">
                {restaurant.calificacion && (
                  <span>⭐ {restaurant.calificacion.toFixed(1)}</span>
                )}
                {restaurant.direccion && (
                  <span>📍 {restaurant.direccion}</span>
                )}
                {restaurant.telefono && (
                  <span>📞 {restaurant.telefono}</span>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="menu-section">
          <h2>Menú</h2>
          
          {error && (
            <div className="alert alert-error" style={{ marginBottom: '20px' }}>
              {error}
            </div>
          )}

          {loading ? (
            <div className="loading-state">
              <div className="spinner-large"></div>
              <p>Cargando menú...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🍽️</div>
              <p>No hay productos disponibles</p>
              <small>Este restaurante aún no tiene productos en su menú</small>
            </div>
          ) : (
            <div className="menu-categories">
              {Object.entries(productsByCategory).map(([category, categoryProducts]) => (
                <div key={category} className="menu-category">
                  <h3 className="category-title">{category}</h3>
                  <div className="products-grid">
                    {categoryProducts.map((product) => (
                      <div key={product.id} className="product-card">
                        <div className="product-info">
                          <h4>{product.nombre}</h4>
                          {product.descripcion && (
                            <p className="product-description">{product.descripcion}</p>
                          )}
                          <div className="product-footer">
                            <span className="product-price">
                              ${product.precio.toFixed(2)}
                            </span>
                            {!product.disponible && (
                              <span className="product-unavailable">No disponible</span>
                            )}
                          </div>
                        </div>
                        <button 
                          className="btn-add-to-cart"
                          disabled={!product.disponible}
                        >
                          {product.disponible ? 'Agregar' : 'Agotado'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default RestaurantMenu