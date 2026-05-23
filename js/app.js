// ════════════════════════════════════════════════════════════
// app.js — KIXIKILA (UNIFICADO)
// ════════════════════════════════════════════════════════════

var _paginaAnterior = '';
var _tabAtual = 'descobrir';
var _codigoGrupoAtual = '';
var _estrelasAvaliacao = 0;
var _telefoneAvaliacaoDireta = '';
var _nomeAvaliacaoDireta = '';
var _syncInterval = null;

// SVG inline (evita dependência do Lucide em algumas áreas)
const SVG = {
  eye: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>`,
  heart: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`,
  heartOn: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="var(--r)" stroke="var(--r)" stroke-width="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`,
  comment: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
  send: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`,
  chevron: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>`
};

// Cache local para UI (likes e views simulados até API responder)
var grupoLikesCache = {};
var viewsCache = {};

function pseudoRandom(seed, max, min = 0) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  return min + (Math.abs(h) % (max - min + 1));
}

function getViews(codigo) {
  if (!viewsCache[codigo]) viewsCache[codigo] = pseudoRandom(codigo + 'v', 350, 50);
  return viewsCache[codigo];
}

async function getLikes(codigo) {
  try {
    const dados = await KixikilaManager.carregarLikes(codigo);
    return { count: dados.total || 0, liked: false };
  } catch { return { count: pseudoRandom(codigo + 'l', 60, 10), liked: false }; }
}

// ════════════════════════════════════════════════════════════
// UTILITÁRIOS
// ════════════════════════════════════════════════════════════

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function mostrarToast(mensagem) {
  const toast = document.getElementById('toast');
  toast.textContent = mensagem;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2800);
}

function fecharModal() {
  document.getElementById('modal').style.display = 'none';
}

function mostrarModal(titulo, mensagem, onOk) {
  document.getElementById('modalTitulo').textContent = titulo;
  document.getElementById('modalMensagem').textContent = mensagem;
  const btns = document.getElementById('modalBtns');
  btns.innerHTML = '';
  const ok = document.createElement('button');
  ok.className = 'btn-primary'; ok.textContent = 'OK'; ok.style.flex = '1';
  ok.onclick = () => { fecharModal(); if (onOk) onOk(); };
  btns.appendChild(ok);
  document.getElementById('modal').style.display = 'flex';
}

function mostrarModalConfirmar(titulo, mensagem, onConfirmar, txtOk, onAlt) {
  document.getElementById('modalTitulo').textContent = titulo;
  document.getElementById('modalMensagem').textContent = mensagem;
  const btns = document.getElementById('modalBtns');
  btns.innerHTML = '';
  const cancel = document.createElement('button');
  cancel.className = 'btn-outline'; cancel.textContent = 'Cancelar'; cancel.onclick = fecharModal;
  const ok = document.createElement('button');
  ok.className = 'btn-primary'; ok.textContent = txtOk || 'Confirmar';
  ok.onclick = () => { fecharModal(); if (onConfirmar) onConfirmar(); };
  btns.appendChild(cancel); btns.appendChild(ok);
  if (onAlt) {
    const alt = document.createElement('button');
    alt.className = 'btn-outline'; alt.textContent = 'WhatsApp';
    alt.onclick = () => { fecharModal(); onAlt(); };
    btns.appendChild(alt);
  }
  document.getElementById('modal').style.display = 'flex';
}

function mostrarModalComInput(titulo, mensagem, tipo, onConfirmar) {
  document.getElementById('modalTitulo').textContent = titulo;
  document.getElementById('modalMensagem').innerHTML = `${escapeHtml(mensagem)}
    <input type="${tipo}" id="modalInput" placeholder="A tua senha"
      style="width:100%;padding:12px;border:1px solid var(--border2);border-radius:10px;
      font-size:.95rem;margin-top:12px;background:var(--bg3);color:var(--text)">`;
  const btns = document.getElementById('modalBtns');
  btns.innerHTML = '';
  const cancel = document.createElement('button');
  cancel.className = 'btn-outline'; cancel.textContent = 'Cancelar'; cancel.onclick = fecharModal;
  const ok = document.createElement('button');
  ok.className = 'btn-primary'; ok.textContent = 'Eliminar'; ok.style.background = 'var(--r2)';
  ok.onclick = () => { const v = document.getElementById('modalInput')?.value; if (!v) return; fecharModal(); if (onConfirmar) onConfirmar(v); };
  btns.appendChild(cancel); btns.appendChild(ok);
  document.getElementById('modal').style.display = 'flex';
}

function comprimirImagem(ficheiro, maxDim = 600, qualidade = 0.7) {
  return new Promise((resolve, reject) => {
    if (!ficheiro?.type.startsWith('image/')) { reject(new Error('Ficheiro inválido')); return; }
    const leitor = new FileReader();
    leitor.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) { height = Math.round(height * maxDim / width); width = maxDim; }
          else { width = Math.round(width * maxDim / height); height = maxDim; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', qualidade));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    leitor.onerror = reject;
    leitor.readAsDataURL(ficheiro);
  });
}

// ════════════════════════════════════════════════════════════
// NAVEGAÇÃO
// ════════════════════════════════════════════════════════════

function mostrarPagina(nome) {
  document.querySelectorAll('.pagina').forEach(p => p.style.display = 'none');
  const pagina = document.getElementById('pagina' + nome);
  if (pagina) pagina.style.display = 'flex';
  if (nome !== 'Dashboard') lucide.createIcons();
  if (nome === 'Dashboard') {
    carregarDashboard();
    carregarFeedDashboard();
    iniciarSync();
  } else {
    pararSync();
  }
  history.pushState({ pagina: nome }, '', '#' + nome);
}

function voltarDashboard() { mostrarPagina('Dashboard'); }
function voltarGrupo() { mostrarPagina('VerGrupo'); carregarVerGrupo(_codigoGrupoAtual); }

window.addEventListener('popstate', (e) => {
  const pagina = e.state?.pagina;
  if (!pagina || pagina === 'Auth') {
    KixikilaManager.getSessao() ? mostrarPagina('Dashboard') : mostrarPagina('Auth');
  } else {
    document.querySelectorAll('.pagina').forEach(p => p.style.display = 'none');
    const el = document.getElementById('pagina' + pagina);
    if (el) el.style.display = 'flex';
    if (pagina !== 'Dashboard') lucide.createIcons();
  }
});

// ════════════════════════════════════════════════════════════
// SYNC
// ════════════════════════════════════════════════════════════

function iniciarSync() {
  pararSync();
  _syncInterval = setInterval(async () => {
    if (document.visibilityState === 'hidden') return;
    try {
      if (_tabAtual === 'descobrir') await carregarFeedDashboard(true);
      else if (_tabAtual === 'meus') await carregarMeusGruposDashboard(true);
      await carregarNotificacoes();
    } catch (_) {}
  }, 60000);
}

function pararSync() {
  if (_syncInterval) { clearInterval(_syncInterval); _syncInterval = null; }
}

