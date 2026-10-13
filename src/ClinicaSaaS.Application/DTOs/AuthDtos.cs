namespace ClinicaSaaS.Application.DTOs;

public record LoginRequestDto(string Email, string Senha);

public record TokenResponseDto(
    string AccessToken,
    int ExpiresInSeconds,
    string NomeUsuario,
    string Email,
    Guid ClinicaId
);