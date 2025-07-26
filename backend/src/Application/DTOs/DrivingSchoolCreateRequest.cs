namespace Application.DTOs
{
    public class DrivingSchoolCreateRequest
    {
        public string Name { get; set; }
        public string Address { get; set; }
        public string Phone { get; set; }
        public string Email { get; set; }
        public string TaxNumber { get; set; }
        public string? LogoUrl { get; set; }
        public string Password { get; set; }
    }
} 