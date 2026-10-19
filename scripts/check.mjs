import { readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
for(const file of await readdir(new URL('../src/',import.meta.url)))if(file.endsWith('.js')){
  const result=spawnSync(process.execPath,['--check','src/'+file],{stdio:'inherit'});if(result.status)process.exit(result.status);
}
const result=spawnSync(process.execPath,['scripts/build.mjs','--check'],{stdio:'inherit'});process.exit(result.status??1);
