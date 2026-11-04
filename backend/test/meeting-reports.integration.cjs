// Opt-in integration test against the running local API and local development DB.
require('dotenv').config({ quiet: true });
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const fs = require('node:fs/promises');
const path = require('node:path');

async function main() {
  assert(['localhost', '127.0.0.1', '[::1]'].includes(new URL(process.env.DATABASE_URL).hostname), 'Local development DB required');
  const prisma = new PrismaClient();
  const id = `MTG-TEST-${randomUUID()}`;
  const reportUrls = new Set();
  const prefix = '/api-caapmedia/private-documents/meeting-reports/';
  let created = false;
  try {
    const users = await prisma.user.findMany({ select: { id: true, userRole: true, activeRole: true, roles: true, subsidiaryId: true } });
    const user = users.find(u => ['ADMIN', 'SECRETARY', 'SUPER_ADMIN'].includes(u.activeRole || u.userRole) || u.roles.includes('SUPER_ADMIN'));
    assert(user, 'An authorized local staff account is required');
    const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: '5m' });
    const auth = { Authorization: `Bearer ${token}` };
    const endpoint = `/api-caapmedia/secretariat/meetings/${id}`;
    const send = (method, suffix, body) => fetch(`http://localhost:3000${endpoint}${suffix}`, { method, headers: auth, body });
    const form = async (name = 'report.pdf') => {
      const payload = new FormData();
      const data = name.endsWith('.docx') ? await fs.readFile('test/fixtures/meeting-report.docx') : Buffer.from('%PDF-1.4\nTest report');
      payload.append('file', new Blob([data], { type: name.endsWith('.docx') ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'application/pdf' }), name);
      return payload;
    };
    await prisma.meeting.create({ data: { id, title: 'Temporary meeting report integration fixture', subsidiaryId: user.subsidiaryId, meetingDateTime: new Date(Date.now() + 3600000), minutes: 'Preserved written minutes' } });
    created = true;
    assert.equal((await send('POST', '/complete')).status, 400, 'Future completion refused');
    await prisma.meeting.update({ where: { id }, data: { meetingDateTime: new Date(Date.now() - 3600000) } });
    assert.equal((await send('POST', '/report', await form())).status, 400, 'Upload before completion refused');
    assert.equal((await send('POST', '/complete')).status, 201, 'Completion accepted');
    let response = await send('POST', '/report', await form());
    assert.equal(response.status, 201, response.status === 201 ? 'PDF upload accepted' : await response.text());
    const first = await response.json();
    reportUrls.add(first.minutesFileUrl);
    assert.equal(first.minutes, 'Preserved written minutes');
    assert.equal((await fetch(`http://localhost:3000${first.minutesFileUrl}`)).status, 401, 'Anonymous download refused');
    response = await fetch(`http://localhost:3000${first.minutesFileUrl}`, { headers: auth });
    assert.equal(response.status, 200, 'Authenticated download accepted');
    assert.equal(response.headers.get('cache-control'), 'private, no-store');
    await response.arrayBuffer();
    response = await send('POST', '/report', await form('report.docx'));
    assert.equal(response.status, 201, 'Word replacement accepted');
    const second = await response.json();
    reportUrls.add(second.minutesFileUrl);
    assert.equal(second.minutesFileName, 'report.docx');
    assert.notEqual(first.minutesFileUrl, second.minutesFileUrl);
    assert.equal((await fetch(`http://localhost:3000${first.minutesFileUrl}`, { headers: auth })).status, 404, 'Replaced file no longer downloadable');
    await assert.rejects(fs.stat(path.resolve('private/documents/meeting-reports', first.minutesFileUrl.slice(prefix.length))), { code: 'ENOENT' });
    console.log('PASS local API/DB: future meeting, completion, PDF upload, private download, Word replacement, preserved text and old-file cleanup');
  } finally {
    if (created) {
      const meeting = await prisma.meeting.findUnique({ where: { id } });
      if (meeting?.minutesFileUrl) reportUrls.add(meeting.minutesFileUrl);
      await prisma.meeting.delete({ where: { id } });
    }
    for (const url of reportUrls) {
      assert(url.startsWith(prefix));
      const filename = url.slice(prefix.length);
      assert(/^[a-f0-9-]{36}\.(pdf|doc|docx)$/.test(filename));
      await fs.unlink(path.resolve('private/documents/meeting-reports', filename)).catch(error => { if (error.code !== 'ENOENT') throw error; });
    }
    await prisma.$disconnect();
  }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });

