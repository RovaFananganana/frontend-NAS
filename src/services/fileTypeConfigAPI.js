/**
 * @fileoverview API service for file type configuration management
 */

import { httpClient } from './httpClient'

const BASE_URL = '/api/file-type-config'

export const fileTypeConfigAPI = {
  // Public endpoints
  async getSupportedTypes() {
    const response = await httpClient.get(`${BASE_URL}/supported-types`)
    return response.data
  },

  async validateFile(fileData) {
    const response = await httpClient.post(`${BASE_URL}/validate`, fileData)
    return response.data
  },

  async getConfigForType(params) {
    const response = await httpClient.get(`${BASE_URL}/config-for-type`, { params })
    return response.data
  },

  // Admin endpoints
  async getAllConfigs(includeDisabled = true) {
    const response = await httpClient.get(`${BASE_URL}/`, {
      params: { include_disabled: includeDisabled }
    })
    return response.data
  },

  async getConfig(configId) {
    const response = await httpClient.get(`${BASE_URL}/${configId}`)
    return response.data
  },

  async createConfig(configData) {
    const response = await httpClient.post(`${BASE_URL}/`, configData)
    return response.data
  },

  async updateConfig(configId, configData) {
    const response = await httpClient.put(`${BASE_URL}/${configId}`, configData)
    return response.data
  },

  async deleteConfig(configId) {
    const response = await httpClient.delete(`${BASE_URL}/${configId}`)
    return response.data
  },

  async toggleConfig(configId) {
    const response = await httpClient.post(`${BASE_URL}/${configId}/toggle`)
    return response.data
  },

  async initializeDefaults() {
    const response = await httpClient.post(`${BASE_URL}/initialize-defaults`)
    return response.data
  },

  async bulkUpdateConfigs(configs) {
    const response = await httpClient.post(`${BASE_URL}/bulk-update`, { configs })
    return response.data
  }
}

export default fileTypeConfigAPI