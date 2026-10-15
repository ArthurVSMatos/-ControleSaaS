namespace ClinicaSaaS.Application.Interfaces;

public interface IAgendamentoService
{
    Task<bool> TemConflitoHorarioAsync(
        Guid profissionalId,
        DateTimeOffset inicioProposto,
        int duracaoMinutos,
        Guid? agendamentoIdIgnorar = null,
        CancellationToken cancellationToken = default
    );
}