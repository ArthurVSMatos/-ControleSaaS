using ClinicaSaaS.Application.DTOs;
using ClinicaSaaS.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ClinicaSaaS.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class FinanceiroController : ControllerBase
{
    private readonly AppDbContext _context;

    public FinanceiroController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("relatorio")]
    public async Task<ActionResult<RelatorioFinanceiroDto>> GetRelatorio(
        [FromQuery] DateTime dataInicio,
        [FromQuery] DateTime dataFim,
        CancellationToken cancellationToken)
    {
        var inicioUtc = DateTime.SpecifyKind(dataInicio.Date, DateTimeKind.Utc);
        var fimUtc = DateTime.SpecifyKind(dataFim.Date, DateTimeKind.Utc).AddDays(1).AddTicks(-1);

        // Considera apenas agendamentos com status "Confirmado" dentro do intervalo de datas
        var agendamentos = await _context.Agendamentos
            .Include(a => a.Profissional)
            .Include(a => a.Servico)
            .Where(a => a.DataHora >= inicioUtc && a.DataHora <= fimUtc && a.Status == "Confirmado")
            .ToListAsync(cancellationToken);

        var faturamentoBruto = agendamentos.Sum(a => a.Servico.Valor);

        // Agrupa por profissional para detalhar o fechamento de comissões
        var comissoesAgrupadas = agendamentos
            .GroupBy(a => a.Profissional)
            .Select(g =>
            {
                var prof = g.Key;
                var totalFaturado = g.Sum(a => a.Servico.Valor);
                var valorComissao = prof.RecebeComissao
                    ? Math.Round(totalFaturado * prof.PorcentagemComissao / 100m, 2)
                    : 0m;

                return new ComissaoProfissionalDto(
                    prof.Id,
                    prof.Nome,
                    g.Count(),
                    totalFaturado,
                    prof.RecebeComissao,
                    prof.PorcentagemComissao,
                    valorComissao
                );
            })
            .ToList();

        var totalComissoes = comissoesAgrupadas.Sum(c => c.ValorComissao);
        var lucroLiquido = faturamentoBruto - totalComissoes;

        var relatorio = new RelatorioFinanceiroDto(
            dataInicio.Date,
            dataFim.Date,
            agendamentos.Count,
            faturamentoBruto,
            totalComissoes,
            lucroLiquido,
            comissoesAgrupadas
        );

        return Ok(relatorio);
    }
}