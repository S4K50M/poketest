import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {existsSync, mkdirSync} from 'node:fs';
import {chromium} from 'playwright';
import {RPGCampaign} from '../src/rpg.js';
import {playChronicle} from './helpers/chronicle-route.js';
import {SAVE_KEY} from '../src/world.js';
import {COMBAT,POWERS} from '../src/combat-data.js';

// Progression fixtures are earned by the same input controller as the story
// suite. The browser receives a normal save, never a mutable gameplay hook.
const earned = new RPGCampaign();
playChronicle(earned);
assert.equal(earned.combat.snapshot().available.length, 12);

const port = Number(process.env.COMBAT_TEST_PORT || 3140);
const base = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ['server.mjs'], {
  cwd: new URL('..', import.meta.url), env: {...process.env, PORT: String(port)}, stdio: 'pipe',
});
let browser;
const errors = [];
try {
  let ready = false;
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(base)).ok) { ready = true; break; } } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert(ready, 'isolated combat test server starts');
  browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined),
    headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const page = await browser.newPage({viewport: {width: 1440, height: 1000}});
  // Observe presentation geometry without exposing or modifying game state.
  // A camera scale regression can leave inputs working while drawing the
  // floor and every character outside the viewport.
  await page.addInitScript(() => {
    const fillRect = CanvasRenderingContext2D.prototype.fillRect;
    CanvasRenderingContext2D.prototype.fillRect = function(x, y, width, height) {
      if (this.canvas.id === 'world-canvas' && x === 0 && y === 0 && height === 660 && width > 200) {
        const matrix = this.getTransform();
        window.__combatPresentation = {height: this.canvas.height, scale: matrix.d / (this.canvas.height / 660), floor: matrix.d * 520 + matrix.f};
      }
      return fillRect.call(this, x, y, width, height);
    };
  });
  page.on('pageerror', error => errors.push(error.message));
  page.on('requestfailed', request => errors.push(`${request.url()} ${request.failure()?.errorText}`));
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  await page.goto(base);
  await page.evaluate(() => document.fonts.ready);
  await page.clock.install({time:new Date('2026-01-01T00:00:00Z')});
  await page.clock.pauseAt(new Date('2026-01-01T00:00:01Z'));
  const clock = ms => page.clock.runFor(ms);
  const snapshot = () => page.evaluate(() => window.kinetic.snapshot());
  const screenshot = async name => {
    if (name.endsWith('arsenal')) await page.locator('#overlay').evaluate(dialog => { dialog.scrollTop = 0; });
    return page.screenshot({path: `test-results/momentum-${name}.png`, animations: 'disabled'});
  };
  const noOverflow = async () => assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), (await page.viewportSize()).width);
  const floorVisible = async () => {
    const frame = await page.evaluate(() => window.__combatPresentation);
    assert(frame, 'the game renders a world frame');
    assert(frame.scale > .95 && frame.scale < 1.06, `camera keeps the intended world scale: ${JSON.stringify(frame)}`);
    assert(frame.floor > frame.height * .6 && frame.floor < frame.height * .92, `floor and standing characters remain in view: ${JSON.stringify(frame)}`);
  };
  async function moveAppears(move) {
    for (let i = 0; i < 18; i++) {
      if ((await snapshot()).combat.move === move) return;
      await clock(17);
    }
    assert.fail(`Expected ${move}: ${JSON.stringify((await snapshot()).combat)}`);
  }
  mkdirSync('test-results', {recursive: true});
  assert.equal(await page.evaluate(() => window.kinetic.version), '4.0.0');
  await screenshot('home');
  await page.click('#start-button');
  await page.click('#confirm-expedition');
  await clock(100);
  assert(await page.locator('#combat-hud').isVisible());
  assert.match(await page.locator('#guard-label').textContent(), /GUARD/);
  assert.match(await page.locator('#flow-label').textContent(), /FLOW/);
  await page.keyboard.press('KeyH');
  assert(await page.locator('.combat-arsenal').isVisible());
  assert.equal(await page.locator('[data-power-card]').count(), 12);
  assert.equal(await page.locator('.combat-power-card.locked').count(), 10);
  assert(await page.locator('[data-power-equip="phoenix"][data-power-slot="0"]').isDisabled());
  await page.click('[data-power-equip="aegis"][data-power-slot="0"]');
  await page.click('[data-power-equip="arcbolt"][data-power-slot="1"]');
  assert.deepEqual((await snapshot()).combat.powerSlots, ['aegis', 'arcbolt']);
  await noOverflow();
  await screenshot('arsenal');
  await page.keyboard.press('KeyH');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'world-canvas');

  // Holding raises a finite shield. Opening a menu clears the hold even while
  // the physical key stays down, and the simulation stops while paused.
  await page.keyboard.down('KeyG');
  await clock(220);
  let s = await snapshot();
  assert(s.combat.shielding);
  assert(s.combat.shield > 90 && s.combat.shield < 100);
  await floorVisible();
  await screenshot('shield');
  await page.keyboard.up('KeyG');
  assert.equal((await snapshot()).combat.shielding, false);
  await page.keyboard.down('KeyG');
  await page.keyboard.press('Escape');
  const paused = await snapshot();
  assert(paused.paused);
  assert.equal(paused.combat.shielding, false);
  await clock(250);
  assert.equal((await snapshot()).tick, paused.tick);
  await page.click('[data-resume]');
  assert.equal((await snapshot()).combat.shielding, false);
  await page.keyboard.up('KeyG');

  const beforeAegis = await snapshot();
  await page.keyboard.press('KeyX');
  s = await snapshot();
  assert(s.combat.cooldowns.aegis > POWERS.aegis.cooldown-5 && s.combat.cooldowns.aegis <= POWERS.aegis.cooldown);
  assert(beforeAegis.player.spirit - s.player.spirit > 23.5 && beforeAegis.player.spirit - s.player.spirit <= 24);
  assert.equal(s.combat.shield, 100);
  await page.keyboard.press('KeyZ');
  assert.equal((await snapshot()).combat.selectedPower, 1);
  const switchingFocus=(await snapshot()).player.spirit;await page.keyboard.press('KeyX');assert.equal((await snapshot()).player.spirit,switchingFocus);assert(!(await snapshot()).combat.cooldowns.arcbolt,'cycling cannot bypass shared power recovery');
  await clock(1050);
  const beforeBolt = (await snapshot()).player.spirit;
  await page.keyboard.press('KeyX');
  s = await snapshot();
  assert(s.combat.cooldowns.arcbolt > POWERS.arcbolt.cooldown-5 && s.combat.cooldowns.arcbolt <= POWERS.arcbolt.cooldown);
  assert(beforeBolt - s.player.spirit > 15.5 && beforeBolt - s.player.spirit <= 16);
  await clock(100);
  assert.match(await page.locator('#power-name').textContent(), /Kinetic Bolt/);
  assert((await snapshot()).combat.cooldowns.arcbolt < POWERS.arcbolt.cooldown);
  console.log('PASS: starter power locks and equipment, live shield/release, pause safety, Guard restoration, Focus costs, power cycling, and frame cooldowns.');

  // Queue the next J during recovery; observing each move through the public
  // snapshot proves a real buffered chain rather than three fresh jabs.
  await page.keyboard.press('KeyJ');
  await moveAppears('light1');
  await page.keyboard.press('KeyJ');
  await moveAppears('light2');
  await page.keyboard.press('KeyJ');
  await moveAppears('light3');
  assert.equal((await snapshot()).combat.chain, 3);
  await screenshot('combat');
  await clock(350);
  const beforeDash = (await snapshot()).player.x;
  await page.keyboard.down('KeyA');
  await page.keyboard.press('ShiftLeft');
  assert((await snapshot()).player.dash > 0);
  await clock(100);
  await page.keyboard.up('KeyA');
  assert((await snapshot()).player.x < beforeDash - 60);
  await clock(200);
  await page.keyboard.down('Space');
  await clock(100);
  s = await snapshot();
  assert.equal(s.player.grounded, false);
  assert(s.player.vy < 0);
  await page.keyboard.up('Space');
  await clock(700);
  assert((await snapshot()).player.grounded);
  console.log('PASS: keyboard-buffered three-hit chain, fast dash displacement, variable jump and landing in the live browser.');

  await page.keyboard.press('KeyK');await clock(100);const heavyRemaining=(await snapshot()).combat.actions.heavy.remaining;
  assert(heavyRemaining>COMBAT.inputBuffer);assert.match(await page.locator('[data-cooldown="heavy"] small').textContent(),/s/);
  for(let i=0;i<15;i++)await page.keyboard.press('KeyK');assert.equal((await snapshot()).combat.actions.heavy.remaining,heavyRemaining);
  await page.keyboard.press('Digit2');assert.equal((await snapshot()).combat.actions.heavy.remaining,heavyRemaining);
  await clock(650);await page.keyboard.press('KeyL');assert((await snapshot()).combat.actions.special.remaining>80);
  const signatureFocus=(await snapshot()).player.spirit;for(let i=0;i<12;i++)await page.keyboard.press('KeyL');assert.equal((await snapshot()).player.spirit,signatureFocus);
  await page.keyboard.press('Digit3');assert((await snapshot()).combat.actions.special.remaining>80);const partnerFocus=(await snapshot()).player.spirit;await page.keyboard.press('KeyL');assert.equal((await snapshot()).player.spirit,partnerFocus);
  await screenshot('cooldowns');console.log('PASS: cooldown HUD, repeated key rejection, shared art recovery and party-swap protection for K/L.');
  await page.click('#home-button');
  await page.click('[data-return-home]');
  const fixture = earned.save();
  assert.equal(fixture.version, 4);
  await page.evaluate(({key, save}) => localStorage.setItem(key, JSON.stringify(save)), {key: SAVE_KEY, save: fixture});
  await page.reload();
  await clock(100);
  await page.click('#continue-button');
  assert(await page.locator('.true-ending').isVisible());
  await page.click('[data-resume]');
  s = await snapshot();
  assert.equal(s.trueEnding, 'unwritten');
  assert.equal(Object.values(s.quests).filter(q => q.state === 'complete').length, 8);
  assert.equal(s.combat.available.length, 12);
  await page.keyboard.press('KeyH');
  assert.equal(await page.locator('.combat-power-card.locked').count(), 0);
  await page.click('[data-power-equip="phoenix"][data-power-slot="0"]');
  await page.click('[data-power-equip="choir"][data-power-slot="1"]');
  await page.click('[data-power-select="1"]');
  await page.click('[data-combat-motion]');
  assert.equal((await snapshot()).combat.settings.reducedMotion, true);
  await page.keyboard.press('KeyH');
  await clock(100);
  assert(await page.locator('body').evaluate(body => body.classList.contains('reduced-motion')));
  await page.reload();
  await clock(100);
  await page.click('#continue-button');
  await page.click('[data-resume]');
  s = await snapshot();
  assert.deepEqual(s.combat.powerSlots, ['phoenix', 'choir']);
  assert.equal(s.combat.selectedPower, 1);
  assert.equal(s.combat.settings.reducedMotion, true);
  assert.equal(s.combat.available.length, 12);
  assert.equal(s.trueEnding, 'unwritten');
  console.log('PASS: all twelve powers earned through the complete story; equipped powers, selected slot, motion setting, quests and ending persist through browser reload.');

  await page.setViewportSize({width: 844, height: 390});
  await clock(120);
  await noOverflow();
  await floorVisible();
  assert(await page.locator('.touch-controls').isVisible());
  const [combatBox, surgeBox, toolsBox, canvasBox] = await Promise.all([
    page.locator('#combat-hud').boundingBox(), page.locator('#surge-hud').boundingBox(),
    page.locator('.touch-tools').boundingBox(), page.locator('#world-canvas').boundingBox(),
  ]);
  const frame = await page.evaluate(() => window.__combatPresentation);
  const feet = canvasBox.y + frame.floor / frame.height * canvasBox.height;
  const separate = (a, b) => a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y;
  assert(separate(combatBox, surgeBox), 'mobile combat and Surge meters stay separate');
  assert(separate(combatBox, toolsBox) && separate(surgeBox, toolsBox), 'mobile meters clear the touch tool row');
  assert(combatBox.y + combatBox.height < feet - 110 && surgeBox.y + surgeBox.height < feet - 110,
    'mobile meters clear the standing character silhouette');
  const touchShield = await page.locator('[data-hold="shield"]').boundingBox();
  assert(touchShield);
  await page.mouse.move(touchShield.x + touchShield.width / 2, touchShield.y + touchShield.height / 2);
  await page.mouse.down();
  await clock(150);
  assert((await snapshot()).combat.shielding);
  await screenshot('mobile');
  await page.mouse.up();
  assert.equal((await snapshot()).combat.shielding, false);
  await page.locator('#mobile-menu-button').click();
  await page.locator('.quick-menu [data-overlay="arsenal"]').click();
  await noOverflow();
  assert.equal(await page.locator('[data-power-card]').count(), 12);
  await screenshot('mobile-arsenal');
  await page.locator('[data-combat-motion]').scrollIntoViewIfNeeded();
  await noOverflow();
  assert.equal(await page.locator('[data-combat-motion]').getAttribute('aria-pressed'), 'true');
  await page.keyboard.press('KeyH');
  await noOverflow();
  assert.deepEqual(errors, []);
  console.log('PASS: mobile shield controls, complete responsive arsenal and reduced-motion UI in mobile landscape. No JavaScript errors or failed assets.');
} finally {
  if (browser) await browser.close();
  server.kill();
}
