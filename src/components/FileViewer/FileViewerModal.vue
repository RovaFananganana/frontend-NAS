<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50"
    :class="{ 'fullscreen-modal': isFullscreen }"
    tabindex="0"
    ref="modalContainer"
    :role="ARIA_ROLES.FILE_VIEWER"
    :aria-label="`Visualiseur de fichier: ${file?.name || 'Fichier'}`"
    :aria-describedby="content ? 'file-content-description' : undefined"
    aria-modal="true"
  >
    <!-- Skip Links for Accessibility -->
    <div class="skip-links" style="position: absolute; top: -40px; left: 6px; z-index: 1001;">
      <a 
        href="#file-content" 
        class="skip-link"
        style="position: absolute; left: -10000px; background: #000; color: #fff; padding: 8px 16px; text-decoration: none; border-radius: 4px;"
        @focus="$event.target.style.position = 'static'; $event.target.style.left = 'auto'"
        @blur="$event.target.style.position = 'absolute'; $event.target.style.left = '-10000px'"
      >
        Aller au contenu du fichier
      </a>
      <a 
        href="#file-actions" 
        class="skip-link"
        style="position: absolute; left: -10000px; background: #000; color: #fff; padding: 8px 16px; text-decoration: none; border-radius: 4px; margin-left: 8px;"
        @focus="$event.target.style.position = 'static'; $event.target.style.left = 'auto'"
        @blur="$event.target.style.position = 'absolute'; $event.target.style.left = '-10000px'"
      >
        Aller aux actions
      </a>
    </div>

    <!-- Modal Container -->
    <div
      class="bg-base-100 rounded-lg shadow-2xl w-full h-full max-w-7xl max-h-[95vh] flex flex-col relative animate-fade-in"
      :class="{ 'rounded-none max-w-none max-h-none': isFullscreen }"
      @click.stop
    >
      <!-- Header -->
      <header 
        class="flex items-center justify-between p-4 border-b border-base-300 bg-base-200"
        :class="{ 'rounded-t-lg': !isFullscreen }"
        role="banner"
      >
        <div class="flex items-center space-x-3 flex-1 min-w-0">
          <!-- File Icon -->
          <div class="flex-shrink-0">
            <i 
              :class="fileIcon" 
              class="text-2xl"
              :style="{ color: fileIconColor }"
              aria-hidden="true"
            ></i>
          </div>
          
          <!-- File Info -->
          <div class="flex-1 min-w-0">
            <h1 
              class="text-lg font-semibold truncate" 
              :title="file?.name"
              id="file-title"
            >
              {{ file?.name || 'Fichier' }}
            </h1>
            <div 
              class="text-sm text-base-content/70 flex items-center space-x-2"
              id="file-metadata"
              :aria-label="`Taille: ${formatFileSize(file?.size)}${file?.lastModified ? ', modifié le ' + formatDate(file.lastModified) : ''}`"
            >
              <span>{{ formatFileSize(file?.size) }}</span>
              <span v-if="file?.lastModified" aria-hidden="true">•</span>
              <span v-if="file?.lastModified">{{ formatDate(file.lastModified) }}</span>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div 
          class="flex items-center space-x-2 flex-shrink-0"
          :role="ARIA_ROLES.TOOLBAR"
          aria-label="Actions du fichier"
          id="file-actions"
        >
          <!-- Help Button -->
          <button
            @click="toggleHelp"
            class="btn btn-sm btn-ghost"
            :class="{ 'btn-active': showHelp }"
            :aria-label="showHelp ? 'Masquer l\'aide' : 'Afficher l\'aide'"
            :aria-expanded="showHelp"
            title="Aide (F1)"
          >
            <i class="fas fa-question-circle"></i>
          </button>

          <!-- Fullscreen Button -->
          <button
            @click="toggleFullscreen"
            class="btn btn-sm btn-ghost"
            :class="{ 'btn-active': isFullscreen }"
            :aria-label="isFullscreen ? 'Quitter le plein écran' : 'Mode plein écran'"
            title="Plein écran (F11)"
          >
            <i :class="isFullscreen ? 'fas fa-compress' : 'fas fa-expand'"></i>
          </button>

          <!-- Edit/View Toggle -->
          <button
            v-if="canEdit && !isLoading"
            @click="toggleEditMode"
            class="btn btn-sm btn-ghost"
            :class="{ 'btn-active': props.mode === 'edit' }"
            :aria-label="props.mode === 'edit' ? 'Passer en mode lecture' : 'Passer en mode édition'"
            :aria-pressed="props.mode === 'edit'"
            :title="`${props.mode === 'edit' ? 'Mode lecture' : 'Mode édition'} (Tab)`"
          >
            <i :class="props.mode === 'edit' ? 'fas fa-eye' : 'fas fa-edit'" class="mr-1" aria-hidden="true"></i>
            {{ props.mode === 'edit' ? 'Lecture' : 'Éditer' }}
          </button>

          <!-- Save Button -->
          <button
            v-if="props.mode === 'edit' && hasUnsavedChanges"
            @click="handleSave"
            class="btn btn-sm btn-primary"
            :disabled="isSaving"
            :aria-label="isSaving ? 'Sauvegarde en cours...' : 'Sauvegarder le fichier'"
            title="Sauvegarder (Ctrl+S)"
          >
            <span v-if="isSaving" class="loading loading-spinner loading-xs mr-1" aria-hidden="true"></span>
            <i v-else class="fas fa-save mr-1" aria-hidden="true"></i>
            {{ isSaving ? 'Sauvegarde...' : 'Sauvegarder' }}
          </button>

          <!-- Download Button -->
          <button
            v-if="!isLoading && file"
            @click="handleDownload"
            class="btn btn-sm btn-ghost"
            aria-label="Télécharger le fichier"
            title="Télécharger (Ctrl+D)"
          >
            <i class="fas fa-download" aria-hidden="true"></i>
          </button>

          <!-- Close Button -->
          <button
            @click="handleClose"
            class="btn btn-sm btn-ghost"
            aria-label="Fermer le visualiseur"
            title="Fermer (Échap)"
          >
            <i class="fas fa-times" aria-hidden="true"></i>
          </button>
        </div>
      </header>

      <!-- Help Panel -->
      <div
        v-if="showHelp"
        class="bg-base-200 border-b border-base-300 p-4"
        role="region"
        aria-labelledby="help-title"
        id="help-panel"
      >
        <h2 id="help-title" class="text-lg font-semibold mb-3">Raccourcis clavier</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <div>
            <h3 class="font-medium mb-2">Actions générales</h3>
            <ul class="space-y-1">
              <li><kbd class="kbd kbd-sm">Échap</kbd> Fermer</li>
              <li><kbd class="kbd kbd-sm">Ctrl+S</kbd> Sauvegarder</li>
              <li><kbd class="kbd kbd-sm">Ctrl+D</kbd> Télécharger</li>
              <li><kbd class="kbd kbd-sm">Tab</kbd> Changer de mode</li>
              <li><kbd class="kbd kbd-sm">F11</kbd> Plein écran</li>
            </ul>
          </div>
          <div v-if="currentContext === 'text'">
            <h3 class="font-medium mb-2">Éditeur de texte</h3>
            <ul class="space-y-1">
              <li><kbd class="kbd kbd-sm">Ctrl+F</kbd> Rechercher</li>
              <li><kbd class="kbd kbd-sm">Ctrl+H</kbd> Remplacer</li>
              <li><kbd class="kbd kbd-sm">Ctrl+G</kbd> Aller à la ligne</li>
              <li><kbd class="kbd kbd-sm">Ctrl+Z</kbd> Annuler</li>
              <li><kbd class="kbd kbd-sm">Ctrl+Y</kbd> Rétablir</li>
            </ul>
          </div>
          <div v-if="currentContext === 'image'">
            <h3 class="font-medium mb-2">Visualiseur d'images</h3>
            <ul class="space-y-1">
              <li><kbd class="kbd kbd-sm">+</kbd> Zoomer</li>
              <li><kbd class="kbd kbd-sm">-</kbd> Dézoomer</li>
              <li><kbd class="kbd kbd-sm">0</kbd> Ajuster</li>
              <li><kbd class="kbd kbd-sm">1</kbd> Taille réelle</li>
              <li><kbd class="kbd kbd-sm">H</kbd> Retourner H</li>
            </ul>
          </div>
          <div v-if="currentContext === 'pdf'">
            <h3 class="font-medium mb-2">Visualiseur PDF</h3>
            <ul class="space-y-1">
              <li><kbd class="kbd kbd-sm">Page ↑/↓</kbd> Navigation</li>
              <li><kbd class="kbd kbd-sm">Ctrl++/-</kbd> Zoom</li>
              <li><kbd class="kbd kbd-sm">Ctrl+F</kbd> Rechercher</li>
              <li><kbd class="kbd kbd-sm">Ctrl+Home</kbd> Première page</li>
              <li><kbd class="kbd kbd-sm">Ctrl+End</kbd> Dernière page</li>
            </ul>
          </div>
          <div v-if="currentContext === 'media'">
            <h3 class="font-medium mb-2">Lecteur multimédia</h3>
            <ul class="space-y-1">
              <li><kbd class="kbd kbd-sm">Espace</kbd> Lecture/Pause</li>
              <li><kbd class="kbd kbd-sm">M</kbd> Muet</li>
              <li><kbd class="kbd kbd-sm">↑/↓</kbd> Volume</li>
              <li><kbd class="kbd kbd-sm">←/→</kbd> Navigation</li>
              <li><kbd class="kbd kbd-sm">F</kbd> Plein écran</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Content Area -->
      <main 
        class="flex-1 flex flex-col min-h-0 relative"
        role="main"
        aria-labelledby="file-title"
        id="file-content"
      >
        <!-- Loading State -->
        <div
          v-if="isLoading"
          class="flex-1 flex items-center justify-center"
          role="status"
          aria-live="polite"
          aria-label="Chargement en cours"
        >
          <div class="text-center max-w-md">
            <div 
              class="loading loading-spinner loading-lg mb-4"
              aria-hidden="true"
            ></div>
            <p 
              class="text-base-content/70 mb-2"
              id="loading-message"
            >
              {{ loadingMessage }}
            </p>
            
            <!-- Progress Bar -->
            <div 
              v-if="progressOperations.length > 0"
              class="w-full bg-base-300 rounded-full h-2 mb-3"
              role="progressbar"
              :aria-valuenow="progressOperations[0]?.current || 0"
              :aria-valuemax="progressOperations[0]?.total || 100"
              :aria-label="`Progression: ${progressOperations[0]?.current || 0}%`"
            >
              <div 
                class="bg-primary h-2 rounded-full transition-all duration-300"
                :style="{ width: `${progressOperations[0]?.current || 0}%` }"
              ></div>
            </div>
            
            <div class="text-sm text-base-content/50 space-y-1">
              <div>
                Étape: {{ processingStage }}
                <span v-if="retryCount > 0"> (tentative {{ retryCount }}/{{ maxRetries }})</span>
              </div>
              <div v-if="isLowEndDevice" class="text-warning">
                <i class="fas fa-mobile-alt mr-1" aria-hidden="true"></i>
                Mode optimisé pour appareil limité
              </div>
              <div v-if="performanceMetrics.lastLoad?.duration">
                Temps de traitement: {{ Math.round(performanceMetrics.lastLoad.duration) }}ms
              </div>
            </div>
          </div>
        </div>

        <!-- Error State -->
        <div
          v-else-if="error"
          class="flex-1 flex items-center justify-center p-8"
          role="alert"
          aria-live="assertive"
          aria-labelledby="error-title"
          aria-describedby="error-description"
        >
          <div class="text-center max-w-lg">
            <div class="text-6xl mb-4 text-error" aria-hidden="true">
              <i class="fas fa-exclamation-triangle"></i>
            </div>
            <h2 id="error-title" class="text-xl font-semibold mb-2">Erreur de chargement</h2>
            <p id="error-description" class="text-base-content/70 mb-4">{{ error }}</p>
            
            <!-- Error details (collapsible) -->
            <div v-if="errorDetails" class="mb-4">
              <details class="text-left bg-base-200 rounded-lg p-3">
                <summary 
                  class="cursor-pointer text-sm font-medium"
                  aria-label="Afficher ou masquer les détails techniques"
                >
                  Détails techniques
                </summary>
                <div class="mt-2 text-xs text-base-content/60" role="group" aria-label="Détails de l'erreur">
                  <p><strong>Code:</strong> {{ errorDetails.code }}</p>
                  <p><strong>Étape:</strong> {{ processingStage }}</p>
                  <p v-if="errorDetails.details.handlerName"><strong>Gestionnaire:</strong> {{ errorDetails.details.handlerName }}</p>
                  <p><strong>Timestamp:</strong> {{ errorDetails.timestamp }}</p>
                  <div v-if="errorDetails.details" class="mt-2">
                    <strong>Détails:</strong>
                    <pre 
                      class="text-xs bg-base-300 p-2 rounded mt-1 overflow-auto"
                      role="log"
                      aria-label="Détails techniques de l'erreur"
                    >{{ JSON.stringify(errorDetails.details, null, 2) }}</pre>
                  </div>
                </div>
              </details>
            </div>
            
            <!-- Suggested actions -->
            <div 
              class="flex flex-wrap justify-center gap-2"
              role="group"
              aria-label="Actions suggérées"
            >
              <button 
                v-for="action in supportedActions" 
                :key="action.action"
                @click="handleErrorAction(action.action)" 
                class="btn btn-sm"
                :class="action.action === 'retry' ? 'btn-outline' : action.action === 'download' ? 'btn-primary' : 'btn-ghost'"
                :aria-label="`${action.label} - ${getActionDescription(action.action)}`"
              >
                <i :class="getActionIcon(action.action)" class="mr-1" aria-hidden="true"></i>
                {{ action.label }}
              </button>
            </div>
            
            <!-- Retry information -->
            <div 
              v-if="retryCount > 0" 
              class="mt-3 text-sm text-base-content/50"
              role="status"
              aria-label="`${retryCount} tentatives sur ${maxRetries} effectuées`"
            >
              Tentatives: {{ retryCount }}/{{ maxRetries }}
            </div>
          </div>
        </div>

        <!-- File Content -->
        <div
          v-else-if="content"
          class="flex-1 flex flex-col min-h-0"
        >
          <!-- Text Content -->
          <TextViewer
            v-if="content.type === 'text' && props.mode === 'view'"
            :content="content.content"
            :metadata="content.metadata"
            :editable="content.editable"
            mode="view"
            @edit="toggleEditMode"
            @content-changed="handleGenericContentChange"
            class="flex-1"
          />
          
          <TextEditor
            v-else-if="content.type === 'text' && props.mode === 'edit'"
            :file="props.file"
            :initial-content="content.content"
            :metadata="content.metadata"
            @save="handleSaveContent"
            @content-changed="(newContent) => handleGenericContentChange({ type: 'text-edit', content: newContent })"
            @encoding-changed="handleEncodingChanged"
            @language-changed="handleLanguageChanged"
            @cancel="toggleEditMode"
            class="flex-1"
          />
          
          <!-- Image Content -->
          <ImageViewer
            v-else-if="content.type === 'image' && props.mode === 'view'"
            :image-url="content.url"
            :filename="props.file?.name || 'Image'"
            :metadata="content.metadata"
            :editable="content.editable"
            @edit="toggleEditMode"
            @download="handleDownload"
            @error="handleImageError"
            class="flex-1"
          />
          
          <ImageEditor
            v-else-if="content.type === 'image' && props.mode === 'edit'"
            :image-url="content.url"
            :filename="props.file?.name || 'Image'"
            :metadata="content.metadata"
            @save="handleImageSave"
            @export="handleImageExport"
            @content-changed="(changeData) => handleGenericContentChange({ type: 'image-edit', ...changeData })"
            @cancel="toggleEditMode"
            @error="handleImageError"
            class="flex-1"
          />
          
          <!-- PDF Content -->
          <PDFViewer
            v-else-if="content.type === 'pdf'"
            :pdf-url="content.url"
            :filename="props.file?.name || 'Document PDF'"
            :metadata="content.metadata"
            :mode="props.mode"
            @error="handlePDFError"
            @loaded="handlePDFLoaded"
            @page-changed="handlePDFPageChanged"
            @annotation-changed="(changeData) => handleGenericContentChange({ type: 'pdf-annotation', ...changeData })"
            class="flex-1"
          />
          
          <!-- Video Content -->
          <MediaViewer
            v-else-if="content.type === 'video'"
            :content="content"
            :filename="props.file?.name || 'Vidéo'"
            @error="handleMediaError"
            @metadata-changed="(metadata) => handleGenericContentChange({ type: 'metadata', metadata })"
            class="flex-1"
          />
          
          <!-- Audio Content -->
          <MediaViewer
            v-else-if="content.type === 'audio'"
            :content="content"
            :filename="props.file?.name || 'Audio'"
            @error="handleMediaError"
            @metadata-changed="(metadata) => handleGenericContentChange({ type: 'metadata', metadata })"
            class="flex-1"
          />

          <!-- SMB Media Content (videos/audio on network share) -->
          <div
            v-else-if="content.type === 'smb-media'"
            class="flex-1 flex items-center justify-center p-8"
          >
            {{ console.log('🎬 FileViewer: Displaying SMB media interface for:', content) }}
            <div class="text-center max-w-md">
              <div class="text-6xl mb-4 text-primary">
                <i class="fas" :class="content.metadata?.mediaType === 'video' ? 'fa-video' : 'fa-music'"></i>
              </div>
              <h3 class="text-xl font-semibold mb-4">
                {{ content.metadata?.mediaType === 'video' ? 'Vidéo' : 'Audio' }} sur partage réseau
              </h3>
              <p class="text-base-content/70 mb-6">
                Ce fichier multimédia est stocké sur le partage réseau NAS. 
                {{ content.metadata?.mediaType === 'video' ? 'La vidéo' : 'L\'audio' }} ne peut pas être lu directement dans le navigateur.
                <br><br>
                <strong>Utilisez les options ci-dessous pour y accéder :</strong>
              </p>
              
              <!-- File info -->
              <div class="bg-base-200 rounded-lg p-4 mb-6 text-left">
                <h4 class="font-semibold mb-2">Informations:</h4>
                <ul class="text-sm space-y-1">
                  <li><strong>Nom:</strong> {{ content.metadata?.filename || props.file?.name }}</li>
                  <li><strong>Type:</strong> {{ content.metadata?.mediaType || 'Média' }}</li>
                  <li><strong>Format:</strong> {{ content.metadata?.mimeType || 'N/A' }}</li>
                  <li v-if="content.content?.file_info?.extension">
                    <strong>Extension:</strong> {{ content.content.file_info.extension }}
                  </li>
                </ul>
              </div>
              
              <!-- Actions -->
              <div class="space-y-3">
                <button 
                  @click="openSMBPath(content.content.smb_path)" 
                  class="btn btn-primary w-full"
                >
                  <i class="fas fa-external-link-alt mr-2"></i>
                  Ouvrir avec l'application locale
                </button>
                
                <button 
                  @click="copySMBPath(content.content.smb_path)" 
                  class="btn btn-outline w-full"
                >
                  <i class="fas fa-copy mr-2"></i>
                  Copier le chemin SMB
                </button>
                
                <button 
                  v-if="content.content.actions?.download_url"
                  @click="downloadFile(content.content.actions.download_url)" 
                  class="btn btn-outline w-full"
                >
                  <i class="fas fa-download mr-2"></i>
                  Télécharger
                </button>
              </div>
              
              <div class="mt-4 text-xs text-base-content/50">
                Chemin SMB: {{ content.content.smb_path }}
              </div>
              
              <div class="mt-4 text-xs text-info bg-info/10 p-3 rounded-lg">
                <div class="font-semibold mb-2">💡 Comment utiliser le chemin copié :</div>
                <ul class="text-left space-y-1">
                  <li>• <strong>Explorateur Windows :</strong> Ctrl+L puis Ctrl+V</li>
                  <li>• <strong>VLC :</strong> Ctrl+N puis Ctrl+V</li>
                  <li>• <strong>Lecteur Windows :</strong> Ctrl+U puis Ctrl+V</li>
                </ul>
              </div>
            </div>
          </div>
          
          <!-- Document Content (Word, Excel, PowerPoint) -->
          <DocumentViewer
            v-else-if="['word', 'excel', 'powerpoint', 'document'].includes(content.type)"
            :document-data="content"
            :mode="props.mode"
            :filename="props.file?.name || 'Document'"
            @save="handleDocumentSave"
            @content-changed="(changeData) => handleGenericContentChange({ type: 'document-edit', ...changeData })"
            @mode-change="toggleEditMode"
            @error="handleDocumentError"
            class="flex-1"
          />

          <!-- Local Application Viewer (for Office documents opened locally) -->
          <LocalApplicationViewer
            v-else-if="content.type === 'local-application'"
            :filename="props.file?.name || 'Document'"
            :smb-path="content.url"
            :mime-type="content.metadata?.mimeType || ''"
            :metadata="content.metadata"
            @close="handleClose"
            @error="handleLocalAppError"
            class="flex-1"
          />

          <!-- SMB File Viewer (for files on network share) -->
          <div
            v-else-if="content.type === 'smb-file'"
            class="flex-1 flex items-center justify-center p-8"
          >
            <div class="text-center max-w-md">
              <div class="text-6xl mb-4 text-info">
                <i class="fas fa-network-wired"></i>
              </div>
              <h3 class="text-xl font-semibold mb-4">Fichier sur partage réseau</h3>
              <p class="text-base-content/70 mb-6">
                Ce fichier est stocké sur le partage réseau NAS. Utilisez les options ci-dessous pour y accéder.
              </p>
              
              <!-- File info -->
              <div class="bg-base-200 rounded-lg p-4 mb-6 text-left">
                <h4 class="font-semibold mb-2">Informations:</h4>
                <ul class="text-sm space-y-1">
                  <li><strong>Nom:</strong> {{ content.content.file_info?.name || props.file?.name }}</li>
                  <li><strong>Extension:</strong> {{ content.content.file_info?.extension || 'N/A' }}</li>
                  <li><strong>Chemin:</strong> {{ content.content.file_info?.path || props.file?.path }}</li>
                </ul>
              </div>
              
              <!-- Actions -->
              <div class="space-y-3">
                <button 
                  @click="openSMBPath(content.content.smb_path)" 
                  class="btn btn-primary w-full"
                >
                  <i class="fas fa-external-link-alt mr-2"></i>
                  Ouvrir via SMB
                </button>
                
                <button 
                  @click="copySMBPath(content.content.smb_path)" 
                  class="btn btn-outline w-full"
                >
                  <i class="fas fa-copy mr-2"></i>
                  Copier le chemin SMB
                </button>
                
                <button 
                  v-if="content.content.actions?.download_url"
                  @click="downloadFile(content.content.actions.download_url)" 
                  class="btn btn-outline w-full"
                >
                  <i class="fas fa-download mr-2"></i>
                  Télécharger
                </button>
              </div>
              
              <div class="mt-4 text-xs text-base-content/50">
                Chemin SMB: {{ content.content.smb_path }}
              </div>
            </div>
          </div>

          <!-- Download Required Viewer (fallback for local opening) -->
          <div
            v-else-if="content.type === 'download-required'"
            class="flex-1 flex items-center justify-center"
            v-html="content.content"
          ></div>
          
          <!-- Fallback for unsupported content with degraded functionality -->
          <div
            v-else-if="content.metadata?.degraded"
            class="flex-1 p-4 overflow-auto"
          >
            <div class="text-center text-base-content/50">
              <i class="fas fa-file-alt text-4xl mb-2"></i>
              <h3 class="text-lg font-semibold mb-2">Prévisualisation limitée</h3>
              <p class="mb-2">Le fichier ne peut pas être affiché complètement.</p>
              <p class="text-sm mb-4">Type: {{ content.type }} | Handler: {{ handlerName || 'Aucun' }}</p>
              
              <!-- Basic file information -->
              <div class="bg-base-200 rounded-lg p-4 text-left max-w-md mx-auto">
                <h4 class="font-semibold mb-2">Informations du fichier:</h4>
                <ul class="text-sm space-y-1">
                  <li><strong>Nom:</strong> {{ props.file?.name || 'Inconnu' }}</li>
                  <li><strong>Taille:</strong> {{ formatFileSize(props.file?.size) }}</li>
                  <li><strong>Type:</strong> {{ props.file?.type || 'Inconnu' }}</li>
                  <li v-if="content.metadata?.lastModified"><strong>Modifié:</strong> {{ formatDate(content.metadata.lastModified) }}</li>
                </ul>
              </div>
              
              <div class="mt-4">
                <button @click="handleDownload" class="btn btn-primary">
                  <i class="fas fa-download mr-2"></i>
                  Télécharger le fichier
                </button>
              </div>
            </div>
          </div>
          
          <!-- Unknown content type -->
          <div
            v-else
            class="flex-1 p-4 overflow-auto"
          >
            <div class="text-center text-base-content/50">
              <i class="fas fa-question-circle text-4xl mb-2"></i>
              <h3 class="text-lg font-semibold mb-2">Type de contenu inconnu</h3>
              <p class="mb-2">Impossible de déterminer comment afficher ce contenu.</p>
              <p class="text-sm mb-4">Type détecté: {{ content.type }} | Handler: {{ handlerName || 'Aucun' }}</p>
              
              <div v-if="content.error" class="mt-4 p-3 bg-error/10 border border-error/20 rounded-lg text-error">
                <i class="fas fa-exclamation-triangle mr-2"></i>
                {{ content.error }}
              </div>
              
              <div class="mt-4">
                <button @click="handleRetry" class="btn btn-outline mr-2">
                  <i class="fas fa-redo mr-2"></i>
                  Réessayer
                </button>
                <button @click="handleDownload" class="btn btn-primary">
                  <i class="fas fa-download mr-2"></i>
                  Télécharger
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Unsupported File Type -->
        <div
          v-else
          class="flex-1 flex items-center justify-center p-8"
        >
          <div class="text-center max-w-md">
            <div class="text-6xl mb-4 text-warning">
              <i class="fas fa-file-alt"></i>
            </div>
            <h3 class="text-xl font-semibold mb-2">Type de fichier non supporté</h3>
            <p class="text-base-content/70 mb-4">
              Ce type de fichier ne peut pas être prévisualisé dans le navigateur.
            </p>
            <button @click="handleDownload" class="btn btn-primary">
              <i class="fas fa-download mr-1"></i>
              Télécharger le fichier
            </button>
          </div>
        </div>
      </main>

      <!-- Footer -->
      <div
        v-if="!isLoading && !error"
        class="flex items-center justify-between p-3 border-t border-base-300 bg-base-50 rounded-b-lg text-sm text-base-content/70"
      >
        <div class="flex items-center space-x-4">
          <span v-if="content?.type">
            Type: {{ content.type }}
          </span>
          <span v-if="handlerName">
            Gestionnaire: {{ handlerName }}
          </span>
          <span v-if="props.mode === 'edit' && hasUnsavedChanges" class="text-warning">
            <i class="fas fa-circle text-xs mr-1"></i>
            Modifications non sauvegardées
          </span>
          <span v-if="content?.metadata?.canSwitchModes" class="text-info">
            <i class="fas fa-exchange-alt text-xs mr-1"></i>
            Mode commutable
          </span>
        </div>
        
        <div class="flex items-center space-x-4">
          <!-- Processing info -->
          <span v-if="content?.metadata?.processingTime" class="text-xs">
            Traité en {{ Math.round(content.metadata.processingTime) }}ms
          </span>
          
          <!-- Keyboard shortcuts -->
          <span class="text-xs">
            Raccourcis: Échap (fermer)
            <span v-if="canEdit">, Ctrl+S (sauvegarder)</span>
            <span v-if="content?.metadata?.canSwitchModes">, Tab (changer mode)</span>
          </span>
        </div>
      </div>
      
      <!-- Hidden content description for screen readers -->
      <div 
        id="file-content-description" 
        class="sr-only"
        aria-hidden="true"
      >
        <span v-if="content">
          {{ accessibilityManager.createContentDescription(content, file) }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { fileHandlerService } from '@/services/fileHandlerService.js'
import { detectFileType, getFileTypeIcon } from '@/utils/fileTypeDetection.js'
import { 
  FileViewerError, 
  createFileViewerError, 
  ErrorRecoveryStrategies 
} from '@/utils/fileViewerErrors.js'
import { 
  keyboardShortcuts, 
  initializeFileViewerShortcuts,
  formatKeyString 
} from '@/utils/keyboardShortcuts.js'
import { 
  accessibilityManager, 
  a11yUtils,
  ARIA_ROLES 
} from '@/utils/accessibility.js'
import {
  performanceMonitor,
  memoryManager,
  componentLoader,
  progressIndicator,
  perfUtils,
  debounce
} from '@/utils/performanceOptimization.js'
import TextViewer from './TextViewer.vue'
import TextEditor from './TextEditor.vue'
import ImageViewer from './ImageViewer.vue'
import ImageEditor from './ImageEditor.vue'
import PDFViewer from './PDFViewer.vue'
import MediaViewer from './MediaViewer.vue'
import DocumentViewer from './DocumentViewer.vue'
import LocalApplicationViewer from './LocalApplicationViewer.vue'

// Props
const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  file: {
    type: Object,
    default: null
  },
  mode: {
    type: String,
    default: 'view',
    validator: (value) => ['view', 'edit'].includes(value)
  }
})

