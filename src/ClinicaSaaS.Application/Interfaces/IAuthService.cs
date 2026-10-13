using ClinicaSaaS.Application.DTOs;

namespace ClinicaSaaS.Application.Interfaces;

public interface IAuthService
{
    Task<TokenResponseDto?> AuthenticateAsync(LoginRequestDto request, CancellationToken cancellationToken = default);
}