variable "project_id" {
  description = "ID del proyecto en GCP"
  default     = "project-26fc9494-b364-4414-ba9"
}

variable "region" {
  description = "Región del cluster"
  default     = "us-central1"
}

variable "zone" {
  description = "Zona del cluster"
  default     = "us-central1-a"
}

variable "cluster_name" {
  description = "Nombre del cluster"
  default     = "tickets-cluster"
}

variable "node_count" {
  description = "Cantidad de nodos"
  default     = 1
}

variable "machine_type" {
  description = "Tipo de máquina"
  default     = "e2-medium"
}