// Emits
const emit = defineEmits([
  'close',
  'save',
  'download',
  'mode-changed',
  'content-loaded',
  'error'
])

// Refs
const modalContainer = ref(null)

// State
const isLoading = ref(false)
const isSaving = ref(false)
const error = ref(null)
const content = ref(null)
const hasUnsavedChanges = ref(false)
const handlerName = ref(null)
const loadingMessage = ref('Chargement du fichier...')
const retryCount = ref(0)
const maxRetries = ref(3)
const processingStage = ref('initializing')
const errorDetails = ref(null)
const supportedActions = ref([])
const currentHandler = ref(null)
const isFullscreen = ref(false)
const showHelp = ref(false)
const keyboardShortcutsEnabled = ref(true)
const accessibilityAnnouncements = ref([])
const currentContext = ref('global')
const performanceMetrics = ref({})
const progressOperations = ref([])
const memoryStats = ref({})
const isLowEndDevice = ref(false)

// Computed
const canEdit = computed(() => {
  return content.value?.editable === true
})

const fileIcon = computed(() => {
  if (!props.file) return 'fas fa-file'
  const fileType = detectFileType(props.file.name)
  return getFileTypeIcon(fileType.mimeType)
})

const fileIconColor = computed(() => {
  if (!props.file) return '#6b7280'
  const fileType = detectFileType(props.file.name)
  
  const colorMap = {
    'text': '#10b981',
    'image': '#f59e0b',
    'video': '#ef4444',
    'audio': '#8b5cf6',
    'pdf': '#dc2626'
  }
  
  return colorMap[fileType.category] || '#6b7280'
})

