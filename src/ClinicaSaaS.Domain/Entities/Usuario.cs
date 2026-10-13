using ClinicaSaaS.Domain.Common;
using ClinicaSaaS.Domain.Interfaces;

namespace ClinicaSaaS.Domain.Entities;

public class Usuario : BaseEntity, ITenantEntity
{
    public Guid ClinicaId { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string SenhaHash { get; set; } = string.Empty;

    public Clinica Clinica { get; set; } = null!;
}