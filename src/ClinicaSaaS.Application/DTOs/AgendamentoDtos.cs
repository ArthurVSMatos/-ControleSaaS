using FluentValidation;

namespace ClinicaSaaS.Application.DTOs;

public record AgendamentoDto(
    Guid Id,
    Guid ProfissionalId,
    string NomeProfissional,
    Guid ServicoId,
    string NomeServico,
    decimal ValorServico,
    int DuracaoMinutos,
    Guid ClienteId,
    string NomeCliente,
    string TelefoneCliente,
    DateTimeOffset DataHoraInicio,
    DateTimeOffset DataHoraFim,
    string Status
);

public record CreateAgendamentoDto(
    Guid ProfissionalId,
    Guid ServicoId,
    Guid ClienteId,
    DateTimeOffset DataHora
);

public record CreateAgendamentoRapidoDto(
    Guid ProfissionalId,
    Guid ServicoId,
    Guid ClienteId,
    TimeSpan Horario
);

public record UpdateAgendamentoDto(
    Guid ProfissionalId,
    Guid ServicoId,
    Guid ClienteId,
    DateTimeOffset DataHora
);

public record CalendarioResumoDto(
    DateTime Data,
    int TotalAgendamentos
);

public class CreateAgendamentoValidator : AbstractValidator<CreateAgendamentoDto>
{
    public CreateAgendamentoValidator()
    {
        RuleFor(x => x.ProfissionalId).NotEmpty().WithMessage("O profissional é obrigatório.");
        RuleFor(x => x.ServicoId).NotEmpty().WithMessage("O serviço é obrigatório.");
        RuleFor(x => x.ClienteId).NotEmpty().WithMessage("O cliente é obrigatório.");
        RuleFor(x => x.DataHora).NotEmpty().WithMessage("A data e o horário são obrigatórios.");
    }
}