// ════════════════════════════════════════════════════════════
// AUTH
// ════════════════════════════════════════════════════════════

function mostrarTab(tab) {
  document.getElementById('tabRegisto').style.display = tab === 'registo' ? 'block' : 'none';
  document.getElementById('tabLogin').style.display = tab === 'login' ? 'block' : 'none';
  document.querySelectorAll('.auth-tab').forEach((b, i) => {
    b.classList.toggle('activo', (i === 0 && tab === 'registo') || (i === 1 && tab === 'login'));
  });
}

async function previewFoto(origem, evento) {
  const ficheiro = evento.target.files[0];
  if (!ficheiro) return;
  try {
    const src = await comprimirImagem(ficheiro, 500, 0.7);
    const img = document.getElementById('previewFoto' + origem);
    const ph = document.getElementById('fotoPlaceholder' + origem);
    if (img) { img.src = src; img.style.display = 'block'; }
    if (ph) ph.style.display = 'none';
    sessionStorage.setItem('kx_temp_foto', src);
    mostrarToast('Foto pronta');
  } catch { mostrarToast('Erro ao processar imagem'); }
}

async function previewFotoGrupo(evento) {
  const ficheiro = evento.target.files[0];
  if (!ficheiro) return;
  try {
    const src = await comprimirImagem(ficheiro, 400, 0.7);
    const img = document.getElementById('previewFotoGrupo');
    const ph = document.getElementById('fotoGrupoPlaceholder');
    if (img) { img.src = src; img.style.display = 'block'; }
    if (ph) ph.style.display = 'none';
    sessionStorage.setItem('kx_temp_foto_grupo', src);
    mostrarToast('Foto do grupo pronta');
  } catch { mostrarToast('Erro ao processar imagem'); }
}

function getFotoTemp() { return sessionStorage.getItem('kx_temp_foto') || undefined; }
function limparFotoTemp() { sessionStorage.removeItem('kx_temp_foto'); }
function getFotoGrupoTemp() { return sessionStorage.getItem('kx_temp_foto_grupo') || undefined; }
function limparFotoGrupoTemp() { sessionStorage.removeItem('kx_temp_foto_grupo'); }

async function registar() {
  const nome = document.getElementById('regNome')?.value.trim() || '';
  const telefone = document.getElementById('regTelefone')?.value.trim() || '';
  const senha = document.getElementById('regSenha')?.value.trim() || '';
  if (!nome || !telefone || !senha) { mostrarModal('Campos obrigatórios', 'Preenche todos os campos.'); return; }
  if (senha.length < 6) { mostrarModal('Senha curta', 'Mínimo 6 caracteres.'); return; }
  try {
    const perfil = await KixikilaManager.registar({ telefone, nome, senha, foto_perfil: getFotoTemp() });
    limparFotoTemp();
    mostrarToast('Bem-vindo, ' + perfil.nome + '!');
    mostrarPagina('Dashboard');
  } catch (e) { mostrarModal('Erro ao registar', e.message); }
}

async function entrar() {
  const telefone = document.getElementById('loginTelefone')?.value.trim() || '';
  const senha = document.getElementById('loginSenha')?.value.trim() || '';
  if (!telefone || !senha) { mostrarModal('Campos obrigatórios', 'Preenche telefone e senha.'); return; }
  try {
    const perfil = await KixikilaManager.entrar({ telefone, senha });
    mostrarToast('Bem-vindo, ' + perfil.nome + '!');
    mostrarPagina('Dashboard');
  } catch (e) { mostrarModal('Credenciais incorrectas', e.message); }
}

function logout() {
  mostrarModalConfirmar('Sair', 'Tens a certeza?', () => {
    pararSync();
    KixikilaManager.limparSessao();
    mostrarPagina('Auth');
  });
}

// ════════════════════════════════════════════════════════════
// TERMOS
// ════════════════════════════════════════════════════════════

