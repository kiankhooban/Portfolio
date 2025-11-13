// ========================================
// WINDOWS 95 PORTFOLIO - DESKTOP MANAGER
// Complete window management + theme system
// ========================================

class DesktopManager {
  constructor() {
    this.windows = {};
    this.zIndexCounter = 100;
    this.activeWindow = null;
    this.draggedWindow = null;
    this.dragOffset = { x: 0, y: 0 };
    this.currentTheme = 'original';
    
    this.init();
  }

  init() {
    this.setupClock();
    this.setupStartMenu();
    this.setupDesktopIcons();
    this.setupWindows();
    this.setupTaskbar();
    this.setupThemeSwitcher();
    this.loadSavedTheme();
  }

  // ========================================
  // CLOCK
  // ========================================
  setupClock() {
    const clockEl = document.getElementById('clock');
    const updateClock = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      clockEl.textContent = `${hours}:${minutes} ${ampm}`;
    };
    updateClock();
    setInterval(updateClock, 1000);
  }

  // ========================================
  // START MENU
  // ========================================
  setupStartMenu() {
    const startButton = document.getElementById('startButton');
    const startMenu = document.getElementById('startMenu');
    
    // Toggle start menu
    startButton.addEventListener('click', (e) => {
      e.stopPropagation();
      const isHidden = startMenu.classList.contains('hidden');
      startMenu.classList.toggle('hidden');
      startButton.classList.toggle('active', !isHidden);
      
      // Hide all submenus when closing
      if (!isHidden) {
        document.querySelectorAll('.start-submenu').forEach(sub => {
          sub.classList.add('hidden');
        });
      }
    });

    // Close start menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!startMenu.contains(e.target) && e.target !== startButton) {
        startMenu.classList.add('hidden');
        startButton.classList.remove('active');
        document.querySelectorAll('.start-submenu').forEach(sub => {
          sub.classList.add('hidden');
        });
      }
    });

    // Start menu items with submenus
    const menuItems = startMenu.querySelectorAll('.start-menu-item[data-submenu]');
    menuItems.forEach(item => {
      item.addEventListener('mouseenter', () => {
        // Hide all submenus first
        document.querySelectorAll('.start-submenu').forEach(sub => {
          sub.classList.add('hidden');
        });
        
        // Show the corresponding submenu
        const submenuId = item.dataset.submenu;
        const submenu = document.getElementById(`submenu-${submenuId}`);
        if (submenu) {
          submenu.classList.remove('hidden');
        }
      });
    });

    // Start menu items that open windows
    const windowMenuItems = document.querySelectorAll('.start-menu-item[data-window]');
    windowMenuItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const windowId = item.dataset.window;
        this.openWindow(windowId);
        startMenu.classList.add('hidden');
        startButton.classList.remove('active');
        document.querySelectorAll('.start-submenu').forEach(sub => {
          sub.classList.add('hidden');
        });
      });
    });

    // Shutdown menu item
    const shutdownItem = document.querySelector('.start-menu-item.shutdown');
    if (shutdownItem) {
      shutdownItem.addEventListener('click', (e) => {
        e.stopPropagation();
        this.shutdown();
      });
    }
  }

  // ========================================
  // DESKTOP ICONS
  // ========================================
  setupDesktopIcons() {
    const icons = document.querySelectorAll('.desktop-icon');
    let selectedIcon = null;
    
    icons.forEach(icon => {
      // Single click to select
      icon.addEventListener('click', (e) => {
        // Deselect all
        icons.forEach(i => i.classList.remove('selected'));
        // Select clicked icon
        icon.classList.add('selected');
        selectedIcon = icon;
      });

      // Double click to open
      icon.addEventListener('dblclick', () => {
        const windowId = icon.dataset.window;
        this.openWindow(windowId);
      });
    });

    // Click on desktop to deselect all icons
    document.getElementById('desktop').addEventListener('click', (e) => {
      if (e.target.id === 'desktop') {
        icons.forEach(i => i.classList.remove('selected'));
        selectedIcon = null;
      }
    });
  }

  // ========================================
  // WINDOWS SETUP
  // ========================================
  setupWindows() {
    const windowElements = document.querySelectorAll('.window');
    
    windowElements.forEach(win => {
      const windowId = win.id.replace('window-', '');
      
      // Store window reference
      this.windows[windowId] = {
        element: win,
        minimized: false,
        maximized: false,
        title: win.dataset.title || 'Window',
        originalSize: null,
        originalPosition: null
      };

      // Title bar dragging
      const titleBar = win.querySelector('.title-bar');
      titleBar.addEventListener('mousedown', (e) => {
        // Don't drag if clicking on control buttons
        if (e.target.closest('.title-bar-controls')) return;
        this.startDrag(e, win);
      });

      // Control buttons
      const closeBtn = win.querySelector('.btn-close');
      const minimizeBtn = win.querySelector('.btn-minimize');
      const maximizeBtn = win.querySelector('.btn-maximize');

      if (closeBtn) {
        closeBtn.addEventListener('click', () => this.closeWindow(windowId));
      }
      if (minimizeBtn) {
        minimizeBtn.addEventListener('click', () => this.minimizeWindow(windowId));
      }
      if (maximizeBtn) {
        maximizeBtn.addEventListener('click', () => this.maximizeWindow(windowId));
      }

      // Bring to front on click
      win.addEventListener('mousedown', () => this.focusWindow(win));

      // Center window initially
      this.centerWindow(win);
    });

    // Mouse move and up for dragging
    document.addEventListener('mousemove', (e) => this.onDrag(e));
    document.addEventListener('mouseup', () => this.endDrag());
  }

  // ========================================
  // TASKBAR
  // ========================================
  setupTaskbar() {
    this.taskbarApps = document.getElementById('taskbarApps');
  }

  // ========================================
  // THEME SWITCHER
  // ========================================
  setupThemeSwitcher() {
    const themeSelect = document.getElementById('themeSelect');
    const applyButton = document.getElementById('applyTheme');

    if (themeSelect) {
      // Update preview when theme changes
      themeSelect.addEventListener('change', () => {
        this.previewTheme(themeSelect.value);
      });
    }

    if (applyButton) {
      applyButton.addEventListener('click', () => {
        const selectedTheme = themeSelect.value;
        this.applyTheme(selectedTheme);
        this.showNotification('Theme applied successfully!');
      });
    }
  }

  // Preview theme (just in control panel preview box)
