// ============================================================
// app.js — KIXIKILA SOCIAL (versão unificada e limpa)
// ============================================================

// ── VARIÁVEIS GLOBAIS ────────────────────────────────────────
var _paginaAnterior          = '';
var _tabAtual                = 'descobrir';
var _codigoGrupoAtual        = '';
var _estrelasAvaliacao       = 0;
var _telefoneAvaliacaoDireta = '';
var _nomeAvaliacaoDireta     = '';
var grupoLikes               = {};

// ── ESCAPE HTML (único lugar) ────────────────────────────────
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ════════════════════════════════════════════════════════════
// NAVEGAÇÃO
// ════════════════════════════════════════════════════════════

function mostrarPagina(nome) {
  _paginaAnterior = document.querySelector('.pagina:not([style*="display:none"])')
    ?.id?.replace('pagina','') || '';
  document.querySelectorAll('.pagina').forEach(p => p.style.display = 'none');
  const pagina = document.getElementById('pagina' + nome);
  if (pagina) pagina.style.display = 'flex';
  lucide.createIcons();
  if (nome === 'Dashboard') {
    carregarDashboard();
    carregarFeedDashboard();
    setTimeout(() => { configurarScrollToTop(); }, 300);
  }
  history.pushState({ pagina: nome }, '', '#' + nome);
}

function voltarDashboard() { mostrarPagina('Dashboard'); }

window.addEventListener('popstate', (e) => {
  const pagina = e.state?.pagina;
  if (!pagina || pagina === 'Auth') {
    KixikilaManager.getSessao() ? mostrarPagina('Dashboard') : mostrarPagina('Auth');
  } else {
    document.querySelectorAll('.pagina').forEach(p => p.style.display = 'none');
    const el = document.getElementById('pagina' + pagina);
    if (el) el.style.display = 'flex';
    lucide.createIcons();
  }
});

// ════════════════════════════════════════════════════════════
// BOTTOM NAV
// ════════════════════════════════════════════════════════════

function setNavActivo(id) {
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('activo'));
  const el = document.getElementById(id);
  if (el) el.classList.add('activo');
}

// ════════════════════════════════════════════════════════════
// DASHBOARD TABS
// ════════════════════════════════════════════════════════════

function mostrarTabDashboard(tab) {
  _tabAtual = tab;
  const elDesc  = document.getElementById('tabDescobrir');
  const elMeus  = document.getElementById('tabMeusGrupos');
  const cDesc   = document.getElementById('conteudoDescobrir');
  const cMeus   = document.getElementById('conteudoMeusGrupos');

  if (elDesc)  elDesc.classList.toggle('activo', tab === 'descobrir');
  if (elMeus)  elMeus.classList.toggle('activo', tab === 'meus');
  if (cDesc)   cDesc.style.display  = tab === 'descobrir' ? 'block' : 'none';
  if (cMeus)   cMeus.style.display  = tab === 'meus'      ? 'block' : 'none';

  if (tab === 'descobrir') carregarFeedDashboard();
  if (tab === 'meus')      carregarMeusGruposDashboard();


}

// ════════════════════════════════════════════════════════════
// CARREGAR DASHBOARD (saudação + avatar topnav)
// ════════════════════════════════════════════════════════════

function carregarDashboard() {
  const sessao = KixikilaManager.getSessao();
  if (!sessao) return;
  const p = sessao.perfil;

  // Compose avatar (caixa "Tens um código?")
  const cImg   = document.getElementById('composeAvatarImg');
  const cLetra = document.getElementById('composeAvatarLetra');
  if (p.foto_perfil && cImg) {
    cImg.src = p.foto_perfil; cImg.style.display = 'block';
    if (cLetra) cLetra.style.display = 'none';
  } else if (cLetra) {
    cImg && (cImg.style.display = 'none');
    cLetra.textContent   = (p.nome?.[0] || 'K').toUpperCase();
    cLetra.style.display = 'flex';
  }
}

