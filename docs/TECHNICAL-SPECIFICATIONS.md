# ArgoCD Application Map Extension - Technical Specifications

> [!NOTE]
> This document is specifically optimized for AI consumption and processing.
> It follows a structured format with clear hierarchies, explicit relationships,
> and comprehensive context to facilitate better understanding and implementation
> by AI systems. The content is organized to maximize semantic understanding
> while maintaining technical accuracy and completeness.

## Overview
This ArgoCD UI extension provides a comprehensive hierarchical view of Applications and ApplicationSets, visualizing their relationships and health status. The Application Map extension seamlessly integrates with ArgoCD's native UI, maintaining visual consistency while offering enhanced visualization capabilities for complex deployment hierarchies.

## Context and References
- [ArgoCD Documentation](https://argo-cd.readthedocs.io/en/stable/)
- [ArgoCD UI Extensions](https://argo-cd.readthedocs.io/en/stable/developer-guide/extensions/ui-extensions/)
- [ArgoCD API Documentation](https://argo-cd.readthedocs.io/en/stable/operator-manual/architecture/)
- [ArgoCD RBAC Documentation](https://argo-cd.readthedocs.io/en/stable/operator-manual/rbac/)
- [Material-UI Documentation](https://mui.com/material-ui/getting-started/overview/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

## Core Concepts
1. **Extension Architecture**
   - System Level Extension for global access
   - Integration with ArgoCD's extension API
   - React-based component system
   - Type-safe development with TypeScript

2. **Data Model**
   - Applications and ApplicationSets hierarchy
   - Resource relationships and dependencies
   - Health and sync status tracking
   - Project and cluster organization

3. **UI Components**
   - Native ArgoCD design system integration
   - Custom visualization components
   - Interactive navigation system
   - Real-time status updates

## Technical Architecture

### Extension Type
- **Type**: System Level Extension
- **Reason**: The extension requires system-level access to retrieve and display information about all Applications and ApplicationSets across different projects and clusters.
- **Implementation Details**: 
  - Integration with [ArgoCD's extension API](https://argo-cd.readthedocs.io/en/stable/developer-guide/extensions/ui-extensions/)
  - Implementation of appropriate [RBAC permissions](https://argo-cd.readthedocs.io/en/stable/operator-manual/rbac/)
  - Seamless integration with ArgoCD's authentication system

### Core Features
1. **Hierarchical View**
   - Tree-based visualization of Applications and ApplicationSets
   - Clear representation of parent-child relationships
   - Complete visualization of deployment chains from top-level resources to leaf applications
   - Implementation using ArgoCD's native visualization components

2. **Grouping Capabilities**
   - Logical grouping of applications by:
     - Cluster
     - Project
   - Visual grouping using ArgoCD-style dotted-line containers
   - Static (non-collapsible) groups for optimal visibility

3. **Status Visualization**
   - Native ArgoCD sync status indicators
   - Health status indicators matching ArgoCD's design system
   - Consistent color scheme and iconography with ArgoCD

4. **Navigation**
   - Single-click: Visual highlighting of parent hierarchy
   - Double-click: Direct navigation to application details
   - Integration with ArgoCD's native routing system

5. **Filtering**
   - Sidebar filters matching ArgoCD's native implementation:
     - Project
     - Cluster
     - Health status (filter only)
     - Sync status (filter only)
     - Custom labels
   - Real-time filtering with debounced updates
   - Persistent filter state management

### Technical Stack
1. **Frontend**
   - React with TypeScript for type safety and enhanced developer experience
   - ArgoCD UI Extension SDK for seamless integration
   - Material-UI for consistent styling with ArgoCD
   - Native ArgoCD components for visualization and state management

2. **Data Management**
   - Direct integration with ArgoCD's services
   - Utilization of ArgoCD's caching system
   - Real-time updates through ArgoCD's event system

### Design Specifications

#### Visual Elements
1. **Icons and Indicators**
   - Native ArgoCD application icon
   - Native ArgoCD ApplicationSet icon
   - Native ArgoCD cluster icon
   - Native ArgoCD project icon
   - Status indicators matching ArgoCD's native implementation

2. **Grouping Containers**
   - Dotted-line borders matching ArgoCD's style
   - Light background color from ArgoCD's color palette
   - Header with group name and count
   - Consistent spacing and padding with ArgoCD's design system

#### Layout
1. **Main View**
   - Left sidebar with filters (width: 250px)
   - Main content area with hierarchical view
   - Responsive design supporting various screen sizes
   - Consistent grid system with ArgoCD

2. **Node Design**
   - Card-like appearance matching ArgoCD's style
   - Right-aligned status indicators
   - Clear resource name and type display
   - Native ArgoCD hover effects

### API Integration
1. **ArgoCD Extension API Integration**
   ```typescript
   // Extension registration
   ((window) => {
     const component = (props: { application: Application, tree: ApplicationTree }) => {
       // Use React from global scope
       const { React } = window;
       
       return React.createElement(
         "div",
         { style: { padding: "10px" } },
         "Hello World"
       );
     };

     // Register as a System Level Extension
     window.extensionsAPI.registerSystemLevelExtension(
       component,
       "Application Map",
       "/map",
       "fa-sitemap"
     );
   })(window);
   ```

2. **Data Access**
   ```typescript
   // Access to ArgoCD data through props
   const component = (props: { application: Application, tree: ApplicationTree }) => {
     const { application, tree } = props;
     
     // Access application data
     const appName = application.metadata.name;
     const appStatus = application.status;
     
     // Access resource tree
     const resources = tree.nodes;
     
     return React.createElement(
       "div",
       null,
       `Application: ${appName}`
     );
   };
   ```

3. **Integration Benefits**
   - Direct access to ArgoCD's UI components
   - Automatic RBAC enforcement
   - Consistent data structure
   - Built-in error handling
   - Seamless integration with ArgoCD's UI

4. **Data Management**
   - Automatic data synchronization
   - Real-time updates through ArgoCD's event system
   - Built-in caching
   - Automatic retry mechanism

### Performance Considerations
1. **Data Loading**
   - Lazy loading of resource details
   - Pagination for large resource sets (page size: 50)
   - Caching of frequently accessed data (TTL: 5 minutes)
   - Background prefetching of related resources

2. **Rendering**
   - Virtual scrolling for large lists
   - Optimized rendering using ArgoCD's native components
   - Debounced filter updates (300ms)
   - Memoization of expensive computations

### Security
1. **Access Control**
   - Strict adherence to ArgoCD RBAC
   - Resource filtering based on user permissions
   - Secure communication with ArgoCD services
   - Input validation and sanitization

### Development Environment Setup
> [!IMPORTANT]
> Before starting development, ensure you have a local development environment with:
> - [Kind](https://kind.sigs.k8s.io/docs/user/quick-start/) or [k3d](https://k3d.io/v5.4.6/) for local Kubernetes cluster
> - [Tilt](https://docs.tilt.dev/install.html) for development workflow
> - [ArgoCD](https://argo-cd.readthedocs.io/en/stable/getting_started/) installed on the cluster
> 
> These tools are essential for testing the extension in a realistic environment.

### Development Workflow

#### Phase 1: Setup and Foundation
1. **Environment Setup**
   - [ArgoCD development environment](https://argo-cd.readthedocs.io/en/stable/getting_started/)
   - Extension development environment configuration
   - Testing environment setup
   - CI/CD pipeline implementation

2. **Basic Structure**
   - Project initialization
   - Dependency management
   - Basic routing implementation
   - Extension registration

#### Phase 2: Core Features
1. **API Integration**
   - Service integration implementation
   - Data fetching and caching
   - Error handling
   - Loading state management

2. **Basic Visualization**
   - Hierarchical view implementation
   - Node rendering
   - Basic interaction handling
   - Status indicator integration

#### Phase 3: Advanced Features
1. **Filtering System**
   - Filter implementation
   - Real-time update handling
   - State persistence
   - Performance optimization

2. **Navigation**
   - Click handler implementation
   - Route integration
   - Parent hierarchy visualization
   - State management

#### Phase 4: Polish and Optimization
1. **Performance**
   - Rendering optimization
   - Data loading optimization
   - Memory management
   - Bundle size optimization

2. **UI/UX**
   - Design system integration
   - Responsive design implementation
   - Accessibility compliance
   - Error state handling

#### Phase 5: Testing and Documentation
1. **Testing**
   - Unit test implementation
   - Integration testing
   - End-to-end testing
   - Performance testing

2. **Documentation**
   - User documentation
   - Developer documentation
   - API documentation
   - Contribution guidelines
