// server.js
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(bodyParser.json());
// --- Konfiguracja Cloudinary ---
const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
cloudinary.config({
    cloud_name: 'dkfgniqzt',
    api_key: '514784281515419',
    api_secret: 'HKufkTI72D0GYIX7zvj7OmQhGao',
});
const nodemailer = require("nodemailer");
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});
// --- Konfiguracja Multera i Cloudinary Storage ---
const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'galeria_fundacji',
        allowed_formats: ['jpg', 'png', 'jpeg'],
    },
});
const multer = require('multer');



const upload = multer({ storage });
// 1. Połączenie z MongoDB
mongoose.connect(
    "mongodb+srv://wiczjan:orzel1@cluster0.fcrwtzc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
    {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    }
)
    .then(() => console.log("✅ Połączono z MongoDB"))
    .catch((err) => console.error("❌ Błąd połączenia z MongoDB:", err));

// 2. Schemat i model
const nameSchema = new mongoose.Schema({
    imie: { type: String, required: true }
});
const Name = mongoose.model("Name", nameSchema);

// 3. Endpoint do dodawania imienia
app.post("/addName", async (req, res) => {
    try {
        const { imie } = req.body;
        if (!imie) {
            return res.status(400).json({ error: "Brak pola 'imie'" });
        }

        const newName = new Name({ imie });
        await newName.save();
        res.json({ message: "Imię zapisane", imie });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.get("/api/events", async (req, res) => {
    try {
        const events = await Event.find();
        res.json(events);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST - dodaj nowe wydarzenie
app.post("/api/events", async (req, res) => {
    const { summary, dtstart, rrule, type, rocznik } = req.body;
    console.log("TEST3", summary, dtstart, rrule, type, rocznik)
    if (!dtstart || !rrule || !type || !rocznik) {
        return res.status(400).json({ message: "Brak wymaganych danych" });
    }
    try {
        const newEvent = new Event({ summary, dtstart, rrule, type, rocznik });
        const savedEvent = await newEvent.save();
        res.status(201).json(savedEvent);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// PUT - edytuj wydarzenie po ID
app.put("/api/events/:id", async (req, res) => {
    try {
        const updatedEvent = await Event.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        res.json(updatedEvent);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// DELETE - usuń wydarzenie po ID
app.delete("/api/events/:id", async (req, res) => {
    try {
        await Event.findByIdAndDelete(req.params.id);
        res.json({ message: "Event deleted" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.get("/api/eventsRocznik", async (req, res) => {
    const { rocznik } = req.query;

    if (!rocznik) {
        return res.status(400).json({ message: "Brak parametru rocznik" });
    }


    try {
        const events = await Event.find({ rocznik }).sort({ dtstart: 1 });

        res.status(200).json(events);
    } catch (err) {
        console.error("Błąd przy pobieraniu wydarzeń:", err);
        res.status(500).json({ message: "Błąd serwera przy pobieraniu wydarzeń" });
    }
});
app.get("/api/events/rocznik/:rocznik", async (req, res) => {
    try {
        const { rocznik } = req.params;

        if (!rocznik) {
            return res.status(400).json({ message: "Brak parametru rocznik" });
        }

        // Pobranie eventów z bazy, posortowane wg daty
        const events = await Event.find({ rocznik }).sort({ dtstart: 1 });

        res.status(200).json(events);
    } catch (err) {
        console.error("Błąd przy pobieraniu wydarzeń:", err);
        res.status(500).json({ message: "Błąd serwera przy pobieraniu wydarzeń" });
    }
});
// 4. Endpoint do pobierania wszystkich imion



const EventSchema = new mongoose.Schema({
    summary: { type: String },
    dtstart: { type: Date, required: true },
    rrule: { type: String, required: true },
    type: { type: String, enum: ["training", "game"], default: "training" },
    rocznik: { type: String, required: true },
});

const Event = mongoose.model("Event", EventSchema);




const AktualnoscSchema = new mongoose.Schema({
    data: { type: String, required: true },
    tytul: { type: String, required: true },
    tresc: { type: String, required: true },
    zdjecie: { type: String },
    submittedAt: { type: Date, default: Date.now }
});

const Aktualnosc = mongoose.model('Aktualnosc', AktualnoscSchema, 'aktualnosci'); // wymuszenie kolekcji "aktualnosci"
// POST: Dodaj nową aktualność (z opcjonalnym zdjęciem z dysku)
app.post('/api/aktualnosci', upload.single('zdjeciePlik'), async (req, res) => {
    try {
        const { data, tytul, tresc, zdjecie } = req.body;

        if (!data || !tytul || !tresc) {
            return res.status(400).json({ error: 'Brakuje wymaganych danych.' });
        }

        // Wybierz link z body lub z przesłanego pliku
        const imageUrl = req.file ? req.file.path : zdjecie;



        const nowaAktualnosc = new Aktualnosc({
            data,
            tytul,
            tresc,
            zdjecie: imageUrl,
        });

        await nowaAktualnosc.save();
        console.log('✅ Dodano nową aktualność:', nowaAktualnosc);

        res.status(201).json({ status: 'success', data: nowaAktualnosc });
    } catch (error) {
        console.error('❌ Błąd podczas zapisu aktualności:', error);
        res.status(500).json({ error: 'Błąd serwera przy zapisie aktualności.' });
    }
});

// GET: Pobierz wszystkie aktualności
app.get('/api/aktualnosci', async (req, res) => {
    try {
        const aktualnosci = await Aktualnosc.find().sort({ data: -1 });
        res.json(aktualnosci);
    } catch (err) {
        res.status(500).json({ error: 'Błąd podczas pobierania danych.' });
    }
});

// PUT: Edytuj aktualność (z opcjonalnym nowym zdjęciem)
app.put('/api/aktualnosci/:id', upload.single('zdjeciePlik'), async (req, res) => {
    try {
        const { data, tytul, tresc, zdjecie } = req.body;
        const aktualnosc = await Aktualnosc.findById(req.params.id);

        if (!aktualnosc) {
            return res.status(404).json({ error: 'Aktualność nie znaleziona.' });
        }

        // Zaktualizuj dane
        aktualnosc.data = data || aktualnosc.data;
        aktualnosc.tytul = tytul || aktualnosc.tytul;
        aktualnosc.tresc = tresc || aktualnosc.tresc;

        // Jeśli przesłano nowe zdjęcie z dysku, zastąp stare
        if (req.file) {
            aktualnosc.zdjecie = req.file.path;
        } else if (zdjecie) {
            aktualnosc.zdjecie = zdjecie;
        }

        await aktualnosc.save();
        res.json({ status: 'updated', data: aktualnosc });
    } catch (err) {
        console.error('❌ Błąd przy aktualizacji:', err);
        res.status(500).json({ error: 'Błąd podczas aktualizacji.' });
    }
});

// DELETE: Usuń aktualność
app.delete('/api/aktualnosci/:id', async (req, res) => {
    try {
        const aktualnosc = await Aktualnosc.findByIdAndDelete(req.params.id);
        if (!aktualnosc) {
            return res.status(404).json({ error: 'Nie znaleziono aktualności.' });
        }
        res.json({ status: 'deleted', data: aktualnosc });
    } catch (err) {
        res.status(500).json({ error: 'Błąd podczas usuwania.' });
    }
});





const TekstSchema = new mongoose.Schema({
    id: { type: String, unique: true },
    tytul: { type: String, required: false }, // teraz tytul nie jest obowiązkowy
    tresc: { type: String, required: true }
});
const Tekst = mongoose.model('Tekst', TekstSchema, 'teksty');

app.put('/api/teksty/:id', async (req, res) => {
    const { id } = req.params;
    const { tytul, tresc } = req.body;

    if (!tresc || typeof tresc !== 'string') {
        return res.status(400).json({ error: 'Treść jest wymagana i musi być tekstem.' });
    }

    try {
        const updated = await Tekst.findOneAndUpdate(
            { id },
            { tytul, tresc },
            { new: true, upsert: true } // utworzy nowy dokument, jeśli nie istnieje
        );

        console.log(`✏️ Tekst z ID "${id}" został zaktualizowany.`);
        res.status(200).json({ message: 'Tekst zapisany pomyślnie', updated });
    } catch (error) {
        console.error('❌ Błąd aktualizacji tekstu:', error);
        res.status(500).json({ error: 'Błąd serwera przy zapisie tekstu.' });
    }
});

app.get('/api/teksty/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const tekst = await Tekst.findOne({ id });
        if (!tekst) {
            return res.status(404).json({ error: 'Tekst nie został znaleziony.' });
        }
        res.status(200).json(tekst);
    } catch (error) {
        console.error('❌ Błąd podczas pobierania tekstu:', error);
        res.status(500).json({ error: 'Błąd serwera.' });
    }
});







const ScheduledEventSchema = new mongoose.Schema({
    nazwa: { type: String, required: true },
    data: { type: String, required: true },   // np. "2025-08-15"
    adres: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const ScheduledEvent = mongoose.model('ScheduledEvent', ScheduledEventSchema, 'ScheduledEvents');
app.post('/api/scheduledevents', async (req, res) => {
    try {
        const nowe = new ScheduledEvent(req.body);
        await nowe.save();
        res.status(201).json({ message: 'Wydarzenie dodane', wydarzenie: nowe });
    } catch (error) {
        console.error('❌ Błąd dodawania wydarzenia:', error);
        res.status(500).json({ error: 'Błąd serwera przy dodawaniu wydarzenia' });
    }
});

app.put('/api/scheduledevents/:id', async (req, res) => {
    try {
        const updated = await ScheduledEvent.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updated) return res.status(404).json({ error: 'Nie znaleziono wydarzenia' });
        res.status(200).json({ message: 'Wydarzenie zaktualizowane', updated });
    } catch (error) {
        res.status(500).json({ error: 'Błąd aktualizacji wydarzenia' });
    }
});
app.delete('/api/scheduledevents/:id', async (req, res) => {
    try {
        const removed = await ScheduledEvent.findByIdAndDelete(req.params.id);
        if (!removed) return res.status(404).json({ error: 'Nie znaleziono wydarzenia' });
        res.status(200).json({ message: 'Wydarzenie usunięte', removed });
    } catch (error) {
        res.status(500).json({ error: 'Błąd usuwania wydarzenia' });
    }
});

app.get('/api/scheduledevents', async (req, res) => {
    try {
        const wydarzenia = await ScheduledEvent.find().sort({ data: 1 }); // sortuj rosnąco wg daty
        res.status(200).json(wydarzenia);
    } catch (error) {
        res.status(500).json({ error: 'Błąd pobierania wydarzeń' });
    }
});


// --- SCHEMA: Galeria ---
const GallerySchema = new mongoose.Schema({
    link: { type: String, required: true }, // link do zdjęcia w Cloudinary
    coms: [
        {
            userName: { type: String, required: true },
            comText: { type: String, required: true }
        }
    ],
    uploadedAt: { type: Date, default: Date.now }
});

const Gallery = mongoose.model("Gallery", GallerySchema, "gallery");

const RocznikSchema = new mongoose.Schema({
    rocznik: { type: String },
    trener: { type: String },
    liczbaZawodników: { type: Number },
    miejsceTreningów: { type: String },
    dniTreningow: [{ type: Number }],

    kolor1: { type: String },
    kolor2: { type: String },

    miejscaGier: [
        {
            nazwa: { type: String },
            adres: { type: String },
        }
    ],
    wyniki: [
        {
            rywal: { type: String },
            punktyN: { type: Number },
            punktyR: { type: Number },
            logoRywal: { type: String },
            kolorRywal: { type: String },
        }
    ]
});

const Rocznik = mongoose.model("Rocznik", RocznikSchema);



// --- Endpointy ---
// Dodaj miejsce gry do rocznika
// Dodaj miejsce gry do rocznika
app.post("/api/roczniki/:id/miejscaGier", async (req, res) => {
    try {
        const { nazwa, adres } = req.body;
        if (!nazwa || !adres) {
            return res.status(400).json({ error: "Brak wymaganych danych miejsca gry" });
        }

        const rocznik = await Rocznik.findById(req.params.id);
        if (!rocznik) return res.status(404).json({ error: "Nie znaleziono rocznika" });

        rocznik.miejscaGier.push({ nazwa, adres });
        await rocznik.save();

        res.json({ message: "✅ Miejsce gry dodane", miejscaGier: rocznik.miejscaGier });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Błąd serwera przy dodawaniu miejsca gry" });
    }
});

// Pobierz wszystkie miejsca gier dla rocznika
app.get("/api/roczniki/:id/miejscaGier", async (req, res) => {
    try {
        const rocznik = await Rocznik.findById(req.params.id);
        if (!rocznik) return res.status(404).json({ error: "Nie znaleziono rocznika" });

        res.json(rocznik.miejscaGier);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Błąd serwera przy pobieraniu miejsc gier" });
    }
});

// Usuń miejsce gry po indeksie
app.delete("/api/roczniki/:id/miejscaGier/:index", async (req, res) => {
    try {
        const rocznik = await Rocznik.findById(req.params.id);
        if (!rocznik) return res.status(404).json({ error: "Nie znaleziono rocznika" });

        const idx = parseInt(req.params.index);
        if (isNaN(idx) || idx < 0 || idx >= rocznik.miejscaGier.length) {
            return res.status(400).json({ error: "Nieprawidłowy indeks miejsca gry" });
        }

        rocznik.miejscaGier.splice(idx, 1);
        await rocznik.save();

        res.json({ message: "✅ Miejsce gry usunięte", miejscaGier: rocznik.miejscaGier });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Błąd serwera przy usuwaniu miejsca gry" });
    }
});


// Dodaj rocznik
app.post("/api/roczniki", async (req, res) => {
    try {
        const { rocznik, trener, liczbaZawodników, miejsceTreningów, dniTreningow, kolor1, kolor2 } = req.body;
        const newRocznik = new Rocznik({ rocznik, trener, liczbaZawodników, miejsceTreningów, dniTreningow, kolor1, kolor2 });
        await newRocznik.save();
        res.status(201).json({ message: "Rocznik dodany", rocznik: newRocznik });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Błąd serwera przy dodawaniu rocznika" });
    }
});

// Usuń rocznik po ID
app.delete("/api/roczniki/:id", async (req, res) => {
    try {
        const removed = await Rocznik.findByIdAndDelete(req.params.id);
        if (!removed) return res.status(404).json({ error: "Nie znaleziono rocznika" });
        res.json({ message: "Rocznik usunięty", removed });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Błąd serwera przy usuwaniu rocznika" });
    }
});

// Modyfikacja rocznika po ID
app.put("/api/roczniki/:id", async (req, res) => {
    try {
        const { rocznik, trener, liczbaZawodników, miejsceTreningów, dniTreningow, kolor1, kolor2 } = req.body;
        const updated = await Rocznik.findByIdAndUpdate(
            req.params.id,
            { rocznik, trener, liczbaZawodników, miejsceTreningów, dniTreningow, kolor1, kolor2 },
            { new: true }
        );
        if (!updated) return res.status(404).json({ error: "Nie znaleziono rocznika" });
        res.json({ message: "Rocznik zaktualizowany", updated });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Błąd serwera przy modyfikacji rocznika" });
    }
});

// Pobierz wszystkie roczniki
app.get("/api/roczniki", async (req, res) => {
    try {
        const roczniki = await Rocznik.find();
        res.json(roczniki);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Błąd serwera przy pobieraniu roczników" });
    }
});

// --- Dodaj wynik do rocznika ---
app.post("/api/roczniki/:id/wyniki", async (req, res) => {
    try {
        const { rywal, punktyN, punktyR, logoRywal, kolorRywal } = req.body;
        if (!rywal || punktyN == null || punktyR == null) {
            return res.status(400).json({ error: "Brak wymaganych danych wyniku" });
        }

        const rocznik = await Rocznik.findById(req.params.id);
        if (!rocznik) return res.status(404).json({ error: "Nie znaleziono rocznika" });

        rocznik.wyniki.push({ rywal, punktyN, punktyR, logoRywal, kolorRywal });
        await rocznik.save();

        res.json({ message: "✅ Wynik dodany", rocznik });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Błąd serwera przy dodawaniu wyniku" });
    }
});

// --- Pobierz wszystkie wyniki dla rocznika ---
app.get("/api/roczniki/:id/wyniki", async (req, res) => {
    try {
        const rocznik = await Rocznik.findById(req.params.id);
        if (!rocznik) return res.status(404).json({ error: "Nie znaleziono rocznika" });

        res.json(rocznik.wyniki);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Błąd serwera przy pobieraniu wyników" });
    }
});

// --- ENDPOINTY GALERIA ---

// POST: Dodaj zdjęcie do galerii
app.post("/api/gallery", upload.single("photo"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "Brak pliku do przesłania." });
        }

        const newPhoto = new Gallery({
            link: req.file.path, // Cloudinary link
            coms: []
        });

        await newPhoto.save();
        res.status(201).json({ message: "✅ Zdjęcie dodane", photo: newPhoto });
    } catch (error) {
        console.error("❌ Błąd dodawania zdjęcia:", error);
        res.status(500).json({ error: "Błąd serwera przy dodawaniu zdjęcia." });
    }
});

// DELETE: Usuń zdjęcie po ID
app.delete("/api/gallery/:id", async (req, res) => {
    try {
        const removed = await Gallery.findByIdAndDelete(req.params.id);
        if (!removed) {
            return res.status(404).json({ error: "Nie znaleziono zdjęcia." });
        }
        res.json({ message: "🗑️ Zdjęcie usunięte", removed });
    } catch (error) {
        console.error("❌ Błąd usuwania zdjęcia:", error);
        res.status(500).json({ error: "Błąd serwera przy usuwaniu zdjęcia." });
    }
});

// GET: Pobierz wszystkie zdjęcia
app.get("/api/gallery", async (req, res) => {
    try {
        const photos = await Gallery.find().sort({ uploadedAt: -1 });
        res.json(photos);
    } catch (error) {
        console.error("❌ Błąd pobierania zdjęć:", error);
        res.status(500).json({ error: "Błąd serwera przy pobieraniu zdjęć." });
    }
});

// POST: Dodaj komentarz do zdjęcia (na podstawie ID)
app.post("/api/gallery/:id/comment", async (req, res) => {
    try {
        const { userName, comText } = req.body;
        if (!userName || !comText) {
            return res.status(400).json({ error: "Brak danych komentarza." });
        }

        const photo = await Gallery.findById(req.params.id);
        if (!photo) {
            return res.status(404).json({ error: "Nie znaleziono zdjęcia." });
        }

        photo.coms.push({ userName, comText });
        await photo.save();

        res.json({ message: "💬 Komentarz dodany", photo });
    } catch (error) {
        console.error("❌ Błąd dodawania komentarza:", error);
        res.status(500).json({ error: "Błąd serwera przy dodawaniu komentarza." });
    }
});

const kafelekSchema = new mongoose.Schema({
    icon: String,
    nazwa: String,
    value: String,
    link: String
});

const Contact = mongoose.model("Contact", kafelekSchema);
const Social = mongoose.model("Social", kafelekSchema);

// ---- ENDPOINTY CONTACTS ---- //

// Pobierz wszystkie kontakty
app.get("/api/contacts", async (req, res) => {
    const contacts = await Contact.find();
    res.json(contacts);
});

// Dodaj kontakt
app.post("/api/contacts", async (req, res) => {
    const newContact = new Contact(req.body);
    await newContact.save();
    res.status(201).json(newContact);
});

// Edytuj kontakt
app.put("/api/contacts/:id", async (req, res) => {
    const updated = await Contact.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
});

// Usuń kontakt
app.delete("/api/contacts/:id", async (req, res) => {
    await Contact.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted successfully" });
});

// ---- ENDPOINTY SOCIALS ---- //

app.get("/api/socials", async (req, res) => {
    const socials = await Social.find();
    res.json(socials);
});

app.post("/api/socials", async (req, res) => {
    const newSocial = new Social(req.body);
    await newSocial.save();
    res.status(201).json(newSocial);
});

app.put("/api/socials/:id", async (req, res) => {
    const updated = await Social.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
});

app.delete("/api/socials/:id", async (req, res) => {
    await Social.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted successfully" });
});


const messageSchema = new mongoose.Schema({
    email: { type: String, required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const Message = mongoose.model("Message", messageSchema);
app.post("/api/messages", async (req, res) => {
    try {
        const { email, title, content } = req.body;
        if (!email || !title || !content) {
            return res.status(400).json({ error: "Wszystkie pola są wymagane." });
        }

        const newMessage = new Message({ email, title, content });
        await newMessage.save();
        res.status(201).json(newMessage);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Błąd serwera" });
    }
});

// Pobieranie wszystkich wiadomości
app.get("/api/messages", async (req, res) => {
    try {
        const messages = await Message.find().sort({ createdAt: -1 });
        res.json(messages);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Błąd serwera" });
    }
});
app.patch("/api/messages/:id/read", async (req, res) => {
    const msg = await Message.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );
    res.json(msg);
  });
// Usuwanie wiadomości po ID
app.delete("/api/messages/:id", async (req, res) => {
    try {
        const { id } = req.params;
        await Message.findByIdAndDelete(id);
        res.json({ message: "Wiadomość usunięta" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Błąd serwera" });
    }
});
app.post("/api/messages/:id/reply", async (req, res) => {
    const { replyText } = req.body;
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ error: "Nie znaleziono wiadomości" });
  
    await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: message.email,
      subject: "Odpowiedź na Twoje zgłoszenie",
      text: replyText,
    });
  
    res.json({ success: true });
  });


  const MatchSchema = new mongoose.Schema({
    rocznik: { type: String, required: true },
    opponentName: { type: String, required: true },
    opponentLogo: { type: String },   // URL lub logo rywala
    date: { type: String, required: true },   // np. "2025-09-01"
    time: { type: String, required: true },   // np. "18:00"
    address: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const Match = mongoose.model("Match", MatchSchema, "matches");
app.post("/api/matches", async (req, res) => {
    try {
        const { rocznik, opponentName, opponentLogo, date, time, address } = req.body;
        if (!rocznik || !opponentName || !date || !time || !address) {
            return res.status(400).json({ error: "Brak wymaganych danych meczu" });
        }

        const newMatch = new Match({ rocznik, opponentName, opponentLogo, date, time, address });
        await newMatch.save();

        res.status(201).json({ message: "✅ Mecz dodany", match: newMatch });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Błąd serwera przy dodawaniu meczu" });
    }
});

app.get("/api/matches/rocznik/:rocznik", async (req, res) => {
    try {
        const { rocznik } = req.params;
        const matches = await Match.find({ rocznik }).sort({ date: 1, time: 1 });
        res.json(matches);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Błąd serwera przy pobieraniu meczów" });
    }
});
app.put("/api/matches/:id", async (req, res) => {
    try {
        const updated = await Match.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updated) return res.status(404).json({ error: "Nie znaleziono meczu" });
        res.json({ message: "Mecz zaktualizowany", match: updated });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Błąd serwera przy edycji meczu" });
    }
});
app.delete("/api/matches/:id", async (req, res) => {
    try {
        const removed = await Match.findByIdAndDelete(req.params.id);
        if (!removed) return res.status(404).json({ error: "Nie znaleziono meczu" });
        res.json({ message: "Mecz usunięty", match: removed });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Błąd serwera przy usuwaniu meczu" });
    }
});

// 5. Start serwera
const PORT = process.env.PORT || 5005;
app.listen(PORT, () => console.log(`🚀 Server działa na porcie ${PORT}`));
