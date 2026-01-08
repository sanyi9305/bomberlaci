import { TILE_SIZE, TILE_TYPES, ASSETS } from '../core/Constants.js';

export default class Explosion {
    constructor(r, c) {
        this.r = r;
        this.c = c;
        this.maxTimer = 300; // Maximális élettartam (referenciának)
        this.timer = this.maxTimer;
    }

    update(deltaTime) {
        this.timer -= deltaTime;
        return this.timer <= 0;
    }

    draw(ctx) {
        const x = this.c * TILE_SIZE;
        const y = this.r * TILE_SIZE;
        const centerX = x + TILE_SIZE / 2;
        const centerY = y + TILE_SIZE / 2;

        // Kiszámoljuk, hol tartunk az életciklusban (1.0 = most robbant, 0.0 = vége)
        const lifePercentage = this.timer / this.maxTimer;

        // -----------------------------------------------------------
        // 1. ÁTLÁTSZÓSÁG KEZELÉSE (FADE OUT)
        // -----------------------------------------------------------
        // Mentsük el a jelenlegi alpha értéket
        const originalAlpha = ctx.globalAlpha;
        // Ahogy fogy az idő, úgy lesz egyre átlátszóbb a robbanás
        // A Math.max biztosítja, hogy ne menjen 0 alá
        ctx.globalAlpha = Math.max(0, lifePercentage);


        // -----------------------------------------------------------
        // 2. KÉP KIRAJZOLÁSA (Ha van asset, akkor azt effektezzük)
        // -----------------------------------------------------------
        const explosionImg = ASSETS.tiles[TILE_TYPES.EXPLOSION];

        if (explosionImg && explosionImg.complete && explosionImg.naturalWidth !== 0) {
            // Ha van kép, akkor kicsit "rángatjuk" (shake effect), hogy instabilnak tűnjön
            const shakeX = (Math.random() - 0.5) * 4;
            const shakeY = (Math.random() - 0.5) * 4;

            ctx.drawImage(explosionImg, x + shakeX, y + shakeY, TILE_SIZE, TILE_SIZE);

            // Visszaállítjuk az alphát és kilépünk
            ctx.globalAlpha = originalAlpha;
            return;
        }


        // -----------------------------------------------------------
        // 3. PROCEDURÁLIS PLAZMA EFFEKT (EZ A LÉNYEG!)
        // -----------------------------------------------------------
        // Nem emojit használunk, hanem "fényt" rajzolunk.

        // A sugár pulzáljon kicsit az életciklus alatt
        // Kezdetben kicsi (robbanás tágulása), majd eléri a teljes méretet
        const expansion = Math.min(1, (1 - lifePercentage) * 5); // Gyors tágulás az elején
        const radius = (TILE_SIZE / 2) * 0.8 * expansion;

        // SUGÁRIRÁNYÚ GRADIENS (Forró közép -> Hűlő szél)
        const gradient = ctx.createRadialGradient(
            centerX, centerY, radius * 0.2, // Belső kör (mag)
            centerX, centerY, radius * 1.5  // Külső kör (szél)
        );

        // Színek beállítása: Fehér (forró) -> Sárga -> Narancs -> Piros -> Átlátszó
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');      // Mag: Fehér izzás
        gradient.addColorStop(0.2, 'rgba(255, 220, 0, 1)');     // Belső: Sárga
        gradient.addColorStop(0.5, 'rgba(255, 69, 0, 0.8)');     // Közép: Narancsvörös
        gradient.addColorStop(1, 'rgba(100, 0, 0, 0)');          // Szél: Átlátszó vörös

        ctx.fillStyle = gradient;

        // Kirajzoljuk a kört
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // -----------------------------------------------------------
        // 4. EMOJI RÉTEG (OPCIONÁLIS EXTRA)
        // -----------------------------------------------------------
        // Halványan rátehetjük az emojit is, ha "rajzosabb" hatást akarsz,
        // de most inkább szikrákat (kis köröket) rajzolunk helyette.

        // 3-4 random szikra a robbanás körül
        for (let i = 0; i < 3; i++) {
            const sparkAngle = Math.random() * Math.PI * 2;
            const sparkDist = (Math.random() * TILE_SIZE / 2) * expansion;
            const sparkSize = Math.random() * 4;

            ctx.fillStyle = `rgba(255, 255, 0, ${lifePercentage})`; // Sárga szikrák
            ctx.beginPath();
            ctx.arc(centerX + Math.cos(sparkAngle) * sparkDist,
                centerY + Math.sin(sparkAngle) * sparkDist,
                sparkSize, 0, Math.PI * 2);
            ctx.fill();
        }

        // RESET (Nagyon fontos!)
        // Ha ezt nem csináljuk meg, minden utána következő rajz (pl. játékos) átlátszó marad!
        ctx.globalAlpha = originalAlpha;
    }
}