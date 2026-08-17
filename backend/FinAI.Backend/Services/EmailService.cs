using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace FinAI.Backend.Services;

public interface IEmailService
{
    Task<bool> SendPasswordResetEmailAsync(string toEmail, string resetLink);
}

public class EmailService : IEmailService
{
    private readonly IConfiguration _config;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IConfiguration config, ILogger<EmailService> logger)
    {
        _config = config;
        _logger = logger;
    }

    public async Task<bool> SendPasswordResetEmailAsync(string toEmail, string resetLink)
    {
        try
        {
            var smtpHost = _config["Email:SmtpHost"] ?? "smtp.gmail.com";
            var smtpPort = int.Parse(_config["Email:SmtpPort"] ?? "587");
            var senderEmail = _config["Email:SenderEmail"] ?? "hakanugur046@gmail.com";
            var senderPassword = (_config["Email:SenderPassword"] ?? "").Replace(" ", "");

            if (string.IsNullOrWhiteSpace(senderPassword))
            {
                _logger.LogWarning($"[E-Posta Simülasyonu] SenderPassword boş olduğu için e-posta gönderilmedi. Link: {resetLink}");
                return true;
            }

            var message = new MimeMessage();
            message.From.Add(new MailboxAddress("FinAI Finans Asistanı", senderEmail));
            message.To.Add(new MailboxAddress(toEmail, toEmail));
            message.Subject = "🔑 FinAI Hesabınız İçin Şifre Sıfırlama Bağlantısı";

            var bodyBuilder = new BodyBuilder
            {
                HtmlBody = $@"
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;'>
                    <div style='text-align: center; margin-bottom: 24px;'>
                        <h2 style='color: #6366f1; margin: 0; font-size: 24px;'>🚀 FinAI Akıllı Bütçem</h2>
                        <p style='color: #64748b; font-size: 14px; margin-top: 4px;'>Güvenli Şifre Sıfırlama Talebi</p>
                    </div>
                    <div style='padding: 20px; background-color: #f8fafc; border-radius: 12px; margin-bottom: 24px; border: 1px solid #f1f5f9;'>
                        <p style='color: #334155; font-size: 15px; margin-top: 0; font-weight: bold;'>Merhaba,</p>
                        <p style='color: #475569; font-size: 14px; line-height: 1.6;'>
                            FinAI hesabınız için bir şifre sıfırlama talebinde bulundunuz. Yeni şifrenizi güvenle belirlemek için aşağıdaki butona tıklayın:
                        </p>
                        <div style='text-align: center; margin: 28px 0;'>
                            <a href='{resetLink}' style='background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 15px; display: inline-block; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);'>
                                🔑 Şifremi Yenile
                            </a>
                        </div>
                        <p style='color: #94a3b8; font-size: 12px; margin-bottom: 0; text-align: center;'>
                            Bu talebi siz yapmadıysanız lütfen bu e-postayı dikkate almayın. Sıfırlama bağlantısı 30 dakika boyunca geçerlidir.
                        </p>
                    </div>
                    <div style='text-align: center; font-size: 12px; color: #94a3b8;'>
                        © 2026 FinAI Yapay Zeka Finans Asistanı • Tüm hakları saklıdır.
                    </div>
                </div>"
            };

            message.Body = bodyBuilder.ToMessageBody();

            using var client = new SmtpClient();
            await client.ConnectAsync(smtpHost, smtpPort, SecureSocketOptions.StartTls);
            await client.AuthenticateAsync(senderEmail, senderPassword);
            await client.SendAsync(message);
            await client.DisconnectAsync(true);

            _logger.LogInformation($"[MAILKIT SMTP SUCCESS] E-posta {toEmail} adresine başarıyla gönderildi!");
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError($"[MAILKIT SMTP ERROR] E-posta gönderme hatası: {ex.Message}");
            return false;
        }
    }
}
