import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';

test('HTML assets resolve beside index.html on disk and below a hosting subpath',async()=>{
  const page=new URL('../index.html',import.meta.url),html=await readFile(page,'utf8');
  const paths=[...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(m=>m[1]);
  assert(paths.length>=4);
  for(const asset of paths){
    assert(asset.startsWith('./'),`${asset} must be relative to the HTML file`);
    await access(new URL(asset,page));
    assert(new URL(asset,'https://example.com/poketest/').pathname.startsWith('/poketest/'));
  }
  assert.match(html,/<script defer src="\.\/bundle\/game\.js"><\/script>/);
  assert(!html.includes('type="module"'),'file opening must not require module fetches');
});

test('all bundled font URLs resolve relative to the CSS file',async()=>{
  const stylesheet=new URL('../src/style.css',import.meta.url),css=await readFile(stylesheet,'utf8');
  const urls=[...css.matchAll(/url\('([^']+)'\)/g)].map(m=>m[1]);
  for(const asset of urls)await access(new URL(asset,stylesheet));
  const fonts=urls.filter(url=>url.startsWith('../assets/fonts/'));
  assert(urls.includes('./combat-style.css'),'combat styling must remain local and portable');
  assert.equal(fonts.length,11);
  for(const font of fonts){assert(font.startsWith('../assets/fonts/'));await access(new URL(font,stylesheet));}
});
