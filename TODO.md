# ArgoCD Overview Extension Roadmap

## UI Improvements

### Layout & Responsiveness

- [x] Make the map take up the full window height
- [x] Add error handling for network issues (matching ArgoCD's error page style)
- [x] Add empty state message when no applications are present (matching ArgoCD's style)

### Navigation & Controls

- [ ] Add search bar to highlight applications/applicationSets
- [ ] Add application filters on the right side
- [ ] Add top banner showing:
  - Number of applications and applicationSets
  - Number of synchronized/healthy applications
- [x] Add zoom controls (similar to ArgoCD, top left)
- [x] Add minimap (top right)

## Interaction Features

- [ ] Clicking on an edge should:
  - Highlight connected applications/applicationSets
  - Dim other elements
- [ ] Clicking on a node should navigate to the application

## Technical Improvements

- [x] Fix dependency conflicts
- [x] Migrate to pnpm package manager
- [x] Implement real-time map updates (or periodic refresh) -> Use SSE
- [x] Automatic redirection to login when disconnected
- [ ] Update edge only if a new application is added or deleted
- [ ] Group all SSE logic into a single hook that returns the nodes and edges or an error
  - First initialization (application sets + applications)
  - SSE management (add/delete/update)
  - Graph generation
    - If ADD/DELETE, update graph and edges
    - If UPDATE but don't exist, update node and edges
    - If UPDATE and exists, only update the node state
- [ ] Don't use useEffect but use useMemo instead

## Bugs

- [x] When an application is deleted, it's not automatically added back
- [ ] Sometimes, edges disappear
- [ ] When refreshing the page, there's a blank error page while loading
- [ ] When refreshing, there's an error with SSE
- [x] Sometimes, nodes jump except for the last updated ones (I think there's a race condition issue)

## NOTES

- C'est pas si mal d'avoir un cache local et une separation entre app et appSet; quand une app est ajoutée, modifiée ou supprimée, je pense que c'est plus simple de reconstruire le graph en entier.

Retravailler l'archi:

- Application globale
  - Generation du graph dans cette partie
  - ApplicationInfo -> Bandeau d'information comme dans les applications (Nombre d'application healthy/total, nombre sync/total, Warning si on detecte une boucle dans le graph)
  - ApplicationMap -> Carte des applications
    - Application du layout
    - Affichage du graph
      - Application Node -> Noeud affichant les informations de l'application
        - Action possible:
          - Click -> Navigation vers l'application
          - Hover -> Mets en évidence les applications liées
      - Application Edge -> Edge entre les noeuds
        - Action possible:
          - Hover -> Mets en évidence les applications liées

v0 -> Premiere version fonctionnelle
v1 -> Ajout de la partie SSE
v1.1 -> Ajout de la mise en évidence des applications liées
v1.2 -> Ajout des filtres
v1.3 -> Ajout de la recherche

---

- Il faut virer la partie checkAuth car ca ne fonctionne pas quand anonymous a les droits (il faudrait faire un redirect quand c'est une erreur 401)
- Il faudrait optimiser les appels à l'API (les paralléliser) car avec beaucoup d'applications, on a des problèmes de performance (faire un useConcurrentFetch? pour limiter le nombre de requêtes en parallèle)
