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

## Four-star acquisition

The 73 four-star entries have explicit acquisition metadata in `light-cones.js`:
31 warp, 16 Light Cone Manifest/shop and rewards, 17 Nameless Honor, and 9 event rewards/exchanges.
Collection cards are grouped by acquisition and marked with warp eligibility. The artwork viewer also shows the acquisition category.
Both character and light-cone warp pools take their four-star light cones from the same eligible catalog entries; featured cones must also be eligible.
New IDs require an explicit classification before entering warp pools. Acquisition categories describe routes, not whether a reward or exchange is currently available.

References checked on 2026-10-05:
- https://honkai-star-rail.fandom.com/wiki/Light_Cone
- https://honkai-star-rail.fandom.com/wiki/Victory_In_a_Blink (21050: shop/rewards, not Nameless Honor)
- https://honkai-star-rail.fandom.com/wiki/A_Dream_Scented_in_Wheat
- https://game8.co/games/Honkai-Star-Rail/archives/579618 (21064: Light Cone Manifest)
- https://game8.co/games/Honkai-Star-Rail/archives/579619 (21065: Nameless Honor)

## Five-star acquisition

The 72 five-star catalog entries are grouped into 7 standard-warp cones, 54 limited event cones, 4 collaboration cones, and 7 Herta's Store cones.
The standard group is exactly 23000, 23002, 23003, 23004, 23005, 23012, and 23013.
Only these seven can appear when the featured five-star light cone is missed. Character event warps award five-star characters, not five-star light cones.
Limited cones require their own featured warp; collaboration cones require their own collaboration warp. Herta's Store cones cannot drop from any warp.
The simulator lets users select historical pickups; the catalog category does not imply a banner is currently running in the live game.
The light-cone banner's standard pool now derives from this classification. Cards and expanded artwork show the acquisition conditions.

References checked on 2026-10-05:
- https://honkai-star-rail.fandom.com/wiki/Stellar_Warp
- https://honkai-star-rail.fandom.com/wiki/Elation_Brimming_With_Blessings
