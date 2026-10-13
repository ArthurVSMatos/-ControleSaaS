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
public class ServicosController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IValidator<CreateServicoDto> _createValidator;

    public ServicosController(AppDbContext context, IValidator<CreateServicoDto> createValidator)
    {
        _context = context;
        _createValidator = createValidator;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ServicoDto>>> GetAll(CancellationToken cancellationToken)
    {
        var servicos = await _context.Servicos
            .Select(s => new ServicoDto(s.Id, s.Nome, s.DuracaoMinutos, s.Valor))
            .ToListAsync(cancellationToken);

        return Ok(servicos);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ServicoDto>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var servico = await _context.Servicos.FindAsync(new object[] { id }, cancellationToken);

        if (servico == null)
            return NotFound(new { message = "Serviço não encontrado." });

        return Ok(new ServicoDto(servico.Id, servico.Nome, servico.DuracaoMinutos, servico.Valor));
    }

    [HttpPost]
    public async Task<ActionResult<ServicoDto>> Create([FromBody] CreateServicoDto dto, CancellationToken cancellationToken)
    {
        var validationResult = await _createValidator.ValidateAsync(dto, cancellationToken);
        if (!validationResult.IsValid)
            return BadRequest(validationResult.Errors.Select(e => e.ErrorMessage));

        var servico = new Servico
        {
            Nome = dto.Nome,
            DuracaoMinutos = dto.DuracaoMinutos,
            Valor = dto.Valor
        };

        _context.Servicos.Add(servico);
        await _context.SaveChangesAsync(cancellationToken);

        var result = new ServicoDto(servico.Id, servico.Nome, servico.DuracaoMinutos, servico.Valor);
        return CreatedAtAction(nameof(GetById), new { id = servico.Id }, result);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateServicoDto dto, CancellationToken cancellationToken)
    {
        var servico = await _context.Servicos.FindAsync(new object[] { id }, cancellationToken);

        if (servico == null)
            return NotFound(new { message = "Serviço não encontrado." });

        servico.Nome = dto.Nome;
        servico.DuracaoMinutos = dto.DuracaoMinutos;
        servico.Valor = dto.Valor;

        await _context.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var servico = await _context.Servicos.FindAsync(new object[] { id }, cancellationToken);

        if (servico == null)
            return NotFound(new { message = "Serviço não encontrado." });

        _context.Servicos.Remove(servico);
        await _context.SaveChangesAsync(cancellationToken);

        return NoContent();
    }
}