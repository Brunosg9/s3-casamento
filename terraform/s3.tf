resource "aws_s3_bucket" "wedding_site" {
  bucket = var.s3.bucket_name

  tags = merge(
    {
      Name = "Wedding Site S3"
    },
    var.s3.tags
  )
}

resource "aws_s3_bucket_public_access_block" "wedding_site" {
  bucket = aws_s3_bucket.wedding_site.id

  block_public_acls       = var.s3_public_access_block.block_public_acls
  block_public_policy     = var.s3_public_access_block.block_public_policy
  ignore_public_acls      = var.s3_public_access_block.ignore_public_acls
  restrict_public_buckets = var.s3_public_access_block.restrict_public_buckets
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