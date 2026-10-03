# Light cone catalog

Source: https://github.com/Mar-7th/StarRailRes
Korean index: https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/index_new/kr/light_cones.json

The imported index contains 170 light cones: 72 five-star, 73 four-star, and 25 three-star entries.
`assets/js/light-cones.js` is loaded directly by `index.html`, including when opened as a local file. Original data is in `assets/data/light-cones-source.json`.
Previews for all rarities, including all 25 three-star entries, are stored under `assets/lightcones/{id}.png` and matched by the source index ID.
The collection catalog is independent of the existing character event warp pools.
Full-size light cone illustrations for all rarities are stored under `assets/lightcone-art/{id}.png`. Failed or slow full-size loads fall back to the matching preview.
Tomorrow's Colors (23055, 내일에 바치는 색채) is the featured light cone on the Pearl light cone tab.
Character and light cone tabs maintain independent pity and featured-guarantee state.
