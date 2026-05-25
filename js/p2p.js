// ════════════════════════════════════════════════════════════
// p2p.js — Posts sociais (comunidade)
// ════════════════════════════════════════════════════════════

var _postAtual = null;

// ── CARREGAR FEED P2P ────────────────────────────────────────
async function carregarFeedP2P() {
  const container = document.getElementById('postsLista');
  if (!container) return;
  
  container.innerHTML = '<div class="loading-skeleton">A carregar publicações...</div>';
  
  try {
    const posts = await KixikilaManager.carregarPostsP2P();
    
    if (!posts || posts.length === 0) {
      container.innerHTML = '<div class="vazio"><p>Nenhuma publicação ainda.</p><button class="btn-primary" onclick="abrirModalPost()" style="margin-top:12px">Publicar agora</button></div>';
      if (typeof lucide !== 'undefined') lucide.createIcons();
      return;
    }
    
    container.innerHTML = '';
    posts.forEach(post => {
      container.appendChild(criarCardPost(post));
    });
    
    if (typeof lucide !== 'undefined') lucide.createIcons();
  } catch (e) {
    console.error(e);
    container.innerHTML = '<div class="vazio"><p>Erro ao carregar publicações.</p></div>';
  }
}

function criarCardPost(post) {
  const div = document.createElement('div');
  div.className = 'post-card';
  div.dataset.id = post.id;
  
  const perfil = KixikilaManager.getSessao()?.perfil;
  const liked = post.likes?.some(l => l.telefone === perfil?.telefone) || false;
  const dataFormatada = formatarData(post.data);
  
  div.innerHTML = `
    <div class="post-header" onclick="abrirPerfilDoAutor('${post.autor.telefone}')">
      <div class="post-avatar" style="background-image:${post.autor.foto_perfil ? `url('${post.autor.foto_perfil}')` : 'none'}">
        ${!post.autor.foto_perfil ? (post.autor.nome?.[0] || 'U').toUpperCase() : ''}
      </div>
      <div>
        <div class="post-autor">${escapeHtml(post.autor.nome)}</div>
        <div class="post-data">${dataFormatada}</div>
      </div>
    </div>
    <div class="post-texto">${escapeHtml(post.texto)}</div>
    <div class="post-acoes">
      <button class="post-acao ${liked ? 'liked' : ''}" onclick="event.stopPropagation(); toggleLike('${post.id}', this)">
        <i data-lucide="heart"></i>
        <span class="like-count">${post.likes_count || 0}</span>
      </button>
      <button class="post-acao" onclick="event.stopPropagation(); abrirComentarios('${post.id}', '${escapeHtml(post.autor.nome)}')">
        <i data-lucide="message-circle"></i>
        <span>${post.comentarios_count || 0}</span>
      </button>
    </div>
  `;
  
  return div;
}

// ── CRIAR POST ───────────────────────────────────────────────
function abrirModalPost() {
  const textarea = document.getElementById('postTexto');
  if (textarea) textarea.value = '';
  const modal = document.getElementById('modalPost');
  if (modal) modal.style.display = 'flex';
}

async function criarPost() {
  const textoInput = document.getElementById('postTexto');
  const texto = textoInput?.value?.trim();
  
  if (!texto) { mostrarToast('Escreve algo para publicar'); return; }
  if (texto.length > 500) { mostrarToast('Máximo 500 caracteres'); return; }
  
  const perfil = KixikilaManager.getSessao()?.perfil;
  if (!perfil) { mostrarToast('Faça login primeiro'); return; }
  
  try {
    await KixikilaManager.criarPostP2P(texto);
    fecharModalP2P('modalPost');
    mostrarToast('Publicação criada!');
    carregarFeedP2P();
  } catch (e) { mostrarToast(e.message); }
}

// ── LIKES ────────────────────────────────────────────────────
async function toggleLike(postId, btnElement) {
  if (!btnElement) return;
  const perfil = KixikilaManager.getSessao()?.perfil;
  if (!perfil) { mostrarToast('Faça login primeiro'); return; }
  
  const liked = btnElement.classList.contains('liked');
  const countSpan = btnElement.querySelector('.like-count');
  if (!countSpan) return;
  
  let currentCount = parseInt(countSpan.textContent) || 0;
  
  try {
    if (liked) {
      await KixikilaManager.removerLikeP2P(postId);
      btnElement.classList.remove('liked');
      countSpan.textContent = currentCount - 1;
    } else {
      await KixikilaManager.darLikeP2P(postId);
      btnElement.classList.add('liked');
      countSpan.textContent = currentCount + 1;
    }
  } catch (e) { mostrarToast(e.message); }
}

