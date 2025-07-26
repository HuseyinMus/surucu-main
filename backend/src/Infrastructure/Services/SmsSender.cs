using Application.Interfaces;

namespace Infrastructure.Services;

public class SmsSender : ISmsSender
{
    public Task<bool> SendSmsAsync(string phoneNumber, string message)
    {
        // Simulate SMS send (log or always return true)
        Console.WriteLine($"SMS sent to {phoneNumber}: {message}");
        return Task.FromResult(true);
    }
} 