---
name: setup-wizard
description: "Comprehensive knowledge for interactive setup and validation of the AWS EKS + Helm + Keycloak + Harness ecosystem."
---

# Setup Wizard Skill

Comprehensive knowledge for interactive setup and validation of the AWS EKS + Helm + Keycloak + Harness ecosystem.

## Skill Overview

This skill provides deep expertise in:
- Multi-platform authentication and connectivity validation
- Interactive wizard flow management
- Configuration generation and repair
- Environment variable management
- Prerequisites detection and installation

## AWS Setup Validation

### Credentials Validation
```bash
# Validate AWS CLI credentials
aws sts get-caller-identity

# Expected output parsing
{
    "UserId": "AIDAXXXXXXXXXXXXXXXXX",
    "Account": "123456789012",
    "Arn": "arn:aws:iam::123456789012:user/developer"
}

# Check required permissions
aws iam simulate-principal-policy \
  --policy-source-arn "$(aws sts get-caller-identity --query Arn --output text)" \
  --action-names \
    eks:DescribeCluster \
    eks:ListClusters \
    ecr:GetAuthorizationToken \
    secretsmanager:GetSecretValue \
    secretsmanager:PutSecretValue
```

### EKS Cluster Discovery
```bash
# List all EKS clusters in region
aws eks list-clusters --region ${AWS_REGION}

# Get cluster details
aws eks describe-cluster --name ${CLUSTER_NAME} --region ${AWS_REGION}

# Validate kubeconfig update
aws eks update-kubeconfig --name ${CLUSTER_NAME} --region ${AWS_REGION}

# Test cluster connectivity
kubectl cluster-info
```

### ECR Validation
```bash
# Get ECR login token
aws ecr get-login-password --region ${AWS_REGION}

# List existing repositories
aws ecr describe-repositories --region ${AWS_REGION}

# Create repository if needed
aws ecr create-repository \
  --repository-name ${SERVICE_NAME} \
  --image-scanning-configuration scanOnPush=true \
  --encryption-configuration encryptionType=AES256
```

### Secrets Manager Validation
```bash
# Test read access
aws secretsmanager get-secret-value --secret-id ${SECRET_PREFIX}test 2>&1

# Test write access (create test secret)
aws secretsmanager create-secret \
  --name "${SECRET_PREFIX}test-connectivity" \
  --secret-string "test" \
  --description "Connectivity test - safe to delete"

# Clean up test secret
aws secretsmanager delete-secret \
  --secret-id "${SECRET_PREFIX}test-connectivity" \
  --force-delete-without-recovery
```

## Harness Setup Validation

### API Connectivity
```bash
# Validate Harness API key
curl -sf -H "x-api-key: ${HARNESS_API_KEY}" \
  "${HARNESS_BASE_URL}/ng/api/user/currentUser?accountIdentifier=${HARNESS_ACCOUNT_ID}" | jq .

# Expected response structure
{
  "status": "SUCCESS",
  "data": {
    "uuid": "xxx",
    "name": "User Name",
    "email": "user@example.com"
  }
}
```

### Organization & Project Validation
```bash
# List organizations
curl -sf -H "x-api-key: ${HARNESS_API_KEY}" \
  "${HARNESS_BASE_URL}/ng/api/organizations?accountIdentifier=${HARNESS_ACCOUNT_ID}" | jq .

# List projects in organization
curl -sf -H "x-api-key: ${HARNESS_API_KEY}" \
  "${HARNESS_BASE_URL}/ng/api/projects?accountIdentifier=${HARNESS_ACCOUNT_ID}&orgIdentifier=${HARNESS_ORG_ID}" | jq .

# Validate project access
curl -sf -H "x-api-key: ${HARNESS_API_KEY}" \
  "${HARNESS_BASE_URL}/ng/api/projects/${HARNESS_PROJECT_ID}?accountIdentifier=${HARNESS_ACCOUNT_ID}&orgIdentifier=${HARNESS_ORG_ID}" | jq .
```