function verificarScrollTermos() {
  const el = document.getElementById('termosScroll');
  const hint = document.getElementById('termosHint');
  const check = document.getElementById('termosCheckWrap');
  const input = document.getElementById('termosCheck');
  if (!el) return;
  if (el.scrollTop + el.clientHeight >= el.scrollHeight - 10) {
    if (hint) { hint.innerHTML = 'Lido — pode aceitar os termos'; hint.classList.add('lido'); }
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
// DASHBOARD
// ════════════════════════════════════════════════════════════

function setNavActivo(id) {
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('activo'));
  document.getElementById(id)?.classList.add('activo');
}

function mostrarTabDashboard(tab) {
  _tabAtual = tab;
  document.getElementById('tabDescobrir')?.classList.toggle('activo', tab === 'descobrir');
  document.getElementById('tabMeusGrupos')?.classList.toggle('activo', tab === 'meus');
  const cDesc = document.getElementById('conteudoDescobrir');
  const cMeus = document.getElementById('conteudoMeusGrupos');
  if (cDesc) cDesc.style.display = tab === 'descobrir' ? 'block' : 'none';
  if (cMeus) cMeus.style.display = tab === 'meus' ? 'block' : 'none';
  if (tab === 'descobrir') carregarFeedDashboard();
  if (tab === 'meus') carregarMeusGruposDashboard();
}

function carregarDashboard() {
  const sessao = KixikilaManager.getSessao();
  if (!sessao) return;
  const p = sessao.perfil;
  const cImg = document.getElementById('composeAvatarImg');
  const cLetra = document.getElementById('composeAvatarLetra');
  if (p.foto_perfil && cImg) {
    cImg.src = p.foto_perfil; cImg.style.display = 'block';
    if (cLetra) cLetra.style.display = 'none';
  } else if (cLetra) {
    if (cImg) cImg.style.display = 'none';
    cLetra.textContent = (p.nome?.[0] || 'K').toUpperCase();
    cLetra.style.display = 'flex';
  }
  setTimeout(carregarNotificacoes, 800);
}

// ════════════════════════════════════════════════════════════
// FEED - GRUPOS ABERTOS
// ════════════════════════════════════════════════════════════

async function carregarFeedDashboard(silencioso = false) {
  const container = document.getElementById('feedGrupos');
  const stories = document.getElementById('storiesRow');
  if (!container) return;

  try {
    const grupos = await KixikilaManager.carregarFeed({ estado: 'aberto', limite: 20 });

    if (stories) {
      stories.innerHTML = '';
      grupos.slice(0, 8).forEach(g => {
        const vagas = g.max_membros - g.membros.length;
        const item = document.createElement('div');
        item.className = 'story-item';
        item.onclick = () => abrirPreviewGrupo(g);
        const letra = (g.nome||'G')[0].toUpperCase();
        item.innerHTML = `
          <div class="story-ring"><div class="story-inner">
            ${g.foto_grupo ? `<img src="${escapeHtml(g.foto_grupo)}" style="width:100%;height:100%;object-fit:cover">` : `<span class="story-inner-text">${letra}</span>`}
          </div></div>
          <span class="story-label">${escapeHtml(g.nome)}</span>
          <span class="story-valor">${vagas} vaga${vagas!==1?'s':''}</span>`;
        stories.appendChild(item);
      });
    }

    container.innerHTML = '';
    if (!grupos.length) {
      container.innerHTML = '<div style="padding:30px 16px;text-align:center;color:var(--muted)">Nenhum grupo aberto no momento.</div>';
      return;
    }

    for (const g of grupos) {
      const vagas = g.max_membros - g.membros.length;
      const pct = Math.round((g.membros.length / g.max_membros) * 100);
      const views = getViews(g.codigo);
      const likes = await getLikes(g.codigo);
      const tempo = (() => {
        try {
          const diff = Math.floor((Date.now() - new Date(g.criado_em)) / 60000);
          if (diff < 1) return 'Agora';
          if (diff < 60) return diff + 'm';
          if (diff < 1440) return Math.floor(diff / 60) + 'h';
          return Math.floor(diff / 1440) + 'd';
        } catch { return ''; }
      })();

      const card = document.createElement('div');
      card.className = 'feed-grupo-card';
      card.setAttribute('data-codigo', g.codigo);
      card.onclick = () => abrirPreviewGrupo(g);
      card.innerHTML = `
        <div class="feed-avatar-x">
          ${g.foto_grupo ? `<img src="${escapeHtml(g.foto_grupo)}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">` : (g.nome||'G')[0].toUpperCase()}
        </div>
        <div class="feed-body-x">
          <div class="feed-header-x">
            <span class="feed-nome-x">${escapeHtml(g.nome)}</span>
            <span class="feed-handle-x">@${escapeHtml(g.criador?.nome||'').toLowerCase().replace(/\s+/g,'')}</span>
            <span class="feed-tempo-x">${tempo}</span>
          </div>
          <div class="feed-sub-x">${KixikilaManager.formatarValor(g.valor)} KZ · ${escapeHtml(g.periodicidade)}</div>
          <div class="feed-criador-x">por <span onclick="event.stopPropagation();abrirPerfilMembro('${escapeHtml(g.criador?.telefone||'')}')">${escapeHtml(g.criador?.nome||'')}</span></div>
          <div class="feed-progress-x"><div class="feed-progress-bar-x" style="width:${pct}%"></div></div>
          <div><span class="feed-vagas-x">${vagas} vaga${vagas!==1?'s':''} · ${g.membros.length}/${g.max_membros}</span></div>
          <div class="feed-acoes-x">
            <button class="feed-acao-x" onclick="event.stopPropagation()" title="Visualizações">
              ${SVG.eye} <span>${views}</span>
            </button>
            <button class="feed-acao-x like-btn" data-codigo="${g.codigo}" data-liked="false" onclick="event.stopPropagation();toggleLike('${g.codigo}', this)" title="Curtir">
              ${SVG.heart} <span class="like-count">${likes.count}</span>
            </button>
            <button class="feed-acao-x" onclick="event.stopPropagation();abrirComentarios('${g.codigo}','${escapeHtml(g.nome)}')" title="Comentar">
              ${SVG.comment} <span>Comentar</span>
            </button>
          </div>
        </div>`;
      container.appendChild(card);
    }
  } catch (e) {
    if (!silencioso) container.innerHTML = '<div style="padding:30px 16px;text-align:center;color:var(--muted)">Erro ao carregar grupos.</div>';
  }
}

// ════════════════════════════════════════════════════════════
// LIKES (COM API)
// ════════════════════════════════════════════════════════════

async function toggleLike(codigo, btnElement) {
  const sessao = KixikilaManager.getSessao();
  if (!sessao) { mostrarToast('Faça login para curtir'); return; }
  
  const liked = btnElement.getAttribute('data-liked') === 'true';
  const countSpan = btnElement.querySelector('.like-count');
  let currentCount = parseInt(countSpan.textContent);
  
  try {
    if (liked) {
      await KixikilaManager.removerLike(codigo, sessao.perfil.telefone);
      btnElement.setAttribute('data-liked', 'false');
      btnElement.innerHTML = SVG.heart + ` <span class="like-count">${currentCount - 1}</span>`;
      mostrarToast('Like removido');
    } else {
      await KixikilaManager.darLike(codigo, sessao.perfil.telefone);
      btnElement.setAttribute('data-liked', 'true');
      btnElement.innerHTML = SVG.heartOn + ` <span class="like-count">${currentCount + 1}</span>`;
      mostrarToast('Curtido');
    }
  } catch (e) {
    console.error('Erro no like:', e);
    mostrarToast('Erro ao processar like');
  }
}

// ════════════════════════════════════════════════════════════
// COMENTÁRIOS (COM API)
// ════════════════════════════════════════════════════════════

var _comentarioGrupoAtual = '';

async function abrirComentarios(codigo, nomeGrupo) {
  _comentarioGrupoAtual = codigo;
  document.getElementById('comentariosTitulo').textContent = 'Comentários · ' + nomeGrupo;
  await carregarComentariosUI(codigo);
  document.getElementById('modalComentarios').style.display = 'flex';
}

async function carregarComentariosUI(codigo) {
  const lista = document.getElementById('comentariosLista');
  if (!lista) return;
  
  try {
    const comentarios = await KixikilaManager.carregarComentarios(codigo);
    if (!comentarios.length) {
      lista.innerHTML = '<p style="text-align:center;color:var(--muted);padding:24px">Sem comentários ainda. Sê o primeiro!</p>';
      return;
    }
    lista.innerHTML = comentarios.map(c => `
      <div style="display:flex;gap:10px;padding:10px 0;border-bottom:1px solid var(--border)">
        <div style="width:32px;height:32px;border-radius:50%;background:var(--r-soft);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.8rem;color:var(--r);flex-shrink:0">
          ${escapeHtml((c.nome||'?')[0].toUpperCase())}
        </div>
        <div style="flex:1;min-width:0">
          <div style="font-size:.82rem;font-weight:600">${escapeHtml(c.nome)}</div>
          <div style="font-size:.88rem;margin-top:2px">${escapeHtml(c.texto)}</div>
          <div style="font-size:.72rem;color:var(--muted);margin-top:4px">${formatarTempo(c.data)}</div>
        </div>
      </div>`).join('');
  } catch (e) {
    lista.innerHTML = '<p style="text-align:center;color:var(--muted);padding:24px">Erro ao carregar comentários.</p>';
  }
}

function fecharComentarios() {
  document.getElementById('modalComentarios').style.display = 'none';
  document.getElementById('comentarioInput').value = '';
}

async function enviarComentario() {
  const input = document.getElementById('comentarioInput');
  const texto = input?.value.trim();
  if (!texto) return;
  
  const sessao = KixikilaManager.getSessao();
  if (!sessao) { mostrarToast('Faça login para comentar'); return; }
  
  try {
    await KixikilaManager.adicionarComentario(_comentarioGrupoAtual, sessao.perfil.telefone, sessao.perfil.nome, texto);
    input.value = '';
    await carregarComentariosUI(_comentarioGrupoAtual);
    mostrarToast('Comentário publicado');
  } catch (e) {
    mostrarToast('Erro ao publicar comentário');
  }
}

function formatarTempo(dataStr) {
  if (!dataStr) return 'agora';
  try {
    const diff = Math.floor((Date.now() - new Date(dataStr)) / 60000);
    if (diff < 1) return 'agora';
    if (diff < 60) return diff + 'm';
    if (diff < 1440) return Math.floor(diff / 60) + 'h';
    return Math.floor(diff / 1440) + 'd';
  } catch { return 'agora'; }
}

// ════════════════════════════════════════════════════════════
// NOTIFICAÇÕES
// ════════════════════════════════════════════════════════════

async function carregarNotificacoes() {
  try {
    const dados = await KixikilaManager.carregarNotificacoes();
    const naoLidas = dados.nao_lidas || 0;
    const dot = document.querySelector('.notif-dot');
    if (dot) dot.style.display = naoLidas > 0 ? 'block' : 'none';
    window._notificacoesCache = dados.notificacoes || [];
  } catch {}
}

function abrirNotificacoes() {
  const lista = window._notificacoesCache || [];
  document.getElementById('modalTitulo').textContent = 'Notificações';
  document.getElementById('modalMensagem').innerHTML = !lista.length
    ? '<p style="text-align:center;color:var(--muted);padding:16px">Sem notificações.</p>'
    : lista.map(n => `
      <div style="display:flex;gap:10px;padding:10px 0;border-bottom:1px solid var(--border)">
        <div style="width:8px;height:8px;border-radius:50%;background:${n.lida?'var(--border)':'var(--r)'};margin-top:6px"></div>
        <div style="flex:1;font-size:.87rem">${escapeHtml(n.mensagem)}</div>
      </div>`).join('');
  const btns = document.getElementById('modalBtns');
  btns.innerHTML = '';
  const ok = document.createElement('button');
  ok.className = 'btn-primary'; ok.textContent = 'Fechar'; ok.style.flex = '1';
  ok.onclick = fecharModal;
  btns.appendChild(ok);
  document.getElementById('modal').style.display = 'flex';
}

// ════════════════════════════════════════════════════════════
// MEUS GRUPOS
// ════════════════════════════════════════════════════════════

async function carregarMeusGruposDashboard(silencioso = false) {
  const container = document.getElementById('listaGrupos');
  const vazio = document.getElementById('dashVazio');
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
      const card = document.createElement('div');
      card.className = 'card-grupo';
      card.onclick = () => { _codigoGrupoAtual = g.codigo; mostrarPagina('VerGrupo'); carregarVerGrupo(g.codigo); };
      card.innerHTML = `
        <div class="card-grupo-icon">${(g.nome||'G')[0].toUpperCase()}</div>
        <div class="card-grupo-info">
          <h3>${escapeHtml(g.nome)}</h3>
          <div class="valor">${KixikilaManager.formatarValor(g.valor)} KZ · ${escapeHtml(g.periodicidade)}</div>
          <div class="info">${g.membros.length} membros · ${pagos} pagaram</div>
          <span class="pill ${cheio?'pill-cheio':'pill-aberto'}">${cheio?'Cheio':'Aberto'}</span>
        </div>
        <div class="card-grupo-seta">${SVG.chevron}</div>`;
      container.appendChild(card);
    }
  } catch {
    if (!silencioso) container.innerHTML = '<div style="padding:30px 16px;text-align:center;color:var(--muted)">Erro ao carregar grupos.</div>';
  }
}

// ════════════════════════════════════════════════════════════
// PREVIEW DO GRUPO (antes de entrar)
// ════════════════════════════════════════════════════════════

function abrirPreviewGrupo(g) {
  const perfil = KixikilaManager.getSessao()?.perfil;
  const eMembro = g.membros?.some(m => m.telefone === perfil?.telefone);
  const eCriador = g.criador?.telefone === perfil?.telefone;
  if (eMembro || eCriador) {
    _codigoGrupoAtual = g.codigo;
    mostrarPagina('VerGrupo');
    carregarVerGrupo(g.codigo);
    return;
  }
  const vagas = g.max_membros - g.membros.length;
  const pct = Math.round((g.membros.length / g.max_membros) * 100);
  document.getElementById('modalTitulo').textContent = g.nome;
  document.getElementById('modalMensagem').innerHTML = `
    <div style="font-size:.88rem;color:var(--muted);line-height:1.9">
      <div>💰 <strong style="color:var(--text)">${KixikilaManager.formatarValor(g.valor)} KZ</strong> · ${escapeHtml(g.periodicidade)}</div>
      <div>👤 Criador: <strong>${escapeHtml(g.criador?.nome||'')}</strong></div>
      <div>👥 ${g.membros.length}/${g.max_membros} membros · <strong style="color:var(--r)">${vagas} vaga${vagas!==1?'s':''}</strong></div>
      <div style="margin:10px 0 4px;background:var(--bg3);border-radius:8px;height:5px"><div style="width:${pct}%;height:100%;background:var(--r);border-radius:8px"></div></div>
      <div style="margin-top:12px;padding:10px;background:var(--bg3);border-radius:10px;font-size:.82rem">Entra no grupo para ver membros e detalhes.</div>
    </div>`;
  const btns = document.getElementById('modalBtns');
  btns.innerHTML = '';
  const cancel = document.createElement('button');
  cancel.className = 'btn-outline'; cancel.textContent = 'Fechar'; cancel.onclick = fecharModal;
  const entrar = document.createElement('button');
  entrar.className = 'btn-primary'; entrar.textContent = vagas <= 0 ? 'Grupo cheio' : 'Entrar';
  entrar.disabled = vagas <= 0;
  if (vagas <= 0) entrar.style.opacity = '0.5';
  entrar.onclick = () => {
    fecharModal();
    _codigoGrupoAtual = g.codigo;
    mostrarPagina('EntrarGrupo');
    const input = document.getElementById('entrarCodigo');
    if (input) input.value = g.codigo;
  };
  btns.appendChild(cancel); btns.appendChild(entrar);
  document.getElementById('modal').style.display = 'flex';
}

// ════════════════════════════════════════════════════════════
// CRIAR / ENTRAR GRUPO
// ════════════════════════════════════════════════════════════

function abrirCriarGrupo() { mostrarPagina('CriarGrupo'); }
function abrirEntrarGrupo() { mostrarPagina('EntrarGrupo'); }

async function criarGrupo() {
  const nome = document.getElementById('criarNome')?.value.trim() || '';
  const valor = parseFloat(document.getElementById('criarValor')?.value || 0);
  const frequencia = document.getElementById('criarFrequencia')?.value || 'mensal';
  const maxMembros = parseInt(document.getElementById('criarMax')?.value || 6);
  const perfil = KixikilaManager.getSessao()?.perfil;
  if (!perfil) { mostrarModal('Sessão expirada', 'Faz login novamente.'); return; }
  if (!nome || !valor || valor < 500) { mostrarModal('Dados inválidos', 'Preenche todos os campos. Valor mínimo 500 KZ.'); return; }
  try {
    const foto = getFotoGrupoTemp();
    const codigo = await KixikilaManager.criarGrupo({
      nome, telefone: perfil.telefone, nomeAdmin: perfil.nome || 'Admin',
      valor, frequencia, maxMembros, foto_grupo: foto
    });
    limparFotoGrupoTemp();
    mostrarModalConfirmar('Grupo criado!', 'Código: ' + codigo + '\n\nPartilha com os membros.',
      () => voltarDashboard(), 'OK',
      () => { window.open('https://wa.me/?text=' + encodeURIComponent('Entra no meu grupo Kixikila!\nCódigo: ' + codigo)); voltarDashboard(); });
  } catch (e) { mostrarModal('Erro', e.message); }
}

async function entrarGrupo() {
  const codigo = document.getElementById('entrarCodigo')?.value.trim().toUpperCase() || '';
  const perfil = KixikilaManager.getSessao()?.perfil;
  if (!perfil) { mostrarModal('Sessão expirada', 'Faz login novamente.'); return; }
  if (!codigo || codigo.length < 4) { mostrarModal('Código inválido', 'Insere o código correctamente.'); return; }
  try {
    await KixikilaManager.entrarGrupo(codigo, perfil.telefone, perfil.nome || 'Utilizador');
    mostrarToast('Entraste no grupo!');
    voltarDashboard();
  } catch (e) { mostrarModal('Erro', e.message); }
}

// ════════════════════════════════════════════════════════════
// VER GRUPO (detalhe)
// ════════════════════════════════════════════════════════════

async function carregarVerGrupo(codigo) {
  try {
    const grupo = await KixikilaManager.carregarGrupo(codigo);
    const perfil = KixikilaManager.getSessao()?.perfil;
    const eMembro = grupo.membros?.some(m => m.telefone === perfil?.telefone);
    const eCriador = grupo.criador?.telefone === perfil?.telefone;
    if (!eMembro && !eCriador) {
      mostrarPagina('Dashboard');
      abrirPreviewGrupo(grupo);
      return;
    }
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('verGrupoTitulo', grupo.nome);
    set('verGrupoValor', KixikilaManager.formatarValor(grupo.valor) + ' KZ / ' + grupo.periodicidade);
    set('verGrupoEstado', grupo.estado === 'aberto' ? 'Aberto — a aceitar membros' : 'Grupo completo');
    set('verGrupoCodigo', codigo);
    const membroAtual = grupo.membros.find(m => m.ordem === grupo.ordem_atual);
    set('verGrupoOrdem', membroAtual
      ? 'Ronda ' + grupo.ordem_atual + '/' + grupo.membros.length + ' — A receber: ' + membroAtual.nome
      : 'Ronda ' + (grupo.ordem_atual||1) + '/' + grupo.membros.length);
    const lista = document.getElementById('listaMembros');
    if (lista) {
      lista.innerHTML = '';
      grupo.membros.sort((a, b) => a.ordem - b.ordem).forEach(m => {
        const eAtual = m.ordem === grupo.ordem_atual;
        const eProprio = m.telefone === perfil?.telefone;
        const div = document.createElement('div');
        div.className = 'membro-card' + (eAtual ? ' atual' : '') + (eProprio ? ' proprio' : '');
        div.style.cursor = 'pointer';
        div.onclick = () => abrirPerfilMembro(m.telefone);
        div.innerHTML = `
          <div class="membro-avatar">${(m.nome?.[0]||'?').toUpperCase()}</div>
          <div class="membro-info">
            <h4>${escapeHtml(m.nome)}${eProprio ? ' <small style="color:var(--r)">tu</small>' : ''}</h4>
            <small>${escapeHtml(m.telefone)}${eAtual ? ' · A receber' : ''}</small>
          </div>
          <span class="membro-status ${m.pago?'status-pago':eAtual?'status-recebe':'status-pendente'}">
            ${m.pago?'PAGO':eAtual?'RECEBE':'PENDENTE'}
          </span>`;
        lista.appendChild(div);
      });
    }
  } catch { mostrarModal('Erro', 'Não foi possível carregar o grupo.'); }
}

async function registarPagamento() {
  const perfil = KixikilaManager.getSessao()?.perfil;
  if (!perfil) return;
  mostrarModalConfirmar('Confirmar pagamento', 'Confirmas que efectuaste o pagamento?', async () => {
    try {
      const res = await KixikilaManager.registarPagamento(_codigoGrupoAtual, perfil.telefone);
      if (res.todosPagaram) mostrarModal('Ronda concluída!', 'Todos pagaram! Nova ronda iniciada.');
      else mostrarToast('Pagamento registado!');
      carregarVerGrupo(_codigoGrupoAtual);
    } catch (e) { mostrarModal('Erro', e.message); }
  });
}

function copiarCodigo() {
  navigator.clipboard.writeText(_codigoGrupoAtual).then(() => mostrarToast('Código copiado!')).catch(() => mostrarToast('Erro ao copiar'));
}

function partilharGrupo() {
  window.open('https://wa.me/?text=' + encodeURIComponent('Entra no meu grupo Kixikila!\nCódigo: ' + _codigoGrupoAtual));
}

// ════════════════════════════════════════════════════════════
// CHAT (mensagens privadas do grupo)
// ════════════════════════════════════════════════════════════

function abrirChat() { mostrarPagina('Chat'); carregarChatGrupo(); }
function abrirMembrosChat() { voltarGrupo(); }

async function carregarChatGrupo() {
  try {
    const grupo = await KixikilaManager.carregarGrupo(_codigoGrupoAtual);
    const perfil = KixikilaManager.getSessao()?.perfil;
    const chatNome = document.getElementById('chatNomeGrupo');
    const chatMembros = document.getElementById('chatMembrosCount');
    if (chatNome) chatNome.textContent = grupo.nome;
    if (chatMembros) chatMembros.textContent = grupo.membros.length + ' membros';
    const container = document.getElementById('chatMensagens');
    const mensagens = grupo.mensagens || [];
    if (!container) return;
    if (!mensagens.length) {
      container.innerHTML = '<p style="text-align:center;color:var(--muted);padding:40px">Sem mensagens ainda.</p>';
      return;
    }
    container.innerHTML = '';
    for (const msg of mensagens) {
      const meu = msg.telefone === perfil?.telefone;
      const wrap = document.createElement('div');
      wrap.className = 'chat-balao-wrap ' + (meu ? 'meu' : 'outro');
      wrap.innerHTML = `
        ${!meu ? `<span class="chat-autor">${escapeHtml(msg.nome)}</span>` : ''}
        <div class="chat-balao ${meu?'meu':'outro'}">${escapeHtml(msg.texto)}</div>
        <span class="chat-data">${formatarTempo(msg.data)}</span>`;
      container.appendChild(wrap);
    }
    container.scrollTop = container.scrollHeight;
  } catch (e) { console.error('Erro chat:', e); }
}

