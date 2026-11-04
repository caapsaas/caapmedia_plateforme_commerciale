const { test } = require('node:test');
const assert = require('node:assert/strict');
const { build, buildSync } = require('esbuild');
const Module = require('node:module');
const path = require('node:path');

const output = buildSync({ entryPoints: [path.resolve('utils/orderDocuments.ts')], bundle: true, platform: 'node', format: 'cjs', write: false });
const compiled = new Module(path.resolve('test/order-documents.generated.cjs'));
compiled.filename = path.resolve('test/order-documents.generated.cjs');
compiled.paths = module.paths;
compiled._compile(output.outputFiles[0].text, compiled.filename);
const { getOrderDocumentData, getOrderPaymentLabelKey } = compiled.exports;

test('the document uses API product names, decimal amounts and final totals including adjustments and tax', () => {
    const data = getOrderDocumentData({ orderDate: '2026-11-02', totalAmount: '2743.35', orderItems: [{ productName: 'Impression couleur A3', quantity: 2, unitPrice: '1200.25', total: '2300.50', discount: '150', assemblyPrice: '50' }], items: [{ productName: 'Stale local data' }] });
    assert.equal(data.date, '2026-11-02');
    assert.equal(data.totalAmount, 2743.35);
    assert.deepEqual(data.items, [{ productName: 'Impression couleur A3', quantity: 2, unitPrice: 1200.25, total: 2300.5 }]);
});

test('a persisted zero total is respected rather than recomputed', () => {
    const data = getOrderDocumentData({ totalAmount: 0, orderItems: [{ productName: 'Offert', quantity: 2, unitPrice: 100, total: 0 }] });
    assert.equal(data.totalAmount, 0);
    assert.equal(data.items[0].total, 0);
});

test('legacy local lines retain nested product names and include discount and assembly in their fallback total', () => {
    const data = getOrderDocumentData({ totalAmount: 2300.5, items: [{ product: { name: 'Impression A3' }, quantity: 2, unitPrice: 1200.25, discount: 150, assemblyPrice: 50 }] });
    assert.equal(data.items[0].productName, 'Impression A3');
    assert.equal(data.items[0].unitPrice, 1200.25);
    assert.equal(data.items[0].total, 2300.5);
});

test('all payment modes use translated labels and missing historical values are explicit', () => {
    for (const method of ['CASH', 'BANK_TRANSFER', 'CHECK']) assert.equal(getOrderPaymentLabelKey(method), `paymentMethods.${method}`);
    for (const method of ['PAY_ON_DELIVERY', 'CARD', 'ORANGE_MONEY', 'WAVE', 'MOBILE_MONEY', 'PAYCAAP', 'CUSTOMER_CREDIT']) assert.equal(getOrderPaymentLabelKey(method), `newOrder.paymentMethod_${method}`);
    assert.equal(getOrderPaymentLabelKey(null), 'bonDeCommande.paymentNotSpecified');
});

test('the actual purchase order renders the four requested values in its preview and printable copy', async () => {
    const rendered = await build({
        entryPoints: [path.resolve('Pages/BonDeCommande.tsx')], bundle: true, platform: 'node', format: 'cjs', write: false,
        external: ['react', 'react-dom', 'react-dom/server'],
        plugins: [{ name: 'document-environment', setup(build) {
            build.onResolve({ filter: /\/i18n$/ }, () => ({ path: 'i18n', namespace: 'document-test' }));
            build.onResolve({ filter: /\/utils\/pdfExporter$/ }, () => ({ path: 'pdf', namespace: 'document-test' }));
            build.onLoad({ filter: /.*/, namespace: 'document-test' }, ({ path: id }) => ({ contents: id === 'i18n'
                ? `export const useI18n = () => ({ language: 'fr', formatCurrency: value => Number(value).toFixed(2) + ' FCFA', t: (key, args) => key === 'newOrder.paymentMethod_ORANGE_MONEY' ? 'Orange Money' : args?.amount || key });`
                : `export const printElementAsPdf = async () => {}; export const exportElementToPdf = async () => {};`, loader: 'js' }));
        } }],
    });
    const component = new Module(path.resolve('test/purchase-order.generated.cjs'));
    component.filename = path.resolve('test/purchase-order.generated.cjs');
    component.paths = module.paths;
    component._compile(rendered.outputFiles[0].text, component.filename);
    const React = require('react');
    const { renderToStaticMarkup } = require('react-dom/server');
    const html = renderToStaticMarkup(React.createElement(component.exports.default, {
        order: { id: 'order', date: '2026-11-02', customerName: 'Client', paymentMethod: 'ORANGE_MONEY', totalAmount: 2743.35,
            orderItems: [{ productName: 'Impression couleur A3', quantity: 2, unitPrice: 1200.25, total: 2300.5 }] },
        subsidiary: { name: 'CaapMedia' }, onClose: () => {},
    }));
    for (const value of ['Impression couleur A3', '1200.25 FCFA', '2743.35 FCFA', 'Orange Money']) {
        assert.equal(html.split(value).length - 1, 2, `${value} appears in both document copies`);
    }
    assert.equal(html.includes('2400.50 FCFA'), false, 'line total is not recomputed from price and quantity');
});
