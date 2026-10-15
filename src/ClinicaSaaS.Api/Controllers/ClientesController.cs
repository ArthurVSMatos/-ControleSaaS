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
public class ClientesController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IValidator<CreateClienteDto> _createValidator;

    public ClientesController(AppDbContext context, IValidator<CreateClienteDto> createValidator)
    {
        _context = context;
        _createValidator = createValidator;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ClienteDto>>> GetAll(CancellationToken cancellationToken)
    {
        var clientes = await _context.Clientes
            .Select(c => new ClienteDto(c.Id, c.NomeCompleto, c.Telefone, c.Email))
            .ToListAsync(cancellationToken);

        return Ok(clientes);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ClienteDto>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var cliente = await _context.Clientes.FindAsync(new object[] { id }, cancellationToken);

        if (cliente == null)
            return NotFound(new { message = "Cliente não encontrado." });

        return Ok(new ClienteDto(cliente.Id, cliente.NomeCompleto, cliente.Telefone, cliente.Email));
    }

    [HttpPost]
    public async Task<ActionResult<ClienteDto>> Create([FromBody] CreateClienteDto dto, CancellationToken cancellationToken)
    {
        var validationResult = await _createValidator.ValidateAsync(dto, cancellationToken);
        if (!validationResult.IsValid)
            return BadRequest(validationResult.Errors.Select(e => e.ErrorMessage));

        var cliente = new Cliente
        {
            NomeCompleto = dto.NomeCompleto,
            Telefone = dto.Telefone,
            Email = dto.Email
        };

        _context.Clientes.Add(cliente);
        await _context.SaveChangesAsync(cancellationToken);

        var result = new ClienteDto(cliente.Id, cliente.NomeCompleto, cliente.Telefone, cliente.Email);
        return CreatedAtAction(nameof(GetById), new { id = cliente.Id }, result);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateClienteDto dto, CancellationToken cancellationToken)
    {
        var cliente = await _context.Clientes.FindAsync(new object[] { id }, cancellationToken);

        if (cliente == null)
            return NotFound(new { message = "Cliente não encontrado." });

        cliente.NomeCompleto = dto.NomeCompleto;
        cliente.Telefone = dto.Telefone;
        cliente.Email = dto.Email;

        await _context.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var cliente = await _context.Clientes.FindAsync(new object[] { id }, cancellationToken);

        if (cliente == null)
            return NotFound(new { message = "Cliente não encontrado." });

        _context.Clientes.Remove(cliente);
        await _context.SaveChangesAsync(cancellationToken);

        return NoContent();
    }
}