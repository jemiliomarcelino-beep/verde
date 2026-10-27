const alunos = [];
const pagamentos = [];

const moeda = valor =>
  Number(valor).toLocaleString("pt-MZ", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) + " MT";

const escapar = texto =>
  String(texto).replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[c]);

// Navegação entre páginas
document.querySelectorAll("nav button").forEach(botao => {
  botao.addEventListener("click", () => {
    document.querySelectorAll(".page").forEach(p =>
      p.classList.add("hidden")
    );

    document.getElementById(botao.dataset.page)
      .classList.remove("hidden");

    document.querySelectorAll("nav button").forEach(b =>
      b.classList.remove("active")
    );

    botao.classList.add("active");

    document.getElementById("page-title").textContent =
      botao.textContent.trim().replace(/^[^\s]+\s*/, "");
  });
});

// Registar aluno
document.getElementById("form-aluno").addEventListener("submit", e => {
  e.preventDefault();

  alunos.push({
    id: crypto.randomUUID(),
    nome: document.getElementById("nome").value.trim(),
    encarregado: document.getElementById("encarregado").value.trim(),
    mensalidade: Number(document.getElementById("mensalidade").value)
  });

  e.target.reset();
  renderizar();
});

// Registar pagamento
document.getElementById("form-pagamento")
  .addEventListener("submit", e => {
    e.preventDefault();

    const aluno = alunos.find(a =>
      a.id === document.getElementById("aluno-pagamento").value
    );

    const valor = Number(
      document.getElementById("valor-pagamento").value
    );

    if (!aluno || !Number.isFinite(valor) || valor <= 0) {
      alert("Seleciona um aluno e introduz um valor válido.");
      return;
    }

    pagamentos.push({
      alunoId: aluno.id,
      mes: document.getElementById("mes-pagamento").value,
      valor,
      data: new Date().toLocaleDateString("pt-MZ")
    });

    e.target.reset();
    renderizar();
    alert("Pagamento registado com sucesso!");
  });

// Pesquisa
document.getElementById("pesquisa").addEventListener("input", renderizar);

function renderizar() {
  const termo = document.getElementById("pesquisa").value
    .trim().toLocaleLowerCase("pt");

  document.getElementById("lista-alunos").innerHTML =
    alunos.filter(a => a.nome.toLocaleLowerCase("pt").includes(termo))
      .map(a => `
        <tr>
          <td>${escapar(a.nome)}</td>
          <td>${escapar(a.encarregado)}</td>
          <td>${moeda(a.mensalidade)}</td>
          <td><button class="danger" data-remover="${a.id}">
            Remover
          </button></td>
        </tr>
      `).join("") ||
      '<tr><td colspan="4">Nenhum aluno encontrado.</td></tr>';

  document.getElementById("aluno-pagamento").innerHTML =
    '<option value="">Selecionar aluno</option>' +
    alunos.map(a =>
      `<option value="${a.id}">${escapar(a.nome)}</option>`
    ).join("");

  document.getElementById("lista-pagamentos").innerHTML =
    pagamentos.map(p => {
      const aluno = alunos.find(a => a.id === p.alunoId);
      return `
        <tr>
          <td>${escapar(aluno?.nome || "Aluno removido")}</td>
          <td>${escapar(p.mes)}</td>
          <td>${moeda(p.valor)}</td>
          <td>${escapar(p.data)}</td>
        </tr>
      `;
    }).join("") ||
    '<tr><td colspan="4">Nenhum pagamento registado.</td></tr>';

  const receitas = pagamentos.reduce((s, p) => s + p.valor, 0);

  document.getElementById("total-alunos").textContent = alunos.length;
  document.getElementById("total-receitas").textContent = moeda(receitas);
  document.getElementById("total-pendentes").textContent =
    alunos.reduce((s, a) => {
      const pago = pagamentos
        .filter(p => p.alunoId === a.id)
        .reduce((n, p) => n + p.valor, 0);

      return s + (pago < a.mensalidade ? 1 : 0);
    }, 0);

  document.getElementById("relatorio-receitas").textContent = moeda(receitas);
  document.getElementById("relatorio-contagem").textContent = pagamentos.length;

  document.getElementById("atividade").textContent =
    pagamentos.length
      ? `${pagamentos.length} pagamento(s) registado(s).`
      : "Ainda não existem pagamentos registados.";
}

// Remover aluno e respetivos registos de pagamento
document.getElementById("lista-alunos").addEventListener("click", e => {
  const id = e.target.dataset.remover;
  if (!id) return;

  if (!confirm("Remover este aluno e os seus pagamentos?")) return;

  alunos.splice(alunos.findIndex(a => a.id === id), 1);

  for (let i = pagamentos.length - 1; i >= 0; i--) {
    if (pagamentos[i].alunoId === id) pagamentos.splice(i, 1);
  }

  renderizar();
});

// Exportar CSV para Excel
document.getElementById("exportar").addEventListener("click", () => {
  const linhas = [
    ["Aluno", "Encarregado", "Mensalidade", "Mês pago", "Valor pago", "Data"],
    ...alunos.flatMap(a => {
      const registos = pagamentos.filter(p => p.alunoId === a.id);

      return (registos.length ? registos : [null]).map(p => [
        a.nome, a.encarregado, a.mensalidade,
        p?.mes || "Sem pagamento", p?.valor || 0, p?.data || ""
      ]);
    })
  ];

  const csv = "\uFEFF" + linhas.map(linha =>
    linha.map(v => `"${String(v).replace(/"/g, '""')}"`).join(";")
  ).join("\r\n");

  const url = URL.createObjectURL(
    new Blob([csv], { type: "text/csv;charset=utf-8;" })
  );

  const link = document.createElement("a");
  link.href = url;
  link.download = "relatorio-fluxedu.csv";
  link.click();
  URL.revokeObjectURL(url);
});

renderizar();