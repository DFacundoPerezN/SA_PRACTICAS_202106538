import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../services/api'
import api from '../services/api'
import styles from '../styles/RestaurantDashboard.module.css'

const RestaurantDashboard = () => {
  const navigate = useNavigate()
  const user = authService.getCurrentUser()

  const [orders, setOrders] = useState([])
  const [filteredOrders, setFilteredOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('TODAS')
  
  // Modal para cancelar
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [cancelReason, setCancelReason] = useState('')

  // Obtener restaurante_id del usuario
  const [restaurantId, setRestaurantId] = useState(null)

  useEffect(() => {
    fetchRestaurantId()
  }, [])

  useEffect(() => {
    if (restaurantId) {
      fetchOrders()
    }
  }, [restaurantId])

  useEffect(() => {
    filterOrders()
  }, [orders, filter])

  const fetchRestaurantId = async () => {
    try {
      // Asumiendo que el restaurante_id está relacionado con el user_id
      // Puedes ajustar según tu estructura de datos
      const response = await api.get('/api/restaurants')
      const userRestaurant = response.data.restaurants?.find(r => r.user_id === user?.id)
      
      if (userRestaurant) {
        setRestaurantId(userRestaurant.id)
      } else {
        setError('No se encontró restaurante asociado a este usuario')
      }
    } catch (err) {
      console.error('Error fetching restaurant:', err)
      setError('Error al obtener información del restaurante')
    }
  }

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/api/orders/restaurant/${restaurantId}`)
      setOrders(response.data || [])
      setError('')
    } catch (err) {
      console.error('Error fetching orders:', err)
      setError('Error al cargar las órdenes')
    } finally {
      setLoading(false)
    }
  }

  const filterOrders = () => {
    if (filter === 'TODAS') {
      setFilteredOrders(orders)
    } else {
      setFilteredOrders(orders.filter(order => order.estado === filter))
    }
  }

  const handleLogout = () => {
    authService.logout()
    navigate('/login')
  }

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await api.patch(`/api/orders/${orderId}/status`, { status: newStatus })
      fetchOrders()
    } catch (err) {
      console.error('Error updating order:', err)
      alert('Error al actualizar el estado: ' + (err.response?.data?.error || err.message))
    }
  }

  const handleAccept = (orderId) => {
    updateOrderStatus(orderId, 'ACEPTADA')
  }

  const handleReject = (orderId) => {
    updateOrderStatus(orderId, 'RECHAZADA')
  }

  const handleNextStatus = (orderId, currentStatus) => {
    if (currentStatus === 'ACEPTADA') {
      updateOrderStatus(orderId, 'EN_PREPARACION')
    } else if (currentStatus === 'EN_PREPARACION') {
      updateOrderStatus(orderId, 'TERMINADA')
    }
  }

  const openCancelModal = (order) => {
    setSelectedOrder(order)
    setShowCancelModal(true)
    setCancelReason('')
  }

  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) {
      alert('Por favor ingresa un motivo de cancelación')
      return
    }

    try {
      await api.post(`/api/orders/${selectedOrder.id}/cancel`, { motivo: cancelReason })
      setShowCancelModal(false)
      setSelectedOrder(null)
      setCancelReason('')
      fetchOrders()
    } catch (err) {
      console.error('Error canceling order:', err)
      alert('Error al cancelar: ' + (err.response?.data?.error || err.message))
    }
  }

  const getStatusClass = (status) => {
    const statusMap = {
      'CREADA': styles.statusCreada,
      'ACEPTADA': styles.statusAceptada,
      'EN_PREPARACION': styles.statusEnPreparacion,
      'TERMINADA': styles.statusTerminada,
      'RECHAZADA': styles.statusRechazada,
      'CANCELADA': styles.statusCancelada
    }
    return statusMap[status] || ''
  }

  const getNextStatusLabel = (status) => {
    if (status === 'ACEPTADA') return 'Iniciar Preparación'
    if (status === 'EN_PREPARACION') return 'Marcar como Terminada'
    return ''
  }

  return (
    <div className={styles.container}>
      <nav className={styles.nav}>
        <div className={styles.navBrand}>
          <div className={styles.logo}>🍽️</div>
          <div className={styles.logoText}>Panel Restaurante</div>
        </div>
        <div className={styles.navUser}>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{user?.email}</span>
            <span className={styles.userRole}>Restaurante</span>
          </div>
          <button onClick={handleLogout} className={styles.btnLogout}>
            Cerrar Sesión
          </button>
        </div>
      </nav>

      <div className={styles.content}>
        <div className={styles.header}>
          <h1>Órdenes</h1>
          <p>Gestiona las órdenes de tu restaurante</p>
        </div>

        {error && (
          <div className={`${styles.alert} ${styles.alertError}`}>
            {error}
          </div>
        )}

        <div className={styles.filters}>
          {['TODAS', 'CREADA', 'ACEPTADA', 'EN_PREPARACION', 'TERMINADA', 'RECHAZADA', 'CANCELADA'].map(status => (
            <button
              key={status}
              className={`${styles.filterBtn} ${filter === status ? styles.active : ''}`}
              onClick={() => setFilter(status)}
            >
              {status.replace('_', ' ')}
            </button>
          ))}
        </div>

        {loading ? (
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Cargando órdenes...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>📋</div>
            <p>No hay órdenes {filter !== 'TODAS' ? `en estado ${filter}` : ''}</p>
            <small>Las órdenes aparecerán aquí cuando los clientes realicen pedidos</small>
          </div>
        ) : (
          <div className={styles.ordersList}>
            {filteredOrders.map(order => (
              <div key={order.id} className={styles.orderCard}>
                <div className={styles.orderHeader}>
                  <div className={styles.orderInfo}>
                    <h3>Orden #{order.id}</h3>
                    <div className={styles.orderMeta}>
                      Cliente: {order.cliente_nombre}
                    </div>
                  </div>
                  <span className={`${styles.statusBadge} ${getStatusClass(order.estado)}`}>
                    {order.estado.replace('_', ' ')}
                  </span>
                </div>

                <div className={styles.orderDetails}>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Total:</span>
                    <span className={styles.detailValue}>${order.costo_total.toFixed(2)}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Dirección:</span>
                    <span className={styles.detailValue}>{order.direccion_entrega}</span>
                  </div>
                </div>

                <div className={styles.orderActions}>
                  {order.estado === 'CREADA' && (
                    <>
                      <button 
                        className={`${styles.btn} ${styles.btnAccept}`}
                        onClick={() => handleAccept(order.id)}
                      >
                        ✓ Aceptar
                      </button>
                      <button 
                        className={`${styles.btn} ${styles.btnReject}`}
                        onClick={() => handleReject(order.id)}
                      >
                        ✗ Rechazar
                      </button>
                    </>
                  )}

                  {(order.estado === 'ACEPTADA' || order.estado === 'EN_PREPARACION') && (
                    <>
                      <button 
                        className={`${styles.btn} ${styles.btnNext}`}
                        onClick={() => handleNextStatus(order.id, order.estado)}
                      >
                        {getNextStatusLabel(order.estado)}
                      </button>
                      <button 
                        className={`${styles.btn} ${styles.btnCancel}`}
                        onClick={() => openCancelModal(order)}
                      >
                        Cancelar Orden
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Cancelar */}
      {showCancelModal && (
        <div className={styles.modal} onClick={() => setShowCancelModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalHeader}>Cancelar Orden #{selectedOrder?.id}</h3>
            
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Motivo de cancelación *</label>
              <textarea
                className={styles.formInput}
                rows="3"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Ej: Ingredientes no disponibles"
              />
            </div>

            <div className={styles.modalActions}>
              <button 
                className={styles.btnSecondary}
                onClick={() => setShowCancelModal(false)}
              >
                Cerrar
              </button>
              <button 
                className={`${styles.btn} ${styles.btnCancel}`}
                onClick={handleCancelOrder}
              >
                Confirmar Cancelación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RestaurantDashboard