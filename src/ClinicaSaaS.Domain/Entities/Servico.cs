using ClinicaSaaS.Domain.Common;
using ClinicaSaaS.Domain.Interfaces;

namespace ClinicaSaaS.Domain.Entities;

public class Servico : BaseEntity, ITenantEntity
{
    public Guid ClinicaId { get; set; }
    public string Nome { get; set; } = string.Empty;
    public int DuracaoMinutos { get; set; }
    public decimal Valor { get; set; }

    public Clinica Clinica { get; set; } = null!;
    public ICollection<Agendamento> Agendamentos { get; set; } = new List<Agendamento>();
}