output "bucket_name" {
  value = aws_s3_bucket.wedding_site.bucket
}

output "cloudfront_domain_name" {
  value = aws_cloudfront_distribution.wedding_cdn.domain_name
}