// ════════════════════════════════════════════════════════════
// FEED — DESCOBRIR GRUPOS
// ════════════════════════════════════════════════════════════

async function carregarFeedDashboard() {
  const container = document.getElementById('feedGrupos');
  const stories   = document.getElementById('storiesRow');
  if (!container) return;

  container.innerHTML = `
    <div style="display:flex;gap:12px;padding:16px;opacity:.4">
      <div style="width:46px;height:46px;border-radius:14px;background:var(--bg3);flex-shrink:0"></div>
      <div style="flex:1;display:flex;flex-direction:column;gap:6px;padding-top:4px">
        <div style="height:12px;border-radius:6px;background:var(--bg3);width:60%"></div>
        <div style="height:10px;border-radius:6px;background:var(--bg3);width:40%"></div>
        <div style="height:10px;border-radius:6px;background:var(--bg3);width:80%"></div>
      </div>
    </div>
  `;

  try {
    const grupos = await KixikilaManager.carregarFeed({ estado: 'aberto', limite: 20 });

    // Stories
    if (stories) {
      stories.innerHTML = '';
      if (grupos.length) {
        grupos.slice(0, 8).forEach(g => {
          const vagas = g.max_membros - g.membros.length;
          const item  = document.createElement('div');
          item.className = 'story-item';
          item.onclick   = () => {
            _codigoGrupoAtual = g.codigo;
            mostrarPagina('VerGrupo');
            carregarVerGrupo(g.codigo);
          };
          item.innerHTML = `
            <div class="story-ring">
              <div class="story-inner">
                <span class="story-inner-text">${(g.nome||'G')[0].toUpperCase()}</span>
              </div>
            </div>
            <span class="story-label">${escapeHtml(g.nome)}</span>
            <span class="story-valor">${vagas} vaga${vagas!==1?'s':''}</span>
          `;
          stories.appendChild(item);
        });
      }
    }

    // Feed lista
    container.innerHTML = '';
    if (!grupos.length) {
      container.innerHTML = '<div style="padding:30px 16px;text-align:center;color:var(--muted);font-size:.88rem">Nenhum grupo aberto no momento.</div>';
      return;
    }

    for (const g of grupos) {
      const vagas = g.max_membros - g.membros.length;
      const pct   = Math.round((g.membros.length / g.max_membros) * 100);
      const card  = document.createElement('div');
      card.className = 'feed-grupo-card';
      card.setAttribute('data-codigo', g.codigo);
      card.onclick = () => {
        _codigoGrupoAtual = g.codigo;
        mostrarPagina('VerGrupo');
        carregarVerGrupo(g.codigo);
      };
      const views = Math.floor(Math.random() * 300) + 50;
      const likes = Math.floor(Math.random() * 50) + 10;
      card.innerHTML = `
        <div class="feed-card-top">
          <div class="feed-grupo-icon">${(g.nome||'G')[0].toUpperCase()}</div>
          <div class="feed-info">
            <h4>${escapeHtml(g.nome)}</h4>
            <div class="feed-valor">${KixikilaManager.formatarValor(g.valor)} KZ · ${g.periodicidade}</div>
            <div class="feed-criador">por <span onclick="event.stopPropagation();abrirPerfilMembro('${escapeHtml(g.criador.telefone)}')">${escapeHtml(g.criador.nome)}</span></div>
            <div class="feed-progress"><div class="feed-progress-bar" style="width:${pct}%"></div></div>
          </div>
          <div class="feed-meta">
            <span class="feed-vagas">${vagas} vaga${vagas!==1?'s':''}</span>
            <small>${g.membros.length}/${g.max_membros}</small>
          </div>
        </div>
        <div class="feed-card-actions">
          <div class="feed-action-btn">
            <i data-lucide="eye" style="width:14px;height:14px"></i>
            <span>${views}</span>
          </div>
          <div class="feed-action-btn like-metric" data-codigo="${escapeHtml(g.codigo)}" data-liked="false"
               onclick="event.stopPropagation();handleGrupoLikeInline(this,'${escapeHtml(g.codigo)}',${likes})">
            <i data-lucide="heart" style="width:14px;height:14px"></i>
            <span class="like-count">${likes}</span>
          </div>
          <div class="feed-action-btn"
               onclick="event.stopPropagation();abrirChatGrupo('${escapeHtml(g.codigo)}')">
            <i data-lucide="message-circle" style="width:14px;height:14px"></i>
            <span>Comentar</span>
          </div>
        </div>
      `;
      container.appendChild(card);
    }
    lucide.createIcons();

  } catch (e) {
    console.error('Erro feed:', e);
    container.innerHTML = '<div style="padding:30px 16px;text-align:center;color:var(--muted);font-size:.88rem">Erro ao carregar grupos.</div>';
  }
}