async function enviarMensagem() {
  const input = document.getElementById('etMensagem');
  const texto = input?.value.trim();
  const perfil = KixikilaManager.getSessao()?.perfil;
  if (!texto || !perfil) return;
  input.value = '';
  try {
    await KixikilaManager.enviarMensagem(_codigoGrupoAtual, perfil.telefone, perfil.nome, texto);
    carregarChatGrupo();
  } catch { mostrarModal('Erro', 'Não foi possível enviar a mensagem.'); }
}

// ════════════════════════════════════════════════════════════
// AVALIAÇÃO (dentro do grupo)
// ════════════════════════════════════════════════════════════

function abrirAvaliacao() {
  KixikilaManager.carregarGrupo(_codigoGrupoAtual).then(grupo => {
    const perfil = KixikilaManager.getSessao()?.perfil;
    const outros = grupo.membros.filter(m => m.telefone !== perfil?.telefone);
    if (!outros.length) { mostrarModal('Sem membros', 'Não há outros membros para avaliar.'); return; }
    const sel = document.getElementById('selMembro');
    if (sel) sel.innerHTML = outros.map(m => `<option value="${escapeHtml(m.telefone)}">${escapeHtml(m.nome)}</option>`).join('');
    _estrelasAvaliacao = 0;
    const wrap = document.getElementById('estrelasWrap');
    if (wrap) {
      wrap.innerHTML = '';
      for (let i = 1; i <= 5; i++) {
        const btn = document.createElement('button');
        btn.className = 'estrela-btn'; btn.textContent = '★';
        btn.onclick = ((n) => () => { _estrelasAvaliacao = n; wrap.querySelectorAll('.estrela-btn').forEach((b,j) => b.classList.toggle('on', j<n)); })(i);
        wrap.appendChild(btn);
      }
    }
    document.getElementById('modalAvaliacao').style.display = 'flex';
  }).catch(() => mostrarModal('Erro', 'Não foi possível carregar membros.'));
}

function fecharModalAvaliacao() { document.getElementById('modalAvaliacao').style.display = 'none'; }

async function confirmarAvaliacao() {
  if (!_estrelasAvaliacao) { mostrarToast('Selecciona as estrelas'); return; }
  const perfil = KixikilaManager.getSessao()?.perfil;
  const avaliado = document.getElementById('selMembro')?.value;
  fecharModalAvaliacao();
  try {
    const rep = await KixikilaManager.avaliar(perfil.telefone, avaliado, _estrelasAvaliacao, '');
    mostrarModal('Avaliação guardada!', KixikilaManager.reputacaoEstrelas(rep) + ' — ' + KixikilaManager.reputacaoTexto(rep));
  } catch (e) { mostrarModal('Erro', e.message); }
}

// ════════════════════════════════════════════════════════════
// PERFIL (MEU)
// ════════════════════════════════════════════════════════════

function abrirPerfil() { mostrarPagina('Perfil'); carregarDadosPerfil(); }

function carregarDadosPerfil() {
  const perfil = KixikilaManager.getSessao()?.perfil;
  if (!perfil) return;
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('perfilNomeTexto', perfil.nome || 'Utilizador');
  set('perfilTopTitulo', perfil.nome || 'Perfil');
  set('perfilHandle', '@' + (perfil.nome||'u').toLowerCase().replace(/\s+/g,''));
  set('perfilReputacao', perfil.reputacao > 0
    ? KixikilaManager.reputacaoEstrelas(perfil.reputacao) + '  ' + KixikilaManager.reputacaoTexto(perfil.reputacao)
    : 'Sem avaliações');
  const editNome = document.getElementById('editNome');
  if (editNome) editNome.value = perfil.nome || '';
  const img = document.getElementById('perfilFotoImg');
  const letra = document.getElementById('perfilFotoLetra');
  if (perfil.foto_perfil && img) {
    img.src = perfil.foto_perfil; img.style.display = 'block';
    if (letra) letra.style.display = 'none';
  } else if (letra) {
    letra.textContent = (perfil.nome?.[0]||'K').toUpperCase();
    letra.style.display = 'flex';
    if (img) img.style.display = 'none';
  }
  KixikilaManager.carregarStats(perfil.telefone).then(s => {
    set('statGrupos', s.grupos_activos || 0);
    set('statAvaliacoes', s.total_avaliacoes || 0);
  }).catch(() => {});
  carregarMinhasAvaliacoes();
  desenharGrafico(perfil.reputacao || 0);
  lucide.createIcons();
}

