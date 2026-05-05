// Sprites pixel art SVG pour chaque Pokémon

const S = ({ children, size = 96, viewBox = "0 0 32 32" }) => (
  <svg width={size} height={size} viewBox={viewBox} style={{ imageRendering: "pixelated" }}>
    {children}
  </svg>
);

const px = (color, x, y, w = 1, h = 1) => (
  <rect key={`${x}-${y}`} x={x} y={y} width={w} height={h} fill={color} />
);

// ── Salamèche ──
export function SpriteSalameche({ size = 96 }) {
  return (
    <S size={size}>
      {/* Queue */}
      {px("#ff8844", 20, 22, 4, 2)}
      {px("#ff4400", 23, 20, 3, 2)}
      {px("#ffcc00", 25, 18, 2, 2)}
      {/* Corps orange */}
      {px("#ff8844", 11, 14, 10, 10)}
      {px("#ff6622", 10, 16, 12, 7)}
      {px("#ffaa66", 12, 15, 8, 8)}
      {/* Ventre */}
      {px("#ffcc99", 13, 17, 6, 6)}
      {/* Pattes */}
      {px("#ff8844", 11, 24, 3, 3)}
      {px("#ff8844", 18, 24, 3, 3)}
      {px("#cc5500", 11, 27, 3, 2)}
      {px("#cc5500", 18, 27, 3, 2)}
      {/* Bras */}
      {px("#ff8844", 8, 16, 3, 4)}
      {px("#ff8844", 21, 16, 3, 4)}
      {/* Tête */}
      {px("#ff8844", 11, 7, 10, 8)}
      {px("#ff9955", 10, 9, 12, 5)}
      {/* Yeux */}
      {px("#ffffff", 13, 9, 3, 3)}
      {px("#ffffff", 17, 9, 3, 3)}
      {px("#1144aa", 14, 10, 2, 2)}
      {px("#1144aa", 18, 10, 2, 2)}
      {px("#000000", 14, 10, 1, 1)}
      {px("#000000", 18, 10, 1, 1)}
      {/* Reflets yeux */}
      {px("#ffffff", 15, 10, 1, 1)}
      {px("#ffffff", 19, 10, 1, 1)}
      {/* Bouche */}
      {px("#cc4400", 14, 13, 5, 1)}
      {/* Narines */}
      {px("#cc6633", 13, 12, 1, 1)}
      {px("#cc6633", 17, 12, 1, 1)}
      {/* Flamme queue */}
      {px("#ffff44", 25, 16, 3, 2)}
      {px("#ff8800", 26, 14, 2, 2)}
      {px("#ffff00", 27, 13, 2, 3)}
    </S>
  );
}

// ── Carapuce ──
export function SpriteCarapuce({ size = 96 }) {
  return (
    <S size={size}>
      {/* Carapace */}
      {px("#88aa44", 10, 14, 12, 10)}
      {px("#669922", 11, 13, 10, 12)}
      {px("#aabb55", 12, 15, 8, 8)}
      {/* Motifs carapace */}
      {px("#557711", 13, 16, 2, 2)}
      {px("#557711", 17, 16, 2, 2)}
      {px("#557711", 15, 19, 2, 2)}
      {px("#557711", 13, 22, 2, 2)}
      {px("#557711", 17, 22, 2, 2)}
      {/* Corps bleu */}
      {px("#6699ff", 11, 18, 10, 6)}
      {px("#4477ee", 12, 17, 8, 8)}
      {/* Ventre */}
      {px("#88aaff", 13, 19, 6, 5)}
      {/* Pattes */}
      {px("#6699ff", 10, 24, 3, 3)}
      {px("#6699ff", 19, 24, 3, 3)}
      {px("#4477cc", 10, 27, 3, 2)}
      {px("#4477cc", 19, 27, 3, 2)}
      {/* Bras */}
      {px("#6699ff", 8, 17, 3, 4)}
      {px("#6699ff", 21, 17, 3, 4)}
      {/* Tête */}
      {px("#6699ff", 11, 6, 10, 8)}
      {px("#4488ff", 10, 8, 12, 5)}
      {/* Yeux */}
      {px("#ffffff", 13, 8, 3, 3)}
      {px("#ffffff", 17, 8, 3, 3)}
      {px("#cc2200", 14, 9, 2, 2)}
      {px("#cc2200", 18, 9, 2, 2)}
      {px("#000000", 14, 9, 1, 1)}
      {px("#000000", 18, 9, 1, 1)}
      {px("#ffffff", 15, 9, 1, 1)}
      {px("#ffffff", 19, 9, 1, 1)}
      {/* Bouche */}
      {px("#3366cc", 14, 13, 4, 1)}
      {/* Queue */}
      {px("#6699ff", 21, 21, 4, 2)}
      {px("#6699ff", 23, 19, 3, 3)}
    </S>
  );
}

