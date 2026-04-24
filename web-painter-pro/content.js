(function () {
  if (window.wpPainterInitialized) return;
  window.wpPainterInitialized = true;

  const ICONS = {
    cursor: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 3 10 21 13 13 21 10 3 3"></polyline><line x1="13" y1="13" x2="21" y2="21"></line></svg>',
    pen: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"></path><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path><path d="M2 2l7.5 1.5"></path><path d="M14 11l7 7"></path></svg>',
    highlighter: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"></path><path d="M21 3l-9 9-4-1 1 4 9-9z"></path><path d="M18 11.5L21 14.5 17 22 14 19 18 11.5z"></path></svg>',
    line: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="19" x2="19" y2="5"></line></svg>',
    rect: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>',
    circle: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle></svg>',
    arrow: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>',
    text: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 7 4 4 20 4 20 7"></polyline><line x1="9" y1="20" x2="15" y2="20"></line><line x1="12" y1="4" x2="12" y2="20"></line></svg>',
    eraser: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20H7L3 16C2 15 2 13 3 12L13 2L22 11L20 20Z"></path><path d="M17 17L7 7"></path></svg>',
    clear: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>',
    undo: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7v6h6"></path><path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13"></path></svg>',
    redo: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 7v6h-6"></path><path d="M3 17a9 9 0 019-9 9 9 0 016 2.3L21 13"></path></svg>',
    download: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>',
    close: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>'
  };

  class WebPainter {
    constructor() {
      this.active = false;
      this.currentTool = 'pen';
      this.currentColor = '#3b82f6';
      this.brushSize = 4;
      this.opacity = 0.5; // New: Opacity state
      this.paths = [];
      this.redoStack = [];
      this.currentPath = null;
      this.needsRedraw = false;
      
      this.toolbarPos = { x: window.innerWidth / 2, y: 40 }; // New: Toolbar persistence

      this.setupUI();
      this.setupCanvas();
      this.addEventListeners();
      this.addKeyboardShortcuts(); // New: Power-user feature
      this.renderLoop();
    }

    setupUI() {
      this.host = document.createElement('div');
      this.host.id = 'wp-painter-host';
      this.host.style.cssText = 'all: initial; position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 2147483647; pointer-events: none;';
      document.body.appendChild(this.host);
      this.shadow = this.host.attachShadow({ mode: 'open' });

      const style = document.createElement('style');
      style.textContent = `
        :host {
          --primary: #3b82f6;
          --primary-glow: rgba(59, 130, 246, 0.5);
          --bg: rgba(255, 255, 255, 0.98);
          --text: #0f172a;
          --shadow: 0 25px 60px rgba(0,0,0,0.3);
          --border: rgba(0, 0, 0, 0.15);
        }
        .wp-container {
          position: absolute;
          top: 0; left: 0; width: 100%; height: 100%;
          pointer-events: none;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          opacity: 0; transition: opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          touch-action: none;
        }
        .wp-container.active { pointer-events: auto; opacity: 1; }
        .wp-canvas-layer { position: absolute; top: 0; left: 0; width: 100%; height: 100%; cursor: default; touch-action: none; }
        .wp-container.drawing-mode .wp-canvas-layer { cursor: crosshair; }
        
        .wp-toolbar {
          position: fixed;
          top: ${this.toolbarPos.y}px;
          left: ${this.toolbarPos.x}px;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 8px;
          background: var(--bg);
          backdrop-filter: blur(25px) saturate(200%);
          -webkit-backdrop-filter: blur(25px) saturate(200%);
          border: 1px solid var(--border);
          border-radius: 18px;
          box-shadow: var(--shadow);
          pointer-events: auto;
          z-index: 1000;
          user-select: none;
        }
        .wp-drag-handle {
          width: 32px;
          height: 40px;
          cursor: grab;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #475569;
          opacity: 0.8;
          transition: opacity 0.2s;
        }
        .wp-drag-handle:hover { opacity: 1; }
        .wp-drag-handle:active { cursor: grabbing; }
        
        .wp-tool-group {
          display: flex;
          align-items: center;
          gap: 2px;
          padding: 0 8px;
          border-right: 1px solid rgba(0,0,0,0.1);
        }
        .wp-tool-group:last-child { border-right: none; }
        
        .wp-btn {
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          background: transparent;
          color: #475569;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .wp-btn:hover { 
          background: rgba(255,255,255,0.8); 
          color: var(--primary); 
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }
        .wp-btn.active { 
          background: var(--primary); 
          color: white; 
          box-shadow: 0 8px 20px var(--primary-glow);
          transform: translateY(-2px);
        }
        .wp-btn svg { transition: transform 0.2s; }
        .wp-btn:active svg { transform: scale(0.9); }

        .wp-color-picker { 
          width: 26px; height: 26px; 
          border-radius: 50%; 
          border: 3px solid white; 
          cursor: pointer; 
          padding: 0; 
          box-shadow: 0 4px 10px rgba(0,0,0,0.1);
          transition: transform 0.2s;
        }
        .wp-color-picker:hover { transform: scale(1.1); }

        .wp-slider-container { display: flex; flex-direction: column; gap: 8px; padding: 0 10px; }
        
        /* Rich Text Editor Styles */
        .wp-text-box {
          position: fixed;
          min-width: 50px;
          min-height: 20px;
          padding: 8px;
          background: white;
          border: 2px solid var(--primary);
          border-radius: 8px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.15);
          color: var(--text);
          font-family: system-ui;
          font-size: 16px;
          outline: none;
          pointer-events: auto;
          z-index: 2000;
          cursor: text;
          white-space: pre-wrap;
          word-wrap: break-word;
        }
        .wp-format-bubble {
          position: fixed;
          display: flex;
          gap: 4px;
          padding: 4px;
          background: #1e293b;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
          z-index: 2100;
          transform: translateY(-100%) translateY(-10px);
          pointer-events: auto;
        }
        .wp-format-btn {
          width: 28px; height: 28px;
          display: flex; align-items: center; justify-content: center;
          background: transparent; color: white;
          border: none; border-radius: 4px; cursor: pointer; font-weight: bold;
        }
        .wp-format-btn:hover { background: rgba(255,255,255,0.1); }
        .wp-format-select {
          background: #334155; color: white; border: none; border-radius: 4px; font-size: 11px; padding: 0 4px;
        }

        /* Custom Premium Sliders - Refined Slim Look */
        input[type="range"] {
          -webkit-appearance: none;
          width: 60px;
          height: 2px;
          background: rgba(0,0,0,0.1);
          border-radius: 1px;
          outline: none;
          cursor: pointer;
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 10px;
          height: 10px;
          background: var(--primary);
          border: 2px solid white;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 5px rgba(0,0,0,0.15);
          transition: transform 0.2s;
        }
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.3);
        }
      `;
      this.shadow.appendChild(style);

      this.container = document.createElement('div');
      this.container.className = 'wp-container';
      this.shadow.appendChild(this.container);

      this.textLayer = document.createElement('div');
      this.textLayer.className = 'wp-text-layer';
      this.textLayer.style.cssText = 'position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none;';
      this.container.appendChild(this.textLayer);

      this.toolbar = document.createElement('div');
      this.toolbar.className = 'wp-toolbar';
      this.container.appendChild(this.toolbar);

      // Drag Handle
      const handle = document.createElement('div');
      handle.className = 'wp-drag-handle';
      handle.innerHTML = '<svg width="12" height="20" viewBox="0 0 12 20" fill="currentColor"><circle cx="2" cy="2" r="1.5"/><circle cx="2" cy="10" r="1.5"/><circle cx="2" cy="18" r="1.5"/><circle cx="10" cy="2" r="1.5"/><circle cx="10" cy="10" r="1.5"/><circle cx="10" cy="18" r="1.5"/></svg>';
      this.setupDraggable(handle);
      this.toolbar.appendChild(handle);

      const tools = [
        { id: 'cursor', icon: ICONS.cursor, title: 'Select (V)' },
        { id: 'pen', icon: ICONS.pen, title: 'Pen (P)' },
        { id: 'highlighter', icon: ICONS.highlighter, title: 'Highlighter (H)' },
        { id: 'line', icon: ICONS.line, title: 'Straight Line (L)' },
        { id: 'rect', icon: ICONS.rect, title: 'Rectangle (R)' },
        { id: 'circle', icon: ICONS.circle, title: 'Circle (C)' },
        { id: 'arrow', icon: ICONS.arrow, title: 'Arrow (A)' },
        { id: 'text', icon: ICONS.text, title: 'Text Tool (T)' },
        { id: 'eraser', icon: ICONS.eraser, title: 'Eraser (E)' }
      ];

      const tGroup = document.createElement('div');
      tGroup.className = 'wp-tool-group';
      tools.forEach(t => {
        const b = document.createElement('button');
        b.className = `wp-btn ${this.currentTool === t.id ? 'active' : ''}`;
        b.dataset.tool = t.id;
        b.title = t.title;
        b.innerHTML = t.icon;
        b.onclick = (e) => { e.stopPropagation(); this.setTool(t.id); };
        tGroup.appendChild(b);
      });
      this.toolbar.appendChild(tGroup);

      const sGroup = document.createElement('div');
      sGroup.className = 'wp-tool-group';
      
      const cIn = document.createElement('input');
      cIn.type = 'color'; cIn.className = 'wp-color-picker'; cIn.value = this.currentColor;
      cIn.title = 'Change Color';
      cIn.onchange = (e) => { this.currentColor = e.target.value; this.requestRedraw(); };
      sGroup.appendChild(cIn);

      const sliders = document.createElement('div');
      sliders.className = 'wp-slider-container';
      
      const szS = document.createElement('input');
      szS.type = 'range'; szS.className = 'wp-size-slider'; szS.min = '1'; szS.max = '50'; szS.value = this.brushSize;
      szS.title = 'Brush Size ([ and ])';
      szS.oninput = (e) => { this.brushSize = parseInt(e.target.value); this.requestRedraw(); };
      sliders.appendChild(szS);

      const opS = document.createElement('input');
      opS.type = 'range'; opS.className = 'wp-opacity-slider'; opS.min = '0.1'; opS.max = '1.0'; opS.step = '0.1'; opS.value = this.opacity;
      opS.title = 'Opacity';
      opS.oninput = (e) => { this.opacity = parseFloat(e.target.value); this.requestRedraw(); };
      sliders.appendChild(opS);
      
      sGroup.appendChild(sliders);
      this.toolbar.appendChild(sGroup);

      const aGroup = document.createElement('div');
      aGroup.className = 'wp-tool-group';
      aGroup.appendChild(this.createActionButton(ICONS.undo, 'Undo (Ctrl+Z)', () => this.undo()));
      aGroup.appendChild(this.createActionButton(ICONS.clear, 'Clear All', () => this.clearAll()));
      aGroup.appendChild(this.createActionButton(ICONS.download, 'Export as PDF (Ctrl+S)', () => this.download()));
      aGroup.appendChild(this.createActionButton(ICONS.close, 'Exit Web Painter Pro', () => this.toggle(false)));
      this.toolbar.appendChild(aGroup);
    }

    setupDraggable(handle) {
      let offset = { x: 0, y: 0 }, dragging = false;
      handle.onpointerdown = (e) => {
        dragging = true;
        offset = { x: e.clientX - this.toolbar.offsetLeft, y: e.clientY - this.toolbar.offsetTop };
        handle.setPointerCapture(e.pointerId);
      };
      handle.onpointermove = (e) => {
        if (!dragging) return;
        this.toolbarPos = { x: e.clientX - offset.x + (this.toolbar.offsetWidth / 2), y: e.clientY - offset.y };
        this.toolbar.style.left = `${this.toolbarPos.x}px`;
        this.toolbar.style.top = `${this.toolbarPos.y}px`;
      };
      handle.onpointerup = () => dragging = false;
    }

    addKeyboardShortcuts() {
      window.addEventListener('keydown', (e) => {
        if (!this.active || e.target.tagName === 'INPUT' || e.target.contentEditable === 'true') return;
        
        const key = e.key.toLowerCase();
        if (key === 'p') this.setTool('pen');
        if (key === 'h') this.setTool('highlighter');
        if (key === 't') this.setTool('text');
        if (key === 'e') this.setTool('eraser');
        if (key === 'l') this.setTool('line');
        if (key === 'v') this.setTool('cursor');
        if (key === '[' ) this.updateBrushSize(-2);
        if (key === ']' ) this.updateBrushSize(2);
        if (e.ctrlKey && key === 'z') { e.preventDefault(); this.undo(); }
        if (e.ctrlKey && key === 's') { e.preventDefault(); this.download(); }
      });
    }

    updateBrushSize(delta) {
      this.brushSize = Math.max(1, Math.min(50, this.brushSize + delta));
      const slider = this.shadow.querySelector('.wp-size-slider');
      if (slider) slider.value = this.brushSize;
      this.requestRedraw();
    }

    createActionButton(icon, title, cb) {
      const b = document.createElement('button');
      b.className = 'wp-btn'; b.title = title; b.innerHTML = icon;
      b.onclick = (e) => { e.stopPropagation(); cb(); };
      return b;
    }

    setupCanvas() {
      this.canvas = document.createElement('canvas');
      this.canvas.className = 'wp-canvas-layer';
      this.ctx = this.canvas.getContext('2d', { alpha: true });
      this.container.insertBefore(this.canvas, this.toolbar);
      this.resizeCanvas();
      window.addEventListener('resize', () => this.resizeCanvas());
      window.addEventListener('scroll', () => this.requestRedraw(), { passive: true });
    }

    resizeCanvas() {
      const dpr = window.devicePixelRatio || 1;
      const w = window.innerWidth;
      const h = window.innerHeight;
      this.canvas.width = w * dpr;
      this.canvas.height = h * dpr;
      this.canvas.style.width = `${w}px`;
      this.canvas.style.height = `${h}px`;
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.requestRedraw();
    }

    renderLoop() {
      if (this.needsRedraw) {
        this.draw();
        this.needsRedraw = false;
      }
      requestAnimationFrame(() => this.renderLoop());
    }

    requestRedraw() { this.needsRedraw = true; }

    toggle(force) {
      this.active = force !== undefined ? force : !this.active;
      this.container.classList.toggle('active', this.active);
      if (this.active) { this.resizeCanvas(); this.setTool(this.currentTool); }
    }

    setTool(t) {
      this.currentTool = t;
      this.shadow.querySelectorAll('.wp-btn[data-tool]').forEach(b => b.classList.toggle('active', b.dataset.tool === t));
      this.container.classList.toggle('drawing-mode', t !== 'cursor');
    }

    addEventListeners() {
      let drawing = false;
      const getCoords = (e) => ({ x: e.pageX, y: e.pageY });

      this.container.addEventListener('pointerdown', (e) => {
        if (!this.active || e.target.closest('.wp-toolbar')) return;
        
        const c = getCoords(e);

        // Smart Highlighter Sizing
        if (this.currentTool === 'highlighter') {
          this.container.style.pointerEvents = 'none';
          const target = document.elementFromPoint(e.clientX, e.clientY);
          this.container.style.pointerEvents = 'auto';
          
          if (target && target.innerText?.trim()) {
            const style = window.getComputedStyle(target);
            const size = parseFloat(style.fontSize) * 1.2;
            if (size > 8 && size < 100) {
              this.brushSize = Math.round(size);
              const slider = this.shadow.querySelector('.wp-size-slider');
              if (slider) slider.value = this.brushSize;
            }
          }
        }

        // Check for existing text to edit
        if (this.currentTool === 'cursor' || this.currentTool === 'text') {
          const textIdx = this.paths.findIndex(p => {
            if (p.tool !== 'text') return false;
            const dist = Math.sqrt((p.points[0].x - c.x)**2 + (p.points[0].y - c.y)**2);
            return dist < 20; // 20px radius for clicking text
          });

          if (textIdx !== -1) {
            const p = this.paths.splice(textIdx, 1)[0];
            this.addText(p.points[0].x, p.points[0].y, p.text);
            this.requestRedraw();
            return;
          }
        }

        if (this.currentTool === 'cursor') return;

        drawing = true;
        this.currentPath = { tool: this.currentTool, color: this.currentColor, size: this.brushSize, points: [c], path2d: new Path2D() };
        this.currentPath.path2d.moveTo(c.x, c.y);
        if (this.currentTool === 'text') { this.addText(c.x, c.y); drawing = false; }
        
        this.container.setPointerCapture(e.pointerId);
      });

      window.addEventListener('pointermove', (e) => {
        if (!drawing || !this.active) return;
        let c = getCoords(e);
        
        // Smart Snapping (Shift key)
        if (e.shiftKey && ['pen', 'highlighter', 'eraser', 'line'].includes(this.currentTool)) {
          const s = this.currentPath.points[0];
          if (Math.abs(c.x - s.x) > Math.abs(c.y - s.y)) c.y = s.y;
          else c.x = s.x;
        }

        if (['pen', 'highlighter', 'eraser'].includes(this.currentTool)) {
          // Professional Smoothing Algorithm
          const last = this.currentPath.points[this.currentPath.points.length - 1];
          const smoothed = {
            x: last.x * 0.4 + c.x * 0.6,
            y: last.y * 0.4 + c.y * 0.6
          };
          this.currentPath.points.push(smoothed);
          this.currentPath.path2d.lineTo(smoothed.x, smoothed.y);
          this.currentPath.opacity = this.opacity; // Store opacity at time of creation
        } else {
          this.currentPath.points[1] = c;
          this.currentPath.opacity = this.opacity;
        }
        this.requestRedraw();
      });

      window.addEventListener('pointerup', (e) => {
        if (!drawing) return;
        drawing = false;
        this.container.releasePointerCapture(e.pointerId);
        if (this.currentPath) {
          this.paths.push(this.currentPath);
          this.currentPath = null;
          this.saveToStorage();
          this.requestRedraw();
        }
      });

      chrome.runtime.onMessage.addListener((m, sender, sendResponse) => { 
        if (m.action === 'toggle-painter') {
          this.toggle(); 
          sendResponse({ status: 'success' });
        }
      });
    }

    draw() {
      this.ctx.save();
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.restore();

      const sX = window.scrollX, sY = window.scrollY;
      this.ctx.save();
      this.ctx.translate(-sX, -sY);
      
      // Manage Text Elements
      this.textLayer.innerHTML = '';
      
      this.paths.forEach(p => {
        if (p.tool === 'text') {
          const t = document.createElement('div');
          t.className = 'wp-text-box';
          t.style.border = 'none'; t.style.boxShadow = 'none'; t.style.background = 'transparent';
          t.style.left = `${p.points[0].x - sX}px`;
          t.style.top = `${p.points[0].y - sY}px`;
          t.innerHTML = p.html;
          this.textLayer.appendChild(t);
        } else {
          this.renderPath(p);
        }
      });
      
      if (this.currentPath) this.renderPath(this.currentPath);
      this.ctx.restore();
    }

    renderPath(p) {
      if (!p.points?.length || p.tool === 'text') return;
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';
      this.ctx.lineWidth = p.size;
      
      const op = p.tool === 'eraser' ? 1.0 : (p.opacity || 0.5);
      this.ctx.globalAlpha = op;
      this.ctx.globalCompositeOperation = p.tool === 'eraser' ? 'destination-out' : 'source-over';
      this.ctx.strokeStyle = p.color;
      this.ctx.fillStyle = p.color;

      if (['pen', 'highlighter', 'eraser'].includes(p.tool)) {
        this.ctx.stroke(p.path2d);
      } else if (p.points.length > 1) {
        const s = p.points[0], e = p.points[1];
        this.ctx.beginPath();
        if (p.tool === 'rect') this.ctx.rect(s.x, s.y, e.x - s.x, e.y - s.y);
        else if (p.tool === 'circle') this.ctx.arc(s.x, s.y, Math.sqrt((e.x - s.x) ** 2 + (e.y - s.y) ** 2), 0, Math.PI * 2);
        else if (p.tool === 'arrow') this.drawArrow(s.x, s.y, e.x, e.y);
        else if (p.tool === 'line') { this.ctx.moveTo(s.x, s.y); this.ctx.lineTo(e.x, e.y); }
        this.ctx.stroke();
      }
      this.ctx.globalAlpha = 1.0;
    }

    drawArrow(x1, y1, x2, y2) {
      const a = Math.atan2(y2 - y1, x2 - x1);
      this.ctx.moveTo(x1, y1); this.ctx.lineTo(x2, y2);
      this.ctx.lineTo(x2 - 10 * Math.cos(a - Math.PI / 6), y2 - 10 * Math.sin(a - Math.PI / 6));
      this.ctx.moveTo(x2, y2);
      this.ctx.lineTo(x2 - 10 * Math.cos(a + Math.PI / 6), y2 - 10 * Math.sin(a + Math.PI / 6));
    }

    addText(x, y, initialHTML = '') {
      const box = document.createElement('div');
      box.className = 'wp-text-box';
      box.contentEditable = 'true';
      box.innerHTML = initialHTML || 'Type something...';
      
      const viewportX = x - window.scrollX;
      const viewportY = y - window.scrollY;
      box.style.left = `${viewportX}px`;
      box.style.top = `${viewportY}px`;
      
      this.container.appendChild(box);
      
      // Formatting Bubble
      const bubble = document.createElement('div');
      bubble.className = 'wp-format-bubble';
      bubble.style.left = `${viewportX}px`;
      bubble.style.top = `${viewportY}px`;
      bubble.innerHTML = `
        <button class="wp-format-btn" data-cmd="bold">B</button>
        <button class="wp-format-btn" data-cmd="italic">I</button>
        <select class="wp-format-select" data-cmd="fontSize">
          <option value="3">Small</option>
          <option value="5" selected>Medium</option>
          <option value="7">Large</option>
        </select>
        <input type="color" class="wp-color-picker" style="width:20px;height:20px;border-width:1px;" value="${this.currentColor}">
      `;
      
      this.container.appendChild(bubble);

      box.onfocus = () => { if (box.innerHTML === 'Type something...') box.innerHTML = ''; };
      
      bubble.querySelectorAll('.wp-format-btn').forEach(btn => {
        btn.onmousedown = (e) => {
          e.preventDefault();
          document.execCommand(btn.dataset.cmd, false, null);
        };
      });

      bubble.querySelector('.wp-format-select').onchange = (e) => {
        document.execCommand('fontSize', false, e.target.value);
      };

      bubble.querySelector('input[type="color"]').onchange = (e) => {
        document.execCommand('foreColor', false, e.target.value);
      };

      box.onblur = () => {
        const html = box.innerHTML.trim();
        if (html && html !== '' && html !== 'Type something...') {
          this.paths.push({ 
            tool: 'text', 
            html: html, 
            points: [{ x, y }] 
          });
          this.saveToStorage();
          this.requestRedraw();
        }
        box.remove();
        bubble.remove();
      };

      setTimeout(() => box.focus(), 50);
    }

    undo() { if (this.paths.length) { this.paths.pop(); this.saveToStorage(); this.requestRedraw(); } }
    clearAll() { this.paths = []; this.saveToStorage(); this.requestRedraw(); }

    download() {
      // 1. Prepare for Print
      const printStyle = document.createElement('style');
      printStyle.id = 'wp-print-style';
      printStyle.textContent = `
        @media print {
          /* Hide Ads, Nav, Sidebars, and Extension UI */
          nav, aside, footer, header:not(article header), 
          .sidebar, .ads, .ad-container, #comments, .social-share,
          iframe, .promo-banner, .popup, .modal,
          #wp-painter-host { display: none !important; }

          /* Show the Print Layer */
          #wp-print-layer {
            display: block !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            z-index: 2147483647 !important;
            pointer-events: none !important;
          }

          /* Ensure body allows printing */
          body { overflow: visible !important; height: auto !important; }
        }
        #wp-print-layer { display: none; }
      `;
      document.head.appendChild(printStyle);

      // 2. Create SVG Print Layer
      const w = document.documentElement.scrollWidth;
      const h = document.documentElement.scrollHeight;
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.id = 'wp-print-layer';
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      svg.setAttribute('width', w);
      svg.setAttribute('height', h);

      this.paths.forEach(p => {
        if (!p.points?.length) return;
        let el;
        const color = p.tool === 'highlighter' ? p.color + '44' : p.color;
        
        if (p.tool === 'text') {
          el = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          el.setAttribute('x', p.points[0].x);
          el.setAttribute('y', p.points[0].y + p.size * 1.5);
          el.setAttribute('fill', p.color);
          el.setAttribute('font-family', 'system-ui');
          el.setAttribute('font-size', p.size * 2);
          el.textContent = p.text;
        } else if (['pen', 'highlighter', 'eraser'].includes(p.tool)) {
          el = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          let d = `M ${p.points[0].x} ${p.points[0].y}`;
          for (let i = 1; i < p.points.length; i++) d += ` L ${p.points[i].x} ${p.points[i].y}`;
          el.setAttribute('d', d);
          el.setAttribute('stroke', color);
          el.setAttribute('stroke-width', p.size);
          el.setAttribute('fill', 'none');
          el.setAttribute('stroke-linecap', 'round');
          el.setAttribute('stroke-linejoin', 'round');
        } else if (p.points.length > 1) {
          const s = p.points[0], e = p.points[1];
          if (p.tool === 'rect') {
            el = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            el.setAttribute('x', Math.min(s.x, e.x));
            el.setAttribute('y', Math.min(s.y, e.y));
            el.setAttribute('width', Math.abs(e.x - s.x));
            el.setAttribute('height', Math.abs(e.y - s.y));
          } else if (p.tool === 'circle') {
            el = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            el.setAttribute('cx', s.x);
            el.setAttribute('cy', s.y);
            el.setAttribute('r', Math.sqrt((e.x-s.x)**2 + (e.y-s.y)**2));
          } else if (p.tool === 'line' || p.tool === 'arrow') {
             el = document.createElementNS('http://www.w3.org/2000/svg', 'line');
             el.setAttribute('x1', s.x); el.setAttribute('y1', s.y);
             el.setAttribute('x2', e.x); el.setAttribute('y2', e.y);
          }
          el.setAttribute('stroke', color);
          el.setAttribute('stroke-width', p.size);
          el.setAttribute('fill', 'none');
        }
        if (el) svg.appendChild(el);
      });

      document.body.appendChild(svg);

      // 3. Print
      setTimeout(() => {
        window.print();
        // 4. Cleanup
        printStyle.remove();
        svg.remove();
      }, 500);
    }

    saveToStorage() { chrome.storage.local.set({ [window.location.href]: this.paths.map(p => ({ ...p, path2d: null })) }); }
    loadFromStorage() {
      chrome.storage.local.get([window.location.href], (res) => {
        if (res[window.location.href]) {
          this.paths = res[window.location.href].map(p => {
            if (['pen', 'highlighter', 'eraser'].includes(p.tool)) {
              const p2d = new Path2D();
              p2d.moveTo(p.points[0].x, p.points[0].y);
              p.points.forEach(pt => p2d.lineTo(pt.x, pt.y));
              return { ...p, path2d: p2d };
            }
            return p;
          });
          this.requestRedraw();
        }
      });
    }
  }

  const painter = new WebPainter();
  painter.loadFromStorage();
})();