// Preview theme (just in control panel preview box)
previewTheme(themeName) {
  const preview = document.getElementById('themePreview');
  if (!preview) return;

  // Temporarily apply theme to preview
  const previewWindow = preview.querySelector('.preview-window');
  if (previewWindow) {
    // Get theme colors
    const themes = {
      colorful: { start: '#0078d7', end: '#00bcf2', bg: '#c0c0c0' },
      original: { start: '#000080', end: '#1084d0', bg: '#c0c0c0' },
      rose: { start: '#b05e7b', end: '#ed9ac0', bg: '#c0c0c0' },
      blue: { start: '#0831d9', end: '#3a6ea5', bg: '#c0c0c0' },
      slate: { start: '#404040', end: '#7f7f7f', bg: '#a0a0a0' },
      pumpkin: { start: '#ff7518', end: '#ffa343', bg: '#c0c0c0' },
      olive: { start: '#6e8b3d', end: '#b5d19e', bg: '#c0c0c0' },
      marine: { start: '#1f578d', end: '#5b9dd9', bg: '#c0c0c0' },
      raindrop: { start: '#2b5876', end: '#4e7fab', bg: '#c0c0c0' }
    };

    const theme = themes[themeName] || themes.colorful;
    const titlebar = previewWindow.querySelector('.preview-titlebar');
    const body = previewWindow.querySelector('.preview-body');
    
    if (titlebar) {
      titlebar.style.background = `linear-gradient(90deg, ${theme.start}, ${theme.end})`;
    }
    if (body) {
      body.style.background = theme.bg;
    }
  }
}

  // Apply theme to entire desktop
  applyTheme(themeName) {
    document.body.setAttribute('data-theme', themeName);
    this.currentTheme = themeName;
    
    // Save to localStorage
    try {
      localStorage.setItem('win95-theme', themeName);
    } catch (e) {
      console.log('Could not save theme preference');
    }
  }

  // Load saved theme from localStorage
