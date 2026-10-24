# Backend (Spring Boot + MongoDB)

## Bilder: Cloudflare R2

Bilder (Gerichte, Kategorien, Logo, Startseite) werden in **Cloudflare R2** gespeichert. Alle Restaurants
teilen sich einen Bucket, jedes Restaurant hat einen eigenen Ordner:

```
<RESTAURANT_SLUG>/foods/<uuid>.jpg
<RESTAURANT_SLUG>/categories/<uuid>.png
<RESTAURANT_SLUG>/site/<uuid>.webp
```

Sind nicht **alle** fünf `R2_*`-Variablen gesetzt, speichert das Backend Bilder in MongoDB (`food_images`)
und liefert sie über `GET /api/foods/images/{id}` aus. Das passiert auch, wenn R2 kurzzeitig nicht
erreichbar ist (Warnung im Log). Beim Start steht im Log, welcher Speicher aktiv ist:

```
Image storage: Cloudflare R2 (bucket restaurants, folder flavorhaus/)
Image storage: MongoDB (R2 not configured)
```

Erlaubt sind JPEG, PNG, WebP und GIF bis 5 MB (SVG nicht, weil es JavaScript enthalten kann).

### Einrichtung (einmalig)

1. **Bucket anlegen:** Cloudflare Dashboard → *R2 Object Storage* → *Create bucket*, z. B. `restaurants`.
2. **Öffentlich erreichbar machen** (Bucket → *Settings*), eine der beiden Möglichkeiten:
   - *Custom Domains* → *Connect Domain*, z. B. `images.example.com` (empfohlen, mit Cache und ohne Limits), oder
   - *Public Development URL* → *Allow* (`https://pub-….r2.dev`, nur zum Testen gedacht).
3. **API-Token anlegen:** *R2 Object Storage* → *Manage API tokens* → *Create API token*,
   Berechtigung **Object Read & Write**, nur für diesen Bucket. Angezeigt werden
   *Access Key ID* und *Secret Access Key* (nur einmal sichtbar).
4. **Account ID** steht auf der R2-Übersichtsseite (oder in der S3-URL `https://<accountId>.r2.cloudflarestorage.com`).

### Umgebungsvariablen (z. B. auf Railway)

| Variable | Beispiel | Beschreibung |
|---|---|---|
| `R2_ACCOUNT_ID` | `3f2a…` | Cloudflare Account ID |
| `R2_ACCESS_KEY_ID` | `a1b2…` | Access Key ID des API-Tokens |
| `R2_SECRET_ACCESS_KEY` | `c3d4…` | Secret Access Key des API-Tokens |
| `R2_BUCKET` | `restaurants` | Name des gemeinsamen Buckets |
| `R2_PUBLIC_URL` | `https://images.example.com` | Öffentliche Bucket-URL oder eigene Domain (ohne Ordner) |
| `RESTAURANT_SLUG` | `pizzeria-roma` | Ordner dieses Restaurants, nur `a-z`, `0-9`, `-` (Standard: `flavorhaus`) |

Das Backend löscht nur Bilder unter dem eigenen `RESTAURANT_SLUG/`. Bilder anderer Restaurants im
gemeinsamen Bucket bleiben unangetastet.

Die alten Variablen `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` und `AWS_S3_BUCKET_NAME` werden nicht mehr
verwendet und können entfernt werden. Bereits gespeicherte MongoDB-Bilder funktionieren weiter.

### Upload aus dem Admin-Panel

`POST /api/admin/images` (nur Admins), `multipart/form-data`:

- `file`: das Bild
- `folder` (optional): `foods`, `categories` oder `site` (Standard: `site`)

Antwort: `{ "url": "https://images.example.com/pizzeria-roma/site/….png" }`.
Fehler: HTTP 400 mit `{ "code": "IMAGE_INVALID", "field": "file" | "folder", … }` oder
`{ "code": "IMAGE_TOO_LARGE", "maxBytes": 5242880, … }`.
