import * as THREE from 'three';

export function createBookshelf({ gridUnit, colors, addBox }) {
    const bsGroup = new THREE.Group();
    const sh = gridUnit * 2, sw = gridUnit * 0.8, sd = gridUnit * 0.3, pt = 0.06;
    addBox(pt, sh, sd, -sw / 2 + pt / 2, sh / 2, 0, colors.bookshelf, bsGroup);
    addBox(pt, sh, sd, sw / 2 - pt / 2, sh / 2, 0, colors.bookshelf, bsGroup);
    for (let i = 0; i <= 4; i++) {
        const sY = (sh / 4) * i + (i == 0 ? pt / 2 : -pt / 2);
        const csY = sY - pt / 2;
        addBox(sw - pt * 2, pt, sd * 0.95, 0, csY, 0, colors.bookshelf, bsGroup);
        if (i > 0 && i < 4) {
            const bsw = sw - pt * 2 - 0.2;
            let cbX = -bsw / 2;
            const bY = csY + pt / 2;
            for (let b = 0; b < 8; b++) {
                const bw = (0.05 + Math.random() * 0.15) * gridUnit;
                const bh = (0.2 + Math.random() * 0.15) * gridUnit;
                const bD = (sd * 0.9) * (0.8 + Math.random() * 0.2);
                const bc = colors.book_colors[Math.floor(Math.random() * colors.book_colors.length)];
                if (cbX + bw / 2 < bsw / 2) {
                    addBox(bw, bh, bD, cbX + bw / 2, bY + bh / 2, 0, bc, bsGroup);
                    cbX += bw + (0.02 + Math.random() * 0.05) * gridUnit;
                } else break;
            }
        }
    }
    addBox(sw - pt * 2, sh - pt * 2, pt, 0, sh / 2, -sd / 2 + pt / 2, colors.bookshelf, bsGroup);
    addBox(sw * 0.82, 0.06, sd * 0.2, 0, sh + 0.04, 0, 0x4b3828, bsGroup);
    addBox(0.16, 0.28, 0.16, -sw * 0.25, sh + 0.2, 0, colors.meeting_accent, bsGroup);
    addBox(0.08, 0.18, 0.08, sw * 0.22, sh + 0.14, 0, 0xf2d16b, bsGroup);
    addBox(sw * 0.7, 0.04, sd * 0.9, 0, 0.08, 0, 0x6b4f3a, bsGroup);
    
    return { bsGroup, sd };
}