// Load saved theme from localStorage (DEFAULT: Colorful)
loadSavedTheme() {
  try {
    const savedTheme = localStorage.getItem('win95-theme');
    const defaultTheme = 'colorful'; // NEW DEFAULT!
    const themeToLoad = savedTheme || defaultTheme;
    
    this.applyTheme(themeToLoad);
    const themeSelect = document.getElementById('themeSelect');
    if (themeSelect) {
      themeSelect.value = themeToLoad;
      this.previewTheme(themeToLoad);
    }
  } catch (e) {
    console.log('Could not load saved theme');
    this.applyTheme('colorful'); // Fallback to colorful
  }
}

  // ========================================
  // WINDOW MANAGEMENT
  // ========================================

  // Open Window
  openWindow(windowId) {
    const win = this.windows[windowId];
    if (!win) return;

    win.element.classList.remove('hidden', 'minimized');
    win.minimized = false;
    this.focusWindow(win.element);
    this.updateTaskbar();
  }

  // Close Window
  closeWindow(windowId) {
    const win = this.windows[windowId];
    if (!win) return;

    win.element.classList.add('hidden');
    win.minimized = false;
    win.maximized = false;
    this.updateTaskbar();
  }

  // Minimize Window
  minimizeWindow(windowId) {
    const win = this.windows[windowId];
    if (!win) return;

    win.element.classList.add('minimized');
    win.minimized = true;
    this.updateTaskbar();
  }

