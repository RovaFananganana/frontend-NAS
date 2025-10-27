<template>
  <div class="media-viewer" :class="{ 'fullscreen': isFullscreen }">
    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Chargement du média...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-container">
      <div class="error-icon">⚠️</div>
      <p class="error-message">{{ error }}</p>
      <button @click="retry" class="retry-button">Réessayer</button>
    </div>

    <!-- Video Player -->
    <div v-else-if="mediaType === 'video'" class="video-container">
      <video
        ref="videoElement"
        :src="mediaUrl"
        :poster="posterUrl"
        @loadstart="onLoadStart"
        @loadedmetadata="onLoadedMetadata"
        @loadeddata="onLoadedData"
        @canplay="onCanPlay"
        @play="onPlay"
        @pause="onPause"
        @ended="onEnded"
        @timeupdate="onTimeUpdate"
        @error="onError"
        @click="togglePlayPause"
        class="video-element"
        preload="metadata"
      >
        Votre navigateur ne supporte pas la lecture vidéo.
      </video>

      <!-- Video Controls -->
      <div class="video-controls" :class="{ 'visible': showControls }">
        <div class="progress-container">
          <div class="progress-bar" @click="seekTo">
            <div class="progress-filled" :style="{ width: progressPercent + '%' }"></div>
            <div class="progress-handle" :style="{ left: progressPercent + '%' }"></div>
          </div>
        </div>

        <div class="controls-row">
          <div class="left-controls">
            <button @click="togglePlayPause" class="control-button play-pause">
              <span v-if="isPlaying">⏸️</span>
              <span v-else>▶️</span>
            </button>
            <div class="time-display">
              {{ formatTime(currentTime) }} / {{ formatTime(duration) }}
            </div>
          </div>

          <div class="right-controls">
            <div class="volume-control">
              <button @click="toggleMute" class="control-button volume">
                <span v-if="isMuted || volume === 0">🔇</span>
                <span v-else-if="volume < 0.5">🔉</span>
                <span v-else>🔊</span>
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                v-model="volume"
                @input="updateVolume"
                class="volume-slider"
              />
            </div>
            <button @click="toggleFullscreen" class="control-button fullscreen">
              <span v-if="isFullscreen">⛶</span>
              <span v-else>⛶</span>
            </button>
            <button @click="showHelp = !showHelp" class="control-button help" title="Raccourcis clavier (H)">
              ❓
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Audio Player -->
    <div v-else-if="mediaType === 'audio'" class="audio-container">
      <audio
        ref="audioElement"
        :src="mediaUrl"
        @loadstart="onLoadStart"
        @loadedmetadata="onLoadedMetadata"
        @loadeddata="onLoadedData"
        @canplay="onCanPlay"
        @play="onPlay"
        @pause="onPause"
        @ended="onEnded"
        @timeupdate="onTimeUpdate"
        @error="onError"
        preload="metadata"
      >
        Votre navigateur ne supporte pas la lecture audio.
      </audio>

      <!-- Audio Waveform Visualization -->
      <div class="waveform-container" v-if="waveformData">
        <div class="waveform" @click="seekToWaveform">
          <div
            v-for="(height, index) in waveformData"
            :key="index"
            class="waveform-bar"
            :class="{ 'played': (index / waveformData.length) <= (currentTime / duration) }"
            :style="{ height: height + '%' }"
          ></div>
        </div>
        <div class="waveform-progress" :style="{ width: progressPercent + '%' }"></div>
      </div>

      <!-- Audio Controls -->
      <div class="audio-controls">
        <div class="main-controls">
          <button @click="togglePlayPause" class="control-button play-pause large">
            <span v-if="isPlaying">⏸️</span>
            <span v-else>▶️</span>
          </button>
        </div>

        <div class="progress-container">
          <div class="time-display">{{ formatTime(currentTime) }}</div>
          <div class="progress-bar" @click="seekTo">
            <div class="progress-filled" :style="{ width: progressPercent + '%' }"></div>
            <div class="progress-handle" :style="{ left: progressPercent + '%' }"></div>
          </div>
          <div class="time-display">{{ formatTime(duration) }}</div>
        </div>

        <div class="volume-control">
          <button @click="toggleMute" class="control-button volume">
            <span v-if="isMuted || volume === 0">🔇</span>
            <span v-else-if="volume < 0.5">🔉</span>
            <span v-else>🔊</span>
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            v-model="volume"
            @input="updateVolume"
            class="volume-slider"
          />
          <button @click="showHelp = !showHelp" class="control-button help" title="Raccourcis clavier (H)">
            ❓
          </button>
        </div>
      </div>
    </div>

    <!-- Media Info -->
    <div class="media-info" v-if="metadata && showInfo">
      <h3>Informations du média</h3>
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">Nom:</span>
          <span class="info-value">{{ metadata.filename }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Type:</span>
          <span class="info-value">{{ metadata.mimeType }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Durée:</span>
          <span class="info-value">{{ metadata.durationFormatted }}</span>
        </div>
        <div class="info-item" v-if="metadata.width && metadata.height">
          <span class="info-label">Résolution:</span>
          <span class="info-value">{{ metadata.width }}x{{ metadata.height }}</span>
        </div>
        <div class="info-item" v-if="metadata.size">
          <span class="info-label">Taille:</span>
          <span class="info-value">{{ formatFileSize(metadata.size) }}</span>
        </div>
      </div>
    </div>

    <!-- Keyboard Shortcuts Help -->
    <div class="help-overlay" v-if="showHelp" @click="showHelp = false">
      <div class="help-content" @click.stop>
        <h3>Raccourcis clavier</h3>
        <div class="help-grid">
          <div class="help-section">
            <h4>Lecture</h4>
            <div class="help-item">
              <span class="help-key">Espace</span>
              <span class="help-desc">Lecture/Pause</span>
            </div>
            <div class="help-item">
              <span class="help-key">← →</span>
              <span class="help-desc">Avancer/Reculer 10s</span>
            </div>
            <div class="help-item">
              <span class="help-key">Shift + ← →</span>
              <span class="help-desc">Avancer/Reculer 30s</span>
            </div>
            <div class="help-item">
              <span class="help-key">0-9</span>
              <span class="help-desc">Aller à 0%-90%</span>
            </div>
            <div class="help-item">
              <span class="help-key">Home/End</span>
              <span class="help-desc">Début/Fin</span>
            </div>
          </div>
          <div class="help-section">
            <h4>Audio</h4>
            <div class="help-item">
              <span class="help-key">↑ ↓</span>
              <span class="help-desc">Volume +/-</span>
            </div>
            <div class="help-item">
              <span class="help-key">M</span>
              <span class="help-desc">Muet</span>
            </div>
          </div>
          <div class="help-section" v-if="mediaType === 'video'">
            <h4>Vidéo</h4>
            <div class="help-item">
              <span class="help-key">F</span>
              <span class="help-desc">Plein écran</span>
            </div>
          </div>
          <div class="help-section">
            <h4>Interface</h4>
            <div class="help-item">
              <span class="help-key">I</span>
              <span class="help-desc">Infos média</span>
            </div>
            <div class="help-item">
              <span class="help-key">H ou ?</span>
              <span class="help-desc">Cette aide</span>
            </div>
          </div>
        </div>
        <div class="help-footer">
          <button @click="showHelp = false" class="help-close-btn">Fermer</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MediaViewer',
  props: {
    content: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      loading: true,
      error: null,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      volume: 1,
      isMuted: false,
      isFullscreen: false,
      showControls: true,
      showInfo: false,
      showHelp: false,
      controlsTimeout: null,
      waveformData: null
    }
  },
  computed: {
    mediaType() {
      return this.content?.metadata?.mediaType || 'video'
    },
    mediaUrl() {
      return this.content?.url || this.content?.content
    },
    metadata() {
      return this.content?.metadata || {}
    },
    posterUrl() {
      // Could be implemented to show video thumbnail
      return null
    },
    progressPercent() {
      if (!this.duration) return 0
      return (this.currentTime / this.duration) * 100
    },
    mediaElement() {
      return this.mediaType === 'video' ? this.$refs.videoElement : this.$refs.audioElement
    }
  },
  mounted() {
    this.initializeMedia()
    this.setupKeyboardShortcuts()
    this.setupMouseEvents()
  },
  beforeUnmount() {
    this.cleanup()
  },
  methods: {
    initializeMedia() {
      if (this.content?.error) {
        this.error = this.content.error
        this.loading = false
        return
      }

      if (!this.mediaUrl) {
        this.error = 'URL du média non disponible'
        this.loading = false
        return
      }

      // Set waveform data for audio
      if (this.mediaType === 'audio' && this.metadata.waveform) {
        this.waveformData = this.metadata.waveform
      }

      // Set initial volume
      this.volume = 0.8
    },

    // Media Event Handlers
    onLoadStart() {
      this.loading = true
      this.error = null
    },

    onLoadedMetadata() {
      if (this.mediaElement) {
        this.duration = this.mediaElement.duration || 0
        this.mediaElement.volume = this.volume
      }
    },

    onLoadedData() {
      this.loading = false
    },

    onCanPlay() {
      this.loading = false
    },

    onPlay() {
      this.isPlaying = true
    },

    onPause() {
      this.isPlaying = false
    },

    onEnded() {
      this.isPlaying = false
      this.currentTime = 0
    },

    onTimeUpdate() {
      if (this.mediaElement) {
        this.currentTime = this.mediaElement.currentTime || 0
      }
    },

    onError(event) {
      console.error('Media error:', event)
      this.loading = false
      this.error = 'Erreur lors du chargement du média'
    },

    // Playback Controls
    togglePlayPause() {
      if (!this.mediaElement) return

      if (this.isPlaying) {
        this.mediaElement.pause()
      } else {
        this.mediaElement.play().catch(error => {
          console.error('Play error:', error)
          this.error = 'Impossible de lire le média'
        })
      }
    },

    seekTo(event) {
      if (!this.mediaElement || !this.duration) return

      const rect = event.currentTarget.getBoundingClientRect()
      const percent = (event.clientX - rect.left) / rect.width
      const newTime = percent * this.duration

      this.mediaElement.currentTime = Math.max(0, Math.min(newTime, this.duration))
    },

    seekToWaveform(event) {
      this.seekTo(event)
    },

    updateVolume() {
      if (this.mediaElement) {
        this.mediaElement.volume = this.volume
        this.isMuted = this.volume === 0
      }
    },

    toggleMute() {
      if (!this.mediaElement) return

      if (this.isMuted) {
        this.mediaElement.volume = this.volume || 0.8
        this.isMuted = false
      } else {
        this.mediaElement.volume = 0
        this.isMuted = true
      }
    },

    toggleFullscreen() {
      if (this.mediaType !== 'video') return

      if (!this.isFullscreen) {
        this.enterFullscreen()
      } else {
        this.exitFullscreen()
      }
    },

    enterFullscreen() {
      const container = this.$el
      if (container.requestFullscreen) {
        container.requestFullscreen()
      } else if (container.webkitRequestFullscreen) {
        container.webkitRequestFullscreen()
      } else if (container.mozRequestFullScreen) {
        container.mozRequestFullScreen()
      }
    },

    exitFullscreen() {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen()
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen()
      }
    },

    // Utility Methods
    formatTime(seconds) {
      if (!seconds || isNaN(seconds) || !isFinite(seconds)) {
        return '0:00'
      }

      const hours = Math.floor(seconds / 3600)
      const minutes = Math.floor((seconds % 3600) / 60)
      const secs = Math.floor(seconds % 60)

      if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      } else {
        return `${minutes}:${secs.toString().padStart(2, '0')}`
      }
    },

    formatFileSize(bytes) {
      if (!bytes) return '0 B'
      
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(1024))
      return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
    },

    retry() {
      this.error = null
      this.loading = true
      if (this.mediaElement) {
        this.mediaElement.load()
      }
    },

    // Keyboard Shortcuts
    setupKeyboardShortcuts() {
      document.addEventListener('keydown', this.handleKeydown)
      // Listen for fullscreen changes
      document.addEventListener('fullscreenchange', this.handleFullscreenChange)
      document.addEventListener('webkitfullscreenchange', this.handleFullscreenChange)
      document.addEventListener('mozfullscreenchange', this.handleFullscreenChange)
    },

    handleKeydown(event) {
      // Only handle shortcuts when media viewer is focused or no other input is focused
      const activeElement = document.activeElement
      const isInputFocused = activeElement && (
        activeElement.tagName === 'INPUT' || 
        activeElement.tagName === 'TEXTAREA' || 
        activeElement.contentEditable === 'true'
      )
      
      if (isInputFocused) {
        return
      }

      // Check if the media viewer is visible and active
      if (!this.$el || !this.$el.offsetParent) {
        return
      }

      switch (event.code) {
        case 'Space':
          event.preventDefault()
          this.togglePlayPause()
          break
        case 'ArrowLeft':
          event.preventDefault()
          if (event.shiftKey) {
            this.skipBackward(30) // Skip 30 seconds with Shift
          } else {
            this.skipBackward(10) // Skip 10 seconds normally
          }
          break
        case 'ArrowRight':
          event.preventDefault()
          if (event.shiftKey) {
            this.skipForward(30) // Skip 30 seconds with Shift
          } else {
            this.skipForward(10) // Skip 10 seconds normally
          }
          break
        case 'ArrowUp':
          event.preventDefault()
          this.volumeUp()
          break
        case 'ArrowDown':
          event.preventDefault()
          this.volumeDown()
          break
        case 'KeyM':
          event.preventDefault()
          this.toggleMute()
          break
        case 'KeyF':
          if (this.mediaType === 'video') {
            event.preventDefault()
            this.toggleFullscreen()
          }
          break
        case 'KeyI':
          event.preventDefault()
          this.showInfo = !this.showInfo
          break
        case 'KeyH':
        case 'Slash':
          event.preventDefault()
          this.showHelp = !this.showHelp
          break
        case 'Digit0':
        case 'Numpad0':
          event.preventDefault()
          this.seekToPercent(0)
          break
        case 'Digit1':
        case 'Numpad1':
          event.preventDefault()
          this.seekToPercent(10)
          break
        case 'Digit2':
        case 'Numpad2':
          event.preventDefault()
          this.seekToPercent(20)
          break
        case 'Digit3':
        case 'Numpad3':
          event.preventDefault()
          this.seekToPercent(30)
          break
        case 'Digit4':
        case 'Numpad4':
          event.preventDefault()
          this.seekToPercent(40)
          break
        case 'Digit5':
        case 'Numpad5':
          event.preventDefault()
          this.seekToPercent(50)
          break
        case 'Digit6':
        case 'Numpad6':
          event.preventDefault()
          this.seekToPercent(60)
          break
        case 'Digit7':
        case 'Numpad7':
          event.preventDefault()
          this.seekToPercent(70)
          break
        case 'Digit8':
        case 'Numpad8':
          event.preventDefault()
          this.seekToPercent(80)
          break
        case 'Digit9':
        case 'Numpad9':
          event.preventDefault()
          this.seekToPercent(90)
          break
        case 'Home':
          event.preventDefault()
          this.seekToPercent(0)
          break
        case 'End':
          event.preventDefault()
          this.seekToPercent(100)
          break
      }
    },

    handleFullscreenChange() {
      this.isFullscreen = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement
      )
    },

    skipBackward(seconds = 10) {
      if (this.mediaElement) {
        this.mediaElement.currentTime = Math.max(0, this.mediaElement.currentTime - seconds)
      }
    },

    skipForward(seconds = 10) {
      if (this.mediaElement) {
        this.mediaElement.currentTime = Math.min(this.duration, this.mediaElement.currentTime + seconds)
      }
    },

    seekToPercent(percent) {
      if (this.mediaElement && this.duration) {
        const newTime = (percent / 100) * this.duration
        this.mediaElement.currentTime = Math.max(0, Math.min(newTime, this.duration))
      }
    },

    volumeUp() {
      this.volume = Math.min(1, this.volume + 0.1)
      this.updateVolume()
    },

    volumeDown() {
      this.volume = Math.max(0, this.volume - 0.1)
      this.updateVolume()
    },

    // Mouse Events for Video Controls
    setupMouseEvents() {
      if (this.mediaType === 'video') {
        this.$el.addEventListener('mousemove', this.showVideoControls)
        this.$el.addEventListener('mouseleave', this.hideVideoControls)
      }
    },

    showVideoControls() {
      this.showControls = true
      if (this.controlsTimeout) {
        clearTimeout(this.controlsTimeout)
      }
      this.controlsTimeout = setTimeout(() => {
        if (this.isPlaying) {
          this.showControls = false
        }
      }, 3000)
    },

    hideVideoControls() {
      if (this.isPlaying) {
        this.showControls = false
      }
    },

    // Cleanup
    cleanup() {
      document.removeEventListener('keydown', this.handleKeydown)
      document.removeEventListener('fullscreenchange', this.handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', this.handleFullscreenChange)
      document.removeEventListener('mozfullscreenchange', this.handleFullscreenChange)
      
      if (this.controlsTimeout) {
        clearTimeout(this.controlsTimeout)
      }
      
      // Clean up object URLs if needed
      if (this.mediaUrl && this.mediaUrl.startsWith('blob:')) {
        URL.revokeObjectURL(this.mediaUrl)
      }
    }
  }
}
</script>

