// Locks a page behind a password for GitHub Pages.
// The page is encrypted (AES-GCM, key from the password via PBKDF2-SHA256, 600,000 rounds), so the published file
// holds no readable content. Visitors type the password and the page is decrypted in their browser.
// Usage: node tools/lock.mjs <source.html> <password> > index.html
import { readFileSync } from 'node:fs';
import { webcrypto as crypto } from 'node:crypto';

const [src, password] = process.argv.slice(2);
if (!src || !password) { console.error('Usage: node tools/lock.mjs <source.html> <password>'); process.exit(1); }
const plain = new TextEncoder().encode(readFileSync(src, 'utf8'));
const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 600000, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt']);
const data = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plain));
const b64 = a => Buffer.from(a).toString('base64');

// Deliberately generic, like the Collective's gate: no site name, colors or fonts that say what's behind it.
process.stdout.write(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex, nofollow, noarchive"><meta name="referrer" content="no-referrer"><title>Private Preview</title>
<style>
:root{--bg:#f4f4f5;--card:#fff;--line:#e4e4e7;--ctl:#d4d4d8;--ink:#18181b;--muted:#52525b;--btn:#18181b;--on:#fff;--bad:#b91c1c;--focus:#2563eb}
@media (prefers-color-scheme: dark){:root{--bg:#18181b;--card:#27272a;--line:#3f3f46;--ctl:#52525b;--ink:#f4f4f5;--muted:#a1a1aa;--btn:#f4f4f5;--on:#18181b;--bad:#f87171;--focus:#60a5fa;color-scheme:dark}}
*{box-sizing:border-box}html,body{margin:0}
body{min-height:100vh;background:var(--bg);color:var(--ink);font:15px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;display:flex;align-items:center;justify-content:center;padding:40px 16px}
.box{width:100%;max-width:380px;display:flex;flex-direction:column;gap:20px}
h1{margin:0;text-align:center;font-weight:600;font-size:26px}
p{margin:0;text-align:center;color:var(--muted)}
form{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:22px;display:flex;flex-direction:column;gap:14px}
label{display:flex;flex-direction:column;gap:6px;font-weight:600;font-size:13px}
input{font:inherit;font-weight:400;color:inherit;padding:10px 12px;border:1px solid var(--ctl);border-radius:8px;background:var(--card)}
input:focus-visible,button:focus-visible{outline:2px solid var(--focus);outline-offset:2px}
button{font:inherit;font-weight:600;padding:10px 14px;border-radius:8px;border:1px solid var(--btn);background:var(--btn);color:var(--on);cursor:pointer;min-height:42px}
.err{color:var(--bad);font-size:13px;text-align:left}
.fine{font-size:13px}
</style></head><body>
<main class="box">
<h1>Private Preview</h1>
<p>This site isn’t open yet. Enter the password you were given.</p>
<form id="f" autocomplete="on">
<input type="text" name="username" autocomplete="username" value="preview" hidden>
<label>Password<input id="pw" type="password" autocomplete="current-password" required autofocus></label>
<p class="err" id="err" role="alert" hidden>That password doesn’t match.</p>
<button id="go" type="submit">Continue</button>
</form>
<p class="fine">Questions? Contact the person who invited you.</p>
</main>
<script>
const S='${b64(salt)}',I='${b64(iv)}',D='${b64(data)}';
const u=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
async function open(pw){
  const base=await crypto.subtle.importKey('raw',new TextEncoder().encode(pw),'PBKDF2',false,['deriveKey']);
  const key=await crypto.subtle.deriveKey({name:'PBKDF2',salt:u(S),iterations:600000,hash:'SHA-256'},base,{name:'AES-GCM',length:256},false,['decrypt']);
  const html=new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:u(I)},key,u(D)));
  try{sessionStorage.setItem('pv',pw)}catch(e){}
  document.open();document.write(html);document.close();
}
document.getElementById('f').addEventListener('submit',async e=>{
  e.preventDefault();const b=document.getElementById('go'),er=document.getElementById('err');
  b.disabled=true;b.textContent='Opening…';er.hidden=true;
  try{await open(document.getElementById('pw').value)}catch(x){er.hidden=false;b.disabled=false;b.textContent='Continue'}
});
try{const s=sessionStorage.getItem('pv');if(s)open(s).catch(()=>sessionStorage.removeItem('pv'))}catch(e){}
</script>
</body></html>
`);
