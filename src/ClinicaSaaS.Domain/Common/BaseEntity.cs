namespace ClinicaSaaS.Domain.Common;

public abstract class BaseEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public DateTimeOffset CriadoEm { get; set; } = DateTimeOffset.UtcNow;
}