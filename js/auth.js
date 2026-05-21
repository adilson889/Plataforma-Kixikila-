// ============================================
// AUTH — Registo e Login
// ============================================

var _estrelasAvaliacao = 0;

function mostrarTab(tab) {
    const tabRegisto = document.getElementById('tabRegisto');
    const tabLogin = document.getElementById('tabLogin');
    const authTabs = document.querySelectorAll('.auth-tab');
    
    if (tabRegisto) tabRegisto.style.display = tab === 'registo' ? 'block' : 'none';
    if (tabLogin) tabLogin.style.display = tab === 'login' ? 'block' : 'none';
    
    authTabs.forEach((b, i) => {
        b.classList.toggle('activo', (i === 0 && tab === 'registo') || (i === 1 && tab === 'login'));
    });
}

function previewFoto(origem, evento) {
    const ficheiro = evento.target.files[0];
    if (!ficheiro) return;
    
    if (!ficheiro.type.startsWith('image/')) {
        if (typeof mostrarToast === 'function') {
            mostrarToast('Por favor, seleccione uma imagem válida.');
        }
        return;
    }
    
    if (ficheiro.size > 5 * 1024 * 1024) {
        if (typeof mostrarToast === 'function') {
            mostrarToast('A imagem deve ter no máximo 5MB.');
        }
        return;
    }
    
    const leitor = new FileReader();
    leitor.onload = (e) => {
        const src = e.target.result;
        const img = document.getElementById('previewFoto' + origem);
        const placeholder = document.getElementById('fotoPlaceholder' + origem);
        
        if (img) {
            img.src = src;
            img.style.display = 'block';
        }
        if (placeholder) placeholder.style.display = 'none';
        
        try {
            sessionStorage.setItem('kx_temp_foto', src);
        } catch (_) {}
    };
    leitor.readAsDataURL(ficheiro);
}

function getFotoTemp() {
    try {
        return sessionStorage.getItem('kx_temp_foto') || undefined;
    } catch (_) {
        return undefined;
    }
}

function limparFotoTemp() {
    try {
        sessionStorage.removeItem('kx_temp_foto');
    } catch (_) {}
}

async function registar() {
    const nomeInput = document.getElementById('regNome');
    const telefoneInput = document.getElementById('regTelefone');
    const senhaInput = document.getElementById('regSenha');
    
    const nome = nomeInput ? nomeInput.value.trim() : '';
    const telefone = telefoneInput ? telefoneInput.value.trim() : '';
    const senha = senhaInput ? senhaInput.value.trim() : '';

    if (!nome || !telefone || !senha) {
        if (typeof mostrarModal === 'function') {
            mostrarModal('Campos obrigatórios', 'Preenche o nome, telefone e senha para continuar.');
        }
        return;
    }
    
    if (senha.length < 6) {
        if (typeof mostrarModal === 'function') {
            mostrarModal('Senha curta', 'A senha deve ter pelo menos 6 caracteres.');
        }
        return;
    }
    
    const telefoneLimpo = telefone.replace(/\D/g, '');
    if (telefoneLimpo.length < 9) {
        if (typeof mostrarModal === 'function') {
            mostrarModal('Telefone inválido', 'Insira um número de telefone válido (ex: +244 9XX XXX XXX).');
        }
        return;
    }

    try {
        const fotoTemp = getFotoTemp();
        
        const perfil = await KixikilaManager.registar({
            telefone: telefone,
            nome: nome,
            senha: senha,
            foto_perfil: fotoTemp
        });
        
        limparFotoTemp();
        
        if (typeof mostrarToast === 'function') {
            mostrarToast('Conta criada com sucesso! Bem-vindo, ' + perfil.nome + '!');
        }
        
        if (typeof mostrarPagina === 'function') {
            mostrarPagina('Dashboard');
        }
    } catch (e) {
        console.error('Erro ao registar:', e);
        if (typeof mostrarModal === 'function') {
            mostrarModal('Erro ao registar', e.message);
        }
    }
}

async function entrar() {
    const telefoneInput = document.getElementById('loginTelefone');
    const senhaInput = document.getElementById('loginSenha');
    
    const telefone = telefoneInput ? telefoneInput.value.trim() : '';
    const senha = senhaInput ? senhaInput.value.trim() : '';

    if (!telefone || !senha) {
        if (typeof mostrarModal === 'function') {
            mostrarModal('Campos obrigatórios', 'Preenche o telefone e a senha.');
        }
        return;
    }

    try {
        const perfil = await KixikilaManager.entrar({
            telefone: telefone,
            senha: senha
        });
        
        if (typeof mostrarToast === 'function') {
            mostrarToast('Bem-vindo de volta, ' + perfil.nome + '!');
        }
        
        if (typeof mostrarPagina === 'function') {
            mostrarPagina('Dashboard');
        }
    } catch (e) {
        console.error('Erro ao entrar:', e);
        if (typeof mostrarModal === 'function') {
            mostrarModal('Credenciais incorrectas', e.message);
        }
    }
}

function logout() {
    if (typeof mostrarModalConfirmar === 'function') {
        mostrarModalConfirmar('Sair', 'Tens a certeza que queres sair?', () => {
            KixikilaManager.limparSessao();
            if (typeof mostrarPagina === 'function') {
                mostrarPagina('Auth');
            }
        });
    } else {
        if (confirm('Tens a certeza que queres sair?')) {
            KixikilaManager.limparSessao();
            if (typeof mostrarPagina === 'function') {
                mostrarPagina('Auth');
            }
        }
    }
}