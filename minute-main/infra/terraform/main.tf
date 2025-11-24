terraform {
  required_version = ">= 1.7.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = ">= 3.106.0"
    }
  }
}

provider "azurerm" {
  features {}
}

locals {
  allowed_locations = ["uksouth", "ukwest"]
}

variable "prefix" {
  description = "Short prefix for all resources (eg: minute-sc)"
  type        = string
}

variable "location" {
  description = "Azure region; must be UK South or UK West"
  type        = string
  default     = "uksouth"

  validation {
    condition     = contains(local.allowed_locations, lower(var.location))
    error_message = "Deployment is locked to UK South/West to satisfy data residency constraints."
  }
}

variable "environment" {
  description = "Environment name (dev, uat, prod, dev-preview)"
  type        = string
}

variable "tags" {
  description = "Common resource tags"
  type        = map(string)
  default = {
    product = "minute"
  }
}

variable "recording_retention_days" {
  description = "Number of days to retain raw recordings in blob storage"
  type        = number
  default     = 30
}

variable "postgres_sku_name" {
  description = "Flexible server SKU (e.g., GP_Standard_D2s_v3)"
  type        = string
  default     = "GP_Standard_D2s_v3"
}

variable "service_bus_sku" {
  description = "Service Bus SKU"
  type        = string
  default     = "Standard"
}

resource "azurerm_resource_group" "core" {
  name     = "${var.prefix}-rg"
  location = var.location
  tags     = var.tags
}

resource "azurerm_virtual_network" "core" {
  name                = "${var.prefix}-vnet"
  location            = azurerm_resource_group.core.location
  resource_group_name = azurerm_resource_group.core.name
  address_space       = ["10.11.0.0/16"]
  tags                = var.tags
}

resource "azurerm_subnet" "aca" {
  name                 = "${var.prefix}-aca-snet"
  resource_group_name  = azurerm_resource_group.core.name
  virtual_network_name = azurerm_virtual_network.core.name
  address_prefixes     = ["10.11.10.0/24"]
  delegation {
    name = "containerapps"
    service_delegation {
      name = "Microsoft.App/environments"
    }
  }
}

resource "azurerm_subnet" "data" {
  name                 = "${var.prefix}-data-snet"
  resource_group_name  = azurerm_resource_group.core.name
  virtual_network_name = azurerm_virtual_network.core.name
  address_prefixes     = ["10.11.20.0/24"]
  service_endpoints    = ["Microsoft.Storage", "Microsoft.ServiceBus", "Microsoft.AzureCosmosDB"]
}

resource "azurerm_private_dns_zone" "blob" {
  name                = "privatelink.blob.core.windows.net"
  resource_group_name = azurerm_resource_group.core.name
  tags                = var.tags
}

resource "azurerm_private_dns_zone" "servicebus" {
  name                = "privatelink.servicebus.windows.net"
  resource_group_name = azurerm_resource_group.core.name
  tags                = var.tags
}

resource "azurerm_private_dns_zone" "cognitiveservices" {
  name                = "privatelink.cognitiveservices.azure.com"
  resource_group_name = azurerm_resource_group.core.name
  tags                = var.tags
}

resource "azurerm_private_dns_zone_virtual_network_link" "blob" {
  name                  = "${var.prefix}-blob-link"
  resource_group_name   = azurerm_resource_group.core.name
  private_dns_zone_name = azurerm_private_dns_zone.blob.name
  virtual_network_id    = azurerm_virtual_network.core.id
}

resource "azurerm_private_dns_zone_virtual_network_link" "servicebus" {
  name                  = "${var.prefix}-sb-link"
  resource_group_name   = azurerm_resource_group.core.name
  private_dns_zone_name = azurerm_private_dns_zone.servicebus.name
  virtual_network_id    = azurerm_virtual_network.core.id
}

resource "azurerm_private_dns_zone_virtual_network_link" "cognitiveservices" {
  name                  = "${var.prefix}-cog-link"
  resource_group_name   = azurerm_resource_group.core.name
  private_dns_zone_name = azurerm_private_dns_zone.cognitiveservices.name
  virtual_network_id    = azurerm_virtual_network.core.id
}

resource "azurerm_log_analytics_workspace" "core" {
  name                = "${var.prefix}-law"
  location            = azurerm_resource_group.core.location
  resource_group_name = azurerm_resource_group.core.name
  sku                 = "PerGB2018"
  retention_in_days   = 30
  tags                = var.tags
}