### Connector Validation
```bash
# List existing connectors
curl -sf -H "x-api-key: ${HARNESS_API_KEY}" \
  "${HARNESS_BASE_URL}/ng/api/connectors?accountIdentifier=${HARNESS_ACCOUNT_ID}&orgIdentifier=${HARNESS_ORG_ID}&projectIdentifier=${HARNESS_PROJECT_ID}" | jq .

# Test connector connectivity
curl -sf -X POST -H "x-api-key: ${HARNESS_API_KEY}" \
  -H "Content-Type: application/json" \
  "${HARNESS_BASE_URL}/ng/api/connectors/testConnection/${CONNECTOR_ID}?accountIdentifier=${HARNESS_ACCOUNT_ID}&orgIdentifier=${HARNESS_ORG_ID}&projectIdentifier=${HARNESS_PROJECT_ID}"
```

### Delegate Health Check
```bash
# List delegates
curl -sf -H "x-api-key: ${HARNESS_API_KEY}" \
  "${HARNESS_BASE_URL}/ng/api/delegate-setup/listDelegates?accountId=${HARNESS_ACCOUNT_ID}&orgId=${HARNESS_ORG_ID}&projectId=${HARNESS_PROJECT_ID}" | jq .

# Check delegate status
# Status should be "ENABLED" and lastHeartbeat within last 5 minutes
```

### Creating AWS Connector
```yaml
connector:
  name: aws_connector
  identifier: aws_connector
  type: Aws
  spec:
    credential:
      type: Irsa  # For IRSA-based auth
      spec:
        delegateSelector: eks-delegate
    executeOnDelegate: true
    proxy: false
```

### Creating EKS Connector
```yaml
connector:
  name: eks_dev_connector
  identifier: eks_dev_connector
  type: K8sCluster
  spec:
    credential:
      type: InheritFromDelegate
      spec:
        delegateSelectors:
          - eks-delegate-dev
```

## Keycloak Setup Validation

### Server Connectivity
```bash
# Check Keycloak is reachable
curl -sf "${KEYCLOAK_URL}/realms/master/.well-known/openid-configuration" | jq .

# Get server info (requires admin)
curl -sf "${KEYCLOAK_URL}/admin/serverinfo" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}"
```

### Admin Token Retrieval
```bash
# Get admin access token
curl -sf -X POST "${KEYCLOAK_URL}/realms/master/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password" \
  -d "client_id=admin-cli" \
  -d "username=${KEYCLOAK_ADMIN}" \
  -d "password=${KEYCLOAK_ADMIN_PASSWORD}" | jq -r '.access_token'
```

### Realm Operations
```bash
# List realms
curl -sf "${KEYCLOAK_URL}/admin/realms" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" | jq '.[].realm'

# Create realm
curl -sf -X POST "${KEYCLOAK_URL}/admin/realms" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "realm": "production",
    "enabled": true,
    "sslRequired": "external",
    "registrationAllowed": false,
    "loginWithEmailAllowed": true,
    "duplicateEmailsAllowed": false,
    "resetPasswordAllowed": true,
    "bruteForceProtected": true
  }'

# Get realm configuration
curl -sf "${KEYCLOAK_URL}/admin/realms/${REALM}" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" | jq .
```

### Client Management
```bash
# List clients in realm
curl -sf "${KEYCLOAK_URL}/admin/realms/${REALM}/clients" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" | jq '.[].clientId'

# Create OIDC client
curl -sf -X POST "${KEYCLOAK_URL}/admin/realms/${REALM}/clients" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "my-service-client",
    "enabled": true,
    "protocol": "openid-connect",
    "publicClient": false,
    "standardFlowEnabled": true,
    "directAccessGrantsEnabled": true,
    "serviceAccountsEnabled": true,
    "authorizationServicesEnabled": false,
    "attributes": {
      "pkce.code.challenge.method": "S256"
    },
    "redirectUris": ["*"],
    "webOrigins": ["*"]
  }'

# Get client secret
CLIENT_UUID=$(curl -sf "${KEYCLOAK_URL}/admin/realms/${REALM}/clients?clientId=${CLIENT_ID}" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" | jq -r '.[0].id')

curl -sf "${KEYCLOAK_URL}/admin/realms/${REALM}/clients/${CLIENT_UUID}/client-secret" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" | jq -r '.value'
```

