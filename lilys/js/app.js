function openTab(tabId) {
    document.querySelectorAll('.tab-conteudo').forEach(content => {
        content.style.display = 'none';
    });

    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });

    document.getElementById(tabId).style.display = 'block';

    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }
}
document.addEventListener('DOMContentLoaded', function () {
    document.querySelector('.tab-conteudo').style.display = 'block';
});

//Criar o banco

document.getElementById('btnCriarBanco').addEventListener('click', criarBanco);

function criarBanco() {
    const nomeBanco = document.getElementById('nomeBanco').value.trim();

    if (!nomeBanco) {
        exibirMensagem('Por favor, digite um nome para o banco.', 'red');
        return;
    }

    fetch("http://localhost:3001/criar-banco", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nomeBanco })
    })
        .then(response => response.json())
        .then(data => {
            console.log("Resposta do servidor:", data); // 🔴 Veja exatamente o que está vindo
            document.getElementById("mensagem").innerText = data.message || data.error;
        })
        .catch(error => {
            console.error("Erro na requisição:", error);
            document.getElementById("mensagem").innerText = "Erro ao se comunicar com o servidor.";
        });

}

function exibirMensagem(msg, color) {
    const mensagem = document.getElementById('mensagem');
    mensagem.textContent = msg;
    mensagem.style.color = color;
}

document.addEventListener("DOMContentLoaded", () => {
    fetch("http://localhost:3001/listar-bancos") // Rota que busca os bancos do MySQL
        .then(response => response.json())
        .then(data => {
            const selectBanco = document.getElementById("bd-op");
            selectBanco.innerHTML = "";

            data.bancos.forEach(banco => {
                const option = document.createElement("option");
                option.value = banco;
                option.textContent = banco;
                selectBanco.appendChild(option);
            });
        })
        .catch(error => console.error("Erro ao carregar bancos:", error));
});

function carregarBancos(selectId) {
    fetch("http://localhost:3001/listar-bancos")
        .then(response => response.json())
        .then(data => {
            const selectBanco = document.getElementById(selectId);
            selectBanco.innerHTML = '<option value="">Selecione um banco</option>';

            data.bancos.forEach(banco => {
                const option = document.createElement("option");
                option.value = banco;
                option.textContent = banco;
                selectBanco.appendChild(option);
            });
        })
        .catch(error => console.error(`Erro ao carregar bancos (${selectId}):`, error));
}

document.addEventListener("DOMContentLoaded", () => {
    carregarBancos("bd-op");
    carregarBancos("bd-op-inserir");
});

const nomeTabela = document.getElementById("nome-tabela").value;

document.getElementById("bd-op-inserir").addEventListener("change", function () {
    const nomeBanco = this.value;
    carregarTabelas(nomeBanco); 
});

function carregarTabelas(nomeBanco) {
    if (!nomeBanco) {
        console.warn("Nenhum banco selecionado.");
        return;
    }

    const tabelaSelect = document.getElementById("tabela-op-inserir");
    if (!tabelaSelect) {
        console.error("Elemento 'tabela-op-inserir' não encontrado no DOM!");
        return;
    }

    fetch(`http://localhost:3001/listar-tabelas/${nomeBanco}`)
        .then(response => response.json())
        .then(data => {
            console.log("Tabelas carregadas:", data);

            tabelaSelect.innerHTML = `<option value="">Selecione uma tabela</option>`;

            if (!data.tabelas || data.tabelas.length === 0) {
                console.warn("Nenhuma tabela encontrada para este banco.");
                return;
            }

            data.tabelas.forEach(tabela => {
                const option = document.createElement("option");
                option.value = tabela;
                option.textContent = tabela;
                tabelaSelect.appendChild(option);
            });
        })
        .catch(error => console.error("Erro ao carregar tabelas:", error));
}


