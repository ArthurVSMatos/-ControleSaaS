using ClinicaSaaS.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace ClinicaSaaS.Infrastructure.Persistence;

public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext context)
    {
        // Aplica as migrations automaticamente se ainda não tiverem sido aplicadas
        await context.Database.MigrateAsync();

        // Se não houver clínicas, cria a clínica e o usuário admin de teste
        if (!await context.Clinicas.AnyAsync())
        {
            var clinica = new Clinica
            {
                Id = Guid.NewGuid(),
                Nome = "Clínica Beleza & Saúde",
                Email = "contato@belezaesaude.com"
            };

            var usuario = new Usuario
            {
                Id = Guid.NewGuid(),
                ClinicaId = clinica.Id,
                Nome = "Administrador",
                Email = "admin@clinica.com",
                SenhaHash = BCrypt.Net.BCrypt.HashPassword("123456")
            };

            await context.Clinicas.AddAsync(clinica);
            await context.Usuarios.AddAsync(usuario);
            await context.SaveChangesAsync();
        }
    }
}