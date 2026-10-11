// Calculator to Calendar: a date result (such as 2026-01-31 + 1 month) can be added as an all-day Calendar event,
// through the shared store (TlbxEvents). Only a date has a day to put on the calendar; a number or a time of day does not.
// Classic script. Exposes window.TlbxCalcCalendar.
(function (g) {
  'use strict';
  const NS = (g.TlbxCalcCalendar = {});

  /** The form for the Calendar editor, for a saved calculation whose result is a date. Null for anything else. */
  function formFor(last) {
    if (!last || !last.value || last.value.t !== 'd') return null;
    const day = last.value.iso;
    return { title: `${last.expr} = ${last.text}`, allDay: true, date: day, endDate: day, kind: 'event', color: 'teal',
      notes: `Calculated in Calculator: ${last.expr} = ${last.text}.` };
  }

  /** Adds the calculation as an all-day event. Resolves { ok, message } and never throws. */
  async function add(last) {
    const form = formFor(last);
    if (!form) return { ok: false, message: 'Only a date result goes on the calendar.' };
    if (!g.TlbxEvents || !g.TlbxData) return { ok: false, message: 'Calendar is not available in this browser.' };
    const made = g.TlbxEvents.fromForm(form);
    if (!made.ok) return { ok: false, message: made.error };
    const r = await g.TlbxEvents.save(made.value);
    return r.ok ? { ok: true, message: `Added to Calendar on ${form.date}.` } : { ok: false, message: r.message || 'Not added to Calendar.' };
  }

  NS.formFor = formFor;
  NS.add = add;
})(typeof window !== 'undefined' ? window : globalThis);