// ── Bulbizarre ──
export function SpriteBulbizarre({ size = 96 }) {
  return (
    <S size={size}>
      {/* Bulbe */}
      {px("#448833", 12, 4, 8, 8)}
      {px("#336622", 11, 6, 10, 6)}
      {px("#55aa44", 13, 5, 6, 6)}
      {px("#66bb55", 14, 5, 3, 3)}
      {/* Corps vert */}
      {px("#66cc55", 10, 14, 12, 10)}
      {px("#55bb44", 9, 16, 14, 7)}
      {px("#88dd66", 11, 15, 10, 8)}
      {/* Taches foncées */}
      {px("#44aa33", 11, 16, 2, 2)}
      {px("#44aa33", 19, 16, 2, 2)}
      {px("#44aa33", 15, 20, 2, 2)}
      {/* Pattes */}
      {px("#66cc55", 10, 24, 3, 3)}
      {px("#66cc55", 19, 24, 3, 3)}
      {px("#44aa33", 10, 27, 3, 2)}
      {px("#44aa33", 19, 27, 3, 2)}
      {/* Tête */}
      {px("#66cc55", 10, 8, 12, 8)}
      {px("#88dd66", 11, 9, 10, 5)}
      {/* Yeux */}
      {px("#ffffff", 12, 10, 3, 3)}
      {px("#ffffff", 17, 10, 3, 3)}
      {px("#cc0000", 13, 11, 2, 2)}
      {px("#cc0000", 18, 11, 2, 2)}
      {px("#000000", 13, 11, 1, 1)}
      {px("#000000", 18, 11, 1, 1)}
      {px("#ffffff", 14, 11, 1, 1)}
      {px("#ffffff", 19, 11, 1, 1)}
      {/* Bouche */}
      {px("#44aa33", 13, 14, 6, 1)}
    </S>
  );
}

// ── Pikachu ──
export function SpritePikachu({ size = 96 }) {
  return (
    <S size={size}>
      {/* Oreilles */}
      {px("#ffdd00", 10, 2, 3, 8)}
      {px("#000000", 10, 2, 3, 3)}
      {px("#ffdd00", 19, 2, 3, 8)}
      {px("#000000", 19, 2, 3, 3)}
      {/* Corps jaune */}
      {px("#ffdd00", 9, 14, 14, 10)}
      {px("#ffcc00", 8, 16, 16, 7)}
      {px("#ffee44", 10, 15, 12, 8)}
      {/* Joues rouges */}
      {px("#ff4444", 9, 18, 3, 2)}
      {px("#ff4444", 20, 18, 3, 2)}
      {/* Ventre */}
      {px("#ffeeaa", 12, 18, 8, 6)}
      {/* Pattes */}
      {px("#ffdd00", 10, 24, 3, 3)}
      {px("#ffdd00", 19, 24, 3, 3)}
      {px("#cc8800", 10, 27, 3, 2)}
      {px("#cc8800", 19, 27, 3, 2)}
      {/* Queue */}
      {px("#ffdd00", 22, 20, 5, 2)}
      {px("#ffdd00", 24, 18, 3, 2)}
      {px("#000000", 22, 20, 5, 1)}
      {/* Tête */}
      {px("#ffdd00", 9, 7, 14, 8)}
      {px("#ffee44", 10, 8, 12, 5)}
      {/* Yeux */}
      {px("#000000", 12, 9, 3, 3)}
      {px("#000000", 17, 9, 3, 3)}
      {px("#ffffff", 13, 9, 1, 1)}
      {px("#ffffff", 18, 9, 1, 1)}
      {/* Nez */}
      {px("#884400", 15, 12, 2, 1)}
      {/* Bouche */}
      {px("#cc6600", 13, 13, 2, 1)}
      {px("#cc6600", 17, 13, 2, 1)}
      {/* Rayures dos */}
      {px("#cc9900", 11, 16, 2, 1)}
      {px("#cc9900", 19, 16, 2, 1)}
    </S>
  );
}

