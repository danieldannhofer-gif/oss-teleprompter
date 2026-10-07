import sys, pathlib, time
from playwright.sync_api import sync_playwright
player = pathlib.Path(__file__).resolve().parent.parent / 'player.html'
with sync_playwright() as p:
    b = p.chromium.launch(channel='msedge')
    for deck in sys.argv[1:]:
        pg = b.new_page(viewport={'width': 1280, 'height': 720})
        logs = []
        pg.on('console', lambda m: logs.append(f'{m.type}: {m.text}') if m.type in ('error', 'warning') else None)
        pg.on('pageerror', lambda e: logs.append(f'PAGEERROR: {e}'))
        pg.goto(player.as_uri())
        t = time.time()
        pg.set_input_files('#file', deck)
        try:
            pg.wait_for_function('window.__player && window.__player.idx === 0', timeout=90000)
        except Exception as e:
            print(pathlib.Path(deck).name, 'LOAD FAILED', logs[:3]); pg.close(); continue
        load = time.time() - t
        n = pg.evaluate('__player.deck.slides.length')
        kinds = pg.evaluate("[...new Set(__player.deck.slides.map(s => s.trans.type))].join(',')")
        for i in range(1, n):
            pg.evaluate('i => __player.go(i)', i)
        pg.wait_for_timeout(300)
        print(f'{pathlib.Path(deck).name}: {n} slides, trans={kinds}, load {load:.1f}s ->', '; '.join(sorted(set(logs))) or 'clean')
        pg.close()
    b.close()
