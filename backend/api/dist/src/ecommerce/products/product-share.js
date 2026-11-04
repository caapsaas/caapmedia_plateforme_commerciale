"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderProductShare = renderProductShare;
const escapeHtml = (value) => value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
function renderProductShare(product, backendOrigin) {
    const origin = new URL(backendOrigin).origin;
    const canonical = `${origin}/api-caapmedia/products/${encodeURIComponent(product.id)}/share`;
    let image = '';
    const source = product.productImages[0]?.imageUrl;
    if (source) {
        try {
            const parsed = new URL(source.replace(/\\/g, '/'), `${origin}/`);
            if (['https:', 'http:'].includes(parsed.protocol) &&
                !parsed.username &&
                !parsed.password)
                image = parsed.href;
        }
        catch {
        }
    }
    const title = escapeHtml(product.name);
    const description = escapeHtml(product.description.replace(/<[^>]*>/g, '').slice(0, 300));
    const imageTags = image
        ? `<meta property="og:image" content="${escapeHtml(image)}"><meta property="og:image:alt" content="${title}">`
        : '';
    return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title} | CaapMedia</title><meta name="description" content="${description}"><meta property="og:type" content="website"><meta property="og:locale" content="fr_FR"><meta property="og:site_name" content="CaapMedia"><meta property="og:title" content="${title}"><meta property="og:description" content="${description}"><meta property="og:url" content="${escapeHtml(canonical)}">${imageTags}<link rel="canonical" href="${escapeHtml(canonical)}"></head><body><main><h1>${title}</h1>${image ? `<img src="${escapeHtml(image)}" alt="${title}" width="480" style="max-width:100%;height:auto">` : ''}<p>${description}</p></main></body></html>`;
}
//# sourceMappingURL=product-share.js.map