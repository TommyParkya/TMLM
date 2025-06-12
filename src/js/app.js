/* Tailwind CSS v3.4.0 | MIT License | https://tailwindcss.com */
*,:after,:before{box-sizing:border-box;border:0 solid #e5e7eb}:after,:before{--tw-content:""}html{line-height:1.5;-webkit-text-size-adjust:100%;-moz-tab-size:4;tab-size:4;font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,"Noto Sans",sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji";font-feature-settings:normal;font-variation-settings:normal;-webkit-tap-highlight-color:transparent}body{margin:0;line-height:inherit}hr{height:0;color:inherit;border-top-width:1px}abbr:where([title]){-webkit-text-decoration:underline dotted;text-decoration:underline dotted}h1,h2,h3,h4,h5,h6{font-size:inherit;font-weight:inherit}a{color:inherit;text-decoration:inherit}b,strong{font-weight:bolder}code,kbd,pre,samp{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace;font-size:1em}small{font-size:80%}sub,sup{font-size:75%;line-height:0;position:relative;vertical-align:baseline}sub{bottom:-.25em}sup{top:-.5em}table{text-indent:0;border-color:inherit;border-collapse:collapse}button,input,optgroup,select,textarea{font-family:inherit;font-size:100%;font-weight:inherit;line-height:inherit;color:inherit;margin:0;padding:0}button,select{text-transform:none}[type=button],[type=reset],[type=submit],button{-webkit-appearance:button;background-color:transparent;background-image:none}:-moz-focusring{outline:1px dotted ButtonText}:-moz-ui-invalid{box-shadow:none}progress{vertical-align:baseline}::-webkit-inner-spin-button,::-webkit-outer-spin-button{height:auto}[type=search]{-webkit-appearance:textfield;outline-offset:-2px}::-webkit-search-decoration{-webkit-appearance:none}::-webkit-file-upload-button{-webkit-appearance:button;font:inherit}summary{display:list-item}blockquote,dd,dl,figure,h1,h2,h3,h4,h5,h6,hr,p,pre{margin:0}fieldset{margin:0;padding:0}legend{padding:0}menu,ol,ul{list-style:none;margin:0;padding:0}textarea{resize:vertical}input::placeholder,textarea::placeholder{opacity:1;color:#9ca3af}[role=button],button{cursor:pointer}:disabled{cursor:default}audio,canvas,embed,iframe,img,object,svg,video{display:block;vertical-align:middle}img,video{max-width:100%;height:auto}[hidden]{display:none}

/* Custom Properties and Base Styles */
:root {
    --bg-light: #f8fafc;
    --bg-dark: #0f172a;
    --surface-light: #ffffff;
    --surface-dark: #1e293b;
    --text-light-primary: #0f172a;
    --text-dark-primary: #e2e8f0;
    --text-light-secondary: #64748b;
    --text-dark-secondary: #94a3b8;
    --border-light: #e2e8f0;
    --border-dark: #334155;
    --accent-light: #2563eb;
    --accent-dark: #3b82f6;
    --font-sans: 'Inter', ui-sans-serif, system-ui, sans-serif;
    --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}

body {
    font-family: var(--font-sans);
    background-color: var(--bg-light);
    color: var(--text-light-primary);
    transition: background-color 0.3s, color 0.3s;
}
html.dark body {
    background-color: var(--bg-dark);
    color: var(--text-dark-primary);
}
body.modal-open { overflow: hidden; }

/* Components */
.app-shell { display: flex; flex-direction: column; min-height: 100vh; }
.app-header {
    position: sticky;
    top: 0;
    z-index: 50;
    background-color: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border-bottom: 1px solid var(--border-light);
}
html.dark .app-header {
    background-color: rgba(15, 23, 42, 0.8);
    border-bottom-color: var(--border-dark);
}
.app-header .container { display: flex; justify-content: space-between; align-items: center; padding: 1rem 2rem; max-width: 1280px; margin: 0 auto; }
.app-header .logo { font-weight: 700; font-size: 1.5rem; }
.theme-switch { cursor: pointer; }

.filter-bar { display: flex; flex-wrap: wrap; gap: 1rem; padding: 2rem 0; }
.filter-bar input, .filter-bar select {
    font-size: 1rem;
    padding: 0.5rem 0.75rem;
    background-color: var(--surface-light);
    border: 1px solid var(--border-light);
    border-radius: 0.375rem;
    color: var(--text-light-primary);
}
html.dark .filter-bar input, html.dark .filter-bar select {
    background-color: var(--surface-dark);
    border-color: var(--border-dark);
    color: var(--text-dark-primary);
}
.filter-bar input { flex-grow: 1; }

.mod-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.5rem; }
.mod-card {
    background-color: var(--surface-light);
    border: 1px solid var(--border-light);
    border-radius: 0.5rem;
    overflow: hidden;
    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    transition: transform 0.2s, box-shadow 0.2s;
    cursor: pointer;
}
html.dark .mod-card { background-color: var(--surface-dark); border-color: var(--border-dark); }
.mod-card:hover { transform: translateY(-4px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
html.dark .mod-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
.mod-card-thumbnail { width: 100%; height: 180px; object-fit: cover; }
.mod-card-body { padding: 1rem; }
.mod-card-title { font-weight: 600; font-size: 1.125rem; margin-bottom: 0.5rem; }
.mod-card-description { font-size: 0.875rem; color: var(--text-light-secondary); }
html.dark .mod-card-description { color: var(--text-dark-secondary); }
.mod-card-footer { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; border-top: 1px solid var(--border-light); font-size: 0.875rem; color: var(--text-light-secondary); }
html.dark .mod-card-footer { border-top-color: var(--border-dark); color: var(--text-dark-secondary); }
.mod-card-footer img { height: 20px; }

.pagination { display: flex; justify-content: center; align-items: center; gap: 0.5rem; padding: 2rem 0; }
.pagination button { font-size: 1rem; padding: 0.5rem 1rem; border: 1px solid var(--border-light); background-color: var(--surface-light); color: var(--text-light-primary); border-radius: 0.375rem; cursor: pointer; }
html.dark .pagination button { background-color: var(--surface-dark); border-color: var(--border-dark); color: var(--text-dark-primary); }
.pagination button:disabled { opacity: 0.5; cursor: not-allowed; }
.pagination button.current { background-color: var(--accent-light); color: white; border-color: var(--accent-light); }
html.dark .pagination button.current { background-color: var(--accent-dark); border-color: var(--accent-dark); }

.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); z-index: 1000; display: flex; justify-content: center; align-items: center; padding: 1rem; opacity: 0; transition: opacity 0.3s; }
.modal-overlay.visible { opacity: 1; }
.modal-overlay.hidden { pointer-events: none; }

