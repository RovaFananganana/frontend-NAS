# Guide d'utilisation - Édition de fichiers

## Vue d'ensemble

Le système d'édition de fichiers permet aux utilisateurs d'ouvrir, modifier et sauvegarder des fichiers directement depuis le navigateur, sans avoir à les télécharger. Les modifications sont automatiquement synchronisées avec le NAS.

## Architecture

### Backend
- **FileSessionService** - Gère les sessions de cache côté serveur
- **FileLock** - Système de verrouillage pour éviter les conflits d'édition
- **API Routes** - Endpoints REST pour gérer les sessions

### Frontend
- **fileSessionAPI** - Client API pour communiquer avec le backend
- **useFileSession** - Composable Vue pour gérer les sessions
- **FileSessionManager** - Composant pour gérer l'état de session
- **SimpleTextEditor** - Exemple d'éditeur de texte

## Utilisation

### 1. Utiliser le composable useFileSession

```vue
<script setup>
import { useFileSession } from '@/composables/useFileSession'

const {
  sessionId,
  sessionInfo,
  isLoading,
  isSyncing,
  hasUnsavedChanges,
  openFile,
  updateContent,
  syncToNas,
  closeSession,
  saveFile
} = useFileSession()

// Ouvrir un fichier
const handleOpen = async () => {
  const result = await openFile('/path/to/file.txt', 'edit')
  if (result.success) {
    console.log('Fichier ouvert:', result.sessionId)
  }
}

// Sauvegarder les modifications
const handleSave = async (content) => {
  const success = await saveFile(content)
  if (success) {
    console.log('Fichier sauvegardé')
  }
}

// Fermer la session
const handleClose = async () => {
  await closeSession(true) // true = sync avant de fermer
}
</script>
```

### 2. Utiliser le FileSessionManager

```vue
<template>
  <div>
    <FileSessionManager
      ref="sessionManager"
      :file-path="filePath"
      :mode="'edit'"
      :auto-open="true"
      @session-opened="onSessionOpened"
      @content-loaded="onContentLoaded"
      @error="onError"
    />
    
    <!-- Votre éditeur ici -->
    <textarea v-model="content" @input="handleContentChange"></textarea>
  </div>
</template>

<script setup>
import FileSessionManager from '@/components/FileViewer/FileSessionManager.vue'

const sessionManager = ref(null)
const content = ref('')

const onContentLoaded = async (blob) => {
  content.value = await blob.text()
}

const handleContentChange = async () => {
  if (sessionManager.value) {
    await sessionManager.value.updateContent(content.value)
  }
}

const handleSave = async () => {
  if (sessionManager.value) {
    await sessionManager.value.saveFile(content.value)
  }
}
</script>
```

### 3. Utiliser le SimpleTextEditor

```vue
<template>
  <SimpleTextEditor
    :file-path="'/documents/readme.txt'"
    :mode="'edit'"
    @close="handleClose"
    @saved="handleSaved"
  />
</template>

<script setup>
import SimpleTextEditor from '@/components/FileViewer/SimpleTextEditor.vue'

const handleClose = () => {
  console.log('Éditeur fermé')
}

const handleSaved = () => {
  console.log('Fichier sauvegardé')
}
</script>
```

## Fonctionnalités

### ✅ Système de cache serveur
- Les fichiers sont copiés du NAS vers un cache temporaire
- Chaque session a un ID unique
- Les modifications sont stockées dans le cache

### ✅ Synchronisation automatique
- Auto-sync toutes les 30 secondes par défaut
- Synchronisation manuelle avec Ctrl+S
- Indicateur visuel de l'état de synchronisation

### ✅ Verrouillage de fichiers
- Empêche l'édition concurrente
- Affiche qui édite actuellement le fichier
- Mode lecture seule si le fichier est verrouillé

### ✅ Gestion des erreurs
- Retry automatique en cas d'échec de sync
- Messages d'erreur clairs
- Récupération gracieuse

## Raccourcis clavier

- **Ctrl+S** - Sauvegarder manuellement
- **Esc** - Fermer l'éditeur (avec confirmation si modifications)

## États de session

### Session active
- Fichier ouvert et en cache
- Modifications possibles
- Auto-sync actif

### Modifications non sauvegardées
- Indicateur orange clignotant
- Bouton de sync manuel disponible
- Auto-sync en cours

### Synchronisé
- Indicateur vert
- Toutes les modifications sauvegardées
- Fichier à jour sur le NAS

### Fichier verrouillé
- Ouverture en lecture seule
- Affichage de l'utilisateur qui édite
- Pas de modifications possibles

## API Endpoints

### POST /api/files/open
Ouvre un fichier et crée une session de cache

### GET /api/files/session/:id/content
Récupère le contenu du fichier depuis le cache

### PUT /api/files/session/:id/content
Met à jour le contenu dans le cache

### POST /api/files/session/:id/sync
Synchronise manuellement vers le NAS

### POST /api/files/session/:id/close
Ferme la session (avec sync optionnel)

## Prochaines étapes

Pour étendre le système:

1. **Ajouter d'autres types d'éditeurs**
   - Éditeur Markdown avec prévisualisation
   - Éditeur de code avec coloration syntaxique (Monaco Editor)
   - Éditeur d'images
   - Éditeur de documents Office

2. **Améliorer l'auto-sync**
   - Configurer l'intervalle de sync
   - Sync intelligent basé sur l'activité
   - Gestion des conflits

3. **Ajouter des fonctionnalités**
   - Historique des versions
   - Collaboration en temps réel
   - Commentaires et annotations

## Dépannage

### Le fichier ne s'ouvre pas
- Vérifier que le fichier existe sur le NAS
- Vérifier les permissions utilisateur
- Vérifier la connexion au backend

### Les modifications ne sont pas sauvegardées
- Vérifier l'indicateur de sync
- Essayer une synchronisation manuelle (Ctrl+S)
- Vérifier les logs du backend

### Fichier verrouillé par erreur
- Attendre l'expiration du verrou (60 minutes par défaut)
- Contacter l'administrateur pour libérer le verrou manuellement

## Support

Pour toute question ou problème, consultez:
- La documentation technique dans `/backend/test_file_session_api.md`
- Les logs du backend pour les erreurs serveur
- La console du navigateur pour les erreurs frontend