// ════════════════════════════════════════════════════════════
// OS MEUS GRUPOS
// ════════════════════════════════════════════════════════════

async function carregarMeusGruposDashboard() {
  const container = document.getElementById('listaGrupos');
  const vazio     = document.getElementById('dashVazio');
  if (!container) return;

  try {
    const grupos = await KixikilaManager.carregarMeusGrupos();
    if (!grupos.length) {
      container.innerHTML = '';
      if (vazio) vazio.style.display = 'block';
      return;
    }
    if (vazio) vazio.style.display = 'none';
    container.innerHTML = '';

    for (const g of grupos) {
      const pagos = g.membros.filter(m => m.pago).length;
      const cheio = g.membros.length >= g.max_membros;
      const card  = document.createElement('div');
      card.className = 'card-grupo';
      card.setAttribute('data-codigo', g.codigo);
      card.onclick = () => {
        _codigoGrupoAtual = g.codigo;
        mostrarPagina('VerGrupo');
        carregarVerGrupo(g.codigo);
      };
      card.innerHTML = `
        <div class="card-grupo-icon">${(g.nome||'G')[0].toUpperCase()}</div>
        <div class="card-grupo-info">
          <h3>${escapeHtml(g.nome)}</h3>
          <div class="valor">${KixikilaManager.formatarValor(g.valor)} KZ · ${g.periodicidade}</div>
          <div class="info">${g.membros.length} membros · ${pagos} pagaram</div>
          <span class="pill ${cheio?'pill-cheio':'pill-aberto'}">${cheio?'Cheio':'Aberto'}</span>
        </div>
        <div class="card-grupo-seta"><i data-lucide="chevron-right"></i></div>
      `;
      container.appendChild(card);
    }
    lucide.createIcons();
  } catch (e) {
    container.innerHTML = '<div style="padding:30px 16px;text-align:center;color:var(--muted);font-size:.88rem">Erro ao carregar os teus grupos.</div>';
  }
}

// ════════════════════════════════════════════════════════════
// AUTH
// ════════════════════════════════════════════════════════════

function mostrarTab(tab) {
  const r = document.getElementById('tabRegisto');
  const l = document.getElementById('tabLogin');
  if (r) r.style.display = tab === 'registo' ? 'block' : 'none';
  if (l) l.style.display = tab === 'login'   ? 'block' : 'none';
  document.querySelectorAll('.auth-tab').forEach((b, i) => {
    b.classList.toggle('activo', (i===0 && tab==='registo') || (i===1 && tab==='login'));
  });
}

function previewFoto(origem, evento) {
  const ficheiro = evento.target.files[0];
  if (!ficheiro) return;
  if (!ficheiro.type.startsWith('image/')) { mostrarToast('Imagem inválida.'); return; }
  if (ficheiro.size > 5*1024*1024)         { mostrarToast('Imagem > 5MB.');    return; }
  const leitor = new FileReader();
  leitor.onload = (e) => {
    const src = e.target.result;
    const img = document.getElementById('previewFoto' + origem);
    const ph  = document.getElementById('fotoPlaceholder' + origem);
    if (img) { img.src = src; img.style.display = 'block'; }
    if (ph)  ph.style.display = 'none';
    try { sessionStorage.setItem('kx_temp_foto', src); } catch (_) {}
  };
  leitor.readAsDataURL(ficheiro);
}

