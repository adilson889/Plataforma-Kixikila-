// ── COMPRESSÃO DE IMAGEM ──────────────────────────────────────
function comprimirImagem(dataURL, maxWidth, qualidade) {
  return new Promise(resolve => {
    const img    = new Image();
    img.onload   = () => {
      const ratio  = Math.min(maxWidth / img.width, maxWidth / img.height, 1);
      const canvas = document.createElement('canvas');
      canvas.width  = img.width  * ratio;
      canvas.height = img.height * ratio;
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', qualidade));
    };
    img.src = dataURL;
  });
}

// ── PREVIEW DE FOTO ───────────────────────────────────────────
function previewFoto(origem, evento) {
  const ficheiro = evento.target.files[0];
  if (!ficheiro) return;
  const leitor   = new FileReader();
  leitor.onload  = async (e) => {
    const comprimida = await comprimirImagem(e.target.result, 400, 0.7);
    if (origem === 'Registo') {
      const img         = document.getElementById('previewFotoRegisto');
      const placeholder = document.getElementById('fotoPlaceholderRegisto');
      img.src           = comprimida;
      img.style.display = 'block';
      if (placeholder) placeholder.style.display = 'none';
      window._fotoTemp  = comprimida;
    } else {
      const img               = document.getElementById('perfilFotoImg');
      const letra             = document.getElementById('perfilFotoLetra');
      img.src                 = comprimida;
      img.style.display       = 'block';
      letra.style.display     = 'none';
      window._fotoPerfilTemp  = comprimida;
    }
  };
  leitor.readAsDataURL(ficheiro);
}

// ── MEU PERFIL ────────────────────────────────────────────────
function abrirPerfil() {
  mostrarPagina('Perfil');
  carregarDadosPerfil();
}

function carregarDadosPerfil() {
  const perfil = KixikilaManager.getSessao()?.perfil;
  if (!perfil) return;

  document.getElementById('perfilNome').textContent     = perfil.nome || '';
  document.getElementById('perfilTelefone').textContent = perfil.telefone || '';
  document.getElementById('editNome').value             = perfil.nome || '';

  const rep = document.getElementById('perfilReputacao');
  rep.textContent = perfil.reputacao
    ? KixikilaManager.reputacaoEstrelas(perfil.reputacao) + '  ' + KixikilaManager.reputacaoTexto(perfil.reputacao)
    : 'Sem avaliações';

  document.getElementById('statAvaliacoes').textContent = (perfil.avaliacoes || []).length;

  const img   = document.getElementById('perfilFotoImg');
  const letra = document.getElementById('perfilFotoLetra');
  if (perfil.foto_perfil) {
    img.src             = perfil.foto_perfil;
    img.style.display   = 'block';
    letra.style.display = 'none';
  } else {
    letra.textContent   = (perfil.nome?.[0] || 'K').toUpperCase();
    letra.style.display = 'flex';
    img.style.display   = 'none';
  }

  KixikilaManager.carregarMeusGrupos()
    .then(grupos => { document.getElementById('statGrupos').textContent = grupos.length; })
    .catch(() => {});
}

async function guardarPerfil() {
  const nome  = document.getElementById('editNome').value.trim();
  const senha = document.getElementById('editSenha').value.trim();
  if (!nome) { mostrarModal('Campo obrigatório', 'O nome não pode estar vazio.'); return; }

  const perfil      = KixikilaManager.getSessao()?.perfil;
  const foto_perfil = window._fotoPerfilTemp || perfil?.foto_perfil || '';

  try {
    await KixikilaManager.atualizarPerfil({
      telefone: perfil.telefone, nome,
      genero:   perfil.genero || 'M',
      cor:      perfil.cor    || '#8B0000',
      foto_perfil,
      senha:    senha || undefined
    });
    window._fotoPerfilTemp = null;
    mostrarToast('Perfil actualizado!');
    voltarDashboard();
  } catch (e) {
    mostrarModal('Erro', e.message);
  }
}

// ── PERFIL DE MEMBRO ──────────────────────────────────────────
var _membroAtual = null;