// ── COMENTÁRIOS ──────────────────────────────────────────────
async function abrirComentarios(postId, autorNome) {
  _postAtual = postId;
  const titulo = document.getElementById('comentariosTituloP2P');
  if (titulo) titulo.textContent = 'Comentários · ' + autorNome;
  await carregarComentarios(postId);
  const modal = document.getElementById('modalComentariosP2P');
  if (modal) modal.style.display = 'flex';
}

async function carregarComentarios(postId) {
  const container = document.getElementById('comentariosListaP2P');
  if (!container) return;
  container.innerHTML = '<div style="text-align:center;padding:20px;color:var(--muted)">A carregar...</div>';
  
  try {
    const comentarios = await KixikilaManager.carregarComentariosP2P(postId);
    
    if (!comentarios || comentarios.length === 0) {
      container.innerHTML = '<div style="text-align:center;padding:20px;color:var(--muted)">Sem comentários ainda.</div>';
      return;
    }
    
    container.innerHTML = '';
    comentarios.forEach(com => {
      const div = document.createElement('div');
      div.className = 'comentario-item';
      div.innerHTML = `
        <div class="comentario-avatar" style="background-image:${com.autor.foto_perfil ? `url('${com.autor.foto_perfil}')` : 'none'}">
          ${!com.autor.foto_perfil ? (com.autor.nome?.[0] || 'U').toUpperCase() : ''}
        </div>
        <div class="comentario-conteudo">
          <div class="comentario-autor">${escapeHtml(com.autor.nome)}</div>
          <div class="comentario-texto">${escapeHtml(com.texto)}</div>
          <div class="comentario-data">${formatarData(com.data)}</div>
        </div>
      `;
      container.appendChild(div);
    });
  } catch (e) {
    container.innerHTML = '<div style="text-align:center;padding:20px;color:var(--muted)">Erro ao carregar comentários.</div>';
  }
}

async function enviarComentario() {
  const textoInput = document.getElementById('comentarioTexto');
  const texto = textoInput?.value?.trim();
  if (!texto) { mostrarToast('Escreve um comentário'); return; }
  if (!_postAtual) return;
  
  const perfil = KixikilaManager.getSessao()?.perfil;
  if (!perfil) { mostrarToast('Faça login primeiro'); return; }
  
  try {
    await KixikilaManager.adicionarComentarioP2P(_postAtual, texto);
    if (textoInput) textoInput.value = '';
    await carregarComentarios(_postAtual);
    carregarFeedP2P();
  } catch (e) { mostrarToast(e.message); }
}

// ── ABRIR PERFIL DO AUTOR ────────────────────────────────────
function abrirPerfilDoAutor(telefone) {
  // abre perfil em nova página por enquanto
  // podes expandir depois
  mostrarToast('Perfil: ' + telefone);
}

// Actualizar avatar do topo
function atualizarAvatarP2P() {
  const perfil = KixikilaManager.getSessao()?.perfil;
  if (!perfil) return;
  const av = document.getElementById('topAvatar');
  if (!av) return;
  if (perfil.foto_perfil) {
    av.style.backgroundImage    = `url(${perfil.foto_perfil})`;
    av.style.backgroundSize     = 'cover';
    av.style.backgroundPosition = 'center';
    av.textContent = '';
  } else {
    av.style.backgroundImage = '';
    av.textContent = (perfil.nome?.[0] || 'K').toUpperCase();
  }
}

// Iniciar
atualizarAvatarP2P();
carregarFeedP2P();

// ── UTILITÁRIOS ──────────────────────────────────────────────
function formatarData(dataStr) {
  if (!dataStr) return '';
  try {
    const data = new Date(dataStr);
    const agora = new Date();
    const diff = Math.floor((agora - data) / 60000);
    if (diff < 1) return 'agora';
    if (diff < 60) return diff + 'm';
    if (diff < 1440) return Math.floor(diff / 60) + 'h';
    return data.toLocaleDateString('pt-AO');
  } catch { return ''; }
}

function escapeHtml(t) {
  if (!t) return '';
  const div = document.createElement('div');
  div.textContent = t;
  return div.innerHTML;
}

function mostrarToast(msg) {
  const toastEl = document.getElementById('toast');
  if (!toastEl) return;
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  setTimeout(() => toastEl.classList.remove('show'), 2600);
}

function fecharModalP2P(id) {
  const modal = document.getElementById(id);
  if (modal) modal.style.display = 'none';
}

// ── INICIAR ──────────────────────────────────────────────────
(function initP2P() {
  carregarFeedP2P();
  if (typeof lucide !== 'undefined') lucide.createIcons();
})();
