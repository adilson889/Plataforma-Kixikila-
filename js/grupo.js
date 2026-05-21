// ============================================
// GRUPO — Ver Grupo, Chat, Pagamento, Avaliação
// ============================================

var _codigoGrupoAtual = '';

function abrirGrupo(codigo) {
    _codigoGrupoAtual = codigo;
    if (typeof mostrarPagina === 'function') {
        mostrarPagina('VerGrupo');
    }
    carregarVerGrupo(codigo);
}

async function carregarVerGrupo(codigo) {
    try {
        const grupo  = await KixikilaManager.carregarGrupo(codigo);
        const sessao = KixikilaManager.getSessao();
        const perfil = sessao?.perfil;

        const titulo = document.getElementById('verGrupoTitulo');
        const valorEl = document.getElementById('verGrupoValor');
        const estadoEl = document.getElementById('verGrupoEstado');
        const codigoEl = document.getElementById('verGrupoCodigo');
        const ordemEl = document.getElementById('verGrupoOrdem');
        
        if (titulo) titulo.textContent = grupo.nome;
        if (valorEl) {
            valorEl.textContent = KixikilaManager.formatarValor(grupo.valor) + ' KZ / ' + grupo.periodicidade;
        }
        if (estadoEl) {
            estadoEl.textContent = grupo.estado === 'aberto' ? 'Aberto — a aceitar membros' : 'Grupo completo';
        }
        if (codigoEl) codigoEl.textContent = codigo;

        const membroAtual = grupo.membros.find(m => m.ordem === grupo.ordem_atual);
        if (ordemEl) {
            ordemEl.textContent = membroAtual
                ? '★ Ronda ' + grupo.ordem_atual + '/' + grupo.membros.length + ' — A receber: ' + membroAtual.nome
                : 'Ronda ' + grupo.ordem_atual + '/' + grupo.membros.length;
        }

        const lista = document.getElementById('listaMembros');
        if (lista) {
            lista.innerHTML = '';
            grupo.membros.sort((a, b) => a.ordem - b.ordem).forEach(m => {
                const eAtual   = m.ordem === grupo.ordem_atual;
                const eProprio = m.telefone === perfil?.telefone;
                const div      = document.createElement('div');
                div.className  = 'membro-card' + (eAtual ? ' atual' : '') + (eProprio ? ' proprio' : '');
                div.style.cursor = 'pointer';
                div.onclick = () => {
                    if (typeof abrirPerfilMembro === 'function') {
                        abrirPerfilMembro(m.telefone);
                    }
                };
                div.innerHTML  = `
                    <div class="membro-avatar">${escapeHtml(m.nome[0]?.toUpperCase() || '?')}</div>
                    <div class="membro-info">
                        <h4>${escapeHtml(m.nome)}${eProprio ? ' <small style="color:var(--r)">tu</small>' : ''}</h4>
                        <small>${escapeHtml(m.telefone)}${eAtual ? ' • ★ A receber' : ''}</small>
                    </div>
                    <span class="membro-status ${m.pago ? 'status-pago' : eAtual ? 'status-recebe' : 'status-pendente'}">
                        ${m.pago ? 'PAGO' : eAtual ? 'RECEBE' : 'PENDENTE'}
                    </span>`;
                lista.appendChild(div);
            });
        }
    } catch (e) {
        console.error('Erro ao carregar grupo:', e);
        if (typeof mostrarModal === 'function') {
            mostrarModal('Erro', 'Não foi possível carregar o grupo.');
        }
    }
}

async function registarPagamento() {
    const sessao = KixikilaManager.getSessao();
    const perfil = sessao?.perfil;
    if (!perfil) return;
    
    if (typeof mostrarModalConfirmar === 'function') {
        mostrarModalConfirmar(
            'Confirmar pagamento',
            'Confirmas que efectuaste o pagamento desta ronda?',
            async () => {
                try {
                    const res = await KixikilaManager.registarPagamento(_codigoGrupoAtual, perfil.telefone);
                    if (res.todosPagaram) {
                        if (typeof mostrarModal === 'function') {
                            mostrarModal('Ronda concluída!', 'Todos os membros pagaram. A próxima ronda começa agora!');
                        }
                    } else {
                        if (typeof mostrarToast === 'function') {
                            mostrarToast('Pagamento registado!');
                        }
                    }
                    carregarVerGrupo(_codigoGrupoAtual);
                } catch (e) {
                    if (typeof mostrarModal === 'function') {
                        mostrarModal('Erro', e.message);
                    }
                }
            }
        );
    }
}

function copiarCodigo() {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(_codigoGrupoAtual).then(() => {
            if (typeof mostrarToast === 'function') {
                mostrarToast('Código copiado!');
            }
        }).catch(() => {
            if (typeof mostrarToast === 'function') {
                mostrarToast('Não foi possível copiar');
            }
        });
    } else {
        // Fallback para navegadores antigos
        const input = document.createElement('input');
        input.value = _codigoGrupoAtual;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        if (typeof mostrarToast === 'function') {
            mostrarToast('Código copiado!');
        }
    }
}

