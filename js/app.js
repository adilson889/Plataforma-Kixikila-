var _paginaAnterior    = '';
var _estrelasAvaliacao = 0;

function mostrarPagina(nome) {
  _paginaAnterior = document.querySelector('.pagina:not([style*="display:none"])')?.id?.replace('pagina','') || '';
  document.querySelectorAll('.pagina').forEach(p => p.style.display = 'none');
  const pagina = document.getElementById('pagina' + nome);
  if (pagina) pagina.style.display = 'flex';
  lucide.createIcons();
  if (nome === 'Dashboard') carregarDashboard();
  // Guardar página actual para o Back do Android
  history.pushState({ pagina: nome }, '', '#' + nome);
}

function voltarDashboard() { mostrarPagina('Dashboard'); }

// Back nativo do Android
window.addEventListener('popstate', (e) => {
  const pagina = e.state?.pagina;
  if (!pagina || pagina === 'Auth') {
    const sessao = KixikilaManager.getSessao();
    if (sessao) {
      mostrarPagina('Dashboard');
    } else {
      mostrarPagina('Auth');
    }
  } else {
    document.querySelectorAll('.pagina').forEach(p => p.style.display = 'none');
    const el = document.getElementById('pagina' + pagina);
    if (el) el.style.display = 'flex';
    lucide.createIcons();
  }
});

function mostrarModal(titulo, mensagem, onOk) {
  document.getElementById('modalTitulo').textContent   = titulo;
  document.getElementById('modalMensagem').textContent = mensagem;
  const btns = document.getElementById('modalBtns');
  btns.innerHTML = '';
  const btnOk       = document.createElement('button');
  btnOk.className   = 'btn-primary';
  btnOk.textContent = 'OK';
  btnOk.style.flex  = '1';
  btnOk.onclick     = () => { fecharModal(); if (onOk) onOk(); };
  btns.appendChild(btnOk);
  document.getElementById('modal').style.display = 'flex';
}

function mostrarModalConfirmar(titulo, mensagem, onConfirmar, txtConfirmar, onConfirmar2) {
  document.getElementById('modalTitulo').textContent   = titulo;
  document.getElementById('modalMensagem').textContent = mensagem;
  const btns = document.getElementById('modalBtns');
  btns.innerHTML = '';

  const btnCancelar       = document.createElement('button');
  btnCancelar.className   = 'btn-outline';
  btnCancelar.textContent = 'Cancelar';
  btnCancelar.onclick     = fecharModal;

  const btnOk       = document.createElement('button');
  btnOk.className   = 'btn-primary';
  btnOk.textContent = txtConfirmar || 'Confirmar';
  btnOk.onclick     = () => { fecharModal(); onConfirmar(); };

  btns.appendChild(btnCancelar);
  btns.appendChild(btnOk);

  if (onConfirmar2) {
    const btnExtra           = document.createElement('button');
    btnExtra.className       = 'btn-primary';
    btnExtra.textContent     = 'Partilhar via WhatsApp';
    btnExtra.style.marginTop = '8px';
    btnExtra.style.width     = '100%';
    btnExtra.onclick         = () => { fecharModal(); onConfirmar2(); };
    document.getElementById('modalBtns').after(btnExtra);
  }

  document.getElementById('modal').style.display = 'flex';
}

function fecharModal() {
  document.getElementById('modal').style.display = 'none';
}

function mostrarToast(mensagem) {
  const toast       = document.getElementById('toast');
  toast.textContent = mensagem;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2800);
}

(function init() {
  // Tentar restaurar sessão do sessionStorage
  try {
    const guardado = sessionStorage.getItem('kx_sessao');
    if (guardado) {
      KixikilaManager.setSessao(JSON.parse(guardado));
      mostrarPagina('Dashboard');
      return;
    }
  } catch (_) {}
  mostrarPagina('Auth');
  lucide.createIcons();
})();