resource "azurerm_container_app_environment" "core" {
  name                       = "${var.prefix}-cae"
  location                   = azurerm_resource_group.core.location
  resource_group_name        = azurerm_resource_group.core.name
  log_analytics_workspace_id = azurerm_log_analytics_workspace.core.id
  infrastructure_subnet_id   = azurerm_subnet.aca.id
  internal_load_balancer_enabled = true
  tags                       = var.tags
}

resource "azurerm_storage_account" "data" {
  name                          = replace("${var.prefix}data", "-", "")
  resource_group_name           = azurerm_resource_group.core.name
  location                      = azurerm_resource_group.core.location
  account_tier                  = "Standard"
  account_replication_type      = "ZRS"
  access_tier                   = "Hot"
  allow_nested_items_to_be_public = false
  enable_https_traffic_only     = true
  min_tls_version               = "TLS1_2"
  public_network_access_enabled = false
  tags                          = var.tags
}

resource "azurerm_storage_container" "recordings" {
  name                  = "recordings"
  storage_account_name  = azurerm_storage_account.data.name
  container_access_type = "private"
}

resource "azurerm_storage_container" "exports" {
  name                  = "exports"
  storage_account_name  = azurerm_storage_account.data.name
  container_access_type = "private"
}

resource "azurerm_storage_management_policy" "data" {
  storage_account_id = azurerm_storage_account.data.id

  rule {
    name    = "delete-raw-recordings"
    enabled = true
    filters {
      prefix_match = ["recordings/"]
      blob_types   = ["blockBlob"]
    }
    actions {
      base_blob {
        delete_after_days_since_modification_greater_than = var.recording_retention_days
      }
    }
  }
}

resource "azurerm_private_endpoint" "storage_blob" {
  name                = "${var.prefix}-pe-blob"
  location            = azurerm_resource_group.core.location
  resource_group_name = azurerm_resource_group.core.name
  subnet_id           = azurerm_subnet.data.id

  private_service_connection {
    name                           = "${var.prefix}-psc-blob"
    private_connection_resource_id = azurerm_storage_account.data.id
    subresource_names              = ["blob"]
    is_manual_connection           = false
  }

  private_dns_zone_group {
    name                 = "blob-zone-group"
    private_dns_zone_ids = [azurerm_private_dns_zone.blob.id]
  }

  tags = var.tags
}

resource "azurerm_servicebus_namespace" "core" {
  name                = "${var.prefix}-sb"
  location            = azurerm_resource_group.core.location
  resource_group_name = azurerm_resource_group.core.name
  sku                 = var.service_bus_sku
  minimum_tls_version = "1.2"
  public_network_access_enabled = false
  tags                = var.tags
}

resource "azurerm_servicebus_queue" "transcription" {
  name                = "transcription"
  namespace_id        = azurerm_servicebus_namespace.core.id
  max_delivery_count  = 10
  requires_duplicate_detection = false
}

resource "azurerm_servicebus_queue" "llm" {
  name                = "llm"
  namespace_id        = azurerm_servicebus_namespace.core.id
  max_delivery_count  = 10
  requires_duplicate_detection = false
}

resource "azurerm_private_endpoint" "servicebus" {
  name                = "${var.prefix}-pe-sb"
  location            = azurerm_resource_group.core.location
  resource_group_name = azurerm_resource_group.core.name
  subnet_id           = azurerm_subnet.data.id

  private_service_connection {
    name                           = "${var.prefix}-psc-sb"
    private_connection_resource_id = azurerm_servicebus_namespace.core.id
    subresource_names              = ["namespace"]
    is_manual_connection           = false
  }

  private_dns_zone_group {
    name                 = "sb-zone-group"
    private_dns_zone_ids = [azurerm_private_dns_zone.servicebus.id]
  }

  tags = var.tags
}

resource "azurerm_key_vault" "core" {
  name                        = "${replace(var.prefix, "-", "")}kv"
  resource_group_name         = azurerm_resource_group.core.name
  location                    = azurerm_resource_group.core.location
  tenant_id                   = data.azurerm_client_config.current.tenant_id
  sku_name                    = "standard"
  purge_protection_enabled    = true
  soft_delete_retention_days  = 90
  enable_rbac_authorization   = true
  public_network_access_enabled = false
  tags                        = var.tags
}

