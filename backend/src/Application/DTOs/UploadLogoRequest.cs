using Microsoft.AspNetCore.Http;

namespace Application.DTOs;
public class UploadLogoRequest
{
    public IFormFile Logo { get; set; } = null!;
}
