# Mahabat Alfan ERP - Build Instructions

## GitHub Actions
1. Upload the whole repository to GitHub.
2. Go to Actions.
3. Run workflow: Build Mahabat Alfan ERP EXE.
4. Download artifact: Mahabat-Alfan-ERP-EXE.

## Local build
```bash
npm install --legacy-peer-deps
npm run dist
```

The installer will be inside:
```text
release/Mahabat-Alfan-ERP-Setup-1.0.0.exe
```
