const express = require('express');
const { pool } = require('../../config/db');
const { secured } = require('../../middleware/secured');
const { decodeId, encodeId } = require('../../utils/publicId');
const { publicUser } = require('../../utils/publicModels');

const router = express.Router();

const ROLES = ['superuser', 'admin', 'staff', 'tenant', 'parent'];
const SUPERUSER_ONLY = new Set(['user-roles', 'templates']);

async function loadModules() {
  const [rows] = await pool.query(`SELECT id, code, name FROM app_modules ORDER BY name`);
  return rows;
}

async function loadGrantedModuleIds(hostelId, userId) {
  const [rows] = await pool.query(
    `SELECT module_id FROM admin_module_grants WHERE hostel_id = ? AND user_id = ?`,
    [hostelId, userId]
  );
  return new Set(rows.map((r) => r.module_id));
}

async function templateModuleIdsById(templateId) {
  const [rows] = await pool.query(
    `SELECT module_id FROM module_template_items WHERE template_id = ?`,
    [templateId]
  );
  return rows.map((r) => r.module_id);
}

async function findTemplate(hostelId, templateId) {
  const [rows] = await pool.query(
    `SELECT * FROM module_templates WHERE hostel_id = ? AND id = ? LIMIT 1`,
    [hostelId, templateId]
  );
  return rows[0] || null;
}

async function listTemplateSummaries(hostelId) {
  const [rows] = await pool.query(
    `SELECT t.*,
            (SELECT COUNT(*) FROM module_template_items i WHERE i.template_id = t.id) AS module_count
     FROM module_templates t
     WHERE t.hostel_id = ?
     ORDER BY t.name`,
    [hostelId]
  );
  return rows.map((t) => ({
    id: encodeId(t.id),
    name: t.name,
    code: t.code,
    role_key: t.role_key || null,
    module_count: Number(t.module_count || 0),
  }));
}

async function replaceTemplateItems(templateId, moduleIds) {
  await pool.query(`DELETE FROM module_template_items WHERE template_id = ?`, [templateId]);
  for (const moduleId of moduleIds) {
    await pool.query(
      `INSERT INTO module_template_items (template_id, module_id) VALUES (?, ?)`,
      [templateId, moduleId]
    );
  }
}

async function replaceUserGrants(hostelId, userId, moduleIds, grantedBy) {
  await pool.query(`DELETE FROM admin_module_grants WHERE hostel_id = ? AND user_id = ?`, [
    hostelId,
    userId,
  ]);
  for (const moduleId of moduleIds) {
    await pool.query(
      `INSERT INTO admin_module_grants (hostel_id, user_id, module_id, granted_by)
       VALUES (?, ?, ?, ?)`,
      [hostelId, userId, moduleId, grantedBy]
    );
  }
}

function publicModules(modules, grantedIds) {
  return modules.map((m) => ({
    id: encodeId(m.id),
    code: m.code,
    name: m.name,
    granted: grantedIds.has(m.id),
  }));
}

async function moduleCodesForUser(hostelId, user) {
  if (user.role === 'superuser') {
    const modules = await loadModules();
    return modules.map((m) => m.code);
  }
  const [rows] = await pool.query(
    `SELECT m.code
     FROM admin_module_grants g
     JOIN app_modules m ON m.id = g.module_id
     WHERE g.hostel_id = ? AND g.user_id = ?
     ORDER BY m.name`,
    [hostelId, user.id]
  );
  return rows.map((r) => r.code);
}

function resolveModuleIds(modules, moduleCodes, { allowSuperOnly }) {
  const byCode = new Map(modules.map((m) => [m.code, m]));
  const selected = [];
  for (const code of moduleCodes) {
    const mod = byCode.get(String(code));
    if (!mod) {
      const err = new Error(`Unknown module: ${code}`);
      err.status = 400;
      err.code = 'VALIDATION';
      throw err;
    }
    if (!allowSuperOnly && SUPERUSER_ONLY.has(mod.code)) {
      continue;
    }
    selected.push(mod.id);
  }
  return selected;
}

function slugify(name) {
  const base = String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70);
  return base || 'template';
}

async function uniqueTemplateCode(hostelId, base) {
  let code = base;
  let n = 2;
  for (;;) {
    const [rows] = await pool.query(
      `SELECT id FROM module_templates WHERE hostel_id = ? AND code = ? LIMIT 1`,
      [hostelId, code]
    );
    if (!rows.length) {
      return code;
    }
    code = `${base}-${n++}`;
  }
}

router.get('/modules', ...secured('superuser'), async (_req, res, next) => {
  try {
    const modules = await loadModules();
    return res.json({
      modules: modules.map((m) => ({
        id: encodeId(m.id),
        code: m.code,
        name: m.name,
      })),
    });
  } catch (err) {
    return next(err);
  }
});

