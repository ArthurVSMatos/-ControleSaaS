using ClinicaSaaS.Domain.Common;

namespace ClinicaSaaS.Domain.Entities;

public class Clinica : BaseEntity
{
    public string Nome { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;

    // Listas de relacionamento com as outras entidades
    public ICollection<Usuario> Usuarios { get; set; } = new List<Usuario>();
    public ICollection<Profissional> Profissionais { get; set; } = new List<Profissional>();
    public ICollection<Servico> Servicos { get; set; } = new List<Servico>();
    public ICollection<Cliente> Clientes { get; set; } = new List<Cliente>();
    public ICollection<Agendamento> Agendamentos { get; set; } = new List<Agendamento>();
}