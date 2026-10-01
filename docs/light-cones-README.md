# Light cone catalog

Source: https://github.com/Mar-7th/StarRailRes
Korean index: https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/index_new/kr/light_cones.json

The imported index contains 170 light cones: 72 five-star, 73 four-star, and 25 three-star entries.
`assets/js/light-cones.js` is loaded directly by `index.html`, including when opened as a local file. Original data is in `assets/data/light-cones-source.json`.
4/5-star previews are stored under `assets/lightcones/`. All 3-star entries use `assets/images/lightcone-3star.png`, as requested.
The collection catalog is independent of the existing character event warp pools.
Full-size 4/5-star light cone illustrations are stored under `assets/lightcone-art/`. Failed or slow full-size loads fall back to the preview.
Tomorrow's Colors (23055, 내일에 바치는 색채) is the featured light cone on the Pearl light cone tab.
Character and light cone tabs maintain independent pity and featured-guarantee state.
