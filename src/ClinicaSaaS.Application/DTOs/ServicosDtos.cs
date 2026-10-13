using FluentValidation;

namespace ClinicaSaaS.Application.DTOs;

public record ServicoDto(Guid Id, string Nome, int DuracaoMinutos, decimal Valor);

public record CreateServicoDto(string Nome, int DuracaoMinutos, decimal Valor);

public record UpdateServicoDto(string Nome, int DuracaoMinutos, decimal Valor);

public class CreateServicoValidator : AbstractValidator<CreateServicoDto>
{
    public CreateServicoValidator()
    {
        RuleFor(x => x.Nome)
            .NotEmpty().WithMessage("O nome do serviço é obrigatório.")
            .MaximumLength(150).WithMessage("O nome deve ter no máximo 150 caracteres.");

        RuleFor(x => x.DuracaoMinutos)
            .GreaterThan(0).WithMessage("A duração do serviço deve ser maior que 0 minutos.");

        RuleFor(x => x.Valor)
            .GreaterThanOrEqualTo(0).WithMessage("O valor do serviço não pode ser negativo.");
    }
}