function getFotoTemp()  { try { return sessionStorage.getItem('kx_temp_foto') || undefined; } catch (_) { return undefined; } }
function limparFotoTemp(){ try { sessionStorage.removeItem('kx_temp_foto'); } catch (_) {} }

async function registar() {
  const nome     = document.getElementById('regNome')?.value.trim()     || '';
  const telefone = document.getElementById('regTelefone')?.value.trim() || '';
  const senha    = document.getElementById('regSenha')?.value.trim()    || '';

  if (!nome || !telefone || !senha)     { mostrarModal('Campos obrigatórios', 'Preenche o nome, telefone e senha.'); return; }
  if (senha.length < 6)                 { mostrarModal('Senha curta', 'A senha deve ter pelo menos 6 caracteres.'); return; }
  if (telefone.replace(/\D/g,'').length < 9) { mostrarModal('Telefone inválido', 'Número inválido.'); return; }

  try {
    const perfil = await KixikilaManager.registar({ telefone, nome, senha, foto_perfil: getFotoTemp() });
    limparFotoTemp();
    mostrarToast('Bem-vindo, ' + perfil.nome + '!');
    mostrarPagina('Dashboard');
  } catch (e) { mostrarModal('Erro ao registar', e.message); }
}

async function entrar() {
  const telefone = document.getElementById('loginTelefone')?.value.trim() || '';
  const senha    = document.getElementById('loginSenha')?.value.trim()    || '';
  if (!telefone || !senha) { mostrarModal('Campos obrigatórios', 'Preenche o telefone e a senha.'); return; }
  try {
    const perfil = await KixikilaManager.entrar({ telefone, senha });
    mostrarToast('Bem-vindo de volta, ' + perfil.nome + '!');
    mostrarPagina('Dashboard');
  } catch (e) { mostrarModal('Credenciais incorrectas', e.message); }
}

function logout() {
  mostrarModalConfirmar('Sair', 'Tens a certeza que queres sair?', () => {
    KixikilaManager.limparSessao();
    mostrarPagina('Auth');
  });
}

// ════════════════════════════════════════════════════════════
// TERMOS
// ════════════════════════════════════════════════════════════

function verificarScrollTermos() {
  const el    = document.getElementById('termosScroll');
  const hint  = document.getElementById('termosHint');
  const check = document.getElementById('termosCheckWrap');
  const input = document.getElementById('termosCheck');
  if (!el) return;
  if (el.scrollTop + el.clientHeight >= el.scrollHeight - 10) {
    if (hint)  { hint.innerHTML = '<i data-lucide="check-circle"></i> Lido — pode aceitar os termos'; hint.classList.add('lido'); lucide.createIcons(); }
    if (check) { check.style.opacity = '1'; check.style.pointerEvents = 'auto'; }
    if (input) input.disabled = false;
  }
}

function atualizarBotaoCriar() {
  const btn = document.getElementById('btnCriarConta');
  const chk = document.getElementById('termosCheck');
  if (btn && chk) btn.disabled = !chk.checked;
}

// ════════════════════════════════════════════════════════════
// MODAL & TOAST
// ════════════════════════════════════════════════════════════

function mostrarModal(titulo, mensagem, onOk) {
  document.getElementById('modalTitulo').textContent   = titulo;
  document.getElementById('modalMensagem').textContent = mensagem;
  const btns = document.getElementById('modalBtns');
  btns.innerHTML = '';
  const ok = document.createElement('button');
  ok.className = 'btn-primary'; ok.textContent = 'OK'; ok.style.flex = '1';
  ok.onclick = () => { fecharModal(); if (onOk) onOk(); };
  btns.appendChild(ok);
  document.getElementById('modal').style.display = 'flex';
}