// Methods
const handleClose = () => {
  if (hasUnsavedChanges.value) {
    if (!confirm('Vous avez des modifications non sauvegardées. Voulez-vous vraiment fermer ?')) {
      return
    }
  }
  emit('close')
}

const handleSave = async () => {
  if (!canEdit.value || !hasUnsavedChanges.value) return
  
  isSaving.value = true
  try {
    // Prepare save data based on content type
    const saveData = prepareSaveData()
    
    // Use handler-specific save method if available
    if (currentHandler.value?.saveContent && typeof currentHandler.value.saveContent === 'function') {
      const savedContent = await currentHandler.value.saveContent(props.file, saveData.content, saveData.options)
      
      // Update content with saved version if handler returns new content
      if (savedContent) {
        content.value = {
          ...content.value,
          content: savedContent,
          metadata: {
            ...content.value.metadata,
            lastSaved: new Date().toISOString(),
            savedBy: currentHandler.value.name
          }
        }
      }
    }
    
    // Emit save event with prepared data
    emit('save', saveData)
    hasUnsavedChanges.value = false
    
    // Show success feedback
    showSaveSuccess()
    
  } catch (err) {
    console.error('Error saving file:', err)
    const saveError = createFileViewerError(err, 'save_operation')
    error.value = saveError.toUserMessage()
    
    // Show error feedback
    showSaveError(saveError)
  } finally {
    isSaving.value = false
  }
}

