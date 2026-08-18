using FinAI.Backend.Data;
using FinAI.Backend.Entities;
using Microsoft.EntityFrameworkCore;

namespace FinAI.Backend.Extensions;

public static class DatabaseSeeder
{
    // Uygulama başlarken varsayılan admin@finai.com kullanıcısını oluşturur ve yönetici yapar
    public static void SeedDatabase(this WebApplication app)
    {
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    try
    {
        db.Database.ExecuteSqlRaw(@"
            ALTER TABLE ""Users"" ADD COLUMN IF NOT EXISTS ""ResetToken"" text;
            ALTER TABLE ""Users"" ADD COLUMN IF NOT EXISTS ""ResetTokenExpiresAt"" timestamp with time zone;
        ");
    }
    catch { }

    var adminUser = db.Users.FirstOrDefault(u => u.Email.ToLower() == "admin@finai.com");
    if (adminUser == null)
    {
        adminUser = new User
        {
            ExternalUserId = "admin@finai.com",
            Email = "admin@finai.com",
            Name = "Sistem Yöneticisi",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123!"),
            IsAdmin = true
        };
        db.Users.Add(adminUser);
        db.SaveChanges();
    }
    else if (!adminUser.IsAdmin)
    {
        adminUser.IsAdmin = true;
        db.SaveChanges();
    }
}
    }
}