data "azurerm_client_config" "current" {}

resource "azurerm_cognitive_account" "openai" {
  name                = "${var.prefix}-openai"
  location            = azurerm_resource_group.core.location
  resource_group_name = azurerm_resource_group.core.name
  kind                = "OpenAI"
  sku_name            = "S0"
  public_network_access_enabled = false
  tags                = var.tags
}

resource "azurerm_cognitive_account" "speech" {
  name                = "${var.prefix}-speech"
  location            = azurerm_resource_group.core.location
  resource_group_name = azurerm_resource_group.core.name
  kind                = "SpeechServices"
  sku_name            = "S0"
  public_network_access_enabled = false
  tags                = var.tags
}

resource "azurerm_private_endpoint" "openai" {
  name                = "${var.prefix}-pe-openai"
  location            = azurerm_resource_group.core.location
  resource_group_name = azurerm_resource_group.core.name
  subnet_id           = azurerm_subnet.data.id

  private_service_connection {
    name                           = "${var.prefix}-psc-openai"
    private_connection_resource_id = azurerm_cognitive_account.openai.id
    subresource_names              = ["account"]
  }

  private_dns_zone_group {
    name                 = "openai-zone-group"
    private_dns_zone_ids = [azurerm_private_dns_zone.cognitiveservices.id]
  }

  tags = var.tags
}

resource "azurerm_private_endpoint" "speech" {
  name                = "${var.prefix}-pe-speech"
  location            = azurerm_resource_group.core.location
  resource_group_name = azurerm_resource_group.core.name
  subnet_id           = azurerm_subnet.data.id

  private_service_connection {
    name                           = "${var.prefix}-psc-speech"
    private_connection_resource_id = azurerm_cognitive_account.speech.id
    subresource_names              = ["account"]
  }

  private_dns_zone_group {
    name                 = "speech-zone-group"
    private_dns_zone_ids = [azurerm_private_dns_zone.cognitiveservices.id]
  }

  tags = var.tags
}

resource "azurerm_postgresql_flexible_server" "core" {
  name                   = "${var.prefix}-pg"
  location               = azurerm_resource_group.core.location
  resource_group_name    = azurerm_resource_group.core.name
  delegated_subnet_id    = azurerm_subnet.data.id
  version                = "15"
  administrator_login    = "miadmin"
  administrator_password = null
  sku_name               = var.postgres_sku_name
  storage_mb             = 65536
  backup_retention_days  = 7
  geo_redundant_backup_enabled = false
  zone                   = "1"
  public_network_access_enabled = false
  authentication {
    active_directory_auth_enabled = true
    password_authentication_enabled = false
  }
  tags = var.tags
}

resource "azurerm_postgresql_flexible_server_firewall_rule" "deny_all" {
  name             = "deny-all-ipv4"
  server_id        = azurerm_postgresql_flexible_server.core.id
  start_ip_address = "0.0.0.0"
  end_ip_address   = "0.0.0.0"
}

resource "azurerm_private_endpoint" "postgres" {
  name                = "${var.prefix}-pe-pg"
  location            = azurerm_resource_group.core.location
  resource_group_name = azurerm_resource_group.core.name
  subnet_id           = azurerm_subnet.data.id

  private_service_connection {
    name                           = "${var.prefix}-psc-pg"
    private_connection_resource_id = azurerm_postgresql_flexible_server.core.id
    subresource_names              = ["postgresqlServer"]
  }

  private_dns_zone_group {
    name                 = "pg-zone-group"
    private_dns_zone_ids = [azurerm_private_dns_zone.postgresql.id]
  }

  tags = var.tags
}

resource "azurerm_private_dns_zone" "postgresql" {
  name                = "privatelink.postgres.database.azure.com"
  resource_group_name = azurerm_resource_group.core.name
}

resource "azurerm_private_dns_zone_virtual_network_link" "postgresql" {
  name                  = "${var.prefix}-pg-link"
  resource_group_name   = azurerm_resource_group.core.name
  private_dns_zone_name = azurerm_private_dns_zone.postgresql.name
  virtual_network_id    = azurerm_virtual_network.core.id
}

output "resource_group" {
  value = azurerm_resource_group.core.name
}

output "container_app_environment_id" {
  value = azurerm_container_app_environment.core.id
}
