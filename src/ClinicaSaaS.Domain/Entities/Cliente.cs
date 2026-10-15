using ClinicaSaaS.Domain.Common;
using ClinicaSaaS.Domain.Interfaces;

namespace ClinicaSaaS.Domain.Entities;

public class Cliente : BaseEntity, ITenantEntity
{
    public Guid ClinicaId { get; set; }
    public string NomeCompleto { get; set; } = string.Empty;
    public string Telefone { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;

    public Clinica Clinica { get; set; } = null!;
    public ICollection<Agendamento> Agendamentos { get; set; } = new List<Agendamento>();
}