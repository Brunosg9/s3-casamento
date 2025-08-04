resource "aws_cognito_identity_pool" "wedding_photos" {
  identity_pool_name               = "wedding_photos_pool"
  allow_unauthenticated_identities = true
}

resource "aws_cognito_identity_pool_roles_attachment" "wedding_photos" {
  identity_pool_id = aws_cognito_identity_pool.wedding_photos.id

  roles = {
    "unauthenticated" = aws_iam_role.cognito_unauthenticated.arn
  }
}

resource "aws_iam_role" "cognito_unauthenticated" {
  name = "cognito_unauthenticated_role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRoleWithWebIdentity"
        Effect = "Allow"
        Principal = {
          Federated = "cognito-identity.amazonaws.com"
        }
        Condition = {
          StringEquals = {
            "cognito-identity.amazonaws.com:aud" = aws_cognito_identity_pool.wedding_photos.id
          }
          "ForAnyValue:StringLike" = {
            "cognito-identity.amazonaws.com:amr" = "unauthenticated"
          }
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "cognito_unauthenticated_policy" {
  name = "cognito_unauthenticated_policy"
  role = aws_iam_role.cognito_unauthenticated.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject"
        ]
        Resource = "${aws_s3_bucket.wedding_site.arn}/photos/*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.wedding_site.arn
        Condition = {
          StringLike = {
            "s3:prefix" = "photos/*"
          }
        }
      }
    ]
  })
}