// ── Osselait ──
export function SpriteOsselait({ size = 96 }) {
  return (
    <S size={size}>
      {/* Corps gris */}
      {px("#bbbbbb", 11, 12, 10, 12)}
      {px("#aaaaaa", 10, 14, 12, 8)}
      {px("#cccccc", 12, 13, 8, 9)}
      {/* Côtes */}
      {px("#888888", 11, 15, 10, 1)}
      {px("#888888", 11, 17, 10, 1)}
      {px("#888888", 11, 19, 10, 1)}
      {/* Pattes */}
      {px("#bbbbbb", 11, 24, 3, 4)}
      {px("#bbbbbb", 18, 24, 3, 4)}
      {/* Bras/os */}
      {px("#bbbbbb", 8, 14, 3, 3)}
      {px("#bbbbbb", 21, 14, 3, 3)}
      {px("#cccccc", 7, 13, 3, 2)}
      {px("#cccccc", 22, 13, 3, 2)}
      {/* Tête crâne */}
      {px("#cccccc", 10, 5, 12, 8)}
      {px("#dddddd", 11, 6, 10, 5)}
      {/* Orbites */}
      {px("#000000", 12, 7, 4, 4)}
      {px("#000000", 17, 7, 4, 4)}
      {px("#550000", 13, 8, 2, 2)}
      {px("#550000", 18, 8, 2, 2)}
      {/* Nez crâne */}
      {px("#999999", 15, 11, 2, 1)}
      {/* Dents */}
      {px("#ffffff", 12, 12, 2, 2)}
      {px("#ffffff", 15, 12, 2, 2)}
      {px("#ffffff", 18, 12, 2, 2)}
    </S>
  );
}

// ── Abra ──
export function SpriteAbra({ size = 96 }) {
  return (
    <S size={size}>
      {/* Corps marron */}
      {px("#cc9944", 10, 14, 12, 10)}
      {px("#bb8833", 9, 16, 14, 7)}
      {px("#ddaa55", 11, 15, 10, 7)}
      {/* Ventre */}
      {px("#eebb77", 13, 17, 6, 5)}
      {/* Pattes */}
      {px("#cc9944", 11, 24, 3, 4)}
      {px("#cc9944", 18, 24, 3, 4)}
      {/* Bras croisés */}
      {px("#cc9944", 8, 16, 4, 3)}
      {px("#cc9944", 20, 16, 4, 3)}
      {/* Oreilles pointues */}
      {px("#cc9944", 9, 4, 3, 6)}
      {px("#cc9944", 20, 4, 3, 6)}
      {px("#ff9999", 10, 5, 1, 4)}
      {px("#ff9999", 21, 5, 1, 4)}
      {/* Tête */}
      {px("#cc9944", 10, 8, 12, 7)}
      {px("#ddaa55", 11, 9, 10, 4)}
      {/* Yeux fermés (dors) */}
      {px("#000000", 12, 11, 4, 1)}
      {px("#000000", 17, 11, 4, 1)}
      {/* Moustaches */}
      {px("#887744", 7, 12, 5, 1)}
      {px("#887744", 20, 12, 5, 1)}
      {/* Étoile psy */}
      {px("#ff88ff", 15, 6, 2, 2)}
      {px("#ff88ff", 14, 7, 4, 1)}
    </S>
  );
}

