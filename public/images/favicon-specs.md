# Favicon Specifications

## Required Files:

### 1. favicon.ico
- **Dimensions**: 32x32px (16x16px fallback)
- **File Size**: < 10KB
- **Format**: ICO (multi-size)
- **Content**: SharedStake logo simplified
- **Location**: `/public/favicon.ico`

### 2. apple-touch-icon.png
- **Dimensions**: 180x180px
- **File Size**: < 20KB
- **Format**: PNG
- **Content**: SharedStake logo
- **Location**: `/public/apple-touch-icon.png`

### 3. favicon-32x32.png
- **Dimensions**: 32x32px
- **File Size**: < 5KB
- **Format**: PNG
- **Content**: SharedStake logo
- **Location**: `/public/favicon-32x32.png`

### 4. favicon-16x16.png
- **Dimensions**: 16x16px
- **File Size**: < 3KB
- **Format**: PNG
- **Content**: SharedStake logo simplified
- **Location**: `/public/favicon-16x16.png`

## Design Requirements:
- **Logo**: SharedStake logo (simplified for small sizes)
- **Background**: Transparent or dark
- **Colors**: Red and white (brand colors)
- **Style**: Clean, recognizable at small sizes
- **Contrast**: High contrast for visibility

## Technical Notes:
- **ICO Format**: Multi-size ICO file (16x16, 32x32, 48x48)
- **PNG Format**: High quality, optimized
- **Transparency**: Use transparent background
- **Optimization**: Compress without losing quality

## Tools for Creation:
- **Favicon Generator**: https://favicon.io/
- **RealFaviconGenerator**: https://realfavicongenerator.net/
- **Photoshop**: Professional editing
- **GIMP**: Free alternative

## HTML Implementation:
```html
<!-- Favicon -->
<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">

<!-- Apple Touch Icon -->
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">

<!-- Manifest -->
<link rel="manifest" href="/site.webmanifest">
```

## Testing:
- Test in different browsers (Chrome, Firefox, Safari, Edge)
- Test on mobile devices
- Verify favicon appears in browser tabs
- Check Apple touch icon on iOS devices

## File Locations:
- `/public/favicon.ico`
- `/public/favicon-32x32.png`
- `/public/favicon-16x16.png`
- `/public/apple-touch-icon.png`
- `/public/site.webmanifest` (optional)