document.getElementById("num-campos").addEventListener("input", function () {
    const numCampos = parseInt(this.value);
    const container = document.getElementById("campos-container");

    container.innerHTML = ""; // Limpa campos antigos antes de adicionar novos

    for (let i = 1; i <= numCampos; i++) {
        const div = document.createElement("div");
        div.classList.add("campo"); // Adiciona classe para facilitar a seleção

        div.innerHTML = `
        <p><label>Descrição do Campo ${i}</label></p>
        <div class="box-descricao">
          <label>Nome:</label>
          <input type="text" size="30" class="campo-nome" name="campo-nome-${i}" required>
        
          <label>Tipo:</label>
          <select class="campo-tipo">
            <option value="INT">INT</option>
            <option value="VARCHAR">VARCHAR</option>
            <option value="TEXT">TEXT</option>
            <option value="DATE">DATE</option>
          </select>
  
          <label>Tamanho:</label>
          <input type="number" class="campo-tamanho" min="1" value="255">
        </div>
      `;
        container.appendChild(div);
    }
});


function criarTabela() {
    const nomeBanco = document.getElementById("bd-op").value;
    const nomeTabela = document.getElementById("nome-tabela").value;
    const campos = [];
    const mensagemDiv = document.getElementById("mensagem-tabela");

    document.querySelectorAll("#campos-container .campo").forEach((div) => {
        const nome = div.querySelector(".campo-nome").value.trim();
        const tipo = div.querySelector(".campo-tipo").value;
        const tamanho = div.querySelector(".campo-tamanho").value || "255";

        if (nome) {
            campos.push({ nome, tipo, tamanho });
        }
    });

    if (!nomeBanco || !nomeTabela || campos.length === 0) {
        mensagemDiv.innerText = "Preencha todos os campos corretamente.";
        mensagemDiv.style.color = "red";
        return;
    }

    fetch("http://localhost:3001/criar-tabela", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nomeBanco, nomeTabela, colunas: campos })
    })
        .then((response) => response.json())
        .then((data) => {
            console.log("Resposta do servidor:", data);

            if (data.message) {
                mensagemDiv.innerText = data.message;
                mensagemDiv.style.color = "green";
            } else if (data.error) {
                mensagemDiv.innerText = data.error;
                mensagemDiv.style.color = "red";
            }
        })
        .catch((error) => {
            console.error("Erro na requisição:", error);
            mensagemDiv.innerText = "Erro ao se comunicar com o servidor.";
            mensagemDiv.style.color = "red";
        });
}


document.getElementById("bd-op").addEventListener("change", function () {
    const nomeBanco = this.value;
    console.log("🔍 Banco selecionado:", nomeBanco);

    const tabelaSelect = document.getElementById("tabela-op");

    if (!nomeBanco) return;

    fetch(`http://localhost:3001/listar-tabelas/${nomeBanco}`)
        .then(res => res.json())
        .then(data => {
            console.log("📌 Tabelas recebidas:", data); // <-- Debug
            tabelaSelect.innerHTML = `<option value="">Selecione uma tabela</option>`;
            data.tabelas.forEach(tabela => {
                tabelaSelect.innerHTML += `<option value="${tabela}">${tabela}</option>`;
            });
        })
        .catch(err => console.error("❌ Erro ao listar tabelas:", err));
});


document.addEventListener("DOMContentLoaded", function () {
    const tabelaOp = document.getElementById("tabela-op-inserir");
    
    if (!tabelaOp) {
        console.error("Elemento 'tabela-op' não encontrado no DOM!");
        return;
    }

    tabelaOp.addEventListener("change", function() {
        carregarCampos();
    });
});

