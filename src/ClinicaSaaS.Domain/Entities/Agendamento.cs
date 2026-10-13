using ClinicaSaaS.Domain.Common;
using ClinicaSaaS.Domain.Interfaces;

namespace ClinicaSaaS.Domain.Entities;

public class Agendamento : BaseEntity, ITenantEntity
{
    public Guid ClinicaId { get; set; }
    public Guid ProfissionalId { get; set; }
    public Guid ServicoId { get; set; }
    public Guid ClienteId { get; set; }
    public DateTimeOffset DataHora { get; set; }
    public string Status { get; set; } = "Pendente"; // Pendente | Confirmado

    public Clinica Clinica { get; set; } = null!;
    public Profissional Profissional { get; set; } = null!;
    public Servico Servico { get; set; } = null!;
    public Cliente Cliente { get; set; } = null!;
}