### Test User Creation
```bash
# Create test user
curl -sf -X POST "${KEYCLOAK_URL}/admin/realms/${REALM}/users" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "enabled": true,
    "emailVerified": true,
    "email": "testuser@example.com",
    "credentials": [{
      "type": "password",
      "value": "testpass",
      "temporary": false
    }]
  }'

# Assign role to user
USER_ID=$(curl -sf "${KEYCLOAK_URL}/admin/realms/${REALM}/users?username=testuser" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" | jq -r '.[0].id')

ROLE_ID=$(curl -sf "${KEYCLOAK_URL}/admin/realms/${REALM}/roles/${ROLE_NAME}" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" | jq -r '.id')

curl -sf -X POST "${KEYCLOAK_URL}/admin/realms/${REALM}/users/${USER_ID}/role-mappings/realm" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "[{\"id\": \"${ROLE_ID}\", \"name\": \"${ROLE_NAME}\"}]"
```

## Local Development Validation

### Prerequisites Check
```bash
# Check Docker
docker --version && docker info > /dev/null 2>&1

# Check kubectl
kubectl version --client

# Check Helm
helm version

# Check AWS CLI
aws --version

# Check Kind
kind --version

# Check Skaffold
skaffold version
```

### Tool Installation
```bash
# Install Kind (macOS/Linux)
curl -Lo ./kind https://kind.sigs.k8s.io/dl/v0.20.0/kind-$(uname)-amd64
chmod +x ./kind
sudo mv ./kind /usr/local/bin/kind

# Install Skaffold
curl -Lo skaffold https://storage.googleapis.com/skaffold/releases/latest/skaffold-$(uname)-amd64
chmod +x skaffold
sudo mv skaffold /usr/local/bin/

# Install yq
sudo wget -qO /usr/local/bin/yq https://github.com/mikefarah/yq/releases/latest/download/yq_$(uname)_amd64
sudo chmod +x /usr/local/bin/yq
```

### Local Stack Validation
```bash
# Check Kind cluster
kind get clusters

# Check LocalStack
curl -sf http://localhost:4566/_localstack/health | jq .

# Check local Keycloak
curl -sf http://localhost:8080/realms/master/.well-known/openid-configuration

# Check local registry
curl -sf http://localhost:5000/v2/_catalog
```

## Configuration Generation

### Project Configuration File
```yaml
# .claude/eks-helm-keycloak.local.yaml
plugin:
  name: aws-eks-helm-keycloak
  version: "1.0.0"
  setupCompleted: true
  setupDate: "2024-01-15T10:30:00Z"

aws:
  region: us-west-2
  accountId: "123456789012"
  secretsPrefix: "my-app/"
  clusters:
    development: my-app-dev
    staging: my-app-staging
    production: my-app-prod

harness:
  accountId: "xxx"
  orgId: default
  projectId: eks-deployments
  codeRepo: my-app
  connectors:
    - aws_connector
    - eks_dev_connector
    - eks_staging_connector
    - eks_prod_connector
    - ecr_connector

keycloak:
  url: "https://keycloak.example.com"
  realms:
    development: development
    staging: staging
    production: production
  clientPattern: "{service}-client"

localDev:
  configured: true
  ports:
    app: 3000
    keycloak: 8080
    localstack: 4566
    registry: 5000
```

### Environment File Generation
```bash
# .env.eks-setup
# AWS Configuration
AWS_REGION=us-west-2
AWS_ACCOUNT_ID=123456789012
EKS_CLUSTER_DEV=my-app-dev
EKS_CLUSTER_STAGING=my-app-staging
EKS_CLUSTER_PROD=my-app-prod

# Harness Configuration
HARNESS_ACCOUNT_ID=xxx
HARNESS_ORG_ID=default
HARNESS_PROJECT_ID=eks-deployments
# HARNESS_API_KEY stored in secrets manager

# Keycloak Configuration
KEYCLOAK_URL=https://keycloak.example.com
KEYCLOAK_REALM_DEV=development
KEYCLOAK_REALM_STAGING=staging
KEYCLOAK_REALM_PROD=production
# KEYCLOAK_ADMIN_PASSWORD stored in secrets manager

# Local Development
LOCAL_KEYCLOAK_PORT=8080
LOCAL_LOCALSTACK_PORT=4566
LOCAL_REGISTRY_PORT=5000
```

