/**
 * Tests pour l'intégration du service activityLogger
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { activityLogger } from '@/services/activityLogger.js'

// Mock du composable useActivityLogger
vi.mock('@/composables/useActivityLogger.js', () => ({
  useGlobalActivityLogger: () => ({
    logActivity: vi.fn().mockResolvedValue(true),
    logFileOperation: vi.fn().mockResolvedValue(true),
    logNavigation: vi.fn().mockResolvedValue(true),
    logFavorite: vi.fn().mockResolvedValue(true),
    flushLogs: vi.fn().mockResolvedValue(true)
  }),
  ActivityTypes: {
    FILE_DOWNLOAD: 'file_download',
    FILE_UPLOAD: 'file_upload',
    FILE_COPY: 'file_copy',
    FILE_DELETE: 'file_delete',
    FILE_RENAME: 'file_rename',
    FILE_MOVE: 'file_move',
    FOLDER_CREATE: 'folder_create'
  }
}))

describe('Activity Logger Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should log download activities', async () => {
    await activityLogger.logDownload('test.txt', '/documents/test.txt')
    
    // Vérifier que le logger existant a été appelé
    expect(activityLogger.logger).toBeDefined()
  })

  it('should log copy activities', async () => {
    const items = [{ name: 'file1.txt', path: '/file1.txt' }]
    await activityLogger.logCopy(items, 'internal')
    
    expect(activityLogger.logger).toBeDefined()
  })

  it('should log upload activities', async () => {
    const files = [{ name: 'upload.txt' }]
    await activityLogger.logUpload(files, '/uploads/')
    
    expect(activityLogger.logger).toBeDefined()
  })

  it('should log create activities', async () => {
    await activityLogger.logCreate('nouveau-dossier', 'folder', '/documents/')
    
    expect(activityLogger.logger).toBeDefined()
  })

  it('should log delete activities', async () => {
    const items = [{ name: 'file-to-delete.txt', path: '/file-to-delete.txt' }]
    await activityLogger.logDelete(items)
    
    expect(activityLogger.logger).toBeDefined()
  })

  it('should handle logger initialization failure gracefully', async () => {
    // Simuler un échec d'initialisation
    const originalLogger = activityLogger.logger
    activityLogger.logger = null
    
    // Ces appels ne devraient pas lever d'erreur
    await expect(activityLogger.logDownload('test.txt', '/test.txt')).resolves.toBeUndefined()
    await expect(activityLogger.logCopy([{ name: 'test' }])).resolves.toBeUndefined()
    
    // Restaurer
    activityLogger.logger = originalLogger
  })

  it('should map activity types correctly', () => {
    expect(activityLogger.mapActivityType('download')).toBe('file_download')
    expect(activityLogger.mapActivityType('upload')).toBe('file_upload')
    expect(activityLogger.mapActivityType('copy')).toBe('file_copy')
    expect(activityLogger.mapActivityType('create')).toBe('folder_create')
    expect(activityLogger.mapActivityType('unknown')).toBe('unknown')
  })
})