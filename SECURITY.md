# Security Policy

## Supported Versions

We provide security updates for the latest release. Older versions are not actively supported.

## Reporting a Vulnerability

Please report any security vulnerabilities responsibly. Do not open a public issue for a security vulnerability.

You can report vulnerabilities using GitHub's built-in [Private Vulnerability Reporting](https://github.com/md-emran-hossain/email-automation-engine/security/advisories/new) feature.

We aim to:

- Acknowledge receipt of your vulnerability report within 48 hours.
- Validate and release a patch or mitigation for any confirmed vulnerability within 30 days of confirmation.
- Provide regular status updates throughout the process.

## AWS Credentials & Keys

This project requires AWS credentials for SQS and SES. **Never commit your AWS keys to the repository**.
Use environment variables (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`), EC2/ECS IAM Instance Profiles, or Lambda Execution Roles.