function mostrarModalConfirmar(titulo, mensagem, onConfirmar, txtConfirmar, onAlternativo) {
  document.getElementById('modalTitulo').textContent   = titulo;
  document.getElementById('modalMensagem').textContent = mensagem;
  const btns = document.getElementById('modalBtns');
  btns.innerHTML = '';

  const cancel = document.createElement('button');
  cancel.className = 'btn-outline'; cancel.textContent = 'Cancelar'; cancel.onclick = fecharModal;

  const ok = document.createElement('button');
  ok.className = 'btn-primary'; ok.textContent = txtConfirmar || 'Confirmar';
  ok.onclick = () => { fecharModal(); if (onConfirmar) onConfirmar(); };

  btns.appendChild(cancel);
  btns.appendChild(ok);

  if (onAlternativo) {
    const alt = document.createElement('button');
    alt.className = 'btn-outline'; alt.textContent = txtConfirmar || 'Confirmar';
    alt.onclick = () => { fecharModal(); onAlternativo(); };
    btns.appendChild(alt);
  }
  document.getElementById('modal').style.display = 'flex';
}

function mostrarModalComInput(titulo, mensagem, tipo, onConfirmar) {
  document.getElementById('modalTitulo').textContent = titulo;
  document.getElementById('modalMensagem').innerHTML = `${mensagem}
    <input type="${tipo}" id="modalInput" placeholder="A tua senha"
      style="width:100%;padding:12px;border:1px solid var(--border2);border-radius:10px;font-size:.95rem;margin-top:12px;background:var(--bg3);color:var(--text);">`;
  const btns = document.getElementById('modalBtns');
  btns.innerHTML = '';
  const cancel = document.createElement('button');
  cancel.className = 'btn-outline'; cancel.textContent = 'Cancelar'; cancel.onclick = fecharModal;
  const ok = document.createElement('button');
  ok.className = 'btn-primary'; ok.textContent = 'Eliminar'; ok.style.background = 'var(--r2)';
  ok.onclick = () => {
    const v = document.getElementById('modalInput')?.value;
    if (!v) return;
    fecharModal(); if (onConfirmar) onConfirmar(v);
  };
  btns.appendChild(cancel); btns.appendChild(ok);
  document.getElementById('modal').style.display = 'flex';
}

function fecharModal() {
  document.getElementById('modal').style.display = 'none';
}

function mostrarToast(mensagem) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = mensagem;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2800);
}

// ════════════════════════════════════════════════════════════
// PERFIL (O MEU)
// ════════════════════════════════════════════════════════════

function abrirPerfil() {
  mostrarPagina('Perfil');
  carregarDadosPerfil();
}