.modal-content { background-color: var(--surface-light); border-radius: 0.75rem; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); max-width: 800px; width: 100%; max-height: 90vh; display: flex; flex-direction: column; overflow: hidden; transform: scale(0.95); transition: transform 0.3s; }
html.dark .modal-content { background-color: var(--surface-dark); }
.modal-overlay.visible .modal-content { transform: scale(1); }
.modal-body { padding: 1.5rem; overflow-y: auto; }
.modal-body::-webkit-scrollbar { display: none; }
.modal-body { -ms-overflow-style: none; scrollbar-width: none; }
.modal-title { font-size: 1.75rem; font-weight: 700; margin-bottom: 1rem; }
.modal-meta { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid var(--border-light); }
html.dark .modal-meta { border-bottom-color: var(--border-dark); }
.modal-meta .game-info { display: flex; align-items: center; gap: 0.75rem; }
.modal-meta .game-info img { height: 32px; }
.modal-meta .game-info .game-name { font-weight: 600; }
.modal-meta .download-links { display: flex; align-items: center; gap: 0.75rem; }
.modal-meta .download-links a { position: relative; }
.modal-meta .download-links img { height: 24px; transition: transform 0.2s; }
.modal-meta .download-links img:hover { transform: scale(1.1); }
.download-badge { position: absolute; top: -5px; right: -5px; background-color: var(--accent-light); color: white; font-size: 10px; font-weight: 700; border-radius: 50%; width: 14px; height: 14px; display: flex; align-items: center; justify-content: center; line-height: 1; }
html.dark .download-badge { background-color: var(--accent-dark); }
.modal-thumbnail { width: 100%; border-radius: var(--border-radius); margin-bottom: 1.5rem; }
.modal-description { color: var(--text-light-secondary); }
html.dark .modal-description { color: var(--text-dark-secondary); }

.tooltip { position: relative; }
.tooltip .tooltip-text { visibility: hidden; background-color: #333; color: #fff; text-align: center; border-radius: 0.375rem; padding: 0.25rem 0.5rem; position: absolute; z-index: 1001; bottom: 125%; left: 50%; transform: translateX(-50%); opacity: 0; transition: opacity 0.2s; white-space: nowrap; }
.tooltip:hover .tooltip-text { visibility: visible; opacity: 1; }
