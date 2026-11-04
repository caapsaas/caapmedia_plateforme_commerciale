import { renderProductShare } from './product-share';

describe('WhatsApp product preview HTML', () => {
  const product = {
    id: 'p1',
    name: 'Flyers',
    description: 'Impression couleur',
    productImages: [
      { imageUrl: 'https://images.caapmedia.com/products/photo.jpg' },
    ],
  };
  it('returns image metadata without requiring JavaScript', () => {
    const html = renderProductShare(product, 'https://api.example.com');
    expect(html).toContain(
      '<meta property="og:image" content="https://images.caapmedia.com/products/photo.jpg">',
    );
    expect(html).toContain('<meta property="og:title" content="Flyers">');
    expect(html).toContain(
      'https://api.example.com/api-caapmedia/products/p1/share',
    );
  });
  it('escapes markup from database fields and rejects executable image URLs', () => {
    const html = renderProductShare(
      {
        ...product,
        name: '"><script>alert(1)</script>',
        description: '<img src=x onerror=alert(1)>',
        productImages: [{ imageUrl: 'javascript:alert(1)' }],
      },
      'https://api.example.com',
    );
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('<img');
    expect(html).not.toContain('og:image"');
    expect(html).toContain('&lt;script&gt;');
  });
  it('supports legacy local image paths and missing images', () => {
    expect(
      renderProductShare(
        { ...product, productImages: [{ imageUrl: '/public/products/a.jpg' }] },
        'https://api.example.com',
      ),
    ).toContain('https://api.example.com/public/products/a.jpg');
    expect(
      renderProductShare(
        { ...product, productImages: [] },
        'https://api.example.com',
      ),
    ).not.toContain('og:image"');
  });
});
