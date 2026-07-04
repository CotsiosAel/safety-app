# SafeMe manual QA checklist

Να γίνεται αυτός ο χειροκίνητος έλεγχος μετά από κάθε PR, ειδικά πριν από merge αλλαγών σε UI ή JavaScript. Στόχος είναι να εντοπίζονται άμεσα regressions σε mobile taps, κουμπιά, πλοήγηση και SOS ροή.

## A. Basic launch

- [ ] Άνοιγμα του https://safety-app-vert.vercel.app
- [ ] Η εφαρμογή φορτώνει χωρίς blank screen.
- [ ] Δεν υπάρχει κολλημένο update banner.
- [ ] Δεν υπάρχουν παγωμένα κουμπιά.

## B. Navigation

- [ ] Η καρτέλα «Αρχική» ανοίγει.
- [ ] Η καρτέλα «Επαφές» ανοίγει.
- [ ] Η καρτέλα «Εργαλεία Ασφάλειας» ανοίγει.
- [ ] Η καρτέλα «Προφίλ» ανοίγει.
- [ ] Η καρτέλα «Ρυθμίσεις» ανοίγει.

## C. Home

- [ ] Το SOS button ανταποκρίνεται.
- [ ] Το «Σύνδεση για συγχρονισμό» ανταποκρίνεται.
- [ ] Τα quick actions ανταποκρίνονται, αν εμφανίζονται.
- [ ] Τα GPS/share buttons ανταποκρίνονται, αν εμφανίζονται.

## D. Contacts

- [ ] Το «Προσθήκη επαφής» ανοίγει τη φόρμα.
- [ ] Μια επαφή μπορεί να αποθηκευτεί.
- [ ] Η επαφή παραμένει μετά από refresh.
- [ ] Τα κουμπιά edit/delete/primary λειτουργούν, αν εμφανίζονται.
- [ ] Το sync section ανοίγει/κλείνει.

## E. Profile

- [ ] Τα accordions ανοίγουν/κλείνουν.
- [ ] Τα profile fields μπορούν να επεξεργαστούν.
- [ ] Το save profile λειτουργεί.
- [ ] Το account/login section ανοίγει.

## F. Settings

- [ ] Τα accordions ανοίγουν/κλείνουν.
- [ ] Το test mode toggle λειτουργεί.
- [ ] Τα GPS/settings buttons ανταποκρίνονται.
- [ ] Τα logout/clear data buttons δεν ενεργοποιούνται κατά λάθος.

## G. SOS flow

- [ ] Πρώτα ενεργοποιείται το test mode.
- [ ] Πατιέται το SOS.
- [ ] Εμφανίζεται η SOS active screen.
- [ ] Το SMS button ανοίγει composer.
- [ ] Το copy message λειτουργεί.
- [ ] Το terminate SOS λειτουργεί.
- [ ] Το history ενημερώνεται, αν εφαρμόζεται.

## H. Mobile/iPhone

- [ ] Τα taps σε buttons δεν επιλέγουν κείμενο.
- [ ] Δεν εμφανίζεται μενού Copy / Look Up / Translate σε κανονικά taps.
- [ ] Τα buttons ανταποκρίνονται σε Safari/Chrome/PWA.
- [ ] Η εφαρμογή λειτουργεί μετά από κλείσιμο και ξανά άνοιγμα.
