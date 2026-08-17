# Build Stage
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ["backend/FinAI.Backend/FinAI.Backend.csproj", "backend/FinAI.Backend/"]
COPY ["src/ai_service/finai_service.proto", "src/ai_service/"]
RUN dotnet restore "backend/FinAI.Backend/FinAI.Backend.csproj"
COPY backend/FinAI.Backend/ backend/FinAI.Backend/
RUN dotnet build "backend/FinAI.Backend/FinAI.Backend.csproj" -c Release -o /app/build
RUN dotnet publish "backend/FinAI.Backend/FinAI.Backend.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Final Stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 5115
ENV ASPNETCORE_URLS=http://+:5115
ENTRYPOINT ["dotnet", "FinAI.Backend.dll"]
