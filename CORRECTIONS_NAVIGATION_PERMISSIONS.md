# Corrections Navigation et Permissions

## Problèmes résolus

### 1. ✅ Warning Vue - Événement 'navigate' non déclaré
**Problème** : `Extraneous non-emits event listeners (navigate) were passed to component`
**Solution** : Ajout de l'événement `'navigate'` dans la liste des `defineEmits` du FileExplorer

### 2. ✅ Permissions de fichiers incorrectes
**Problème** : L'utilisateur AIM ne voyait qu'un fichier au lieu de deux malgré les permissions en base
**Solution** : 
- Création de la fonction `check_file_permission()` pour vérifier spécifiquement les permissions sur les fichiers
- Modification de la route `browse_directory` pour utiliser la bonne fonction selon le type (dossier/fichier)
- Amélioration de la logique de fallback (refus par défaut au lieu d'autorisation)

### 3. ✅ Navigation - Bouton retour manquant
**Problème** : Impossible de revenir en arrière après ouverture d'un fichier
**Solution** : 
- Ajout d'un bouton "Retour" visible dans l'interface
- Affichage du chemin actuel
- Le bouton n'apparaît que si on n'est pas à la racine

## Modifications apportées

### Backend (`backend/routes/nas_routes.py`)

#### Nouvelle fonction `check_file_permission()`
```python
def check_file_permission(user, file_path, required_action='read'):
    """Vérifie les permissions d'un utilisateur sur un fichier spécifique"""
    # Vérifications directes sur le fichier
    # Permissions utilisateur + permissions via groupes
    # Fallback vers les permissions du dossier parent
```

#### Amélioration de `check_folder_permission()`
- Changement du fallback : `return False` au lieu de `return required_action == 'read'`
- Plus sécurisé : refus par défaut si aucune permission explicite

#### Amélioration de `browse_directory()`
```python
# Filtrage intelligent selon le type
if item['is_directory']:
    if check_folder_permission(user, item['path'], 'read'):
        accessible_items.append(item)
else:
    if check_file_permission(user, item['path'], 'read'):
        accessible_items.append(item)
```

#### Nouvelles routes de debug
- `/nas/permissions/check` - Vérification des permissions (améliorée)
- `/nas/debug/permissions/<user_id>` - Debug complet des permissions (Admin)

### Frontend (`frontend/src/components/Shared/FileExplorer.vue`)

#### Ajout de l'événement navigate
```javascript
const emit = defineEmits([
  // ... autres événements
  'navigate'  // ✅ Ajouté
])
```

#### Nouveau bouton de navigation
```vue
<!-- Bouton de navigation retour -->
<button
  v-if="currentPath !== '/'"
  @click="handleNavigateBack"
  class="btn btn-sm btn-ghost"
>
  <i class="fas fa-arrow-left mr-2"></i>
  Retour
</button>

<!-- Affichage du chemin actuel -->
<div class="text-sm text-base-content opacity-70 flex-1">
  <i class="fas fa-folder mr-1"></i>
  {{ currentPath === '/' ? 'Racine' : currentPath }}
</div>
```

## Comment tester les corrections

### 1. Test des permissions de fichiers
1. Connectez-vous avec l'utilisateur AIM
2. Naviguez vers le dossier contenant les fichiers
3. Vérifiez que les deux fichiers sont maintenant visibles

### 2. Test de la navigation
1. Naviguez dans un sous-dossier
2. Vérifiez que le bouton "Retour" apparaît
3. Cliquez sur "Retour" pour revenir au dossier parent
4. Vérifiez que le chemin actuel s'affiche correctement

### 3. Test de debug des permissions (Admin)
```bash
# Vérifier les permissions d'un utilisateur
curl -X GET "http://localhost:5001/nas/debug/permissions/USER_ID" \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Vérifier les permissions sur un chemin spécifique
curl -X GET "http://localhost:5001/nas/permissions/check?path=/chemin/fichier.txt" \
  -H "Authorization: Bearer USER_TOKEN"
```

## Avantages des corrections

1. **Sécurité renforcée** : Refus par défaut au lieu d'autorisation
2. **Permissions granulaires** : Distinction fichiers/dossiers
3. **Navigation intuitive** : Bouton retour visible + affichage du chemin
4. **Debug facilité** : Routes de debug pour diagnostiquer les problèmes
5. **Conformité Vue** : Plus de warnings sur les événements

## Logs de debug

Les corrections ajoutent des logs pour faciliter le debug :
```
🔍 Filtrage permissions pour AIM: 10 éléments -> 2 accessibles
```

Ces logs permettent de voir combien d'éléments sont filtrés par les permissions.