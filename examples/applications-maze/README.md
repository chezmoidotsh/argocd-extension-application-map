# ArgoCD Application Examples

This repository contains practical examples of different application linking patterns in ArgoCD.

## Table of Contents
- [Application Types](#application-types)
- [Relationship Diagram](#relationship-diagram)

## Application Types

The repository demonstrates three main types of applications:

- **Applications**: Individual deployments (e.g., guestbook, blue-green)
- **App of Apps**: Parent applications that manage other applications
- **ApplicationSets**: Dynamically generated collections of applications

> **Note**: ApplicationSets are essentially dynamic App of Apps. While App of Apps requires manual definition of child applications, ApplicationSets can automatically generate applications based on templates and generators.

## Relationship Diagram

The diagram below illustrates the relationships between different applications and their dependencies:

```mermaid
graph LR
    %% Main Applications
    appofapps01((App of Apps 01))
    appofapps02((App of Apps 02))

    %% App of Apps 01 Direct Deployments
    appofapps01 --> guestbook01[guestbook-app-01]
    appofapps01 --> appset01[[appset-01]]
    appofapps01 --> appset02[[appset-02]]

    %% AppSet01 Deployments
    appset01 --> guestbook02[guestbook-app-02]
    appset01 --> guestbook03[guestbook-app-03]
    appset01 --> appofapps02

    %% AppSet02 Deployments
    appset02 --> bluegreen[blue-green]
    appset02 --> guestbook[guestbook]
    appset02 --> helmhooks[helm-hooks]
    appset02 --> jsonnettla[jsonnet-guestbook-tla]
    appset02 --> jsonnet[jsonnet-guestbook]
    appset02 --> kustomize[kustomize-guestbook]
    appset02 --> prepostsync[pre-post-sync]
    appset02 --> sockshop[sock-shop]
    appset02 --> syncwaves[sync-waves]

    %% App of Apps 02 Deployments
    appofapps02 --> appset03[[appset-03]]
    appset03 --> appofapps01
    appset03 --> appofapps02

    %% Style Definitions
    classDef app stroke:#4CAF50,stroke-width:2px,color:#4CAF50
    classDef appset stroke:#F44336,stroke-width:2px,color:#F44336
    classDef appofapps stroke:#2196F3,stroke-width:2px,color:#2196F3

    %% Apply Styles
    class guestbook01,guestbook02,guestbook03,guestbook07,bluegreen,guestbook,helmhooks,jsonnettla,jsonnet,kustomize,prepostsync,sockshop,syncwaves app
    class appset01,appset02,appset03,appset03 appset
    class appofapps01,appofapps02 appofapps
```

The arrows indicate dependency relationships between applications, showing how deployments are orchestrated and how applications are linked together.

> **Note**: These complex dependency patterns are included for testing purposes of the ArgoCD Application Map Extension. While they demonstrate various application linking scenarios, some patterns like the circular dependency of App of Apps 02 should be avoided in production environments. Having multiple parents (App of Apps 01 and AppSet 04) for App of Apps 02 creates a permanent diff state and is considered an anti-pattern in ArgoCD deployments.

### Graph Explanation

The graph above illustrates the relationships between different ArgoCD applications. Here's a detailed explanation:

- `App of Apps 01` deploys:
  - `guestbook-app-01`
  - `appset-01` and `appset-02` (ApplicationSets)

- `appset-01` deploys:
  - `guestbook-app-02` and `guestbook-app-03`
  - `App of Apps 02`

- `appset-02` deploys:
  - `blue-green` (blue-green deployment)
  - `guestbook` (standard guestbook)
  - `helm-hooks` (Helm hooks demo)
  - `jsonnet-guestbook-tla` and `jsonnet-guestbook` (Jsonnet apps)
  - `kustomize-guestbook` (Kustomize app)
  - `pre-post-sync` (sync hooks demo)
  - `sock-shop` (demo app)
  - `sync-waves` (sync waves demo)

- `App of Apps 02` deploys:
  - `appset-03`

- `appset-03` deploys:
  - `App of Apps 01` and `App of Apps 02` (creating a circular dependency)