function carregarCampos() {
    const nomeBanco = document.getElementById("bd-op-inserir")?.value;
    const nomeTabela = document.getElementById("tabela-op-inserir")?.value;
    const camposContainer = document.getElementById("campos-inserir");

    if (!camposContainer) {
        console.error("Elemento 'campos-inserir' não encontrado no DOM!");
        return;
    }

    camposContainer.innerHTML = "<p>Carregando campos...</p>";

    if (!nomeBanco || !nomeTabela) {
        console.error("Banco ou tabela não selecionados");
        return;
    }

    fetch(`http://localhost:3001/listar-campos/${nomeBanco}/${nomeTabela}`)
        .then(response => {
            if (!response.ok) throw new Error("Tabela não encontrada");
            return response.json();
        })
        .then(data => {
            camposContainer.innerHTML = ""; // Limpa os campos antes de adicionar novos
            console.log("Campos recebidos:", data.campos);
            
            if (!data.campos || data.campos.length === 0) {
                camposContainer.innerHTML = "<p>Nenhum campo encontrado nesta tabela</p>";
                return;
            }

            data.campos.forEach(campo => {
                const div = document.createElement("div");
                div.className = "campo-form-group";
                
                const label = document.createElement("label");
                label.textContent = campo.nome + ":";
                label.htmlFor = `input-${campo.nome}`;
                
                const input = document.createElement("input");
                input.type = "text";
                input.id = `input-${campo.nome}`;
                input.name = campo.nome;
                input.placeholder = `Digite o valor para ${campo.nome} (tipo: ${campo.tipo})`;
                
                div.appendChild(label);
                div.appendChild(input);
                camposContainer.appendChild(div);
            });
        })
        .catch(error => {
            console.error("Erro ao carregar campos:", error);
            camposContainer.innerHTML = `<p class="error">Erro ao carregar campos: ${error.message}</p>`;
        });
}

async function inserirRegistro() {
    const nomeBanco = document.getElementById("bd-op-inserir").value;
    const nomeTabela = document.getElementById("tabela-op-inserir").value;
    const mensagemDiv = document.getElementById("mensagem-inserir");

    if (!nomeBanco || !nomeTabela) {
        mensagemDiv.innerText = "Selecione um banco e uma tabela.";
        mensagemDiv.style.color = "red";
        return;
    }

    const valores = {};
    document.querySelectorAll("#campos-inserir input").forEach(input => {
        if (input.name && input.value.trim() !== "") {
            // Converte para número se necessário
            valores[input.name] = isNaN(input.value) ? input.value.trim() : Number(input.value);
        }
    });

    console.log("Dados a enviar:", { nomeBanco, nomeTabela, valores });

    try {
        const response = await fetch("http://localhost:3001/inserir-registro", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nomeBanco, nomeTabela, valores })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Erro desconhecido");
        }

        console.log("Sucesso:", data);
        mensagemDiv.innerText = data.message || "Registro inserido com sucesso!";
        mensagemDiv.style.color = "green";

        // Limpa os campos após sucesso
        document.querySelectorAll("#campos-inserir input").forEach(input => input.value = "");
    } catch (error) {
        console.error("Erro completo:", error);
        mensagemDiv.innerText = `Erro: ${error.message}`;
        mensagemDiv.style.color = "red";
    }
}

document.getElementById("bd-op-inserir").addEventListener("change", function () {
    console.log("Banco selecionado:", this.value);
});
document.getElementById("tabela-op-inserir").addEventListener("change", function () {
    console.log("Tabela selecionada:", this.value);
});

console.log("Campos encontrados:", 
    Array.from(document.querySelectorAll("#campos-inserir input")).map(input => ({
        name: input.name,
        value: input.value,
        dataset: input.dataset
    }))
);

document.addEventListener("DOMContentLoaded", function() {
    carregarTabelas(document.getElementById("bd-op-inserir")?.value);
});

document.getElementById("listar-btn").addEventListener("click", function () {
    const banco = document.getElementById("banco-op").value;
    const tabela = document.getElementById("tabela-op").value;

    if (!banco || !tabela) {
        alert("Selecione um banco e uma tabela!");
        return;
    }

    fetch(`http://localhost:3001/listar-registros/${banco}/${tabela}`)
        .then(response => response.json())
        .then(data => {
            if (!data.registros || data.registros.length === 0) {
                alert("Nenhum registro encontrado.");
                return;
            }

            // Limpar cabeçalho e corpo da tabela
            const cabecalho = document.getElementById("cabecalho");
            const corpo = document.getElementById("corpo");
            cabecalho.innerHTML = "";
            corpo.innerHTML = "";

            // Criar cabeçalho com os nomes das colunas
            const colunas = Object.keys(data.registros[0]); // Pega as chaves do primeiro objeto
            const trHead = document.createElement("tr");
            colunas.forEach(col => {
                let th = document.createElement("th");
                th.textContent = col;
                trHead.appendChild(th);
            });
            cabecalho.appendChild(trHead);

            // Criar linhas da tabela
            data.registros.forEach(registro => {
                let tr = document.createElement("tr");
                colunas.forEach(col => {
                    let td = document.createElement("td");
                    td.textContent = registro[col]; // Adiciona o valor correspondente
                    tr.appendChild(td);
                });
                corpo.appendChild(tr);
            });
        })
        .catch(err => console.error("Erro ao buscar registros:", err));
});