function carregarDadosPerfil() {
  const perfil = KixikilaManager.getSessao()?.perfil;
  if (!perfil) return;

  const nomeEl  = document.getElementById('perfilNomeTexto') || document.getElementById('perfilNome');
  const handleEl= document.getElementById('perfilHandle');
  const telEl   = document.getElementById('perfilTelefone');
  const repEl   = document.getElementById('perfilReputacao');
  const editEl  = document.getElementById('editNome');
  const imgEl   = document.getElementById('perfilFotoImg');
  const letraEl = document.getElementById('perfilFotoLetra');
  const topoEl  = document.getElementById('perfilTopTitulo');

  if (nomeEl)   nomeEl.textContent  = perfil.nome || 'Utilizador';
  if (topoEl)   topoEl.textContent  = perfil.nome || 'Perfil';
  if (handleEl) handleEl.textContent= '@' + (perfil.nome||'u').toLowerCase().replace(/\s+/g,'');
  if (telEl)    telEl.textContent   = perfil.telefone || '';
  if (editEl)   editEl.value        = perfil.nome || '';
  if (repEl)    repEl.textContent   = perfil.reputacao > 0
    ? KixikilaManager.reputacaoEstrelas(perfil.reputacao) + '  ' + KixikilaManager.reputacaoTexto(perfil.reputacao)
    : 'Sem avaliações';

  if (perfil.foto_perfil && imgEl) {
    imgEl.src = perfil.foto_perfil; imgEl.style.display = 'block';
    if (letraEl) letraEl.style.display = 'none';
  } else if (letraEl) {
    letraEl.textContent   = (perfil.nome?.[0] || 'K').toUpperCase();
    letraEl.style.display = 'flex';
    if (imgEl) imgEl.style.display = 'none';
  }

  KixikilaManager.carregarStats(perfil.telefone).then(s => {
    const gEl = document.getElementById('statGrupos');
    const aEl = document.getElementById('statAvaliacoes');
    if (gEl) gEl.textContent = s.grupos_activos  || 0;
    if (aEl) aEl.textContent = s.total_avaliacoes || 0;
  }).catch(() => {});

  lucide.createIcons();
}

async function guardarPerfil() {
  const perfil = KixikilaManager.getSessao()?.perfil;
  if (!perfil) return;
  const nome  = document.getElementById('editNome')?.value.trim()  || '';
  const senha = document.getElementById('editSenha')?.value.trim() || '';
  if (!nome) { mostrarToast('O nome é obrigatório.'); return; }
  try {
    await KixikilaManager.atualizarPerfil({ telefone: perfil.telefone, nome, senha: senha || undefined });
    mostrarToast('Perfil actualizado!');
    carregarDadosPerfil();
    carregarDashboard();
  } catch (e) { mostrarModal('Erro', e.message); }
}

function toggleEditarPerfil() {
  const card = document.getElementById('perfEditarCard');
  if (card) card.style.display = card.style.display === 'none' ? 'block' : 'none';
}

function setPerfTab(tab) {
  ['pub','grupos','aval'].forEach(t => {
    const id = 'ptab' + t.charAt(0).toUpperCase() + t.slice(1);
    document.getElementById(id)?.classList.remove('activo');
  });
  document.getElementById('ptab' + tab.charAt(0).toUpperCase() + tab.slice(1))?.classList.add('activo');
}

async function confirmarEliminarConta() {
  const perfil = KixikilaManager.getSessao()?.perfil;
  if (!perfil) return;
  try {
    const stats = await KixikilaManager.carregarStats(perfil.telefone);
    if (stats.grupos_activos > 0) {
      mostrarModal('Não é possível eliminar', 'Ainda fazes parte de ' + stats.grupos_activos + ' grupo(s). Sai de todos os grupos primeiro.');
      return;
    }
  } catch (_) {}
  mostrarModalComInput('Eliminar Conta', 'Digita a tua senha para confirmar.', 'password', async (senha) => {
    try {
      await KixikilaManager.eliminarConta(perfil.telefone, senha);
      KixikilaManager.limparSessao();
      mostrarModal('Conta eliminada', 'A tua conta foi removida.', () => mostrarPagina('Auth'));
    } catch (e) { mostrarModal('Erro', e.message); }
  });
}

// ════════════════════════════════════════════════════════════
// PERFIL MEMBRO
// ════════════════════════════════════════════════════════════

