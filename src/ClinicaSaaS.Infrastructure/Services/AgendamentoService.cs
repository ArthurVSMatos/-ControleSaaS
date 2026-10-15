using ClinicaSaaS.Application.Interfaces;
using ClinicaSaaS.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ClinicaSaaS.Infrastructure.Services;

public class AgendamentoService : IAgendamentoService
{
    private readonly AppDbContext _context;

    public AgendamentoService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<bool> TemConflitoHorarioAsync(
        Guid profissionalId,
        DateTimeOffset inicioProposto,
        int duracaoMinutos,
        Guid? agendamentoIdIgnorar = null,
        CancellationToken cancellationToken = default)
    {
        var fimProposto = inicioProposto.AddMinutes(duracaoMinutos);

        // Busca os agendamentos do profissional no mesmo dia para verificar sobreposição temporal
        var inicioDia = inicioProposto.Date.ToUniversalTime();
        var fimDia = inicioDia.AddDays(1);

        var agendamentosExistentes = await _context.Agendamentos
            .Include(a => a.Servico)
            .Where(a => a.ProfissionalId == profissionalId)
            .Where(a => agendamentoIdIgnorar == null || a.Id != agendamentoIdIgnorar)
            .Where(a => a.DataHora >= inicioDia.AddHours(-12) && a.DataHora <= fimDia.AddHours(12))
            .ToListAsync(cancellationToken);

        // Aplica a fórmula matemática de sobreposição:
        // NovoInicio < ExistenteFim AND NovoFim > ExistenteInicio
        foreach (var exist in agendamentosExistentes)
        {
            var existenteInicio = exist.DataHora;
            var existenteFim = exist.DataHora.AddMinutes(exist.Servico.DuracaoMinutos);

            if (inicioProposto < existenteFim && fimProposto > existenteInicio)
            {
                return true; // Existe conflito de horário!
            }
        }

        return false;
    }
}