// Maximize Window (TRUE FULLSCREEN)
maximizeWindow(windowId) {
  const win = this.windows[windowId];
  if (!win) return;

  if (win.maximized) {
    // Restore to original size
    if (win.originalSize && win.originalPosition) {
      win.element.style.width = win.originalSize.width;
      win.element.style.height = win.originalSize.height;
      win.element.style.left = win.originalPosition.left;
      win.element.style.top = win.originalPosition.top;
    }
    win.maximized = false;
  } else {
    // Save current size and position
    const rect = win.element.getBoundingClientRect();
    win.originalSize = {
      width: win.element.style.width || `${rect.width}px`,
      height: win.element.style.height || `${rect.height}px`
    };
    win.originalPosition = {
      left: win.element.style.left || `${rect.left}px`,
      top: win.element.style.top || `${rect.top}px`
    };

    // TRUE FULLSCREEN - fills entire desktop except taskbar
    win.element.style.width = '100vw';
    win.element.style.height = 'calc(100vh - 40px)'; // 40px = taskbar height
    win.element.style.left = '0';
    win.element.style.top = '0';
    win.maximized = true;
  }
}

  // Focus Window
  focusWindow(windowEl) {
    this.zIndexCounter++;
    windowEl.style.zIndex = this.zIndexCounter;
    
    // Remove active class from all windows
    document.querySelectorAll('.window').forEach(w => w.classList.remove('active'));
    windowEl.classList.add('active');
    
    // Update taskbar active state
    document.querySelectorAll('.taskbar-app').forEach(app => app.classList.remove('active'));
    const windowId = windowEl.id.replace('window-', '');
    const taskbarBtn = document.querySelector(`[data-taskbar="${windowId}"]`);
    if (taskbarBtn) taskbarBtn.classList.add('active');
    
    this.activeWindow = windowEl;
  }

  // Center Window
  centerWindow(windowEl) {
    const rect = windowEl.getBoundingClientRect();
    const left = (window.innerWidth - rect.width) / 2;
    const top = (window.innerHeight - rect.height - 40) / 3; // 40 = taskbar height
    windowEl.style.left = `${Math.max(10, left)}px`;
    windowEl.style.top = `${Math.max(10, top)}px`;
  }

  // ========================================
  // DRAGGING
  // ========================================
  startDrag(e, windowEl) {
    // Don't drag if maximized
    const windowId = windowEl.id.replace('window-', '');
    const win = this.windows[windowId];
    if (win && win.maximized) return;

    this.draggedWindow = windowEl;
    const rect = windowEl.getBoundingClientRect();
    this.dragOffset.x = e.clientX - rect.left;
    this.dragOffset.y = e.clientY - rect.top;
    this.focusWindow(windowEl);
    
    // Change cursor
    document.body.style.cursor = 'move';
  }

  onDrag(e) {
    if (!this.draggedWindow) return;
    
    let x = e.clientX - this.dragOffset.x;
    let y = e.clientY - this.dragOffset.y;

    // Keep window on screen
    const rect = this.draggedWindow.getBoundingClientRect();
    x = Math.max(0, Math.min(x, window.innerWidth - rect.width));
    y = Math.max(0, Math.min(y, window.innerHeight - 100)); // Keep title bar visible

    this.draggedWindow.style.left = `${x}px`;
    this.draggedWindow.style.top = `${y}px`;
  }

  endDrag() {
    if (this.draggedWindow) {
      document.body.style.cursor = 'default';
      this.draggedWindow = null;
    }
  }

  // ========================================
  // TASKBAR MANAGEMENT
  // ========================================
  updateTaskbar() {
    this.taskbarApps.innerHTML = '';
    
    Object.keys(this.windows).forEach(windowId => {
      const win = this.windows[windowId];
      
      // Only show open (not hidden) windows
      if (!win.element.classList.contains('hidden')) {
        const btn = document.createElement('button');
        btn.className = 'taskbar-app';
        btn.dataset.taskbar = windowId;
        
        // Add icon from window
        const iconSpan = win.element.querySelector('.window-icon');
        if (iconSpan) {
          const icon = iconSpan.cloneNode(true);
          btn.appendChild(icon);
        }
        
        const text = document.createTextNode(win.title);
        btn.appendChild(text);
        
        // Set active state
        if (!win.minimized && win.element.classList.contains('active')) {
          btn.classList.add('active');
        }
        
        // Click to restore/focus
        btn.addEventListener('click', () => {
          if (win.minimized) {
            win.element.classList.remove('minimized');
            win.minimized = false;
          }
          this.focusWindow(win.element);
        });

        this.taskbarApps.appendChild(btn);
      }
    });
  }

  // ========================================
  // UTILITIES
  // ========================================
  
  // Show notification (Windows 95 style alert)
  showNotification(message) {
    // Create a simple Windows 95 style dialog
    const notification = document.createElement('div');
    notification.className = 'window';
    notification.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      min-width: 300px;
      z-index: 99999;
    `;
    
    notification.innerHTML = `
      <div class="title-bar">
        <div class="title-bar-text">
          <span class="window-icon">ℹ️</span>
          Windows 95
        </div>
      </div>
      <div class="window-body" style="padding: 20px; text-align: center;">
        <p style="margin-bottom: 20px;">${message}</p>
        <button class="win95-button primary" onclick="this.closest('.window').remove()">OK</button>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 3000);
  }

  // Shutdown sequence
  shutdown() {
    // Create shutdown dialog
    const shutdownDialog = document.createElement('div');
    shutdownDialog.className = 'window';
    shutdownDialog.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      min-width: 350px;
      z-index: 99999;
    `;
    
    shutdownDialog.innerHTML = `
      <div class="title-bar">
        <div class="title-bar-text">
          <span class="window-icon">🔌</span>
          Shut Down Windows
        </div>
      </div>
      <div class="window-body" style="padding: 20px;">
        <h3 style="margin-bottom: 16px;">What do you want to do?</h3>
        <div style="margin-bottom: 20px;">
          <label style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <input type="radio" name="shutdown" value="close" checked>
            <span>Close all windows and return to desktop</span>
          </label>
          <label style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <input type="radio" name="shutdown" value="restart">
            <span>Restart the portfolio</span>
          </label>
          <label style="display: flex; align-items: center; gap: 8px;">
            <input type="radio" name="shutdown" value="bios">
            <span>Return to BIOS screen</span>
          </label>
        </div>
        <div style="display: flex; gap: 8px; justify-content: flex-end;">
          <button class="win95-button" onclick="this.closest('.window').remove()">Cancel</button>
          <button class="win95-button primary" id="shutdownOK">OK</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(shutdownDialog);
    
    // Handle shutdown actions
    const okButton = shutdownDialog.querySelector('#shutdownOK');
    okButton.addEventListener('click', () => {
      const selected = shutdownDialog.querySelector('input[name="shutdown"]:checked').value;
      
      if (selected === 'close') {
        // Close all windows
        Object.keys(this.windows).forEach(windowId => {
          this.closeWindow(windowId);
        });
        shutdownDialog.remove();
      } else if (selected === 'restart') {
        // Reload page
        window.location.reload();
      } else if (selected === 'bios') {
        // Go back to BIOS screen
        window.location.href = 'index.html';
      }
    });
  }
}

// ========================================
// INITIALIZE DESKTOP
// ========================================
window.addEventListener('load', () => {
  // Small delay for dramatic effect
  setTimeout(() => {
    new DesktopManager();
  }, 100);
});

// Prevent text selection while dragging
document.addEventListener('selectstart', (e) => {
  if (e.target.closest('.title-bar')) {
    e.preventDefault();
  }
});