async function abrirPerfilMembro(telefone) {
  mostrarPagina('PerfilMembro');
  const container = document.getElementById('perfilMembroConteudo');
  if (!container) return;
  container.innerHTML = '<p style="text-align:center;padding:40px;color:var(--muted);">A carregar perfil...</p>';

  try {
    const perfil  = await KixikilaManager.carregarReputacao(telefone);
    const estrelas= KixikilaManager.reputacaoEstrelas(perfil.reputacao || 0);
    const texto   = KixikilaManager.reputacaoTexto(perfil.reputacao || 0);

    container.innerHTML = `
      <div class="membro-perfil-topo">
        ${perfil.foto_perfil
          ? `<img src="${escapeHtml(perfil.foto_perfil)}" class="membro-perfil-foto" alt="Foto">`
          : `<div class="membro-perfil-letra">${(perfil.nome||'U')[0].toUpperCase()}</div>`
        }
        <h3 class="membro-perfil-nome">${escapeHtml(perfil.nome||'Utilizador')}</h3>
        <p class="membro-perfil-tel">${escapeHtml(perfil.telefone||telefone)}</p>
        <p class="membro-perfil-rep">${estrelas} ${texto}</p>
      </div>
      <div class="membro-perfil-stats">
        <div class="stat-box"><span>${perfil.grupos_concluidos||0}</span><label>Grupos</label></div>
        <div class="stat-box"><span>${perfil.total_avaliacoes||0}</span><label>Avaliações</label></div>
      </div>
      <div class="membro-perfil-acoes">
        <button class="btn-confiar" onclick="abrirAvaliacaoDireta('${escapeHtml(telefone)}','${escapeHtml(perfil.nome||'')}')">
          <i data-lucide="star"></i> Avaliar este membro
        </button>
      </div>
      <div class="avaliacoes-lista">
        <div class="secao-label-pequena">AVALIAÇÕES RECENTES</div>
        <p style="color:var(--muted);font-size:.85rem;text-align:center;padding:12px;">A carregar...</p>
      </div>
    `;
    lucide.createIcons();

    // Avaliações recebidas
    const avaliacoes = await KixikilaManager.carregarAvaliacoesRecebidas(telefone);
    const listaEl    = container.querySelector('.avaliacoes-lista');
    if (listaEl && avaliacoes.length) {
      listaEl.innerHTML = '<div class="secao-label-pequena">AVALIAÇÕES RECENTES</div>';
      avaliacoes.slice(0,5).forEach(av => {
        const div = document.createElement('div');
        div.className = 'avaliacao-item';
        div.innerHTML = `
          <div class="avaliacao-estrelas">${KixikilaManager.reputacaoEstrelas(av.estrelas||0)}</div>
          ${av.comentario ? `<div class="avaliacao-comentario">${escapeHtml(av.comentario)}</div>` : ''}
          <div class="avaliacao-data">${av.data ? new Date(av.data).toLocaleDateString('pt-AO') : ''}</div>
        `;
        listaEl.appendChild(div);
      });
    } else if (listaEl) {
      listaEl.innerHTML = '<div class="secao-label-pequena">AVALIAÇÕES RECENTES</div><p style="color:var(--muted);font-size:.85rem;text-align:center;padding:12px;">Sem avaliações ainda.</p>';
    }
  } catch (e) {
    container.innerHTML = '<p style="text-align:center;padding:40px;color:var(--muted);">Erro ao carregar perfil.</p>';
  }
}

// ════════════════════════════════════════════════════════════
// AVALIAÇÃO DIRECTA
// ════════════════════════════════════════════════════════════

function abrirAvaliacaoDireta(telefone, nome) {
  _telefoneAvaliacaoDireta = telefone;
  _nomeAvaliacaoDireta     = nome;
  const avalNome = document.getElementById('avalDiretaNome');
  if (avalNome) avalNome.textContent = nome;
  _estrelasAvaliacao = 0;
  const wrap = document.getElementById('estrelasWrapDireta');
  if (!wrap) return;
  wrap.innerHTML = '';
  for (let i = 1; i <= 5; i++) {
    const btn = document.createElement('button');
    btn.className = 'estrela-btn'; btn.textContent = '★';
    btn.onclick = ((n) => () => {
      _estrelasAvaliacao = n;
      wrap.querySelectorAll('.estrela-btn').forEach((b,j) => b.classList.toggle('on', j < n));
    })(i);
    wrap.appendChild(btn);
  }
  document.getElementById('overlayAvaliacaoDireta').style.display = 'flex';
}

