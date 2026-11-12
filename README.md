# Portfolio

A dark, minimal static photography site. No build step: plain HTML, CSS, and a little vanilla JavaScript.

## Albums

- City & Architecture (`albums/city-architecture.html`)
- Landscapes (`albums/landscapes.html`)
- Portraits (`albums/portraits.html`)
- Black & White (`albums/black-white.html`) — no photographs yet; the page shows a coming-soon state

Processed images live under `images/<album-slug>/`. Originals are kept out of this repository.

## Adding photographs

1. Export a web JPEG (long edge about 2400px, quality about 82, sRGB) and a thumbnail (long edge about 800px). Optional WebP versions are used when present.
2. Strip location and other EXIF metadata (keep the file free of `GPS*` tags).
3. Save files as `images/<album-slug>/img-XXXX.jpg`, `img-XXXX-thumb.jpg`, and matching `.webp` files if you have them.
4. Add a `.photo-link` block to the album page, using the other album pages as a template. Set `width` and `height` to the real pixel sizes and write alt text as “Album name, photo N”.
5. Update the photograph count on the album page and the matching card on `index.html`. For Black & White, replace the coming-soon empty state and the home-page placeholder card once the first photo is ready.

## Contact and about

The photographer’s name and email are not in this repo yet. The about text is a placeholder, and the contact address is marked `TODO` in `contact.html`.
