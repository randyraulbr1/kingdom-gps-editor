/**
 * Probar códigos: mini-playground de fragmentos de UI del juego (inventario,
 * barras de vida/hambre/XP, menú de amigos…). Se edita HTML/CSS/JS y se ve el
 * resultado en una vista previa aislada (iframe srcdoc). Lógica pura y testeable:
 * ensamblar el documento de vista previa a partir de las tres partes.
 */

export interface CodeSnippet {
  id: string
  name: string
  description: string
  html: string
  css: string
  js: string
}

/** Presets de ejemplo listos para editar. */
export const SNIPPET_PRESETS: CodeSnippet[] = [
  {
    id: 'inventory',
    name: 'Inventario',
    description: 'Rejilla de ranuras con objetos.',
    html: `<div class="inv">
  <div class="slot"><span>🗡️</span><b>2</b></div>
  <div class="slot"><span>🛡️</span></div>
  <div class="slot"><span>🧪</span><b>5</b></div>
  <div class="slot"></div>
  <div class="slot"><span>💰</span><b>99</b></div>
  <div class="slot"></div>
</div>`,
    css: `.inv{display:grid;grid-template-columns:repeat(3,56px);gap:8px;padding:12px;background:#1b1f2a;border-radius:10px;width:max-content}
.slot{position:relative;width:56px;height:56px;background:#2a3040;border:1px solid #3a4152;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:26px}
.slot b{position:absolute;right:3px;bottom:1px;font-size:11px;color:#ffd166}`,
    js: `document.querySelectorAll('.slot').forEach(s=>s.onclick=()=>s.style.outline='2px solid #4c9ffe');`
  },
  {
    id: 'bars',
    name: 'Barras de vida, hambre y XP',
    description: 'Barras de estado del jugador.',
    html: `<div class="hud">
  <div class="bar"><i style="--c:#ef4444;--w:75%"></i><label>Vida 75/100</label></div>
  <div class="bar"><i style="--c:#f59e0b;--w:40%"></i><label>Hambre 40/100</label></div>
  <div class="bar"><i style="--c:#22c55e;--w:60%"></i><label>XP 60%</label></div>
</div>`,
    css: `.hud{display:flex;flex-direction:column;gap:8px;width:260px;font-family:sans-serif}
.bar{position:relative;height:18px;background:#222;border-radius:9px;overflow:hidden}
.bar i{display:block;height:100%;width:var(--w);background:var(--c);transition:width .3s}
.bar label{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:11px;color:#fff;text-shadow:0 1px 2px #000}`,
    js: `let hp=75;setInterval(()=>{hp=(hp+5)%100;const b=document.querySelector('.bar i');if(b)b.style.setProperty('--w',hp+'%');},1000);`
  },
  {
    id: 'friends',
    name: 'Menú de amigos',
    description: 'Lista de amigos con estado.',
    html: `<div class="friends">
  <h3>Amigos</h3>
  <div class="f"><span class="dot on"></span>Randy <em>en línea</em></div>
  <div class="f"><span class="dot"></span>Luna <em>hace 2h</em></div>
  <div class="f"><span class="dot on"></span>Kilo <em>jugando</em></div>
</div>`,
    css: `.friends{width:240px;background:#161a22;border-radius:10px;padding:10px;font-family:sans-serif;color:#e5e7eb}
.friends h3{margin:0 0 8px;font-size:13px;color:#9aa4b2}
.f{display:flex;align-items:center;gap:8px;padding:6px;border-radius:6px}
.f:hover{background:#222836}
.dot{width:9px;height:9px;border-radius:50%;background:#555}
.dot.on{background:#22c55e}
.f em{margin-left:auto;font-size:11px;color:#7c8698}`,
    js: `document.querySelectorAll('.f').forEach(f=>f.onclick=()=>alert('Abrir chat con '+f.textContent.trim()));`
  }
]

/**
 * Ensambla el documento HTML completo para la vista previa (iframe srcdoc),
 * inyectando css y js. Aislado del editor; nada aquí toca el proceso principal.
 */
export function buildPreviewHtml(snippet: { html: string; css: string; js: string }): string {
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
  html,body{margin:0;background:#0e1117;color:#e5e7eb;font-family:system-ui,sans-serif}
  body{display:flex;align-items:center;justify-content:center;min-height:100vh;padding:16px;box-sizing:border-box}
${snippet.css}
</style>
</head>
<body>
${snippet.html}
<script>
try {
${snippet.js}
} catch (e) {
  document.body.insertAdjacentHTML('beforeend', '<pre style="color:#f87171;position:fixed;left:8px;bottom:8px;font-size:11px">'+String(e)+'</pre>');
}
</script>
</body>
</html>`
}

export function getPreset(id: string): CodeSnippet | undefined {
  return SNIPPET_PRESETS.find((s) => s.id === id)
}