async function abrirPerfilMembro(telefone) {
  mostrarPagina('PerfilMembro');
  const loading = document.getElementById('perfilMembroConteudo');
  loading.innerHTML = '<p style="text-align:center;color:var(--muted);padding:60px 20px">A carregar...</p>';

  try {
    const membro   = await KixikilaManager.carregarPerfil(telefone);
    _membroAtual   = membro;
    const meuPerfil = KixikilaManager.getSessao()?.perfil;
    const eProprio  = membro.telefone === meuPerfil?.telefone;

    const fotoHTML = membro.foto_perfil
      ? `<img src="${membro.foto_perfil}" class="membro-perfil-foto">`
      : `<div class="membro-perfil-letra">${(membro.nome?.[0] || '?').toUpperCase()}</div>`;

    const avaliacoes = membro.avaliacoes || [];
    const jaAvaliou  = avaliacoes.some(a => a.avaliador === meuPerfil?.telefone);

    // Dados para o gráfico — últimas 6 avaliações com média acumulada
    const pontos = avaliacoes.map((_, i) => {
      const slice = avaliacoes.slice(0, i + 1);
      return (slice.reduce((s, a) => s + a.estrelas, 0) / slice.length).toFixed(1);
    });

    const graficoHTML = pontos.length >= 2 ? `
      <div class="grafico-wrap">
        <p class="grafico-titulo">Evolução da reputação</p>
        <canvas id="graficoRep" height="80"></canvas>
      </div>` : '';

    loading.innerHTML = `
      <div class="membro-perfil-topo">
        ${fotoHTML}
        <h2 class="membro-perfil-nome">${membro.nome}</h2>
        <p class="membro-perfil-tel">${membro.telefone}</p>
        <div class="membro-perfil-rep">
          ${membro.reputacao
            ? KixikilaManager.reputacaoEstrelas(membro.reputacao) + ' ' + membro.reputacao + ' — ' + KixikilaManager.reputacaoTexto(membro.reputacao)
            : 'Sem avaliações ainda'}
        </div>
      </div>

      <div class="membro-perfil-stats">
        <div class="stat-box">
          <span>${avaliacoes.length}</span>
          <label>Avaliações</label>
        </div>
        <div class="stat-box">
          <span>${(membro.grupos || []).length}</span>
          <label>Grupos</label>
        </div>
        <div class="stat-box">
          <span>${membro.reputacao || 0}</span>
          <label>Pontuação</label>
        </div>
      </div>

      ${graficoHTML}

      ${!eProprio ? `
        <div class="membro-perfil-acoes">
          ${jaAvaliou
            ? `<button class="btn-confiar btn-confiar-done" disabled>Já avaliaste este membro</button>`
            : `<button class="btn-confiar" onclick="abrirAvaliacaoDireta()">
                <i data-lucide="star"></i> Confiar — Avaliar membro
               </button>`}
        </div>` : ''}

      ${avaliacoes.length ? `
        <div class="avaliacoes-lista">
          <p class="secao-label-pequena">Avaliações recebidas</p>
          ${avaliacoes.slice().reverse().slice(0, 5).map(a => `
            <div class="avaliacao-item">
              <div class="avaliacao-estrelas">${'★'.repeat(a.estrelas)}${'☆'.repeat(5 - a.estrelas)}</div>
              <p class="avaliacao-comentario">${a.comentario || 'Sem comentário'}</p>
              <small class="avaliacao-data">${(a.data || '').slice(0, 10)}</small>
            </div>`).join('')}
        </div>` : ''}`;

    lucide.createIcons();

    // Desenhar gráfico com Canvas
    if (pontos.length >= 2) {
      setTimeout(() => desenharGrafico(pontos), 50);
    }
  } catch (e) {
    loading.innerHTML = '<p style="text-align:center;color:var(--muted);padding:60px">Erro ao carregar perfil.</p>';
  }
}

function desenharGrafico(pontos) {
  const canvas = document.getElementById('graficoRep');
  if (!canvas) return;
  const ctx    = canvas.getContext('2d');
  canvas.width = canvas.parentElement.offsetWidth - 32;

  const W = canvas.width, H = canvas.height;
  const pad = 10;
  const max = 5, min = 0;

  ctx.clearRect(0, 0, W, H);

  // Grade
  ctx.strokeStyle = 'rgba(139,0,0,0.08)';
  ctx.lineWidth   = 1;
  [1,2,3,4,5].forEach(v => {
    const y = H - pad - ((v - min) / (max - min)) * (H - pad * 2);
    ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(W - pad, y); ctx.stroke();
  });

  const stepX = (W - pad * 2) / (pontos.length - 1);

  // Linha
  ctx.beginPath();
  ctx.strokeStyle = '#8B0000';
  ctx.lineWidth   = 2.5;
  ctx.lineJoin    = 'round';
  pontos.forEach((v, i) => {
    const x = pad + i * stepX;
    const y = H - pad - ((v - min) / (max - min)) * (H - pad * 2);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.stroke();

  // Pontos
  pontos.forEach((v, i) => {
    const x = pad + i * stepX;
    const y = H - pad - ((v - min) / (max - min)) * (H - pad * 2);
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fillStyle   = '#8B0000';
    ctx.fill();
    ctx.fillStyle   = '#333';
    ctx.font        = '10px DM Sans';
    ctx.fillText(v, x - 6, y - 8);
  });
}

// ── AVALIAÇÃO DIRECTA ─────────────────────────────────────────
var _estrelasAvaliacaoDireta = 0;

function abrirAvaliacaoDireta() {
  if (!_membroAtual) return;
  const overlay = document.getElementById('overlayAvaliacaoDireta');
  document.getElementById('avalDiretaNome').textContent = _membroAtual.nome;
  _estrelasAvaliacaoDireta = 0;

  const wrap = document.getElementById('estrelasWrapDireta');
  wrap.innerHTML = '';
  [1,2,3,4,5].forEach(n => {
    const btn       = document.createElement('button');
    btn.className   = 'estrela-btn';
    btn.textContent = '★';
    btn.onclick     = () => {
      _estrelasAvaliacaoDireta = n;
      wrap.querySelectorAll('.estrela-btn').forEach((b, i) => b.classList.toggle('on', i < n));
    };
    wrap.appendChild(btn);
  });
  overlay.style.display = 'flex';
}

function fecharAvaliacaoDireta() {
  document.getElementById('overlayAvaliacaoDireta').style.display = 'none';
}

async function confirmarAvaliacaoDireta() {
  if (!_estrelasAvaliacaoDireta) { mostrarToast('Selecciona as estrelas'); return; }
  const meuPerfil = KixikilaManager.getSessao()?.perfil;
  const comentario = document.getElementById('comentarioAvaliacao').value.trim();
  fecharAvaliacaoDireta();
  try {
    const rep = await KixikilaManager.avaliar(
      meuPerfil.telefone, _membroAtual.telefone, _estrelasAvaliacaoDireta, comentario
    );
    mostrarToast('Avaliação enviada!');
    abrirPerfilMembro(_membroAtual.telefone); // recarregar
  } catch (e) {
    mostrarModal('Erro', e.message);
  }
}