function partilharGrupo() {
    const msg = 'Entra no meu grupo Kixikila!\nCódigo: ' + _codigoGrupoAtual + '\n\nAcede em: https://plataformakixikila.vercel.app';
    window.open('https://wa.me/?text=' + encodeURIComponent(msg));
}

function abrirChat() {
    if (typeof mostrarPagina === 'function') {
        mostrarPagina('Chat');
    }
    carregarChatGrupo();
}

async function carregarChatGrupo() {
    try {
        const grupo  = await KixikilaManager.carregarGrupo(_codigoGrupoAtual);
        const sessao = KixikilaManager.getSessao();
        const perfil = sessao?.perfil;

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
            const meu  = msg.telefone === perfil?.telefone;
            const wrap = document.createElement('div');
            wrap.className = 'chat-balao-wrap ' + (meu ? 'meu' : 'outro');
            wrap.innerHTML = `
                ${!meu ? '<span class="chat-autor">' + escapeHtml(msg.nome) + '</span>' : ''}
                <div class="chat-balao ' + (meu ? 'meu' : 'outro') + '">' + escapeHtml(msg.texto) + '</div>
                <span class="chat-data">' + (msg.data || '').replace('T', ' ').slice(0, 16) + '</span>`;
            container.appendChild(wrap);
        }
        container.scrollTop = container.scrollHeight;
    } catch (e) {
        console.error('Erro ao carregar chat:', e);
    }
}

async function enviarMensagem() {
    const input = document.getElementById('etMensagem');
    const texto = input ? input.value.trim() : '';
    const sessao = KixikilaManager.getSessao();
    const perfil = sessao?.perfil;
    
    if (!texto || !perfil) return;
    
    if (input) input.value = '';
    
    try {
        await KixikilaManager.enviarMensagem(
            _codigoGrupoAtual, perfil.telefone, perfil.nome, texto
        );
        carregarChatGrupo();
    } catch (e) {
        console.error('Erro ao enviar mensagem:', e);
        if (typeof mostrarModal === 'function') {
            mostrarModal('Erro', 'Não foi possível enviar a mensagem.');
        }
    }
}

function abrirMembrosChat() {
    voltarGrupo();
}

function abrirAvaliacao() {
    KixikilaManager.carregarGrupo(_codigoGrupoAtual).then(grupo => {
        const sessao = KixikilaManager.getSessao();
        const perfil = sessao?.perfil;
        const outros = grupo.membros.filter(m => m.telefone !== perfil?.telefone);

        if (!outros.length) {
            if (typeof mostrarModal === 'function') {
                mostrarModal('Sem membros', 'Não há outros membros para avaliar.');
            }
            return;
        }

        const sel = document.getElementById('selMembro');
        if (sel) {
            sel.innerHTML = outros.map(m => '<option value="' + escapeHtml(m.telefone) + '">' + escapeHtml(m.nome) + '</option>').join('');
        }

        _estrelasAvaliacao = 0;
        const wrap = document.getElementById('estrelasWrap');
        if (wrap) {
            wrap.innerHTML = '';
            for (let i = 1; i <= 5; i++) {
                const btn = document.createElement('button');
                btn.className  = 'estrela-btn';
                btn.textContent = '★';
                btn.onclick = (function(n) {
                    return function() {
                        _estrelasAvaliacao = n;
                        const btns = wrap.querySelectorAll('.estrela-btn');
                        for (let j = 0; j < btns.length; j++) {
                            btns[j].classList.toggle('on', j < n);
                        }
                    };
                })(i);
                wrap.appendChild(btn);
            }
        }

        const modal = document.getElementById('modalAvaliacao');
        if (modal) modal.style.display = 'flex';
    }).catch(e => {
        console.error('Erro ao carregar grupo para avaliação:', e);
        if (typeof mostrarModal === 'function') {
            mostrarModal('Erro', 'Não foi possível carregar os membros para avaliação.');
        }
    });
}

function fecharModalAvaliacao() {
    const modal = document.getElementById('modalAvaliacao');
    if (modal) modal.style.display = 'none';
}

async function confirmarAvaliacao() {
    if (!_estrelasAvaliacao) {
        if (typeof mostrarToast === 'function') {
            mostrarToast('Selecciona as estrelas');
        }
        return;
    }
    
    const sessao  = KixikilaManager.getSessao();
    const perfil  = sessao?.perfil;
    const selMembro = document.getElementById('selMembro');
    const avaliado = selMembro ? selMembro.value : '';
    
    fecharModalAvaliacao();
    
    try {
        const rep = await KixikilaManager.avaliar(perfil.telefone, avaliado, _estrelasAvaliacao, '');
        if (typeof mostrarModal === 'function') {
            mostrarModal('Avaliação guardada!',
                'Reputação actualizada: ' + KixikilaManager.reputacaoEstrelas(rep) + ' — ' + KixikilaManager.reputacaoTexto(rep));
        }
    } catch (e) {
        if (typeof mostrarModal === 'function') {
            mostrarModal('Erro', e.message);
        }
    }
}

function voltarGrupo() {
    if (typeof mostrarPagina === 'function') {
        mostrarPagina('VerGrupo');
    }
    carregarVerGrupo(_codigoGrupoAtual);
}

// ============================================
// UTILITÁRIO DE SEGURANÇA
// ============================================

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}