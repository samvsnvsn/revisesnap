# ReviseSnap Android APK - Instrukcje

## Automatyczne budowanie APK przez GitHub Actions

Skonfigurowałem automatyczne budowanie APK dla aplikacji ReviseSnap. APK będzie budowany automatycznie przy każdym push do repozytorium.

### Jak pobrać APK:

#### Opcja 1: Z GitHub Actions (Najłatwiejsza)

1. Wejdź na stronę repozytorium na GitHubie
2. Kliknij na zakładkę **"Actions"** u góry
3. Wybierz ostatni workflow run o nazwie **"Build Android APK"**
4. Przewiń na dół strony do sekcji **"Artifacts"**
5. Kliknij na **"ReviseSnap-debug-apk"** aby pobrać APK
6. Rozpakuj pobrany plik ZIP
7. Prześlij plik `app-debug.apk` na tablet

#### Opcja 2: Z Releases (Jeśli jest dostępny na main branch)

1. Wejdź na stronę repozytorium
2. Kliknij na **"Releases"** po prawej stronie
3. Pobierz najnowszy plik APK

### Instalacja na tablecie:

1. **Prześlij APK na tablet** (przez email, USB, Google Drive, itp.)
2. **Włącz instalację z nieznanych źródeł**:
   - Ustawienia → Bezpieczeństwo → Nieznane źródła ✓
   - LUB (na nowszych Androidach):
   - Ustawienia → Aplikacje → Dostęp specjalny → Instalowanie nieznanych aplikacji
   - Wybierz menedżer plików i włącz
3. **Otwórz plik APK** na tablecie (przez menedżer plików)
4. **Kliknij "Zainstaluj"**
5. **Gotowe!** Aplikacja ReviseSnap jest teraz zainstalowana

### Aktualizacja aplikacji:

Kiedy będą dostępne nowe wersje:
1. Pobierz nowy APK z GitHub Actions
2. Zainstaluj nowy APK (stary zostanie automatycznie zaktualizowany)
3. Wszystkie Twoje notatki i dane pozostaną zachowane

### Backup danych:

Przed reinstalacją tabletu zawsze zrób backup:
1. Otwórz ReviseSnap
2. Idź do "Me" (ikona osoby na dole)
3. Kliknij **"Export Data"**
4. Zapisz plik JSON w bezpiecznym miejscu (Drive, email do siebie)

Po reinstalacji tabletu:
1. Zainstaluj APK na nowym/zresetowanym tablecie
2. Otwórz ReviseSnap
3. Idź do "Me"
4. Kliknij **"Import Data"**
5. Wybierz zapisany plik JSON
6. Wszystkie notatki, foldery i postępy zostaną przywrócone!

### Zalety rozwiązania APK:

✅ Działa offline - nie potrzeba internetu
✅ Można reinstalować po reset tabletu
✅ Backup/restore danych jest prosty
✅ Pełna funkcjonalność PWA + natywna aplikacja
✅ Automatyczne aktualizacje przez GitHub

### Budowanie lokalnie (opcjonalne):

Jeśli chcesz budować APK lokalnie na swoim komputerze:

```bash
# 1. Sklonuj repozytorium
git clone <repo-url>
cd revisesnap/apps/web

# 2. Zainstaluj zależności
npm install

# 3. Zbuduj aplikację
npm run build

# 4. Zsynchronizuj Capacitor
npx cap sync android

# 5. Otwórz w Android Studio (lub zbuduj z terminala)
npx cap open android

# LUB zbuduj APK z terminala:
cd android
./gradlew assembleDebug

# APK będzie w: android/app/build/outputs/apk/debug/app-debug.apk
```

## Kontakt

Jeśli masz pytania lub problemy z instalacją, sprawdź logi w GitHub Actions lub skontaktuj się.

---

**Utworzone**: 2025-11-05
**Wersja**: 1.0
**Branch**: claude/analyze-revie-app-011CUq8eWPZUibPowEBJxj7W
