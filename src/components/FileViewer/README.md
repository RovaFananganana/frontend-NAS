# File Viewer Components

## Overview

This directory contains the file viewer and editor components that provide a comprehensive file viewing and editing experience within the application.

## Components

### TextHandler.js
A handler class for processing text files with the following features:
- **Encoding Detection**: Automatically detects file encoding (UTF-8, UTF-16, ISO-8859-1)
- **Language Detection**: Determines programming language from file extension
- **Content Processing**: Reads and processes text content for viewing/editing
- **Validation**: Provides syntax validation for JSON and XML files
- **Save Support**: Creates properly encoded blobs for saving

### TextViewer.vue
A read-only text viewer component with:
- **Monaco Editor Integration**: Full-featured code editor for syntax highlighting
- **Multiple Languages**: Support for 25+ programming languages
- **Theme Support**: Light and dark themes
- **Line Numbers**: Toggleable line numbers
- **Word Wrap**: Configurable word wrapping
- **Status Bar**: Shows cursor position, file stats, and validation errors
- **Keyboard Navigation**: Standard editor shortcuts

### TextEditor.vue
An advanced text editor component with:
- **Full Editing Capabilities**: Complete text editing with Monaco Editor
- **Toolbar**: Save, undo/redo, find/replace, format, and comment operations
- **Language Selection**: Runtime language switching
- **Encoding Selection**: Support for different text encodings
- **Auto-save Indication**: Visual feedback for unsaved changes
- **Keyboard Shortcuts**: Standard editing shortcuts (Ctrl+S, Ctrl+F, etc.)
- **Format Support**: Document formatting for supported languages

### FileViewerModal.vue
The main modal component that:
- **Handler Integration**: Automatically selects appropriate handler for file types
- **Mode Switching**: Toggle between view and edit modes
- **Content Display**: Renders content using appropriate viewer/editor
- **Error Handling**: Graceful error handling with user-friendly messages
- **Keyboard Navigation**: ESC to close, arrow keys for navigation

## Usage

### Basic Text Viewing
```vue
<TextViewer
  :content="fileContent"
  :metadata="{ language: 'javascript', encoding: 'utf-8' }"
  :editable="false"
  mode="view"
/>
```

### Text Editing
```vue
<TextEditor
  :file="fileObject"
  :initial-content="fileContent"
  :metadata="{ language: 'python', encoding: 'utf-8' }"
  @save="handleSave"
  @content-changed="handleContentChange"
/>
```

### File Viewer Modal
```vue
<FileViewerModal
  :is-open="showModal"
  :file="selectedFile"
  :mode="viewMode"
  @close="closeModal"
  @save="saveFile"
/>
```

## Supported File Types

### Text Files
- Plain text (.txt)
- Markdown (.md)
- JSON (.json)
- JavaScript (.js, .ts)
- HTML (.html, .htm)
- CSS (.css, .scss, .sass)
- XML (.xml)
- YAML (.yml, .yaml)
- Configuration files (.ini, .conf, .cfg)
- Log files (.log)

### Programming Languages
- Python (.py)
- Java (.java)
- C/C++ (.c, .cpp, .h, .hpp)
- C# (.cs)
- PHP (.php)
- Ruby (.rb)
- Go (.go)
- Rust (.rs)
- Swift (.swift)
- Kotlin (.kt)
- Scala (.scala)
- SQL (.sql)
- Shell scripts (.sh, .bat, .ps1)

## Features

### Monaco Editor Integration
- **Syntax Highlighting**: Automatic syntax highlighting for 25+ languages
- **IntelliSense**: Code completion and suggestions
- **Error Detection**: Real-time syntax error detection
- **Find/Replace**: Advanced search and replace functionality
- **Multi-cursor**: Multiple cursor editing support
- **Folding**: Code folding for better navigation

### Encoding Support
- **UTF-8**: Default encoding with BOM detection
- **UTF-16**: Little and big endian support
- **ISO-8859-1**: Legacy encoding support
- **Auto-detection**: Automatic encoding detection from file content

### Validation
- **JSON**: Real-time JSON syntax validation
- **XML**: XML structure validation
- **Error Markers**: Visual error indicators in the editor
- **Status Display**: Error count in status bar

### Keyboard Shortcuts
- **Ctrl+S**: Save file
- **Ctrl+F**: Find text
- **Ctrl+H**: Find and replace
- **Ctrl+G**: Go to line
- **Ctrl+Z**: Undo
- **Ctrl+Y**: Redo
- **Ctrl+/**: Toggle comments
- **ESC**: Close modal

## Configuration

### Language Detection
The TextHandler automatically detects the programming language based on file extension. You can override this by setting the `language` property in the metadata.

### Theme Selection
The TextViewer supports both light (`vs`) and dark (`vs-dark`) themes. Users can toggle between themes using the theme button in the toolbar.

### Encoding Selection
The TextEditor allows users to change the file encoding at runtime. Supported encodings:
- UTF-8 (default)
- UTF-16
- ISO-8859-1

## Error Handling

### File Reading Errors
- Invalid file format
- Encoding detection failures
- File size limitations
- Network errors

### Validation Errors
- JSON syntax errors with line numbers
- XML parsing errors
- Real-time error highlighting in editor

### Save Errors
- Permission denied
- Network failures
- Encoding conversion errors

## Testing

The TextHandler includes comprehensive unit tests covering:
- File type detection
- Encoding detection
- Content processing
- Language detection
- Validation functionality
- Save operations

Run tests with:
```bash
npm run test:run -- TextHandler.test.js
```

## Performance Considerations

### Large Files
- Monaco Editor handles files up to 10MB efficiently
- Syntax highlighting is optimized for performance
- Virtual scrolling for large documents

### Memory Usage
- Efficient text processing with minimal memory overhead
- Proper cleanup of Monaco Editor instances
- Garbage collection of unused resources

## Browser Compatibility

### Supported Browsers
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

### Required Features
- ES6 modules
- FileReader API
- ArrayBuffer support
- Blob API
- Monaco Editor compatibility