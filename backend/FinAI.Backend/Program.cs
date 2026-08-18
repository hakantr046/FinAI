using System.Text;
using System.Threading.RateLimiting;
using FinAI.Backend.Data;
using FinAI.Backend.Endpoints;
using FinAI.Backend.Extensions;
using FinAI.Backend.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

System.Text.Encoding.RegisterProvider(System.Text.CodePagesEncodingProvider.Instance);

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();

// PostgreSQL DbContext Kaydı
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Servis Kayıtları
builder.Services.AddSingleton<IPiiMaskingService, PiiMaskingService>();
builder.Services.AddScoped<IAiClientService, AiClientService>();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IBudgetAlertService, BudgetAlertService>();
builder.Services.AddSingleton<IEmailService, EmailService>();

// Rate Limiter Yapılandırması (Gemini AI Endpoint'leri İçin Limitleme)
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddFixedWindowLimiter("gemini-policy", limiterOptions =>
    {
        limiterOptions.PermitLimit = 10;
        limiterOptions.Window = TimeSpan.FromMinutes(1);
        limiterOptions.QueueLimit = 0;
    });
});

// JWT Authentication Yapılandırması
var jwtKey = builder.Configuration["Jwt:Key"]!;
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
    };
});

builder.Services.AddAuthorization(options =>
{
    // Sadece "Admin" rolüne sahip JWT taşıyanlar admin uçlarına erişebilir
    options.AddPolicy("AdminOnly", policy => policy.RequireRole("Admin"));
});

// CORS Politikası
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowNextJs", policy =>
    {
        policy.WithOrigins("http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("AllowNextJs");
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

// API endpoint grupları — her grup kendi dosyasında (tek sorumluluk / SRP)
app.MapAuthEndpoints();
app.MapTransactionEndpoints();
app.MapBudgetEndpoints();
app.MapReceiptEndpoints();
app.MapRecurringEndpoints();
app.MapNotificationEndpoints();
app.MapAnalyticsEndpoints();
app.MapGoalEndpoints();
app.MapInvoiceEndpoints();
app.MapAdvisorEndpoints();
app.MapAdminEndpoints();

// Varsayılan admin kullanıcısını oluştur (idempotent)
app.SeedDatabase();

app.Run();
