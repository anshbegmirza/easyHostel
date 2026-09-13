const { encodeId } = require('./publicId');

function publicUser(row) {
  return {
    id: encodeId(row.id),
    username: row.username,
    email: row.email,
    name: row.name,
    role: row.role,
    status: row.status || 'active',
    phone: row.phone || null,
    hostel_id: encodeId(row.hostel_id),
    auth_provider: row.auth_provider,
  };
}

function publicHostel(hostel) {
  return {
    id: encodeId(hostel.id),
    name: hostel.name,
    partner: hostel.partner,
  };
}

function publicRoom(row) {
  return {
    id: encodeId(row.id),
    code: row.code,
    capacity: row.capacity,
    status: row.status,
    occupied: Number(row.occupied || 0),
  };
}

function publicAllocation(row) {
  return {
    id: encodeId(row.id),
    room_id: encodeId(row.room_id),
    user_id: encodeId(row.user_id),
    room_code: row.room_code || null,
    tenant_name: row.tenant_name || null,
    tenant_email: row.tenant_email || null,
    start_date: row.start_date,
    end_date: row.end_date,
    active: Boolean(row.active),
  };
}

function publicFee(row) {
  return {
    id: encodeId(row.id),
    user_id: encodeId(row.user_id),
    tenant_name: row.tenant_name || null,
    tenant_email: row.tenant_email || null,
    period_label: row.period_label,
    amount: Number(row.amount),
    status: row.status,
    due_date: row.due_date,
    created_at: row.created_at,
  };
}

function publicPayment(row) {
  return {
    id: encodeId(row.id),
    fee_id: encodeId(row.fee_id),
    amount: Number(row.amount),
    method: row.method,
    paid_at: row.paid_at,
    period_label: row.period_label || null,
    tenant_name: row.tenant_name || null,
  };
}

function publicComplaint(row) {
  const slaDue = row.sla_due_at ? new Date(row.sla_due_at) : null;
  const open = row.status === 'open' || row.status === 'in_progress';
  const sla_breached = Boolean(open && slaDue && slaDue.getTime() < Date.now());
  return {
    id: encodeId(row.id),
    user_id: encodeId(row.user_id),
    tenant_name: row.tenant_name || null,
    title: row.title,
    description: row.description,
    priority: row.priority,
    status: row.status,
    sla_due_at: row.sla_due_at,
    sla_breached,
    has_photo: Boolean(row.photo_path),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function publicComplaintEvent(row) {
  return {
    id: encodeId(row.id),
    status: row.status,
    note: row.note,
    actor_name: row.actor_name || null,
    created_at: row.created_at,
  };
}

function publicNotice(row) {
  return {
    id: encodeId(row.id),
    title: row.title,
    body: row.body,
    created_by_name: row.created_by_name || null,
    created_at: row.created_at,
  };
}

function publicNotification(row) {
  return {
    id: encodeId(row.id),
    title: row.title,
    body: row.body,
    type: row.type,
    link: row.link,
    read: Boolean(row.read_at),
    created_at: row.created_at,
  };
}

function publicRoomChange(row) {
  return {
    id: encodeId(row.id),
    user_id: encodeId(row.user_id),
    tenant_name: row.tenant_name || null,
    from_room_id: row.from_room_id ? encodeId(row.from_room_id) : null,
    from_room_code: row.from_room_code || null,
    to_room_id: row.to_room_id ? encodeId(row.to_room_id) : null,
    to_room_code: row.to_room_code || null,
    reason: row.reason,
    status: row.status,
    staff_note: row.staff_note,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

module.exports = {
  publicUser,
  publicHostel,
  publicRoom,
  publicAllocation,
  publicFee,
  publicPayment,
  publicComplaint,
  publicComplaintEvent,
  publicNotice,
  publicNotification,
  publicRoomChange,
};
