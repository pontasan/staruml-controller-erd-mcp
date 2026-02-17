#!/usr/bin/env node
import { apiGet, apiPost, apiDelete, encId, runTest } from './test-utils.mjs';

const DIR = import.meta.dirname;

await runTest('erd', DIR, async (ctx) => {
  // Create data model (container)
  let s = ctx.step('Create data model');
  let dmId;
  try {
    const res = await apiPost('/api/erd/data-models', { name: 'TestDM' });
    dmId = res.data._id;
    s.pass();
  } catch (e) { s.fail(e.message); throw e; }

  // Create ERD diagram under data model
  s = ctx.step('Create ERD diagram');
  let diagramId;
  try {
    const res = await apiPost('/api/erd/diagrams', { name: 'TestERD', parentId: dmId });
    diagramId = res.data._id;
    s.pass();
  } catch (e) { s.fail(e.message); throw e; }

  // Create entity: users
  s = ctx.step('Create entity (users)');
  let usersId;
  try {
    const res = await apiPost('/api/erd/entities', { parentId: dmId, diagramId, name: 'users', x1: 50, y1: 50, x2: 250, y2: 200 });
    usersId = res.data._id;
    s.pass();
  } catch (e) { s.fail(e.message); throw e; }

  // Add columns to users
  s = ctx.step('Add column: users.id (PK)');
  let userIdColId;
  try {
    const res = await apiPost(`/api/erd/entities/${encId(usersId)}/columns`, { name: 'id', type: 'INTEGER', primaryKey: true });
    userIdColId = res.data._id;
    s.pass();
  } catch (e) { s.fail(e.message); throw e; }

  s = ctx.step('Add column: users.email');
  try {
    await apiPost(`/api/erd/entities/${encId(usersId)}/columns`, { name: 'email', type: 'VARCHAR', length: '255' });
    s.pass();
  } catch (e) { s.fail(e.message); throw e; }

  s = ctx.step('Add column: users.name');
  try {
    await apiPost(`/api/erd/entities/${encId(usersId)}/columns`, { name: 'name', type: 'VARCHAR', length: '100' });
    s.pass();
  } catch (e) { s.fail(e.message); throw e; }

  // Create entity: orders
  s = ctx.step('Create entity (orders)');
  let ordersId;
  try {
    const res = await apiPost('/api/erd/entities', { parentId: dmId, diagramId, name: 'orders', x1: 400, y1: 50, x2: 600, y2: 200 });
    ordersId = res.data._id;
    s.pass();
  } catch (e) { s.fail(e.message); throw e; }

  s = ctx.step('Add column: orders.id (PK)');
  try {
    await apiPost(`/api/erd/entities/${encId(ordersId)}/columns`, { name: 'id', type: 'INTEGER', primaryKey: true });
    s.pass();
  } catch (e) { s.fail(e.message); throw e; }

  s = ctx.step('Add column: orders.user_id (FK)');
  try {
    await apiPost(`/api/erd/entities/${encId(ordersId)}/columns`, { name: 'user_id', type: 'INTEGER', foreignKey: true, referenceToId: userIdColId });
    s.pass();
  } catch (e) { s.fail(e.message); throw e; }

  s = ctx.step('Add column: orders.total');
  try {
    await apiPost(`/api/erd/entities/${encId(ordersId)}/columns`, { name: 'total', type: 'DECIMAL' });
    s.pass();
  } catch (e) { s.fail(e.message); throw e; }

  // Create relationship
  s = ctx.step('Create relationship: users ↔ orders');
  try {
    await apiPost('/api/erd/relationships', { parentId: dmId, diagramId, end1: { reference: usersId }, end2: { reference: ordersId }, identifying: true });
    s.pass();
  } catch (e) { s.fail(e.message); throw e; }

  await ctx.layoutDiagram(diagramId);
  await ctx.exportDiagram(diagramId, 'Export ERD image');

  // Cleanup: snapshot restore handles full cleanup
  s = ctx.step('Delete ERD diagram');
  try {
    await apiDelete(`/api/erd/diagrams/${encId(diagramId)}`);
    s.pass();
  } catch (e) { s.fail(e.message); throw e; }
});
