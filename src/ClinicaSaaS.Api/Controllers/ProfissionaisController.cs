using ClinicaSaaS.Application.DTOs;
using ClinicaSaaS.Domain.Entities;
using ClinicaSaaS.Infrastructure.Persistence;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ClinicaSaaS.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ProfissionaisController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IValidator<CreateProfissionalDto> _createValidator;

    public ProfissionaisController(AppDbContext context, IValidator<CreateProfissionalDto> createValidator)
    {
        _context = context;
        _createValidator = createValidator;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ProfissionalDto>>> GetAll([FromQuery] bool apenasAtivos = true, CancellationToken cancellationToken = default)
    {
        var query = _context.Profissionais.AsQueryable();

        if (apenasAtivos)
            query = query.Where(p => p.IsAtivo);

        var profissionais = await query
            .Select(p => new ProfissionalDto(p.Id, p.Nome, p.Telefone, p.RecebeComissao, p.PorcentagemComissao, p.IsAtivo))
            .ToListAsync(cancellationToken);

        return Ok(profissionais);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ProfissionalDto>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var p = await _context.Profissionais.FindAsync(new object[] { id }, cancellationToken);

        if (p == null)
            return NotFound(new { message = "Profissional não encontrado." });

        return Ok(new ProfissionalDto(p.Id, p.Nome, p.Telefone, p.RecebeComissao, p.PorcentagemComissao, p.IsAtivo));
    }

    [HttpPost]
    public async Task<ActionResult<ProfissionalDto>> Create([FromBody] CreateProfissionalDto dto, CancellationToken cancellationToken)
    {
        var validationResult = await _createValidator.ValidateAsync(dto, cancellationToken);
        if (!validationResult.IsValid)
            return BadRequest(validationResult.Errors.Select(e => e.ErrorMessage));

        var profissional = new Profissional
        {
            Nome = dto.Nome,
            Telefone = dto.Telefone,
            RecebeComissao = dto.RecebeComissao,
            PorcentagemComissao = dto.RecebeComissao ? dto.PorcentagemComissao : 0,
            IsAtivo = true
        };

        _context.Profissionais.Add(profissional);
        await _context.SaveChangesAsync(cancellationToken);

        var result = new ProfissionalDto(
            profissional.Id, profissional.Nome, profissional.Telefone,
            profissional.RecebeComissao, profissional.PorcentagemComissao, profissional.IsAtivo
        );

        return CreatedAtAction(nameof(GetById), new { id = profissional.Id }, result);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateProfissionalDto dto, CancellationToken cancellationToken)
    {
        var profissional = await _context.Profissionais.FindAsync(new object[] { id }, cancellationToken);

        if (profissional == null)
            return NotFound(new { message = "Profissional não encontrado." });

        profissional.Nome = dto.Nome;
        profissional.Telefone = dto.Telefone;
        profissional.RecebeComissao = dto.RecebeComissao;
        profissional.PorcentagemComissao = dto.RecebeComissao ? dto.PorcentagemComissao : 0;

        await _context.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var profissional = await _context.Profissionais.FindAsync(new object[] { id }, cancellationToken);

        if (profissional == null)
            return NotFound(new { message = "Profissional não encontrado." });

        // Soft Delete conforme especificado no SRS
        profissional.IsAtivo = false;
        await _context.SaveChangesAsync(cancellationToken);

        return NoContent();
    }
}