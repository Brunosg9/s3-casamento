output "bucket_name" {
  value = aws_s3_bucket.wedding_site.bucket
}

output "cloudfront_domain_name" {
  value = aws_cloudfront_distribution.wedding_cdn.domain_name
}

output "cognito_identity_pool_id" {
  description = "ID do Cognito Identity Pool"
  value       = aws_cognito_identity_pool.wedding_photos.id
}

output "amplify_app_url" {
  value = "https://${aws_amplify_branch.main.branch_name}.${aws_amplify_app.casamento_app.default_domain}"
  description = "URL da aplicação Amplify"
}

output "amplify_app_id" {
  value = aws_amplify_app.casamento_app.id
  description = "ID da aplicação Amplify"
}
