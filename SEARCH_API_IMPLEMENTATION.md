# Implémentation de l'API de recherche récursive

## Endpoint requis côté serveur

L'interface frontend attend un endpoint `/nas/search` avec les paramètres suivants :

### Paramètres de requête

- `query` (string, requis) : Terme de recherche
- `path` (string, défaut: '/') : Chemin de base pour la recherche
- `recursive` (boolean, défaut: true) : Recherche récursive dans les sous-dossiers
- `include_files` (boolean, défaut: true) : Inclure les fichiers dans les résultats
- `include_folders` (boolean, défaut: true) : Inclure les dossiers dans les résultats
- `case_sensitive` (boolean, défaut: false) : Recherche sensible à la casse
- `max_results` (number, défaut: 100) : Nombre maximum de résultats

### Exemple de requête

```
GET /nas/search?query=document&path=/Navigation%20Aérienne&recursive=true&max_results=50
```

### Format de réponse attendu

```json
{
  "success": true,
  "results": [
    {
      "name": "Document1.pdf",
      "path": "/Navigation Aérienne/Contrôle/TWR/Document1.pdf",
      "is_directory": false,
      "size": 1024000,
      "modified_time": "2024-01-15T10:30:00Z",
      "file_type": "pdf",
      "relative_path": "Contrôle/TWR/Document1.pdf"
    },
    {
      "name": "Documentation",
      "path": "/Navigation Aérienne/Contrôle/TWR/Documentation",
      "is_directory": true,
      "size": null,
      "modified_time": "2024-01-10T14:20:00Z",
      "file_type": null,
      "relative_path": "Contrôle/TWR/Documentation"
    }
  ],
  "total_found": 2,
  "search_time_ms": 45,
  "truncated": false
}
```

### Format d'erreur

```json
{
  "success": false,
  "error": "Permission denied for path: /restricted/folder",
  "code": "PERMISSION_DENIED"
}
```

## Fonctionnalités côté frontend

### Interface utilisateur

- ✅ Barre de recherche avec placeholder dynamique
- ✅ Toggle pour activer/désactiver la recherche récursive
- ✅ Indicateur de recherche en cours
- ✅ Affichage des résultats avec compteur
- ✅ Bouton pour effacer la recherche
- ✅ Fallback vers recherche locale si l'API échoue

### Comportement

- **Recherche locale** : Filtre uniquement les fichiers du dossier actuel
- **Recherche récursive** : Utilise l'API pour chercher dans tous les sous-dossiers
- **Debounce** : 500ms de délai pour éviter trop d'appels API
- **Fallback** : Si l'API échoue, bascule automatiquement vers la recherche locale
- **Performance** : Limite à 200 résultats par défaut

### États de l'interface

1. **Pas de recherche** : Affichage normal des fichiers du dossier
2. **Recherche en cours** : Spinner et message "Recherche en cours..."
3. **Résultats trouvés** : Bannière avec nombre de résultats et option d'effacement
4. **Aucun résultat** : Liste vide (géré par les composants de vue)
5. **Erreur API** : Fallback automatique vers recherche locale

## Implémentation recommandée côté serveur

### Considérations de performance

- Utiliser des index de recherche si possible
- Limiter la profondeur de récursion
- Implémenter une pagination pour de gros résultats
- Cache des résultats fréquents
- Timeout pour éviter les recherches trop longues

### Sécurité

- Vérifier les permissions pour chaque fichier/dossier trouvé
- Filtrer les résultats selon les droits de l'utilisateur
- Valider et nettoyer les paramètres de recherche
- Limiter le taux de requêtes par utilisateur

### Exemple d'implémentation Python/Flask

```python
@app.route('/nas/search')
@require_auth
def search_files():
    query = request.args.get('query', '').strip()
    base_path = request.args.get('path', '/')
    recursive = request.args.get('recursive', 'true').lower() == 'true'
    max_results = min(int(request.args.get('max_results', 100)), 500)
    
    if not query:
        return jsonify({'success': False, 'error': 'Query parameter required'})
    
    try:
        results = perform_search(
            query=query,
            base_path=base_path,
            recursive=recursive,
            user=current_user,
            max_results=max_results
        )
        
        return jsonify({
            'success': True,
            'results': results,
            'total_found': len(results),
            'truncated': len(results) >= max_results
        })
        
    except PermissionError as e:
        return jsonify({
            'success': False,
            'error': f'Permission denied: {str(e)}',
            'code': 'PERMISSION_DENIED'
        }), 403
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Search error: {str(e)}',
            'code': 'SEARCH_ERROR'
        }), 500
```