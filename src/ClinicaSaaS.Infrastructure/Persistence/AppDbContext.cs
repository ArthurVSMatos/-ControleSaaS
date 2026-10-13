using System.Linq.Expressions;
using ClinicaSaaS.Application.Interfaces;
using ClinicaSaaS.Domain.Entities;
using ClinicaSaaS.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ClinicaSaaS.Infrastructure.Persistence;

public class AppDbContext : DbContext
{
    private readonly ICurrentUserService? _currentUserService;

    // Propriedade pública tratada contra nulo no Design-Time (Migrations)
    public Guid CurrentClinicaId => _currentUserService?.ClinicaId ?? Guid.Empty;

    public AppDbContext(DbContextOptions<AppDbContext> options, ICurrentUserService? currentUserService = null)
        : base(options)
    {
        _currentUserService = currentUserService;
    }

    public DbSet<Clinica> Clinicas => Set<Clinica>();
    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<Profissional> Profissionais => Set<Profissional>();
    public DbSet<Servico> Servicos => Set<Servico>();
    public DbSet<Cliente> Clientes => Set<Cliente>();
    public DbSet<Agendamento> Agendamentos => Set<Agendamento>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // 1. Clinica
        modelBuilder.Entity<Clinica>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Nome).HasMaxLength(150).IsRequired();
            entity.Property(e => e.Email).HasMaxLength(150).IsRequired();
            entity.HasIndex(e => e.Email).IsUnique();
        });

        // 2. Usuario
        modelBuilder.Entity<Usuario>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Nome).HasMaxLength(150).IsRequired();
            entity.Property(e => e.Email).HasMaxLength(150).IsRequired();
            entity.HasIndex(e => e.Email).IsUnique();
            entity.Property(e => e.SenhaHash).HasMaxLength(255).IsRequired();

            entity.HasOne(e => e.Clinica)
                  .WithMany(c => c.Usuarios)
                  .HasForeignKey(e => e.ClinicaId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => e.ClinicaId).HasDatabaseName("idx_usuarios_clinica");
        });

        // 3. Profissional
        modelBuilder.Entity<Profissional>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Nome).HasMaxLength(150).IsRequired();
            entity.Property(e => e.Telefone).HasMaxLength(20).IsRequired();
            entity.Property(e => e.RecebeComissao).HasDefaultValue(false);
            entity.Property(e => e.IsAtivo).HasDefaultValue(true);

            entity.ToTable(t => t.HasCheckConstraint(
                "ck_profissional_porcentagem_comissao", 
                "porcentagem_comissao >= 0 AND porcentagem_comissao <= 100"
            ));

            entity.HasOne(e => e.Clinica)
                  .WithMany(c => c.Profissionais)
                  .HasForeignKey(e => e.ClinicaId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => e.ClinicaId).HasDatabaseName("idx_profissionais_clinica");
        });

        // 4. Servico
        modelBuilder.Entity<Servico>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Nome).HasMaxLength(150).IsRequired();
            entity.Property(e => e.Valor).HasPrecision(10, 2);

            entity.ToTable(t => 
            {
                t.HasCheckConstraint("ck_servico_duracao_minutos", "duracao_minutos > 0");
                t.HasCheckConstraint("ck_servico_valor", "valor >= 0");
            });

            entity.HasOne(e => e.Clinica)
                  .WithMany(c => c.Servicos)
                  .HasForeignKey(e => e.ClinicaId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => e.ClinicaId).HasDatabaseName("idx_servicos_clinica");
        });

        // 5. Cliente
        modelBuilder.Entity<Cliente>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.NomeCompleto).HasMaxLength(150).IsRequired();
            entity.Property(e => e.Telefone).HasMaxLength(20).IsRequired();

            entity.HasOne(e => e.Clinica)
                  .WithMany(c => c.Clientes)
                  .HasForeignKey(e => e.ClinicaId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => e.ClinicaId).HasDatabaseName("idx_clientes_clinica");
        });

        // 6. Agendamento
        modelBuilder.Entity<Agendamento>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Status).HasMaxLength(20).IsRequired();

            entity.HasOne(e => e.Clinica)
                  .WithMany(c => c.Agendamentos)
                  .HasForeignKey(e => e.ClinicaId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Profissional)
                  .WithMany(p => p.Agendamentos)
                  .HasForeignKey(e => e.ProfissionalId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Servico)
                  .WithMany(s => s.Agendamentos)
                  .HasForeignKey(e => e.ServicoId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Cliente)
                  .WithMany(c => c.Agendamentos)
                  .HasForeignKey(e => e.ClienteId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => e.ClinicaId).HasDatabaseName("idx_agendamentos_clinica");

            entity.HasIndex(e => new { e.ClinicaId, e.ProfissionalId, e.DataHora })
                  .HasDatabaseName("idx_agendamentos_busca");
        });

        // 7. Global Query Filter seguro via propriedade pública CurrentClinicaId
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            if (typeof(ITenantEntity).IsAssignableFrom(entityType.ClrType))
            {
                var parameter = Expression.Parameter(entityType.ClrType, "e");
                var entityTenantId = Expression.Property(parameter, nameof(ITenantEntity.ClinicaId));
                
                // Mapeia diretamente para a propriedade pública CurrentClinicaId da classe AppDbContext
                var dbContextTenantId = Expression.Property(
                    Expression.Constant(this),
                    nameof(CurrentClinicaId)
                );

                var comparison = Expression.Equal(entityTenantId, dbContextTenantId);
                var lambda = Expression.Lambda(comparison, parameter);

                modelBuilder.Entity(entityType.ClrType).HasQueryFilter(lambda);
            }
        }
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        foreach (var entry in ChangeTracker.Entries<ITenantEntity>())
        {
            if (entry.State == EntityState.Added && entry.Entity.ClinicaId == Guid.Empty)
            {
                entry.Entity.ClinicaId = CurrentClinicaId;
            }
        }

        return base.SaveChangesAsync(cancellationToken);
    }
}