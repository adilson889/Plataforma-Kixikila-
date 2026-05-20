function mostrarTab(tab) {
  document.getElementById('tabRegisto').style.display = tab === 'registo' ? 'block' : 'none';
  document.getElementById('tabLogin').style.display   = tab === 'login'   ? 'block' : 'none';
  document.querySelectorAll('.auth-tab').forEach((b, i) => {
    b.classList.toggle('activo', (i === 0 && tab === 'registo') || (i === 1 && tab === 'login'));
  });
}

function previewFoto(origem, evento) {
  const ficheiro = evento.target.files[0];
  if (!ficheiro) return;
  const leitor = new FileReader();
  leitor.onload = (e) => {
    const src         = e.target.result;
    const img         = document.getElementById('previewFoto' + origem);
    const placeholder = document.getElementById('fotoPlaceholder' + origem);
    img.src           = src;
    img.style.display = 'block';
    if (placeholder) placeholder.style.display = 'none';
    // Guardar temporariamente em memória para usar no registo
    window._fotoTemp = src;
  };
  leitor.readAsDataURL(ficheiro);
}

async function registar() {
  const nome     = document.getElementById('regNome').value.trim();
  const telefone = document.getElementById('regTelefone').value.trim();
  const senha    = document.getElementById('regSenha').value.trim();
  const foto     = window._fotoTemp || '';

  if (!nome || !telefone || !senha) {
    mostrarModal('Campos obrigatórios', 'Preenche o nome, telefone e senha.'); return;
  }
  if (senha.length < 6) {
    mostrarModal('Senha curta', 'A senha deve ter pelo menos 6 caracteres.'); return;
  }

  try {
    await KixikilaManager.registar({ telefone, nome, senha, foto_perfil: foto });
    window._fotoTemp = null;
    mostrarToast('Conta criada com sucesso!');
    mostrarPagina('Dashboard');
  } catch (e) {
    mostrarModal('Erro', e.message);
  }
}

async function entrar() {
  const telefone = document.getElementById('loginTelefone').value.trim();
  const senha    = document.getElementById('loginSenha').value.trim();

  if (!telefone || !senha) {
    mostrarModal('Campos obrigatórios', 'Preenche o telefone e a senha.'); return;
  }

  try {
    await KixikilaManager.entrar({ telefone, senha });
    mostrarToast('Bem-vindo de volta!');
    mostrarPagina('Dashboard');
  } catch (e) {
    mostrarModal('Erro', e.message);
  }
}

function logout() {
  mostrarModalConfirmar('Sair', 'Tens a certeza que queres sair?', () => {
    KixikilaManager.limparSessao();
    mostrarPagina('Auth');
  });
}