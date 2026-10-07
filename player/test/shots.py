import sys, pathlib
from playwright.sync_api import sync_playwright

deck, outdir = sys.argv[1], pathlib.Path(sys.argv[2])
only = [int(a) for a in sys.argv[3:]]
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
    pg.wait_for_function('window.__player && window.__player.idx === 0', timeout=60000)
    n = pg.evaluate('__player.deck.slides.length')
    print('slides', n)
    for i in (only or range(n)):
        pg.evaluate('i => __player.go(i)', i)
        pg.wait_for_timeout(150)
        pg.screenshot(path=str(outdir / f'{i + 1:02d}.png'))
    print('\n'.join(sorted(set(logs))) or 'no console warnings')
    b.close()
