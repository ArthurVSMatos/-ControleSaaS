using ClinicaSaaS.Application.DTOs;
using ClinicaSaaS.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ClinicaSaaS.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginRequestDto request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Senha))
        {
            return BadRequest(new { message = "E-mail e senha são obrigatórios." });
        }

        var response = await _authService.AuthenticateAsync(request, cancellationToken);

        if (response == null)
        {
            return Unauthorized(new { message = "Credenciais inválidas." });
        }

        return Ok(response);
    }
}