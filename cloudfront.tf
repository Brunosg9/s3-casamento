resource "aws_cloudfront_origin_access_control" "oac" {
  name                              = "WeddingSiteOAC"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "wedding_cdn" {
  origin {
    domain_name = aws_s3_bucket.wedding_site.bucket_regional_domain_name
    origin_id   = "s3-origin"

    origin_access_control_id = aws_cloudfront_origin_access_control.oac.id
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "s3-origin"

    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  tags = {
    Name = "Wedding CDN"
  }

  depends_on = [aws_cloudfront_origin_access_control.oac]
}

resource "aws_s3_bucket_policy" "wedding_site_policy" {
  bucket = aws_s3_bucket.wedding_site.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = aws_cloudfront_origin_access_control.oac.iam_arn
        }
        Action = "s3:GetObject"
        Resource = "${aws_s3_bucket.wedding_site.arn}/*"
      }
    ]
  })
}