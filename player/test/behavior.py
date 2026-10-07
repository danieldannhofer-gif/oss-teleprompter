import sys, pathlib
from playwright.sync_api import sync_playwright

deck = sys.argv[1]
player = pathlib.Path(__file__).resolve().parent.parent / 'player.html'
with sync_playwright() as p:
    b = p.chromium.launch(channel='msedge')
    pg = b.new_page(viewport={'width': 1280, 'height': 720})
    logs = []
    pg.on('console', lambda m: logs.append(f'{m.type}: {m.text}') if m.type in ('error', 'warning') else None)
    pg.on('pageerror', lambda e: logs.append(f'PAGEERROR: {e}'))
    pg.goto(player.as_uri())
    pg.set_input_files('#file', deck)
    pg.wait_for_function('window.__player && window.__player.idx === 0')
    idx = lambda: pg.evaluate('__player.idx')
    layers = lambda: pg.evaluate("document.querySelectorAll('#stage > .layer').length")
    pg.wait_for_timeout(500)
    # keyboard next / prev
    pg.keyboard.press('ArrowRight'); pg.wait_for_timeout(1500)
    assert idx() == 1, idx()
    pg.keyboard.press('ArrowLeft'); pg.wait_for_timeout(1500)
    assert idx() == 0, idx()
    # rapid presses must not stack layers or lose position
    for _ in range(6): pg.keyboard.press('ArrowRight'); pg.wait_for_timeout(60)
    pg.wait_for_timeout(2500)
    assert idx() == 6, idx()
    assert layers() == 1, layers()
    # click right = next, click left strip = prev
    pg.mouse.click(900, 300); pg.wait_for_timeout(1500); assert idx() == 7, idx()
    pg.mouse.click(50, 300); pg.wait_for_timeout(1500); assert idx() == 6, idx()
    # end / home / bounds
    pg.keyboard.press('End'); pg.wait_for_timeout(300)
    n = pg.evaluate('__player.deck.slides.length'); assert idx() == n - 1
    pg.keyboard.press('ArrowRight'); pg.wait_for_timeout(300); assert idx() == n - 1
    pg.keyboard.press('Home'); pg.wait_for_timeout(300); assert idx() == 0
    # stage geometry: letterboxed 16:9 inside a wide window
    pg.set_viewport_size({'width': 1600, 'height': 600}); pg.wait_for_timeout(200)
    box = pg.evaluate("(() => { const r = document.getElementById('stage').getBoundingClientRect(); return [r.x, r.y, r.width, r.height]; })()")
    print('stage box at 1600x600:', [round(v) for v in box])
    print('OK', 'slides', n)
    print('\n'.join(sorted(set(logs))) or 'no console warnings')
    b.close()