function desenharGrafico(reputacao) {
  const canvas = document.getElementById('canvasReputacao');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.clientWidth;
  const h = 150;
  canvas.width = w; canvas.height = h;
  const pontos = [3.0, 3.5, 4.0, 3.8, 4.2, reputacao].filter(v => v > 0);
  if (pontos.length === 0) return;
  ctx.clearRect(0, 0, w, h);
  ctx.beginPath();
  ctx.strokeStyle = '#C0392B';
  ctx.lineWidth = 2.5;
  pontos.forEach((v, i) => {
    const x = 30 + (w - 60) * i / (pontos.length - 1);
    const y = h - 20 - (h - 40) * (v / 5);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
  pontos.forEach((v, i) => {
    const x = 30 + (w - 60) * i / (pontos.length - 1);
    const y = h - 20 - (h - 40) * (v / 5);
    ctx.beginPath();
    ctx.fillStyle = '#C0392B';
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.arc(x, y, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#C0392B';
    ctx.font = 'bold 10px Inter';
    ctx.textAlign = 'center';
    ctx.fillText(v.toFixed(1), x, y - 10);
  });
}

async function carregarMinhasAvaliacoes() {
  const container = document.getElementById('minhasAvaliacoesLista');
  if (!container) return;
  const perfil = KixikilaManager.getSessao()?.perfil;
  if (!perfil) return;
  try {
    const stats = await KixikilaManager.carregarStats(perfil.telefone);
    const total = stats.total_avaliacoes || 0;
    const rep = perfil.reputacao || 0;
    if (total === 0) {
      container.innerHTML = '<p style="color:var(--muted);text-align:center;padding:16px">Nenhuma avaliação recebida ainda.</p>';
      return;
    }
    container.innerHTML = `
      <div style="text-align:center;padding:12px;border-bottom:1px solid var(--border);margin-bottom:12px">
        <span style="font-size:28px;font-weight:800;color:var(--r)">${rep.toFixed(1)}</span>
        <span style="font-size:16px;margin-left:8px;color:#FBBF24">${KixikilaManager.reputacaoEstrelas(rep)}</span>
        <p style="font-size:12px;color:var(--muted);margin-top:4px">${KixikilaManager.reputacaoTexto(rep)} · ${total} avaliação${total!==1?'ões':''}</p>
      </div>`;
  } catch { container.innerHTML = '<p style="color:var(--muted);text-align:center;padding:16px">Erro ao carregar avaliações.</p>'; }
}

async function guardarPerfil() {
  const perfil = KixikilaManager.getSessao()?.perfil;
  if (!perfil) return;
  const nome = document.getElementById('editNome')?.value.trim() || '';
  const senha = document.getElementById('editSenha')?.value.trim() || '';
  if (!nome) { mostrarToast('O nome é obrigatório.'); return; }
  try {
    await KixikilaManager.atualizarPerfil({ telefone: perfil.telefone, nome, senha: senha || undefined });
    mostrarToast('Perfil actualizado!');
    carregarDadosPerfil();
  } catch (e) { mostrarModal('Erro', e.message); }
}

function toggleEditarPerfil() {
  const card = document.getElementById('perfEditarCard');
  if (card) card.style.display = card.style.display === 'none' ? 'block' : 'none';
}

async function confirmarEliminarConta() {
  const perfil = KixikilaManager.getSessao()?.perfil;
  if (!perfil) return;
  try {
    const stats = await KixikilaManager.carregarStats(perfil.telefone);
    if (stats.grupos_activos > 0) {
      mostrarModal('Não é possível eliminar', 'Ainda fazes parte de ' + stats.grupos_activos + ' grupo(s). Sai primeiro.');
      return;
    }
  } catch {}
  mostrarModalComInput('Eliminar Conta', 'Digita a tua senha para confirmar.', 'password', async (senha) => {
    try {
      await KixikilaManager.eliminarConta(perfil.telefone, senha);
      KixikilaManager.limparSessao();
      pararSync();
      mostrarModal('Conta eliminada', 'A tua conta foi removida.', () => mostrarPagina('Auth'));
    } catch (e) { mostrarModal('Erro', e.message); }
  });
}

// ════════════════════════════════════════════════════════════
// PERFIL DE MEMBRO
// ════════════════════════════════════════════════════════════

async function abrirPerfilMembro(telefone) {
  mostrarPagina('PerfilMembro');
  const container = document.getElementById('perfilMembroConteudo');
  if (!container) return;
  container.innerHTML = '<p style="text-align:center;padding:40px;color:var(--muted)">A carregar...</p>';
  try {
    const perfil = await KixikilaManager.carregarReputacao(telefone);
    const stats = await KixikilaManager.carregarStats(telefone).catch(() => ({}));
    const avaliacoes = await KixikilaManager.carregarAvaliacoesRecebidas(telefone).catch(() => []);
    const estrelas = KixikilaManager.reputacaoEstrelas(perfil.reputacao || 0);
    const texto = KixikilaManager.reputacaoTexto(perfil.reputacao || 0);
    container.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;text-align:center;padding:28px 20px 20px;border-bottom:1px solid var(--border)">
        ${perfil.foto_perfil
          ? `<img src="${escapeHtml(perfil.foto_perfil)}" style="width:80px;height:80px;border-radius:50%;object-fit:cover;border:3px solid var(--r);margin-bottom:8px">`
          : `<div style="width:80px;height:80px;border-radius:50%;background:var(--r-soft);color:var(--r);font-size:2rem;font-weight:800;display:flex;align-items:center;justify-content:center;border:3px solid var(--r);margin-bottom:8px">${(perfil.nome||'U')[0].toUpperCase()}</div>`}
        <h3 style="font-size:1.35rem;font-weight:800">${escapeHtml(perfil.nome||'Utilizador')}</h3>
        <p style="font-size:.85rem;color:var(--muted)">${escapeHtml(perfil.telefone||telefone)}</p>
        <p style="font-size:1rem;color:var(--r);font-weight:700">${estrelas} ${texto}</p>
      </div>
      <div style="display:flex;border-bottom:1px solid var(--border)">
        <div style="flex:1;text-align:center;padding:16px;border-right:1px solid var(--border)">
          <span style="display:block;font-size:1.5rem;font-weight:800;color:var(--r)">${perfil.grupos_concluidos||0}</span>
          <label style="font-size:.73rem;color:var(--muted)">Grupos</label>
        </div>
        <div style="flex:1;text-align:center;padding:16px">
          <span style="display:block;font-size:1.5rem;font-weight:800;color:var(--r)">${avaliacoes.length||perfil.total_avaliacoes||0}</span>
          <label style="font-size:.73rem;color:var(--muted)">Avaliações</label>
        </div>
      </div>
      ${gerarGraficoMembro(avaliacoes)}
      <div style="padding:16px;border-bottom:1px solid var(--border)">
        <button onclick="abrirAvaliacaoDireta('${escapeHtml(telefone)}','${escapeHtml(perfil.nome||'')}')"
          style="width:100%;padding:13px;background:var(--r);color:white;border:none;border-radius:99px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px">
          Avaliar este membro
        </button>
      </div>
      <div><div style="font-size:.65rem;font-weight:800;letter-spacing:1px;padding:14px 16px 8px;color:var(--muted)">Avaliações recentes</div>
      ${renderAvaliacoesLista(avaliacoes)}</div>`;
  } catch { container.innerHTML = '<p style="text-align:center;padding:40px;color:var(--muted)">Erro ao carregar perfil.</p>'; }
}

function gerarGraficoMembro(avaliacoes) {
  if (!avaliacoes || avaliacoes.length < 2) return '';
  const pontos = avaliacoes.slice(-8).map(a => Math.min(5, Math.max(0, Number(a.estrelas) || 0)));
  const w = 300, h = 60, pad = 8;
  const stepX = (w - pad*2) / Math.max(pontos.length - 1, 1);
  const toY = v => h - pad - (v/5) * (h - pad*2);
  const pts = pontos.map((v,i) => `${pad+i*stepX},${toY(v)}`).join(' ');
  const area = `M${pad},${h} L${pad},${toY(pontos[0])} ${pontos.map((v,i)=>`L${pad+i*stepX},${toY(v)}`).join(' ')} L${pad+(pontos.length-1)*stepX},${h} Z`;
  return `<div style="padding:14px 16px;border-bottom:1px solid var(--border)">
    <div style="font-size:.65rem;font-weight:800;color:var(--muted);margin-bottom:10px">Evolução da reputação</div>
    <svg width="100%" height="${h}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
      <defs><linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="var(--r)" stop-opacity=".2"/>
        <stop offset="100%" stop-color="var(--r)" stop-opacity="0"/>
      </linearGradient></defs>
      <path d="${area}" fill="url(#rg)"/>
      <polyline points="${pts}" fill="none" stroke="var(--r)" stroke-width="2.5"/>
      ${pontos.map((v,i)=>`<circle cx="${pad+i*stepX}" cy="${toY(v)}" r="4" fill="var(--r)" stroke="var(--bg)" stroke-width="2"/>`).join('')}
    </svg>
  </div>`;
}

function renderAvaliacoesLista(avaliacoes) {
  if (!avaliacoes?.length) return '<p style="color:var(--muted);font-size:.85rem;text-align:center;padding:20px">Sem avaliações ainda.</p>';
  return avaliacoes.slice(0,10).map(a => {
    const n = Math.min(5, Math.max(0, Number(a.estrelas)||0));
    return `<div style="display:flex;gap:12px;padding:12px 16px;border-bottom:1px solid var(--border)">
      <div style="width:36px;height:36px;border-radius:50%;background:var(--r-soft);color:var(--r);font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0">${escapeHtml((a.nome||a.avaliador||'?')[0].toUpperCase())}</div>
      <div style="flex:1;min-width:0">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:3px">
          <span style="font-size:.88rem;font-weight:700">${escapeHtml(a.nome||a.avaliador||'Utilizador')}</span>
          <span style="color:#FBBF24;font-size:.85rem">${'★'.repeat(n)}${'☆'.repeat(5-n)}</span>
        </div>
        ${a.comentario?`<div style="font-size:.84rem;color:var(--muted)">${escapeHtml(a.comentario)}</div>`:''}
      </div>
    </div>`;
  }).join('');
}

// ════════════════════════════════════════════════════════════
// AVALIAÇÃO DIRECTA
// ════════════════════════════════════════════════════════════

function abrirAvaliacaoDireta(telefone, nome) {
  _telefoneAvaliacaoDireta = telefone;
  _nomeAvaliacaoDireta = nome;
  document.getElementById('avalDiretaNome').textContent = nome;
  _estrelasAvaliacao = 0;
  const wrap = document.getElementById('estrelasWrapDireta');
  if (!wrap) return;
  wrap.innerHTML = '';
  for (let i = 1; i <= 5; i++) {
    const btn = document.createElement('button');
    btn.className = 'estrela-btn'; btn.textContent = '★';
    btn.onclick = ((n) => () => { _estrelasAvaliacao = n; wrap.querySelectorAll('.estrela-btn').forEach((b,j) => b.classList.toggle('on', j<n)); })(i);
    wrap.appendChild(btn);
  }
  document.getElementById('overlayAvaliacaoDireta').style.display = 'flex';
}

function fecharAvaliacaoDireta() {
  document.getElementById('overlayAvaliacaoDireta').style.display = 'none';
  _estrelasAvaliacao = 0;
  document.getElementById('comentarioAvaliacao').value = '';
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

// ════════════════════════════════════════════════════════════
// SCROLL TO TOP
// ════════════════════════════════════════════════════════════

function configurarScrollToTop() {
  const btn = document.getElementById('scrollTopBtn');
  const container = document.querySelector('.dashboard-content');
  if (!btn || !container) return;
  container.addEventListener('scroll', () => btn.classList.toggle('show', container.scrollTop > 300));
  btn.onclick = () => container.scrollTo({ top: 0, behavior: 'smooth' });
}

// ════════════════════════════════════════════════════════════
// INICIALIZAÇÃO
// ════════════════════════════════════════════════════════════

function setPerfTab(tab) {
  ['pub','grupos','aval'].forEach(t => {
    const el = document.getElementById('ptab' + t.charAt(0).toUpperCase() + t.slice(1));
    if (el) el.classList.remove('activo');
  });
  document.getElementById('ptab' + tab.charAt(0).toUpperCase() + tab.slice(1))?.classList.add('activo');
}

(function init() {
  try {
    const guardado = localStorage.getItem('kx_sessao');
    if (guardado) {
      KixikilaManager.setSessao(JSON.parse(guardado));
      mostrarPagina('Dashboard');
      setTimeout(carregarNotificacoes, 1000);
      return;
    }
  } catch {}
  mostrarPagina('Auth');
  lucide.createIcons();
  configurarScrollToTop();
})();

// Event listeners dos modais
document.getElementById('openPostModal')?.addEventListener('click', () => document.getElementById('postModal').classList.add('active'));
document.getElementById('closeModalBtn')?.addEventListener('click', () => document.getElementById('postModal').classList.remove('active'));
document.getElementById('postModal')?.addEventListener('click', (e) => { if (e.target === e.currentTarget) e.currentTarget.classList.remove('active'); });
document.getElementById('modalComentarios')?.addEventListener('click', (e) => { if (e.target === e.currentTarget) fecharComentarios(); });
document.getElementById('comentarioEnviarBtn')?.addEventListener('click', enviarComentario);
document.getElementById('comentarioInput')?.addEventListener('keypress', (e) => { if (e.key === 'Enter') enviarComentario(); });

// Funções globais
window.abrirPerfilMembro = abrirPerfilMembro;
window.toggleLike = toggleLike;
window.abrirComentarios = abrirComentarios;
window.fecharComentarios = fecharComentarios;
window.enviarComentario = enviarComentario;
window.abrirAvaliacaoDireta = abrirAvaliacaoDireta;
window.fecharAvaliacaoDireta = fecharAvaliacaoDireta;
window.confirmarAvaliacaoDireta = confirmarAvaliacaoDireta;
window.mostrarTab = mostrarTab;
window.previewFoto = previewFoto;
window.previewFotoGrupo = previewFotoGrupo;
window.registar = registar;
window.entrar = entrar;
window.logout = logout;
window.verificarScrollTermos = verificarScrollTermos;
window.atualizarBotaoCriar = atualizarBotaoCriar;
window.mostrarTabDashboard = mostrarTabDashboard;
window.setNavActivo = setNavActivo;
window.abrirCriarGrupo = abrirCriarGrupo;
window.abrirEntrarGrupo = abrirEntrarGrupo;
window.criarGrupo = criarGrupo;
window.entrarGrupo = entrarGrupo;
window.abrirPerfil = abrirPerfil;
window.guardarPerfil = guardarPerfil;
window.toggleEditarPerfil = toggleEditarPerfil;
window.confirmarEliminarConta = confirmarEliminarConta;
window.setPerfTab = setPerfTab;
window.abrirNotificacoes = abrirNotificacoes;
window.abrirAvaliacao = abrirAvaliacao;
window.fecharModalAvaliacao = fecharModalAvaliacao;
window.confirmarAvaliacao = confirmarAvaliacao;
window.registarPagamento = registarPagamento;
window.copiarCodigo = copiarCodigo;
window.partilharGrupo = partilharGrupo;
window.abrirChat = abrirChat;
window.abrirMembrosChat = abrirMembrosChat;
window.enviarMensagem = enviarMensagem;
window.carregarChatGrupo = carregarChatGrupo;
window.carregarVerGrupo = carregarVerGrupo;
window.voltarGrupo = voltarGrupo;
window.voltarDashboard = voltarDashboard;
window.fecharModal = fecharModal;
window.mostrarModal = mostrarModal;
window.mostrarModalConfirmar = mostrarModalConfirmar;