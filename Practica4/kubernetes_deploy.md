```bash
# 1. Autenticarse en Google Cloud
gcloud auth login

# 2. Listar proyectos disponibles
gcloud projects list
 
gcloud config set project  ## enduring-guard-457223-c4
                            # Reemplazar por el correcto
 
gcloud services enable container.googleapis.com
gcloud services enable artifactregistry.googleapis.com
gcloud services enable compute.googleapis.com
gcloud services enable storage.googleapis.com
 
gcloud auth configure-docker us-central1-docker.pkg.dev
```


```bash
# Crear repositorio privado para imágenes Docker
gcloud artifacts repositories create deliver-eats-repo \
  --repository-format=docker \
  --location=us-central1 \
  --description="Deliver Eats Docker images"
 
 #Verificacion de creacion
gcloud artifacts repositories list
 
export PROJECT_ID="enduring-guard-457223-c4"
export REGION="us-central1"
export REGISTRY="$REGION-docker.pkg.dev"
```



```bash
# Crear cluster de Kubernetes
gcloud container clusters create deliver-eats-cluster \
  --zone us-central1-a \
  --num-nodes 3 \
  --machine-type n1-standard-2 \
  --enable-ip-alias \
  --addons HorizontalPodAutoscaling,HttpLoadBalancing
 
# En otra terminal:
gcloud container clusters get-credentials deliver-eats-cluster --zone us-central1-a
```


```bash 

# 1. Build y push del Gateway
docker build -f backend/Dockerfile.gateway \
  -t $REGISTRY/$PROJECT_ID/deliver-eats-repo/gateway:latest .
docker push $REGISTRY/$PROJECT_ID/deliver-eats-repo/gateway:latest

# 2. Build y push del Auth Service
docker build -f backend/Dockerfile.auth \
  -t $REGISTRY/$PROJECT_ID/deliver-eats-repo/auth-service:latest .
docker push $REGISTRY/$PROJECT_ID/deliver-eats-repo/auth-service:latest

# 3. Build y push del Catalog Service
docker build -f backend/Dockerfile.catalog \
  -t $REGISTRY/$PROJECT_ID/deliver-eats-repo/catalog-service:latest .
docker push $REGISTRY/$PROJECT_ID/deliver-eats-repo/catalog-service:latest

# 4. Build y push del Order Service
docker build -f backend/Dockerfile.order \
  -t $REGISTRY/$PROJECT_ID/deliver-eats-repo/order-service:latest .
docker push $REGISTRY/$PROJECT_ID/deliver-eats-repo/order-service:latest


# 4. Build y push del Order Service
docker build -f backend/Dockerfile.delivery \
  -t $REGISTRY/$PROJECT_ID/deliver-eats-repo/delivery-service:latest .
docker push $REGISTRY/$PROJECT_ID/deliver-eats-repo/delivery-service:latest



gcloud artifacts docker images list $REGISTRY/$PROJECT_ID/deliver-eats-repo

```

```bash
# 1. Crear namespace
kubectl apply -f kubernetes/01-namespace.yaml

# 2. Crear secrets 
kubectl create secret generic db-credentials \
  --from-literal=MYSQL_HOST="34.61.237.171" \
  --from-literal=MYSQL_PORT="3306" \
  --from-literal=MYSQL_USER="delivereats" \
  --from-literal=MYSQL_PASSWORD="DeliverEats123" \
  --from-literal=MYSQL_DATABASE="auth_db" \
  --from-literal=JWT_SECRET="deliver-eats-secret-key-2026" \
  --from-literal=JWT_EXPIRE="7d" \
  --from-literal=AUTH_SERVICE_PORT="50051" \
  --from-literal=CATALOG_SERVICE_PORT="50052" \
  --from-literal=ORDER_SERVICE_PORT="50053" \
  --from-literal=DELIVERY_SERVICE_PORT="50054" \
  -n deliver-eats

 
# 3. Desplegar todos los servicios
kubectl apply -f kubernetes/05-auth-service.yaml
kubectl apply -f kubernetes/06-catalog-service.yaml
kubectl apply -f kubernetes/07-order-service.yaml
kubectl apply -f kubernetes/08-gateway.yaml
kubectl apply -f kubernetes/09-hpa.yaml
kubectl apply -f kubernetes/10-delivery-service.yaml

# 4. Verificar despliegues
kubectl get deployments -n deliver-eats
kubectl get pods -n deliver-eats

  ```