## Repair Mode Logic

### Issue Detection
```bash
# Check AWS connectivity issues
aws_status() {
  aws sts get-caller-identity > /dev/null 2>&1 && echo "ok" || echo "failed"
}

# Check Harness connectivity
harness_status() {
  curl -sf -H "x-api-key: ${HARNESS_API_KEY}" \
    "${HARNESS_BASE_URL}/ng/api/user/currentUser?accountIdentifier=${HARNESS_ACCOUNT_ID}" \
    > /dev/null 2>&1 && echo "ok" || echo "failed"
}

# Check Keycloak connectivity
keycloak_status() {
  curl -sf "${KEYCLOAK_URL}/realms/master/.well-known/openid-configuration" \
    > /dev/null 2>&1 && echo "ok" || echo "failed"
}
```

### Common Repair Actions
| Issue | Detection | Repair Action |
|-------|-----------|---------------|
| Expired AWS credentials | `aws sts get-caller-identity` fails | Re-authenticate with SSO or refresh tokens |
| Invalid Harness API key | 401 from Harness API | Generate new API key in Harness UI |
| Keycloak unreachable | Connection timeout | Check URL, verify network, check TLS |
| Delegate offline | Missing heartbeat | Check delegate pod, restart if needed |
| Invalid kubeconfig | kubectl fails | Run `aws eks update-kubeconfig` |
| Missing connector | Connector not found | Auto-create connector |

## Validation Mode Output

### Health Report Format
```
╔══════════════════════════════════════════════════════════════╗
║                    ECOSYSTEM HEALTH REPORT                    ║
╠══════════════════════════════════════════════════════════════╣
║                                                                ║
║  AWS                                        Status: ✅ Healthy ║
║  ├── Credentials                           ✅ Valid           ║
║  ├── EKS Clusters (3)                      ✅ Accessible      ║
║  ├── ECR Registry                          ✅ Connected       ║
║  └── Secrets Manager                       ✅ Accessible      ║
║                                                                ║
║  Harness                                    Status: ⚠️ Warning ║
║  ├── API Connection                        ✅ Connected       ║
║  ├── Project Access                        ✅ Authorized      ║
║  ├── Connectors (4/5)                      ⚠️ 1 Invalid       ║
║  └── Delegates (3)                         ✅ Healthy         ║
║                                                                ║
║  Keycloak                                   Status: ✅ Healthy ║
║  ├── Server                                ✅ Reachable       ║
║  ├── Admin Access                          ✅ Valid           ║
║  └── Realms (3)                            ✅ Configured      ║
║                                                                ║
║  Local Development                          Status: ⚠️ Warning ║
║  ├── Docker                                ✅ Running         ║
║  ├── Tools                                 ⚠️ Kind missing    ║
║  └── Configuration                         ✅ Present         ║
║                                                                ║
╠══════════════════════════════════════════════════════════════╣
║  Overall: ⚠️ WARNINGS FOUND                                   ║
║                                                                ║
║  Recommended Actions:                                          ║
║  1. Fix invalid connector: eks_staging_connector               ║
║  2. Install missing tool: kind                                 ║
║                                                                ║
║  Run: /eks:setup --mode=repair                                 ║
╚══════════════════════════════════════════════════════════════╝
```

## Interactive Flow Helpers

### Progress Display
```
Setup Progress:
  ● AWS Configuration        ← Current
  ○ Harness Platform
  ○ Keycloak Authentication
  ○ Local Development
  ○ Final Validation

[▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░] 20% Complete
```

### Input Validation Patterns
```javascript
// AWS Account ID
const awsAccountPattern = /^\d{12}$/;

// AWS Region
const awsRegionPattern = /^[a-z]{2}-[a-z]+-\d$/;

// Harness Account ID
const harnessAccountPattern = /^[a-zA-Z0-9_-]+$/;

// URL validation
const urlPattern = /^https?:\/\/[^\s/$.?#].[^\s]*$/;

// Realm name
const realmPattern = /^[a-z0-9-]+$/;
```

### Error Recovery
- Graceful handling of network failures
- Retry with exponential backoff for transient errors
- Clear error messages with suggested fixes
- Option to skip and continue with partial setup
- Save progress for resume after failures
