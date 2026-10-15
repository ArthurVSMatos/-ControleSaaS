using FluentValidation;

namespace ClinicaSaaS.Application.DTOs;

public record ClienteDto(Guid Id, string NomeCompleto, string Telefone, string? Email);

public record CreateClienteDto(string NomeCompleto, string Telefone, string? Email);

public record UpdateClienteDto(string NomeCompleto, string Telefone, string? Email);

public class CreateClienteValidator : AbstractValidator<CreateClienteDto>
{
    public CreateClienteValidator()
    {
        RuleFor(x => x.NomeCompleto)
            .NotEmpty().WithMessage("O nome completo é obrigatório.")
            .MaximumLength(150).WithMessage("O nome completo deve ter no máximo 150 caracteres.");

        RuleFor(x => x.Telefone)
            .NotEmpty().WithMessage("O telefone de contato é obrigatório.")
            .MaximumLength(20).WithMessage("O telefone deve ter no máximo 20 caracteres.");

        RuleFor(x => x.Email)
            .EmailAddress().WithMessage("Informe um e-mail válido.")
            .MaximumLength(100).WithMessage("O e-mail deve ter no máximo 100 caracteres.")
            .When(x => !string.IsNullOrEmpty(x.Email));
    }
}