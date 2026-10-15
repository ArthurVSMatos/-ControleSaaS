namespace ClinicaSaaS.Application.DTOs;

public record RelatorioFinanceiroDto(
    DateTime DataInicio,
    DateTime DataFim,
    int TotalAgendamentos,
    decimal FaturamentoBruto,
    decimal TotalComissoes,
    decimal LucroLiquido,
    List<ComissaoProfissionalDto> ComissoesPorProfissional
);

public record ComissaoProfissionalDto(
    Guid ProfissionalId,
    string NomeProfissional,
    int TotalAgendamentos,
    decimal FaturamentoGerado,
    bool RecebeComissao,
    int PorcentagemComissao,
    decimal ValorComissao
);