# Lantern & Leaves Photography

A dark, minimal static photography site. No build step: plain HTML, CSS, and a little vanilla JavaScript.

## Albums

- City & Architecture (`albums/city-architecture.html`)
- Landscapes (`albums/landscapes.html`)
- Nature (`albums/nature.html`)
- Portraits (`albums/portraits.html`)
- Black & White (`albums/black-white.html`)

Processed images live under `images/<album-slug>/`. Originals are kept out of this repository.

## Adding photographs

1. Export a web JPEG (long edge about 2400px, quality about 82, sRGB), a thumbnail 600px wide (JPEG and WebP), and a 900px-wide WebP thumbnail (`-thumb-900.webp`) for high-density screens.
2. Strip location and other EXIF metadata (keep the file free of `GPS*` tags).
3. Save files as `images/<album-slug>/img-XXXX.jpg`, `img-XXXX-thumb.jpg`, and matching `.webp` files if you have them.
4. Add a `.photo-link` block to the album page, using the other album pages as a template. Set `width` and `height` to the real pixel sizes. The visible caption (`data-alt`) is the photo title from the file name, or “Album name, photo N”; the thumbnail’s `alt` is a short factual description of the photo (never a place name).
5. Update the photograph count on the album page. The home page gallery portals (one random photo per album, albums taken from the nav) are rebuilt by `build-portals.py` in the pipeline folder; nothing per photo is needed on `index.html`.

## Contact and about

The photographer’s name and email are not in this repo yet. The about text is a placeholder, and the contact address is marked `TODO` in `contact.html`.
