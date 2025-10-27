<template>
  <div class="excel-viewer h-full flex flex-col bg-white">
    <!-- Excel Header -->
    <div class="excel-header flex items-center justify-between p-4 border-b bg-gray-50">
      <div class="excel-info">
        <h3 class="text-lg font-semibold text-gray-800">
          {{ excelData?.metadata?.filename || 'Feuille de calcul' }}
        </h3>
        <div class="text-sm text-gray-600 mt-1">
          {{ excelData?.metadata?.sheetCount }} feuille(s), 
          {{ excelData?.metadata?.totalCells }} cellules
          <span v-if="excelData?.metadata?.hasFormulas" class="ml-2 text-blue-600">
            <i class="fas fa-calculator"></i> Formules
          </span>
        </div>
      </div>
      
      <!-- Excel Controls -->
      <div class="excel-controls flex items-center space-x-2">
        <!-- Zoom Controls -->
        <div class="zoom-controls flex items-center space-x-1">
          <button 
            @click="zoomOut"
            :disabled="zoomLevel <= 0.5"
            class="btn btn-sm btn-ghost"
            title="Zoom arrière"
          >
            <i class="fas fa-search-minus"></i>
          </button>
          <span class="text-sm text-gray-600 min-w-[60px] text-center">
            {{ Math.round(zoomLevel * 100) }}%
          </span>
          <button 
            @click="zoomIn"
            :disabled="zoomLevel >= 2.0"
            class="btn btn-sm btn-ghost"
            title="Zoom avant"
          >
            <i class="fas fa-search-plus"></i>
          </button>
        </div>
        
        <!-- Edit Mode Toggle -->
        <button 
          v-if="excelData?.editable"
          @click="toggleEditMode"
          :class="['btn btn-sm', isEditMode ? 'btn-primary' : 'btn-outline']"
          title="Mode édition"
        >
          <i class="fas fa-edit"></i>
          {{ isEditMode ? 'Lecture' : 'Édition' }}
        </button>
        
        <!-- Export Options -->
        <div class="dropdown dropdown-end">
          <button tabindex="0" class="btn btn-sm btn-ghost" title="Exporter">
            <i class="fas fa-download"></i>
          </button>
          <ul tabindex="0" class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52">
            <li><a @click="exportSheet('xlsx')"><i class="fas fa-file-excel mr-2"></i>Excel (.xlsx)</a></li>
            <li><a @click="exportSheet('csv')"><i class="fas fa-file-csv mr-2"></i>CSV</a></li>
            <li><a @click="exportSheet('html')"><i class="fas fa-file-code mr-2"></i>HTML</a></li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Sheet Tabs -->
    <div class="sheet-tabs flex border-b bg-gray-50 overflow-x-auto">
      <button
        v-for="sheetName in excelData?.metadata?.sheetNames || []"
        :key="sheetName"
        @click="setActiveSheet(sheetName)"
        :class="[
          'sheet-tab px-4 py-2 text-sm border-r whitespace-nowrap transition-colors',
          activeSheet === sheetName 
            ? 'bg-white border-b-2 border-blue-500 text-blue-600 font-medium' 
            : 'text-gray-600 hover:bg-gray-100'
        ]"
      >
        {{ sheetName }}
        <span v-if="currentSheetData?.metadata" class="ml-2 text-xs text-gray-400">
          {{ currentSheetData.metadata.rowCount }}×{{ currentSheetData.metadata.colCount }}
        </span>
      </button>
    </div>
    
    <!-- Sheet Content -->
    <div class="sheet-content flex-1 overflow-auto">
      <div 
        v-if="currentSheetData"
        class="spreadsheet-container p-4"
        :style="{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left' }"
      >
        <!-- Edit Mode: Interactive Table -->
        <div v-if="isEditMode" class="editable-spreadsheet">
          <table class="excel-table w-full border-collapse">
            <thead>
              <tr>
                <th class="excel-cell excel-header-cell w-12">#</th>
                <th 
                  v-for="(col, colIndex) in getColumnHeaders(currentSheetData.data)"
                  :key="colIndex"
                  class="excel-cell excel-header-cell min-w-[100px]"
                >
                  {{ getColumnLetter(colIndex) }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr 
                v-for="(row, rowIndex) in currentSheetData.data"
                :key="rowIndex"
              >
                <td class="excel-cell excel-row-header">{{ rowIndex + 1 }}</td>
                <td 
                  v-for="(cell, colIndex) in row"
                  :key="colIndex"
                  class="excel-cell excel-data-cell"
                  @click="selectCell(rowIndex, colIndex)"
                  :class="{ 
                    'selected': selectedCell?.row === rowIndex && selectedCell?.col === colIndex,
                    'has-formula': isFormula(cell)
                  }"
                >
                  <input
                    v-if="selectedCell?.row === rowIndex && selectedCell?.col === colIndex"
                    v-model="editingValue"
                    @blur="finishCellEdit"
                    @keydown.enter="finishCellEdit"
                    @keydown.escape="cancelCellEdit"
                    class="cell-input w-full h-full border-none outline-none bg-transparent"
                    ref="cellInput"
                  />
                  <span v-else class="cell-content">
                    {{ formatCellValue(cell) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <!-- View Mode: Static HTML Table -->
        <div 
          v-else
          class="readonly-spreadsheet"
          v-html="currentSheetData.html"
        ></div>
      </div>
      
      <!-- No Sheet Selected -->
      <div 
        v-else-if="excelData && !currentSheetData"
        class="no-sheet flex items-center justify-center h-full"
      >
        <div class="text-center text-gray-500">
          <i class="fas fa-table text-4xl mb-4"></i>
          <p>Sélectionnez une feuille pour l'afficher</p>
        </div>
      </div>
      
      <!-- Loading State -->
      <div 
        v-else-if="!excelData"
        class="loading-state flex items-center justify-center h-full"
      >
        <div class="text-center">
          <div class="loading loading-spinner loading-lg text-primary mb-4"></div>
          <p class="text-gray-600">Chargement de la feuille de calcul...</p>
        </div>
      </div>
    </div>

    <!-- Formula Bar (Edit Mode) -->
    <div 
      v-if="isEditMode && selectedCell"
      class="formula-bar flex items-center p-3 border-t bg-gray-50"
    >
      <div class="cell-reference flex items-center mr-4">
        <span class="text-sm font-mono text-gray-600">
          {{ getCellReference(selectedCell.row, selectedCell.col) }}
        </span>
      </div>
      <div class="formula-input flex-1">
        <input
          v-model="formulaBarValue"
          @keydown.enter="applyFormulaBarValue"
          @keydown.escape="cancelFormulaBarEdit"
          class="input input-sm w-full font-mono"
          placeholder="Entrez une valeur ou une formule (=SUM(A1:A10))"
        />
      </div>
      <div class="formula-actions ml-2">
        <button 
          @click="applyFormulaBarValue"
          class="btn btn-sm btn-primary"
          title="Appliquer"
        >
          <i class="fas fa-check"></i>
        </button>
        <button 
          @click="cancelFormulaBarEdit"
          class="btn btn-sm btn-ghost"
          title="Annuler"
        >
          <i class="fas fa-times"></i>
        </button>
      </div>
    </div>

    <!-- Status Bar -->
    <div class="status-bar flex items-center justify-between p-2 border-t bg-gray-50 text-sm text-gray-600">
      <div class="sheet-info">
        <span v-if="currentSheetData?.metadata">
          {{ currentSheetData.metadata.cellCount }} cellules
          <span v-if="currentSheetData.metadata.hasFormulas" class="ml-2">
            <i class="fas fa-calculator"></i> Formules actives
          </span>
        </span>
      </div>
      <div class="selection-info">
        <span v-if="selectedCell">
          {{ getCellReference(selectedCell.row, selectedCell.col) }}
        </span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ExcelViewer',
  props: {
    excelData: {
      type: Object,
      default: null
    }
  },
  emits: ['save', 'export', 'error'],
  data() {
    return {
      zoomLevel: 1.0,
      isEditMode: false,
      activeSheet: null,
      selectedCell: null,
      editingValue: '',
      formulaBarValue: '',
      originalCellValue: null
    }
  },
  computed: {
    currentSheetData() {
      if (this.excelData?.content && this.activeSheet) {
        return this.excelData.content[this.activeSheet]
      }
      return null
    }
  },
  watch: {
    excelData: {
      handler(newData) {
        if (newData) {
          this.initializeExcel()
        }
      },
      immediate: true
    },
    selectedCell: {
      handler(newCell) {
        if (newCell && this.currentSheetData) {
          const cellValue = this.currentSheetData.data[newCell.row]?.[newCell.col]
          this.formulaBarValue = cellValue || ''
          this.originalCellValue = cellValue
        } else {
          this.formulaBarValue = ''
          this.originalCellValue = null
        }
      }
    }
  },
  methods: {
    initializeExcel() {
      if (!this.excelData) return
      
      // Set active sheet to the first available sheet
      if (this.excelData.metadata?.sheetNames?.length > 0) {
        this.activeSheet = this.excelData.activeSheet || this.excelData.metadata.sheetNames[0]
      }
    },
    
    // Zoom Controls
    zoomIn() {
      if (this.zoomLevel < 2.0) {
        this.zoomLevel = Math.min(2.0, this.zoomLevel + 0.1)
      }
    },
    zoomOut() {
      if (this.zoomLevel > 0.5) {
        this.zoomLevel = Math.max(0.5, this.zoomLevel - 0.1)
      }
    },
    
    // Sheet Navigation
    setActiveSheet(sheetName) {
      this.activeSheet = sheetName
      this.selectedCell = null
      this.isEditMode = false
    },
    
    // Edit Mode
    toggleEditMode() {
      this.isEditMode = !this.isEditMode
      if (!this.isEditMode) {
        this.selectedCell = null
      }
    },
    
    // Cell Selection and Editing
    selectCell(row, col) {
      if (!this.isEditMode) return
      
      this.selectedCell = { row, col }
      this.editingValue = this.currentSheetData.data[row]?.[col] || ''
      
      // Focus the cell input after Vue updates the DOM
      this.$nextTick(() => {
        const input = this.$refs.cellInput?.[0]
        if (input) {
          input.focus()
          input.select()
        }
      })
    },
    
    finishCellEdit() {
      if (!this.selectedCell || !this.currentSheetData) return
      
      const { row, col } = this.selectedCell
      
      // Update the cell value in the data
      if (!this.currentSheetData.data[row]) {
        this.currentSheetData.data[row] = []
      }
      this.currentSheetData.data[row][col] = this.editingValue
      
      // Emit save event
      this.$emit('save', {
        sheetName: this.activeSheet,
        cellReference: this.getCellReference(row, col),
        oldValue: this.originalCellValue,
        newValue: this.editingValue,
        row,
        col
      })
      
      this.selectedCell = null
    },
    
    cancelCellEdit() {
      this.editingValue = this.originalCellValue || ''
      this.selectedCell = null
    },
    
    // Formula Bar
    applyFormulaBarValue() {
      if (!this.selectedCell) return
      
      this.editingValue = this.formulaBarValue
      this.finishCellEdit()
    },
    
    cancelFormulaBarEdit() {
      this.formulaBarValue = this.originalCellValue || ''
    },
    
    // Utility Methods
    getColumnHeaders(data) {
      if (!data || data.length === 0) return []
      return data[0] || []
    },
    
    getColumnLetter(index) {
      let letter = ''
      while (index >= 0) {
        letter = String.fromCharCode(65 + (index % 26)) + letter
        index = Math.floor(index / 26) - 1
      }
      return letter
    },
    
    getCellReference(row, col) {
      return `${this.getColumnLetter(col)}${row + 1}`
    },
    
    formatCellValue(value) {
      if (value === null || value === undefined) return ''
      if (typeof value === 'number') {
        return value.toLocaleString()
      }
      return String(value)
    },
    
    isFormula(value) {
      return typeof value === 'string' && value.startsWith('=')
    },
    
    // Export Functions
    exportSheet(format) {
      if (!this.currentSheetData) return
      
      this.$emit('export', {
        format,
        sheetName: this.activeSheet,
        data: this.currentSheetData.data
      })
    }
  }
}
</script>

<style scoped>
.excel-viewer {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.sheet-tab {
  transition: all 0.2s ease;
  border-bottom: 2px solid transparent;
}

.sheet-tab:hover {
  background-color: #f3f4f6;
}

.excel-table {
  border: 1px solid #d1d5db;
}

.excel-cell {
  border: 1px solid #e5e7eb;
  padding: 4px 8px;
  text-align: left;
  vertical-align: top;
  position: relative;
}

.excel-header-cell {
  background-color: #f9fafb;
  font-weight: 600;
  text-align: center;
  color: #374151;
}

.excel-row-header {
  background-color: #f9fafb;
  font-weight: 600;
  text-align: center;
  color: #374151;
  width: 48px;
  min-width: 48px;
}

.excel-data-cell {
  cursor: pointer;
  transition: background-color 0.1s ease;
}

.excel-data-cell:hover {
  background-color: #f3f4f6;
}

.excel-data-cell.selected {
  background-color: #dbeafe;
  border: 2px solid #3b82f6;
}

.excel-data-cell.has-formula {
  background-color: #fef3c7;
}

.cell-input {
  font-family: inherit;
  font-size: inherit;
  padding: 0;
  margin: 0;
}

.cell-content {
  display: block;
  min-height: 1.2em;
  word-break: break-word;
}

.formula-bar {
  border-top: 1px solid #d1d5db;
}

.cell-reference {
  min-width: 80px;
  font-weight: 600;
}

/* Custom styles for readonly spreadsheet HTML */
:deep(.readonly-spreadsheet table) {
  border-collapse: collapse;
  width: 100%;
  font-size: 12px;
}

:deep(.readonly-spreadsheet td),
:deep(.readonly-spreadsheet th) {
  border: 1px solid #d1d5db;
  padding: 4px 8px;
  text-align: left;
}

:deep(.readonly-spreadsheet th) {
  background-color: #f3f4f6;
  font-weight: 600;
}

:deep(.readonly-spreadsheet tr:nth-child(even)) {
  background-color: #f9fafb;
}

:deep(.readonly-spreadsheet tr:hover) {
  background-color: #f3f4f6;
}
</style>