<style scoped>
.media-viewer {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #000;
  color: #fff;
  position: relative;
}

.media-viewer.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
}

/* Loading State */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  gap: 1rem;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #333;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Error State */
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  gap: 1rem;
}

.error-icon {
  font-size: 3rem;
}

.error-message {
  color: #ff6b6b;
  text-align: center;
}

.retry-button {
  padding: 0.5rem 1rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.retry-button:hover {
  background: #0056b3;
}

/* Video Container */
.video-container {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.video-element {
  max-width: 100%;
  max-height: 100%;
  cursor: pointer;
}

/* Video Controls */
.video-controls {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0,0,0,0.8));
  padding: 1rem;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.video-controls.visible {
  opacity: 1;
}

.progress-container {
  margin-bottom: 0.5rem;
}

.progress-bar {
  height: 6px;
  background: rgba(255,255,255,0.3);
  border-radius: 3px;
  cursor: pointer;
  position: relative;
}

.progress-filled {
  height: 100%;
  background: #007bff;
  border-radius: 3px;
  transition: width 0.1s ease;
}

.progress-handle {
  position: absolute;
  top: -4px;
  width: 14px;
  height: 14px;
  background: #007bff;
  border-radius: 50%;
  transform: translateX(-50%);
}

.controls-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.left-controls,
.right-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

/* Audio Container */
.audio-container {
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  min-height: 400px;
}

/* Waveform */
.waveform-container {
  position: relative;
  height: 120px;
  background: #1a1a1a;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
}

.waveform {
  display: flex;
  align-items: end;
  height: 100%;
  padding: 10px;
  gap: 2px;
}

.waveform-bar {
  flex: 1;
  background: #333;
  min-height: 4px;
  border-radius: 2px;
  transition: background-color 0.2s ease;
}

.waveform-bar.played {
  background: #007bff;
}

.waveform-progress {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: rgba(0, 123, 255, 0.1);
  pointer-events: none;
}

/* Audio Controls */
.audio-controls {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  align-items: center;
}

.main-controls {
  display: flex;
  justify-content: center;
}

.progress-container {
  display: flex;
  align-items: center;
  gap: 1rem;
  width: 100%;
  max-width: 600px;
}

.progress-container .progress-bar {
  flex: 1;
  height: 8px;
  background: #333;
  border-radius: 4px;
  cursor: pointer;
  position: relative;
}

/* Control Buttons */
.control-button {
  background: none;
  border: none;
  color: #fff;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.control-button:hover {
  background: rgba(255,255,255,0.1);
}

.control-button.large {
  font-size: 2rem;
  padding: 1rem;
}

.control-button.play-pause {
  font-size: 1.5rem;
}

/* Volume Control */
.volume-control {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.volume-slider {
  width: 80px;
  height: 4px;
  background: #333;
  outline: none;
  border-radius: 2px;
  cursor: pointer;
}

.volume-slider::-webkit-slider-thumb {
  appearance: none;
  width: 16px;
  height: 16px;
  background: #007bff;
  border-radius: 50%;
  cursor: pointer;
}

.volume-slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background: #007bff;
  border-radius: 50%;
  cursor: pointer;
  border: none;
}

/* Time Display */
.time-display {
  font-family: monospace;
  font-size: 0.9rem;
  color: #ccc;
  min-width: 60px;
  text-align: center;
}

/* Media Info */
.media-info {
  background: #1a1a1a;
  padding: 1rem;
  border-radius: 8px;
  margin: 1rem;
}

.media-info h3 {
  margin: 0 0 1rem 0;
  color: #fff;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.5rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
}

.info-label {
  font-weight: bold;
  color: #ccc;
}

.info-value {
  color: #fff;
}

/* Help Overlay */
.help-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.help-content {
  background: #1a1a1a;
  border-radius: 12px;
  padding: 2rem;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  border: 1px solid #333;
}

.help-content h3 {
  margin: 0 0 1.5rem 0;
  color: #fff;
  text-align: center;
  font-size: 1.5rem;
}

.help-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.help-section h4 {
  margin: 0 0 1rem 0;
  color: #007bff;
  font-size: 1.1rem;
  border-bottom: 1px solid #333;
  padding-bottom: 0.5rem;
}

.help-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.help-key {
  background: #333;
  color: #fff;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.9rem;
  min-width: 60px;
  text-align: center;
}

.help-desc {
  color: #ccc;
  flex: 1;
  margin-left: 1rem;
}

.help-footer {
  text-align: center;
  border-top: 1px solid #333;
  padding-top: 1rem;
}

.help-close-btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 0.5rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
}

.help-close-btn:hover {
  background: #0056b3;
}

/* Responsive Design */
@media (max-width: 768px) {
  .audio-container {
    padding: 1rem;
  }
  
  .controls-row {
    flex-direction: column;
    gap: 1rem;
  }
  
  .left-controls,
  .right-controls {
    justify-content: center;
  }
  
  .progress-container {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .progress-container .progress-bar {
    width: 100%;
  }
  
  .time-display {
    min-width: auto;
  }

  .help-content {
    margin: 1rem;
    padding: 1.5rem;
    max-width: none;
  }
  
  .help-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}
</style>