using FluentValidation;

namespace ClinicaSaaS.Application.DTOs;

public record ProfissionalDto(
    Guid Id,
    string Nome,
    string Telefone,
    bool RecebeComissao,
    int PorcentagemComissao,
    bool IsAtivo
);

public record CreateProfissionalDto(
    string Nome,
    string Telefone,
    bool RecebeComissao,
    int PorcentagemComissao
);

public record UpdateProfissionalDto(
    string Nome,
    string Telefone,
    bool RecebeComissao,
    int PorcentagemComissao
);

public class CreateProfissionalValidator : AbstractValidator<CreateProfissionalDto>
{
    public CreateProfissionalValidator()
    {
        RuleFor(x => x.Nome)
            .NotEmpty().WithMessage("O nome do profissional é obrigatório.")
            .MaximumLength(150).WithMessage("O nome deve ter no máximo 150 caracteres.");

        RuleFor(x => x.Telefone)
            .NotEmpty().WithMessage("O telefone é obrigatório.")
            .MaximumLength(20).WithMessage("O telefone deve ter no máximo 20 caracteres.");

        When(x => x.RecebeComissao, () =>
        {
            RuleFor(x => x.PorcentagemComissao)
                .InclusiveBetween(0, 100)
                .WithMessage("A porcentagem de comissão deve ser um número inteiro entre 0 e 100.");
        });
    }
}