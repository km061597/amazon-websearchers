# Archived Production Components

These files have been moved here to keep the demo clean and stable.
They are not needed for the demo but preserved for future production deployment.

## Contents

### `/docker/`
- Docker configurations for production deployment
- docker-compose files for various environments

### `/k8s/`
- Kubernetes deployment manifests
- Redis, PostgreSQL, ingress configurations
- HPA and VPA autoscaling configs

### `/backend/`
- Original scraper implementation (replaced with stub)
- Scraper tests

## Restoring

To restore production capabilities:
1. Move files back to their original locations
2. Update imports as needed
3. Configure environment variables for Redis, Celery, etc.
