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

# CORS restrito apenas ao Amplify
resource "aws_s3_bucket_cors_configuration" "wedding_site" {
  bucket = aws_s3_bucket.wedding_site.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST"]
    allowed_origins = [
      "https://main.d3imqvfqiv0nsz.amplifyapp.com",
      "https://d3imqvfqiv0nsz.amplifyapp.com"
    ]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

# Política pública simples para GetObject
resource "aws_s3_bucket_policy" "wedding_site" {
  bucket = aws_s3_bucket.wedding_site.id
  depends_on = [aws_s3_bucket_public_access_block.wedding_site]

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.wedding_site.arn}/*"
      }
    ]
  })
}



