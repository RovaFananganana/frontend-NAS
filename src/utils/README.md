# Utilitaires de formatage des fichiers

Ce module fournit un ensemble complet d'utilitaires pour le formatage et la gestion des fichiers dans l'interface NAS.

## Fonctions principales

### Formatage

#### `formatFileSize(bytes)`
Formate la taille des fichiers en unités lisibles (B, KB, MB, GB, TB).

```javascript
formatFileSize(1024) // "1 KB"
formatFileSize(1048576) // "1 MB"
formatFileSize(0) // "0 B"
```

#### `formatDate(date, format)`
Formate les dates avec localisation française.

```javascript
formatDate(new Date(), 'full') // "15 janv. 2024, 10:30"
formatDate(new Date(), 'relative') // "Il y a 2 heures"
formatDate(new Date(), 'short') // "15/01/24"
```

#### `formatFileName(filename, maxLength)`
Tronque les noms de fichiers trop longs.

```javascript
formatFileName('very-long-filename.txt', 20) // "very-long-fil...txt"
```

### Détection de types

#### `detectFileType(filename)`
Détecte le type de fichier basé sur l'extension.

```javascript
detectFileType('document.pdf')
// {
//   type: 'pdf',
//   category: 'document',
//   label: 'Document PDF',
//   extension: 'pdf'
// }
```

#### `getFileIcon(item)`
Obtient l'icône et les couleurs appropriées pour un fichier.

```javascript
getFileIcon({ name: 'photo.jpg', is_directory: false })
// {
//   icon: 'fas fa-file-image',
//   color: 'text-purple-500',
//   bgColor: 'from-purple-400 to-purple-600',
//   textColor: 'text-white'
// }
```

#### `getFileType(item)`
Obtient le type de fichier formaté pour l'affichage.

```javascript
getFileType({ name: 'document.pdf', is_directory: false }) // "Document PDF"
```

### Vérificateurs de types

- `isImageFile(filename)` - Vérifie si c'est une image
- `isVideoFile(filename)` - Vérifie si c'est une vidéo
- `isAudioFile(filename)` - Vérifie si c'est un fichier audio
- `isDocumentFile(filename)` - Vérifie si c'est un document
- `isCodeFile(filename)` - Vérifie si c'est un fichier de code
- `isArchiveFile(filename)` - Vérifie si c'est une archive
- `isExecutableFile(filename)` - Vérifie si c'est un exécutable

### Utilitaires

#### `sortFiles(files, sortBy, sortOrder)`
Trie un tableau de fichiers selon différents critères.

```javascript
sortFiles(files, 'name', 'asc') // Tri par nom croissant
sortFiles(files, 'size', 'desc') // Tri par taille décroissant
```

#### `filterFiles(files, searchTerm)`
Filtre les fichiers selon un terme de recherche.

```javascript
filterFiles(files, 'pdf') // Fichiers contenant "pdf"
```

#### `getMimeType(filename)`
Obtient le type MIME d'un fichier.

```javascript
getMimeType('document.pdf') // "application/pdf"
```

## Types de fichiers supportés

### Documents
- PDF, DOC, DOCX, ODT, RTF
- XLS, XLSX, ODS, CSV
- PPT, PPTX, ODP

### Médias
- Images: JPG, PNG, GIF, SVG, BMP, WebP, TIFF, ICO
- Vidéos: MP4, AVI, MOV, WMV, FLV, WebM, MKV, M4V
- Audio: MP3, WAV, FLAC, OGG, AAC, M4A, WMA

### Code
- JavaScript, TypeScript, HTML, CSS, SCSS, LESS
- Python, PHP, Java, C++, C, C#, Ruby, Go, Rust
- Vue, JSX, TSX, JSON, XML, YAML

### Archives
- ZIP, RAR, 7Z, TAR, GZ, BZ2

### Autres
- Texte: TXT, MD, LOG, INI, CFG, CONF
- Polices: TTF, OTF, WOFF, WOFF2
- Exécutables: EXE, MSI, DEB, RPM, DMG, APP

## Démonstration

Visitez `/test-formatting-utils` pour voir une démonstration interactive de tous les utilitaires.

## Tests

Les utilitaires sont entièrement testés avec Vitest :

```bash
npm test -- fileUtils.test.js
```