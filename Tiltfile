# Tiltfile for local ArgoCD development with Application Map extension
# This configuration sets up a local ArgoCD environment with a custom extension that visualizes
# application interactions and dependencies. It provides a comprehensive view of the application
# architecture within ArgoCD.

# Kubernetes context configuration
allow_k8s_contexts('argocd-dev')

# -----------------------------------------------------------------------------
# Constants
# -----------------------------------------------------------------------------

EXTENSION_DIST = 'dist/resources/extension-application-map.js/extension-application-map.js'
ARGOCD_VERSION = 'v3.0.6' # Corresponds to Helm Chart 8.1.2

# -----------------------------------------------------------------------------
# Development Setup
# -----------------------------------------------------------------------------

# This resource builds the extension for development and watches for changes.
# It ensures that the extension is rebuilt whenever source files are modified.
# These resources build the extension for development and production.
# They are manually triggered from the Tilt UI.
local_resource(
    'build-extension',
    cmd='pnpm run build:dev',
    auto_init=True,
    trigger_mode=TRIGGER_MODE_MANUAL
)

# This builds a new image named 'argocd-server-with-extension' that includes the UI extension.
# It's configured to live_update, so changes to the extension are synced into the running container
# without needing a full image rebuild and pod restart.
docker_build(
    'argocd-overview-extension/argocd-server',
    '.',
    dockerfile_contents="""
ARG ARGOCD_VERSION
FROM quay.io/argoproj/argocd:${ARGOCD_VERSION}
RUN mkdir -p /tmp/extensions/extension-application-map
COPY --chown=argocd:argocd """ + EXTENSION_DIST + """ /tmp/extensions/extension-application-map/extension-application-map.js
""",
    build_args={'ARGOCD_VERSION': ARGOCD_VERSION},
    live_update=[
        sync(
            EXTENSION_DIST,
            '/tmp/extensions/extension-application-map/extension-application-map.js'
        )
    ]
)

# -----------------------------------------------------------------------------
# ArgoCD Deployment Configuration
# -----------------------------------------------------------------------------
k8s_yaml(kustomize('examples/tilt-setup', flags=['--enable-helm']))

# -----------------------------------------------------------------------------
# Kubernetes Resources Configuration
# -----------------------------------------------------------------------------

# ArgoCD Server configuration
k8s_resource('argocd-server',
    objects=[
        'argocd-server:serviceaccount',
        'argocd-server:role',
        'argocd-server:clusterrole',
        'argocd-server:rolebinding',
        'argocd-server:clusterrolebinding',
        'argocd-cm:configmap',
        'argocd-cmd-params-cm:configmap',
        'argocd-gpg-keys-cm:configmap',
        'argocd-rbac-cm:configmap',
        'argocd-ssh-known-hosts-cm:configmap',
        'argocd-tls-certs-cm:configmap',
        'argocd-secret:secret',
    ],
    port_forwards=['8080:8080'],
)

# Application Controller configuration
k8s_resource('argocd-application-controller',
    objects=[
        'argocd-application-controller:serviceaccount',
        'argocd-application-controller:role',
        'argocd-application-controller:clusterrole',
        'argocd-application-controller:rolebinding',
        'argocd-application-controller:clusterrolebinding',
        'applications.argoproj.io:customresourcedefinition',
        'appprojects.argoproj.io:customresourcedefinition',
    ],
)

# Notifications Controller configuration
k8s_resource('argocd-notifications-controller',
    objects=[
        'argocd-notifications-controller:serviceaccount',
        'argocd-notifications-controller:role',
        'argocd-notifications-controller:clusterrole',
        'argocd-notifications-controller:rolebinding',
        'argocd-notifications-controller:clusterrolebinding',
        'argocd-notifications-cm:configmap',
        'argocd-notifications-secret:secret',
    ],
)

# Redis Secret initialization configuration
k8s_resource('argocd-redis-secret-init',
    objects=[
        'argocd-redis-secret-init:serviceaccount',
        'argocd-redis-secret-init:role',
        'argocd-redis-secret-init:rolebinding',
    ],
)

# Repository Server configuration
k8s_resource('argocd-repo-server',
    objects=[
        'argocd-repo-server:serviceaccount',
        'argocd-repo-server:role',
        'argocd-repo-server:rolebinding',
    ],
)

# ApplicationSet Controller configuration
k8s_resource('argocd-applicationset-controller',
    objects=[
        'argocd-applicationset-controller:serviceaccount',
        'argocd-applicationset-controller:role',
        'argocd-applicationset-controller:rolebinding',
        'applicationsets.argoproj.io:customresourcedefinition',
    ],
)