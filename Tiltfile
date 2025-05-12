# Tiltfile for local ArgoCD development with Application Map extension
# This configuration sets up a local ArgoCD environment with a custom extension that visualizes 
# application interactions and dependencies. It provides a comprehensive view of Kubernetes 
# resources and their communication patterns, helping users understand the application 
# architecture within ArgoCD.

# Kubernetes context configuration
allow_k8s_contexts('argocd-dev')

# -----------------------------------------------------------------------------
# Constants
# -----------------------------------------------------------------------------

EXTENSION_DIST = 'dist/resources/extension-application-map.js/extension-application-map.js'

# -----------------------------------------------------------------------------
# ArgoCD Deployment Configuration
# -----------------------------------------------------------------------------

# Create ConfigMap for the extension
load('ext://configmap', 'configmap_create')
configmap_create('argocd-extensions',
    namespace='argocd',
    from_file='extension-application-map.js=' + EXTENSION_DIST,
    watch=True,
)

# Deploy ArgoCD via Helm
load('ext://helm_remote', 'helm_remote')
helm_remote('argo-cd', 
    repo_url='https://argoproj.github.io/argo-helm', 
    release_name='argocd',
    namespace='argocd', 
    version='7.9.1',
    create_namespace=True,
    values=['examples/argocd-dev.helmvalues.yaml'],
    set=["server.podAnnotations.cm-hash=" + str(hash(str(read_file(EXTENSION_DIST))))],
)

# -----------------------------------------------------------------------------
# Kubernetes Resources Configuration
# -----------------------------------------------------------------------------

# ArgoCD Server configuration
k8s_resource('argocd-server',
    objects=[
        'argocd-extensions:configmap',
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

# Redis configuration
k8s_resource('argocd-redis',
    objects=[
        'argocd-redis-health-configmap:configmap',
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

# -----------------------------------------------------------------------------
# Example Application
# -----------------------------------------------------------------------------
k8s_yaml(encode_yaml({
    'apiVersion': 'argoproj.io/v1alpha1',
    'kind': 'Application',
    'metadata': {
        'name': 'guestbook',
        'namespace': 'argocd',
    },
    'spec': {
        'destination': {
            'namespace': 'default',
            'server': 'https://kubernetes.default.svc',
        },
        'project': 'default',
        'source': {
            'path': 'guestbook',
            'repoURL': 'https://github.com/argoproj/argocd-example-apps',
            'targetRevision': 'master',
        },
        'syncPolicy': {
            'automated': {
                'selfHeal': True,
                'prune': True,
            },
        },
    },
}))
