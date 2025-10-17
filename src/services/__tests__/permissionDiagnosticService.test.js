// services/__tests__/permissionDiagnosticService.test.js

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { permissionDiagnosticService } from '../permissionDiagnosticService.js'

// Mock des dépendances
vi.mock('../nasAPI.js', () => ({
  nasAPI: {
    checkPermissions: vi.fn()
  }
}))

vi.mock('../tokenService.js', () => ({
  default: {
    getToken: vi.fn(() => 'mock-token')
  }
}))

// Mock de fetch
global.fetch = vi.fn()

describe('PermissionDiagnosticService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Configuration par défaut de fetch
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true })
    })
  })

  describe('diagnoseUserPermissions', () => {
    it('should diagnose user permissions successfully', async () => {
      // Mock des réponses API
      const mockUserInfo = {
        id: 1,
        username: 'testuser',
        role: 'user'
      }
      
      const mockUserGroups = [
        {
          id: 1,
          name: 'Test Group',
          permissions_on_path: {
            can_read: true,
            can_write: false,
            can_delete: false,
            can_share: false
          }
        }
      ]
      
      const mockCurrentPermissions = {
        can_read: true,
        can_write: false,
        can_delete: false,
        can_share: false
      }

      // Mock des méthodes internes
      vi.spyOn(permissionDiagnosticService, 'getUserInfo').mockResolvedValue(mockUserInfo)
      vi.spyOn(permissionDiagnosticService, 'getUserGroups').mockResolvedValue(mockUserGroups)
      vi.spyOn(permissionDiagnosticService, 'checkCurrentPermissions').mockResolvedValue(mockCurrentPermissions)
      vi.spyOn(permissionDiagnosticService, 'validatePermissionCache').mockResolvedValue({
        is_consistent: true,
        inconsistencies: []
      })

      const result = await permissionDiagnosticService.diagnoseUserPermissions(1, '/test/path')

      expect(result).toHaveProperty('user')
      expect(result).toHaveProperty('path', '/test/path')
      expect(result).toHaveProperty('current_permissions')
      expect(result).toHaveProperty('expected_permissions')
      expect(result).toHaveProperty('user_groups')
      expect(result).toHaveProperty('diagnosis')
      expect(result.user).toEqual(mockUserInfo)
    })

    it('should handle errors gracefully', async () => {
      vi.spyOn(permissionDiagnosticService, 'getUserInfo').mockRejectedValue(new Error('API Error'))

      await expect(
        permissionDiagnosticService.diagnoseUserPermissions(1, '/test/path')
      ).rejects.toThrow('Diagnostic failed: API Error')
    })
  })

  describe('compareUserPermissions', () => {
    it('should compare permissions between two users', async () => {
      const mockDiagnosis1 = {
        user: { id: 1, username: 'user1' },
        current_permissions: { can_read: true, can_write: false },
        user_groups: [{ name: 'Group1' }],
        cache_status: { is_consistent: true }
      }
      
      const mockDiagnosis2 = {
        user: { id: 2, username: 'user2' },
        current_permissions: { can_read: false, can_write: false },
        user_groups: [{ name: 'Group2' }],
        cache_status: { is_consistent: true }
      }

      vi.spyOn(permissionDiagnosticService, 'diagnoseUserPermissions')
        .mockResolvedValueOnce(mockDiagnosis1)
        .mockResolvedValueOnce(mockDiagnosis2)

      const result = await permissionDiagnosticService.compareUserPermissions(1, 2, '/test/path')

      expect(result).toHaveProperty('path', '/test/path')
      expect(result).toHaveProperty('user1')
      expect(result).toHaveProperty('user2')
      expect(result).toHaveProperty('differences')
      expect(result).toHaveProperty('potential_causes')
      expect(result).toHaveProperty('recommendations')
    })
  })

  describe('validatePermissionCache', () => {
    it('should return validation result with basic properties', async () => {
      const result = await permissionDiagnosticService.validatePermissionCache(1, '/test/path')

      // The method should always return these basic properties
      expect(result).toHaveProperty('is_consistent')
      expect(typeof result.is_consistent).toBe('boolean')
      
      // Should have either error or success structure
      expect(result).toSatisfy((obj) => {
        return obj.hasOwnProperty('is_consistent')
      })
    })
  })

  describe('simulateUserSession', () => {
    it('should simulate user session successfully', async () => {
      const mockDiagnosis = {
        user: { id: 1, username: 'testuser' },
        current_permissions: { can_read: true },
        user_groups: [{ name: 'TestGroup' }],
        cache_status: { is_consistent: true }
      }

      vi.spyOn(permissionDiagnosticService, 'diagnoseUserPermissions').mockResolvedValue(mockDiagnosis)

      const result = await permissionDiagnosticService.simulateUserSession(1, '/test/path')

      expect(result).toHaveProperty('user_id', 1)
      expect(result).toHaveProperty('path', '/test/path')
      expect(result).toHaveProperty('simulation_steps')
      expect(result).toHaveProperty('final_diagnosis')
      expect(result).toHaveProperty('overall_success')
      expect(Array.isArray(result.simulation_steps)).toBe(true)
    })
  })

  describe('generateDiagnosis', () => {
    it('should generate diagnosis with no issues when permissions match', () => {
      const userInfo = { id: 1, username: 'testuser' }
      const path = '/test/path'
      const currentPermissions = { can_read: true, can_write: false, can_delete: false, can_share: false }
      const expectedPermissions = { can_read: true, can_write: false, can_delete: false, can_share: false }
      const userGroups = [{ name: 'TestGroup' }]
      const cacheStatus = { is_consistent: true, inconsistencies: [] }

      const diagnosis = permissionDiagnosticService.generateDiagnosis(
        userInfo, path, currentPermissions, expectedPermissions, userGroups, cacheStatus
      )

      expect(diagnosis.issue_type).toBe('no_issues')
      expect(diagnosis.issues).toHaveLength(0)
      expect(diagnosis.severity).toBe('none')
    })

    it('should detect permission mismatches', () => {
      const userInfo = { id: 1, username: 'testuser' }
      const path = '/test/path'
      const currentPermissions = { can_read: false, can_write: false, can_delete: false, can_share: false }
      const expectedPermissions = { can_read: true, can_write: false, can_delete: false, can_share: false }
      const userGroups = [{ name: 'TestGroup' }]
      const cacheStatus = { is_consistent: true, inconsistencies: [] }

      const diagnosis = permissionDiagnosticService.generateDiagnosis(
        userInfo, path, currentPermissions, expectedPermissions, userGroups, cacheStatus
      )

      expect(diagnosis.issue_type).toBe('permission_mismatch')
      expect(diagnosis.issues).toHaveLength(1)
      expect(diagnosis.issues[0].type).toBe('permission_mismatch')
      expect(diagnosis.issues[0].permission).toBe('can_read')
    })

    it('should detect cache inconsistencies', () => {
      const userInfo = { id: 1, username: 'testuser' }
      const path = '/test/path'
      const currentPermissions = { can_read: true, can_write: false, can_delete: false, can_share: false }
      const expectedPermissions = { can_read: true, can_write: false, can_delete: false, can_share: false }
      const userGroups = [{ name: 'TestGroup' }]
      const cacheStatus = { 
        is_consistent: false, 
        inconsistencies: [{ type: 'cache_mismatch' }] 
      }

      const diagnosis = permissionDiagnosticService.generateDiagnosis(
        userInfo, path, currentPermissions, expectedPermissions, userGroups, cacheStatus
      )

      expect(diagnosis.issue_type).toBe('cache_inconsistency')
      expect(diagnosis.issues.some(issue => issue.type === 'cache_inconsistency')).toBe(true)
      expect(diagnosis.recommendations).toContain('Invalider le cache de permissions pour cet utilisateur')
    })
  })

  describe('analyzeDifferences', () => {
    it('should analyze differences between user diagnoses', () => {
      const user1Diagnosis = {
        current_permissions: { can_read: true, can_write: false },
        user_groups: [{ name: 'Group1' }, { name: 'CommonGroup' }],
        cache_status: { is_consistent: true }
      }
      
      const user2Diagnosis = {
        current_permissions: { can_read: false, can_write: false },
        user_groups: [{ name: 'Group2' }, { name: 'CommonGroup' }],
        cache_status: { is_consistent: false }
      }

      const differences = permissionDiagnosticService.analyzeDifferences(user1Diagnosis, user2Diagnosis)

      expect(differences.permissions.can_read).toEqual({
        user1: true,
        user2: false,
        different: true
      })
      
      expect(differences.groups.common_groups).toContain('CommonGroup')
      expect(differences.groups.user1_only).toContain('Group1')
      expect(differences.groups.user2_only).toContain('Group2')
      expect(differences.cache_status.both_consistent).toBe(false)
    })
  })
})