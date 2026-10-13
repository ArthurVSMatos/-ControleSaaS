using System.Security.Claims;
using ClinicaSaaS.Application.Interfaces;
using Microsoft.AspNetCore.Http;

namespace ClinicaSaaS.Infrastructure.Services;

public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public Guid ClinicaId
    {
        get
        {
            var claim = _httpContextAccessor.HttpContext?.User?.FindFirstValue("ClinicaId");
            return Guid.TryParse(claim, out var id) ? id : Guid.Empty;
        }
    }

    public Guid UsuarioId
    {
        get
        {
            var claim = _httpContextAccessor.HttpContext?.User?.FindFirstValue(ClaimTypes.NameIdentifier);
            return Guid.TryParse(claim, out var id) ? id : Guid.Empty;
        }
    }

    public bool IsAuthenticated => _httpContextAccessor.HttpContext?.User?.Identity?.IsAuthenticated ?? false;
}