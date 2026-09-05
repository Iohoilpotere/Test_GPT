import unittest
from pathlib import Path
from bs4 import BeautifulSoup

ROOT=Path(__file__).resolve().parents[1]/'public'/'capybara'
class SiteAcceptance(unittest.TestCase):
    def html(self):
        self.assertTrue((ROOT/'index.html').exists(), 'The capybara website has not been implemented')
        return BeautifulSoup((ROOT/'index.html').read_text(), 'html.parser')
    def test_accessible_italian_document(self):
        s=self.html(); self.assertEqual(s.html.get('lang'),'it'); self.assertEqual(len(s.select('h1')),1)
        self.assertTrue(s.select_one('meta[name="viewport"]')); self.assertTrue(s.select_one('main'))
    def test_complete_sections(self):
        s=self.html()
        for name in ['scopri','galleria','cinema','quiz','pausa','fonti']:
            self.assertIsNotNone(s.find(id=name), name)
    def test_images_and_video(self):
        s=self.html(); images=s.select('img'); self.assertGreaterEqual(len(images),6)
        for img in images: self.assertTrue(img.get('alt')); self.assertTrue(img.get('width')); self.assertTrue(img.get('height'))
        self.assertTrue(s.select_one('video[controls][playsinline]'))
        self.assertTrue(s.select_one('video source[type="video/webm"]'))
    def test_buttons_have_names(self):
        for b in self.html().select('button'):
            self.assertTrue(b.get('aria-label') or b.get_text(strip=True), str(b))
    def test_local_links_resolve(self):
        s=self.html(); ids=[e['id'] for e in s.select('[id]')]; self.assertEqual(len(ids),len(set(ids)))
        for a in s.select('a[href^="#"]'):
            self.assertIn(a['href'][1:],ids)
    def test_no_fake_forms_or_tracking(self):
        s=self.html(); self.assertEqual(len(s.select('input[type=email]')),0)
        self.assertEqual(len(s.select('script[src^="https:"]')),0)
    def test_motion_and_breakpoints(self):
        self.html(); css=(ROOT/'styles.css').read_text()
        self.assertIn('prefers-reduced-motion',css); self.assertIn('@media',css)
        self.assertTrue(self.html().select_one('#motion-toggle'))
if __name__=='__main__': unittest.main(verbosity=2)