function fecharAvaliacaoDireta() {
  document.getElementById('overlayAvaliacaoDireta').style.display = 'none';
  _estrelasAvaliacao = 0;
  const c = document.getElementById('comentarioAvaliacao');
  if (c) c.value = '';
}

async function confirmarAvaliacaoDireta() {
  if (!_estrelasAvaliacao) { mostrarToast('Selecciona as estrelas'); return; }
  const perfil = KixikilaManager.getSessao()?.perfil;
  if (!perfil) return;
  const comentario = document.getElementById('comentarioAvaliacao')?.value.trim() || '';
  try {
    await KixikilaManager.avaliar(perfil.telefone, _telefoneAvaliacaoDireta, _estrelasAvaliacao, comentario);
    fecharAvaliacaoDireta();
    mostrarToast('Avaliação enviada!');
    abrirPerfilMembro(_telefoneAvaliacaoDireta);
  } catch (e) { mostrarToast(e.message); }
}

function configurarScrollToTop() {
  const btn       = document.getElementById('scrollTopBtn');
  const container = document.querySelector('.dashboard-content');
  if (!btn || !container) return;
  container.addEventListener('scroll', () => {
    btn.classList.toggle('show', container.scrollTop > 300);
  });
  btn.onclick = () => container.scrollTo({ top: 0, behavior: 'smooth' });
}

// ════════════════════════════════════════════════════════════
// NOTIFICAÇÕES (ícone no topnav já existe no HTML)
// ════════════════════════════════════════════════════════════

async function carregarNotificacoes() {
  try {
    const dados = await KixikilaManager.carregarNotificacoes();
    const naoLidas = (dados.notificacoes || []).filter(n => !n.lida).length;
    const dot = document.querySelector('.notif-dot');
    if (dot) dot.style.display = naoLidas > 0 ? 'block' : 'none';
  } catch (_) {}
}

// ════════════════════════════════════════════════════════════
// INICIALIZAÇÃO
// ════════════════════════════════════════════════════════════

(function init() {
  try {
    const guardado = sessionStorage.getItem('kx_sessao');
    if (guardado) {
      KixikilaManager.setSessao(JSON.parse(guardado));
      mostrarPagina('Dashboard');
      setTimeout(carregarNotificacoes, 1000);
      return;
    }
  } catch (_) {}
  mostrarPagina('Auth');
  lucide.createIcons();
})();
// ════════════════════════════════════════════════════════════
// HELPERS INLINE CARDS FEED
// ════════════════════════════════════════════════════════════

const _feedLikes = {};

function handleGrupoLikeInline(el, codigo, initialLikes) {
  if (!_feedLikes[codigo]) _feedLikes[codigo] = { count: initialLikes, liked: false };
  const state = _feedLikes[codigo];
  const countSpan = el.querySelector('.like-count');
  const icon = el.querySelector('svg');
  if (state.liked) {
    state.liked = false;
    state.count--;
    el.setAttribute('data-liked', 'false');
    el.classList.remove('liked');
    if (icon) { icon.style.fill = 'none'; icon.style.stroke = ''; }
  } else {
    state.liked = true;
    state.count++;
    el.setAttribute('data-liked', 'true');
    el.classList.add('liked');
    if (icon) { icon.style.fill = '#C0392B'; icon.style.stroke = '#C0392B'; }
    mostrarToast('Curtido');
  }
  if (countSpan) countSpan.textContent = state.count;
}

function abrirChatGrupo(codigo) {
  _codigoGrupoAtual = codigo;
  mostrarPagina('Chat');
  if (typeof carregarChatGrupo === 'function') carregarChatGrupo();
}

window.handleGrupoLikeInline = handleGrupoLikeInline;
window.abrirChatGrupo = abrirChatGrupo;
