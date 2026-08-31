# Book Forge — lokalny kreator ebooków i książek

## Cel

Prywatna aplikacja uruchamiana lokalnie na komputerze. Ma pozwolić wygodnie napisać książkę w Markdownie, budować jej rozdziały, umieszczać grafiki, zaprojektować okładkę i wyeksportować całość do PDF — do czytania na ekranie i opcjonalnie do druku.

Nie robimy kont użytkowników, płatności, chmury, współdzielenia ani publicznej strony. Wszystkie dane zostają lokalnie.

## Ustalone decyzje

- [x] Aplikacja: Next.js + TypeScript + pnpm.
- [x] Tryb pracy: tylko lokalnie, dla jednego użytkownika.
- [x] Treść rozdziałów: Markdown z wygodnym edytorem i podglądem.
- [x] Rozdziały: można dodawać, usuwać, przenosić i układać w kolejności.
- [x] Grafiki: można wstawiać do rozdziałów wraz z podpisem.
- [x] Okładka: własny projekt z tekstem, zdjęciami i grafikami.
- [x] Wynik: PDF zoptymalizowany do ekranu oraz nadający się do druku.

## Docelowe użycie

```text
Nowa książka
  → dodaj części i rozdziały
  → napisz tekst w Markdownie
  → wstaw ilustracje
  → zaprojektuj okładkę
  → sprawdź podgląd
  → eksportuj PDF
```

## Technologia

- [x] Next.js (App Router), TypeScript i pnpm.
- [x] Tailwind CSS — szybki, czytelny interfejs.
- [x] SQLite + Drizzle ORM — lokalna baza dla książek, rozdziałów i ustawień.
- [x] Lokalny katalog `data/` — baza jest tworzona lokalnie; obrazy, okładki i PDF-y dojdą w kolejnych etapach.
- [ ] Edytor Markdown z podświetlaniem składni, skrótami i podglądem.
- [ ] `react-markdown` / remark / rehype — bezpieczne renderowanie Markdowna.
- [ ] Konva.js — płótno do projektowania okładki (tekst, obrazy, przesuwanie, skalowanie).
- [ ] Playwright — niezawodny eksport HTML + CSS do PDF.
- [ ] Zod — walidacja formularzy i danych.

## Co będzie można zrobić

### Projekty książek

- [x] Utworzyć książkę z tytułem i autorem.
- [x] Wybrać format: A5, A4 lub 6 × 9 cali.
- [x] Zobaczyć wszystkie książki na dashboardzie.
- [ ] Zmienić nazwę lub usunąć projekt po potwierdzeniu.
- [ ] Automatycznie zapisywać zmiany lokalnie.

### Struktura książki

- [ ] Dodawać części i podrozdziały.
- [x] Dodawać rozdziały.
- [ ] Zmieniać kolejność metodą przeciągnij i upuść.
- [ ] Zmieniać tytuły oraz usuwać puste elementy.
- [ ] Widzieć liczbę słów w rozdziale i całej książce.
- [ ] Automatycznie budować spis treści z nagłówków i kolejności rozdziałów.

### Edytor Markdown

- [x] Edycja rozdziału w polu Markdown.
- [ ] Numery linii i kolorowanie Markdowna.
- [ ] Natychmiastowy podgląd sformatowanej treści obok edytora.
- [ ] Pasek narzędzi dla nagłówków, pogrubienia, kursywy, cytatu, list i linków.
- [ ] Skróty klawiszowe do najczęstszych formatowań.
- [ ] Autosave z czytelną informacją „zapisano”.
- [ ] Wyszukiwanie tekstu w aktualnym rozdziale.

### Grafiki w rozdziałach

- [ ] Wgrywanie PNG, JPG, WebP i SVG.
- [ ] Przechowywanie obrazów lokalnie w folderze projektu.
- [ ] Wstawianie grafiki do Markdowna jednym kliknięciem.
- [ ] Ustawienie podpisu, wyrównania oraz szerokości grafiki.
- [ ] Podgląd obrazu w edytorze i w eksporcie.
- [ ] Komunikat o brakującym lub zbyt dużym pliku.

### Projektant okładki

- [ ] Wybór formatu okładki zgodnego z formatem książki.
- [ ] Dodawanie pól tekstowych: tytuł, podtytuł, autor i dowolny tekst.
- [ ] Wybór kroju, koloru, rozmiaru i wyrównania tekstu.
- [ ] Wgrywanie zdjęć, ilustracji i logo.
- [ ] Przesuwanie, skalowanie, obracanie i usuwanie elementów.
- [ ] Zmiana koloru lub grafiki tła.
- [ ] Warstwy: przesuwanie elementu do przodu i do tyłu.
- [ ] Eksport okładki do PNG i użycie jej jako pierwszej strony PDF.

