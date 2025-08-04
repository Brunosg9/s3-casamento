variable "s3" {
  description = "Configurações do bucket S3"
  type = object({
    bucket_name = string
    region      = string
    tags        = map(string)
  })
  default = {
    bucket_name = ""
    region      = "us-east-1"
    tags        = {}
  }
}

variable "s3_public_access_block" {
  description = "Configurações de acesso público do bucket S3"
  type = object({
    block_public_acls       = bool
    block_public_policy     = bool
    ignore_public_acls      = bool
    restrict_public_buckets = bool
  })
  default = {
    block_public_acls       = false
    block_public_policy     = false
    ignore_public_acls      = false
    restrict_public_buckets = false
  }
}



