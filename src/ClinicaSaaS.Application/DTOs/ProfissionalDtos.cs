using FluentValidation;

namespace ClinicaSaaS.Application.DTOs;

public record ProfissionalDto(
    Guid Id, 
    string Nome, 
    string Telefone, 
    string? Especialidade, 
    int PorcentagemComissao, 
    bool RecebeComissao, 
    bool IsAtivo
);

public record CreateProfissionalDto(
    string Nome, 
    string Telefone, 
    string? Especialidade, 
    int PorcentagemComissao
);

public record UpdateProfissionalDto(
    string Nome, 
    string Telefone, 
    string? Especialidade, 
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
            .NotEmpty().WithMessage("O telefone de contato é obrigatório.")
            .MaximumLength(20).WithMessage("O telefone deve ter no máximo 20 caracteres.");

        RuleFor(x => x.PorcentagemComissao)
            .InclusiveBetween(0, 100).WithMessage("A porcentagem de comissão deve ser entre 0% e 100%.");
    }
}