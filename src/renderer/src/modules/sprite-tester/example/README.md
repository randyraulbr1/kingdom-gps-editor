# Sprite sheet de ejemplo

Ejemplo funcional para el módulo **Sprite Sheet / Personaje**.

- `soldado-demo.png` — hoja de 192×512, celdas de 64×64. Filas = 8 direcciones
  (abajo, abajo-izq, izquierda, arriba-izq, arriba, arriba-der, derecha, abajo-der);
  columnas = idle (azul), caminar frame 1 y frame 2 (verde). La flecha de cada
  celda indica la dirección.
- `soldado-demo.spritesheet.json` — configuración lista: idle (4 FPS) y walk
  (8 FPS) asignados a las 8 direcciones, con hitbox y velocidades.

## Cómo probarlo

1. Abre el módulo **Sprite Sheet / Personaje** (grupo Herramientas).
2. Pulsa **Importar sprite sheet** y elige `soldado-demo.png`.
3. Pulsa **Importar JSON** y elige `soldado-demo.spritesheet.json`.
4. Pestaña **Probar en mapa**: muévete con **WASD** (diagonales con W+D, etc.),
   corre con **Shift**. El personaje mira hacia la última dirección al soltar.
