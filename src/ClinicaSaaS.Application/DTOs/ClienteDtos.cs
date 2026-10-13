using FluentValidation;

namespace ClinicaSaaS.Application.DTOs;

public record ClienteDto(Guid Id, string NomeCompleto, string Telefone);

public record CreateClienteDto(string NomeCompleto, string Telefone);

public record UpdateClienteDto(string NomeCompleto, string Telefone);

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
    }
}