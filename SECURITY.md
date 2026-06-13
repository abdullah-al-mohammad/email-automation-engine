# Security Policy

## Supported Versions

The following versions of the Email Automation Engine are currently being supported with security updates.

| Version | Supported          |
| ------- | ------------------ |
| v0.1.x  | :white_check_mark: |

## Reporting a Vulnerability

Please report any security vulnerabilities responsibly. You can contact the core maintainers privately. Do not open a public issue for a security vulnerability.

We will try to acknowledge receipt of your vulnerability report within 48 hours and provide regular updates.

## AWS Credentials & Keys

This project requires AWS credentials for SQS and SES. **Never commit your AWS keys to the repository**.
Use environment variables (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`), EC2/ECS IAM Instance Profiles, or Lambda Execution Roles.
