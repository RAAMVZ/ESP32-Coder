# ESP32-Coder-Releases
Official releases and updates for ESP32 Coder
[electron-splash.html](https://github.com/user-attachments/files/34213954/electron-splash.html)

<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'">
  <title>ESP32 Coder</title>
  <style>
    * { box-sizing: border-box; }
    html, body { margin: 0; width: 100%; height: 100%; overflow: hidden; }
    body {
      display: grid;
      place-items: center;
      background: #17191b;
      color: #d8e2e5;
      font-family: "Segoe UI", Arial, sans-serif;
      -webkit-user-select: none;
      user-select: none;
      -webkit-app-region: drag;
    }
    .panel {
      width: 100%;
      height: 100%;
      padding: 24px 30px 21px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      background: radial-gradient(ellipse at 50% 40%, rgba(15, 185, 165, .09), transparent 64%), #191b1e;
      border: 1px solid rgba(20, 220, 190, .42);
      border-radius: 13px;
      box-shadow: inset 0 0 22px rgba(0, 0, 0, .2), 0 10px 35px rgba(0, 0, 0, .25);
    }
    .logo {
      display: block;
      width: min(100%, 650px);
      max-height: 174px;
      object-fit: contain;
      pointer-events: none;
      -webkit-user-drag: none;
    }
    .loading {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      min-height: 22px;
      color: #a9bdc2;
      font-size: 13px;
      letter-spacing: .15px;
      -webkit-app-region: no-drag;
    }
    .spinner {
      width: 17px;
      height: 17px;
      flex: 0 0 17px;
      border: 2px solid rgba(38, 224, 198, .22);
      border-top-color: #20d7bc;
      border-right-color: #20d7bc;
      border-radius: 50%;
      animation: spin .8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <main class="panel" aria-label="ESP32 Coder starting">
    <img class="logo" src="ESP32Coder_Logo.png" alt="ESP32 Coder" draggable="false">
    <div class="loading"><span class="spinner" aria-hidden="true"></span><span id="status">Starting development environment…</span></div>
  </main>
</body>
</html>