const prepareSaveData = () => {
  if (!content.value) {
    throw new Error('No content to save')
  }
  
  const baseData = {
    file: props.file,
    content: content.value.content,
    type: content.value.type,
    metadata: content.value.metadata
  }
  
  // Add type-specific save options
  switch (content.value.type) {
    case 'text':
      return {
        ...baseData,
        options: {
          encoding: content.value.metadata?.encoding || 'utf-8',
          language: content.value.metadata?.language || 'plaintext'
        }
      }
    case 'image':
      return {
        ...baseData,
        options: {
          format: content.value.metadata?.format || 'png',
          quality: content.value.metadata?.quality || 0.9
        }
      }
    case 'document':
      return {
        ...baseData,
        options: {
          documentType: content.value.metadata?.documentType || 'unknown',
          preserveFormatting: true
        }
      }
    default:
      return baseData
  }
}

const showSaveSuccess = () => {
  announceSaveStatus(true)
  // In a real implementation, this would show a toast notification
  console.log('File saved successfully')
}

const showSaveError = (error) => {
  announceSaveStatus(false, error.toUserMessage())
  // In a real implementation, this would show a toast notification
  console.error('Save failed:', error.toUserMessage())
}

const handleDownload = () => {
  emit('download', props.file)
}

// SMB file handling methods
const openSMBPath = (smbPath) => {
  try {
    // Convert SMB path to Windows UNC path
    const uncPath = smbPath.replace('smb://', '\\\\').replace(/\//g, '\\')
    
    // Create a comprehensive instruction dialog
    const instructions = `
🎬 Ouverture du fichier multimédia

Le navigateur ne peut pas ouvrir directement les fichiers réseau.
Voici comment procéder :

📋 CHEMIN COPIÉ : ${uncPath}

🎯 MÉTHODES D'OUVERTURE :

1️⃣ EXPLORATEUR WINDOWS :
   • Appuyez sur Windows + R
   • Collez le chemin (Ctrl+V)
   • Appuyez sur Entrée

2️⃣ VLC MEDIA PLAYER :
   • Ouvrez VLC
   • Ctrl+N (Ouvrir un flux réseau)
   • Collez le chemin (Ctrl+V)
   • Cliquez sur Lire

3️⃣ LECTEUR WINDOWS MEDIA :
   • Ouvrez le Lecteur Windows Media
   • Ctrl+U (Ouvrir une URL)
   • Collez le chemin (Ctrl+V)

4️⃣ NAVIGATEUR DE FICHIERS :
   • Ouvrez l'Explorateur Windows
   • Cliquez dans la barre d'adresse (Ctrl+L)
   • Collez le chemin (Ctrl+V)

Le chemin a été automatiquement copié dans votre presse-papiers !
    `
    
    // Copy to clipboard
    navigator.clipboard.writeText(uncPath).then(() => {
      // Show instructions in a more user-friendly way
      if (confirm(instructions + '\n\n✅ Chemin copié ! Cliquez OK pour continuer.')) {
        // User acknowledged
        console.log('User acknowledged SMB path instructions')
      }
    }).catch(() => {
      // Fallback if clipboard fails
      alert(instructions)
    })
    
  } catch (error) {
    console.warn('Error opening SMB path:', error)
    copySMBPath(smbPath)
  }
}

const copySMBPath = async (smbPath) => {
  try {
    // Convert to Windows UNC path for easier use
    const uncPath = smbPath.replace('smb://', '\\\\').replace(/\//g, '\\')
    await navigator.clipboard.writeText(uncPath)
    
    console.log('SMB path copied to clipboard:', smbPath)
    alert(`Chemin réseau copié dans le presse-papiers !\n\n${uncPath}\n\n💡 Comment l'utiliser :\n• Explorateur Windows : Ctrl+L puis Ctrl+V\n• VLC : Ctrl+N puis Ctrl+V\n• Lecteur Windows Media : Ctrl+U puis Ctrl+V`)
  } catch (error) {
    console.warn('Error copying SMB path:', error)
    // Fallback: show path in alert
    const uncPath = smbPath.replace('smb://', '\\\\').replace(/\//g, '\\')
    alert(`Chemin réseau :\n${uncPath}\n\nCopiez ce chemin manuellement`)
  }
}

const downloadFile = async (downloadUrl) => {
  try {
    // Import axios dynamically
    const axios = (await import('axios')).default
    
    // Build proper download URL
    let finalUrl = downloadUrl
    if (!downloadUrl.startsWith('http')) {
      // Build the correct URL based on current server
      const baseUrl = window.location.origin.replace(':5173', ':5001') // Dev server adjustment
      finalUrl = `${baseUrl}${downloadUrl}`
    }
    
    console.log('Attempting download from:', finalUrl)
    
    // Use axios with authentication headers
    const response = await axios.get(finalUrl, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Accept': 'application/octet-stream'
      },
      responseType: 'blob',
      timeout: 30000 // 30 seconds timeout
    })
    
    if (response.status === 200) {
      // Get the blob and create download
      const blob = response.data
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = props.file?.name || 'download'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      
      alert('Téléchargement démarré !')
    } else {
      throw new Error(`Download failed: ${response.status}`)
    }
  } catch (error) {
    console.warn('Error downloading file:', error)
    
    // Provide alternative download suggestion
    const uncPath = content.value?.content?.smb_path?.replace('smb://', '\\\\').replace(/\//g, '\\')
    alert(`Erreur lors du téléchargement.\n\nAlternative : Copiez le fichier manuellement depuis :\n${uncPath}`)
  }
}

const handleRetry = () => {
  retryCount.value = 0
  loadFileContent()
}

const handleErrorAction = (action) => {
  switch (action) {
    case 'retry':
      handleRetry()
      break
    case 'download':
      handleDownload()
      break
    case 'show_supported_types':
      showSupportedTypes()
      break
    case 'check_connection':
      checkConnection()
      break
    default:
      console.warn('Unknown error action:', action)
  }
}

const showSupportedTypes = () => {
  const supportedTypes = fileHandlerService.getSupportedMimeTypes()
  const supportedExtensions = fileHandlerService.getSupportedExtensions()
  
  // This could open a modal or show a tooltip with supported types
  console.info('Supported MIME types:', supportedTypes)
  console.info('Supported extensions:', supportedExtensions)
  
  // For now, just show an alert - in a real implementation this would be a proper modal
  alert(`Types de fichiers supportés:\n\nExtensions: ${supportedExtensions.join(', ')}\n\nTypes MIME: ${supportedTypes.slice(0, 10).join(', ')}${supportedTypes.length > 10 ? '...' : ''}`)
}

const checkConnection = async () => {
  try {
    // Import axios dynamically
    const axios = (await import('axios')).default
    
    const response = await axios.head('/api/health')
    if (response.status === 200) {
      alert('Connexion OK - Vous pouvez réessayer')
    } else {
      alert('Problème de connexion détecté')
    }
  } catch (error) {
    alert('Impossible de vérifier la connexion')
  }
}

const getActionIcon = (action) => {
  const icons = {
    'retry': 'fas fa-redo',
    'download': 'fas fa-download',
    'show_supported_types': 'fas fa-info-circle',
    'check_connection': 'fas fa-wifi',
    'request_access': 'fas fa-key',
    'login': 'fas fa-sign-in-alt',
    'compress_file': 'fas fa-compress',
    'redownload': 'fas fa-cloud-download-alt',
    'check_source': 'fas fa-search'
  }
  return icons[action] || 'fas fa-question-circle'
}

const getActionDescription = (action) => {
  const descriptions = {
    'retry': 'Réessayer de charger le fichier',
    'download': 'Télécharger le fichier original',
    'show_supported_types': 'Voir la liste des types de fichiers supportés',
    'check_connection': 'Vérifier la connexion réseau',
    'request_access': 'Demander l\'accès au fichier',
    'login': 'Se connecter pour accéder au fichier',
    'compress_file': 'Réduire la taille du fichier',
    'redownload': 'Télécharger à nouveau le fichier',
    'check_source': 'Vérifier le fichier source'
  }
  return descriptions[action] || 'Action disponible'
}

// Performance optimization helper functions
const processLargeFile = async (file, mimeType) => {
  // Verify it's a real File object
  if (!(file instanceof File)) {
    console.warn('processLargeFile called with non-File object, falling back to regular processing')
    return await fileHandlerService.processFile(file, mimeType)
  }
  
  const chunkSize = perfUtils.getOptimalChunkSize(file.size)
  
  // For very large files, process in chunks to avoid memory issues
  if (file.size > 50 * 1024 * 1024) { // 50MB
    return await processFileInChunks(file, mimeType, chunkSize)
  }
  
  return await fileHandlerService.processFile(file, mimeType)
}

const processFileInChunks = async (file, mimeType, chunkSize) => {
  // Verify it's a real File object
  if (!(file instanceof File)) {
    console.warn('processFileInChunks called with non-File object, falling back to regular processing')
    return await fileHandlerService.processFile(file, mimeType)
  }
  
  // This is a simplified implementation
  // In a real scenario, you'd need handler-specific chunked processing
  const chunks = []
  let offset = 0
  
  while (offset < file.size) {
    const chunk = file.slice(offset, offset + chunkSize)
    chunks.push(chunk)
    offset += chunkSize
    
    // Yield control to prevent blocking
    await new Promise(resolve => setTimeout(resolve, 0))
  }
  
  // Process chunks (simplified - actual implementation would depend on file type)
  return await fileHandlerService.processFile(file, mimeType)
}

const optimizeContentForLowEndDevice = async (content) => {
  if (!content) return content
  
  const optimized = { ...content }
  
  switch (content.type) {
    case 'image':
      // Reduce image quality for low-end devices
      if (content.metadata?.width > 1920) {
        optimized.metadata = {
          ...content.metadata,
          optimized: true,
          originalWidth: content.metadata.width,
          originalHeight: content.metadata.height
        }
      }
      break
      
    case 'text':
      // Limit syntax highlighting for very large text files
      if (content.metadata?.lineCount > 10000) {
        optimized.metadata = {
          ...content.metadata,
          syntaxHighlighting: false,
          optimized: true
        }
      }
      break
      
    case 'pdf':
      // Limit initial page rendering
      if (content.metadata?.pageCount > 100) {
        optimized.metadata = {
          ...content.metadata,
          lazyPageLoading: true,
          optimized: true
        }
      }
      break
  }
  
  return optimized
}

// Debounced content change handler to improve performance
const debouncedContentChange = debounce((changeData) => {
  handleGenericContentChange(changeData)
}, 300)

// Memory cleanup function
const performCleanup = () => {
  // Clean up object URLs
  if (content.value?.url && content.value.url.startsWith('blob:')) {
    memoryManager.registerObjectUrl(content.value.url)
  }
  
  // Clean up any intervals or timeouts
  memoryManager.cleanup()
  
  // Clear old performance metrics
  performanceMonitor.clearOldMetrics()
  
  // Clear progress operations
  progressIndicator.clear()
  
  // Force garbage collection if available (development only)
  if (window.gc && process.env.NODE_ENV === 'development') {
    window.gc()
  }
}

const toggleEditMode = async () => {
  if (!canEdit.value) return
  
  // Check for unsaved changes before switching to view mode
  if (props.mode === 'edit' && hasUnsavedChanges.value) {
    const confirmSwitch = confirm('Vous avez des modifications non sauvegardées. Voulez-vous les perdre ?')
    if (!confirmSwitch) {
      return
    }
  }
  
  const newMode = props.mode === 'edit' ? 'view' : 'edit'
  
  // Emit mode change
  emit('mode-changed', newMode)
  
  // Reset unsaved changes flag when switching to view mode
  if (newMode === 'view') {
    hasUnsavedChanges.value = false
  }
  
  // For some file types, we might need to refresh content when switching modes
  if (content.value?.metadata?.canSwitchModes && newMode === 'edit') {
    // Ensure edit mode has the latest content
    await refreshContentForEditMode()
  }
}

const refreshContentForEditMode = async () => {
  if (!content.value || !currentHandler.value) return
  
  try {
    // Some handlers might need to prepare content differently for edit mode
    if (currentHandler.value.prepareForEdit && typeof currentHandler.value.prepareForEdit === 'function') {
      const editContent = await currentHandler.value.prepareForEdit(content.value, props.file)
      if (editContent) {
        content.value = { ...content.value, ...editContent }
      }
    }
  } catch (error) {
    console.warn('Failed to refresh content for edit mode:', error)
    // Don't block mode switching if refresh fails
  }
}

const handlePreviousFile = () => {
  // Will be implemented when navigation is added
  console.log('Previous file navigation')
}

const handleNextFile = () => {
  // Will be implemented when navigation is added
  console.log('Next file navigation')
}

const loadFileContent = async () => {
  if (!props.file) return
  
  // Start performance monitoring
  const performanceMeasurement = performanceMonitor.startMeasurement('file-loading')
  const progressId = `load-${Date.now()}`
  
  // Reset state
  isLoading.value = true
  error.value = null
  errorDetails.value = null
  content.value = null
  handlerName.value = null
  currentHandler.value = null
  supportedActions.value = []
  processingStage.value = 'initializing'
  loadingMessage.value = 'Initialisation...'
  
  // Start progress tracking
  progressIndicator.startProgress(progressId, {
    label: `Chargement de ${props.file.name}`,
    total: 100,
    stage: 'initializing'
  })
  
  try {
    // Stage 1: File validation (10%)
    processingStage.value = 'validating'
    loadingMessage.value = 'Validation du fichier...'
    progressIndicator.updateProgress(progressId, { current: 10, stage: 'validating' })
    
    // Check if this might be a NAS file first (bypass size validation for large media files or any file that might be on NAS)
    const detectedFileType = detectFileType(props.file.name)
    const isLargeMediaFile = (detectedFileType.mimeType?.startsWith('video/') || detectedFileType.mimeType?.startsWith('audio/')) && 
                            props.file.size > 500 * 1024 * 1024 // > 500MB
    
    // Try NAS detection for large media files OR if we suspect it might be a NAS file
    const shouldTryNASDetection = isLargeMediaFile || true // Try for all files initially
    
    if (shouldTryNASDetection) {
      console.log('🎬 Attempting NAS detection for file:', props.file.name)
      // Skip validation for large media files - they're likely on NAS
      processingStage.value = 'nas_detection'
      loadingMessage.value = 'Détection de fichier réseau...'
      progressIndicator.updateProgress(progressId, { current: 15, stage: 'nas_detection' })
      
      // Try to detect if it's a NAS file by attempting a quick request
      try {
        const axios = (await import('axios')).default
        await axios.head(`/files/${encodeURIComponent(props.file.path || props.file.name)}/content`, {
          timeout: 2000 // Quick timeout
        })
      } catch (error) {
        if (error.response?.status === 401 || error.response?.status === 422) {
          // This is likely a NAS file, create appropriate SMB result based on file type
          console.log('🎬 NAS file detected, creating SMB result for:', detectedFileType.mimeType)
          
          // Determine the appropriate SMB content type
          let smbType = 'smb-file' // Default for documents, text, etc.
          let mediaType = 'file'
          
          if (detectedFileType.mimeType?.startsWith('video/')) {
            smbType = 'smb-media'
            mediaType = 'video'
          } else if (detectedFileType.mimeType?.startsWith('audio/')) {
            smbType = 'smb-media'
            mediaType = 'audio'
          } else if (detectedFileType.mimeType?.startsWith('image/')) {
            smbType = 'smb-file'
            mediaType = 'image'
          } else if (detectedFileType.mimeType?.includes('document') || detectedFileType.mimeType?.includes('word') || detectedFileType.mimeType?.includes('text')) {
            smbType = 'local-application'
            mediaType = 'document'
          }
          
          const smbContent = {
            type: smbType,
            content: smbType === 'local-application' ? null : {
              smb_path: `smb://10.61.17.33/NAS${props.file.path || '/' + props.file.name}`,
              file_info: {
                name: props.file.name,
                path: props.file.path,
                extension: detectedFileType.extension
              },
              actions: {
                download_url: `/files/download?path=${encodeURIComponent(props.file.path || '/' + props.file.name)}`
              }
            },
            url: smbType === 'local-application' ? `smb://10.61.17.33/NAS${props.file.path || '/' + props.file.name}` : undefined,
            metadata: {
              filename: props.file.name,
              mediaType: mediaType,
              mimeType: detectedFileType.mimeType,
              loadedAt: new Date().toISOString(),
              handlerUsed: 'NAS Detection',
              canSwitchModes: false
            },
            editable: smbType === 'local-application'
          }
          
          content.value = smbContent
          console.log('🎬 FileViewerModal: Content assigned:', smbContent.type, smbContent)
          emit('content-loaded', smbContent)
          
          progressIndicator.completeProgress(progressId, {
            contentType: smbContent.type,
            fileSize: props.file.size
          })
          
          return // Exit early with SMB content
        }
      }
    }
    
    // Normal validation for other files
    const validation = fileHandlerService.validateFile(props.file)
    if (!validation.valid) {
      throw new FileViewerError(validation.message, validation.reason, {
        filename: props.file.name,
        size: props.file.size
      })
    }
    
    // Stage 2: File type detection (20%)
    processingStage.value = 'detecting'
    loadingMessage.value = 'Détection du type de fichier...'
    progressIndicator.updateProgress(progressId, { current: 20, stage: 'detecting' })
    
    const fileType = detectFileType(props.file.name)
    
    // Stage 3: Handler selection with fallback (30%)
    processingStage.value = 'handler_selection'
    loadingMessage.value = 'Sélection du gestionnaire...'
    progressIndicator.updateProgress(progressId, { current: 30, stage: 'handler_selection' })
    
    const handler = fileHandlerService.getHandlerForFile(props.file.name, fileType.mimeType)
    
    if (!handler) {
      // Try fallback handlers
      const fallbackHandlers = fileHandlerService.getFallbackHandlers(props.file.name, fileType.mimeType)
      if (fallbackHandlers.length === 0) {
        throw new FileViewerError(
          'Aucun gestionnaire disponible pour ce type de fichier',
          'HANDLER_NOT_FOUND',
          { 
            fileType: fileType.mimeType,
            extension: fileType.extension,
            supportedTypes: fileHandlerService.getSupportedMimeTypes()
          }
        )
      }
      
      // Use first available fallback handler
      currentHandler.value = fallbackHandlers[0]
    } else {
      currentHandler.value = handler
    }
    
    handlerName.value = currentHandler.value.name
    loadingMessage.value = `Traitement avec ${currentHandler.value.name}...`
    
    // Stage 4: File processing with retry logic (40-80%)
    processingStage.value = 'processing'
    progressIndicator.updateProgress(progressId, { current: 40, stage: 'processing' })
    
    const processedContent = await ErrorRecoveryStrategies.retryWithBackoff(
      async () => {
        const currentProgress = 40 + (retryCount.value * 10)
        loadingMessage.value = `Traitement du fichier... (tentative ${retryCount.value + 1}/${maxRetries.value})`
        progressIndicator.updateProgress(progressId, { 
          current: Math.min(currentProgress, 80), 
          stage: 'processing',
          label: `Traitement avec ${currentHandler.value.name} (tentative ${retryCount.value + 1})`
        })
        retryCount.value++
        
        // Check if it's a real File object (has slice method) before using chunked processing
        if (props.file instanceof File && props.file.size > 10 * 1024 * 1024) { // 10MB
          return await processLargeFile(props.file, fileType.mimeType)
        } else {
          return await fileHandlerService.processFile(props.file, fileType.mimeType)
        }
      },
      maxRetries.value - 1,
      1000
    )
    
    // Stage 5: Content validation and optimization (90%)
    processingStage.value = 'finalizing'
    loadingMessage.value = 'Finalisation...'
    progressIndicator.updateProgress(progressId, { current: 90, stage: 'finalizing' })
    
    if (processedContent.error) {
      throw new FileViewerError(processedContent.error, 'PROCESSING_ERROR', {
        handlerName: currentHandler.value.name,
        stage: 'content_processing'
      })
    }
    
    // Optimize content for low-end devices
    const optimizedContent = isLowEndDevice.value 
      ? await optimizeContentForLowEndDevice(processedContent)
      : processedContent
    
    // Enhance content with additional metadata
    const performanceMetric = performanceMonitor.endMeasurement(performanceMeasurement)
    const enhancedContent = {
      ...optimizedContent,
      metadata: {
        ...optimizedContent.metadata,
        loadedAt: new Date().toISOString(),
        processingTime: performanceMetric?.duration || 0,
        handlerUsed: currentHandler.value.name,
        retryCount: retryCount.value,
        canSwitchModes: optimizedContent.editable && ['text', 'image', 'document'].includes(optimizedContent.type),
        optimizedForLowEnd: isLowEndDevice.value,
        memoryUsage: performanceMetric?.memoryDelta || 0
      }
    }
    
    content.value = enhancedContent
    console.log('🎬 FileViewerModal: Content assigned:', enhancedContent.type, enhancedContent)
    emit('content-loaded', enhancedContent)
    
    // Complete progress
    progressIndicator.completeProgress(progressId, {
      contentType: enhancedContent.type,
      processingTime: performanceMetric?.duration,
      fileSize: props.file.size
    })
    
    // Reset retry count on success
    retryCount.value = 0
    
    // Update performance metrics
    performanceMetrics.value = {
      ...performanceMetrics.value,
      lastLoad: performanceMetric
    }
    
  } catch (err) {
    console.error('Error loading file content:', err)
    
    const fileViewerError = createFileViewerError(err, processingStage.value)
    error.value = fileViewerError.toUserMessage()
    errorDetails.value = fileViewerError
    supportedActions.value = fileViewerError.getSuggestedActions()
    
    // Fail progress
    progressIndicator.failProgress(progressId, fileViewerError)
    
    // End performance measurement
    performanceMonitor.endMeasurement(performanceMeasurement)
    
    // Try graceful degradation for some error types
    if (fileViewerError.code === 'PROCESSING_ERROR' && currentHandler.value) {
      try {
        content.value = ErrorRecoveryStrategies.gracefulDegradation(props.file, err)
      } catch (degradationError) {
        console.warn('Graceful degradation failed:', degradationError)
      }
    }
    
    emit('error', fileViewerError)
  } finally {
    isLoading.value = false
    processingStage.value = 'complete'
    
    // Update memory stats
    memoryStats.value = memoryManager.getMemoryStats()
  }
}

const formatFileSize = (bytes) => {
  if (!bytes) return '0 B'
  
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
}

const formatDate = (date) => {
  if (!date) return ''
  
  const d = new Date(date)
  return d.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const handleSaveContent = async (saveData) => {
  try {
    // Emit save event with the content data
    emit('save', {
      file: props.file,
      content: saveData.content,
      encoding: saveData.encoding,
      language: saveData.language
    })
  } catch (error) {
    console.error('Error saving content:', error)
    error.value = `Erreur lors de la sauvegarde: ${error.message}`
  }
}

const handleContentChanged = (newContent, changeType = 'content') => {
  if (!content.value) return
  
  // Detect changes based on content type and change type
  let hasChanges = false
  
  switch (changeType) {
    case 'content':
      hasChanges = content.value.content !== newContent
      break
    case 'metadata':
      hasChanges = JSON.stringify(content.value.metadata) !== JSON.stringify(newContent)
      break
    case 'structure':
      // For complex documents with structure changes
      hasChanges = true
      break
    default:
      hasChanges = content.value.content !== newContent
  }
  
  if (hasChanges) {
    hasUnsavedChanges.value = true
    
    // Update content with new data
    if (changeType === 'content') {
      content.value.content = newContent
    } else if (changeType === 'metadata') {
      content.value.metadata = { ...content.value.metadata, ...newContent }
    }
    
    // Update last modified timestamp
    content.value.metadata = {
      ...content.value.metadata,
      lastModified: new Date().toISOString()
    }
  }
}

// Generic content change handler for different file types
const handleGenericContentChange = (changeData) => {
  const { type, content: newContent, metadata } = changeData
  
  switch (type) {
    case 'text-edit':
      handleContentChanged(newContent, 'content')
      break
    case 'image-edit':
      handleContentChanged(newContent, 'content')
      if (metadata) {
        handleContentChanged(metadata, 'metadata')
      }
      break
    case 'document-edit':
      handleContentChanged(newContent, 'structure')
      break
    case 'cell-edit':
      // For Excel-like documents
      handleContentChanged(newContent, 'structure')
      break
    case 'slide-edit':
      // For PowerPoint-like documents
      handleContentChanged(newContent, 'structure')
      break
    default:
      handleContentChanged(newContent, 'content')
  }
}

const handleEncodingChanged = (newEncoding) => {
  if (content.value && content.value.metadata) {
    content.value.metadata.encoding = newEncoding
  }
}

const handleLanguageChanged = (newLanguage) => {
  if (content.value && content.value.metadata) {
    content.value.metadata.language = newLanguage
  }
}

const handleImageError = (imageError) => {
  console.error('Image viewer error:', imageError)
  error.value = `Erreur d'affichage de l'image: ${imageError.message}`
}

const handleImageSave = async (saveData) => {
  try {
    // Emit save event with the image blob
    emit('save', {
      file: props.file,
      blob: saveData.blob,
      filename: saveData.filename
    })
    hasUnsavedChanges.value = false
  } catch (error) {
    console.error('Error saving image:', error)
    error.value = `Erreur lors de la sauvegarde: ${error.message}`
  }
}

const handleImageExport = (exportData) => {
  try {
    // Create download link for the exported image
    const url = URL.createObjectURL(exportData.blob)
    const link = document.createElement('a')
    link.href = url
    link.download = exportData.filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Error exporting image:', error)
    error.value = `Erreur lors de l'export: ${error.message}`
  }
}

const handlePDFError = (pdfError) => {
  console.error('PDF viewer error:', pdfError)
  error.value = `Erreur d'affichage du PDF: ${pdfError.message}`
}

const handlePDFLoaded = (pdfData) => {
  console.log('PDF loaded successfully:', pdfData)
  // Update metadata if needed
  if (content.value && pdfData.metadata) {
    content.value.metadata = {
      ...content.value.metadata,
      ...pdfData.metadata
    }
  }
}

const handlePDFPageChanged = (pageNum) => {
  console.log('PDF page changed to:', pageNum)
  // Could emit event or update state if needed
}

const handleMediaError = (mediaError) => {
  console.error('Media viewer error:', mediaError)
  error.value = `Erreur de lecture du média: ${mediaError.message || mediaError}`
}

const handleDocumentSave = async (saveData) => {
  try {
    // Emit save event with the document content
    emit('save', {
      file: props.file,
      content: saveData.content,
      documentType: saveData.type,
      originalFile: saveData.originalFile
    })
    hasUnsavedChanges.value = false
  } catch (error) {
    console.error('Error saving document:', error)
    error.value = `Erreur lors de la sauvegarde du document: ${error.message}`
  }
}

const handleDocumentError = (documentError) => {
  console.error('Document viewer error:', documentError)
  error.value = `Erreur d'affichage du document: ${documentError.message || documentError}`
}

const handleLocalAppError = (localAppError) => {
  console.error('Local application error:', localAppError)
  error.value = `Erreur d'ouverture locale: ${localAppError.message || localAppError}`
}

// Keyboard event handler
const handleKeydown = (event) => {
  if (!props.isOpen) return
  
  switch (event.key) {
    case 'Escape':
      handleClose()
      break
    case 'ArrowLeft':
      if (!event.ctrlKey && !event.altKey) {
        handlePreviousFile()
      }
      break
    case 'ArrowRight':
      if (!event.ctrlKey && !event.altKey) {
        handleNextFile()
      }
      break
    case 's':
      if (event.ctrlKey) {
        event.preventDefault()
        handleSave()
      }
      break
    case 'Tab':
      if (content.value?.metadata?.canSwitchModes && canEdit.value) {
        event.preventDefault()
        toggleEditMode()
      }
      break
    case 'r':
      if (event.ctrlKey && error.value) {
        event.preventDefault()
        handleRetry()
      }
      break
    case 'd':
      if (event.ctrlKey) {
        event.preventDefault()
        handleDownload()
      }
      break
  }
}

// Watchers
watch(() => props.isOpen, async (newValue) => {
  if (newValue) {
    await nextTick()
    
    // Set focus and announce opening
    accessibilityManager.setFocus(modalContainer.value, { announce: true })
    accessibilityManager.announce('Visualiseur de fichiers ouvert', 'polite')
    
    if (props.file) {
      loadFileContent()
    }
  } else {
    // Announce closing
    accessibilityManager.announce('Visualiseur de fichiers fermé', 'polite')
    
    // Reset state when closing
    content.value = null
    error.value = null
    hasUnsavedChanges.value = false
    handlerName.value = null
    showHelp.value = false
    currentContext.value = 'global'
    
    // Restore focus
    accessibilityManager.restoreFocus()
  }
})

watch(() => props.file, (newFile) => {
  if (newFile && props.isOpen) {
    loadFileContent()
  }
})

watch(() => props.mode, (newMode) => {
  if (newMode) {
    announceMode(newMode)
  }
})

watch(() => content.value, (newContent) => {
  if (newContent) {
    announceContentLoaded(newContent)
  }
})

watch(() => error.value, (newError) => {
  if (newError) {
    announceError(newError)
  }
})

watch(() => hasUnsavedChanges.value, (hasChanges) => {
  if (hasChanges) {
    accessibilityManager.announce('Modifications non sauvegardées détectées', 'polite')
  }
})

// Initialize keyboard shortcuts and accessibility
const initializeAccessibility = () => {
  // Initialize keyboard shortcuts
  initializeFileViewerShortcuts({
    close: handleClose,
    save: handleSave,
    download: handleDownload,
    retry: handleRetry,
    toggleMode: toggleEditMode,
    showHelp: toggleHelp,
    toggleFullscreen: toggleFullscreen,
    previousFile: handlePreviousFile,
    nextFile: handleNextFile,
    firstFile: () => console.log('First file - not implemented'),
    lastFile: () => console.log('Last file - not implemented')
  })

  // Set up accessibility announcements
  accessibilityManager.announce('Visualiseur de fichiers ouvert', 'polite')
}

const toggleHelp = () => {
  showHelp.value = !showHelp.value
  
  if (showHelp.value) {
    accessibilityManager.announce('Aide des raccourcis clavier affichée', 'polite')
  } else {
    accessibilityManager.announce('Aide des raccourcis clavier fermée', 'polite')
  }
}

const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    modalContainer.value?.requestFullscreen?.()
    isFullscreen.value = true
    accessibilityManager.announce('Mode plein écran activé', 'polite')
  } else {
    document.exitFullscreen?.()
    isFullscreen.value = false
    accessibilityManager.announce('Mode plein écran désactivé', 'polite')
  }
}

const updateAccessibilityContext = (newContext) => {
  currentContext.value = newContext
  keyboardShortcuts.setContext(newContext)
  
  // Announce context change
  const contextNames = {
    'global': 'général',
    'text': 'éditeur de texte',
    'image': 'visualiseur d\'images',
    'pdf': 'visualiseur PDF',
    'media': 'lecteur multimédia',
    'document': 'visualiseur de documents'
  }
  
  const contextName = contextNames[newContext] || newContext
  accessibilityManager.announce(`Contexte ${contextName}`, 'polite')
}

const announceContentLoaded = (content) => {
  if (!content) return
  
  const description = accessibilityManager.createContentDescription(content, props.file)
  accessibilityManager.announce(`Fichier chargé: ${description}`, 'polite')
  
  // Update context based on content type
  const contextMap = {
    'text': 'text',
    'image': 'image',
    'pdf': 'pdf',
    'video': 'media',
    'audio': 'media',
    'document': 'document',
    'word': 'document',
    'excel': 'document',
    'powerpoint': 'document'
  }
  
  const newContext = contextMap[content.type] || 'global'
  updateAccessibilityContext(newContext)
}

const announceError = (error) => {
  if (!error) return
  
  const errorMessage = error instanceof FileViewerError 
    ? error.toUserMessage() 
    : error.toString()
  
  accessibilityManager.announce(`Erreur: ${errorMessage}`, 'assertive')
}

const announceSaveStatus = (success, message = '') => {
  if (success) {
    accessibilityManager.announce('Fichier sauvegardé avec succès', 'polite')
  } else {
    accessibilityManager.announce(`Erreur de sauvegarde: ${message}`, 'assertive')
  }
}

const announceMode = (mode) => {
  const modeNames = {
    'view': 'lecture',
    'edit': 'édition'
  }
  
  const modeName = modeNames[mode] || mode
  accessibilityManager.announce(`Mode ${modeName} activé`, 'polite')
}

// Enhanced keyboard event handler with accessibility
const handleKeyboardEvent = (event) => {
  if (!props.isOpen || !keyboardShortcutsEnabled.value) return
  
  // Let the keyboard shortcuts manager handle the event
  const handled = keyboardShortcuts.handleKeyEvent(event)
  
  if (!handled) {
    // Handle additional accessibility-specific shortcuts
    switch (event.key) {
      case 'F1':
        if (!event.ctrlKey && !event.altKey) {
          event.preventDefault()
          toggleHelp()
        }
        break
      case 'F11':
        if (!event.ctrlKey && !event.altKey) {
          event.preventDefault()
          toggleFullscreen()
        }
        break
    }
  }
}

// Lifecycle
onMounted(() => {
  // Detect device capabilities
  isLowEndDevice.value = perfUtils.isLowEndDevice()
  
  // Set up event listeners
  document.addEventListener('keydown', handleKeyboardEvent)
  memoryManager.registerEventListener(document, 'keydown', handleKeyboardEvent)
  
  // Initialize accessibility features
  initializeAccessibility()
  
  // Listen for fullscreen changes
  const fullscreenHandler = () => {
    isFullscreen.value = !!document.fullscreenElement
  }
  document.addEventListener('fullscreenchange', fullscreenHandler)
  memoryManager.registerEventListener(document, 'fullscreenchange', fullscreenHandler)
  
  // Set up performance monitoring
  const performanceUpdateInterval = setInterval(() => {
    memoryStats.value = memoryManager.getMemoryStats()
    progressOperations.value = progressIndicator.getActiveOperations()
  }, 5000)
  memoryManager.registerInterval(performanceUpdateInterval)
  
  // Set up progress indicator callback
  const progressUnsubscribe = progressIndicator.onProgress((event, progress) => {
    if (event === 'update') {
      loadingMessage.value = progress.label || loadingMessage.value
    }
  })
  memoryManager.registerCleanupCallback(progressUnsubscribe)
  
  // Preload components for better performance
  if (!isLowEndDevice.value) {
    componentLoader.preloadComponents([
      { name: 'TextEditor', importFunction: () => import('./TextEditor.vue') },
      { name: 'ImageEditor', importFunction: () => import('./ImageEditor.vue') }
    ]).catch(error => {
      console.warn('Failed to preload components:', error)
    })
  }
  
  // Set up focus management
  if (props.isOpen) {
    nextTick(() => {
      modalContainer.value?.focus()
    })
  }
  
  // Monitor memory usage and warn if high
  const memoryCheckInterval = setInterval(() => {
    const stats = memoryManager.getMemoryStats()
    if (stats.jsHeapSize > stats.jsHeapSizeLimit * 0.8) {
      console.warn('High memory usage detected:', stats)
      // Could trigger cleanup or show warning to user
    }
  }, 30000) // Check every 30 seconds
  memoryManager.registerInterval(memoryCheckInterval)
})

onUnmounted(() => {
  // Perform comprehensive cleanup
  performCleanup()
  
  // Clean up accessibility
  accessibilityManager.clearAnnouncements()
  
  // Restore focus if needed
  accessibilityManager.restoreFocus()
  
  // Clear component cache if needed
  if (isLowEndDevice.value) {
    componentLoader.clearCache()
  }
})
</script>

<style scoped>
@keyframes fade-in {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.animate-fade-in {
  animation: fade-in 0.2s ease-out;
}

/* Respect reduced motion preference */
@media (prefers-reduced-motion: reduce) {
  .animate-fade-in {
    animation: none;
  }
}

/* Ensure modal takes full viewport */
.fixed.inset-0 {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
}

/* Fullscreen modal styles */
.fullscreen-modal {
  background: rgba(0, 0, 0, 1) !important;
}

/* Focus styles for accessibility */
.modal-container:focus {
  outline: 2px solid hsl(var(--primary));
  outline-offset: 2px;
}

/* Enhanced focus styles for interactive elements */
button:focus-visible,
a:focus-visible,
[tabindex]:focus-visible {
  outline: 2px solid hsl(var(--primary));
  outline-offset: 2px;
  border-radius: 4px;
}

/* Skip links styling */
.skip-link:focus {
  position: static !important;
  left: auto !important;
  width: auto !important;
  height: auto !important;
  overflow: visible !important;
  clip: auto !important;
  white-space: normal !important;
}

/* Screen reader only content */
.sr-only {
  position: absolute !important;
  width: 1px !important;
  height: 1px !important;
  padding: 0 !important;
  margin: -1px !important;
  overflow: hidden !important;
  clip: rect(0, 0, 0, 0) !important;
  white-space: nowrap !important;
  border: 0 !important;
}

/* Keyboard shortcut styling */
.kbd {
  display: inline-block;
  padding: 0.125rem 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1;
  color: hsl(var(--base-content));
  background-color: hsl(var(--base-200));
  border: 1px solid hsl(var(--base-300));
  border-radius: 0.25rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .modal-container:focus {
    outline: 3px solid;
  }
  
  button:focus-visible,
  a:focus-visible,
  [tabindex]:focus-visible {
    outline: 3px solid;
  }
  
  .kbd {
    border-width: 2px;
  }
}

/* Scrollbar styling for content area */
.overflow-auto::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.overflow-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-auto::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

.overflow-auto::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}

/* Ensure proper color contrast for text */
.text-base-content\/70 {
  color: hsl(var(--base-content) / 0.7);
}

.text-base-content\/50 {
  color: hsl(var(--base-content) / 0.5);
}

/* Loading spinner accessibility */
.loading {
  pointer-events: none;
}

/* Error state styling */
[role="alert"] {
  border: 1px solid hsl(var(--error));
  border-radius: 0.5rem;
  background-color: hsl(var(--error) / 0.1);
}

/* Status message styling */
[role="status"] {
  border: 1px solid hsl(var(--info));
  border-radius: 0.5rem;
  background-color: hsl(var(--info) / 0.1);
}

/* Toolbar styling */
[role="toolbar"] {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Help panel styling */
#help-panel {
  max-height: 300px;
  overflow-y: auto;
}

#help-panel h3 {
  color: hsl(var(--primary));
  font-weight: 600;
}

#help-panel ul {
  list-style: none;
  padding: 0;
}

#help-panel li {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.125rem 0;
}

/* Responsive design for help panel */
@media (max-width: 768px) {
  #help-panel .grid {
    grid-template-columns: 1fr;
  }
}

/* Print styles */
@media print {
  .skip-links,
  [role="toolbar"],
  #help-panel {
    display: none !important;
  }
  
  .fullscreen-modal {
    background: white !important;
  }
}
</style>