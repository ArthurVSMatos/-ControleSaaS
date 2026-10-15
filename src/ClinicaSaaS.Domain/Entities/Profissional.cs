using ClinicaSaaS.Domain.Common;
using ClinicaSaaS.Domain.Interfaces;

namespace ClinicaSaaS.Domain.Entities;

public class Profissional : BaseEntity, ITenantEntity
{
    public Guid ClinicaId { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string Telefone { get; set; } = string.Empty;
    public bool RecebeComissao { get; set; } = false;
    public string Especialidade { get; set; } = string.Empty;
    public int PorcentagemComissao { get; set; } = 0;
    public bool IsAtivo { get; set; } = true;

    public Clinica Clinica { get; set; } = null!;
    public ICollection<Agendamento> Agendamentos { get; set; } = new List<Agendamento>();
}