resource "aws_s3_bucket_policy" "allow_public_read" {
  bucket = aws_s3_bucket.wedding_site.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.wedding_site.arn}/*"
      },
      {
        Sid       = "AllowCloudFrontServicePrincipalReadOnly"
        Effect    = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action = [
          "s3:GetObject"
        ]
        Resource = "${aws_s3_bucket.wedding_site.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.wedding_cdn.arn
          }
        }
      }
    ]
  })
}