router.get('/users', ...secured('superuser'), async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.*,
              (SELECT COUNT(*) FROM admin_module_grants g
               WHERE g.user_id = u.id AND g.hostel_id = u.hostel_id) AS grant_count
       FROM users u
       WHERE u.hostel_id = ?
       ORDER BY FIELD(u.role, 'superuser', 'admin', 'staff', 'tenant', 'parent'), u.name`,
      [req.hostel.id]
    );
    return res.json({
      users: rows.map((u) => ({
        ...publicUser(u),
        grant_count: Number(u.grant_count || 0),
      })),
    });
  } catch (err) {
    return next(err);
  }
});

router.get('/templates', ...secured('superuser'), async (req, res, next) => {
  try {
    return res.json({ templates: await listTemplateSummaries(req.hostel.id) });
  } catch (err) {
    return next(err);
  }
});

router.post('/templates', ...secured('superuser'), async (req, res, next) => {
  try {
    const name = String(req.body?.name || '').trim();
    if (!name) {
      return res.status(400).json({ message: 'name is required.', code: 'VALIDATION' });
    }
    const rawRoleKey = req.body?.role_key ?? req.body?.roleKey;
    const roleKey = rawRoleKey ? String(rawRoleKey) : null;
    if (roleKey && !ROLES.includes(roleKey)) {
      return res.status(400).json({ message: 'Invalid role_key.', code: 'VALIDATION' });
    }
    const rawModuleCodes = req.body?.module_codes ?? req.body?.moduleCodes;
    const moduleCodes = Array.isArray(rawModuleCodes)
      ? rawModuleCodes.map(String)
      : [];

    const modules = await loadModules();
    const selected = resolveModuleIds(modules, moduleCodes, {
      allowSuperOnly: roleKey === 'superuser',
    });
    const code = await uniqueTemplateCode(req.hostel.id, slugify(name));

    const [ins] = await pool.query(
      `INSERT INTO module_templates (hostel_id, name, code, role_key) VALUES (?, ?, ?, ?)`,
      [req.hostel.id, name, code, roleKey]
    );
    await replaceTemplateItems(ins.insertId, selected);

    return res.status(201).json({
      template: {
        id: encodeId(ins.insertId),
        name,
        code,
        role_key: roleKey,
        module_count: selected.length,
      },
      modules: publicModules(modules, new Set(selected)),
    });
  } catch (err) {
    return next(err);
  }
});

router.get('/templates/:id', ...secured('superuser'), async (req, res, next) => {
  try {
    const templateId = decodeId(req.params.id);
    if (templateId == null) {
      return res.status(400).json({ message: 'Invalid template id.', code: 'VALIDATION' });
    }
    const tpl = await findTemplate(req.hostel.id, templateId);
    if (!tpl) {
      return res.status(404).json({ message: 'Template not found.', code: 'NOT_FOUND' });
    }
    const modules = await loadModules();
    const ids = new Set(await templateModuleIdsById(tpl.id));
    return res.json({
      template: {
        id: encodeId(tpl.id),
        name: tpl.name,
        code: tpl.code,
        role_key: tpl.role_key || null,
        module_count: ids.size,
      },
      modules: publicModules(modules, ids),
    });
  } catch (err) {
    return next(err);
  }
});

router.put('/templates/:id', ...secured('superuser'), async (req, res, next) => {
  try {
    const templateId = decodeId(req.params.id);
    if (templateId == null) {
      return res.status(400).json({ message: 'Invalid template id.', code: 'VALIDATION' });
    }
    const tpl = await findTemplate(req.hostel.id, templateId);
    if (!tpl) {
      return res.status(404).json({ message: 'Template not found.', code: 'NOT_FOUND' });
    }

    const name =
      req.body?.name != null ? String(req.body.name).trim() : tpl.name;
    if (!name) {
      return res.status(400).json({ message: 'name is required.', code: 'VALIDATION' });
    }

    let roleKey = tpl.role_key;
    const bodyHasRoleKey =
      Object.prototype.hasOwnProperty.call(req.body || {}, 'role_key') ||
      Object.prototype.hasOwnProperty.call(req.body || {}, 'roleKey');
    if (bodyHasRoleKey) {
      const rawRoleKey = req.body?.role_key ?? req.body?.roleKey;
      roleKey = rawRoleKey ? String(rawRoleKey) : null;
      if (roleKey && !ROLES.includes(roleKey)) {
        return res.status(400).json({ message: 'Invalid role_key.', code: 'VALIDATION' });
      }
    }

    const rawModuleCodes = req.body?.module_codes ?? req.body?.moduleCodes;
    const moduleCodes = Array.isArray(rawModuleCodes)
      ? rawModuleCodes.map(String)
      : null;
    if (!moduleCodes) {
      return res.status(400).json({ message: 'module_codes array is required.', code: 'VALIDATION' });
    }

    const modules = await loadModules();
    const selected = resolveModuleIds(modules, moduleCodes, {
      allowSuperOnly: roleKey === 'superuser',
    });

    await pool.query(
      `UPDATE module_templates SET name = ?, role_key = ? WHERE id = ? AND hostel_id = ?`,
      [name, roleKey, tpl.id, req.hostel.id]
    );
    await replaceTemplateItems(tpl.id, selected);

    return res.json({
      template: {
        id: encodeId(tpl.id),
        name,
        code: tpl.code,
        role_key: roleKey,
        module_count: selected.length,
      },
      modules: publicModules(modules, new Set(selected)),
    });
  } catch (err) {
    return next(err);
  }
});

router.delete('/templates/:id', ...secured('superuser'), async (req, res, next) => {
  try {
    const templateId = decodeId(req.params.id);
    if (templateId == null) {
      return res.status(400).json({ message: 'Invalid template id.', code: 'VALIDATION' });
    }
    const tpl = await findTemplate(req.hostel.id, templateId);
    if (!tpl) {
      return res.status(404).json({ message: 'Template not found.', code: 'NOT_FOUND' });
    }
    await pool.query(`DELETE FROM module_templates WHERE id = ? AND hostel_id = ?`, [
      tpl.id,
      req.hostel.id,
    ]);
    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
});

router.get('/:userId', ...secured('superuser'), async (req, res, next) => {
  try {
    const userId = decodeId(req.params.userId);
    if (userId == null) {
      return res.status(400).json({ message: 'Invalid user id.', code: 'VALIDATION' });
    }

    const [users] = await pool.query(`SELECT * FROM users WHERE hostel_id = ? AND id = ? LIMIT 1`, [
      req.hostel.id,
      userId,
    ]);
    const user = users[0];
    if (!user) {
      return res.status(404).json({ message: 'User not found.', code: 'NOT_FOUND' });
    }

    const modules = await loadModules();
    const granted = await loadGrantedModuleIds(req.hostel.id, userId);
    const templates = await listTemplateSummaries(req.hostel.id);
    return res.json({
      user: publicUser(user),
      modules: publicModules(modules, granted),
      templates,
    });
  } catch (err) {
    return next(err);
  }
});

router.put('/:userId', ...secured('superuser'), async (req, res, next) => {
  try {
    const userId = decodeId(req.params.userId);
    if (userId == null) {
      return res.status(400).json({ message: 'Invalid user id.', code: 'VALIDATION' });
    }

    const [users] = await pool.query(`SELECT * FROM users WHERE hostel_id = ? AND id = ? LIMIT 1`, [
      req.hostel.id,
      userId,
    ]);
    const user = users[0];
    if (!user) {
      return res.status(404).json({ message: 'User not found.', code: 'NOT_FOUND' });
    }

    const rawModuleCodes = req.body?.module_codes ?? req.body?.moduleCodes;
    const moduleCodes = Array.isArray(rawModuleCodes)
      ? rawModuleCodes.map(String)
      : null;
    if (!moduleCodes) {
      return res.status(400).json({ message: 'module_codes array is required.', code: 'VALIDATION' });
    }

    const modules = await loadModules();
    const selected = resolveModuleIds(modules, moduleCodes, {
      allowSuperOnly: user.role === 'superuser',
    });
    await replaceUserGrants(req.hostel.id, userId, selected, req.user.id);

    return res.json({
      user: publicUser(user),
      modules: publicModules(modules, new Set(selected)),
    });
  } catch (err) {
    return next(err);
  }
});

router.post('/:userId/apply-template', ...secured('superuser'), async (req, res, next) => {
  try {
    const userId = decodeId(req.params.userId);
    const templateId = decodeId(req.body?.template_id ?? req.body?.templateId);
    if (userId == null || templateId == null) {
      return res
        .status(400)
        .json({ message: 'userId and template_id are required.', code: 'VALIDATION' });
    }

    const [users] = await pool.query(`SELECT * FROM users WHERE hostel_id = ? AND id = ? LIMIT 1`, [
      req.hostel.id,
      userId,
    ]);
    const user = users[0];
    if (!user) {
      return res.status(404).json({ message: 'User not found.', code: 'NOT_FOUND' });
    }

    const tpl = await findTemplate(req.hostel.id, templateId);
    if (!tpl) {
      return res.status(404).json({ message: 'Template not found.', code: 'NOT_FOUND' });
    }

    const modules = await loadModules();
    let ids = await templateModuleIdsById(tpl.id);
    if (user.role !== 'superuser') {
      const blocked = new Set(
        modules.filter((m) => SUPERUSER_ONLY.has(m.code)).map((m) => m.id)
      );
      ids = ids.filter((id) => !blocked.has(id));
    }

    await replaceUserGrants(req.hostel.id, userId, ids, req.user.id);
    return res.json({
      user: publicUser(user),
      applied_template_id: encodeId(tpl.id),
      modules: publicModules(modules, new Set(ids)),
    });
  } catch (err) {
    return next(err);
  }
});

module.exports = { rolesRouter: router, moduleCodesForUser, ROLES };