### Podgląd i PDF

- [ ] Podgląd końcowego układu przed eksportem.
- [ ] Strona okładkowa, tytułowa, spis treści i kolejne rozdziały.
- [ ] Numeracja stron z pominięciem okładki.
- [ ] Kontrola podziału stron przed nowym rozdziałem.
- [ ] Ustawienia marginesów, fontu, interlinii i wielkości nagłówków.
- [ ] Eksport PDF „Ekran”: lżejszy plik i aktywne linki w spisie treści.
- [ ] Eksport PDF „Druk”: dokładny format, większa jakość obrazów i marginesy.
- [ ] Zapis gotowych plików w historii eksportów oraz przycisk „otwórz folder”.

## Plan realizacji

### 0. Przygotowanie projektu

- [x] Utworzyć projekt Next.js z pnpm.
- [x] Skonfigurować TypeScript, Tailwind, linting i formatowanie kodu.
- [x] Przygotować pierwszy układ aplikacji i stronę startową.
- [x] Dodać SQLite oraz lokalny katalog danych.
- [ ] Dodać migracje Drizzle dla kolejnych zmian schematu.

Efekt: aplikacja uruchamia się lokalnie i pokazuje pusty dashboard.

### 1. Książki i rozdziały

- [x] Dodać model książki i rozdziału.
- [x] Dodać model ustawień książki.
- [x] Zbudować formularz nowej książki.
- [x] Zbudować listę książek.
- [x] Zbudować panel listy rozdziałów.
- [x] Dodać zmianę kolejności rozdziałów.
- [x] Dodać lokalny autosave.

Efekt: można utworzyć książkę, dodać rozdziały i po zamknięciu aplikacji nadal je mieć.

### 2. Pisanie w Markdownie

- [x] Dodać edytor Markdown i podgląd obok.
- [x] Dodać pasek formatowania i skróty.
- [x] Dodać liczenie słów.
- [x] Dodać wstawianie oraz renderowanie grafik.
- [ ] Dodać generator spisz treści / widok całej książki.

Efekt: można napisać kompletną książkę z ilustracjami i strukturą.

### 3. Projektant okładki

- [x] Zbudować płótno okładki dopasowane do formatu książki (A5, 6x9 in, A4).
- [x] Dodać gotowe szablony okładek (Classic Minimalist, Modern Emerald, Midnight Indigo, Terracotta Earth).
- [x] Dodać tekst, tło (kolor, gradient, obraz) i import grafik/logo.
- [x] Dodać operacje na elementach (przesuwanie drag & drop, edycja fontów, kolorów, rozmiarów).
- [x] Dodać zapis projektu okładki w lokalnej bazie.
- [x] Dodać eksport do wysokiej rozdzielczości PNG (300 DPI) z automatycznym przypisaniem do książki.

Efekt: można samodzielnie stworzyć okładkę bez wychodzenia z aplikacji.

### 4. Podgląd i eksport PDF

- [ ] Przygotować wspólny szablon książki do podglądu i druku.
- [ ] Dodać style typografii oraz podziały stron.
- [ ] Dodać ustawienia ekran / druk.
- [ ] Wygenerować PDF przez Playwright.
- [ ] Dodać historię eksportów i obsługę błędów.

Efekt: książkę można pobrać jako poprawnie złożony PDF.

### 5. Dopracowanie narzędzia

- [ ] Dodać tworzenie kopii książki.
- [ ] Dodać import i eksport projektu jako ZIP.
- [x] Dodać ochronę przed utratą niezapisanych zmian.
- [ ] Dodać testy: książka, rozdział, grafika, okładka i PDF.
- [ ] Przetestować długi dokument oraz obrazy o dużej rozdzielczości.
- [ ] Dopracować komunikaty błędów i pusty stan ekranów.

## Ważne założenia jakości

- [x] Treść i grafiki nie opuszczają komputera.
- [ ] Jeden widok podglądu jest źródłem prawdy dla PDF, dzięki czemu eksport nie zaskakuje innym układem.
- [x] Każdy rozdział jest zapisywany automatycznie.
- [x] PDF w trybie druk zachowuje dobrą ostrość obrazów (okładka generowana w 300 DPI).
- [ ] Nie blokujemy pracy ciężkimi funkcjami: AI i EPUB zostają na później.

## Aktualny stan

- [x] Ustalono cel i zakres lokalnego narzędzia.
- [x] Ustalono Markdown, grafiki, projektant okładki i dwa profile PDF.
- [x] Zrealizowano Etap 0, Etap 1, Etap 2 oraz Etap 3 (Projektant okładki).
- [ ] Następny krok: Etap 4 (Podgląd całej książki i eksport do PDF).