// ── Ronflex ──
export function SpriteRonflex({ size = 96 }) {
  return (
    <S size={size}>
      {/* Corps énorme */}
      {px("#7777bb", 6, 10, 20, 16)}
      {px("#6666aa", 5, 12, 22, 12)}
      {px("#8888cc", 7, 11, 18, 14)}
      {/* Ventre beige */}
      {px("#ddcc99", 9, 13, 14, 12)}
      {px("#eedd99", 10, 14, 12, 10)}
      {/* Pattes */}
      {px("#7777bb", 7, 26, 5, 3)}
      {px("#7777bb", 20, 26, 5, 3)}
      {/* Bras */}
      {px("#7777bb", 5, 14, 4, 5)}
      {px("#7777bb", 23, 14, 4, 5)}
      {/* Tête */}
      {px("#7777bb", 10, 4, 12, 8)}
      {px("#8888cc", 11, 5, 10, 5)}
      {/* Yeux fermés (dort) */}
      {px("#000000", 12, 8, 4, 1)}
      {px("#000000", 17, 8, 4, 1)}
      {/* ZZZ */}
      {px("#ffffff", 22, 4, 2, 1)}
      {px("#ffffff", 24, 5, 2, 1)}
      {px("#ffffff", 22, 5, 4, 1)}
      {/* Bouche ouverte */}
      {px("#000000", 13, 10, 6, 2)}
      {px("#ff8888", 14, 10, 4, 1)}
    </S>
  );
}

// ── Générique pour les autres ──
function SpriteGeneric({ size = 96, color = "#888888", name = "?" }) {
  const c = color;
  const d = color.replace("#", "");
  const darkColor = "#" + d.match(/.{2}/g).map(x => Math.max(0, parseInt(x, 16) - 40).toString(16).padStart(2, "0")).join("");
  const lightColor = "#" + d.match(/.{2}/g).map(x => Math.min(255, parseInt(x, 16) + 40).toString(16).padStart(2, "0")).join("");
  return (
    <S size={size}>
      {px(darkColor, 10, 10, 12, 14)}
      {px(c, 9, 12, 14, 10)}
      {px(lightColor, 11, 11, 10, 10)}
      {px(lightColor, 12, 12, 8, 7)}
      {px(darkColor, 11, 24, 4, 4)}
      {px(darkColor, 17, 24, 4, 4)}
      {px(c, 10, 6, 12, 7)}
      {px(lightColor, 11, 7, 10, 4)}
      {px("#ffffff", 12, 8, 3, 3)}
      {px("#ffffff", 17, 8, 3, 3)}
      {px("#222222", 13, 9, 2, 2)}
      {px("#222222", 18, 9, 2, 2)}
      {px("#ffffff", 14, 9, 1, 1)}
      {px("#ffffff", 19, 9, 1, 1)}
    </S>
  );
}

