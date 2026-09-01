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
- [x] Lokalny katalog `data/` — baza jest tworzona lokalnie; obrazy, okładki i eksporty.
- [x] Edytor Markdown z podglądem obok, skrótami i autosave.
- [x] `react-markdown` + `remark-gfm` — bezpieczne renderowanie Markdowna.
- [x] Wizualny projektant okładki (tekst, tła, szablony, grafiki, eksport 300 DPI PNG).
- [x] Playwright — niezawodny eksport HTML + CSS do PDF.
- [x] JSZip — bezstratny eksport i import całych projektów do archiwów .zip.
- [x] Vitest — zestaw testów jednostkowych i integracyjnych.

## Co będzie można zrobić

### Projekty książek

- [x] Utworzyć książkę z tytułem i autorem.
- [x] Wybrać format: A5, A4 lub 6 × 9 cali.
- [x] Zobaczyć wszystkie książki na dashboardzie.
- [x] Zmienić nazwę lub usunąć projekt po potwierdzeniu.
- [x] Automatycznie zapisywać zmiany lokalnie.
- [x] Duplikować istniejący projekt jednym kliknięciem.
- [x] Eksportować i importować projekty w formacie ZIP.

### Struktura książki

- [x] Dodawać rozdziały.
- [x] Zmieniać kolejność rozdziałów (przyciski góra/dół).
- [x] Zmieniać tytuły oraz usuwać rozdziały.
- [x] Widzieć liczbę słów w rozdziale i całej książce.
- [x] Automatycznie budować spis treści z kolejności rozdziałów.

### Edytor Markdown

- [x] Edycja rozdziału w polu Markdown.
- [x] Natychmiastowy podgląd sformatowanej treści obok edytora.
- [x] Pasek narzędzi dla nagłówków, pogrubienia, kursywy, cytatu, list i linków.
- [x] Skróty klawiszowe do najczęstszych formatowań.
- [x] Autosave z czytelną informacją „Saved”.

### Grafiki w rozdziałach

- [x] Wgrywanie PNG, JPG, WebP i GIF.
- [x] Przechowywanie obrazów lokalnie w folderze projektu.
- [x] Wstawianie grafiki do Markdowna jednym kliknięciem.
- [x] Podgląd obrazu w edytorze i w eksporcie PDF.
- [x] Walidacja typów plików i rozmiaru (do 20 MB).

### Projektant okładki

- [x] Wybór formatu okładki zgodnego z formatem książki (A5, 6x9, A4).
- [x] Gotowe profesjonalne szablony (Classic Minimalist, Modern Emerald, Midnight Indigo, Terracotta Earth).
- [x] Pola tekstowe: tytuł, podtytuł, autor i dowolny tekst.
- [x] Wybór kroju pisma, koloru, rozmiaru i wyrównania tekstu.
- [x] Wgrywanie zdjęć, ilustracji i logo.
- [x] Przesuwanie elementów i zmiana tła (kolory, gradienty, obrazy).
- [x] Eksport okładki do PNG (300 DPI) i automatyczne przypisanie jako okładka książki do PDF.

### Podgląd i PDF

- [x] Podgląd końcowego układu przed eksportem.
- [x] Strona okładkowa, strona tytułowa, spis treści i kolejne rozdziały.
- [x] Numeracja stron z pominięciem okładki.
- [x] Kontrola podziału stron przed nowym rozdziałem (`break-after: page`).
- [x] Ustawienia marginesów, fontu, interlinii i wielkości pisma.
- [x] Eksport PDF przez Playwright oraz natywny druk przeglądarkowy.

## Plan realizacji

### 0. Przygotowanie projektu

- [x] Utworzyć projekt Next.js z pnpm.
- [x] Skonfigurować TypeScript, Tailwind, linting i formatowanie kodu.
- [x] Przygotować pierwszy układ aplikacji i stronę startową.
- [x] Dodać SQLite oraz lokalny katalog danych.

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
- [x] Dodać generator spisu treści / widok całej książki w podglądzie.

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

- [x] Przygotować wspólny szablon książki do podglądu i druku (Okładka, Strona tytułowa, Spis treści, Rozdziały).
- [x] Dodać style typografii oraz precyzyjne podziały stron (@page, break-after: page).
- [x] Dodać ustawienia ekran / druk oraz wybór fontów i rozmiarów pisma.
- [x] Wygenerować PDF przez silnik Playwright (oraz bezpośredni natywny druk przeglądarkowy).
- [x] Dodać obsługę błędów i fallback do druku systemowego.

Efekt: książkę można pobrać jako poprawnie złożony PDF.

### 5. Dopracowanie narzędzia

- [x] Dodać tworzenie kopii książki (duplikacja projektu z rozdziałami, ustawieniami i grafikami).
- [x] Dodać import i eksport projektu jako ZIP (z metadanymi, plikami markdown i folderem uploads).
- [x] Dodać ochronę przed utratą niezapisanych zmian i komunikaty o błędach.
- [x] Dodać testy automatyczne: tworzenie, edycja, usuwanie, duplikacja i roundtrip ZIP.
- [x] Dopracować komunikaty błędów, menu kart na dashboardzie i puste stany.

## Ważne założenia jakości

- [x] Treść i grafiki nie opuszczają komputera.
- [x] Jeden widok podglądu jest źródłem prawdy dla PDF, dzięki czemu eksport nie zaskakuje innym układem.
- [x] Każdy rozdział jest zapisywany automatycznie.
- [x] PDF w trybie druk zachowuje dobrą ostrość obrazów (okładka generowana w 300 DPI).

## Aktualny stan

- [x] Zrealizowano Etap 0 (Przygotowanie projektu).
- [x] Zrealizowano Etap 1 (Książki i rozdziały).
- [x] Zrealizowano Etap 2 (Pisanie w Markdownie).
- [x] Zrealizowano Etap 3 (Projektant okładki).
- [x] Zrealizowano Etap 4 (Podgląd i eksport PDF).
- [x] Zrealizowano Etap 5 (Kopia książki, export/import ZIP, testy, dopracowanie dashboardu i projektu).
- [x] Projekt jest w pełni kompletny, przetestowany i gotowy do użycia.