document.addEventListener("DOMContentLoaded", function () {
    const bancoSelect = document.getElementById("banco-op");
    const tabelaSelect = document.getElementById("tabela-op");
    const listarBtn = document.getElementById("listar-btn");
    const cabecalho = document.getElementById("cabecalho");
    const corpo = document.getElementById("corpo");

    // 🔹 Carregar bancos disponíveis
    fetch(`http://localhost:3001/listar-bancos`)
        .then(response => response.json())
        .then(data => {
            bancoSelect.innerHTML = `<option value="">Selecione um banco</option>`;
            data.bancos.forEach(banco => {
                let option = document.createElement("option");
                option.value = banco;
                option.textContent = banco;
                bancoSelect.appendChild(option);
            });
        })
        .catch(err => console.error("Erro ao buscar bancos:", err));

    // 🔹 Atualizar tabelas ao selecionar um banco
    bancoSelect.addEventListener("change", function () {
        const nomeBanco = bancoSelect.value;
        tabelaSelect.innerHTML = `<option value="">Carregando...</option>`;

        if (!nomeBanco) {
            tabelaSelect.innerHTML = `<option value="">Selecione um banco primeiro</option>`;
            return;
        }

        fetch(`http://localhost:3001/listar-tabelas/${nomeBanco}`)
            .then(response => response.json())
            .then(data => {
                tabelaSelect.innerHTML = `<option value="">Selecione uma tabela</option>`;

                if (data.tabelas.length === 0) {
                    tabelaSelect.innerHTML = `<option value="">Nenhuma tabela encontrada</option>`;
                    return;
                }

                data.tabelas.forEach(tabela => {
                    let option = document.createElement("option");
                    option.value = tabela;
                    option.textContent = tabela;
                    tabelaSelect.appendChild(option);
                });
            })
            .catch(err => console.error("Erro ao buscar tabelas:", err));
    });

    // 🔹 Buscar registros ao clicar no botão
    listarBtn.addEventListener("click", function () {
        const nomeBanco = bancoSelect.value;
        const nomeTabela = tabelaSelect.value;

        if (!nomeBanco || !nomeTabela) {
            alert("Selecione um banco e uma tabela primeiro!");
            return;
        }

        fetch(`http://localhost:3001/listar-registros/${nomeBanco}/${nomeTabela}`)
            .then(response => response.json())
            .then(data => {
                corpo.innerHTML = ""; // Limpa a tabela antes de atualizar

                if (data.registros.length === 0) {
                    corpo.innerHTML = "<tr><td colspan='99'>Nenhum dado encontrado.</td></tr>";
                    return;
                }

                // 🔹 Gerar cabeçalho dinamicamente
                cabecalho.innerHTML = "";
                const colunas = Object.keys(data.registros[0]);
                colunas.forEach(col => {
                    let th = document.createElement("th");
                    th.textContent = col;
                    cabecalho.appendChild(th);
                });

                // 🔹 Preencher os dados na tabela
                data.registros.forEach(registro => {
                    let tr = document.createElement("tr");
                    colunas.forEach(col => {
                        let td = document.createElement("td");
                        td.textContent = registro[col];
                        tr.appendChild(td);
                    });
                    corpo.appendChild(tr);
                });
            })
            .catch(err => console.error("Erro ao buscar registros:", err));
    });
});
