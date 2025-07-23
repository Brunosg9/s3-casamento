terraform {
    required_providers {
      aws = {
        source  = "hashicorp/aws""
        version = "~> 6.4"
      } 
    }
}

provider "aws" {
    assume_role {
        role_arn    = "arn:aws:iam::005974045893:role/brunosg-adm"
    }
}