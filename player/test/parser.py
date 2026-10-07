"""Independent oracle: read the pptx XML with Python and compare with the player's scene model."""
import sys, pathlib, zipfile, math
import xml.etree.ElementTree as ET
from playwright.sync_api import sync_playwright

A = '{http://schemas.openxmlformats.org/drawingml/2006/main}'
P = '{http://schemas.openxmlformats.org/presentationml/2006/main}'
R = '{http://schemas.openxmlformats.org/officeDocument/2006/relationships}'
P14 = '{http://schemas.microsoft.com/office/powerpoint/2010/main}'
P159 = '{http://schemas.microsoft.com/office/powerpoint/2015/09/main}'
REL = '{http://schemas.openxmlformats.org/package/2006/relationships}'
player = pathlib.Path(__file__).resolve().parent.parent / 'player.html'

def expected(path):
    z = zipfile.ZipFile(path)
    pres = ET.fromstring(z.read('ppt/presentation.xml'))
    rels = {r.get('Id'): r.get('Target') for r in ET.fromstring(z.read('ppt/_rels/presentation.xml.rels')).iter(REL + 'Relationship')}
    out = []
    for sid in pres.iter(P + 'sldId'):
        sl = ET.fromstring(z.read('ppt/' + rels[sid.get(R + 'id')]))
        shapes = []
        for el in sl.find(P + 'cSld').find(P + 'spTree'):
            if el.tag not in (P + 'sp', P + 'pic'):
                continue
            nv = el.find(P + ('nvPicPr' if el.tag == P + 'pic' else 'nvSpPr'))
            xf = el.find(P + 'spPr').find(A + 'xfrm')
            off, ext = xf.find(A + 'off'), xf.find(A + 'ext')
            shapes.append((nv.find(P + 'cNvPr').get('name'), int(off.get('x')) / 12700, int(off.get('y')) / 12700,
                           int(ext.get('cx')) / 12700, int(ext.get('cy')) / 12700, int(xf.get('rot', 0)) / 60000))
        morph = next(sl.iter(P159 + 'morph'), None)
        dur = None
        if morph is not None:
            for t in sl.iter(P + 'transition'):
                if t.get(P14 + 'dur'):
                    dur = int(t.get(P14 + 'dur')); break
        out.append(dict(shapes=shapes, morph=morph is not None, dur=dur))
    return out

def run(deck):
    exp = expected(deck)
    with sync_playwright() as p:
        b = p.chromium.launch(channel='msedge')
        pg = b.new_page()
        pg.goto(player.as_uri()); pg.set_input_files('#file', deck)
        pg.wait_for_function('window.__player && window.__player.idx === 0')
        got = pg.evaluate("__player.deck.slides.map(s => ({shapes: s.shapes.map(m => [m.name, m.x, m.y, m.w, m.h, m.rot]), type: s.trans.type, dur: s.trans.dur || null}))")
        b.close()
    assert len(got) == len(exp), (len(got), len(exp))
    pairs = 0
    for i, (g, e) in enumerate(zip(got, exp), 1):
        assert [s[0] for s in g['shapes']] == [s[0] for s in e['shapes']], f'slide {i}: names differ'
        for gs, es in zip(g['shapes'], e['shapes']):
            assert all(math.isclose(a, b, abs_tol=0.01) for a, b in zip(gs[1:], es[1:])), f'slide {i} {gs[0]}: {gs} vs {es}'
        assert (g['type'] == 'morph') == e['morph'], f'slide {i}: morph flag'
        if e['morph']:
            assert g['dur'] == e['dur'], f'slide {i}: dur {g["dur"]} vs {e["dur"]}'
        if i > 1:
            prev = {s[0] for s in got[i - 2]['shapes'] if s[0].startswith('!!')}
            pairs += len(prev & {s[0] for s in g['shapes'] if s[0].startswith('!!')})
    print(f'{pathlib.Path(deck).name}: {len(got)} slides, {sum(e["morph"] for e in exp)} morphs, {pairs} named pairs - OK')

for d in sys.argv[1:]:
    run(d)