// ── Reptincel ──
export function SpriteReptincel({ size = 96 }) {
  return (
    <S size={size}>
      {px("#ff5500", 20, 22, 5, 2)}
      {px("#ff3300", 23, 19, 4, 3)}
      {px("#ffaa00", 26, 17, 3, 3)}
      {px("#ff6622", 10, 12, 12, 12)}
      {px("#ff4400", 9, 14, 14, 9)}
      {px("#ff8844", 11, 13, 10, 10)}
      {px("#ffcc99", 13, 16, 6, 7)}
      {px("#ff6622", 10, 24, 4, 3)}
      {px("#ff6622", 18, 24, 4, 3)}
      {px("#cc3300", 10, 27, 4, 2)}
      {px("#cc3300", 18, 27, 4, 2)}
      {px("#ff6622", 7, 14, 4, 5)}
      {px("#ff6622", 21, 14, 4, 5)}
      {px("#ff6622", 10, 5, 12, 9)}
      {px("#ff8844", 11, 6, 10, 6)}
      {px("#ffffff", 12, 7, 3, 4)}
      {px("#ffffff", 17, 7, 3, 4)}
      {px("#1144aa", 13, 8, 2, 3)}
      {px("#1144aa", 18, 8, 2, 3)}
      {px("#000000", 13, 8, 1, 1)}
      {px("#000000", 18, 8, 1, 1)}
      {px("#ffffff", 14, 8, 1, 1)}
      {px("#ffffff", 19, 8, 1, 1)}
      {px("#cc4400", 13, 12, 6, 1)}
      {px("#ffff44", 27, 15, 3, 3)}
      {px("#ff8800", 28, 13, 2, 3)}
    </S>
  );
}

// ── Dracaufeu ──
export function SpriteDracaufeu({ size = 96 }) {
  return (
    <S size={size}>
      {px("#ff4400", 9, 10, 14, 14)}
      {px("#ff2200", 8, 12, 16, 10)}
      {px("#ff6622", 10, 11, 12, 12)}
      {px("#ffcc99", 12, 14, 8, 8)}
      {px("#4444ff", 7, 7, 4, 10)}
      {px("#3333ee", 8, 8, 3, 8)}
      {px("#4444ff", 21, 7, 4, 10)}
      {px("#3333ee", 21, 8, 3, 8)}
      {px("#ff4400", 9, 24, 5, 3)}
      {px("#ff4400", 18, 24, 5, 3)}
      {px("#cc3300", 9, 27, 5, 2)}
      {px("#cc3300", 18, 27, 5, 2)}
      {px("#ff4400", 22, 18, 6, 3)}
      {px("#ff6600", 25, 15, 4, 4)}
      {px("#ffff00", 27, 13, 3, 4)}
      {px("#ff8800", 28, 11, 2, 4)}
      {px("#ff4400", 9, 3, 14, 9)}
      {px("#ff6622", 10, 4, 12, 6)}
      {px("#ffffff", 11, 5, 4, 4)}
      {px("#ffffff", 17, 5, 4, 4)}
      {px("#1144aa", 12, 6, 3, 3)}
      {px("#1144aa", 18, 6, 3, 3)}
      {px("#000000", 12, 6, 1, 1)}
      {px("#000000", 18, 6, 1, 1)}
      {px("#ffffff", 13, 6, 1, 1)}
      {px("#ffffff", 19, 6, 1, 1)}
      {px("#880000", 14, 10, 3, 1)}
      {px("#880000", 13, 9, 1, 1)}
      {px("#880000", 17, 9, 1, 1)}
    </S>
  );
}

// ── Map speciesId → composant ──
const SPRITE_MAP = {
  salameche:  SpriteSalameche,
  reptincel:  SpriteReptincel,
  dracaufeu:  SpriteDracaufeu,
  carapuce:   SpriteCarapuce,
  bulbizarre: SpriteBulbizarre,
  pikachu:    SpritePikachu,
  osselait:   SpriteOsselait,
  abra:       SpriteAbra,
  ronflex:    SpriteRonflex,
};

export default function PokemonPixelSprite({ pokemon, size = 96 }) {
  const Sprite = SPRITE_MAP[pokemon.speciesId];
  if (Sprite) return <Sprite size={size} />;
  // Générique coloré pour les autres
  const TYPE_COLORS = {
    FEU: "#ff6030", EAU: "#6890f0", PLANTE: "#78c850",
    ELECTRIK: "#f8d030", NORMAL: "#a8a878", PSY: "#f85888",
    ROCHE: "#b8a038", TENEBRES: "#705848", DRAGON: "#7038f8",
  };
  return <SpriteGeneric size={size} color={TYPE_COLORS[pokemon.type] || "#888888"} name={pokemon.name} />;
}
