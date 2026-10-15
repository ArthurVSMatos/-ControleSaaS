FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copia os arquivos de projeto e restaura as dependências
COPY ["src/ClinicaSaaS.Api/ClinicaSaaS.Api.csproj", "src/ClinicaSaaS.Api/"]
COPY ["src/ClinicaSaaS.Application/ClinicaSaaS.Application.csproj", "src/ClinicaSaaS.Application/"]
COPY ["src/ClinicaSaaS.Domain/ClinicaSaaS.Domain.csproj", "src/ClinicaSaaS.Domain/"]
COPY ["src/ClinicaSaaS.Infrastructure/ClinicaSaaS.Infrastructure.csproj", "src/ClinicaSaaS.Infrastructure/"]

RUN dotnet restore "src/ClinicaSaaS.Api/ClinicaSaaS.Api.csproj"

# Copia todo o código e compila
COPY . .
WORKDIR "/src/src/ClinicaSaaS.Api"
RUN dotnet build "ClinicaSaaS.Api.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "ClinicaSaaS.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Imagem final de execução
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "ClinicaSaaS.Api.dll"]