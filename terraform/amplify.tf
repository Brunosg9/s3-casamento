# Amplify App
resource "aws_amplify_app" "casamento_app" {
  name       = "casamento-fotos-app"
  repository = "https://github.com/Brunosg9/s3-casamento"
  
  # Token de acesso ao GitHub
  access_token = var.github_token

  # Build settings
  build_spec = <<-EOT
    version: 1
    frontend:
      phases:
        preBuild:
          commands: []
        build:
          commands: []
      artifacts:
        baseDirectory: website
        files:
          - '**/*'
      cache:
        paths: []
  EOT

  # Environment variables
  environment_variables = {
    AMPLIFY_DIFF_DEPLOY = "false"
  }

  # Enable auto branch creation
  enable_branch_auto_build = true
  enable_branch_auto_deletion = true

  tags = {
    Name = "Casamento Fotos"
  }
}

# Main branch
resource "aws_amplify_branch" "main" {
  app_id      = aws_amplify_app.casamento_app.id
  branch_name = "main"

  framework = "Web"
  stage     = "PRODUCTION"

  enable_auto_build = true

  tags = {
    Name = "Main Branch"
  }
}

# Update S3 CORS to allow Amplify domain
resource "aws_s3_bucket_cors_configuration" "casamento_cors" {
  bucket = aws_s3_bucket.wedding_site.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST", "DELETE", "HEAD"]
    allowed_origins = [
      "https://${aws_amplify_branch.main.branch_name}.${aws_amplify_app.casamento_app.default_domain}",
      "https://${aws_amplify_app.casamento_app.default_domain}"
    ]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}