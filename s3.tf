resource "aws_s3_bucket" "wedding_site" {
  bucket = "fotos-casamento-bruno-vanessa"

  tags = {
    Name = "Wedding Site S3"
  }
}

resource "aws_s3_bucket_public_access_block" "wedding_site" {
  bucket = aws_s3_bucket.wedding_site.id

  block_public_acls       = true
  block_public_policy     = false
  ignore_public_acls      = true
  restrict_public_buckets = false
}

resource "aws_s3_bucket_website_configuration" "wedding_site" {
  bucket = aws_s3_bucket.wedding_site.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "error.html"
  }

    cors_rule {
        allowed_headers = ["*"]
        allowed_methods = ["GET", "PUT", "POST"]
        allowed_origins = ["*"]
        expose_headers  = ["ETag"]
    }
}