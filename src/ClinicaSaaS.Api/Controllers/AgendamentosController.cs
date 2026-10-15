using ClinicaSaaS.Application.DTOs;
using ClinicaSaaS.Application.Interfaces;
using ClinicaSaaS.Domain.Entities;
using ClinicaSaaS.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ClinicaSaaS.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class AgendamentosController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IAgendamentoService _agendamentoService;

    public AgendamentosController(AppDbContext context, IAgendamentoService agendamentoService)
    {
        _context = context;
        _agendamentoService = agendamentoService;
    }

    // ----------------------------------------------------
    // MÓDULO 1: AGENDA (Calendário & Consultas)
    // ----------------------------------------------------

    [HttpGet("calendario")]
    public async Task<ActionResult<IEnumerable<CalendarioResumoDto>>> GetCalendario([FromQuery] int ano, [FromQuery] int mes, CancellationToken cancellationToken)
    {
        var inicioMes = new DateTimeOffset(new DateTime(ano, mes, 1), TimeSpan.Zero);
        var fimMes = inicioMes.AddMonths(1);

        var agendamentos = await _context.Agendamentos
            .Where(a => a.DataHora >= inicioMes && a.DataHora < fimMes)
            .ToListAsync(cancellationToken);

        var resumo = agendamentos
            .GroupBy(a => a.DataHora.Date)
            .Select(g => new CalendarioResumoDto(g.Key, g.Count()))
            .ToList();

        return Ok(resumo);
    }

    [HttpGet("dia")]
    public async Task<ActionResult<IEnumerable<AgendamentoDto>>> GetPorDia([FromQuery] DateTime data, CancellationToken cancellationToken)
    {
        var inicioDia = DateTime.SpecifyKind(data.Date, DateTimeKind.Utc);
        var fimDia = inicioDia.AddDays(1);

        var agendamentos = await _context.Agendamentos
            .Include(a => a.Profissional)
            .Include(a => a.Servico)
            .Include(a => a.Cliente)
            .Where(a => a.DataHora >= inicioDia && a.DataHora < fimDia)
            .OrderBy(a => a.DataHora)
            .ToListAsync(cancellationToken);

        return Ok(agendamentos.Select(MapearParaDto));
    }

    // ----------------------------------------------------
    // MÓDULO 6: PAINEL OPERACIONAL "HOJE"
    // ----------------------------------------------------

    [HttpGet("hoje")]
    public async Task<ActionResult<IEnumerable<AgendamentoDto>>> GetHoje(CancellationToken cancellationToken)
    {
        var hojeInicio = DateTime.UtcNow.Date;
        var hojeFim = hojeInicio.AddDays(1);

        // Agendamentos de Hoje (Pendentes e Confirmados) + Atrasados/Esquecidos de dias anteriores (Pendentes)
        var agendamentos = await _context.Agendamentos
            .Include(a => a.Profissional)
            .Include(a => a.Servico)
            .Include(a => a.Cliente)
            .Where(a => (a.DataHora >= hojeInicio && a.DataHora < hojeFim) ||
                        (a.DataHora < hojeInicio && a.Status == "Pendente"))
            .OrderBy(a => a.DataHora)
            .ToListAsync(cancellationToken);

        return Ok(agendamentos.Select(MapearParaDto));
    }

    // ----------------------------------------------------
    // CRIAÇÃO & EDIÇÃO COM VALIDAÇÃO RIGOROSA DE REGRAS
    // ----------------------------------------------------

    [HttpPost]
    public async Task<ActionResult<AgendamentoDto>> Create([FromBody] CreateAgendamentoDto dto, CancellationToken cancellationToken)
    {
        // 1. Validar Cliente Obrigatoriamente (Regra Global 2)
        var cliente = await _context.Clientes.FindAsync(new object[] { dto.ClienteId }, cancellationToken);
        if (cliente == null)
            return BadRequest(new { message = "Cliente não cadastrado. É obrigatório cadastrar o cliente previamente." });

        // 2. Validar Profissional Ativo
        var profissional = await _context.Profissionais.FindAsync(new object[] { dto.ProfissionalId }, cancellationToken);
        if (profissional == null || !profissional.IsAtivo)
            return BadRequest(new { message = "Profissional selecionado é inválido ou está inativo." });

        // 3. Validar Serviço
        var servico = await _context.Servicos.FindAsync(new object[] { dto.ServicoId }, cancellationToken);
        if (servico == null)
            return BadRequest(new { message = "Serviço não encontrado." });

        // 4. Validar Conflito de Horário (Regra Global 1)
        var temConflito = await _agendamentoService.TemConflitoHorarioAsync(
            dto.ProfissionalId, dto.DataHora, servico.DuracaoMinutos, null, cancellationToken);

        if (temConflito)
            return BadRequest(new { message = "Profissional indisponível neste horário" });

        var agendamento = new Agendamento
        {
            ProfissionalId = dto.ProfissionalId,
            ServicoId = dto.ServicoId,
            ClienteId = dto.ClienteId,
            DataHora = dto.DataHora.ToUniversalTime(),
            Status = "Pendente"
        };

        _context.Agendamentos.Add(agendamento);
        await _context.SaveChangesAsync(cancellationToken);

        // Recarrega navegações para o retorno completo
        await _context.Entry(agendamento).Reference(a => a.Profissional).LoadAsync(cancellationToken);
        await _context.Entry(agendamento).Reference(a => a.Servico).LoadAsync(cancellationToken);
        await _context.Entry(agendamento).Reference(a => a.Cliente).LoadAsync(cancellationToken);

        return CreatedAtAction(nameof(GetPorDia), new { data = agendamento.DataHora.Date }, MapearParaDto(agendamento));
    }

    [HttpPost("rapido")]
    public async Task<ActionResult<AgendamentoDto>> CreateRapido([FromBody] CreateAgendamentoRapidoDto dto, CancellationToken cancellationToken)
    {
        var dataHoje = DateTime.UtcNow.Date.Add(dto.Horario);
        var dataHoraUtc = new DateTimeOffset(dataHoje, TimeSpan.Zero);

        var createDto = new CreateAgendamentoDto(dto.ProfissionalId, dto.ServicoId, dto.ClienteId, dataHoraUtc);
        return await Create(createDto, cancellationToken);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateAgendamentoDto dto, CancellationToken cancellationToken)
    {
        var agendamento = await _context.Agendamentos.FindAsync(new object[] { id }, cancellationToken);
        if (agendamento == null)
            return NotFound(new { message = "Agendamento não encontrado." });

        var cliente = await _context.Clientes.FindAsync(new object[] { dto.ClienteId }, cancellationToken);
        if (cliente == null)
            return BadRequest(new { message = "Cliente não cadastrado." });

        var servico = await _context.Servicos.FindAsync(new object[] { dto.ServicoId }, cancellationToken);
        if (servico == null)
            return BadRequest(new { message = "Serviço não encontrado." });

        // Valida conflito ignorando o próprio agendamento que está sendo editado
        var temConflito = await _agendamentoService.TemConflitoHorarioAsync(
            dto.ProfissionalId, dto.DataHora, servico.DuracaoMinutos, id, cancellationToken);

        if (temConflito)
            return BadRequest(new { message = "Profissional indisponível neste horário" });

        agendamento.ProfissionalId = dto.ProfissionalId;
        agendamento.ServicoId = dto.ServicoId;
        agendamento.ClienteId = dto.ClienteId;
        agendamento.DataHora = dto.DataHora.ToUniversalTime();

        await _context.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [HttpPatch("{id:guid}/confirmar")]
    public async Task<IActionResult> Confirmar(Guid id, CancellationToken cancellationToken)
    {
        var agendamento = await _context.Agendamentos.FindAsync(new object[] { id }, cancellationToken);
        if (agendamento == null)
            return NotFound(new { message = "Agendamento não encontrado." });

        agendamento.Status = "Confirmado";
        await _context.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var agendamento = await _context.Agendamentos.FindAsync(new object[] { id }, cancellationToken);
        if (agendamento == null)
            return NotFound(new { message = "Agendamento não encontrado." });

        _context.Agendamentos.Remove(agendamento);
        await _context.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    private static AgendamentoDto MapearParaDto(Agendamento a) => new(
        a.Id,
        a.ProfissionalId,
        a.Profissional.Nome,
        a.ServicoId,
        a.Servico.Nome,
        a.Servico.Valor,
        a.Servico.DuracaoMinutos,
        a.ClienteId,
        a.Cliente.NomeCompleto,
        a.Cliente.Telefone,
        a.DataHora,
        a.DataHora.AddMinutes(a.Servico.DuracaoMinutos),
        a.Status
    );
}