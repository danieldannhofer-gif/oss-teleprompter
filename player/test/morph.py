import sys, pathlib
from playwright.sync_api import sync_playwright

deck, outdir = sys.argv[1], pathlib.Path(sys.argv[2])
pairs = [tuple(map(int, a.split('-'))) for a in sys.argv[3:]]   # 1-based slide numbers, e.g. 28-29
outdir.mkdir(parents=True, exist_ok=True)
player = pathlib.Path(__file__).resolve().parent.parent / 'player.html'

with sync_playwright() as p:
    b = p.chromium.launch(channel='msedge')
    pg = b.new_page(viewport={'width': 1280, 'height': 720})
    logs = []
    pg.on('console', lambda m: logs.append(f'{m.type}: {m.text}') if m.type in ('error', 'warning') else None)
    pg.on('pageerror', lambda e: logs.append(f'PAGEERROR: {e}'))
    pg.goto(player.as_uri())
    pg.set_input_files('#file', deck)
    pg.wait_for_function('window.__player && window.__player.idx === 0'); pg.wait_for_timeout(600)
    for a, z in pairs:
        pg.evaluate('i => __player.go(i)', a - 1)          # settle on the start slide
        pg.wait_for_timeout(200)
        info = pg.evaluate('''z => { __player.go(z);
            const an = document.getAnimations().filter(x => !(x instanceof CSSTransition));
            an.forEach(x => x.pause());
            return an.length; }''', z - 1)
        dur = pg.evaluate('Math.max(0, ...document.getAnimations().filter(x => !(x instanceof CSSTransition)).map(x => x.effect.getTiming().duration))')
        print(f'{a}->{z}: {info} animations, duration {dur}')
        for frac in (0, 0.5, 1):
            pg.evaluate('''f => document.getAnimations().filter(x => !(x instanceof CSSTransition)).forEach(x => { x.currentTime = Math.min(f * x.effect.getTiming().duration, x.effect.getTiming().duration - 0.01) })''', frac)
            pg.wait_for_timeout(80)
            pg.screenshot(path=str(outdir / f'm{a:02d}_{z:02d}_{int(frac*100):03d}.png'))
        pg.evaluate('document.getAnimations().filter(x => !(x instanceof CSSTransition)).forEach(x => x.play())')
        pg.evaluate('__player.active && __player.active.finish()')
        pg.wait_for_timeout(300)
    print('\n'.join(sorted(set(logs))) or 'no console warnings')
    b.close()
