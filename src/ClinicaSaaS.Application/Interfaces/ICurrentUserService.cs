namespace ClinicaSaaS.Application.Interfaces;

public interface ICurrentUserService
{
    Guid ClinicaId { get; }
    Guid UsuarioId { get; }
    bool IsAuthenticated { get; }
}
