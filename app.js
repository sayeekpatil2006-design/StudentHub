(() => {
  const $ = (s) => document.querySelector(s);
  const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
  const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const today = () => new Date().toISOString().slice(0, 10);

  const state = {
    tasks: load('sh_tasks', [
      { id: 1, title: 'Review DBMS normalization', due: '', pri: 'Medium', done: true },
      { id: 2, title: 'Revise Data Structures', due: '2026-10-28', pri: 'High', done: false },
    ]),
    tt: load('sh_tt', []),
    att: load('sh_att', [
      { id: 1, subject: 'DBMS', attended: 18, total: 22 },
      { id: 2, subject: 'Data Structures', attended: 20, total: 24 },
    ]),
    notes: load('sh_notes', []),
    focus: load('sh_focus', {}),
  };
  const persist = () => {
    save('sh_tasks', state.tasks); save('sh_tt', state.tt); save('sh_att', state.att);
    save('sh_notes', state.notes); save('sh_focus', state.focus);
  };

  // Tabs
  document.querySelectorAll('.tab').forEach((b) => b.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((x) => x.classList.toggle('active', x === b));
    document.querySelectorAll('.panel').forEach((p) => p.classList.toggle('active', p.id === b.dataset.tab));
    render();
  }));

  // Tasks
  $('#task-form').addEventListener('submit', (e) => {
    e.preventDefault();
    state.tasks.push({ id: Date.now(), title: $('#task-title').value.trim(), due: $('#task-due').value, pri: $('#task-pri').value, done: false });
    e.target.reset(); $('#task-pri').value = 'Medium'; persist(); render();
  });
  $('#task-list').addEventListener('click', (e) => {
    const li = e.target.closest('li'); if (!li) return;
    const id = +li.dataset.id;
    if (e.target.matches('.del')) state.tasks = state.tasks.filter((t) => t.id !== id);
    else if (e.target.matches('input[type=checkbox]')) { const t = state.tasks.find((t) => t.id === id); t.done = !t.done; }
    persist(); render();
  });

  // Timetable
  $('#tt-form').addEventListener('submit', (e) => {
    e.preventDefault();
    state.tt.push({ id: Date.now(), day: $('#tt-day').value, time: $('#tt-time').value, subject: $('#tt-subject').value.trim(), room: $('#tt-room').value.trim() });
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    state.tt.sort((a, b) => days.indexOf(a.day) - days.indexOf(b.day) || a.time.localeCompare(b.time));
    e.target.reset(); persist(); render();
  });
  $('#tt-body').addEventListener('click', (e) => {
    if (!e.target.matches('.del')) return;
    state.tt = state.tt.filter((r) => r.id !== +e.target.closest('tr').dataset.id); persist(); render();
  });

  // Attendance
  $('#att-form').addEventListener('submit', (e) => {
    e.preventDefault();
    state.att.push({ id: Date.now(), subject: $('#att-subject').value.trim(), attended: 0, total: 0 });
    e.target.reset(); persist(); render();
  });
  $('#att-list').addEventListener('click', (e) => {
    const li = e.target.closest('li'); if (!li) return;
    const s = state.att.find((a) => a.id === +li.dataset.id);
    if (e.target.matches('.present')) { s.attended++; s.total++; }
    else if (e.target.matches('.absent')) { s.total++; }
    else if (e.target.matches('.del')) state.att = state.att.filter((a) => a !== s);
    persist(); render();
  });

  // Notes
  $('#note-form').addEventListener('submit', (e) => {
    e.preventDefault();
    state.notes.unshift({ id: Date.now(), text: $('#note-text').value.trim() });
    e.target.reset(); persist(); render();
  });
  $('#note-list').addEventListener('click', (e) => {
    if (!e.target.matches('.del')) return;
    state.notes = state.notes.filter((n) => n.id !== +e.target.closest('.note').dataset.id); persist(); render();
  });

  // Focus timer
  let remaining = 25 * 60, interval = null;
  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const showTimer = () => { $('#timer-display').textContent = fmt(remaining); $('#timer-count').textContent = state.focus[today()] || 0; };
  $('#timer-len').addEventListener('change', () => { if (!interval) { remaining = +$('#timer-len').value * 60; showTimer(); } });
  $('#timer-start').addEventListener('click', () => {
    if (interval) { clearInterval(interval); interval = null; $('#timer-start').textContent = 'Resume'; return; }
    $('#timer-start').textContent = 'Pause';
    interval = setInterval(() => {
      remaining--;
      if (remaining <= 0) {
        clearInterval(interval); interval = null; remaining = +$('#timer-len').value * 60;
        state.focus[today()] = (state.focus[today()] || 0) + 1; persist();
        $('#timer-start').textContent = 'Start'; alert('Focus session complete! 🎉'); render();
      }
      showTimer();
    }, 1000);
  });
  $('#timer-reset').addEventListener('click', () => {
    clearInterval(interval); interval = null; remaining = +$('#timer-len').value * 60;
    $('#timer-start').textContent = 'Start'; showTimer();
  });

  // Render
  function render() {
    $('#task-list').innerHTML = state.tasks.map((t) => `
      <li data-id="${t.id}" class="${t.done ? 'done' : ''}">
        <input type="checkbox" ${t.done ? 'checked' : ''} />
        <div class="grow"><b>${esc(t.title)}</b><small>${t.due ? 'Due ' + esc(t.due) : 'No due date'}</small></div>
        <span class="tag ${t.pri}">${t.pri}</span>
        <button class="icon-btn del" title="Delete">✕</button>
      </li>`).join('') || '<p style="color:var(--muted)">No tasks yet.</p>';

    $('#tt-body').innerHTML = state.tt.map((r) => `
      <tr data-id="${r.id}"><td>${esc(r.day)}</td><td>${esc(r.time)}</td><td>${esc(r.subject)}</td><td>${esc(r.room)}</td>
      <td><button class="icon-btn del">✕</button></td></tr>`).join('') || '<tr><td colspan="5" style="color:var(--muted)">No classes added.</td></tr>';

    $('#att-list').innerHTML = state.att.map((a) => {
      const pct = a.total ? Math.round((a.attended / a.total) * 100) : 0;
      return `<li data-id="${a.id}">
        <div class="grow"><b>${esc(a.subject)}</b><small>${a.attended}/${a.total} classes · ${pct}%</small>
          <div class="bar" style="margin-top:6px"><div style="width:${pct}%"></div></div></div>
        <button class="btn small present">Present</button>
        <button class="btn small ghost absent">Absent</button>
        <button class="icon-btn del">✕</button></li>`;
    }).join('') || '<p style="color:var(--muted)">No subjects yet.</p>';

    $('#note-list').innerHTML = state.notes.map((n) => `
      <div class="note" data-id="${n.id}"><button class="icon-btn del">✕</button>${esc(n.text)}</div>`).join('') || '<p style="color:var(--muted)">No notes yet.</p>';

    const done = state.tasks.filter((t) => t.done).length;
    const att = state.att.reduce((s, a) => s + a.attended, 0), tot = state.att.reduce((s, a) => s + a.total, 0);
    $('#ov-tasks').textContent = `${done}/${state.tasks.length}`;
    $('#ov-att').textContent = (tot ? Math.round((att / tot) * 100) : 0) + '%';
    $('#ov-focus').textContent = state.focus[today()] || 0;
    $('#ov-notes').textContent = state.notes.length;
    $('#ov-upcoming').innerHTML = state.tasks.filter((t) => !t.done).slice(0, 5).map((t) =>
      `<li><div class="grow"><b>${esc(t.title)}</b><small>${t.due ? 'Due ' + esc(t.due) : 'No due date'}</small></div><span class="tag ${t.pri}">${t.pri}</span></li>`
    ).join('') || '<p style="color:var(--muted)">Nothing pending 🎉</p>';
    showTimer();
  }
  render();
})();
