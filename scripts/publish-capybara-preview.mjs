import { readFile, readdir } from 'node:fs/promises';
import { createHash, randomBytes, createCipheriv, publicEncrypt, constants } from 'node:crypto';
import path from 'node:path';
import assert from 'node:assert/strict';

// Anonymous ShipStatic previews last three days. The private claim URL is
// encrypted before appearing in a PUBLIC Actions log; never log the API body.
const claimPublicKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAs/xP1ro7M+QQ0Ww0Ew/5
VAyEx3fIXyMAWn/5OqLHKIiklZjKlff1iFh43bfemG9X56wFwbIObhwTktZuHQBs
4hbHuFOCVuWhCH86jLP+IWxuCWQYzAmO1pFacCvR2iDrNPodhumuDb3rv3SqhQr3
8XvIftzvSy6xsVDrq6Bzz68Jvdk713cWV+i3VAOJeFriWXPhzXCMwTopjhRaIZCF
+cVP81+f6aX1EHPff3ypyySeVvMbmHcPJUmLX8RqYku7yU3EGh9kwmVxKQkcrmm0
GsOFxUJJcfcEXt1t2AAZQHFhISbFh7Fuu5BsnnAoEJypPqR58U64Cyrn3aDM+aSz
HwIDAQAB
-----END PUBLIC KEY-----`;
const videoURL = 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Baby_Capybara_Twins.webm';
const dryRun = process.argv.includes('--dry-run');
const sourceDir = path.resolve(process.argv.find((arg,i)=>i>1 && !arg.startsWith('--')) || 'dist/capybara');
const mime = { '.html':'text/html', '.css':'text/css', '.js':'application/javascript', '.svg':'image/svg+xml', '.jpg':'image/jpeg', '.json':'application/json' };

function encryptReceipt(value) {
  const key = randomBytes(32), iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const data = Buffer.concat([cipher.update(JSON.stringify(value),'utf8'), cipher.final()]);
  const wrappedKey = publicEncrypt({ key:claimPublicKey, padding:constants.RSA_PKCS1_OAEP_PADDING, oaepHash:'sha256' },key);
  return { key:wrappedKey.toString('base64'), iv:iv.toString('base64'), tag:cipher.getAuthTag().toString('base64'), data:data.toString('base64') };
}

async function collect(directory, prefix='') {
  const files = [];
  for (const item of await readdir(directory,{ withFileTypes:true })) {
    const relative = prefix + item.name;
    if (item.isDirectory()) files.push(...await collect(path.join(directory,item.name),relative+'/'));
    else if (item.isFile() && !item.name.endsWith('.webm') && item.name !== 'media.json') {
      assert.ok(mime[path.extname(item.name)],`Unexpected file: ${relative}`);
      let bytes = await readFile(path.join(directory,item.name));
      if (relative === 'index.html') {
        let html = bytes.toString('utf8');
        html = html.replace('./media/capybara-twins.webm',videoURL)
          .replace(/\s*<link rel="canonical"[^>]*>/g,'')
          .replace(/\s*<meta property="og:(url|image)"[^>]*>/g,'')
          .replace('Immagini e video sono ospitati su questo sito.','Le immagini sono ospitate su questo sito; il video viene caricato da Wikimedia Commons soltanto quando premi play.');
        assert.ok(!html.includes('iohoilpotere.github.io'),'Remove obsolete hosting metadata');
        assert.ok(html.includes(videoURL),'Keep a real embedded capybara video');
        bytes = Buffer.from(html);
      }
      files.push({ relative, bytes, type:mime[path.extname(item.name)] });
    }
  }
  return files.sort((a,b)=>a.relative.localeCompare(b.relative));
}
const files = await collect(sourceDir);
assert.ok(files.some(x=>x.relative==='index.html'),'Missing index.html');
const totalBytes = files.reduce((n,x)=>n+x.bytes.length,0);
const maxBytes = Math.max(...files.map(x=>x.bytes.length));
assert.ok(totalBytes < 50_000_000 && maxBytes < 20_000_000 && files.length <= 500,'Free hosting limits exceeded');
const html = files.find(x=>x.relative==='index.html').bytes.toString('utf8');
if (dryRun) {
  const receipt = encryptReceipt({ claim:'private-test-claim' });
  assert.ok(!JSON.stringify(receipt).includes('private-test-claim'));
  console.log('DRY_RUN_OK '+JSON.stringify({ files:files.map(x=>x.relative),totalBytes,maxBytes,canonicalRemoved:!html.includes('rel="canonical"'),privacyCorrect:html.includes('video viene caricato da Wikimedia Commons'),embeddedVideo:html.includes(videoURL),receiptEncrypted:!!receipt.key }));
  process.exit(0);
}
const form = new FormData();
const checksums = [];
for (const file of files) {
  form.append('files[]',new Blob([file.bytes],{ type:file.type }),file.relative);
  checksums.push(createHash('md5').update(file.bytes).digest('hex'));
}
form.append('checksums',JSON.stringify(checksums));
form.append('via','api');
const idempotencyKey = 'capybara-'+createHash('sha256').update(checksums.join('')).digest('hex');
const response = await fetch('https://api.shipstatic.com/deployments',{ method:'POST',headers:{ 'Idempotency-Key':idempotencyKey },body:form,signal:AbortSignal.timeout(120000) });
if (!response.ok) {
  // Log only the documented error fields, not any claim or authentication data.
  let tag='unknown';
  try { const failure=await response.json(); tag=String(failure.error || 'unknown').replace(/[^a-z_]/gi,''); } catch (_) {}
  throw new Error(`Hosting rejected deployment: HTTP ${response.status}, error=${tag}`);
}
const result = await response.json();
assert.equal(typeof result.url,'string','Hosting must return a public URL');
const publicURL = new URL(result.url);
assert.ok(publicURL.protocol==='https:' && publicURL.hostname.endsWith('.shipstatic.com'),'Unexpected hosting URL');
assert.equal(typeof result.claim,'string','Anonymous deployment must return a private claim URL');
const claimURL = new URL(result.claim);
assert.ok(claimURL.protocol==='https:' && claimURL.hostname==='my.shipstatic.com','Unexpected claim origin');
const encryptedClaim = encryptReceipt({ claim:result.claim,expires:result.expires,url:result.url });
console.log('PUBLISH_RECEIPT '+JSON.stringify({ url:result.url,expires:result.expires,encryptedClaim }));
console.log(`PUBLISH_FILES ${files.length} totalBytes=${totalBytes}`);

// Independent HTTPS read-back must match the exact uploaded content.
for (let attempt=0;attempt<5;attempt++) {
  try {
    const page=await fetch(publicURL,{ signal:AbortSignal.timeout(30000) });
    assert.equal(page.status,200);
    assert.ok((page.headers.get('content-type')||'').includes('text/html'));
    const actual=await page.text();
    assert.equal(actual,html,'Public HTML differs from the uploaded website');
    break;
  } catch(error) {
    if(attempt===4) throw error;
    await new Promise(resolve=>setTimeout(resolve,3000));
  }
}
for (const file of files.filter(x=>x.relative!=='index.html')) {
  const url=new URL(file.relative,result.url.replace(/\/?$/,'/'));
  const check=await fetch(url,{ signal:AbortSignal.timeout(30000) });
  assert.equal(check.status,200,`Asset not public: ${file.relative}`);
  const actual=Buffer.from(await check.arrayBuffer());
  assert.ok(actual.equals(file.bytes),`Wrong public asset: ${file.relative}`);
  console.log(`PUBLIC_ASSET_OK ${file.relative} ${actual.length}`);
}
const movie=await fetch(videoURL,{headers:{Range:'bytes=0-63'},signal:AbortSignal.timeout(30000)});
assert.ok(movie.status===200 || movie.status===206,'Embedded video unavailable');
assert.ok((movie.headers.get('content-type')||'').includes('video/'),'Invalid video type');
await movie.body.cancel();
console.log('PUBLIC_VIDEO_OK '+movie.status);
console.log('PUBLIC_VERIFIED_URL '+result.url);
console.log('PUBLIC_EXPIRES '+result.expires);
